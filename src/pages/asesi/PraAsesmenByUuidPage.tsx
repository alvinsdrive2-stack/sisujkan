import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { FullPageLoader } from "@/components/ui/loading-spinner"
import { API_BASE_URL } from "@/config/api"

export default function PraAsesmenByUuidPage() {
  const { uuid } = useParams<{ uuid: string }>()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uuid) { setError("UUID tidak valid"); return }
    ;(async () => {
      try {
        // Logout user sebelumnya dulu — panggil API biar session invalid server-side
        const oldToken = localStorage.getItem("access_token")
        if (oldToken) {
          try {
            await fetch(`${API_BASE_URL}/auth/logout`, {
              method: "POST",
              headers: { "Accept": "application/json", "Authorization": `Bearer ${oldToken}` },
            })
          } catch {
            // Abaikan error logout — tetap lanjut bersih-bersih
          }
        }

        // Bersihkan semua auth state sebelumnya agar tidak konflik dengan token UUID
        localStorage.removeItem("access_token")
        localStorage.removeItem("user_data")
        sessionStorage.removeItem("praasesmen_uuid_data")
        sessionStorage.removeItem("isUuidFlow")

        const res = await fetch(`${API_BASE_URL}/persiapan-asesmen/${uuid}`, {
          headers: { "Accept": "application/json" }
        })
        if (!res.ok) throw new Error("Gagal memuat data")
        const result = await res.json()
        if (!result.success || !result.data?.id_izin) throw new Error("Data tidak ditemukan")
        const { id_izin, jadwal_id, access_token, jenis_kelas_id } = result.data
        if (access_token) localStorage.setItem("access_token", access_token)
        sessionStorage.setItem("praasesmen_uuid_data", JSON.stringify({ id_izin, jadwal_id, jenis_kelas_id }))
        sessionStorage.setItem("isUuidFlow", "true")

        // Redirect ke verifikasi TUK AJJ jika jenis kelas 3
        if (jenis_kelas_id === "3") {
          navigate(`/praasesmen/${id_izin}/verifikasi-tuk`, { replace: true })
        } else {
          navigate(`/praasesmen/${id_izin}/konfirmasi`, { replace: true })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan")
      }
    })()
  }, [uuid, navigate])

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ background: '#fff', border: '1px solid #999', borderRadius: '8px', padding: '40px', textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ fontSize: '16px', color: '#c00', marginBottom: '12px' }}>Gagal Memuat Data</h2>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>{error}</p>
        </div>
      </div>
    )
  }

  return <FullPageLoader text="Mengarahkan ke formulir..." />
}
