import { useState, useEffect } from "react"
import logo from "@/assets/favicon.png"

// Preload logo immediately when module loads
const logoImg = new Image()
logoImg.src = logo

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

const sizes = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {/* Logo with pulse animation */}
      <div className={`relative ${sizes[size]}`}>
        <div className="absolute inset-0 bg-primary/40 rounded-full opacity-20 animate-ping" />
        <div className="absolute inset-0 bg-secondary rounded-full opacity-30 animate-pulse" />
        <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-primary/20">
          <img
            src={logo}
            alt="Loading..."
            className="w-3/4 h-3/4 object-contain"
          />
        </div>
      </div>

      {/* Optional text */}
      {text && (
        <p className="text-sm text-slate-600 animate-pulse font-medium">{text}</p>
      )}

      {/* Loading dots with primary/secondary colors */}
      <div className="flex gap-2">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

// Full page loading overlay
export function FullPageLoader({ text = 'Memuat...', show = true }: { text?: string; show?: boolean }) {
  const [logoLoaded, setLogoLoaded] = useState(false)
  const [showLoader, setShowLoader] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)

  useEffect(() => {
    if (!show) {
      // Start fade out when show becomes false
      setIsFadingOut(true)
      const fadeTimer = setTimeout(() => {
        setShowLoader(false)
      }, 300) // Match animation duration
      return () => clearTimeout(fadeTimer)
    }

    // Show loader immediately
    setIsFadingOut(false)
    const showTimer = setTimeout(() => setShowLoader(true), 50)

    // Check if logo already cached
    if (logoImg.complete) {
      setLogoLoaded(true)
    } else {
      logoImg.onload = () => setLogoLoaded(true)
    }

    return () => clearTimeout(showTimer)
  }, [show])

  if (!showLoader) {
    return null
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-md animate-fade-in ${isFadingOut ? 'animate-fade-out' : ''}`}>
      <div className="flex flex-col items-center gap-6">
        {/* Branded spinner - always show rings, logo when loaded */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
          <div className="absolute inset-2 border-4 border-secondary/20 rounded-full" />
          <div className="absolute inset-2 border-4 border-secondary rounded-full border-b-transparent animate-spin" style={{ animationDirection: 'reverse' }} />
          {logoLoaded ? (
            <img
              src={logo}
              alt="Loading..."
              className="absolute inset-4 w-12 h-12 object-contain animate-fade-in"
            />
          ) : (
            // Fallback: simple LSP text while logo loads
            <div className="absolute inset-4 flex items-center justify-center">
              <span className="text-xs font-bold text-primary animate-pulse">LSP</span>
            </div>
          )}
        </div>
        <p className="text-lg font-semibold text-slate-800">{text}</p>
      </div>
    </div>
  )
}

// Inline loading component for cards/sections
export function InlineLoader({ text = 'Memuat...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12 gap-3">
      <div className="w-5 h-5 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-slate-600">{text}</p>
    </div>
  )
}

// Spinning logo loader
export function SpinningLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="animate-spin">
        <img
          src={logo}
          alt="Loading..."
          className="w-10 h-10 opacity-80"
        />
      </div>
      {/* Spinning ring with primary color */}
      <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// Bounce logo loader
export function BounceLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="animate-bounce">
        <img
          src={logo}
          alt="Loading..."
          className="w-12 h-12"
        />
      </div>
    </div>
  )
}

// Pulse logo loader
export function PulseLogo({ className = '', text }: { className?: string; text?: string }) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative">
        {/* Pulse rings */}
        <div className="absolute inset-0 bg-primary/40 rounded-full opacity-20 animate-ping" />
        <div className="absolute inset-0 bg-secondary rounded-full opacity-30 animate-pulse" />

        {/* Logo */}
        <div className="relative bg-white rounded-full p-4 shadow-lg border-2 border-primary/20">
          <img
            src={logo}
            alt="Loading..."
            className="w-12 h-12"
          />
        </div>
      </div>

      {text && <p className="text-sm text-slate-600 font-medium">{text}</p>}
    </div>
  )
}

// Simple spinner (no image) - uses currentColor for text color inheritance
export function SimpleSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  return (
    <div className={`${sizes[size]} ${className}`}>
      <svg className="animate-spin w-full h-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  )
}

// Skeleton card for loading states
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}>
      <div className="space-y-4">
        <div className="h-6 bg-slate-200 rounded animate-pulse w-1/3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded animate-pulse w-5/6"></div>
        </div>
      </div>
    </div>
  )
}

// Skeleton stats card
export function SkeletonStatsCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-10 w-10 bg-slate-200 rounded-lg animate-pulse"></div>
          <div className="h-6 bg-slate-200 rounded animate-pulse w-20"></div>
        </div>
        <div className="h-8 bg-slate-200 rounded animate-pulse w-16"></div>
        <div className="h-4 bg-slate-200 rounded animate-pulse w-full"></div>
      </div>
    </div>
  )
}

// Skeleton table row
export function SkeletonTableRow({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-4 p-4 border-b border-slate-100 ${className}`}>
      <div className="h-10 w-10 bg-slate-200 rounded-full animate-pulse"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded animate-pulse w-1/4"></div>
        <div className="h-3 bg-slate-200 rounded animate-pulse w-1/6"></div>
      </div>
      <div className="h-8 w-24 bg-slate-200 rounded animate-pulse"></div>
    </div>
  )
}
