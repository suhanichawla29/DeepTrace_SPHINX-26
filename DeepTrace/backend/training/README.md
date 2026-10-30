# DeepTrace AI Image Detection — Fine-Tuning Guide (Google Colab & GPU)

This guide documents the end-to-end fine-tuning pipeline for **DeepTrace**, adapting the pretrained Vision Transformer (ViT-Base) model (`aaronkantrowitz/ai-image-detection`) on modern synthetic image datasets (GenImage, FLUX, newer Stable Diffusion iterations) using GPU acceleration in Google Colab.

---

## 1. Directory Structure & Files

All training and fine-tuning assets are maintained separately in `backend/training/`:

```
backend/
├── training/
│   ├── prepare_dataset.py              # Ingestion, deduplication & leakage-safe partitioner
│   ├── train.py                        # Transfer learning script (ViT-Base, lr=1e-5)
│   ├── evaluate.py                     # Multi-metric benchmark & robustness comparison
│   ├── requirements-training.txt       # Dependencies for GPU training
│   ├── manifest_template.json          # Dataset metadata and generator schema
│   ├── DeepTrace_Image_FineTuning.ipynb # Google Colab-compatible training notebook
│   └── README.md                       # Complete workflow documentation
└── models/
    └── deeptrace-image-v1/             # Designated destination for fine-tuned weights
```

---

## 2. Dataset Pipeline & Target Hierarchy

The dataset pipeline expects images organized into:

```
dataset/
├── train/
│   ├── real/      # Target: ~4,000 authentic images
│   └── fake/      # Target: ~4,000 synthetic images
├── validation/
│   ├── real/      # Target: ~500 authentic images
│   └── fake/      # Target: ~500 synthetic images
└── test/
    ├── real/      # Target: ~1,000 authentic images
    └── fake/      # Target: ~1,000 synthetic images (includes held-out generators)
```

### Key Dataset Rules:
1. **Integrity Validation**: Corrupted, zero-byte, or unreadable images are rejected via PIL decoding checks.
2. **Byte-Level Deduplication**: SHA-256 hashes are computed for every candidate file to prevent exact duplicates.
3. **Data Leakage Prevention**: Images from the same batch, prompt cluster, or camera origin are grouped together into a single split.
4. **Generator-Wise Held-Out Splits**: Supports holding out specific generator families (e.g. FLUX.1) exclusively in the `test/` split to benchmark true zero-shot out-of-distribution detection.

---

## 3. Google Colab Step-by-Step Training Instructions

### Step 1: Open the Notebook in Google Colab
1. Upload `backend/training/DeepTrace_Image_FineTuning.ipynb` to [Google Colab](https://colab.research.google.com).
2. Connect to a GPU runtime: **Runtime** $\rightarrow$ **Change runtime type** $\rightarrow$ select **T4 GPU** or **A100 GPU**.

### Step 2: Install Dependencies
Run the dependency installation cell:
```bash
!pip install -q transformers>=4.40.0 datasets>=2.18.0 accelerate>=0.28.0 scikit-learn>=1.3.0 pillow>=10.0.0 safetensors>=0.4.0
```

### Step 3: Access Dataset in Colab
Mount Google Drive where your zipped `dataset.zip` is stored:
```python
from google.colab import drive
drive.mount('/content/drive')

!unzip -q "/content/drive/MyDrive/DeepTrace/deeptrace_dataset.zip" -d /content/dataset
```

### Step 4: Load Pretrained Base Model
Load the baseline model while strictly preserving its original label semantics (`0: REAL`, `1: FAKE`):
```python
from transformers import AutoImageProcessor, AutoModelForImageClassification

BASE_MODEL_ID = "aaronkantrowitz/ai-image-detection"
processor = AutoImageProcessor.from_pretrained(BASE_MODEL_ID)
model = AutoModelForImageClassification.from_pretrained(
    BASE_MODEL_ID,
    id2label={0: "REAL", 1: "FAKE"},
    label2id={"REAL": 0, "FAKE": 1},
)
```

### Step 5: Start Fine-Tuning on GPU
Configure hyperparameters tailored for ViT transfer learning:
* **Learning Rate**: `1e-5` (prevents catastrophic forgetting of pre-trained visual features)
* **Batch Size**: `16` per device (with gradient accumulation steps = 2, effective batch size = 32)
* **Epochs**: `5`
* **Precision**: `fp16=True` (accelerates forward/backward passes on NVIDIA T4/A100)
* **Best Checkpoint Selection**: Monitored via `f1_macro` on the validation split.

### Step 6: Benchmark & Evaluate
The notebook computes comprehensive evaluation metrics comparing the **fine-tuned model** against the **baseline pretrained model**:
* **Accuracy**
* **Precision & Recall** (Fake class)
* **F1-Score** (Macro and Binary)
* **Confusion Matrix**
* **Perturbation Robustness**: JPEG compression degradation ($Q=50$) and downscaling/upscaling.

> **Evaluation Rule**: Never claim the fine-tuned model is superior unless empirical evaluation scores on the held-out test split demonstrate statistically significant improvement over the baseline.

---

## 4. Transferring the Checkpoint to Local DeepTrace Backend

### In Google Colab:
Package the exported weights and configuration:
```bash
!zip -r /content/deeptrace-image-v1.zip /content/deeptrace-image-v1
```
Download the resulting `.zip` file to your computer.

### On Your Local Machine:
Unpack the contents of `deeptrace-image-v1.zip` directly into:
```
DeepTrace/backend/models/deeptrace-image-v1/
```

Verify that the directory contains:
* `model.safetensors`
* `config.json`
* `preprocessor_config.json`

The existing backend service can then load this checkpoint locally without any network download.

