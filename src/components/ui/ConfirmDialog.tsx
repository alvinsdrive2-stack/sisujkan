interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmColor?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Ya',
  cancelText = 'Batal',
  confirmColor = '#00488f',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        animation: 'fadeIn 0.2s ease-out',
      }}>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>

        {/* Title */}
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          margin: '0 0 12px 0',
          color: '#1e293b',
        }}>
          {title}
        </h3>

        {/* Message */}
        <p style={{
          fontSize: '14px',
          color: '#64748b',
          margin: '0 0 24px 0',
          lineHeight: '1.5',
        }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#fff',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: '600',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff'
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: confirmColor,
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              // Darken the color by 20%
              e.currentTarget.style.backgroundColor = confirmColor + 'cc'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = confirmColor
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
