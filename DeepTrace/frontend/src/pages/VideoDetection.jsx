import React from 'react';
import { Link } from 'react-router-dom';
import { Video, ArrowLeft, CheckCircle2 } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function VideoDetection() {
  const plannedCapabilities = [
    {
      title: 'Temporal Consistency Analysis',
      description: 'Track inter-frame optical flow inconsistencies and flicker artifacts characteristic of face-swap models.',
    },
    {
      title: 'Facial Landmark & Micro-expression Tracking',
      description: 'Analyze natural blinking cadence, gaze alignment, and lip-sync alignment with speech tracks.',
    },
    {
      title: 'Generative Video Model Signatures',
      description: 'Detect diffusion-based text-to-video dynamics (Sora, Runway, Pika) by inspecting space-time spatio-temporal latents.',
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
            <Video size={36} strokeWidth={2} />
          </div>

          <span className="cs-category-tag">VIDEO VECTOR</span>
          <h1 className="cs-title">Video Deepfake Detection</h1>
          
          <p className="cs-subtitle">
            Analyze videos to identify potentially manipulated or AI-generated visual content.
          </p>

          <p className="cs-body">
            DeepTrace is engineering an advanced multi-frame temporal video inspection pipeline capable of isolating deepfake face replacements, generative video frames, and synthetic avatar broadcasting.
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
