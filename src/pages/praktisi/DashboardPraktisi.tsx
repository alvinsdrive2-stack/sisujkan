import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { API_BASE_URL } from "@/config/api"

const STEPS = ["APL.01", "IA.04B", "IA.05", "IA.06", "AK.02", "TTD"]
const STEP_API_KEYS = ["apl01", "ia04b", "ia05", "ia06", "ak02", "ttd"]

interface JabkerItem {
  id: string | number
  id_izin?: string | number
  nama?: string
  jabatan_kerja?: string
  name?: string
  skema?: string
  nama_skema?: string
  progress?: string
}

interface StepStatus {
  step: string
  done: boolean
}

function CardSkeleton() {
  return (
    <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 space-y-3">
      <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-600 rounded animate-pulse" />
      <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-600 rounded animate-pulse" />
      <div className="flex gap-2 mt-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-6 w-14 bg-slate-200 dark:bg-slate-600 rounded-full animate-pulse" />
        ))}
      </div>
    </div>
  )
}

export default function DashboardPraktisi() {
  const navigate = useNavigate()
  const [jabkerList, setJabkerList] = useState<JabkerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusMap, setStatusMap] = useState<Record<string, StepStatus[]>>({})
  const [loadingStatus, setLoadingStatus] = useState<Record<string, boolean>>({})
  const [error, setError] = useState("")

  const token = localStorage.getItem("access_token") || ""

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/praktisi/jabker`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Gagal ambil jabker")
      const json = await res.json()
      const data = json.data || json
      const list = Array.isArray(data) ? data : []
      setJabkerList(list)

      // Fetch status for each item in parallel
      const statusMapRaw: Record<string, StepStatus[]> = {}
      const loadingRaw: Record<string, boolean> = {}
      const fetches = list.map(async (item: any) => {
        const id = item.id || item.id_izin
        if (!id) return
        loadingRaw[id] = true
        try {
          const sres = await fetch(`${API_BASE_URL}/praktisi/${id}/status`, {
            headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
          })
          if (sres.ok) {
            const sj = await sres.json()
            const sd = sj.data || sj
            statusMapRaw[id] = STEPS.map((step, i) => {
              const key = STEP_API_KEYS[i]
              const v = sd?.[key]
              return {
                step,
                done: v === true || v === "1" || v === 1 || String(v || "").toLowerCase() === "done",
              }
            })
          }
        } catch {}
        loadingRaw[id] = false
      })
      await Promise.all(fetches)
      setStatusMap(statusMapRaw)
      setLoadingStatus(loadingRaw)
    } catch (err: any) { setError(err.message) }
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard Praktisi</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Jabatan Kerja yang diassign ke Anda</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400">Assign Aktif</p>
          <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">{loading ? "..." : jabkerList.length}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-100 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400">Selesai</p>
          <p className="text-3xl font-bold text-green-800 dark:text-green-200">
            {loading ? "..." : jabkerList.filter(j => {
              const steps = statusMap[String(j.id ?? j.id_izin ?? "")]
              return steps && steps.every(s => s.done)
            }).length}
          </p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-100 dark:border-amber-800">
          <p className="text-sm text-amber-600 dark:text-amber-400">Dalam Progres</p>
          <p className="text-3xl font-bold text-amber-800 dark:text-amber-200">
            {loading ? "..." : jabkerList.filter(j => {
              const steps = statusMap[String(j.id ?? j.id_izin ?? "")]
              return steps && steps.some(s => s.done) && !steps.every(s => s.done)
            }).length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : jabkerList.length === 0 ? (
        <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
          <p className="text-slate-400">Belum ada assign jabatan kerja</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jabkerList.map((j: any) => {
            const id = j.id || j.id_izin
            const steps = statusMap[id]
            const statusLoading = loadingStatus[id]
            const doneCount = steps?.filter(s => s.done).length || 0
            const totalSteps = STEPS.length

            return (
              <div key={id} className="border border-slate-200 dark:border-slate-600 rounded-lg p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1 mr-4">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {j.nama || j.jabatan_kerja || j.name || "-"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {j.skema || j.nama_skema || "-"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Progress bar */}
                    {steps && (
                      <div className="hidden sm:flex items-center gap-1.5">
                        <div className="w-24 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${(doneCount / totalSteps) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {doneCount}/{totalSteps}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => navigate(`/praktisi/jawab/${id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
                    >
                      {doneCount > 0 ? "Lanjutkan" : "Mulai"}
                    </button>
                  </div>
                </div>

                {/* Step indicators */}
                {statusLoading ? (
                  <div className="flex gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-6 w-14 bg-slate-200 dark:bg-slate-600 rounded-full animate-pulse" />
                    ))}
                  </div>
                ) : steps ? (
                  <div className="flex flex-wrap gap-1.5">
                    {steps.map((s) => (
                      <span
                        key={s.step}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          s.done
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                        }`}
                      >
                        {s.done ? (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {s.step}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {STEPS.map((step) => (
                      <span key={step} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
                        {step}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
