import React, { useRef } from 'react'

interface CheckboxProps {
  checked: boolean
  onChange: (shiftKey?: boolean) => void
  disabled?: boolean
  id?: string
  className?: string
  style?: React.CSSProperties
}

export const CustomCheckbox = React.memo(function CustomCheckbox({
  checked,
  onChange,
  disabled = false,
  id,
  className = '',
  style,
}: CheckboxProps) {
  const generatedId = useRef(`checkbox-${Math.random().toString(36).substring(7)}`)
  const uniqueId = id || generatedId.current
  const shiftRef = useRef(false)

  return (
    <div
      className={`checkbox-wrapper ${className}`}
      style={{...style, cursor: disabled ? 'not-allowed' : 'auto'}}
      onMouseDown={(e) => { shiftRef.current = e.shiftKey }}
    >
      <input
        type="checkbox"
        id={uniqueId}
        checked={checked}
        onChange={() => onChange(shiftRef.current)}
        disabled={disabled}
      />
      <label
        htmlFor={uniqueId}
        className="check-box"
        style={{
          opacity: disabled ? 0.5 : 1,
        }}
      >
      </label>
    </div>
  )
})
