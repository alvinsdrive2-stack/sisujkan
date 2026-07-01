import { useEffect, useRef, useState } from "react"

interface TimePickerModalProps {
  isOpen: boolean
  initialHour: string
  initialMinute: string
  onSave: (hour: string, minute: string) => void
  onClose: () => void
}

const ITEM_HEIGHT = 44
const PADDING = 2

export function TimePickerModal({ isOpen, initialHour, initialMinute, onSave, onClose }: TimePickerModalProps) {
  const [hour, setHour] = useState(initialHour)
  const [minute, setMinute] = useState(initialMinute)
  const [inputValue, setInputValue] = useState(`${initialHour}:${initialMinute}`)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const hourListRef = useRef<HTMLDivElement>(null)
  const minuteListRef = useRef<HTMLDivElement>(null)
  const hourContainerRef = useRef<HTMLDivElement>(null)
  const minuteContainerRef = useRef<HTMLDivElement>(null)
  const [hourTranslate, setHourTranslate] = useState(0)
  const [minuteTranslate, setMinuteTranslate] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragType, setDragType] = useState<'hour' | 'minute' | null>(null)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragStartTranslate, setDragStartTranslate] = useState(0)

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

  // Reset to initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      setHour(initialHour)
      setMinute(initialMinute)
      setInputValue(`${initialHour}:${initialMinute}`)
      const hIdx = hours.indexOf(initialHour)
      const mIdx = minutes.indexOf(initialMinute)
      setHourTranslate(-hIdx * ITEM_HEIGHT)
      setMinuteTranslate(-mIdx * ITEM_HEIGHT)
    }
  }, [isOpen, initialHour, initialMinute])

  const handleScroll = (e: React.WheelEvent<HTMLDivElement>, type: 'hour' | 'minute') => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 1 : -1
    const list = type === 'hour' ? hours : minutes
    const currentIdx = type === 'hour' ? hours.indexOf(hour) : minutes.indexOf(minute)
    const newIdx = Math.max(0, Math.min(list.length - 1, currentIdx + delta))
    const newVal = list[newIdx]

    if (type === 'hour') {
      setHour(newVal)
      setHourTranslate(-newIdx * ITEM_HEIGHT)
    } else {
      setMinute(newVal)
      setMinuteTranslate(-newIdx * ITEM_HEIGHT)
    }
  }

  const handleClick = (idx: number, type: 'hour' | 'minute') => {
    const list = type === 'hour' ? hours : minutes
    const newVal = list[idx]

    if (type === 'hour') {
      setHour(newVal)
      setHourTranslate(-idx * ITEM_HEIGHT)
    } else {
      setMinute(newVal)
      setMinuteTranslate(-idx * ITEM_HEIGHT)
    }
  }

  // Snap to nearest item after drag ends
  const snapToItem = (type: 'hour' | 'minute', currentTranslate: number) => {
    const list = type === 'hour' ? hours : minutes
    const idx = Math.max(0, Math.min(list.length - 1, Math.round(-currentTranslate / ITEM_HEIGHT)))
    const newVal = list[idx]

    if (type === 'hour') {
      setHour(newVal)
      setHourTranslate(-idx * ITEM_HEIGHT)
    } else {
      setMinute(newVal)
      setMinuteTranslate(-idx * ITEM_HEIGHT)
    }
  }

  // Mouse/Touch drag handlers
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, type: 'hour' | 'minute') => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const currentTranslate = type === 'hour' ? hourTranslate : minuteTranslate

    setIsDragging(true)
    setDragType(type)
    setDragStartY(clientY)
    setDragStartTranslate(currentTranslate)
  }

  const handleDragMove = (clientY: number) => {
    if (!isDragging || !dragType) return

    const deltaY = clientY - dragStartY
    const newTranslate = dragStartTranslate + deltaY
    const list = dragType === 'hour' ? hours : minutes
    const maxTranslate = -(list.length - 1) * ITEM_HEIGHT
    const minTranslate = 0

    // Clamp the translate value
    const clampedTranslate = Math.max(maxTranslate, Math.min(minTranslate, newTranslate))

    if (dragType === 'hour') {
      setHourTranslate(clampedTranslate)
    } else {
      setMinuteTranslate(clampedTranslate)
    }
  }

  const handleDragEnd = () => {
    if (!isDragging || !dragType) return

    snapToItem(dragType, dragType === 'hour' ? hourTranslate : minuteTranslate)
    setIsDragging(false)
    setDragType(null)
  }

  // Global mouse/touch move and end listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault() // Prevent scrolling while dragging
      handleDragMove(e.touches[0].clientY)
    }

    const handleMouseUp = () => {
      handleDragEnd()
    }

    const handleTouchEnd = () => {
      handleDragEnd()
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove, { passive: false })
      window.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, dragType, dragStartY, dragStartTranslate, hourTranslate, minuteTranslate])

  if (!isOpen) return null

  const hourIdx = hours.indexOf(hour)
  const minuteIdx = minutes.indexOf(minute)

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '24px',
          width: '320px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          {isInputFocused ? (
            <input
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={() => {
                setIsInputFocused(false)
                const match = inputValue.match(/^(\d{1,2}):(\d{2})$/)
                if (match) {
                  const h = match[1].padStart(2, '0')
                  const m = match[2].padStart(2, '0')
                  if (Number(h) < 24 && Number(m) < 60) {
                    setHour(h)
                    setMinute(m)
                    const hIdx = hours.indexOf(h)
                    const mIdx = minutes.indexOf(m)
                    setHourTranslate(-(hIdx >= 0 ? hIdx : 0) * ITEM_HEIGHT)
                    setMinuteTranslate(-(mIdx >= 0 ? mIdx : 0) * ITEM_HEIGHT)
                    return
                  }
                }
                setInputValue(`${hour}:${minute}`)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                }
                if (e.key === 'Escape') {
                  setInputValue(`${hour}:${minute}`)
                  setIsInputFocused(false)
                }
              }}
              style={{
                width: '160px',
                fontSize: '42px',
                fontWeight: '300',
                color: '#000',
                border: 'none',
                borderBottom: '2px solid #007AFF',
                outline: 'none',
                textAlign: 'center',
                background: 'transparent',
                fontFamily: 'inherit',
              }}
            />
          ) : (
            <div
              onClick={() => setIsInputFocused(true)}
              style={{ fontSize: '42px', fontWeight: '300', color: '#000', cursor: 'text' }}
            >
              {hour}:{minute}
            </div>
          )}
          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>Pilih Waktu</div>
        </div>

        {/* Wheel Picker */}
        <div
          style={{
            position: 'relative',
            height: '220px',
            background: '#f5f5f5',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #e0e0e0',
          }}
        >
          {/* Center highlight */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '10px',
              right: '10px',
              height: '44px',
              marginTop: '-22px',
              background: 'rgba(0, 122, 255, 0.1)',
              borderRadius: '8px',
              pointerEvents: 'none',
              zIndex: 1,
              border: '1px solid rgba(0, 122, 255, 0.3)',
            }}
          />

          {/* Fade overlays */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: '80px',
              background: 'linear-gradient(to bottom, #fff, transparent)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '80px',
              background: 'linear-gradient(to top, #fff, transparent)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />

          {/* Columns */}
          <div style={{ display: 'flex', height: '100%', zIndex: 3, position: 'relative' }}>
            {/* Hour column */}
            <div
              ref={hourContainerRef}
              style={{ flex: 1, overflow: 'hidden', position: 'relative', cursor: 'grab' }}
              onWheel={(e) => handleScroll(e, 'hour')}
              onMouseDown={(e) => handleDragStart(e, 'hour')}
              onTouchStart={(e) => handleDragStart(e, 'hour')}
            >
              <div
                ref={hourListRef}
                style={{
                  transform: `translateY(${hourTranslate}px)`,
                  transition: isDragging && dragType === 'hour' ? 'none' : 'transform 0.2s cubic-bezier(0.15, 0.85, 0.35, 1)',
                  userSelect: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  paddingTop: `${PADDING * ITEM_HEIGHT}px`,
                  paddingBottom: `${PADDING * ITEM_HEIGHT}px`,
                }}
              >
                {hours.map((h, i) => {
                  const isActive = i === hourIdx
                  const isNear = Math.abs(i - hourIdx) === 1
                  return (
                    <div
                      key={h}
                      onClick={() => handleClick(i, 'hour')}
                      style={{
                        height: `${ITEM_HEIGHT}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isActive ? '24px' : '18px',
                        fontWeight: isActive ? '600' : '400',
                        color: isActive ? '#000' : isNear ? '#666' : '#ccc',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {h}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Separator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '24px',
                fontWeight: '500',
                color: '#000',
                paddingBottom: '4px',
                paddingLeft: '4px',
                paddingRight: '4px',
              }}
            >
              :
            </div>

            {/* Minute column */}
            <div
              ref={minuteContainerRef}
              style={{ flex: 1, overflow: 'hidden', position: 'relative', cursor: 'grab' }}
              onWheel={(e) => handleScroll(e, 'minute')}
              onMouseDown={(e) => handleDragStart(e, 'minute')}
              onTouchStart={(e) => handleDragStart(e, 'minute')}
            >
              <div
                ref={minuteListRef}
                style={{
                  transform: `translateY(${minuteTranslate}px)`,
                  transition: isDragging && dragType === 'minute' ? 'none' : 'transform 0.2s cubic-bezier(0.15, 0.85, 0.35, 1)',
                  userSelect: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  paddingTop: `${PADDING * ITEM_HEIGHT}px`,
                  paddingBottom: `${PADDING * ITEM_HEIGHT}px`,
                }}
              >
                {minutes.map((m, i) => {
                  const isActive = i === minuteIdx
                  const isNear = Math.abs(i - minuteIdx) === 1
                  return (
                    <div
                      key={m}
                      onClick={() => handleClick(i, 'minute')}
                      style={{
                        height: `${ITEM_HEIGHT}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isActive ? '24px' : '18px',
                        fontWeight: isActive ? '600' : '400',
                        color: isActive ? '#000' : isNear ? '#666' : '#ccc',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {m}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: '#f0f0f0',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Batal
          </button>
          <button
            onClick={() => onSave(hour, minute)}
            style={{
              flex: 1,
              padding: '12px',
              background: '#007AFF',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Pilih
          </button>
        </div>
      </div>
    </div>
  )
}
