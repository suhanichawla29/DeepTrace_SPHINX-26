"""DeepTrace Comprehensive Evaluation & Benchmark Suite.

Evaluates and compares:
1. Baseline Pretrained Model: 'aaronkantrowitz/ai-image-detection'
2. Fine-Tuned DeepTrace Model: e.g. 'models/deeptrace-image-v1'

Metrics computed:
- Accuracy, Precision, Recall, F1-Score (macro & binary)
- Confusion Matrix
- ROC-AUC score
- Generator-wise zero-shot breakdown
- Robustness perturbations: JPEG compression, resizing, center cropping
"""

from __future__ import annotations

import argparse
import io
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from PIL import Image
import torch
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from transformers import AutoImageProcessor, AutoModelForImageClassification
from tqdm import tqdm

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [evaluator]: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("evaluator")

BASELINE_MODEL_ID = "aaronkantrowitz/ai-image-detection"


def apply_perturbation(image: Image.Image, perturbation_type: str, severity: float = 1.0) -> Image.Image:
    """Apply common real-world image perturbations for robustness benchmarking."""
    img_copy = image.copy()
    if perturbation_type == "jpeg":
        # JPEG compression degradation (quality 50 or 75)
        quality = int(max(10, 100 - severity * 50))
        buffer = io.BytesIO()
        img_copy.save(buffer, format="JPEG", quality=quality)
        buffer.seek(0)
        return Image.open(buffer).convert("RGB")

    elif perturbation_type == "resize":
        # Downscale then upscale
        w, h = img_copy.size
        scale = max(0.25, 1.0 - severity * 0.5)
        small = img_copy.resize((int(w * scale), int(h * scale)), Image.Resampling.BILINEAR)
        return small.resize((w, h), Image.Resampling.BILINEAR)

    elif perturbation_type == "crop":
        # Center crop (e.g. 85%) and resize back
        w, h = img_copy.size
        factor = max(0.5, 1.0 - severity * 0.2)
        nw, nh = int(w * factor), int(h * factor)
        left = (w - nw) // 2
        top = (h - nh) // 2
        cropped = img_copy.crop((left, top, left + nw, top + nh))
        return cropped.resize((w, h), Image.Resampling.BILINEAR)

    return img_copy


