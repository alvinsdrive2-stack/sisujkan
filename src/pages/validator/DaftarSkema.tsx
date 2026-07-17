import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { API_BASE_URL } from "@/config/api"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Eye, FileText } from "lucide-react"

function CardSkeleton() {
  return <div className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
}

export default function DaftarSkemaValidator() {
  const navigate = useNavigate()
  const [skemaList, setSkemaList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/validator/skema`, {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Daftar Skema</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Lihat soal dan penilaian penyusun</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : skemaList.length === 0 ? (
        <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">Belum ada skema</p>
        </div>
      ) : (
        <div className="space-y-3">
          {skemaList.map((skema: any) => (
            <div
              key={skema.id}
              className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 transition-all hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {skema.nama || "-"}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {skema.jabker || skema.jabatan_kerja || "-"}
                    </p>
                    {!!(skema.soal || skema.total_soal) && (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {skema.reviewed || 0}/{skema.soal || skema.total_soal} Soal
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => navigate(`/penyusun/lihat-soal/${skema.id}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Lihat Soal
                </button>
                <button
                  onClick={() => navigate(`/penyusun/detail-jabker/${skema.id}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Lihat Penilaian Penyusun
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
