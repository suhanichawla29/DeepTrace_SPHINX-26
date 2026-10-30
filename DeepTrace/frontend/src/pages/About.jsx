import React from 'react';
import { Link } from 'react-router-dom';
import { ScanEye, ArrowRight } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function About() {
  return (
    <div className="about-page">
      <div className="container container-narrow">
        <div className="page-header-block">
          <div className="page-title-icon-box">
            <ScanEye size={26} strokeWidth={2.2} />
          </div>
          <div className="page-title-texts">
            <h1 className="page-title">About DeepTrace</h1>
            <p className="page-subtitle">
              Building forensic-grade verification infrastructure for an era of generative synthetic media.
            </p>
          </div>
        </div>

        {/* Mission Card */}
        <div className="about-section-card">
          <h2 className="about-card-title">Our Mission</h2>
          <p className="about-card-p">
            As generative AI tools become ubiquitous, discriminating authentic human content from synthetic simulations has become one of the defining challenges in digital media, journalistic truth, and cybersecurity.
          </p>
          <p className="about-card-p">
            <strong>DeepTrace</strong> is designed to serve as an intelligent, transparent content verification suite. Rather than offering opaque binary verdicts, DeepTrace provides calibrated probabilistic assessments based on state-of-the-art neural architectures.
          </p>
        </div>

        {/* 4 Detection Pillars Grid */}
        <div className="about-pillars-card">
          <h2 className="about-card-title">The Four Verification Pillars</h2>
          <div className="pillars-grid">
            <div className="pillar-item pillar-active">
              <div className="pillar-top">
                <span className="pillar-name">01. Image Detection</span>
                <StatusBadge status="available" label="ACTIVE" />
              </div>
              <p className="pillar-desc">
                Vision Transformer (ViT-Base) fine-tuned on the CIFAKE dataset to analyze high-frequency structural artifacts and patch correlations.
              </p>
            </div>

            <div className="pillar-item">
              <div className="pillar-top">
                <span className="pillar-name">02. Audio Detection</span>
                <StatusBadge status="coming-soon" label="ROADMAP" />
              </div>
              <p className="pillar-desc">
                Acoustic spectrogram analyzers and neural vocoder tracking to detect voice cloning and AI text-to-speech generators.
              </p>
            </div>

            <div className="pillar-item">
              <div className="pillar-top">
                <span className="pillar-name">03. Video Detection</span>
                <StatusBadge status="coming-soon" label="ROADMAP" />
              </div>
              <p className="pillar-desc">
                Frame-by-frame temporal consistency evaluators to isolate face swaps, synthetic avatars, and generative video interpolations.
              </p>
            </div>

            <div className="pillar-item">
              <div className="pillar-top">
                <span className="pillar-name">04. Message Detection</span>
                <StatusBadge status="coming-soon" label="ROADMAP" />
              </div>
              <p className="pillar-desc">
                Stylometric perplexity and burstiness models to identify synthetic text, automated phishing, and LLM-generated disinformation.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Architecture */}
        <div className="about-section-card">
          <h2 className="about-card-title">Midterm Architecture Specifications</h2>
          <div className="about-specs-list">
            <div className="spec-row">
              <span className="spec-name">Primary Model ID</span>
              <span className="spec-value code-font">aaronkantrowitz/ai-image-detection</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Base Architecture</span>
              <span className="spec-value">Vision Transformer (ViT-Base-Patch16-224)</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Parameter Count</span>
              <span className="spec-value">~86 Million Parameters</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Backend Runtime</span>
              <span className="spec-value">Python 3.14 + PyTorch CPU + Hugging Face Transformers</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Frontend Runtime</span>
              <span className="spec-value">React 19 + Vite 8 + Lucide Icons</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="about-cta-bar">
          <div>
            <h3>Ready to test the engine?</h3>
            <p>Upload an image to inspect real-time Vision Transformer classification.</p>
          </div>
          <Link to="/image-detection" className="btn btn-primary btn-md">
            <span>Explore Image Detection</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
