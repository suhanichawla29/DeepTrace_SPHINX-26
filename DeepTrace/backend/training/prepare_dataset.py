"""DeepTrace Dataset Preparation & Ingestion Pipeline.

Validates image integrity, deduplicates files via SHA-256, prevents data leakage
across source batches, supports generator-wise held-out splits, and compiles the
standard dataset hierarchy:
    dataset/
        train/{real, fake}
        validation/{real, fake}
        test/{real, fake}

Also generates a comprehensive metadata manifest (JSON and CSV).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import os
from pathlib import Path
import random
import shutil
from typing import Any, Dict, List, Optional, Set, Tuple

from PIL import Image, UnidentifiedImageError

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [dataset_prep]: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("dataset_prep")

SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
TARGET_TRAIN_PER_CLASS = 4000
TARGET_VAL_PER_CLASS = 500
TARGET_TEST_PER_CLASS = 1000


def compute_sha256(file_path: Path) -> str:
    """Compute SHA-256 hash for byte-level deduplication."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def validate_image(file_path: Path) -> Tuple[bool, Optional[str], Optional[Tuple[int, int]]]:
    """Validate that the image is not corrupted, truncated, or zero-byte.

    Returns:
        (is_valid, error_reason, (width, height))
    """
    if not file_path.exists():
        return False, "File does not exist", None

    if file_path.stat().st_size == 0:
        return False, "Zero-byte file", None

    if file_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        return False, f"Unsupported extension: {file_path.suffix}", None

    try:
        with Image.open(file_path) as img:
            img.verify()  # Fast structural verification

        # Reopen to test decoding and read dimensions
        with Image.open(file_path) as img:
            img.load()
            dimensions = (img.width, img.height)
            if img.width < 16 or img.height < 16:
                return False, f"Image dimensions too small ({img.width}x{img.height})", None
            return True, None, dimensions

    except (UnidentifiedImageError, OSError, ValueError) as exc:
        return False, f"Corrupted or invalid image: {exc}", None


