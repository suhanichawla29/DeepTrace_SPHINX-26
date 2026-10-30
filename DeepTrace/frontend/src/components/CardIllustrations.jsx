import React from 'react';
import { Play, FileText, Waves } from 'lucide-react';

/**
 * Card 1: Image Detection Visual Illustration
 */
export function ImageIllustration() {
  return (
    <div className="illustration-box illustration-image">
      <div className="illus-image-frame">
        {/* Scanning beam */}
        <div className="illus-scan-line" />

        {/* Bounding corners */}
        <div className="illus-corner top-l" />
        <div className="illus-corner top-r" />
        <div className="illus-corner bot-l" />
        <div className="illus-corner bot-r" />

        {/* Mock photo content */}
        <div className="illus-photo-canvas">
          {/* Subtle patch grid overlay */}
          <div className="illus-patch-grid">
            <span className="patch-cell p1" />
            <span className="patch-cell p2" />
            <span className="patch-cell p3" />
            <span className="patch-cell p4" />
            <span className="patch-cell p5" />
            <span className="patch-cell p6" />
          </div>

          {/* Focal silhouette representation */}
          <div className="illus-face-target">
            <div className="target-contour" />
            <div className="target-crosshair" />
          </div>

          {/* Floating Model Tag */}
          <div className="illus-floating-pill">
            <span className="pill-dot-active" />
            <span>ViT-Base • 224px Analysis</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Card 2: Audio Detection Visual Illustration
 */
export function AudioIllustration() {
  const bars = [25, 45, 75, 55, 90, 60, 40, 80, 100, 70, 45, 85, 60, 30, 50, 70, 35, 60, 40, 20];

  return (
    <div className="illustration-box illustration-audio">
      <div className="illus-audio-frame">
        {/* Equalizer Waveform Bars */}
        <div className="illus-waveform-container">
          {bars.map((height, i) => (
            <div
              key={i}
              className={`waveform-bar ${i % 3 === 0 ? 'accent-bar' : ''}`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        {/* Timeline ruler */}
        <div className="illus-audio-timeline">
          <span>00:00</span>
          <div className="timeline-tick-row">
            <span className="tick major" />
            <span className="tick" />
            <span className="tick" />
            <span className="tick major" />
            <span className="tick" />
            <span className="tick" />
            <span className="tick major" />
          </div>
          <span>00:15</span>
        </div>

        {/* Floating status tag */}
        <div className="illus-audio-pill">
          <Waves size={12} className="illus-mini-icon" />
          <span>Synthetic Voiceprint Engine</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Card 3: Video Detection Visual Illustration
 */
export function VideoIllustration() {
  return (
    <div className="illustration-box illustration-video">
      <div className="illus-video-frame">
        {/* Filmstrip perforations top */}
        <div className="filmstrip-holes">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="sprocket-hole" />
          ))}
        </div>

        {/* Video Player Display */}
        <div className="video-player-display">
          <div className="video-play-disc">
            <Play size={18} fill="#121211" strokeWidth={0} />
          </div>

          <div className="video-timeline-bar">
            <div className="video-progress-fill" style={{ width: '48%' }} />
            <div className="video-scrubber-head" style={{ left: '48%' }} />
          </div>

          <div className="video-frame-markers">
            <span className="frame-marker active" title="Analyzed Frame 12" />
            <span className="frame-marker active" title="Analyzed Frame 24" />
            <span className="frame-marker flag" title="Artifact Detected" />
            <span className="frame-marker" title="Pending" />
          </div>
        </div>

        {/* Filmstrip perforations bottom */}
        <div className="filmstrip-holes">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="sprocket-hole" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Card 4: Message Detection Visual Illustration
 */
export function MessageIllustration() {
  return (
    <div className="illustration-box illustration-message">
      <div className="illus-message-frame">
        {/* Message bubble 1 */}
        <div className="illus-chat-bubble bubble-left">
          <div className="bubble-line line-long" />
          <div className="bubble-line line-short" />
        </div>

        {/* Message bubble 2 with token perplexity highlights */}
        <div className="illus-chat-bubble bubble-right">
          <div className="bubble-line line-full" />
          <div className="token-highlight-row">
            <span className="token-pill warm">LLM Token</span>
            <span className="token-pill neutral">Perplexity Check</span>
          </div>
        </div>

        {/* Floating status tag */}
        <div className="illus-message-pill">
          <FileText size={12} className="illus-mini-icon" />
          <span>Stylometric NLP Classifier</span>
        </div>
      </div>
    </div>
  );
}
