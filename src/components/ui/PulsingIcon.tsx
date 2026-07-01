import { useState, useEffect } from "react"
import { LucideIcon } from "lucide-react"

interface PulsingIconProps {
  icon: LucideIcon
  className?: string
  delay?: number // delay before fade out in ms (default: 2000)
  duration?: number // fade out duration in ms (default: 500)
  autoHide?: boolean // auto fade out or keep pulsing (default: true)
}

export function PulsingIcon({
  icon: Icon,
  className = "",
  delay = 2000,
  duration = 500,
  autoHide = true
}: PulsingIconProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!autoHide) return // Don't hide if autoHide is false

    const timer = setTimeout(() => {
      setVisible(false)
    }, delay)
    return () => clearTimeout(timer)
  }, [delay, autoHide])

  return (
    <Icon
      className={`transition-opacity ${visible ? 'animate-pulse' : 'opacity-0'} ${className}`}
      style={{ transitionDuration: `${duration}ms` }}
    />
  )
}
