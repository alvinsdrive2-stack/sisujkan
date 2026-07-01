import React from 'react'

interface ActionButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  style?: React.CSSProperties
}

export const ActionButton = React.memo(function ActionButton({
  children,
  variant = 'primary',
  disabled = false,
  onClick,
  type = 'button',
  style
}: ActionButtonProps) {
  const isPrimary = variant === 'primary'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 20px',
        border: isPrimary ? 'none' : '1px solid #e2e8f0',
        backgroundColor: disabled
          ? '#cbd5e1'
          : isPrimary
            ? '#00488f'
            : '#fff',
        color: disabled
          ? '#fff'
          : isPrimary
            ? '#fff'
            : '#64748b',
        fontSize: '14px',
        fontWeight: '600',
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        if (isPrimary) {
          e.currentTarget.style.backgroundColor = '#0066cc'
        } else {
          e.currentTarget.style.backgroundColor = '#f8fafc'
          e.currentTarget.style.borderColor = '#cbd5e1'
        }
      }}
      onMouseLeave={(e) => {
        if (disabled) return
        if (isPrimary) {
          e.currentTarget.style.backgroundColor = '#00488f'
        } else {
          e.currentTarget.style.backgroundColor = '#fff'
          e.currentTarget.style.borderColor = '#e2e8f0'
        }
      }}
    >
      {children}
    </button>
  )
})
