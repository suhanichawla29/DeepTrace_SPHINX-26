"""Test script for DeepTrace AI-Generated Image Detector.

This script verifies:
1. Model loading and dynamic label mapping inspection from Hugging Face config.
2. Singleton pattern (model loaded only once in memory across multiple calls).
3. Local CPU inference execution.
4. Output formatting showing predicted label and probability scores for each class.
5. Error handling for missing or invalid inputs.

Usage:
    python test_model.py
    python test_model.py <path_to_custom_image>
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys
import time

from PIL import Image

# Ensure the backend directory is in the Python module search path
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.image_detector import (
    DEFAULT_MODEL_ID,
    DeepTraceImageDetectorError,
    ImageDetector,
    ImageInferenceError,
    ModelLoadError,
    get_image_detector,
)


def create_sample_test_image(output_path: Path) -> Path:
    """Generate a clean synthetic sample image for testing inference locally."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    # Create a 224x224 RGB image with gradient colors
    img = Image.new("RGB", (224, 224), color=(73, 109, 137))
    # Draw simple diagonal pattern to give features
    for x in range(224):
        for y in range(224):
            if (x + y) % 32 < 16:
                img.putpixel((x, y), (x % 256, y % 256, (x * y) % 256))
    img.save(output_path)
    return output_path


def run_test(custom_image_path: str | None = None) -> int:
    """Execute the model loading, singleton check, and inference verification."""
    print("=" * 70)
    print("DeepTrace AI Image Detector Verification Test")
    print("=" * 70)
    print(f"Target Model ID: {DEFAULT_MODEL_ID}")

    # Determine image path
    if custom_image_path:
        image_path = Path(custom_image_path)
        if not image_path.exists():
            print(f"\n[ERROR] Provided image file not found: {image_path}")
            return 1
        print(f"Target Image:    {image_path.resolve()} (Custom user-provided)")
    else:
        sample_path = BACKEND_DIR / "sample_test.png"
        if not sample_path.exists():
            print("Generating sample synthetic image for testing...")
            create_sample_test_image(sample_path)
        image_path = sample_path
        print(f"Target Image:    {image_path.resolve()} (Automated sample image)")

    # 1. Test Model Loading & Singleton Behavior
    print("\n[Step 1] Loading model and verifying singleton pattern...")
    start_time = time.time()
    try:
        detector1 = get_image_detector()
        load_duration = time.time() - start_time
        print(f"  -> Model loaded successfully in {load_duration:.2f} seconds.")
    except ModelLoadError as err:
        print(f"\n[FATAL] Model loading failed: {err}")
        return 1

    # Check singleton: second call should be instantaneous and return same instance
    start_second = time.time()
    detector2 = get_image_detector()
    second_duration = time.time() - start_second
    is_same_instance = detector1 is detector2
    print(f"  -> Second get_instance() call took: {second_duration:.6f} seconds.")
    print(f"  -> Singleton confirmed (identical instance): {is_same_instance}")
    if not is_same_instance:
        print("  -> [WARNING] Singleton pattern failed: instances differ.")

    # 2. Inspect Model Configuration & Labels
    print("\n[Step 2] Model Configuration & Class Mapping:")
    print(f"  -> Execution Device:   {detector1.device}")
    print(f"  -> Model Architecture: {type(detector1.model).__name__}")
    print(f"  -> Dynamic id2label:   {detector1.id2label}")
    print(f"  -> Dynamic label2id:   {detector1.label2id}")

    # 3. Run Local CPU Inference
    print("\n[Step 3] Running inference...")
    try:
        start_infer = time.time()
        result = detector1.predict(image_path)
        infer_duration = time.time() - start_infer
        print(f"  -> Inference completed in {infer_duration:.2f} seconds.")
    except ImageInferenceError as err:
        print(f"\n[FATAL] Inference failed: {err}")
        return 1

    # 4. Display Classification Results
    print("\n" + "=" * 70)
    print("INFERENCE RESULTS")
    print("=" * 70)
    print(f"Model ID:        {result['model_id']}")
    print(f"Device:          {result['device']}")
    print(f"Predicted Class: {result['predicted_label']}")
    print(f"Confidence:      {result['confidence']:.4f} ({result['confidence'] * 100:.2f}%)")
    print("\nClass Probabilities:")
    for label, score in result["scores"].items():
        bar_len = int(score * 40)
        bar = "#" * bar_len + "-" * (40 - bar_len)
        print(f"  - {label:<8}: {score:8.4f} ({score * 100:6.2f}%)  [{bar}]")
    print("=" * 70)

    # 5. Verify Error Handling
    print("\n[Step 4] Testing error handling robustness...")
    non_existent = BACKEND_DIR / "non_existent_file_12345.xyz"
    try:
        detector1.predict(non_existent)
        print("  -> [FAIL] Expected ImageInferenceError for missing file, but none raised.")
        return 1
    except ImageInferenceError as err:
        print(f"  -> [PASS] Handled non-existent file properly: {err}")

    invalid_data = b"not_an_image_bytes"
    try:
        detector1.predict(invalid_data)
        print("  -> [FAIL] Expected ImageInferenceError for corrupt bytes, but none raised.")
        return 1
    except ImageInferenceError as err:
        print(f"  -> [PASS] Handled corrupt image data properly: {err}")

    print("\nAll checks passed successfully!")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="DeepTrace AI Image Detection Verification Script"
    )
    parser.add_argument(
        "image_path",
        nargs="?",
        default=None,
        help="Optional path to an image file to run inference on.",
    )
    args = parser.parse_args()

    exit_code = run_test(args.image_path)
    sys.exit(exit_code)
