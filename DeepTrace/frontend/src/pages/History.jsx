import React from 'react';
import { Link } from 'react-router-dom';
import { History as HistoryIcon, ArrowLeft, Database, ShieldAlert, Sparkles } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function History() {
  return (
    <div className="history-page">
      <div className="container container-narrow">
        <div className="page-nav-header">
          <Link to="/" className="breadcrumb-link">
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </Link>
          <StatusBadge status="coming-soon" label="ROADMAP" />
        </div>

        <div className="page-header-block">
          <div className="page-title-icon-box">
            <HistoryIcon size={26} strokeWidth={2.2} />
          </div>
          <div className="page-title-texts">
            <h1 className="page-title">Analysis History</h1>
            <p className="page-subtitle">
              Review prior verification logs, probabilistic scores, and audit trails.
            </p>
          </div>
        </div>

        {/* Clean Empty State */}
        <div className="history-empty-card">
          <div className="empty-icon-circle">
            <Database size={34} strokeWidth={1.8} />
          </div>

          <h2 className="empty-title">Persistent History Coming in v2.0</h2>
          
          <p className="empty-desc">
            To prioritize user privacy during the midterm evaluation, DeepTrace operates in a <strong>zero-retention local mode</strong>. Uploaded images and calculated softmax tensors are processed solely in volatile memory and are not stored in a persistent database.
          </p>

          <div className="empty-specs-box">
            <div className="empty-spec-item">
              <span className="spec-bullet" />
              <span>Future versions will introduce client-side encrypted local history (IndexedDB).</span>
            </div>
            <div className="empty-spec-item">
              <span className="spec-bullet" />
              <span>Optional cryptographic hash audit logs for journalistic provenance verification.</span>
            </div>
            <div className="empty-spec-item">
              <span className="spec-bullet" />
              <span>Zero third-party tracking or server-side media harvesting.</span>
            </div>
          </div>

          <div className="empty-actions">
            <Link to="/image-detection" className="btn btn-primary btn-md">
              <span>Analyze an Image Now</span>
            </Link>
            <Link to="/" className="btn btn-secondary btn-md">
              <span>Return Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
