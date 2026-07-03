import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { API_BASE_URL } from "@/config/api"

interface Jabker {
  id: number
  nama: string
  jumlah_skema?: number
  status?: string
}

interface Skema {
  id: number
  nama: string
  jabker_id?: number
}

export default function DashboardPenyusun() {
  const navigate = useNavigate()
  const [jabkerList, setJabkerList] = useState<Jabker[]>([])
  const [skemaList, setSkemaList] = useState<Skema[]>([])
  const [totalSoal, setTotalSoal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const getToken = () => localStorage.getItem("access_token") || ""

  const headers = () => ({
    Accept: "application/json",
    Authorization: `Bearer ${getToken()}`,
  })

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      const [jabkerRes, skemaRes] = await Promise.all([
        fetch(`${API_BASE_URL}/penyusun/jabker`, { headers: headers() }),
        fetch(`${API_BASE_URL}/penyusun/skema`, { headers: headers() }),
      ])

      if (!jabkerRes.ok) throw new Error("Gagal ambil jabker")
      if (!skemaRes.ok) throw new Error("Gagal ambil skema")

      const jabkerJson = await jabkerRes.json()
      const skemaJson = await skemaRes.json()

      const jabkerData = jabkerJson.data || jabkerJson || []
      const skemaData = skemaJson.data || skemaJson || []

      setJabkerList(Array.isArray(jabkerData) ? jabkerData : [])
      setSkemaList(Array.isArray(skemaData) ? skemaData : [])
      setTotalSoal(0) // bisa ditambah kalo ada endpoint total soal nanti
    } catch (err: any) {
      setError(err.message || "Gagal load data")
    }
    setLoading(false)
  }

  const totalSkema = skemaList.length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard Penyusun</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Daftar Jabatan Kerja (Jabker)</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400">Total Jabker</p>
          <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">{loading ? "..." : jabkerList.length}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-100 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400">Total Skema</p>
          <p className="text-3xl font-bold text-green-800 dark:text-green-200">{loading ? "..." : totalSkema}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
          <p className="text-sm text-purple-600 dark:text-purple-400">Soal Tersimpan</p>
          <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">{loading ? "..." : totalSoal}</p>
        </div>
      </div>

      {loading ? (
        <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
          <p className="text-slate-400 dark:text-slate-500">Memuat data...</p>
        </div>
      ) : jabkerList.length === 0 ? (
        <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
          <p className="text-slate-400 dark:text-slate-500">Belum ada jabatan kerja</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-600">
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Nama Jabker</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Jumlah Skema</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {jabkerList.map((j: any) => (
                <tr key={j.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-200">{j.nama || j.jabatan_kerja || j.name}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{j.jumlah_skema ?? j.skema_count ?? "-"}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      (j.status || "Aktif") === "Aktif"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                    }`}>
                      {j.status || "Aktif"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => navigate("/penyusun/lihat-soal")}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-xs"
                    >
                      Lihat Detail
                    </button>
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
