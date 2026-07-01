import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { FullPageLoader } from "@/components/ui/loading-spinner"
import { Permission, getRoleConfig, RoleId, UserRole, resolveUserRole } from "@/lib/rbac-config"
import ForbiddenPage from "./ForbiddenPage"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermissions?: Permission[]
  requiredRoles?: string[]
  requireAll?: boolean // If true, user needs ALL permissions. If false, needs ANY
  allowAsesorWithNoreg?: boolean // If true, allow asesor with noreg to bypass permission check
}

export default function ProtectedRoute({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  requireAll = false,
  allowAsesorWithNoreg = false
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  // Dev bypass: set localStorage dev_bypass_auth = '1' to skip all protection
  const devBypass = import.meta.env.DEV && localStorage.getItem('dev_bypass_auth') === '1'

  if (isLoading && !devBypass) {
    return <FullPageLoader text="Memuat..." />
  }

  if (!isAuthenticated && !devBypass) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  const userRoleName = resolveUserRole(user?.role) as UserRole | undefined

  // Get default route for redirect
  const getDefaultRoute = (role?: UserRole): string => {
    const defaultRoutes: Record<UserRole, string> = {
      "superadmin": "/superadmin/dashboard",
      "Admin LSP": "/admin-lsp/dashboard",
      "Direktur LSP": "/direktur/tandatangan",
      "Manajer Sertifikasi": "/manajer/dashboard",
      "Admin TUK": "/admin-tuk/dashboard",
      "Asesor": "/asesor/dashboard",
      "Asesi": "/asesi/dashboard",
      "Komtek": "/komtek/tandatangan"
    }

    if (role && defaultRoutes[role]) {
      return defaultRoutes[role]
    }
    return "/dashboard"
  }

  // Skip role/permission checks in dev bypass mode
  if (devBypass) return <>{children}</>

  // Check role-based access
  if (requiredRoles.length > 0 && userRoleName) {
    if (!requiredRoles.includes(userRoleName)) {
      return <ForbiddenPage redirectPath={getDefaultRoute(userRoleName)} />
    }
  }

  // Check permissions if specified
  if (requiredPermissions.length > 0 && user) {
    // Allow asesor with noreg to access if enabled (case insensitive)
    if (allowAsesorWithNoreg && user?.role?.id === RoleId.ASESOR && user.noreg) {
      return <>{children}</>
    }

    const roleConfiguration = userRoleName ? getRoleConfig(userRoleName) : null

    // Use role permissions from config instead of API (since API returns empty)
    const userPermissions: Permission[] = roleConfiguration?.permissions || []

    const hasAccess = requireAll
      ? requiredPermissions.every(p => userPermissions.includes(p))
      : requiredPermissions.some(p => userPermissions.includes(p))

    if (!hasAccess) {
      return <ForbiddenPage redirectPath={getDefaultRoute(userRoleName)} />
    }
  }

  return <>{children}</>
}
