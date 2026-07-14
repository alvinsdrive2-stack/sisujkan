import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { API_BASE_URL } from "@/config/api"

interface PraktisiItem {
  id: number
  id_jabatan_kerja: string
  id_user: number
  user: {
    id: number
    name: string
    email: string
    phone: string
    noreg: string
  }
  jabatan_kerja: {
    id_jabatan_kerja: string
    jabatan_kerja: string
  }
}

export default function DetailJabker() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [jabkerName, setJabkerName] = useState("")
  const [praktisiList, setPraktisiList] = useState<PraktisiItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const token = localStorage.getItem("access_token") || ""

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      // Fetch jabker info + praktisi in parallel
      const [jabkerRes, praktisiRes] = await Promise.all([
        fetch(`${API_BASE_URL}/penyusun/jabker`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/kan/config/praktisi-by-jabatan/${id}?all=true`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        }),
      ])

      // Resolve jabker name
      if (jabkerRes.ok) {
        const j = await jabkerRes.json()
        const data = j.data || j
        if (Array.isArray(data)) {
          const found = data.find((x: any) => String(x.id) === id || x.id_jabatan_kerja === id)
          setJabkerName(found?.nama || found?.jabatan_kerja || found?.name || id || "")
        }
      }

      // Resolve praktisi list
      if (praktisiRes.ok) {
        const j = await praktisiRes.json()
        const data = j.data || j
        setPraktisiList(Array.isArray(data) ? data : [])
      } else {
        setPraktisiList([])
      }
    } catch (err: any) {
      setError(err.message || "Gagal load data")
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate("/penyusun/dashboard")}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Detail Jabatan Kerja</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{jabkerName || "Memuat..."}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
          <p className="text-slate-400 dark:text-slate-500">Memuat data...</p>
        </div>
      ) : praktisiList.length === 0 ? (
        <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
          <p className="text-slate-400 dark:text-slate-500 mb-2">Belum ada praktisi di jabker ini</p>
          <button
            onClick={() => navigate("/penyusun/assign-praktisi")}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium"
          >
            Assign Praktisi &rarr;
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-600 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">#</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Nama</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">No. Registrasi</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Telepon</th>
              </tr>
            </thead>
            <tbody>
              {praktisiList.map((p, i) => (
                <tr key={p.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="py-3 px-4 text-slate-400 dark:text-slate-500">{i + 1}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-200 font-medium">{p.user?.name || "-"}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs">{p.user?.email || "-"}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs">{p.user?.noreg || "-"}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs">{p.user?.phone || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
