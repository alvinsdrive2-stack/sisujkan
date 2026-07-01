import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import ModularAsesiLayout from "@/components/ModularAsesiLayout"
import { useAuth } from "@/contexts/auth-context"
import { RoleId } from "@/lib/rbac-config"
import { PRAASESMEN_STEPS } from "@/lib/asesmen-steps"
import { ActionButton } from "@/components/ui/ActionButton"

const PERJANJIAN_STEPS = [
  { number: 1, label: 'AK.01', href: '/asesi/perjanjian/:idIzin/ak01' },
  { number: 2, label: 'Selesai', href: '/asesi/perjanjian/ak01-success' },
]

export default function Ak01SuccessPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const jadwalId = (location.state as any)?.jadwalId
  const [countdown, setCountdown] = useState(3)

  const isPerjanjianFlow = location.pathname.includes('/perjanjian/')
  const currentStep = isPerjanjianFlow ? 2 : PRAASESMEN_STEPS.length + 1
  const steps = isPerjanjianFlow ? PERJANJIAN_STEPS : [...PRAASESMEN_STEPS, { number: PRAASESMEN_STEPS.length + 1, label: 'Selesai', href: '' }]

  const isAsesor = user?.role?.id === RoleId.ASESOR

  const handleBackToDashboard = () => {
    if (isAsesor && jadwalId) {
      navigate(`/asesor/asesi/${jadwalId}`)
    } else {
      navigate(isAsesor ? "/asesor/asesi" : "/asesi/dashboard")
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0)

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setTimeout(() => handleBackToDashboard(), 0)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Header */}
      
      {/* Breadcrumb */}
      <div style={{ borderBottom: '1px solid #000', background: '#fff' }}>
        <div style={{ padding: '12px 16px', width: '100%', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#666' }}>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate("/asesi/dashboard")}>Dashboard</span>
            <span>/</span>
            <span>{isPerjanjianFlow ? 'Perjanjian Asesmen' : 'Pra-Asesmen'}</span>
            <span>/</span>
            <span>FR.AK.01</span>
            <span>/</span>
            <span>Selesai</span>
          </div>
        </div>
      </div>

      <ModularAsesiLayout currentStep={currentStep} steps={steps}>
        <div>
        {/* Success Card */}
        <div style={{ width: '100%', background: '#fff', border: '1px solid #000', padding: '40px', textAlign: 'center' }}>
          <style>{`
            @keyframes stroke { 100% { stroke-dashoffset: 0; } }
            @keyframes scale { 0%, 100% { transform: none; } 50% { transform: scale3d(1.1, 1.1, 1); } }
            @keyframes fill { 100% { box-shadow: inset 0px 0px 0px 30px #7ac142; } }
            .checkmark__circle { stroke-dasharray: 166; stroke-dashoffset: 166; stroke-width: 2; stroke-miterlimit: 10; stroke: #7ac142; fill: none; animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards; }
            .checkmark { width: 56px; height: 56px; border-radius: 50%; display: block; stroke-width: 2; stroke: #fff; stroke-miterlimit: 10; margin: 0 auto 20px; box-shadow: inset 0px 0px 0px #7ac142; animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both; }
            .checkmark__check { transform-origin: 50% 50%; stroke-dasharray: 48; stroke-dashoffset: 48; stroke: #fff; stroke-width: 3; animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards; }
          `}</style>

          <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="checkmark__check" fill="none" stroke="#fff" strokeWidth="3" d="m14.1 27.2 7.1 7.2 16.7-16.8"/>
          </svg>

          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', marginBottom: '10px', textTransform: 'uppercase' }}>
            {isPerjanjianFlow ? 'Perjanjian Asesmen Selesai' : 'Pra-Asesmen Selesai'}
          </h2>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px', lineHeight: '1.6' }}>
            {isPerjanjianFlow ? (
              <>Terima kasih! Perjanjian Asesmen telah Anda setujui.<br />Anda akan diarahkan ke dashboard.</>
            ) : (
              <>Terima kasih! Seluruh formulir Pra-Asesmen telah Anda lengkapi.<br />Data Anda akan direview oleh asesor sebelum pelaksanaan asesmen.</>
            )}
          </p>
          <p style={{ fontSize: '12px', color: '#999', marginBottom: '30px' }}>
            Mengalihkan ke Dashboard dalam <span style={{ fontWeight: 'bold', color: '#0066cc' }}>{countdown}</span> detik...
          </p>

          <ActionButton
            variant="primary"
            onClick={handleBackToDashboard}
            style={{ padding: '12px 32px', textTransform: 'uppercase', fontWeight: 'bold' }}
          >
            Kembali ke Dashboard Sekarang
          </ActionButton>
        </div>
        </div>
      </ModularAsesiLayout>
    </div>
  )
}
