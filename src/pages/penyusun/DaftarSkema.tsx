import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/config/api"

interface Skema {
  id: number
  nama: string
  jabker?: string
  jabatan_kerja?: string
  total_peserta?: number
  selesai?: number
  progress?: number
  total?: number
}

export default function DaftarSkema() {
  const [skemaList, setSkemaList] = useState<Skema[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => { loadSkema() }, [])

  const getToken = () => localStorage.getItem("access_token") || ""

  const loadSkema = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/penyusun/skema`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` },
      })
      if (!res.ok) throw new Error("Gagal ambil skema")
      const json = await res.json()
      let data = json.data || json
      setSkemaList(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || "Gagal load")
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Daftar Skema</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Progress peserta per skema</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {loading ? (
        <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
          <p className="text-slate-400 dark:text-slate-500">Memuat data...</p>
        </div>
      ) : skemaList.length === 0 ? (
        <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
          <p className="text-slate-400 dark:text-slate-500">Belum ada skema</p>
        </div>
      ) : (
        <div className="space-y-4">
          {skemaList.map((skema) => {
            const total = skema.total_peserta || skema.total || 0
            const selesai = skema.selesai || 0
            const progress = skema.progress ?? (total > 0 ? Math.round((selesai / total) * 100) : 0)

            return (
              <div key={skema.id} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">{skema.nama}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{skema.jabker || skema.jabatan_kerja || "-"}</p>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {selesai}/{total} peserta
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{progress}% selesai</span>
                  <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs font-medium">
                    Lihat Detail
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
