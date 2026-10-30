import React from 'react';
import { Link } from 'react-router-dom';
import { AudioWaveform, ArrowLeft, CheckCircle2 } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function AudioDetection() {
  const plannedCapabilities = [
    {
      title: 'Synthetic Voiceprint Identification',
      description: 'Isolate vocoder artifacts, neural TTS phase incongruities, and unnatural acoustic phoneme transitions.',
    },
    {
      title: 'Speech Deepfake Detection',
      description: 'Identify cloned speaker timbre across multiple languages, accents, and recording compression levels.',
    },
    {
      title: 'Spectral Frequency Inspection',
      description: 'Analyze spectrogram harmonic frequencies for typical AI synthesis cutoff thresholds above 16kHz.',
    },
  ];

  return (
    <div className="coming-soon-page">
      <div className="container container-narrow">
        {/* Navigation Breadcrumb */}
        <div className="page-nav-header">
          <Link to="/" className="breadcrumb-link">
            <ArrowLeft size={14} />
            <span>Back to Detection Vectors</span>
          </Link>
          <StatusBadge status="coming-soon" label="COMING SOON" />
        </div>

        {/* Hero Card */}
        <div className="coming-soon-card">
          <div className="cs-icon-circle">
            <AudioWaveform size={36} strokeWidth={2} />
          </div>

          <span className="cs-category-tag">AUDIO VECTOR</span>
          <h1 className="cs-title">Audio & Voice Detection</h1>
          
          <p className="cs-subtitle">
            Examine audio recordings to identify potentially synthetic or manipulated voices.
          </p>

          <p className="cs-body">
            DeepTrace is expanding its multi-modal architecture with dedicated acoustic transformer models capable of detecting voice cloning, zero-shot TTS generation, and conversational deepfakes in real-time.
          </p>

          {/* Planned Features List */}
          <div className="cs-capabilities-box">
            <h3 className="cs-cap-heading">Planned Pipeline Architecture</h3>
            <div className="cs-cap-grid">
              {plannedCapabilities.map((cap, i) => (
                <div key={i} className="cs-cap-item">
                  <div className="cs-cap-bullet">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="cs-cap-title">{cap.title}</h4>
                    <p className="cs-cap-desc">{cap.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Return Home Button */}
          <div className="cs-action-row">
            <Link to="/" className="btn btn-primary btn-lg">
              <ArrowLeft size={16} />
              <span>Return to Platform Home</span>
            </Link>

            <Link to="/image-detection" className="btn btn-secondary btn-lg">
              <span>Try Active Image Detection</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
