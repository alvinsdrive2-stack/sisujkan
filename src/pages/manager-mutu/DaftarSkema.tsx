import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Search, ChevronLeft, ChevronRight, CheckCircle2, Clock } from "lucide-react"
import { API_BASE_URL } from "@/config/api"

const PAGE_SIZE = 10

interface Skema {
  id: number
  nama: string
  jabker?: string
  jabatan_kerja?: string
  total_praktisi?: number
  praktisi_selesai?: number
  total_peserta?: number
  selesai?: number
  progress?: number
  total?: number
}

export default function DaftarSkema() {
  const navigate = useNavigate()
  const [skemaList, setSkemaList] = useState<Skema[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

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

  const filtered = useMemo(() => {
    if (!search.trim()) return skemaList
    const q = search.toLowerCase()
    return skemaList.filter(s =>
      (s.nama || s.jabatan_kerja || "").toLowerCase().includes(q)
    )
  }, [skemaList, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  useEffect(() => { setPage(1) }, [search])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Daftar Skema</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Progress peserta per skema</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {/* Search bar */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari skema..."
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
          <p className="text-slate-400 dark:text-slate-500">Memuat data...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
          <p className="text-slate-400 dark:text-slate-500">{search ? "Tidak ada skema cocok" : "Belum ada skema"}</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginated.map((skema) => {
              const total = skema.total_praktisi ?? skema.total_peserta ?? skema.total ?? 0
              const selesai = skema.praktisi_selesai ?? skema.selesai ?? 0
              const progress = total > 0 ? Math.round((selesai / total) * 100) : 0

              return (
                <div key={skema.id} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/manager-mutu/soal-kosong/${skema.id}`)}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">{skema.nama || skema.jabatan_kerja}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{skema.jabker || skema.jabatan_kerja || "-"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {total > 0 && (
                        selesai === total
                          ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><CheckCircle2 className="w-3 h-3" />Selesai</span>
                          : <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"><Clock className="w-3 h-3" />{selesai}/{total}</span>
                      )}
                      <span className="text-xs text-slate-400">{total} peserta</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${progress === 100 ? 'bg-green-500' : progress > 0 ? 'bg-blue-500' : 'bg-slate-300'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-slate-500">{progress}% selesai</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/manager-mutu/soal-kosong/${skema.id}`) }}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs font-medium"
                    >
                      Lihat Detail MUK →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
              <span>{filtered.length} skema</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
