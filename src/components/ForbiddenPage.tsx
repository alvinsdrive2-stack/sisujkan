import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { UserRole, resolveUserRole } from "@/lib/rbac-config"

interface ForbiddenPageProps {
  redirectPath?: string
}

export default function ForbiddenPage({ redirectPath }: ForbiddenPageProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(3)

  const userRoleName = resolveUserRole(user?.role) as UserRole | undefined

  // Add styles only once on mount
  useEffect(() => {
    if (!document.head.querySelector('style[data-forbidden-page]')) {
      const styleElement = document.createElement("style")
      styleElement.setAttribute('data-forbidden-page', 'true')
      styleElement.textContent = `
        @import url("https://fonts.googleapis.com/css?family=Montserrat:100,200,300,400,500,600,700,800,900|Nunito:200,300,400,600,700,800,900&display=swap");

        @keyframes pulse {
          0% { color: #000; }
          50% { color: rgba(240, 48, 48, 1); }
          100% { color: #000; }
        }

        @media (max-width: 768px) {
          .forbidden-403 h1 {
            font-size: 120px !important;
            letter-spacing: -20px !important;
            margin-bottom: 30px !important;
          }
        }
      `
      document.head.appendChild(styleElement)
    }
  }, [])

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

  const defaultRedirect = redirectPath || getDefaultRoute(userRoleName)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate(defaultRedirect, { replace: true })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [defaultRedirect, navigate])

  const handleGoBack = () => {
    navigate(defaultRedirect, { replace: true })
  }

  return (
    <div style={pageWrapStyle}>
      <div style={pageNotFoundStyle} className="forbidden-403">
        <img
          src="https://res.cloudinary.com/razeshzone/image/upload/v1588316204/house-key_yrqvxv.svg"
          style={imgKeyStyle}
          alt=""
        />
        <h1 style={textXlStyle}>
          <span style={spanStyle}>4</span>
          <span style={spanStyle}>0</span>
          <span style={brokenStyle}>3</span>
        </h1>
        <h4 style={textMdStyle}>Akses Ditolak!</h4>
        <h4 style={textSmStyle}>
          Anda tidak memiliki izin untuk mengakses halaman ini. Hubungi administrator Anda untuk membuka fitur ini.
          Anda dapat kembali ke{" "}
          <button onClick={handleGoBack} style={linkStyle}>
            dashboard
          </button>{" "}
          atau tunggu{" "}
          <span style={{ fontWeight: 700, color: "#1177bd" }}>{countdown} detik</span> untuk dialihkan ke dashboard.
        </h4>
      </div>
    </div>
  )
}

// Styles
const pageWrapStyle: React.CSSProperties = {
  padding: "30px 15px",
  textAlign: "center",
  display: "flex",
  alignItems: "center",
  minHeight: "100vh",
  fontFamily: '"Nunito", sans-serif',
  background: "#f5f5f5"
}

const pageNotFoundStyle: React.CSSProperties = {
  width: "400px",
  marginLeft: "auto",
  marginRight: "auto",
  position: "relative"
}

const imgKeyStyle: React.CSSProperties = {
  marginBottom: "0px",
  width: "200px",
  height: "auto"
}

const textXlStyle: React.CSSProperties = {
  color: "#000",
  textTransform: "uppercase",
  lineHeight: "50px",
  fontSize: "160px",
  fontWeight: 800,
  letterSpacing: "-28px",
  textShadow: "-6px 4px 0px #fff",
  marginLeft: "-20px",
  marginTop: "50px",
  marginBottom: "50px",
  fontFamily: '"Montserrat", sans-serif'
}

const spanStyle: React.CSSProperties = {
  transition: "all 1s ease",
  display: "inline-block",
  animation: "pulse 5s infinite"
}

const brokenStyle: React.CSSProperties = {
  ...spanStyle,
  color: "rgba(240, 48, 48, 1)"
}

const textMdStyle: React.CSSProperties = {
  letterSpacing: "0.38px",
  fontWeight: 700,
  lineHeight: "20px",
  fontSize: "50px",
  color: "#1177bd",
  textTransform: "none",
  marginBottom: "10px",
  width: "100%",
  fontFamily: '"Montserrat", sans-serif'
}

const textSmStyle: React.CSSProperties = {
  letterSpacing: "0.38px",
  fontWeight: 300,
  lineHeight: "20px",
  fontSize: "14px",
  textTransform: "none",
  color: "rgba(0, 0, 0, 0.5)",
  marginBottom: "0px",
  width: "100%",
  fontFamily: '"Nunito", sans-serif'
}

const linkStyle: React.CSSProperties = {
  color: "#1177bd",
  textDecoration: "underline",
  fontWeight: 700,
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 0,
  font: "inherit"
}