class ModelEvaluator:
    """Encapsulates model loading and multi-metric batch evaluation."""

    def __init__(self, model_identifier: str, device: Optional[str] = None) -> None:
        self.model_identifier = model_identifier
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))
        logger.info("Loading model '%s' on %s...", model_identifier, self.device)

        self.processor = AutoImageProcessor.from_pretrained(model_identifier)
        self.model = AutoModelForImageClassification.from_pretrained(model_identifier)
        self.model.to(self.device)
        self.model.eval()

        self.id2label = {int(k): str(v) for k, v in self.model.config.id2label.items()}
        # Identify the FAKE class index (typically 1)
        self.fake_class_idx = 1
        for idx, lbl in self.id2label.items():
            if lbl.upper() == "FAKE":
                self.fake_class_idx = idx

    def predict_image(self, image: Image.Image) -> Tuple[int, float]:
        """Predict class index and probability of FAKE for a single PIL image."""
        inputs = self.processor(images=image.convert("RGB"), return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits
            probs = torch.nn.functional.softmax(logits, dim=-1)[0]

        pred_class = int(torch.argmax(probs).item())
        fake_prob = float(probs[self.fake_class_idx].item())
        return pred_class, fake_prob


def collect_test_samples(
    test_dir: Path, manifest_path: Optional[Path] = None
) -> List[Dict[str, Any]]:
    """Gather test images and generator metadata."""
    samples = []

    # If manifest is present, read rich metadata
    manifest_lookup = {}
    if manifest_path and manifest_path.exists():
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                manifest_data = json.load(f)
                for item in manifest_data.get("images", []):
                    manifest_lookup[Path(item["relative_path"]).name] = item
        except Exception as e:
            logger.warning("Could not read manifest at %s: %s", manifest_path, e)

    # Standard directory structure: test/real and test/fake
    for class_name, label_int in [("real", 0), ("fake", 1)]:
        folder = test_dir / class_name
        if not folder.exists():
            continue

        for ext in [".png", ".jpg", ".jpeg", ".webp"]:
            for file_path in folder.glob(f"*{ext}"):
                meta = manifest_lookup.get(file_path.name, {})
                generator = meta.get("generator_family", "authentic" if label_int == 0 else "synthetic")
                samples.append({
                    "path": file_path,
                    "label": label_int,
                    "generator": generator,
                    "held_out": meta.get("held_out_generator", False),
                })

    logger.info("Collected %d test samples from %s", len(samples), test_dir)
    return samples


def evaluate_model_on_samples(
    evaluator: ModelEvaluator,
    samples: List[Dict[str, Any]],
    perturbation: Optional[str] = None,
    severity: float = 1.0,
) -> Dict[str, Any]:
    """Run inference over samples and compute full metrics suite."""
    y_true: List[int] = []
    y_pred: List[int] = []
    y_score: List[float] = []

    # Per generator tracking
    per_gen_true: Dict[str, List[int]] = {}
    per_gen_pred: Dict[str, List[int]] = {}

    for sample in tqdm(samples, desc=f"Evaluating {evaluator.model_identifier}"):
        try:
            with Image.open(sample["path"]) as img:
                if perturbation:
                    img = apply_perturbation(img, perturbation, severity)

                pred_class, fake_prob = evaluator.predict_image(img)

                y_true.append(sample["label"])
                y_pred.append(pred_class)
                y_score.append(fake_prob)

                gen = sample["generator"]
                per_gen_true.setdefault(gen, []).append(sample["label"])
                per_gen_pred.setdefault(gen, []).append(pred_class)

        except Exception as exc:
            logger.warning("Error processing %s: %s", sample["path"], exc)

    if not y_true:
        return {"error": "No valid samples evaluated"}

    # Compute overall metrics
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, pos_label=1, zero_division=0)
    rec = recall_score(y_true, y_pred, pos_label=1, zero_division=0)
    f1 = f1_score(y_true, y_pred, pos_label=1, zero_division=0)
    f1_m = f1_score(y_true, y_pred, average="macro", zero_division=0)
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1]).tolist()

    try:
        roc_auc = roc_auc_score(y_true, y_score)
    except Exception:
        roc_auc = None

    # Compute per-generator accuracy
    gen_accuracy = {}
    for gen, g_true in per_gen_true.items():
        g_pred = per_gen_pred[gen]
        gen_accuracy[gen] = float(accuracy_score(g_true, g_pred))

    return {
        "model": evaluator.model_identifier,
        "sample_count": len(y_true),
        "accuracy": float(acc),
        "precision_fake": float(prec),
        "recall_fake": float(rec),
        "f1_fake": float(f1),
        "f1_macro": float(f1_m),
        "roc_auc": float(roc_auc) if roc_auc is not None else None,
        "confusion_matrix": {
            "tn_real": cm[0][0],
            "fp_real_as_fake": cm[0][1],
            "fn_fake_as_real": cm[1][0],
            "tp_fake": cm[1][1],
        },
        "generator_breakdown": gen_accuracy,
    }


