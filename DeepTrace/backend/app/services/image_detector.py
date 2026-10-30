"""AI-Generated Image Detector Service for DeepTrace.

This module provides model loading and inference capabilities for detecting
AI-generated vs. real images using Hugging Face Transformers and PyTorch on CPU.
It uses a singleton pattern to ensure the pretrained model is loaded only once.
"""

from __future__ import annotations

import io
import logging
import threading
from pathlib import Path
from typing import Any, Dict, Optional, Union

from PIL import Image, UnidentifiedImageError
import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification

logger = logging.getLogger("deeptrace.image_detector")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

# Default model on Hugging Face
DEFAULT_MODEL_ID = "aaronkantrowitz/ai-image-detection"


class DeepTraceImageDetectorError(Exception):
    """Base exception class for DeepTrace Image Detector."""
    pass


class ModelLoadError(DeepTraceImageDetectorError):
    """Raised when the pretrained model or processor fails to load."""
    pass


class ImageInferenceError(DeepTraceImageDetectorError):
    """Raised when image processing or inference fails."""
    pass


class ImageDetector:
    """Singleton service for AI-generated image classification.

    Loads a pretrained Vision Transformer (ViT) model from Hugging Face
    and executes inference locally on CPU. Reads class label mapping
    dynamically from the model configuration.
    """

    _instance: Optional["ImageDetector"] = None
    _lock: threading.Lock = threading.Lock()

    def __init__(
        self,
        model_id: str = DEFAULT_MODEL_ID,
        device: Optional[Union[str, torch.device]] = None,
    ) -> None:
        """Initialize the detector with the specified model and CPU device.

        Note: Use `ImageDetector.get_instance()` instead of direct instantiation
        to maintain a single model in memory.
        """
        self.model_id: str = model_id

        # Enforce CPU execution as required
        if device is None:
            self.device: torch.device = torch.device("cpu")
        else:
            self.device = torch.device(device)

        self.processor: Optional[AutoImageProcessor] = None
        self.model: Optional[AutoModelForImageClassification] = None
        self.id2label: Dict[int, str] = {}
        self.label2id: Dict[str, int] = {}

        self._load_model()

    @classmethod
    def get_instance(
        cls,
        model_id: str = DEFAULT_MODEL_ID,
        device: Optional[Union[str, torch.device]] = None,
    ) -> "ImageDetector":
        """Get or initialize the singleton ImageDetector instance (thread-safe)."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls(model_id=model_id, device=device)
        return cls._instance

    @classmethod
    def reset_instance(cls) -> None:
        """Reset the singleton instance (useful for testing or reloading)."""
        with cls._lock:
            cls._instance = None

    def _load_model(self) -> None:
        """Load the processor, model, and extract label mappings dynamically."""
        logger.info(
            "Loading image detector model '%s' on %s...",
            self.model_id,
            self.device,
        )
        try:
            # 1. Load image processor
            self.processor = AutoImageProcessor.from_pretrained(self.model_id)

            # 2. Load classification model
            self.model = AutoModelForImageClassification.from_pretrained(
                self.model_id
            )

            # 3. Configure device and evaluation mode
            self.model.to(self.device)
            self.model.eval()

            # 4. Extract label mappings directly from model config (do not assume indices)
            config_id2label = getattr(self.model.config, "id2label", None)
            if not config_id2label:
                raise ModelLoadError(
                    f"Model configuration for '{self.model_id}' does not specify 'id2label'."
                )

            # Ensure integer keys for id2label mapping
            self.id2label = {
                int(k): str(v) for k, v in config_id2label.items()
            }

            config_label2id = getattr(self.model.config, "label2id", None)
            if config_label2id:
                self.label2id = {
                    str(k): int(v) for k, v in config_label2id.items()
                }
            else:
                self.label2id = {v: k for k, v in self.id2label.items()}

            logger.info(
                "Model successfully loaded. Classes detected (%d): %s",
                len(self.id2label),
                self.id2label,
            )

        except ModelLoadError:
            raise
        except Exception as exc:
            err_msg = (
                f"Failed to download or load model '{self.model_id}': {exc}"
            )
            logger.error(err_msg, exc_info=True)
            raise ModelLoadError(err_msg) from exc

    def _prepare_image(
        self,
        image_input: Union[str, Path, Image.Image, bytes, io.BytesIO],
    ) -> Image.Image:
        """Validate and convert various image input formats into an RGB PIL Image."""
        try:
            if isinstance(image_input, (str, Path)):
                file_path = Path(image_input)
                if not file_path.exists():
                    raise ImageInferenceError(
                        f"Image file not found: {file_path.resolve()}"
                    )
                image = Image.open(file_path)
            elif isinstance(image_input, bytes):
                image = Image.open(io.BytesIO(image_input))
            elif isinstance(image_input, io.BytesIO):
                image.seek(0)
                image = Image.open(image_input)
            elif isinstance(image_input, Image.Image):
                image = image_input
            else:
                raise ImageInferenceError(
                    f"Unsupported image input type: {type(image_input).__name__}. "
                    "Expected filepath (str/Path), PIL Image, bytes, or BytesIO."
                )

            # Ensure 3-channel RGB image
            if image.mode != "RGB":
                image = image.convert("RGB")

            return image

        except ImageInferenceError:
            raise
        except UnidentifiedImageError as exc:
            raise ImageInferenceError(
                f"Invalid or corrupted image data: {exc}"
            ) from exc
        except Exception as exc:
            raise ImageInferenceError(
                f"Error processing image input: {exc}"
            ) from exc

    def predict(
        self,
        image_input: Union[str, Path, Image.Image, bytes, io.BytesIO],
    ) -> Dict[str, Any]:
        """Run classification inference on an input image.

        Args:
            image_input: File path, PIL Image, or image bytes.

        Returns:
            Dictionary containing:
                - model_id: Name of model used
                - predicted_label: Predicted class label string
                - confidence: Softmax probability for the predicted class
                - scores: Dict mapping all class labels to their respective probabilities
                - device: Execution device (e.g. 'cpu')
        """
        if self.model is None or self.processor is None:
            raise ModelLoadError("Model or processor is not loaded.")

        # 1. Prepare image
        image = self._prepare_image(image_input)

        try:
            # 2. Preprocess image into PyTorch tensors
            inputs = self.processor(images=image, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            # 3. Local CPU inference with torch.no_grad()
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                probabilities = torch.nn.functional.softmax(logits, dim=-1)[0]

            # 4. Map probabilities to labels dynamically using id2label
            scores: Dict[str, float] = {}
            for class_idx in range(len(probabilities)):
                label_name = self.id2label.get(class_idx, f"CLASS_{class_idx}")
                scores[label_name] = float(probabilities[class_idx].item())

            predicted_class_id = int(torch.argmax(probabilities).item())
            predicted_label = self.id2label.get(
                predicted_class_id, f"CLASS_{predicted_class_id}"
            )
            confidence = scores[predicted_label]

            return {
                "model_id": self.model_id,
                "predicted_label": predicted_label,
                "confidence": confidence,
                "scores": scores,
                "device": str(self.device),
            }

        except Exception as exc:
            err_msg = f"Inference execution failed: {exc}"
            logger.error(err_msg, exc_info=True)
            raise ImageInferenceError(err_msg) from exc


def get_image_detector(
    model_id: str = DEFAULT_MODEL_ID,
) -> ImageDetector:
    """Convenience helper to access the singleton ImageDetector instance."""
    return ImageDetector.get_instance(model_id=model_id)

