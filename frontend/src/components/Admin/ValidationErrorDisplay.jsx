// ValidationErrorDisplay.jsx - Real-time validation feedback component
import React from 'react';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import './ValidationErrorDisplay.css';

/**
 * Component to display validation errors, warnings, and success states
 * Prevents form submission when errors are present
 */
const ValidationErrorDisplay = ({
  errors = [],
  warnings = [],
  fieldName = '',
  showSuccess = false,
  successMessage = '',
  className = ''
}) => {
  const hasErrors = errors && errors.length > 0;
  const hasWarnings = warnings && warnings.length > 0;
  const showSuccessState = showSuccess && !hasErrors && !hasWarnings;

  if (!hasErrors && !hasWarnings && !showSuccessState) {
    return null;
  }

  return (
    <div className={`validation-display ${className}`}>
      {/* Error messages */}
      {hasErrors && (
        <div className="validation-errors">
          <div className="validation-header error">
            <AlertTriangle size={16} />
            <span>Please fix the following issues:</span>
          </div>
          <ul className="validation-list">
            {errors.map((error, index) => (
              <li key={index} className="validation-item error">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warning messages */}
      {hasWarnings && !hasErrors && (
        <div className="validation-warnings">
          <div className="validation-header warning">
            <AlertCircle size={16} />
            <span>Please review:</span>
          </div>
          <ul className="validation-list">
            {warnings.map((warning, index) => (
              <li key={index} className="validation-item warning">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success state */}
      {showSuccessState && (
        <div className="validation-success">
          <div className="validation-header success">
            <CheckCircle size={16} />
            <span>{successMessage || `${fieldName} is valid`}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Inline field validation component for individual form fields
 */
export const InlineValidation = ({
  validationResult,
  fieldName,
  showWhenEmpty = false
}) => {
  if (!validationResult) return null;

  const { isValid, errors = [], warning } = validationResult;

  // Don't show anything if field is valid and no warning
  if (isValid && !warning && !showWhenEmpty) {
    return null;
  }

  return (
    <div className="inline-validation">
      {!isValid && errors.length > 0 && (
        <div className="inline-error">
          <AlertTriangle size={14} />
          <span>{errors[0]}</span> {/* Show only first error inline */}
          {errors.length > 1 && (
            <span className="error-count">+{errors.length - 1} more</span>
          )}
        </div>
      )}

      {isValid && warning && (
        <div className="inline-warning">
          <AlertCircle size={14} />
          <span>{warning}</span>
        </div>
      )}

      {isValid && !warning && showWhenEmpty && (
        <div className="inline-success">
          <CheckCircle size={14} />
          <span>{fieldName} looks good!</span>
        </div>
      )}
    </div>
  );
};

/**
 * Form validation summary component
 * Shows overall form status and prevents submission
 */
export const FormValidationSummary = ({
  validationResult,
  isSubmitting = false,
  onSubmit,
  submitButtonText = 'Submit',
  className = ''
}) => {
  if (!validationResult) return null;

  const { isValid, errors, hasWarnings } = validationResult;
  const errorCount = Object.keys(errors).length;
  const totalErrors = Object.values(errors).flat().length;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isValid) {
      // Scroll to first error field
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
      return;
    }

    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <div className={`form-validation-summary ${className}`}>
      {/* Error summary */}
      {!isValid && (
        <div className="validation-summary-errors">
          <div className="summary-header error">
            <AlertTriangle size={20} />
            <div className="summary-text">
              <strong>Cannot submit form</strong>
              <span>
                {errorCount} field{errorCount !== 1 ? 's' : ''} {errorCount !== 1 ? 'have' : 'has'} {totalErrors} error{totalErrors !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="summary-details">
            <p>Please fix the following issues before submitting:</p>
            <ul className="summary-error-list">
              {Object.entries(errors).map(([fieldName, fieldErrors]) => (
                <li key={fieldName} className="summary-field-error">
                  <strong>{fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong>
                  <span>{fieldErrors[0]}</span>
                  {fieldErrors.length > 1 && (
                    <span className="additional-errors">
                      (+{fieldErrors.length - 1} more issue{fieldErrors.length - 1 !== 1 ? 's' : ''})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Warning summary */}
      {isValid && hasWarnings && (
        <div className="validation-summary-warnings">
          <div className="summary-header warning">
            <AlertCircle size={20} />
            <div className="summary-text">
              <strong>Form ready to submit</strong>
              <span>Please review warnings above</span>
            </div>
          </div>
        </div>
      )}

      {/* Success summary */}
      {isValid && !hasWarnings && (
        <div className="validation-summary-success">
          <div className="summary-header success">
            <CheckCircle size={20} />
            <div className="summary-text">
              <strong>Form is ready to submit</strong>
              <span>All fields are valid</span>
            </div>
          </div>
        </div>
      )}

      {/* Submit button */}
      <div className="submit-button-container">
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className={`submit-button ${!isValid ? 'disabled' : ''} ${isSubmitting ? 'submitting' : ''}`}
        >
          {isSubmitting ? (
            <span className="submitting-text">
              <div className="spinner" />
              Submitting...
            </span>
          ) : (
            <span className="submit-text">
              {!isValid ? `Fix ${errorCount} Issue${errorCount !== 1 ? 's' : ''} to Submit` : submitButtonText}
            </span>
          )}
        </button>

        {!isValid && (
          <p className="submit-help-text">
            The submit button will be enabled once all validation errors are fixed.
          </p>
        )}
      </div>
    </div>
  );
};

export default ValidationErrorDisplay;