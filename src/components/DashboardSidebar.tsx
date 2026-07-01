import { NavLink, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { getFilteredMenus, resolveUserRole, RoleId } from "@/lib/rbac-config"
import { ChevronRight, Menu, X } from "lucide-react"
import { useState } from "react"
import { useAsesorAbsenPending } from "@/hooks/useAsesorAbsenPending"
import { useAsesorPersiapanPending } from "@/hooks/useAsesorPersiapanPending"

interface DashboardSidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export default function DashboardSidebar({ isCollapsed = false }: DashboardSidebarProps) {
  const { user } = useAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Get user role and menus
  const userRole = resolveUserRole(user?.role)
  const menuItems = userRole ? getFilteredMenus(userRole) : []

  // Always call hooks (Rules of Hooks), skip via enabled param for non-asesors
  const isAsesor = user?.role?.id === RoleId.ASESOR
  const asesorAbsen = useAsesorAbsenPending(isAsesor)
  const asesorPersiapan = useAsesorPersiapanPending(isAsesor)

  // Map path to badge count
  const getBadgeCount = (path: string): number | null => {
    if (path === "/asesor/persiapan") {
      if (!asesorPersiapan || asesorPersiapan.isLoading) return null
      return asesorPersiapan.pending || null
    }
    if (!asesorAbsen || asesorAbsen.isLoading) return null
    if (path === "/asesor/praasesmen") return asesorAbsen.tahap1Pending || null
    if (path === "/asesor/asesmen") return asesorAbsen.tahap2Pending || null
    return null
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6 text-slate-800" /> : <Menu className="w-6 h-6 text-slate-800" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-16 left-0 z-30
          h-[calc(100vh-4rem)] flex flex-col
          transition-all duration-300
          ${isCollapsed ? "w-20" : "w-72"}
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Sidebar Container */}
        <div className="flex flex-col h-full bg-white/90 border-r border-slate-200/50  backdrop-blur-sm">


          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            {!isCollapsed && (
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
                Navigation
              </p>
            )}

            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/")
                const badgeCount = getBadgeCount(item.path)

                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-all duration-200 group
                        ${isActive
                          ? "bg-primary/10 text-primary"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }
                        ${isCollapsed ? "justify-center" : ""}
                      `}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className={`
                        w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 relative
                        ${isActive
                          ? "bg-primary/15"
                          : "bg-slate-100 group-hover:bg-slate-200"
                        }
                      `}>
                        <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-slate-600"}`} />
                        {badgeCount !== null && badgeCount > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none px-1">
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <>
                          <span className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}>{item.title}</span>
                          {badgeCount !== null && badgeCount > 0 && (
                            <span className="ml-auto mr-1 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-bold px-1.5">
                              {badgeCount > 99 ? '99+' : badgeCount}
                            </span>
                          )}
                          {isActive && (badgeCount === null || badgeCount === 0) && <ChevronRight className="w-4 h-4 ml-auto text-primary/60" />}
                        </>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Bottom Info - Version & Copyright */}
          <div className="p-4 text-center">
            {!isCollapsed && (
              <div className="px-2 py-2 space-y-1">
                <p className="text-xs font-semibold text-slate-600">Version 1.0</p>
                <p className="text-[10px] text-slate-400">Copyright © 2026 LSP Gatensi</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
