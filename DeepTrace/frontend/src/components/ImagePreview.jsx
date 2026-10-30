import React, { useEffect, useState, useRef } from 'react';
import { X, RefreshCw, FileImage, CheckCircle2 } from 'lucide-react';

/**
 * ImagePreview component showing selected file preview, metadata, and replace/remove actions.
 */
export default function ImagePreview({ file, onRemove, onReplace, disabled = false }) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [dimensions, setDimensions] = useState(null);
  const replaceInputRef = useRef(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      setDimensions(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Read natural dimensions
    const img = new Image();
    img.src = objectUrl;
    img.onload = () => {
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleReplaceChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onReplace(files[0]);
    }
    e.target.value = '';
  };

  if (!file) return null;

  return (
    <div className="preview-container">
      {/* Hidden file input for replacement */}
      <input
        type="file"
        ref={replaceInputRef}
        onChange={handleReplaceChange}
        accept=".png,.jpg,.jpeg,.webp"
        style={{ display: 'none' }}
        disabled={disabled}
      />

      <div className="preview-card">
        {/* Top File Meta Bar */}
        <div className="preview-header">
          <div className="preview-file-info">
            <div className="preview-file-icon">
              <FileImage size={18} />
            </div>
            <div className="preview-text-col">
              <span className="preview-filename" title={file.name}>
                {file.name}
              </span>
              <span className="preview-file-meta">
                {formatFileSize(file.size)}
                {dimensions && ` • ${dimensions.width} × ${dimensions.height} px`}
                {` • ${file.type || 'image'}`}
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="preview-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm preview-action-btn"
              onClick={() => replaceInputRef.current && replaceInputRef.current.click()}
              disabled={disabled}
              title="Select a different image"
            >
              <RefreshCw size={14} />
              <span>Replace</span>
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-sm preview-action-btn remove-btn"
              onClick={onRemove}
              disabled={disabled}
              title="Remove this image"
              aria-label="Remove image"
            >
              <X size={16} />
              <span>Remove</span>
            </button>
          </div>
        </div>

        {/* Preview Frame */}
        <div className="preview-viewport">
          <img
            src={previewUrl}
            alt="Uploaded preview for AI detection"
            className="preview-image-element"
          />

          <div className="preview-ready-tag">
            <CheckCircle2 size={13} />
            <span>Image Buffered & Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
