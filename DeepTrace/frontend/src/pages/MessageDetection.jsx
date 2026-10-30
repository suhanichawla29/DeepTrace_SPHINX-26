import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ArrowLeft, CheckCircle2 } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function MessageDetection() {
  const plannedCapabilities = [
    {
      title: 'Perplexity & Burstiness Evaluation',
      description: 'Measure statistical token unpredictability and sentence length distribution variations distinct in LLM writing.',
    },
    {
      title: 'Stylometric Watermark Scanning',
      description: 'Detect subtle probabilistic n-gram distributions and green-list token biases embedded by generative language models.',
    },
    {
      title: 'Phishing & Impersonation Heuristics',
      description: 'Isolate synthetic urgency, automated conversational lures, and social engineering patterns across communication channels.',
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
            <MessageSquare size={36} strokeWidth={2} />
          </div>

          <span className="cs-category-tag">TEXT & MESSAGING VECTOR</span>
          <h1 className="cs-title">Message & Text Verification</h1>
          
          <p className="cs-subtitle">
            Examine messages to identify suspicious, misleading or potentially AI-generated content.
          </p>

          <p className="cs-body">
            DeepTrace is developing natural language processing classifiers to authenticate conversational messages, email texts, and articles against large language model outputs and coordinated disinformation campaigns.
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
