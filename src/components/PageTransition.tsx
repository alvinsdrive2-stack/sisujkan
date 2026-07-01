import { useEffect, useState, ReactNode } from "react"

interface PageTransitionProps {
  children: ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation on mount
    setIsLoading(true)
    setIsVisible(false)

    // Show loading briefly
    const timer1 = setTimeout(() => {
      setIsLoading(false)
      setIsVisible(true)
    }, 300)

    return () => clearTimeout(timer1)
  }, [])

  if (isLoading) {
    return (
      <div className="page-loading-overlay">
        <div className="loader-circle"></div>
      </div>
    )
  }

  return (
    <div className={`page-enter ${isVisible ? 'opacity-100' : ''}`}>
      {children}
    </div>
  )
}

// Wrapper for automatic page transitions
export function withPageTransition<P extends object>(
  Component: React.ComponentType<P>
) {
  return function PageTransitionWrapper(props: P) {
    return (
      <PageTransition>
        <Component {...props} />
      </PageTransition>
    )
  }
}
