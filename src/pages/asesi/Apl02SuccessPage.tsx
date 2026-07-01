import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { API_BASE_URL } from "@/config/api"

function clearUuidSession() {
  const token = localStorage.getItem("access_token")
  // Call API logout to invalidate token on server
  if (token) {
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
    }).catch(() => {})
  }
  localStorage.removeItem("access_token")
  sessionStorage.removeItem("praasesmen_uuid_data")
  sessionStorage.removeItem("isUuidFlow")
}

export default function Apl02SuccessPage() {
  const navigate = useNavigate()
  const { idIzin: idIzinFromUrl } = useParams<{ idIzin: string }>()
  const [countdown, setCountdown] = useState(3)
  const isUuidFlow = !!sessionStorage.getItem("praasesmen_uuid_data")

  useEffect(() => {
    window.scrollTo(0, 0)
    if (isUuidFlow) clearUuidSession()
  }, [isUuidFlow])

  const handleBackToDashboard = () => {
    if (idIzinFromUrl) {
      navigate(`/asesi/praasesmen/${idIzinFromUrl}/mapa01`)
    }
  }

  useEffect(() => {
    if (isUuidFlow) return // No auto-redirect for UUID flow

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
  }, [idIzinFromUrl, isUuidFlow])

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Breadcrumb */}
      <div style={{ borderBottom: '1px solid #000', background: '#fff' }}>
        <div style={{ padding: '12px 16px', width: '100%', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#666' }}>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate("/asesi/dashboard")}>Dashboard</span>
            <span>/</span>
            <span>Pra-Asesmen</span>
            <span>/</span>
            <span>FR APL 02</span>
            <span>/</span>
            <span>Selesai</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ background: '#fff', border: '1px solid #000', borderRadius: '8px', padding: '40px', textAlign: 'center' }}>
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
            Data Berhasil Disimpan
          </h2>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px', lineHeight: '1.6' }}>
            Terima kasih telah mengisi formulir APL 02 (Asesmen Mandiri). Data Anda telah tersimpan dengan baik.
          </p>

          {isUuidFlow ? (
            <div>
              <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.6', marginBottom: '12px' }}>
                Data berhasil dikirim. Sesi Anda telah berakhir.
              </p>
              <p style={{ fontSize: '13px', color: '#999', lineHeight: '1.6' }}>
                Halaman ini sudah dapat ditutup.
              </p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '12px', color: '#999', marginBottom: '30px' }}>
                Mengalihkan ke MAPA 01 dalam <span style={{ fontWeight: 'bold', color: '#0066cc' }}>{countdown}</span> detik...
              </p>
              <button
                onClick={handleBackToDashboard}
                style={{
                  padding: '12px 32px',
                  background: '#0066cc',
                  color: '#fff',
                  fontSize: '13px',
                  cursor: 'pointer',
                  border: 'none',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#0052a3'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,102,204,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#0066cc'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                Lanjut ke MAPA 01 Sekarang
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
