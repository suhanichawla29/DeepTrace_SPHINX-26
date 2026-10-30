import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  ArrowLeft,
  ScanEye,
  Sparkles,
  Server,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import UploadZone from '../components/UploadZone';
import ImagePreview from '../components/ImagePreview';
import ResultCard from '../components/ResultCard';
import { analyzeImage, checkBackendHealth, API_BASE_URL } from '../services/imageApi';

export default function ImageDetection() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [backendOffline, setBackendOffline] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const abortControllerRef = useRef(null);

  const checkHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    const health = await checkBackendHealth();
    setHealthStatus(health);
    setIsCheckingHealth(false);
  }, []);

  // Check backend health on initial page load
  useEffect(() => {
    checkHealth();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [checkHealth]);

  const handleFileSelect = (file) => {
    // Clear previous results and errors when a new image is selected
    setSelectedFile(file);
    setResult(null);
    setError(null);
    setBackendOffline(false);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setBackendOffline(false);
  };

  const handleAnalyze = async () => {
    if (!selectedFile || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setBackendOffline(false);

    abortControllerRef.current = new AbortController();

    try {
      const data = await analyzeImage(selectedFile, abortControllerRef.current.signal);
      setResult(data);
      setBackendOffline(false);
    } catch (err) {
      if (err.name === 'ApiError' && (err.code === 'NETWORK_ERROR' || err.status === 404)) {
        // Backend service is not running or endpoint not yet configured
        setBackendOffline(true);
        setError(null);
      } else {
        setError(err.message || 'An error occurred during image analysis.');
        setBackendOffline(false);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="image-detection-page">
      <div className="container container-narrow">
        {/* Breadcrumb & Navigation Bar */}
        <div className="page-nav-header">
          <div className="breadcrumb-row">
            <Link to="/" className="breadcrumb-link">
              <ArrowLeft size={14} />
              <span>Home</span>
            </Link>
            <ChevronRight size={14} className="breadcrumb-separator" />
            <span className="breadcrumb-current">Image Detection</span>
          </div>

          <StatusBadge status="available" label="AVAILABLE" />
        </div>

        {/* Page Title & Subtitle */}
        <div className="page-header-block">
          <div className="page-title-icon-box">
            <ScanEye size={26} strokeWidth={2.2} />
          </div>
          <div className="page-title-texts">
            <h1 className="page-title">AI Image Detection</h1>
            <p className="page-subtitle">
              Discover whether an image may be AI-generated or authentic using intelligent image analysis.
            </p>
          </div>
        </div>

        {/* Engine Specification Banner */}
        <div className="engine-spec-banner">
          <div className="spec-banner-left">
            <span className="spec-indicator-dot" />
            <span className="spec-tag-name">Vision Transformer:</span>
            <span className="spec-model-name">aaronkantrowitz/ai-image-detection</span>
          </div>
          <div className="spec-banner-right">
            <span className="spec-pill">Resolution: 224×224</span>
            <span className="spec-pill">Execution: Local CPU</span>
          </div>
        </div>

        {/* Main Work Area Card */}
        <div className="detection-workspace-card">
          {/* Upload or Preview Section */}
          {!selectedFile ? (
            <UploadZone
              onFileSelect={handleFileSelect}
              disabled={isLoading}
            />
          ) : (
            <div className="preview-and-action-section">
              <ImagePreview
                file={selectedFile}
                onRemove={handleRemoveFile}
                onReplace={handleFileSelect}
                disabled={isLoading}
              />

              {/* Primary Analyze Action Button */}
              <div className="analyze-action-bar">
                <button
                  type="button"
                  className="btn btn-primary btn-lg analyze-main-btn"
                  onClick={handleAnalyze}
                  disabled={!selectedFile || isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="btn-spinner" />
                      <span>Analyzing Image...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Analyze Image</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Results / Backend Connection Pending / Error Section */}
          {(result || isLoading || error || backendOffline) && (
            <div className="results-wrapper-section">
              <ResultCard
                result={result}
                isLoading={isLoading}
                error={error}
                backendOffline={backendOffline}
                apiUrl={API_BASE_URL}
                onRetryHealth={checkHealth}
              />
            </div>
          )}
        </div>

        {/* Informational Guidance Box */}
        <div className="guidance-card">
          <h4 className="guidance-heading">
            <HelpCircle size={16} />
            <span>How Image Detection Operates</span>
          </h4>
          <div className="guidance-grid">
            <div className="guidance-item">
              <span className="guidance-number">1</span>
              <div>
                <strong>Patch Extraction</strong>
                <p>Images are partitioned into 16×16 non-overlapping pixel patches and mapped to linear embeddings.</p>
              </div>
            </div>
            <div className="guidance-item">
              <span className="guidance-number">2</span>
              <div>
                <strong>Transformer Attention</strong>
                <p>12 self-attention layers detect global structural incoherencies common in diffusion and GAN algorithms.</p>
              </div>
            </div>
            <div className="guidance-item">
              <span className="guidance-number">3</span>
              <div>
                <strong>Softmax Probability</strong>
                <p>Outputs calibrated probability distribution over REAL and FAKE categories without class index assumptions.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Backend Connection Diagnostic Pill */}
        <div className="connection-status-footer">
          <div className="conn-status-item">
            <Server size={14} />
            <span>Target Backend: <code className="code-text">{API_BASE_URL}</code></span>
          </div>
          <button
            type="button"
            className="conn-check-btn"
            onClick={checkHealth}
            disabled={isCheckingHealth}
            title="Check if FastAPI backend is responding"
          >
            <RefreshCw size={12} className={isCheckingHealth ? 'spin-icon' : ''} />
            <span>{isCheckingHealth ? 'Pinging API...' : (healthStatus?.online ? 'Connected' : 'Check Status')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
