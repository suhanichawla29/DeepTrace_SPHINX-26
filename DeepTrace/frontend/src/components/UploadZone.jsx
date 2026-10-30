import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, AlertCircle } from 'lucide-react';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

/**
 * UploadZone component supporting drag & drop, file browse, and validation.
 */
export default function UploadZone({ onFileSelect, disabled = false }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef(null);

  const validateAndPassFile = (file) => {
    setValidationError('');

    if (!file) return;

    // Check MIME type or extension
    const hasValidMime = ALLOWED_TYPES.includes(file.type);
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidMime && !hasValidExt) {
      setValidationError(
        `Unsupported file format (${file.type || 'unknown'}). Please select a PNG, JPG, JPEG, or WEBP image.`
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setValidationError(
        `File is too large (${sizeMB} MB). Maximum allowed size is 15 MB.`
      );
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndPassFile(files[0]);
    }
  };

  const handleInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndPassFile(files[0]);
    }
    // Reset file input so user can re-select the same file if desired
    e.target.value = '';
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="upload-zone-wrapper">
      <div
        className={`upload-dropzone ${isDragOver ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openFileDialog();
          }
        }}
        aria-label="Upload image area. Drag and drop image here or press to browse."
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          accept={ALLOWED_EXTENSIONS.join(',')}
          style={{ display: 'none' }}
          disabled={disabled}
        />

        <div className="upload-dropzone-inner">
          <div className="upload-icon-circle">
            <UploadCloud size={32} className="upload-main-icon" />
          </div>

          <h3 className="upload-heading">Drop your image here or browse files</h3>

          <p className="upload-subtext">
            Supports high-resolution PNG, JPG, JPEG, and WEBP images up to 15MB.
          </p>

          <div className="upload-cta-row">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                openFileDialog();
              }}
              disabled={disabled}
            >
              <ImageIcon size={15} />
              <span>Browse Files</span>
            </button>
          </div>

          <div className="upload-privacy-pill">
            <span className="privacy-dot" />
            <span>Files are processed locally in volatile memory with zero persistent tracking</span>
          </div>
        </div>
      </div>

      {validationError && (
        <div className="upload-error-banner" role="alert">
          <AlertCircle size={18} className="error-icon" />
          <div className="error-text">{validationError}</div>
        </div>
      )}
    </div>
  );
}

