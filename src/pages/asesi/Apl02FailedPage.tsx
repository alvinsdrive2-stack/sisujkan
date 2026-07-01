import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { API_BASE_URL } from "@/config/api"

function clearSession() {
  const token = localStorage.getItem("access_token")
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

export default function Apl02FailedPage() {
  const navigate = useNavigate()
  const isUuidFlow = !!sessionStorage.getItem("praasesmen_uuid_data")

  useEffect(() => {
    window.scrollTo(0, 0)
    clearSession()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <div style={{ borderBottom: '1px solid #000', background: '#fff' }}>
        <div style={{ padding: '12px 16px', width: '100%', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#666' }}>
            <span>Pra-Asesmen</span>
            <span>/</span>
            <span>FR APL 02</span>
            <span>/</span>
            <span style={{ color: '#c00' }}>Tidak Kompeten</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ background: '#fff', border: '1px solid #000', borderRadius: '8px', padding: '40px', textAlign: 'center' }}>
          <style>{`
            @keyframes stroke-x { 100% { stroke-dashoffset: 0; } }
            @keyframes scale-x { 0%, 100% { transform: none; } 50% { transform: scale3d(1.1, 1.1, 1); } }
            @keyframes fill-x { 100% { box-shadow: inset 0px 0px 0px 30px #cc0000; } }
            .xmark__circle { stroke-dasharray: 166; stroke-dashoffset: 166; stroke-width: 2; stroke-miterlimit: 10; stroke: #cc0000; fill: none; animation: stroke-x 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards; }
            .xmark { width: 56px; height: 56px; border-radius: 50%; display: block; stroke-width: 2; stroke: #fff; stroke-miterlimit: 10; margin: 0 auto 20px; box-shadow: inset 0px 0px 0px #cc0000; animation: fill-x .4s ease-in-out .4s forwards, scale-x .3s ease-in-out .9s both; }
            .xmark__x1 { transform-origin: 50% 50%; stroke-dasharray: 48; stroke-dashoffset: 48; stroke: #fff; stroke-width: 3; animation: stroke-x 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards; }
            .xmark__x2 { transform-origin: 50% 50%; stroke-dasharray: 48; stroke-dashoffset: 48; stroke: #fff; stroke-width: 3; animation: stroke-x 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.9s forwards; }
          `}</style>

          <svg className="xmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="xmark__circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="xmark__x1" fill="none" stroke="#fff" strokeWidth="3" d="m16 16 20 20"/>
            <path className="xmark__x2" fill="none" stroke="#fff" strokeWidth="3" d="m36 16 -20 20"/>
          </svg>

          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#c00', marginBottom: '10px', textTransform: 'uppercase' }}>
            Tidak Kompeten
          </h2>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px', lineHeight: '1.6' }}>
            Berdasarkan hasil asesmen mandiri (APL 02), Anda dinyatakan <strong style={{ color: '#c00' }}>tidak kompeten</strong>.
          </p>

          {isUuidFlow ? (
            <div>
              <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.6', marginBottom: '12px' }}>
                Sesi Anda telah berakhir.
              </p>
              <p style={{ fontSize: '13px', color: '#999', lineHeight: '1.6' }}>
                Halaman ini sudah dapat ditutup.
              </p>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '12px 32px',
                background: '#cc0000',
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
                e.currentTarget.style.background = '#a00'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(204,0,0,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#cc0000'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              Kembali ke Login
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
