import { useEffect, useState } from 'react'
import { Check, AlertTriangle, Info, AlertOctagon, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastItemProps {
  toast: Toast
  onClose: (id: string) => void
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Trigger slide-in animation after mount
    setIsMounted(true)

    const timer = setTimeout(() => {
      handleClose()
    }, toast.duration || 3000)

    return () => clearTimeout(timer)
  }, [toast.duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => onClose(toast.id), 400)
  }

  const icons = {
    success: <Check size={16} />,
    error: <AlertOctagon size={16} />,
    warning: <AlertTriangle size={16} />,
    info: <Info size={16} />,
  }

  const colors = {
    success: { bg: '#22c55e', progress: '#22c55e' },
    error: { bg: '#ef4444', progress: '#ef4444' },
    warning: { bg: '#f59e0b', progress: '#f59e0b' },
    info: { bg: '#3b82f6', progress: '#3b82f6' },
  }

  const color = colors[toast.type]

  return (
    <div
      style={{
        minWidth: '380px',
        borderRadius: '20px',
        background: '#f6f6f6',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
        transform: !isMounted ? 'translateX(120%)' : (isExiting ? 'translateX(120%)' : 'translateX(0)'),
        opacity: !isMounted ? 0 : (isExiting ? 0 : 1),
        animation: isMounted && !isExiting ? 'slideIn 0.45s ease forwards' : (isExiting ? 'slideOut 0.4s ease forwards' : 'none'),
      }}
    >
      {/* Content Row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
        }}>
          {/* Icon */}
          <div style={{
            transform: 'translateY(20px) translateX(15px)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: color.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            flexShrink: 0,
          }}>
            {icons[toast.type]}
          </div>

          {/* Text */}
          <div style={{
            marginLeft: '5px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            <div style={{
              marginLeft: '5px',
              marginTop: '10px',
              fontWeight: '600',
              fontSize: '16px',
              color: '#1f2937',
            }}>
              {toast.type === 'success' && 'Berhasil!'}
              {toast.type === 'error' && 'Gagal!'}
              {toast.type === 'warning' && 'Perhatian!'}
              {toast.type === 'info' && 'Info'}
            </div>
            <div style={{
              marginLeft: '5px',
              fontSize: '14px',
              opacity: 0.7,
              maxWidth: '260px',
              color: '#374151',
            }}>
              {toast.message}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div
          onClick={handleClose}
          style={{
            marginRight: '10px',
            marginTop: '5px',
            fontSize: '18px',
            opacity: 0.5,
            cursor: 'pointer',
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.5'
          }}
        >
          <X size={18} />
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          height: '4px',
          width: '100%',
          background: color.progress,
          transformOrigin: 'left',
          animation: `countdown ${toast.duration || 3000}ms linear forwards`,
        }}
      />
    </div>
  )
}

// Inject keyframes for countdown animation
const styleTag = document.createElement('style')
styleTag.textContent = `
  @keyframes countdown {
    to { width: 0%; }
  }
  @keyframes slideIn {
    from { transform: translateX(120%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    to { transform: translateX(120%); opacity: 0; }
  }
`
if (typeof document !== 'undefined' && !document.head.querySelector('#toast-keyframes')) {
  styleTag.id = 'toast-keyframes'
  document.head.appendChild(styleTag)
}

interface ToastContainerProps {
  toasts: Toast[]
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 100000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'auto',
    }}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  )
}
