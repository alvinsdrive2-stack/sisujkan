import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { ToastContainer, Toast, ToastType } from '@/components/ui/ToastComponent'
import { setToastCallback } from '@/components/ui/toast'

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
    const id = Math.random().toString(36).substring(7)
    const newToast: Toast = { id, message, type, duration }
    setToasts(prev => [...prev, newToast])
  }, [])

  // Set up legacy toast callback for backward compatibility
  useEffect(() => {
    setToastCallback((message, type) => {
      showToast(message, type)
    })
  }, [showToast])

  const value = React.useMemo(() => ({
    showToast,
    showSuccess: (message: string, duration?: number) => showToast(message, 'success', duration),
    showError: (message: string, duration?: number) => showToast(message, 'error', duration),
    showWarning: (message: string, duration?: number) => showToast(message, 'warning', duration),
    showInfo: (message: string, duration?: number) => showToast(message, 'info', duration),
  }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  )
}
