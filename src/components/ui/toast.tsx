// Legacy toast function for backward compatibility
// Usage: toast(message, type)
// Example: toast("Success!", "success")

let toastCallback: ((message: string, type: 'success' | 'error' | 'warning' | 'info') => void) | null = null

export function setToastCallback(callback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void) {
  toastCallback = callback
}

/**
 * Legacy toast function for backward compatibility
 * Usage: toast('message', 'success')
 */
export function toast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
  if (toastCallback) {
    toastCallback(message, type)
  } else {
  }
}

// Empty Toaster component - ToastProvider handles rendering
export function Toaster() {
  return null
}
