	import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { FullPageLoader } from "@/components/ui/loading-spinner"
import { useAuth } from "@/contexts/auth-context"
import { resolveUserRole } from "@/lib/rbac-config"

interface ValidatedNavigationRouteProps {
  children: React.ReactNode
}

const STORAGE_KEY = 'validated_nav_path'

// Master switch: "1" = block manual URL/back-forward, anything else = off
const NAV_GUARD_ENABLED = import.meta.env.VITE_VALIDATED_NAVIGATION === '1'

// Dashboard paths per role
const DASHBOARD_PATHS: Record<string, string> = {
  'Asesi': '/asesi/dashboard',
  'Asesor': '/asesor/dashboard',
  'Komtek': '/komtek/tandatangan',
  'Direktur LSP': '/direktur/tandatangan',
  'Manajer Sertifikasi': '/manajer/dashboard',
  'Admin LSP': '/admin-lsp/dashboard',
  'Admin TUK': '/admin-tuk/dashboard',
}

export default function ValidatedNavigationRoute({ children }: ValidatedNavigationRouteProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [isValid, setIsValid] = useState<boolean | null>(null)

  useEffect(() => {
    if (!NAV_GUARD_ENABLED) {
      setIsValid(true)
      return
    }
    // Path-based check: internal nav stores the exact target path.
    // Manual URL typing or back/forward breaks the match.
    const expectedPath = sessionStorage.getItem(STORAGE_KEY)
    setIsValid(!!expectedPath && expectedPath === location.pathname)
  }, [location])

  useEffect(() => {
    if (isValid === false) {
      const userRole = resolveUserRole(user?.role) || ''
      const dashboardPath = DASHBOARD_PATHS[userRole] || '/login'
      navigate(dashboardPath, { replace: true })
    }
  }, [isValid, navigate, user])

  if (isValid === null) {
    return <FullPageLoader text="Memvalidasi akses..." />
  }

  if (isValid === false) {
    return null
  }

  return <>{children}</>
}

/**
 * Hook to mark a navigation as valid internal navigation
 */
export function useValidNavigate() {
  const navigate = useNavigate()

  return (to: string, options?: any) => {
    navigate(to, {
      ...options,
      state: { ...options?.state, fromInternal: true }
    })
  }
}
