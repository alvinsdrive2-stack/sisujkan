import { ReactNode, useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useNavigate } from "react-router-dom"
import { useLocation } from "react-router-dom"
import DashboardSidebar from "./DashboardSidebar"
import DashboardNavbar from "./DashboardNavbar"
import { getRoleConfig, resolveUserRole } from "@/lib/rbac-config"
import { FullPageLoader } from "@/components/ui/loading-spinner"
import { LoopingVideoBackground } from "@/components/ui/LoopingVideoBackground"
import loopVideo from "@/assets/Sequence 01.mp4"

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showContent, setShowContent] = useState(true)

  // Page transition on route change — CSS-only, no extra renders
  useEffect(() => {
    setShowContent(false)
    const timer = requestAnimationFrame(() => {
      setShowContent(true)
    })
    return () => cancelAnimationFrame(timer)
  }, [location.pathname])

  useEffect(() => {
    if (!isLoading && user) {
      const userRole = resolveUserRole(user?.role)
      const roleConfiguration = userRole ? getRoleConfig(userRole) : null

      // Redirect to role-based default route if on root dashboard
      if (window.location.pathname === "/dashboard" && roleConfiguration) {
        navigate(roleConfiguration.defaultRoute, { replace: true })
      }
    }
  }, [user, isLoading, navigate])

  if (isLoading) {
    return (
      <>
        <LoopingVideoBackground videoSrc={loopVideo} />
        <FullPageLoader text="Memuat..." />
      </>
    )
  }

  if (!user) {
    return null // Will be redirected by ProtectedRoute
  }

  return (
    <>
      {/* Video Background */}
      <LoopingVideoBackground videoSrc={loopVideo} />

      <div className="min-h-screen flex flex-col">
      {/* DashboardNavbar - Fixed at top */}
      <DashboardNavbar userName={user?.name || "User"} />

      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className={`bg-white dark:bg-slate-800 dark:text-slate-100 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 min-h-[calc(100vh-120px)] transition-all duration-300 ${showContent ? 'page-enter opacity-100' : 'opacity-0'}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
    </>
  )
}
