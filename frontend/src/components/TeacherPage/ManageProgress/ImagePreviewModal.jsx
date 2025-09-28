import React from 'react';
import { FaTimes, FaExpand, FaDownload } from 'react-icons/fa';
import './css/ImagePreviewModal.css';

/**
 * ImagePreviewModal - Modal component for previewing assessment question images
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {string} props.imageUrl - URL of the image to preview
 * @param {string} props.title - Title/caption for the image
 * @param {string} props.questionText - The question text associated with the image
 */
const ImagePreviewModal = ({ isOpen, onClose, imageUrl, title, questionText }) => {
  // Don't render if not open
  if (!isOpen || !imageUrl) {
    return null;
  }

  // Handle modal background click to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key press
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Handle image download
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = title || 'assessment-image';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle opening in new tab
  const handleOpenInNewTab = () => {
    window.open(imageUrl, '_blank');
  };

  return (
    <div 
      className="image-preview-modal" 
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-preview-title"
    >
      <div className="image-preview-modal__content">
        {/* Modal Header */}
        <div className="image-preview-modal__header">
          <div className="image-preview-modal__title-section">
            <h3 id="image-preview-title" className="image-preview-modal__title">
              {title || 'Question Image'}
            </h3>
            {questionText && (
              <p className="image-preview-modal__question">{questionText}</p>
            )}
          </div>
          
          <div className="image-preview-modal__actions">
            <button
              className="image-preview-modal__action-btn"
              onClick={handleOpenInNewTab}
              title="Open in new tab"
              aria-label="Open image in new tab"
            >
              <FaExpand />
            </button>
            <button
              className="image-preview-modal__action-btn"
              onClick={handleDownload}
              title="Download image"
              aria-label="Download image"
            >
              <FaDownload />
            </button>
            <button
              className="image-preview-modal__close-btn"
              onClick={onClose}
              title="Close modal"
              aria-label="Close image preview"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="image-preview-modal__image-container">
          <img
            src={imageUrl}
            alt={title || 'Assessment question image'}
            className="image-preview-modal__image"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          
          {/* Error fallback */}
          <div className="image-preview-modal__error" style={{ display: 'none' }}>
            <p>Failed to load image</p>
            <button 
              onClick={handleOpenInNewTab}
              className="image-preview-modal__error-link"
            >
              Try opening in new tab
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="image-preview-modal__footer">
          <p className="image-preview-modal__hint">
            Press <kbd>Esc</kbd> or click outside to close • Click image to zoom
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;