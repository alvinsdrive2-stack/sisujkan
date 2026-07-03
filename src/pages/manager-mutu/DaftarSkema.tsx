import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/config/api"

export default function DaftarSkemaManagerMutu() {
  const [skemaList, setSkemaList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/manager-mutu/skema`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` },
      })
      if (!res.ok) throw new Error("Gagal ambil skema")
      const json = await res.json()
      const data = json.data || json
      setSkemaList(Array.isArray(data) ? data : [])
    } catch (err: any) { setError(err.message) }
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Daftar Skema</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Monitoring skema dan penilaian</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 rounded-lg text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="border border-dashed border-slate-300 rounded-lg p-12 text-center"><p className="text-slate-400">Memuat...</p></div>
      ) : skemaList.length === 0 ? (
        <div className="border border-dashed border-slate-300 rounded-lg p-12 text-center"><p className="text-slate-400">Belum ada skema</p></div>
      ) : (
        <div className="space-y-4">
          {skemaList.map((skema: any) => (
            <div key={skema.id} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">{skema.nama}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{skema.jabker || skema.jabatan_kerja || "-"}</p>
                </div>
                <span className="text-xs text-slate-400">{skema.reviewed || 0}/{skema.soal || skema.total_soal || 0} soal</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium">Lihat Detail</button>
                <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-medium">Monitoring Progress</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
