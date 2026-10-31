# DeepTrace

### Multimodal AI Content Detection & Verification Platform

```{=html}
<p align="center">
```
`<strong>`{=html}SPHINX-26 Â· Hackathon
Project`</strong>`{=html}`<br>`{=html} Detect. Analyse. Verify.
```{=html}
</p>
```
DeepTrace is a multimodal digital-content analysis platform designed to
help users assess whether online content may be AI-generated,
manipulated, or misleading. It brings four analysis workflows together
in one interface: **image detection, video screening, audio deepfake
detection, and message verification**.

> **Important:** DeepTrace provides model-based screening signals and
> evidence context. A prediction or confidence score is not a guarantee
> of authenticity or a substitute for human verification.

------------------------------------------------------------------------

## Contents

-   [Problem We Address](#problem-we-address)
-   [Core Capabilities](#core-capabilities)
-   [Technology Stack](#technology-stack)
-   [How It Works](#how-it-works)
-   [Image Detection](#1-image-detection)
-   [Video Detection](#2-video-detection)
-   [Audio Detection](#3-audio-detection)
-   [Message Verification](#4-message-verification)
-   [Model Training and Evaluation](#model-training-and-evaluation)
-   [Project Architecture](#project-architecture)
-   [Run Locally](#run-locally)
-   [API and Configuration](#api-and-configuration)
-   [Limitations and Responsible Use](#limitations-and-responsible-use)
-   [Team](#team)

------------------------------------------------------------------------

## Problem We Address

AI tools can now generate convincing images, videos, voices, and written
content at scale. Synthetic or misleading content can contribute to
impersonation, scams, reputational harm, misinformation, and reduced
trust in digital media.

Manual verification is often slow and fragmented. DeepTrace aims to make
an initial assessment easier by bringing multiple content-analysis
workflows into one platform and presenting users with a result,
confidence information, and---where applicable---supporting evidence.

## Core Capabilities

  -----------------------------------------------------------------------
  Module            Input             Analysis          Output
  ----------------- ----------------- ----------------- -----------------
  Image Detection   Image             Fine-tuned Vision REAL /
                                      Transformer       AI-generated
                                      classifier        classification
                                                        and confidence
                                                        score

  Video Detection   Video clip        OpenCV frame      Frame-level
                                      sampling + image  predictions and
                                      detector          video-level
                                      inference         assessment

  Audio Detection   Audio recording   PellaV2 speech    REAL / synthetic
                                      deepfake detector audio score

  Message           Text, claim, or   Gemini-assisted   Risk/context
  Verification      URL               claim analysis +  summary and
                                      external evidence evidence-based
                                      retrieval         assessment
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## Technology Stack

  -----------------------------------------------------------------------
  Technology                          Where It Is Used
  ----------------------------------- -----------------------------------
  **Python**                          Backend services, model
                                      integration, preprocessing, and
                                      inference

  **FastAPI**                         Backend API endpoints

  **PyTorch**                         Deep-learning model loading, tensor
                                      operations, training/fine-tuning,
                                      and inference

  **Hugging Face**                    Pretrained model checkpoints,
                                      datasets, model assets, and
                                      Transformers tooling

  **Vision Transformer (ViT-Base)**   Image classification backbone

  **OpenCV**                          Video decoding, frame extraction,
                                      and frame sampling

  **PellaV2**                         Audio deepfake classification model

  **Wav2Vec2 XLS-R-300M**             Audio backbone for contextual
                                      speech-feature extraction

  **Gemini API**                      Message understanding, claim
                                      extraction, and structured analysis

  **Google Fact Check Tools API**     Retrieval of existing published
                                      fact-checks

  **GDELT DOC 2.0**                   Discovery of relevant news coverage
                                      and source context

  **Google Colab**                    Notebook-based model
                                      training/fine-tuning environment
                                      with GPU access when available

  **React**                           Frontend interface and result
                                      presentation

  **JavaScript / CSS**                Frontend interactions, layout, and
                                      styling
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## How It Works

``` text
                       DEEPTRACE
                           |
          +----------------+----------------+
          |                |                |
        IMAGE            VIDEO            AUDIO          MESSAGE
          |                |                |               |
      ViT-Base         OpenCV frames      PellaV2        Gemini API
          |                |                |               |
     Image score      ViT per frame     Wav2Vec2 XLS-R   Claim extraction
          |                |                |               |
          |           Frame aggregation      |       Evidence retrieval
          |                |                |       /             \
          |                |                |  Fact Check API   GDELT
          +----------------+----------------+---------------------+
                                   |
                          Results and context
```

Each module follows its own analysis path. The platform presents the
relevant classification, confidence information, or evidence context for
the selected content type.

------------------------------------------------------------------------

## 1. Image Detection

DeepTrace uses a **Vision Transformer (ViT-Base)** image classifier
adapted for REAL vs AI-generated image classification.

### Model details

-   **Architecture:** Vision Transformer (ViT-Base)
-   **Base model lineage:** `google/vit-base-patch16-224-in21k`
-   **Pretrained detector lineage:**
    `aaronkantrowitz/ai-image-detection` (CIFAKE lineage)
-   **Input size:** `224 Ã— 224 px`
-   **Patch size:** `16 Ã— 16 px`
-   **Encoder depth:** 12 Transformer encoder layers
-   **Task:** Binary REAL / AI-generated classification
-   **Training approach:** Supervised fine-tuning on labelled examples
-   **Training environment:** Google Colab

### Training data

-   **CIFAKE:** Real and AI-generated image examples used for binary
    classification.
-   **GenImage:** The project uses the **GenImage dataset (SD14
    subset)** to fine-tune the pretrained ViT-Base model on real and
    AI-generated images.

### Vision Transformer workflow

1.  The input image is resized and preprocessed to `224 Ã— 224 px`.
2.  The image is divided into `16 Ã— 16 px` patches.
3.  Patch embedding converts patches into token vectors.
4.  Positional information and a classification (`[CLS]`) token are
    added.
5.  Tokens pass through 12 Transformer encoder layers.
6.  The classification head produces REAL / AI-generated scores.

### Important Transformer terms

-   **Patch Embedding:** Converts image patches into vector
    representations.
-   **Layer Normalisation:** Normalises token representations to support
    stable training.
-   **Multi-Head Self-Attention:** Learns relationships between image
    patches using multiple attention heads.
-   **Query (Q), Key (K), Value (V):** Learned projections used to
    calculate attention and combine information.
-   **Residual Connection:** Adds a block's input to its output, helping
    preserve information and support deeper networks.
-   **MLP (Multi-Layer Perceptron):** Feed-forward network that
    transforms token features after attention.
-   **Linear Projection / Classification Head:** Maps the final
    representation to class scores.

### Fine-tuning and transfer learning

DeepTrace starts from pretrained visual weights and adapts the model to
its target classification task:

1.  Load the pretrained ViT model.
2.  Adapt the classification head for REAL / AI-generated labels.
3.  Run a forward pass on labelled training data.
4.  Calculate the loss between predictions and ground-truth labels.
5.  Use **backpropagation** to calculate gradients.
6.  Update model weights using an optimiser to reduce loss.
7.  Validate on held-out data to monitor generalisation.

### Evaluation metrics

-   **Accuracy:** Overall proportion of correct predictions.
-   **Precision:** Of the samples predicted as AI-generated, how many
    were actually AI-generated.
-   **Recall:** Of the actual AI-generated samples, how many were
    detected.
-   **F1-score:** Harmonic balance between precision and recall.

### Attention rollout

DeepTrace includes an attention-rollout visualisation concept for
interpreting attention flow through the ViT:

1.  Extract attention matrices from Transformer encoder layers.
2.  Average attention across heads to obtain a layer-level attention
    matrix.
3.  Add the identity matrix to account for residual connections and
    normalise.
4.  Multiply layer-wise matrices to estimate attention flow across
    layers.
5.  Read the final `[CLS]`-to-patch scores.
6.  Reshape the 196 patch scores into a `14 Ã— 14` grid and upsample it
    to the image size for visualisation.

**Interpretation note:** Attention rollout is an attention visualisation
technique. It is not a pixel-level explanation, proof of manipulation,
or a guarantee that highlighted regions caused the model's prediction.

------------------------------------------------------------------------

## 2. Video Detection

The video module performs **frame-based screening** by applying the
fine-tuned image detector to selected video frames.

### Processing workflow

1.  The user uploads a video.
2.  **OpenCV** reads and decodes the video.
3.  DeepTrace samples approximately **1 frame per second**.
4.  The workflow analyses up to **30 sampled frames**.
5.  Each selected frame is converted to RGB and preprocessed for the ViT
    input.
6.  The fine-tuned image detector performs inference on each frame.
7.  Frame-level outputs are aggregated into a video-level assessment.

### Why frame sampling?

Sampling reduces processing cost while providing a time-spread view of
the clip. However, fast edits or brief events may be missed.

**Scope:** This implementation is frame-based. It does not claim
temporal deepfake detection, lip-sync analysis, or motion-consistency
analysis.

------------------------------------------------------------------------

## 3. Audio Detection

DeepTrace uses **PellaV2**, a speech-focused deepfake detector built on
a **Wav2Vec2 XLS-R-300M** backbone.

### Audio model workflow

1.  Receive the uploaded audio recording.
2.  Preprocess audio as mono, 16 kHz input.
3.  Use the configured 4-second audio segment for inference.
4.  Pass audio through the Wav2Vec2 XLS-R-300M backbone.
5.  Extract contextual speech representations from hidden layers.
6.  Combine information from **25 hidden layers** using learned layer
    weighting.
7.  Apply the classifier to produce a REAL / synthetic audio score.

### Key terms

-   **Wav2Vec2:** A self-supervised speech representation approach that
    learns useful features from audio.
-   **XLS-R-300M:** The 300-million-parameter cross-lingual speech
    representation model variant used as the backbone.
-   **Feature Extraction:** Converts the audio signal into learned
    numerical representations used by the classifier.
-   **Hidden Layers:** Intermediate neural-network representations
    produced as audio passes through the model.
-   **PellaV2:** The audio deepfake classification model that uses the
    speech representations to estimate whether audio is real or
    synthetic.

**Scope:** PellaV2 is speech-focused. Performance can vary with
language, recording conditions, noise, and audio type. Do not assume
that every language or non-speech recording is supported equally.

------------------------------------------------------------------------

## 4. Message Verification

The message module analyses text, claims, or URLs using language
understanding and external evidence sources.

### Workflow

1.  The user submits a message, claim, or URL.
2.  **Gemini API** helps interpret the message and extract claims,
    entities, and context.
3.  **Google Fact Check Tools API** searches for matching published
    fact-checks.
4.  **GDELT DOC 2.0** helps discover relevant news coverage.
5.  Retrieved evidence is compared by source, date, and context.
6.  DeepTrace presents a risk/context summary and an evidence-based
    assessment.

### Technologies used

-   **Gemini API:** Language understanding, claim extraction, entity
    identification, and structured analysis.
-   **Google Fact Check Tools API:** Finds existing fact-check claims
    and publisher assessments where available.
-   **GDELT DOC 2.0:** Discovers relevant news coverage and source
    context across global media.

**Important:** A lack of matching fact-checks or news coverage does not
prove a claim is true or false. The system should communicate
uncertainty when evidence is insufficient.

------------------------------------------------------------------------

## Model Training and Evaluation

The image model's training workflow uses supervised learning:

-   Labelled REAL and AI-generated image examples.
-   Pretrained ViT-Base weights.
-   Fine-tuning on the GenImage SD14 subset.
-   Google Colab as the notebook-based training environment, with GPU
    access when available.
-   Evaluation using accuracy, precision, recall, and F1-score on
    held-out data.

Training metrics should always be reported with their dataset split and
evaluation setup. Do not interpret a confidence score as a calibrated
probability unless calibration has been separately evaluated.

------------------------------------------------------------------------

## Project Architecture

The repository is organised into a frontend and backend application.

``` text
DeepTrace_SPHINX-26/
â””â”€â”€ DeepTrace/
    â”œâ”€â”€ backend/
    â”‚   â”œâ”€â”€ app/
    â”‚   â”‚   â””â”€â”€ main.py
    â”‚   â”œâ”€â”€ models/
    â”‚   â”‚   â””â”€â”€ DeepTrace_Image_Model/
    â”‚   â”œâ”€â”€ .env
    â”‚   â””â”€â”€ venv/
    â””â”€â”€ frontend/
        â”œâ”€â”€ src/
        â”œâ”€â”€ public/
        â”œâ”€â”€ package.json
        â””â”€â”€ ...
```

The exact files and folders may evolve as the project develops. Keep
model weights and secrets out of public commits unless the repository
intentionally distributes them.

------------------------------------------------------------------------

## Run Locally

### Prerequisites

-   Python installed
-   Node.js and npm installed
-   Git
-   The project repository cloned locally
-   Required environment variables configured for the
    message-verification APIs

### 1. Clone the repository

``` bash
git clone https://github.com/suhanichawla29/DeepTrace_SPHINX-26.git
cd DeepTrace_SPHINX-26
```

### 2. Start the backend

Open a terminal:

``` powershell
cd DeepTrace/backend
```

If the project virtual environment is already present:

``` powershell
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001
```

Backend health endpoint:

``` text
http://127.0.0.1:8001/api/health
```

### 3. Start the frontend

Open a second terminal:

``` powershell
cd DeepTrace/frontend
npm install
npm.cmd run dev
```

Open the local frontend URL printed by the Vite development server. In
the current development setup, this is typically:

``` text
http://localhost:5173/
```

> If your local setup uses different ports or scripts, follow the values
> in your current configuration files.

------------------------------------------------------------------------

## API and Configuration

The message-verification module requires API credentials configured in
the backend environment.

Create or update `DeepTrace/backend/.env`:

``` env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3-flash
GOOGLE_FACTCHECK_API_KEY=your_google_factcheck_api_key
```

-   Obtain credentials from the relevant provider dashboards.
-   Keep `.env` private.
-   Add `.env` to `.gitignore`.
-   Never commit API keys, tokens, or other secrets to GitHub.
-   Restart the backend after changing environment variables.

The exact model name and provider quotas depend on the API account and
current provider availability.

------------------------------------------------------------------------

## Limitations and Responsible Use

-   **Screening, not certainty:** Model outputs are indicators and may
    be wrong.
-   **Confidence score:** A model score is not automatically a
    calibrated probability.
-   **Image generalisation:** Performance can vary across image
    generators, editing tools, compression, and image domains.
-   **Video sampling:** One-frame-per-second sampling can miss short
    events and does not analyse temporal consistency.
-   **Audio scope:** The configured PellaV2 workflow is speech-focused
    and uses a 4-second segment; results may vary across languages and
    recording conditions.
-   **Message evidence:** Search results can be incomplete, outdated, or
    unavailable. No matching source is not proof of falsity.
-   **Human review:** High-impact decisions should involve independent
    evidence and human judgement.

DeepTrace is intended to support media-literacy and verification
workflows---not to make definitive claims about a person, creator, or
source based only on an automated score.

------------------------------------------------------------------------

## Team

**Project:** DeepTrace\
**Hackathon:** SPHINX-26

-   **Suhani** --- Team Leader
-   **Yash Prajapati** --- Team Member
-   **Sumit Solanki** --- Team Member
-   **Shyam Agarwal** --- Team Member

------------------------------------------------------------------------

```{=html}
<p align="center">
```
`<strong>`{=html}DEEPTRACE`</strong>`{=html}`<br>`{=html} Building a
more informed way to inspect digital content.
```{=html}
</p>
```
