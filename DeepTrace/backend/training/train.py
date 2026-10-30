"""DeepTrace Vision Transformer (ViT-Base) Fine-Tuning Pipeline.

Fine-tunes the pretrained 'aaronkantrowitz/ai-image-detection' model on domain-specific
datasets (e.g. GenImage, FLUX, modern diffusion generators) using Hugging Face
Transformers, PyTorch, and CUDA acceleration.

Preserves exact label semantics:
    {0: 'REAL', 1: 'FAKE'}
"""

from __future__ import annotations

import argparse
import logging
import os
from pathlib import Path
from typing import Any, Dict

import numpy as np
import torch
from torchvision import transforms
from PIL import Image
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from transformers import (
    AutoImageProcessor,
    AutoModelForImageClassification,
    Trainer,
    TrainingArguments,
    set_seed,
)
from datasets import load_dataset

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [trainer]: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("trainer")

BASE_MODEL_ID = "aaronkantrowitz/ai-image-detection"
DEFAULT_OUTPUT_DIR = "../models/deeptrace-image-v1"


def compute_metrics(eval_pred) -> Dict[str, float]:
    """Compute precision, recall, F1-score, and accuracy for evaluation."""
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=1)

    acc = accuracy_score(labels, predictions)
    prec = precision_score(labels, predictions, pos_label=1, zero_division=0)
    rec = recall_score(labels, predictions, pos_label=1, zero_division=0)
    f1 = f1_score(labels, predictions, pos_label=1, zero_division=0)
    f1_macro = f1_score(labels, predictions, average="macro", zero_division=0)

    return {
        "accuracy": float(acc),
        "precision_fake": float(prec),
        "recall_fake": float(rec),
        "f1_fake": float(f1),
        "f1_macro": float(f1_macro),
    }


def build_transform_pipeline(processor: AutoImageProcessor):
    """Build train and validation transform pipelines with standard ViT normalization."""
    # Read normalization constants from processor
    image_mean = processor.image_mean if hasattr(processor, "image_mean") else [0.5, 0.5, 0.5]
    image_std = processor.image_std if hasattr(processor, "image_std") else [0.5, 0.5, 0.5]
    target_size = (
        processor.size["height"],
        processor.size["width"],
    ) if isinstance(processor.size, dict) else (224, 224)

    # Training transforms with light data augmentation to avoid overfitting
    train_transforms = transforms.Compose([
        transforms.Resize(target_size),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.ColorJitter(brightness=0.1, contrast=0.1, saturation=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=image_mean, std=image_std),
    ])

    # Deterministic validation transforms
    eval_transforms = transforms.Compose([
        transforms.Resize(target_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=image_mean, std=image_std),
    ])

    def preprocess_train(examples):
        images = [
            train_transforms(image.convert("RGB")) for image in examples["image"]
        ]
        examples["pixel_values"] = images
        return examples

    def preprocess_eval(examples):
        images = [
            eval_transforms(image.convert("RGB")) for image in examples["image"]
        ]
        examples["pixel_values"] = images
        return examples

    return preprocess_train, preprocess_eval


