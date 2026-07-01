import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { FullPageLoader } from "@/components/ui/loading-spinner"
import { RoleId, UserRole, resolveUserRole } from "@/lib/rbac-config"
import ForbiddenPage from "./ForbiddenPage"

interface RoleRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallback?: string // Custom fallback path, defaults to user's default route
}

/**
 * RoleRoute - A modular protected route component that restricts access based on user roles.
 *
 * Usage:
 *   <RoleRoute allowedRoles={["Asesor"]}>
 *     <AsesorDashboard />
 *   </RoleRoute>
 *
 *   <RoleRoute allowedRoles={["Admin LSP", "Direktur LSP", "Manajer Sertifikasi"]}>
 *     <AdminPanel />
 *   </RoleRoute>
 */
export default function RoleRoute({ children, allowedRoles, fallback }: RoleRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <FullPageLoader text="Memuat..." />
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  const userRoleName = resolveUserRole(user.role) as UserRole | undefined

  // Check if user's role is in the allowed roles list
  if (userRoleName && allowedRoles.includes(userRoleName)) {
    return <>{children}</>
  }

  // Show forbidden page with countdown
  const fallbackPath = fallback || getDefaultRouteForRole(userRoleName)
  return <ForbiddenPage redirectPath={fallbackPath} />
}

/**
 * Get the default route for a given role
 */
function getDefaultRouteForRole(role?: UserRole): string {
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

  // Default fallback
  return "/login"
}

/**
 * SuperAdmin Only Route - Only accessible by superadmin role
 */
export function SuperAdminRoute({ children, fallback }: { children: React.ReactNode; fallback?: string }) {
  return (
    <RoleRoute allowedRoles={["Admin LSP"]} fallback={fallback}>
      {children}
    </RoleRoute>
  )
}

/**
 * Admin LSP Route - Accessible by Admin LSP and superadmin
 */
export function AdminLSPRoute({ children, fallback }: { children: React.ReactNode; fallback?: string }) {
  return (
    <RoleRoute allowedRoles={["Admin LSP"]} fallback={fallback}>
      {children}
    </RoleRoute>
  )
}

/**
 * Admin TUK Route - Accessible by Admin TUK
 */
export function AdminTUKRoute({ children, fallback }: { children: React.ReactNode; fallback?: string }) {
  return (
    <RoleRoute allowedRoles={["Admin TUK"]} fallback={fallback}>
      {children}
    </RoleRoute>
  )
}

/**
 * Asesor Route - Accessible by Asesor
 */
export function AsesorRoute({ children, fallback }: { children: React.ReactNode; fallback?: string }) {
  return (
    <RoleRoute allowedRoles={["Asesor"]} fallback={fallback}>
      {children}
    </RoleRoute>
  )
}

/**
 * Asesi Route - Accessible by Asesi
 */
export function AsesiRoute({ children, fallback }: { children: React.ReactNode; fallback?: string }) {
  return (
    <RoleRoute allowedRoles={["Asesi"]} fallback={fallback}>
      {children}
    </RoleRoute>
  )
}

/**
 * Komtek Route - Accessible by Komtek
 */
export function KomtekRoute({ children, fallback }: { children: React.ReactNode; fallback?: string }) {
  return (
    <RoleRoute allowedRoles={["Komtek"]} fallback={fallback}>
      {children}
    </RoleRoute>
  )
}

/**
 * Direktur LSP Route - Accessible by Direktur LSP
 */
export function DirekturLSPRoute({ children, fallback }: { children: React.ReactNode; fallback?: string }) {
  return (
    <RoleRoute allowedRoles={["Direktur LSP"]} fallback={fallback}>
      {children}
    </RoleRoute>
  )
}

/**
 * Manajer Sertifikasi Route - Accessible by Manajer Sertifikasi
 */
export function ManajerSertifikasiRoute({ children, fallback }: { children: React.ReactNode; fallback?: string }) {
  return (
    <RoleRoute allowedRoles={["Manajer Sertifikasi"]} fallback={fallback}>
      {children}
    </RoleRoute>
  )
}

/**
 * Executive Route - Accessible by Direktur LSP, Manajer Sertifikasi, and Komtek
 */
export function ExecutiveRoute({ children, fallback }: { children: React.ReactNode; fallback?: string }) {
  return (
    <RoleRoute
      allowedRoles={["Direktur LSP", "Manajer Sertifikasi", "Komtek"]}
      fallback={fallback}
    >
      {children}
    </RoleRoute>
  )
}

/**
 * Any Admin Route - Accessible by any admin role (Admin LSP, Admin TUK, Direktur LSP, Manajer Sertifikasi)
 */
export function AnyAdminRoute({ children, fallback }: { children: React.ReactNode; fallback?: string }) {
  return (
    <RoleRoute
      allowedRoles={["Admin LSP", "Admin TUK", "Direktur LSP", "Manajer Sertifikasi"]}
      fallback={fallback}
    >
      {children}
    </RoleRoute>
  )
}

/**
 * AsesiOrAsesorRoute - Accessible by Asesi or Asesor (with noreg)
 * This is used for routes where asesor needs to view asesi's data
 */
export function AsesiOrAsesorRoute({ children, fallback }: { children: React.ReactNode; fallback?: string }) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <FullPageLoader text="Memuat..." />
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  const userRoleName = resolveUserRole(user.role) as UserRole | undefined

  // Allow access if user is Asesi
  if (user?.role?.id === RoleId.ASESI) {
    return <>{children}</>
  }

  // Allow access if user is Asesor with noreg
  if (user?.role?.id === RoleId.ASESOR && user.noreg) {
    return <>{children}</>
  }

  // Show forbidden page with countdown
  const fallbackPath = fallback || getDefaultRouteForRole(userRoleName)
  return <ForbiddenPage redirectPath={fallbackPath} />
}
