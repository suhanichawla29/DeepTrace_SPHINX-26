import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';

/**
 * DetectionCard component representing one of the 4 detection vectors.
 */
export default function DetectionCard({
  icon,
  title,
  description,
  availability,
  actionText,
  path,
  illustration,
}) {
  const navigate = useNavigate();
  const isAvailable = availability === 'available';

  const handleClick = () => {
    navigate(path);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(path);
    }
  };

  return (
    <div
      className={`detection-card ${isAvailable ? 'card-available' : 'card-coming-soon'}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${title} - ${isAvailable ? 'Available Now' : 'Coming Soon'}. Click to view.`}
    >
      {/* Top Header of the Card */}
      <div className="card-top-row">
        <div className="card-icon-container">
          {icon}
        </div>
        <StatusBadge
          status={isAvailable ? 'available' : 'coming-soon'}
          label={isAvailable ? 'AVAILABLE' : 'COMING SOON'}
        />
      </div>

      {/* Visual Illustration Area */}
      <div className="card-illustration-wrapper" aria-hidden="true">
        {illustration}
      </div>

      {/* Text Info */}
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <p className="card-description">{description}</p>
      </div>

      {/* Card Action Link */}
      <div className="card-footer">
        <span className="card-action-text">
          {actionText}
        </span>
        <div className="card-arrow-circle">
          {isAvailable ? (
            <ArrowRight size={16} className="arrow-icon" />
          ) : (
            <ArrowRight size={15} className="arrow-icon arrow-muted" />
          )}
        </div>
      </div>
    </div>
  );
}
