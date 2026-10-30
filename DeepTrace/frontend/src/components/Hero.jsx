import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, Cpu, Sparkles } from 'lucide-react';

export default function Hero() {
  const scrollToModules = () => {
    const el = document.getElementById('detection-modules');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-grid">
          {/* Left Column: Headlines & CTAs */}
          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="eyebrow-spark">
                <Sparkles size={13} />
              </span>
              <span className="eyebrow-text">AI-POWERED CONTENT VERIFICATION</span>
            </div>

            <h1 className="hero-title">
              See Beyond <br />
              <span className="hero-title-highlight">What's Real.</span>
            </h1>

            <p className="hero-subtitle">
              An intelligent platform to identify AI-generated and manipulated digital content.
            </p>

            <p className="hero-supporting-text">
              DeepTrace provides deep neural inspection to examine digital media and identify potentially synthetic, diffusion-generated, or manipulated content with calibrated probabilistic confidence.
            </p>

            {/* CTAs */}
            <div className="hero-actions">
              <button
                type="button"
                onClick={scrollToModules}
                className="btn btn-primary btn-lg hero-cta-btn"
              >
                <span>Explore Detection Tools</span>
                <ArrowDown size={18} />
              </button>

              <Link
                to="/image-detection"
                className="btn btn-secondary btn-lg hero-secondary-btn"
              >
                <span>Launch Image Detector</span>
                <ArrowUpRight size={18} />
              </Link>
            </div>

            {/* Trust / Spec Metric Indicators */}
            <div className="hero-specs-row">
              <div className="spec-item">
                <span className="spec-dot" />
                <span className="spec-label">Model:</span>
                <span className="spec-value">ViT-Base (86M)</span>
              </div>
              <div className="spec-item-divider" />
              <div className="spec-item">
                <span className="spec-dot" />
                <span className="spec-label">Latency:</span>
                <span className="spec-value">&lt; 200ms CPU</span>
              </div>
              <div className="spec-item-divider" />
              <div className="spec-item">
                <span className="spec-dot" />
                <span className="spec-label">Dataset:</span>
                <span className="spec-value">CIFAKE Calibrated</span>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Visual Inspection Mockup */}
          <div className="hero-visual">
            <div className="hero-card-frame">
              {/* Top Inspection Bar */}
              <div className="hero-card-header">
                <div className="card-window-controls">
                  <span className="window-dot" />
                  <span className="window-dot" />
                  <span className="window-dot" />
                </div>
                <div className="card-status-chip">
                  <Cpu size={12} />
                  <span>ViT-224 Engine Live</span>
                </div>
              </div>

              {/* Central Visual Inspection Artwork */}
              <div className="hero-card-canvas">
                <div className="canvas-grid-overlay" />
                
                {/* Synthetic Sample Scan Graphic */}
                <div className="canvas-media-box">
                  <div className="canvas-scan-beam" />
                  
                  {/* Visual Detection Overlay Highlights */}
                  <div className="detection-bracket top-left" />
                  <div className="detection-bracket top-right" />
                  <div className="detection-bracket bottom-left" />
                  <div className="detection-bracket bottom-right" />

                  {/* Dynamic Patch Grid Representation */}
                  <div className="vit-patch-grid">
                    <span className="vit-patch active" />
                    <span className="vit-patch" />
                    <span className="vit-patch active" />
                    <span className="vit-patch" />
                    <span className="vit-patch" />
                    <span className="vit-patch active" />
                  </div>

                  {/* Centered Target Crosshair */}
                  <div className="scan-crosshair">
                    <div className="crosshair-ring" />
                    <div className="crosshair-dot" />
                  </div>

                  {/* Live Floating Confidence Pill */}
                  <div className="canvas-floating-tag">
                    <div className="tag-pulse" />
                    <div className="tag-text-group">
                      <span className="tag-label">Spectral Artifact Check</span>
                      <span className="tag-status">Classification Ready</span>
                    </div>
                  </div>
                </div>

                {/* Sub-bar showing metrics */}
                <div className="hero-card-footer">
                  <div className="metric-chip">
                    <span className="metric-title">Modules</span>
                    <span className="metric-num">4 Vectors</span>
                  </div>
                  <div className="metric-chip">
                    <span className="metric-title">Active</span>
                    <span className="metric-num active-gold">Image Detection</span>
                  </div>
                  <div className="metric-chip">
                    <span className="metric-title">Privacy</span>
                    <span className="metric-num">Local RAM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtle decorative background glow (Warm Yellow, no purple/blue) */}
            <div className="hero-warm-glow" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
