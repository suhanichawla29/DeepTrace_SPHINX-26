import React from 'react';
import { Link } from 'react-router-dom';
import { ScanEye, ShieldCheck, Cpu } from 'lucide-react';

export default function Footer() {
  const currentYear = 2026;

  return (
    <footer className="footer-wrapper">
      <div className="container">
        <div className="footer-top-grid">
          {/* Brand Info */}
          <div className="footer-col footer-col-brand">
            <Link to="/" className="brand-logo footer-logo">
              <div className="brand-icon-box">
                <ScanEye size={18} strokeWidth={2.3} className="brand-icon" />
                <span className="brand-accent-dot" />
              </div>
              <span className="brand-title">DeepTrace</span>
            </Link>
            <p className="footer-tagline">
              Intelligent multi-modal platform to identify AI-generated, synthetic, and manipulated digital content using computer vision and deep learning.
            </p>
            <div className="footer-model-badge">
              <Cpu size={14} />
              <span>Vision Transformer (ViT-Base) Engine</span>
            </div>
          </div>

          {/* Detection Categories */}
          <div className="footer-col">
            <h4 className="footer-heading">Detection Categories</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/image-detection" className="footer-link footer-link-active">
                  <span>Image Detection</span>
                  <span className="footer-badge-active">Active</span>
                </Link>
              </li>
              <li>
                <Link to="/audio-detection" className="footer-link footer-link-muted">
                  <span>Audio Detection</span>
                  <span className="footer-badge-soon">Coming Soon</span>
                </Link>
              </li>
              <li>
                <Link to="/video-detection" className="footer-link footer-link-muted">
                  <span>Video Detection</span>
                  <span className="footer-badge-soon">Coming Soon</span>
                </Link>
              </li>
              <li>
                <Link to="/message-detection" className="footer-link footer-link-muted">
                  <span>Message Detection</span>
                  <span className="footer-badge-soon">Coming Soon</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & Navigation */}
          <div className="footer-col">
            <h4 className="footer-heading">Platform</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/" className="footer-link">Platform Home</Link>
              </li>
              <li>
                <Link to="/about" className="footer-link">About DeepTrace</Link>
              </li>
              <li>
                <Link to="/history" className="footer-link">Analysis History</Link>
              </li>
            </ul>
          </div>

          {/* Technology & Verification */}
          <div className="footer-col">
            <h4 className="footer-heading">Midterm Evaluation</h4>
            <p className="footer-eval-text">
              DeepTrace SPHINX-26 project milestone. Developed with PyTorch, Hugging Face Transformers, and React.
            </p>
            <div className="footer-security-note">
              <ShieldCheck size={16} />
              <span>Zero-Retention Local Processing</span>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom-bar">
          <p className="footer-copyright">
            © {currentYear} DeepTrace SPHINX-26. All rights reserved. Built for digital integrity verification.
          </p>
          <div className="footer-disclaimer">
            <span>AI predictions provide probabilistic classification and should be reviewed alongside source provenance.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
