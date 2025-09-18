// Enhanced toast implementation for better user experience
let toastContainer;

// Create toast container if it doesn't exist
const createToastContainer = () => {
  if (typeof window === 'undefined') return null;

  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

// Show toast notification
const showToast = (message, type = 'info', duration = 4000) => {
  const container = createToastContainer();
  if (!container) return 'toast-id';

  const toastId = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  const toast = document.createElement('div');

  // Toast styling based on type
  const colors = {
    success: { bg: '#10b981', border: '#059669' },
    error: { bg: '#ef4444', border: '#dc2626' },
    warning: { bg: '#f59e0b', border: '#d97706' },
    info: { bg: '#3b82f6', border: '#2563eb' }
  };

  const color = colors[type] || colors.info;

  toast.id = toastId;
  toast.style.cssText = `
    background: ${color.bg};
    color: white;
    padding: 12px 16px;
    margin-bottom: 8px;
    border-radius: 6px;
    border-left: 4px solid ${color.border};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    max-width: 350px;
    word-wrap: break-word;
    pointer-events: auto;
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out;
    opacity: 0.95;
  `;

  toast.textContent = message;

  // Add click to dismiss
  toast.style.cursor = 'pointer';
  toast.onclick = () => dismissToast(toastId);

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
  });

  // Auto dismiss
  setTimeout(() => {
    dismissToast(toastId);
  }, duration);

  console.log(`[TOAST ${type.toUpperCase()}]:`, message);
  return toastId;
};

// Dismiss toast
const dismissToast = (id) => {
  const toast = document.getElementById(id);
  if (toast) {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
};

const toastFn = (message, options = {}) => {
  return showToast(message, 'info', options.duration);
};

toastFn.success = (message, options = {}) => {
  return showToast(message, 'success', options.duration);
};

toastFn.error = (message, options = {}) => {
  return showToast(message, 'error', options.duration || 6000); // Longer duration for errors
};

toastFn.warning = (message, options = {}) => {
  return showToast(message, 'warning', options.duration);
};

toastFn.loading = (message, options = {}) => {
  return showToast(message, 'info', options.duration || 2000);
};

toastFn.dismiss = dismissToast;

export const toast = toastFn; 