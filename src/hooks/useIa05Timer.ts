import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { RoleId } from "@/lib/rbac-config"

const TIMER_DURATION_MS = 60 * 60 * 1000 // 1 hour

interface UseIa05TimerOptions {
  idIzin: string | undefined
  onExpired?: () => void
  onSaveAndRedirect?: () => Promise<void> | void
}

interface UseIa05TimerReturn {
  remainingSeconds: number
  isExpired: boolean
  isPaused: boolean
}

export function useIa05Timer({ idIzin, onExpired, onSaveAndRedirect }: UseIa05TimerOptions): UseIa05TimerReturn {
  const { user } = useAuth()
  const isAsesi = user?.role?.id === RoleId.ASESI
  const [remainingMs, setRemainingMs] = useState(TIMER_DURATION_MS)
  const [isExpired, setIsExpired] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isSavingRef = useRef(false)
  const navigate = useNavigate()

  const storageKey = `ia05_timer_${idIzin}`

  const getNextStep = useCallback((): string | null => {
    if (!idIzin) return null
    return `/asesi/asesmen/${idIzin}/ak02`
  }, [idIzin])

  const handleExpire = useCallback(async () => {
    if (isSavingRef.current) return
    isSavingRef.current = true

    setIsExpired(true)
    localStorage.removeItem(storageKey)

    // Call save + redirect callback if provided
    if (onSaveAndRedirect) {
      await onSaveAndRedirect()
    } else {
      // Fallback: just call onExpired and redirect
      onExpired?.()
      const next = getNextStep()
      if (next) navigate(next)
    }
  }, [onExpired, onSaveAndRedirect, getNextStep, navigate, storageKey])

  useEffect(() => {
    if (!isAsesi || !idIzin) return

    const storedStart = localStorage.getItem(storageKey)

    if (storedStart) {
      const elapsed = Date.now() - parseInt(storedStart, 10)
      const remaining = TIMER_DURATION_MS - elapsed
      if (remaining <= 0) {
        handleExpire()
        return
      }
      setRemainingMs(remaining)
    } else {
      localStorage.setItem(storageKey, Date.now().toString())
      setRemainingMs(TIMER_DURATION_MS)
    }

    timerRef.current = setInterval(() => {
      setRemainingMs(prev => {
        const next = prev - 1000
        return next <= 0 ? 0 : next
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isAsesi, idIzin, handleExpire])

  // Trigger expire when remainingMs hits 0
  useEffect(() => {
    if (remainingMs <= 0 && !isExpired) {
      if (timerRef.current) clearInterval(timerRef.current)
      handleExpire()
    }
  }, [remainingMs, isExpired, handleExpire])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        setIsPaused(true)
      } else {
        setIsPaused(false)
        timerRef.current = setInterval(() => {
          setRemainingMs(prev => {
            const next = prev - 1000
            return next <= 0 ? 0 : next
          })
        }, 1000)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [handleExpire])

  const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000))
  return { remainingSeconds, isExpired, isPaused }
}
