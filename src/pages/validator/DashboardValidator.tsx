import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Search, ChevronLeft, ChevronRight, Users, CheckCircle2, Clock } from "lucide-react"
import { API_BASE_URL } from "@/config/api"

const PAGE_SIZE = 10

interface Jabker {
  id?: number
  id_jabatan_kerja?: string
  nama?: string
  jabatan_kerja?: string
  jumlah_skema?: number
  skema_count?: number
  total_praktisi?: number
  praktisi_selesai?: number
}

interface Skema {
  id: number
  nama: string
  jabker_id?: number
}

export default function DashboardValidator() {
  const navigate = useNavigate()
  const [jabkerList, setJabkerList] = useState<Jabker[]>([])
  const [skemaList, setSkemaList] = useState<Skema[]>([])
  const [totalSoal, setTotalSoal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

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
        fetch(`${API_BASE_URL}/validator/jabker`, { headers: headers() }),
        fetch(`${API_BASE_URL}/validator/skema`, { headers: headers() }),
      ])

      if (!jabkerRes.ok) throw new Error("Gagal ambil jabker")
      if (!skemaRes.ok) throw new Error("Gagal ambil skema")

      const jabkerJson = await jabkerRes.json()
      const skemaJson = await skemaRes.json()

      const jabkerData = jabkerJson.data || jabkerJson || []
      const skemaData = skemaJson.data || skemaJson || []

      setJabkerList(Array.isArray(jabkerData) ? jabkerData : [])
      setSkemaList(Array.isArray(skemaData) ? skemaData : [])
      setTotalSoal(0)
    } catch (err: any) {
      setError(err.message || "Gagal load data")
    }
    setLoading(false)
  }

  // Filter by search
  const filtered = useMemo(() => {
    if (!search.trim()) return jabkerList
    const q = search.toLowerCase()
    return jabkerList.filter(j =>
      (j.jabatan_kerja || j.nama || "").toLowerCase().includes(q) ||
      (j.id_jabatan_kerja || "").toLowerCase().includes(q)
    )
  }, [jabkerList, search])

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  // Reset page on search
  useEffect(() => { setPage(1) }, [search])

  const totalSkema = skemaList.length
  const totalPraktisi = jabkerList.reduce((sum, j) => sum + (j.total_praktisi || 0), 0)
  const totalSelesai = jabkerList.reduce((sum, j) => sum + (j.praktisi_selesai || 0), 0)

  const renderCompletionBadge = (j: Jabker) => {
    const total = j.total_praktisi || 0
    const selesai = j.praktisi_selesai || 0
    if (total === 0) return <span className="text-xs text-slate-400">-</span>
    if (selesai === total) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="w-3 h-3" />
          Selesai
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <Clock className="w-3 h-3" />
        {selesai}/{total}
      </span>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard Validator</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Daftar Jabatan Kerja (Jabker)</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
          <p className="text-sm text-indigo-600 dark:text-indigo-400">Total Praktisi</p>
          <p className="text-3xl font-bold text-indigo-800 dark:text-indigo-200">{loading ? "..." : totalPraktisi}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-100 dark:border-emerald-800">
          <p className="text-sm text-emerald-600 dark:text-emerald-400">Selesai</p>
          <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">{loading ? "..." : totalSelesai}</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari jabker..."
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
          <p className="text-slate-400 dark:text-slate-500">Memuat data...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 mb-1">{search ? "Tidak ada jabker cocok" : "Belum ada jabatan kerja"}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-600 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Nama Jabker</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Skema</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Praktisi</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((j: any) => {
                  const jabkerId = j.id_jabatan_kerja || j.id
                  return (
                    <tr key={jabkerId} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-200 font-medium">{j.jabatan_kerja || j.nama || j.name}</td>
                      <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-300">{j.jumlah_skema ?? j.skema_count ?? "-"}</td>
                      <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-300">{j.total_praktisi ?? "-"}</td>
                      <td className="py-3 px-4 text-center">{renderCompletionBadge(j)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => navigate(`/penyusun/detail-jabker/${jabkerId}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
            <span>{filtered.length} jabker</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
