import React from 'react'

interface RadioProps {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  id?: string
  className?: string
  style?: React.CSSProperties
  name: string
  value: string
}

const RADIO_COLOR = '#373737'
const RADIO_COLOR_HOVER = 'hsl(222, 80%, 35%)'

export function CustomRadio({
  checked,
  onChange,
  disabled = false,
  id,
  className = '',
  style,
  name,
  value,
}: RadioProps) {
  const uniqueId = id || `radio-${name}-${value}`

  return (
    <div className={className} style={{ ...style, display: 'inline-flex', alignItems: 'center' }}>
      <input
        type="radio"
        id={uniqueId}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{
          display: 'none',
        }}
      />
      <label
        htmlFor={uniqueId}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '18px',
          height: '18px',
          border: `2px solid ${RADIO_COLOR}`,
          borderRadius: '50%',
          backgroundColor: checked ? RADIO_COLOR : '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          position: 'relative',
          transition: 'background-color 0.15s ease, border-color 0.15s ease',
          willChange: 'background-color, border-color',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          if (!disabled && !checked) {
            e.currentTarget.style.borderColor = RADIO_COLOR_HOVER
          }
        }}
        onMouseLeave={(e) => {
          if (!checked) {
            e.currentTarget.style.borderColor = RADIO_COLOR
          }
        }}
      >
        {checked && (
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#fff',
              position: 'absolute',
            }}
          />
        )}
      </label>
    </div>
  )
}
