import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { API_BASE_URL } from "@/config/api"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ChevronRight, FileText } from "lucide-react"

interface Jabker {
  id?: number
  id_jabatan_kerja?: string
  nama?: string
  jabatan_kerja?: string
  jumlah_skema?: number
  skema_count?: number
}

function CardSkeleton() {
  return (
    <div className="h-24 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
  )
}

export default function LihatSoal() {
  const navigate = useNavigate()
  const [jabkerList, setJabkerList] = useState<Jabker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const token = localStorage.getItem("access_token") || ""

  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE_URL}/penyusun/jabker`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(j => {
        const d = j.data || j
        setJabkerList(Array.isArray(d) ? d : [])
      })
      .catch(() => setError("Gagal load jabker"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Soal KAN</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Pilih jabatan kerja untuk kelola soal KAN</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : jabkerList.length === 0 ? (
        <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">Belum ada jabatan kerja</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jabkerList.map((j: any) => {
            const jabkerId = j.id_jabatan_kerja || j.id
            return (
              <div
                key={jabkerId}
                onClick={() => navigate(`/penyusun/lihat-soal/${jabkerId}`)}
                className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 transition-all hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {j.nama || j.jabatan_kerja || j.name || "-"}
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">{jabkerId}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {j.jumlah_skema ?? j.skema_count ?? 0} Skema
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0 mt-2" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
