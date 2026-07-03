import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/config/api"

export default function DashboardManagerMutu() {
  const [jabkerList, setJabkerList] = useState<any[]>([])
  const [skemaCount, setSkemaCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [jabkerRes, skemaRes] = await Promise.all([
        fetch(`${API_BASE_URL}/manager-mutu/jabker`, { headers: { Accept: "application/json", Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` } }),
        fetch(`${API_BASE_URL}/manager-mutu/skema`, { headers: { Accept: "application/json", Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` } }),
      ])

      if (jabkerRes.ok) {
        const j = await jabkerRes.json()
        setJabkerList(Array.isArray(j.data || j) ? j.data || j : [])
      }
      if (skemaRes.ok) {
        const s = await skemaRes.json()
        const data = s.data || s
        setSkemaCount(Array.isArray(data) ? data.length : 0)
      }
    } catch (err: any) { setError(err.message) }
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard Manager Mutu</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Daftar Jabatan Kerja</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 rounded-lg text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400">Total Jabker</p>
          <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">{loading ? "..." : jabkerList.length}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-100 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400">Total Skema</p>
          <p className="text-3xl font-bold text-green-800 dark:text-green-200">{loading ? "..." : skemaCount}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
          <p className="text-sm text-purple-600 dark:text-purple-400">Menunggu TTD</p>
          <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">-</p>
        </div>
      </div>

      {loading ? (
        <div className="border border-dashed border-slate-300 rounded-lg p-12 text-center"><p className="text-slate-400">Memuat...</p></div>
      ) : jabkerList.length === 0 ? (
        <div className="border border-dashed border-slate-300 rounded-lg p-12 text-center"><p className="text-slate-400">Belum ada jabker</p></div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-600 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Nama Jabker</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Jumlah Skema</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(jabkerList as any[]).map((j: any) => (
                <tr key={j.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-200">{j.nama || j.jabatan_kerja || j.name}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{j.jumlah_skema ?? j.skema_count ?? "-"}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Aktif</span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs font-medium">Lihat Detail</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