def compare_models(
    baseline_id: str,
    finetuned_id: str,
    test_dir: Path,
    manifest_path: Optional[Path] = None,
    output_report_path: Optional[Path] = None,
) -> None:
    """Benchmark baseline vs fine-tuned model across standard and perturbed conditions."""
    samples = collect_test_samples(test_dir, manifest_path)
    if not samples:
        logger.error("No test samples found in %s.", test_dir)
        return

    evaluator_base = ModelEvaluator(baseline_id)
    evaluator_tuned = ModelEvaluator(finetuned_id)

    # 1. Standard In-Distribution / Test Evaluation
    logger.info("=== Standard Test Set Evaluation ===")
    res_base = evaluate_model_on_samples(evaluator_base, samples)
    res_tuned = evaluate_model_on_samples(evaluator_tuned, samples)

    # 2. Perturbation Robustness: JPEG Compression
    logger.info("=== Robustness: JPEG Compression (Quality 50) ===")
    res_base_jpeg = evaluate_model_on_samples(evaluator_base, samples, perturbation="jpeg", severity=1.0)
    res_tuned_jpeg = evaluate_model_on_samples(evaluator_tuned, samples, perturbation="jpeg", severity=1.0)

    # 3. Perturbation Robustness: Resizing
    logger.info("=== Robustness: Downscale/Upscale ===")
    res_base_resize = evaluate_model_on_samples(evaluator_base, samples, perturbation="resize", severity=1.0)
    res_tuned_resize = evaluate_model_on_samples(evaluator_tuned, samples, perturbation="resize", severity=1.0)

    # Print Comparative Report Table
    print("\n" + "=" * 80)
    print("DEEPTRACE MODEL BENCHMARK & COMPARISON REPORT")
    print("=" * 80)
    print(f"{'Condition':<22} | {'Baseline Pretrained':<24} | {'DeepTrace Fine-Tuned':<24}")
    print("-" * 80)

    metrics_to_show = [
        ("Accuracy (Clean)", res_base["accuracy"], res_tuned["accuracy"]),
        ("F1 Fake (Clean)", res_base["f1_fake"], res_tuned["f1_fake"]),
        ("Precision Fake", res_base["precision_fake"], res_tuned["precision_fake"]),
        ("Recall Fake", res_base["recall_fake"], res_tuned["recall_fake"]),
        ("ROC-AUC", res_base["roc_auc"], res_tuned["roc_auc"]),
        ("Acc (JPEG Q=50)", res_base_jpeg["accuracy"], res_tuned_jpeg["accuracy"]),
        ("Acc (Down/Upscale)", res_base_resize["accuracy"], res_tuned_resize["accuracy"]),
    ]

    for label, val_b, val_t in metrics_to_show:
        sb = f"{val_b:.4f}" if val_b is not None else "N/A"
        st = f"{val_t:.4f}" if val_t is not None else "N/A"
        print(f"{label:<22} | {sb:<24} | {st:<24}")

    print("=" * 80)

    # Save to JSON
    if output_report_path:
        report = {
            "baseline": {
                "standard": res_base,
                "jpeg_robustness": res_base_jpeg,
                "resize_robustness": res_base_resize,
            },
            "finetuned": {
                "standard": res_tuned,
                "jpeg_robustness": res_tuned_jpeg,
                "resize_robustness": res_tuned_resize,
            },
        }
        with open(output_report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        logger.info("Saved comparison benchmark report to %s", output_report_path)


def main():
    parser = argparse.ArgumentParser(description="DeepTrace Model Evaluation & Benchmark")
    parser.add_argument(
        "--test_dir",
        type=str,
        default="./dataset/test",
        help="Path to test dataset folder (containing real/ and fake/).",
    )
    parser.add_argument(
        "--manifest",
        type=str,
        default="./dataset/manifest.json",
        help="Optional path to dataset metadata manifest.",
    )
    parser.add_argument(
        "--baseline",
        type=str,
        default=BASELINE_MODEL_ID,
        help="Hugging Face ID for baseline model.",
    )
    parser.add_argument(
        "--finetuned",
        type=str,
        default="../models/deeptrace-image-v1",
        help="Path to fine-tuned model checkpoint.",
    )
    parser.add_argument(
        "--report_out",
        type=str,
        default="./benchmark_report.json",
        help="Path to save evaluation results JSON.",
    )

    args = parser.parse_args()

    compare_models(
        baseline_id=args.baseline,
        finetuned_id=args.finetuned,
        test_dir=Path(args.test_dir),
        manifest_path=Path(args.manifest) if Path(args.manifest).exists() else None,
        output_report_path=Path(args.report_out),
    )


if __name__ == "__main__":
    main()

