"""DeepTrace FastAPI Application.

Provides REST API endpoints for AI-generated image detection and system health.
Integrates with the ImageDetector service using local CPU inference.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from app.services.image_detector import (
    DEFAULT_MODEL_ID,
    ImageDetector,
    ImageInferenceError,
    ModelLoadError,
    get_image_detector,
)

logger = logging.getLogger("deeptrace.api")

# Initialize FastAPI application
app = FastAPI(
    title="DeepTrace API",
    description="Intelligent digital content verification platform powered by Vision Transformers.",
    version="1.0.0",
)

# 2. Configure CORS
# Allow frontend origins for local development
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Validation constants
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
ALLOWED_MIME_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB


@app.get("/", tags=["General"])
async def root() -> Dict[str, str]:
    """Root endpoint providing service information."""
    return {
        "service": "DeepTrace API",
        "status": "operational",
        "docs": "/docs",
    }


# 3. Health Endpoint
@app.get("/api/health", tags=["Health"])
async def health_check() -> Dict[str, str]:
    """Health check endpoint.

    Returns the service status and designated model identifier without
    instantiating or loading redundant model copies.
    """
    return {
        "status": "ok",
        "model": DEFAULT_MODEL_ID,
    }


# 4. Image Detection Endpoint
@app.post(
    "/api/detect/image",
    tags=["Detection"],
    summary="Detect AI-generated or authentic image",
)
async def detect_image(
    file: UploadFile = File(..., description="Image file to analyze (PNG, JPG, JPEG, WEBP)"),
) -> Dict[str, Any]:
    """Run AI classification on an uploaded image file.

    - Validates file format (PNG, JPG, JPEG, WEBP).
    - Enforces maximum file size limit of 15 MB.
    - Runs local CPU inference via the singleton ImageDetector.
    - Returns prediction label, confidence, and class-level scores.
    """
    filename = file.filename or "unknown"
    file_ext = Path(filename).suffix.lower()

    # Validate file extension and MIME type
    is_valid_ext = file_ext in ALLOWED_EXTENSIONS
    is_valid_mime = file.content_type in ALLOWED_MIME_TYPES if file.content_type else False

    if not (is_valid_ext or is_valid_mime):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid file format '{file_ext or file.content_type}'. "
                "Supported formats are PNG, JPG, JPEG, and WEBP."
            ),
        )

    try:
        # Read image contents into memory
        contents = await file.read()

        if len(contents) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty image file provided.",
            )

        if len(contents) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=(
                    f"File size exceeds maximum allowed limit of 15 MB "
                    f"({len(contents) / (1024 * 1024):.2f} MB received)."
                ),
            )

        # Retrieve singleton detector and run prediction
        detector = get_image_detector()
        prediction = detector.predict(contents)

        return prediction

    except ImageInferenceError as exc:
        logger.warning("Image inference error for file '%s': %s", filename, exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except ModelLoadError as exc:
        logger.error("Model loading error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Detection model is currently unavailable: {exc}",
        ) from exc

    except HTTPException:
        raise

    except Exception as exc:
        logger.error("Unexpected error during image detection: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal inference failure: {exc}",
        ) from exc

    finally:
        # Always close the uploaded file after processing
        await file.close()

