import { Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { getRoleConfig, resolveUserRole } from "@/lib/rbac-config"

interface PublicRouteProps {
  children: React.ReactNode
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { user, isLoading } = useAuth()

  // While checking auth status, show nothing or a loader
  if (isLoading) {
    return null
  }

  // If user is authenticated, redirect to their role's default route
  if (user) {
    const userRole = resolveUserRole(user.role)
    if (userRole) {
      const roleConfig = getRoleConfig(userRole)
      if (roleConfig) {
        return <Navigate to={roleConfig.defaultRoute} replace />
      }
    }
    // Fallback to dashboard if role config not found
    return <Navigate to="/dashboard" replace />
  }

  // If not authenticated, render the public page (login)
  return <>{children}</>
}
