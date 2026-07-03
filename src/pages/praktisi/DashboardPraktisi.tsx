import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { API_BASE_URL } from "@/config/api"

export default function DashboardPraktisi() {
  const navigate = useNavigate()
  const [jabkerList, setJabkerList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/praktisi/jabker`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` },
      })
      if (!res.ok) throw new Error("Gagal ambil jabker")
      const json = await res.json()
      const data = json.data || json
      setJabkerList(Array.isArray(data) ? data : [])
    } catch (err: any) { setError(err.message) }
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard Praktisi</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Jabatan Kerja yang diassign ke Anda</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 rounded-lg text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400">Assign Aktif</p>
          <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">{loading ? "..." : jabkerList.length}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-100 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400">Selesai</p>
          <p className="text-3xl font-bold text-green-800 dark:text-green-200">-</p>
        </div>
      </div>

      {loading ? (
        <div className="border border-dashed border-slate-300 rounded-lg p-12 text-center"><p className="text-slate-400">Memuat...</p></div>
      ) : jabkerList.length === 0 ? (
        <div className="border border-dashed border-slate-300 rounded-lg p-12 text-center"><p className="text-slate-400">Belum ada assign</p></div>
      ) : (
        <div className="space-y-4">
          {(jabkerList as any[]).map((j: any) => (
            <div key={j.id} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">{j.nama || j.jabatan_kerja || j.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{j.skema || j.nama_skema || "-"}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                    {j.progress || "Belum mulai"}
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/praktisi/jawab/${j.id}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Mulai / Lanjutkan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
