import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Clock,
  Info,
  ServerOff,
  RefreshCw,
} from 'lucide-react';

/**
 * ResultCard component presenting AI classification findings with zero fabricated data.
 * 
 * @param {Object} props
 * @param {Object|null} props.result - Validated backend result object
 * @param {boolean} props.isLoading - Ongoing inference flag
 * @param {string|null} props.error - Error message if analysis failed
 * @param {boolean} props.backendOffline - Flag indicating API is unreachable
 * @param {string} props.apiUrl - The target backend URL
 * @param {Function} props.onRetryHealth - Check server health callback
 */
export default function ResultCard({
  result,
  isLoading,
  error,
  backendOffline,
  apiUrl,
  onRetryHealth,
}) {
  // 1. Loading State
  if (isLoading) {
    return (
      <div className="result-card-container result-card-loading">
        <div className="loading-spinner-wrapper">
          <div className="loading-scanner-ring" />
          <Cpu size={28} className="loading-center-icon" />
        </div>
        <h3 className="loading-title">Processing Image with Vision Transformer</h3>
        <p className="loading-subtext">
          Transmitting image tensors to backend CPU engine and evaluating 16×16 patch tokens...
        </p>
        <div className="loading-spec-pill">
          <span>Target Service: {apiUrl}</span>
        </div>
      </div>
    );
  }

  // 2. Backend Offline / Connection Pending Notice
  if (backendOffline) {
    return (
      <div className="result-card-container result-backend-pending" role="region" aria-label="Backend Status">
        <div className="pending-badge-row">
          <div className="pending-icon-box">
            <ServerOff size={22} />
          </div>
          <span className="badge badge-coming-soon">
            BACKEND CONNECTION PENDING
          </span>
        </div>

        <h3 className="pending-title">Backend Connection Pending</h3>
        
        <p className="pending-description">
          Your image has been successfully selected, validated, and previewed in memory. Full AI analysis will run once the backend detection API is online and accepting requests.
        </p>

        <div className="pending-details-box">
          <div className="pending-detail-row">
            <span className="detail-label">Configured Endpoint:</span>
            <span className="detail-code">{apiUrl}/api/detect/image</span>
          </div>
          <div className="pending-detail-row">
            <span className="detail-label">Target Architecture:</span>
            <span className="detail-value">Vision Transformer (ViT-Base CIFAKE)</span>
          </div>
          <div className="pending-detail-row">
            <span className="detail-label">Execution Environment:</span>
            <span className="detail-value">Local CPU / Zero-Cloud Storage</span>
          </div>
        </div>

        <div className="pending-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onRetryHealth}
          >
            <RefreshCw size={14} />
            <span>Check Backend Connection</span>
          </button>
        </div>

        <div className="pending-disclaimer">
          <Info size={15} />
          <span>
            DeepTrace strictly enforces authentic inference. No mock results or fabricated predictions are displayed.
          </span>
        </div>
      </div>
    );
  }

  // 3. Error State (Network failure, schema mismatch, or 500 error)
  if (error) {
    return (
      <div className="result-card-container result-card-error" role="alert">
        <div className="error-header-row">
          <AlertTriangle size={24} className="error-lead-icon" />
          <h3 className="error-title">Inference Request Failed</h3>
        </div>
        <p className="error-message-text">{error}</p>
        <div className="error-actions-row">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onRetryHealth}
          >
            <RefreshCw size={14} />
            <span>Retry Server Check</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. No result yet (clean idle state)
  if (!result) {
    return null;
  }

  // 5. Authentic Result Display
  const isReal = result.predicted_label === 'REAL';
  const realScore = result.scores?.REAL !== undefined ? result.scores.REAL : (isReal ? result.confidence : 1 - result.confidence);
  const fakeScore = result.scores?.FAKE !== undefined ? result.scores.FAKE : (!isReal ? result.confidence : 1 - result.confidence);

  const realPercent = (realScore * 100).toFixed(1);
  const fakePercent = (fakeScore * 100).toFixed(1);

  return (
    <div className={`result-card-container result-card-rendered ${isReal ? 'result-is-real' : 'result-is-fake'}`}>
      {/* Classification Header Banner */}
      <div className="result-header-row">
        <div className="result-badge-group">
          <div className={`result-class-badge ${isReal ? 'class-badge-real' : 'class-badge-fake'}`}>
            {isReal ? (
              <ShieldCheck size={20} className="class-badge-icon" />
            ) : (
              <AlertTriangle size={20} className="class-badge-icon" />
            )}
            <span className="class-badge-label">
              PREDICTED: {result.predicted_label}
            </span>
          </div>

          <span className="result-confidence-pill">
            {(result.confidence * 100).toFixed(1)}% Confidence
          </span>
        </div>

        {result.processing_time_ms && (
          <div className="result-timing-pill">
            <Clock size={13} />
            <span>{result.processing_time_ms} ms</span>
          </div>
        )}
      </div>

      {/* Primary Explanation */}
      <div className="result-verdict-summary">
        <p className="verdict-lead">
          {isReal
            ? 'The model classified this image as real based on its learned visual patterns.'
            : 'The model classified this image as AI-generated based on its learned visual patterns.'}
        </p>
      </div>

      {/* Class Probabilities Comparison Meters */}
      <div className="result-probabilities-card">
        <h4 className="probabilities-heading">Model Prediction Scores</h4>

        {/* Real Class Meter */}
        <div className="probability-item">
          <div className="probability-meta">
            <span className="prob-label">Authentic (REAL)</span>
            <span className="prob-value">{realPercent}%</span>
          </div>
          <div className="prob-track">
            <div
              className="prob-fill prob-fill-real"
              style={{ width: `${realPercent}%` }}
              role="progressbar"
              aria-valuenow={realPercent}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        </div>

        {/* Fake Class Meter */}
        <div className="probability-item">
          <div className="probability-meta">
            <span className="prob-label">AI-Generated (FAKE)</span>
            <span className="prob-value">{fakePercent}%</span>
          </div>
          <div className="prob-track">
            <div
              className="prob-fill prob-fill-fake"
              style={{ width: `${fakePercent}%` }}
              role="progressbar"
              aria-valuenow={fakePercent}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        </div>
      </div>

      {/* Model & Architecture Details */}
      <div className="result-specs-grid">
        <div className="spec-item-box">
          <span className="spec-item-label">Model Identifier</span>
          <span className="spec-item-value code-font">{result.model_id}</span>
        </div>
        <div className="spec-item-box">
          <span className="spec-item-label">Architecture</span>
          <span className="spec-item-value">Vision Transformer (ViT-Base)</span>
        </div>
        <div className="spec-item-box">
          <span className="spec-item-label">Device</span>
          <span className="spec-item-value">{result.device?.toUpperCase() || 'CPU'}</span>
        </div>
      </div>

      {/* Regulatory / Scientific Disclaimer */}
      <div className="result-disclaimer-box">
        <Info size={15} className="disclaimer-icon" />
        <p className="disclaimer-text">
          <strong>Notice:</strong> These scores are model predictions, not definitive proof of authenticity. The displayed confidence is a softmax score and may not represent a calibrated probability.
        </p>
      </div>
    </div>
  );
}
