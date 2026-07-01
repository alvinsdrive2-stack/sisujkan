import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Mail, Lock, AlertCircle, VideoOff, Video } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/ToastContext"
import { FullPageLoader } from "@/components/ui/loading-spinner"
import { getRoleConfig, resolveUserRole, getRoleDisplayName } from "@/lib/rbac-config"
import favicon from "@/assets/favicon.png"
import loopVideo from "@/assets/Sequence 01.mp4"
import { LoopingVideoBackground, isVideoBgOff, setVideoBgOff } from "@/components/ui/LoopingVideoBackground"

// Preload dashboard images
const preloadDashboardImages = () => {
  const images = [
    favicon,
  ]

  images.forEach(src => {
    const img = new Image()
    img.src = src
  })
}

export default function LoginPage() {
  const [account, setAccount] = useState("")
  const [showPage, setShowPage] = useState(false)
  const [videoOff, setVideoOff] = useState(() => isVideoBgOff())

  // Page entrance animation
  useEffect(() => {
    setShowPage(true)
  }, [])
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessLoader, setShowSuccessLoader] = useState(false)
  const navigate = useNavigate()
  const { login, isLoading } = useAuth()
  const { showSuccess } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setIsSubmitting(true)

    try {
      // Login and get user data
      const userData = await login({ account, password })

      // Get user role from returned user data
      const userRole = resolveUserRole(userData?.role)

      
      
      

      if (userRole) {
        const roleConfiguration = getRoleConfig(userRole)
        
        

        // Show success toast
        showSuccess(`Login Berhasil, Selamat datang ${getRoleDisplayName(userData?.role)} ${userData?.name}!`)

        setShowSuccessLoader(true)
        preloadDashboardImages()
        navigate(roleConfiguration?.defaultRoute || "/dashboard")
      } else {
        console.error("No role found for user")
        setErrorMessage("Role pengguna tidak ditemukan")
        setIsSubmitting(false)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Login gagal. Silakan coba lagi.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`min-h-screen relative flex items-center justify-center transition-opacity duration-300 ${showPage ? 'page-enter opacity-100' : 'opacity-0'}`}>
      {/* Video Background */}
      <LoopingVideoBackground videoSrc={loopVideo} />

      {/* Video toggle - pojok kanan atas */}
      <button
        onClick={() => { const next = !videoOff; setVideoOff(next); setVideoBgOff(next) }}
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors"
        title={videoOff ? "Hidupkan background video" : "Matikan background video"}
      >
        {videoOff ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
      </button>

      {/* Centered Login Form */}
      <div className="relative z-10 w-full max-w-[480px]">
        {/* Logo with Line */}
        <div className="flex flex-col items-center gap-4 animate-fade-in relative z-20">
          <div className="relative w-32 h-32">
            {/* Circular Logo */}
            <div className="w-full h-full bg-white backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg overflow-hidden relative z-20">
              <img src={favicon} alt="LSP Gatensi Logo" className="w-28 h-28 object-contain translate-x-[4px]" />
            </div>

          </div>
        </div>

        {/* Login Card */}
        <div className="relative">

          {/* Main Card */}
          <div className="relative bg-white backdrop-blur-sm rounded-2xl p-5 border border-white/10 -translate-y-14" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)' }}>
            {/* Header */}
            <div className="mb-5 mt-12 text-center">
              <h2 className="text-xl font-bold text-slate-800 mb-2">Selamat Datang!</h2>
              <p className="text-slate-600 text-sm">
                Masuk untuk mengakses Sistem Uji Kompetensi
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center gap-2 animate-fade-in text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1.5 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <label className="text-xs font-semibold text-slate-700">Account</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Masukkan account ID"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className="h-10 pl-10 border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 pl-10 pr-10 border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary" />
                  <span className="text-slate-600">Ingat saya</span>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-10 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in bg-primary hover:bg-primary/90"
                style={{ animationDelay: "0.4s" }}
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>
            <div className="relative flex items-center my-4 translate-y-[9px]">
                <span className="w-full border-t border-slate-100" />
                <span className="bg-white px-2 text-slate-500 absolute left-1/2 -translate-x-1/2 font-thin text-sm">atau</span>
              </div>

            <div className="mt-5 pt-5 text-center animate-fade-in text-xs" style={{ animationDelay: "0.5s" }}>
              <p className="text-slate-600">Belum memiliki akun?{" "}
                <a href="#" className="text-primary font-semibold hover:underline">
                  Hubungi Admin
                </a>
              </p>
              
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {(isSubmitting || isLoading || showSuccessLoader) && (
        <FullPageLoader text={showSuccessLoader ? "Login berhasil! Memuat dashboard..." : "Sedang login..."} />
      )}
    </div>
  )
}
