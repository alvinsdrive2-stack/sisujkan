import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { getRoleConfig, resolveUserRole } from "@/lib/rbac-config"

export default function DefaultRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  // DEBUG: Log when DefaultRoute renders
  console.log('[DefaultRoute] Render:', { pathname: location.pathname, isLoading, hasUser: !!user })

  // Only handle root path - don't interfere with other routes
  if (location.pathname !== "/" && location.pathname !== "") {
    console.log('[DefaultRoute] Skipping - not on root path')
    return null
  }

  // While checking auth status, show nothing
  if (isLoading) {
    console.log('[DefaultRoute] Still loading')
    return null
  }

  // If user is authenticated, redirect to their role's default route
  if (user) {
    const userRole = resolveUserRole(user.role)
    console.log('[DefaultRoute] User authenticated:', userRole)
    if (userRole) {
      const roleConfig = getRoleConfig(userRole)
      if (roleConfig) {
        console.log('[DefaultRoute] Redirecting to:', roleConfig.defaultRoute)
        return <Navigate to={roleConfig.defaultRoute} replace />
      }
    }
    // Fallback to dashboard if role config not found
    console.log('[DefaultRoute] No role config, redirecting to /dashboard')
    return <Navigate to="/dashboard" replace />
  }

  // If not authenticated, redirect to login
  console.log('[DefaultRoute] Not authenticated, redirecting to /login')
  return <Navigate to="/login" replace />
}