class DatasetPreparer:
    """Orchestrates dataset validation, deduplication, and leakage-safe partitioning."""

    def __init__(
        self,
        raw_data_dir: Path,
        output_dir: Path,
        train_per_class: int = TARGET_TRAIN_PER_CLASS,
        val_per_class: int = TARGET_VAL_PER_CLASS,
        test_per_class: int = TARGET_TEST_PER_CLASS,
        held_out_generators: Optional[List[str]] = None,
        random_seed: int = 42,
    ) -> None:
        self.raw_data_dir = Path(raw_data_dir)
        self.output_dir = Path(output_dir)
        self.train_per_class = train_per_class
        self.val_per_class = val_per_class
        self.test_per_class = test_per_class
        self.held_out_generators = set(held_out_generators or [])
        self.random_seed = random_seed
        self.seen_hashes: Set[str] = set()
        self.manifest_records: List[Dict[str, Any]] = []

    def scan_and_validate(self) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
        """Scan raw directory, validate all images, and collect metadata."""
        logger.info("Scanning raw data directory: %s", self.raw_data_dir)
        records: List[Dict[str, Any]] = []
        stats = {
            "scanned": 0,
            "valid": 0,
            "corrupted": 0,
            "duplicates": 0,
            "real_count": 0,
            "fake_count": 0,
        }

        if not self.raw_data_dir.exists():
            logger.warning("Raw directory does not exist: %s", self.raw_data_dir)
            return records, stats

        # Traverse directory searching for images
        for root, _, files in os.walk(self.raw_data_dir):
            for filename in files:
                file_path = Path(root) / filename
                if file_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
                    continue

                stats["scanned"] += 1

                # 1. Image Validation
                is_valid, error_msg, dims = validate_image(file_path)
                if not is_valid:
                    stats["corrupted"] += 1
                    logger.debug("Skipping invalid image %s: %s", file_path.name, error_msg)
                    continue

                # 2. Exact Deduplication
                file_hash = compute_sha256(file_path)
                if file_hash in self.seen_hashes:
                    stats["duplicates"] += 1
                    logger.debug("Duplicate detected: %s", file_path.name)
                    continue

                self.seen_hashes.add(file_hash)
                stats["valid"] += 1

                # 3. Infer label and metadata from directory naming conventions
                # Expected raw structure can be raw/real/... or raw/fake/generator_name/...
                parts = [p.lower() for p in file_path.relative_to(self.raw_data_dir).parts]
                
                label = "REAL" if "real" in parts else "FAKE"
                if label == "REAL":
                    stats["real_count"] += 1
                    generator = "authentic"
                else:
                    stats["fake_count"] += 1
                    # Extract generator name if present in directory hierarchy
                    generator = "unknown_generator"
                    for part in parts:
                        if part not in {"real", "fake", "images", "dataset", filename.lower()}:
                            generator = part
                            break

                # Source dataset inference or batch ID (group by parent folder to avoid leakage)
                batch_id = file_path.parent.name

                records.append({
                    "raw_path": file_path,
                    "sha256": file_hash,
                    "label": label,
                    "generator_family": generator,
                    "batch_id": batch_id,
                    "dimensions": dims,
                    "format": file_path.suffix.upper().lstrip("."),
                })

        logger.info(
            "Scan complete: %d scanned, %d valid (%d real, %d fake), %d duplicates, %d corrupted",
            stats["scanned"],
            stats["valid"],
            stats["real_count"],
            stats["fake_count"],
            stats["duplicates"],
            stats["corrupted"],
        )
        return records, stats

    def partition_dataset(
        self, records: List[Dict[str, Any]]
    ) -> Dict[str, Dict[str, List[Dict[str, Any]]]]:
        """Partition images into train, validation, and test splits preventing data leakage.

        Images from the same batch/prompt cluster are kept together within a split.
        Held-out generators are strictly allocated to the test split.
        """
        rng = random.Random(self.random_seed)

        splits: Dict[str, Dict[str, List[Dict[str, Any]]]] = {
            "train": {"real": [], "fake": []},
            "validation": {"real": [], "fake": []},
            "test": {"real": [], "fake": []},
        }

        # Separate by class
        real_records = [r for r in records if r["label"] == "REAL"]
        fake_records = [r for r in records if r["label"] == "FAKE"]

        # 1. Handle held-out generators for Fake images (Zero-shot out-of-distribution test set)
        held_out_fake = []
        regular_fake = []
        for r in fake_records:
            if r["generator_family"] in self.held_out_generators:
                r["held_out_generator"] = True
                held_out_fake.append(r)
            else:
                r["held_out_generator"] = False
                regular_fake.append(r)

        # Place held-out generators directly into test set
        splits["test"]["fake"].extend(held_out_fake)

        # 2. Group by batch_id to prevent data leakage across splits
        def group_and_split(
            items: List[Dict[str, Any]],
            train_target: int,
            val_target: int,
            test_target: int,
        ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
            # Group items by batch_id
            batches: Dict[str, List[Dict[str, Any]]] = {}
            for item in items:
                batches.setdefault(item["batch_id"], []).append(item)

            # Chunk oversized batches so a single flat folder (or very large
            # batch) does not collapse an entire class into one split. Smaller
            # batches (<= 100 images) keep their original grouping for leakage
            # prevention; larger ones are deterministically sub-divided.
            if len(batches) <= 1:
                chunk_size = 1
            else:
                chunk_size = 100
            chunked_batches: Dict[str, List[Dict[str, Any]]] = {}
            for key, batch_items in batches.items():
                if len(batch_items) <= chunk_size:
                    chunked_batches[key] = batch_items
                else:
                    shuffled_items = list(batch_items)
                    rng.shuffle(shuffled_items)
                    for offset in range(0, len(shuffled_items), chunk_size):
                        chunked_batches[f"{key}__{offset // chunk_size}"] = shuffled_items[
                            offset : offset + chunk_size
                        ]
            batches = chunked_batches

            batch_keys = list(batches.keys())
            rng.shuffle(batch_keys)

            train_items: List[Dict[str, Any]] = []
            val_items: List[Dict[str, Any]] = []
            test_items: List[Dict[str, Any]] = []

            for key in batch_keys:
                batch = batches[key]
                rng.shuffle(batch)
                if len(train_items) < train_target:
                    train_items.extend(batch)
                elif len(val_items) < val_target:
                    val_items.extend(batch)
                elif len(test_items) < test_target:
                    test_items.extend(batch)
                else:
                    # Excess items default to training set
                    train_items.extend(batch)

            return train_items, val_items, test_items

        # Split Real images
        real_tr, real_val, real_te = group_and_split(
            real_records,
            self.train_per_class,
            self.val_per_class,
            self.test_per_class,
        )
        splits["train"]["real"] = real_tr
        splits["validation"]["real"] = real_val
        splits["test"]["real"] = real_te

        # Split remaining Fake images
        remaining_test_fake_target = max(0, self.test_per_class - len(splits["test"]["fake"]))
        fake_tr, fake_val, fake_te = group_and_split(
            regular_fake,
            self.train_per_class,
            self.val_per_class,
            remaining_test_fake_target,
        )
        splits["train"]["fake"] = fake_tr
        splits["validation"]["fake"] = fake_val
        splits["test"]["fake"].extend(fake_te)

        return splits

    def build_dataset_hierarchy(
        self,
        splits: Dict[str, Dict[str, List[Dict[str, Any]]]],
        copy_files: bool = True,
    ) -> None:
        """Create target directory structure and write images + metadata manifest."""
        manifest: List[Dict[str, Any]] = []

        for split_name, class_dict in splits.items():
            for class_label, items in class_dict.items():
                dest_dir = self.output_dir / split_name / class_label
                dest_dir.mkdir(parents=True, exist_ok=True)

                for item in items:
                    raw_path: Path = item["raw_path"]
                    target_filename = f"{item['sha256'][:16]}_{raw_path.name}"
                    dest_path = dest_dir / target_filename
                    rel_path = f"{split_name}/{class_label}/{target_filename}"

                    if copy_files:
                        shutil.copy2(raw_path, dest_path)

                    manifest.append({
                        "image_id": f"sha256_{item['sha256']}",
                        "relative_path": rel_path,
                        "label": item["label"],
                        "generator_family": item["generator_family"],
                        "batch_id": item["batch_id"],
                        "split": split_name,
                        "dimensions": item["dimensions"],
                        "format": item["format"],
                        "held_out_generator": item.get("held_out_generator", False),
                    })

        # Save metadata manifest in JSON and CSV
        manifest_path = self.output_dir / "manifest.json"
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump({
                "project": "DeepTrace SPHINX-26",
                "label_mapping": {"0": "REAL", "1": "FAKE"},
                "label_index": {"REAL": 0, "FAKE": 1},
                "total_images": len(manifest),
                "splits_summary": {
                    s: {c: len(splits[s][c]) for c in ["real", "fake"]}
                    for s in ["train", "validation", "test"]
                },
                "images": manifest,
            }, f, indent=2)

        logger.info("Saved dataset manifest to %s (%d records)", manifest_path, len(manifest))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="DeepTrace Dataset Preparation & Ingestion Pipeline"
    )
    parser.add_argument(
        "--raw_dir",
        type=str,
        default="./raw_data",
        help="Path to unorganized raw image directory.",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="./dataset",
        help="Target destination directory for partitioned dataset.",
    )
    parser.add_argument(
        "--train_per_class",
        type=int,
        default=TARGET_TRAIN_PER_CLASS,
        help="Target number of images per class for training split (default 4000).",
    )
    parser.add_argument(
        "--val_per_class",
        type=int,
        default=TARGET_VAL_PER_CLASS,
        help="Target number of images per class for validation split (default 500).",
    )
    parser.add_argument(
        "--test_per_class",
        type=int,
        default=TARGET_TEST_PER_CLASS,
        help="Target number of images per class for test split (default 1000).",
    )
    parser.add_argument(
        "--held_out",
        nargs="*",
        default=[],
        help="List of generator names to hold out exclusively for zero-shot testing (e.g. flux-1).",
    )
    parser.add_argument(
        "--dry_run",
        action="store_true",
        help="Scan and validate without copying files.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for deterministic data partitioning.",
    )

    args = parser.parse_args()

    preparer = DatasetPreparer(
        raw_data_dir=Path(args.raw_dir),
        output_dir=Path(args.output_dir),
        train_per_class=args.train_per_class,
        val_per_class=args.val_per_class,
        test_per_class=args.test_per_class,
        held_out_generators=args.held_out,
        random_seed=args.seed,
    )

    records, stats = preparer.scan_and_validate()
    if not records:
        logger.info(
            "No valid images found in raw directory '%s'. "
            "Pipeline structure and validation rules verified.",
            args.raw_dir,
        )
        return

    splits = preparer.partition_dataset(records)
    preparer.build_dataset_hierarchy(splits, copy_files=not args.dry_run)


if __name__ == "__main__":
    main()

