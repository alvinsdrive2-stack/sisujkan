import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Bell, Menu, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/ToastContext"
import { SimpleSpinner } from "@/components/ui/loading-spinner"
import { ThemeToggle } from "@/components/ThemeToggle"
import { isVideoBgOff, setVideoBgOff } from "@/components/ui/LoopingVideoBackground"
import { VideoOff, Video } from "lucide-react"
import logo from "@/assets/logo.png"
import { getRoleDisplayName } from "@/lib/rbac-config"

const PAS_FOTO_CACHE_KEY = "pas_foto_cache"

interface DashboardNavbarProps {
  userName?: string
  timerNode?: React.ReactNode
}

export default function DashboardNavbar({ userName = "User", timerNode }: DashboardNavbarProps) {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { showSuccess } = useToast()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [videoOff, setVideoOff] = useState(() => isVideoBgOff())
  const [pasFoto, setPasFoto] = useState<string | null>(() => {
    // Initialize from cache only if it matches current user
    try {
      const cached = localStorage.getItem(PAS_FOTO_CACHE_KEY)
      if (!cached) return null
      const { url, idIzin } = JSON.parse(cached)
      // Only use cache if it's for the same user
      if (url && idIzin && idIzin === user?.id_izin) {
        return url
      }
      return null
    } catch {
      return null
    }
  })

  const dashboardRoute = '/login'

  const handleLogoClick = () => {
    navigate(dashboardRoute)
  }

  // Fetch pas_foto from SIKI API
  useEffect(() => {
    const fetchPasFoto = async () => {
      if (!user?.id_izin) return

      // Check cache validity (cache for 1 hour)
      try {
        const cached = localStorage.getItem(PAS_FOTO_CACHE_KEY)
        if (cached) {
          const { url, timestamp, idIzin } = JSON.parse(cached)
          const cacheAge = Date.now() - timestamp
          // Use cache if less than 1 hour old and same user
          if (url && cacheAge < 3600000 && idIzin === user.id_izin) {
            setPasFoto(url)
            return
          }
        }
      } catch {
        // Invalid cache, continue to fetch
      }

      try {
        const response = await fetch(
          `https://siki.pu.go.id/siki-api/v1/permohonan-skk/${user.id_izin}`,
          {
            headers: {
              'token': 'f3332337ac671c33262198340c2f7b579f7843775ecc425107f086956cbb2b1a9e96b0cc6f643d24'
            }
          }
        )
        if (!response.ok) return

        const data = await response.json()
        const fotoUrl = data.personal?.[0]?.pas_foto

        if (fotoUrl) {
          setPasFoto(fotoUrl)
          // Cache the photo URL
          localStorage.setItem(
            PAS_FOTO_CACHE_KEY,
            JSON.stringify({
              url: fotoUrl,
              timestamp: Date.now(),
              idIzin: user.id_izin
            })
          )
        }
      } catch (error) {
        console.error("Failed to fetch pas_foto:", error)
      }
    }

    fetchPasFoto()
  }, [user?.id_izin])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    // Clear pas_foto cache on logout
    localStorage.removeItem(PAS_FOTO_CACHE_KEY)
    try {
      await logout()
      showSuccess("Berhasil logout!")
      navigate("/login")
    } catch (error) {
      console.error("Logout error:", error)
      navigate("/login")
    } finally {
      setIsLoggingOut(false)
    }
  }

  const userInitials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="bg-white dark:bg-slate-900/90 dark:backdrop-blur-md dark:border-slate-700 sticky top-0 z-50 h-16 overflow-visible">
      <div className="w-full h-full">
        {/* Top Bar - Logo, Desktop Right Section, Mobile Toggle */}
        <div className="flex items-center justify-between h-full shadow-xl z-[100000] mx-2">
          {/* Left: Logo */}
          <div className="flex items-center">
            <button
              onClick={handleLogoClick}
              className="w-[230px] h-[110px] flex items-center justify-center overflow-hidden cursor-pointer transition-transform duration-20"
              title={`Kembali ke Dashboard ${getRoleDisplayName(user?.role)}`}
            >
              <img src={logo} alt="LSP Gatensi Logo" className=" hover:scale-105 -translate-x-4 w-[170px] h-[150px] object-contain " />
            </button>
          </div>

          {/* Center: Timer slot */}
          <div className="flex-1 flex justify-center">
            {timerNode}
          </div>

          {/* Desktop: Right section */}
          <div className="hidden md:flex items-center gap-3 pr-4">

            {/* Avatar with online indicator */}
            <div className="relative">
              <Avatar className="w-10 h-10 border-2 border-slate-200">
                {pasFoto && (
                  <AvatarImage src={pasFoto} alt={userName} className="object-cover" />
                )}
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>

            {/* User Info */}
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-slate-800">{userName}</p>
              <p className="text-xs text-slate-500">{getRoleDisplayName(user?.role)}</p>
            </div>

            {/* Video BG Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { const next = !videoOff; setVideoOff(next); setVideoBgOff(next) }}
              title={videoOff ? "Hidupkan background video" : "Matikan background video"}
              className="text-slate-600 hover:bg-slate-100"
            >
              {videoOff ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>

            {/* Divider */}
            <div className="h-8 w-px bg-slate-300 mx-2"></div>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Logout"
              className="text-red-800 hover:bg-red-50 hover:text-red-600"
            >
              {isLoggingOut ? <SimpleSpinner size="sm" className="text-primary" /> : <LogOut className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile: Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-700 animate-fade-in">
            <div className="flex flex-col gap-3">
              {/* User Info */}
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="relative">
                  <Avatar className="w-10 h-10 border-2 border-slate-200">
                    {pasFoto && (
                      <AvatarImage src={pasFoto} alt={userName} className="object-cover" />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{userName}</p>
                  <p className="text-xs text-slate-500">{getRoleDisplayName(user?.role)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 px-4 py-2 items-center">
                <ThemeToggle />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { const next = !videoOff; setVideoOff(next); setVideoBgOff(next) }}
                  title={videoOff ? "Hidupkan background video" : "Matikan background video"}
                >
                  {videoOff ? <Video className="w-4 h-4 mr-2" /> : <VideoOff className="w-4 h-4 mr-2" />}
                  {videoOff ? "Video On" : "Video Off"}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 relative">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifikasi
                  <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <div className="flex items-center justify-center gap-2">
                      <SimpleSpinner size="sm" className="text-primary" />
                    </div>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
