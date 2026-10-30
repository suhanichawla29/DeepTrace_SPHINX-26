# DeepTrace Fine-Tuned Model Repository (v1)

This directory is the designated local storage path for the fine-tuned Vision Transformer checkpoint:
`backend/models/deeptrace-image-v1/`

## Expected Files After Fine-Tuning in Google Colab:
- `model.safetensors` (PyTorch model weights in SafeTensors format)
- `config.json` (Model architecture configuration with `{0: "REAL", 1: "FAKE"}` label mapping)
- `preprocessor_config.json` (ViTImageProcessor normalization and resizing settings)

## Loading with Hugging Face Transformers:
Once the weights are downloaded from Google Colab and unpacked here, the model can be loaded locally using standard Hugging Face APIs:
```python
from transformers import AutoImageProcessor, AutoModelForImageClassification

model_path = "backend/models/deeptrace-image-v1"
processor = AutoImageProcessor.from_pretrained(model_path)
model = AutoModelForImageClassification.from_pretrained(model_path)
```

## Safety Rule:
This directory preserves the fine-tuned weights independently. It does not overwrite or modify the baseline model `aaronkantrowitz/ai-image-detection`.

