import React from 'react';

/**
 * Reusable StatusBadge component.
 * 
 * @param {'available' | 'coming-soon' | 'active' | 'real' | 'fake'} status
 * @param {string} [label]
 * @param {boolean} [showDot]
 */
export default function StatusBadge({ status = 'available', label, showDot = true, className = '' }) {
  const isAvailable = status === 'available' || status === 'active';
  const displayLabel = label || (isAvailable ? 'AVAILABLE' : 'COMING SOON');

  return (
    <span
      className={`badge ${isAvailable ? 'badge-available' : 'badge-coming-soon'} ${className}`}
      role="status"
    >
      {showDot && (
        <span
          className="badge-live-dot"
          style={{
            backgroundColor: isAvailable ? 'var(--accent-warm)' : '#A3A39D',
            animation: isAvailable ? 'pulse-dot 2s infinite ease-in-out' : 'none'
          }}
          aria-hidden="true"
        />
      )}
      {displayLabel}
    </span>
  );
}