def run_training(
    dataset_dir: str,
    output_dir: str = DEFAULT_OUTPUT_DIR,
    model_id: str = BASE_MODEL_ID,
    learning_rate: float = 1e-5,
    num_train_epochs: int = 5,
    batch_size: int = 16,
    weight_decay: float = 0.01,
    seed: int = 42,
    gradient_accumulation_steps: int = 2,
    fp16: bool = True,
) -> None:
    """Execute ViT transfer learning fine-tuning."""
    set_seed(seed)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info("Initializing fine-tuning pipeline on device: %s", device.upper())
    logger.info("Base model: %s", model_id)
    logger.info("Target output: %s", output_dir)

    dataset_path = Path(dataset_dir)
    if not dataset_path.exists():
        raise FileNotFoundError(
            f"Dataset directory '{dataset_dir}' does not exist. "
            "Please run prepare_dataset.py first or verify the path."
        )

    # 1. Load Image Processor
    logger.info("Loading AutoImageProcessor from '%s'...", model_id)
    processor = AutoImageProcessor.from_pretrained(model_id)

    # 2. Load Model with strictly preserved label semantics
    logger.info("Loading AutoModelForImageClassification from '%s'...", model_id)
    model = AutoModelForImageClassification.from_pretrained(
        model_id,
        id2label={0: "REAL", 1: "FAKE"},
        label2id={"REAL": 0, "FAKE": 1},
        ignore_mismatched_sizes=False,  # Same binary head
    )

    # 3. Load Dataset using Hugging Face datasets ImageFolder loader
    logger.info("Loading dataset splits from '%s'...", dataset_dir)
    raw_dataset = load_dataset(
        "imagefolder",
        data_dir=str(dataset_path),
    )

    logger.info("Dataset loaded successfully: %s", raw_dataset)

    # 4. Apply preprocessing transforms
    preprocess_train, preprocess_eval = build_transform_pipeline(processor)

    train_data = raw_dataset["train"].with_transform(preprocess_train)
    val_data = raw_dataset.get("validation", raw_dataset.get("test"))
    if val_data is not None:
        val_data = val_data.with_transform(preprocess_eval)

    def collate_fn(batch):
        # ImageFolder: fake=0, real=1; intended: REAL=0, FAKE=1
        labels = torch.tensor([1 - x["label"] for x in batch])
        return {
            "pixel_values": torch.stack([x["pixel_values"] for x in batch]),
            "labels": labels,
        }

    # 5. Configure Training Arguments
    use_fp16 = fp16 and torch.cuda.is_available()

    training_args = TrainingArguments(
        output_dir=os.path.join(output_dir, "checkpoints"),
        learning_rate=learning_rate,
        per_device_train_batch_size=batch_size,
        per_device_eval_batch_size=batch_size,
        num_train_epochs=num_train_epochs,
        weight_decay=weight_decay,
        gradient_accumulation_steps=gradient_accumulation_steps,
        eval_strategy="epoch" if val_data else "no",
        save_strategy="epoch" if val_data else "no",
        load_best_model_at_end=True if val_data else False,
        metric_for_best_model="f1_macro" if val_data else None,
        greater_is_better=True,
        logging_dir=os.path.join(output_dir, "logs"),
        logging_steps=25,
        save_total_limit=2,
        fp16=use_fp16,
        remove_unused_columns=False,
        report_to="none",
        seed=seed,
    )

    # 6. Initialize Hugging Face Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_data,
        eval_dataset=val_data,
        compute_metrics=compute_metrics if val_data else None,
        data_collator=collate_fn,
    )

    # 7. Start Fine-Tuning
    logger.info("Starting fine-tuning...")
    train_result = trainer.train()

    # 8. Save Final Model and Processor
    final_save_dir = Path(output_dir)
    final_save_dir.mkdir(parents=True, exist_ok=True)

    logger.info("Saving fine-tuned model to '%s'...", final_save_dir)
    trainer.save_model(str(final_save_dir))
    processor.save_pretrained(str(final_save_dir))

    # Log metrics summary
    metrics = train_result.metrics
    logger.info("Training complete. Metrics summary: %s", metrics)


def main():
    parser = argparse.ArgumentParser(
        description="Fine-tune ViT-Base on DeepTrace AI-detection datasets."
    )
    parser.add_argument(
        "--dataset_dir",
        type=str,
        default="./dataset",
        help="Path to partitioned dataset directory containing train/ and validation/.",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="../models/deeptrace-image-v1",
        help="Target folder to save the fine-tuned model checkpoint.",
    )
    parser.add_argument(
        "--model_id",
        type=str,
        default=BASE_MODEL_ID,
        help="Pretrained Hugging Face model ID to fine-tune from.",
    )
    parser.add_argument(
        "--learning_rate",
        type=float,
        default=1e-5,
        help="Initial learning rate for transfer learning (default 1e-5).",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=5,
        help="Number of training epochs (default 5).",
    )
    parser.add_argument(
        "--batch_size",
        type=int,
        default=16,
        help="Per-device batch size (default 16).",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Deterministic random seed (default 42).",
    )

    args = parser.parse_args()

    run_training(
        dataset_dir=args.dataset_dir,
        output_dir=args.output_dir,
        model_id=args.model_id,
        learning_rate=args.learning_rate,
        num_train_epochs=args.epochs,
        batch_size=args.batch_size,
        seed=args.seed,
    )


if __name__ == "__main__":
    main()

