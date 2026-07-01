import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, Clock, Calendar, MapPin } from "lucide-react"
import { useListAsesi } from "@/hooks/useKegiatan"
import { SimpleSpinner } from "@/components/ui/loading-spinner"
import { useEffect, useState } from "react"
import { kegiatanService, KegiatanAsesor } from "@/lib/kegiatan-service"
import { API_BASE_URL } from "@/config/api"
import { formatShortDateWIB, formatTimeWIB } from "@/lib/date-utils"

interface CountdownTime {
  days: number
  hours: number
  minutes: number
  seconds: number
  isPast: boolean
}

function useCountdown(targetDate: string): CountdownTime {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false
  })

  useEffect(() => {
    // Handle empty date
    if (!targetDate) {
      setTimeLeft({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isPast: false
      })
      return
    }

    const target = new Date(targetDate).getTime()

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const difference = target - now

      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isPast: true
        }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        isPast: false
      }
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  return timeLeft
}

export default function ListAsesiAsesor() {
  const { jadwalId } = useParams<{ jadwalId: string }>()
  const navigate = useNavigate()
  const { asesiList, isLoading: asesiLoading, error } = useListAsesi(jadwalId || "")
  const [kegiatan, setKegiatan] = useState<KegiatanAsesor | null>(null)
  const [_kegiatanLoading, setKegiatanLoading] = useState(true)
  const [jenjang, setJenjang] = useState<string>('0')
  const [asesiMeta, setAsesiMeta] = useState<Record<string, { jenjang: string; metode: string }>>({})

  // Fetch kegiatan detail — loop through pages until found
  useEffect(() => {
    const fetchKegiatan = async () => {
      try {
        let currentPage = 1
        let found = null as KegiatanAsesor | null

        while (!found) {
          const response = await kegiatanService.getKegiatanAsesor(currentPage)
          const kegiatanArray = response.data
          if (!kegiatanArray || kegiatanArray.length === 0) break
          found = kegiatanArray.find(k => k.jadwal_id === jadwalId) || null
          currentPage++
        }

        if (found) {
          setKegiatan(found)
        }
      } catch (err) {
        console.error('Error fetching kegiatan:', err)
      } finally {
        setKegiatanLoading(false)
      }
    }
    fetchKegiatan()
  }, [jadwalId])

  // Fetch jenjang from data-dokumen API
  useEffect(() => {
    const fetchJenjang = async () => {
      if (asesiList.length === 0) return

      const firstAsesiId = asesiList[0].id_izin
      const token = localStorage.getItem("access_token")

      try {
        const response = await fetch(`${API_BASE_URL}/asesmen/${firstAsesiId}/data-dokumen`, {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const result = await response.json()
          if (result.message === "Success" && result.data) {
            setJenjang(result.data.jenjang || '0')
          }
        }
      } catch (err) {
        console.error('Error fetching jenjang:', err)
      }
    }

    fetchJenjang()
  }, [asesiList])

  // Fetch jenjang + metode per-asesi (for step check on click)
  useEffect(() => {
    if (asesiLoading || asesiList.length === 0) return

    const token = localStorage.getItem("access_token")
    const fetchMeta = async () => {
      const results: Record<string, { jenjang: string; metode: string }> = {}
      for (const asesi of asesiList) {
        try {
          const res = await fetch(`${API_BASE_URL}/asesmen/${asesi.id_izin}/data-dokumen`, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } })
          if (res.ok) {
            const json = await res.json()
            results[asesi.id_izin] = {
              jenjang: json.data?.jenjang || '0',
              metode: json.data?.metode || '',
            }
          }
        } catch { /* skip */ }
      }
      setAsesiMeta(results)
    }
    fetchMeta()
  }, [asesiLoading, asesiList])

  // Always call hook, use empty string as fallback
  const countdown = useCountdown(kegiatan?.tanggal_uji || "")

  // Group asesi by skema
  const skemaMap = new Map<string, string>()
  if (kegiatan?.asesi) {
    for (const a of kegiatan.asesi) {
      skemaMap.set(a.id_izin, a.skema?.nama || '')
    }
  }
  const groupedAsesi = asesiList.reduce((groups, asesi) => {
    const skema = skemaMap.get(asesi.id_izin) || 'Lainnya'
    const existing = groups.find(g => g.skema === skema)
    if (existing) {
      existing.asesi.push(asesi)
    } else {
      groups.push({ skema, asesi: [asesi] })
    }
    return groups
  }, [] as { skema: string; asesi: typeof asesiList }[])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="hover:bg-primary/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Daftar Asesi</h2>
          <p className="text-slate-600 dark:text-slate-400">Kelola penilaian asesi pada jadwal ini</p>
        </div>
      </div>

      {/* Kegiatan Detail */}
      {kegiatan && (
        <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
          <div className="flex gap-6">
            {/* Left: Kegiatan Info (70%) */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{kegiatan.nama_kegiatan}</h3>
                {kegiatan.is_started_praasesmen === "0" && (
                  <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300">
                    Belum Mulai
                  </Badge>
                )}
                {kegiatan.is_started_praasesmen === "1" && (
                  <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300">
                    Pra-Asesmen
                  </Badge>
                )}
                {kegiatan.is_started === "1" && (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300">
                    Asesmen
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{kegiatan.tuk.nama} • {kegiatan.asesor.nama}{kegiatan.asesor2 ? ` & ${kegiatan.asesor2.nama}` : ''}</p>

              <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  {formatShortDateWIB(kegiatan.tanggal_uji)}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  {formatTimeWIB(kegiatan.tanggal_uji)}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  {kegiatan.tuk.alamat}
                </div>
              </div>
            </div>

            {/* Right: Countdown (30%) */}
            <div className="w-[18%] flex items-center justify-center">
              {countdown && !countdown.isPast && (
                <div className="relative">
                  {/* Clock-like container with glow */}
                  <div className="relative p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/10 shadow-lg shadow-primary/5">
                    {/* Animated ring */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 animate-pulse" />

                    <div className="relative text-center">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Clock className="w-3 h-3 text-primary animate-pulse" />
                        <span className="text-[10px] font-medium text-primary/80 uppercase tracking-wider">Countdown</span>
                      </div>

                      {/* Time display */}
                      <div className="flex items-baseline justify-center gap-1">
                        {countdown.days > 0 && (
                          <>
                            <span className="text-3xl font-black bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                              {countdown.days}
                            </span>
                            <span className="text-sm font-bold text-primary/60">d</span>
                            <span className="text-2xl font-bold text-primary/40">:</span>
                          </>
                        )}
                        <span className="text-3xl font-black bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent tabular-nums">
                          {String(countdown.hours).padStart(2, '0')}
                        </span>
                        <span className="text-lg font-bold text-primary/40 animate-pulse">:</span>
                        <span className="text-3xl font-black bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent tabular-nums">
                          {String(countdown.minutes).padStart(2, '0')}
                        </span>
                        <span className="text-lg font-bold text-primary/40 animate-pulse">:</span>
                        <span className="text-3xl font-black bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent tabular-nums">
                          {String(countdown.seconds).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Progress bar (seconds) */}
                      <div className="mt-2 h-1 bg-primary/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-1000 ease-linear"
                          style={{ width: `${((60 - countdown.seconds) / 60) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {countdown && countdown.isPast && (
                <div className="relative">
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-white" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Sedang Berjalan</div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">Asesmen dimulai</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Asesi List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Daftar Asesi
            {asesiLoading && <SimpleSpinner size="sm" className="ml-2 text-primary" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-center py-8 text-red-500">
              Gagal memuat daftar asesi: {error}
            </div>
          )}

          {!asesiLoading && !error && asesiList.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              Tidak ada asesi untuk jadwal ini
            </div>
          )}

          <div className="space-y-4">
            {groupedAsesi.map((group) => (
              <div key={group.skema}>
                <h5 className="text-sm font-bold text-primary mb-2 px-1 uppercase tracking-wider">
                  {group.skema}
                </h5>
                <div className="space-y-2">
                  {group.asesi.map((asesi, idx) => (
                    <div
                      key={asesi.id_izin}
                      className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer bg-white dark:bg-slate-800"
                      onClick={async () => {
                        sessionStorage.setItem('validNavigationEntry', 'true')
                        const meta = asesiMeta[asesi.id_izin] || { jenjang: jenjang, metode: '' }
                        const jenjangId = parseInt(meta.jenjang || "0")
                        const isLowJenjang = jenjangId < 4
                        const isPortofolio = meta.metode?.toLowerCase() === 'portofolio'

                        // Dynamic tahap 2 steps
                        let tahap2Steps: { key: string; path: string }[] = []
                        if (isPortofolio) {
                          tahap2Steps = [
                            { key: 'ia08', path: `/asesi/asesmen/${asesi.id_izin}/ia08` },
                            { key: 'ia09', path: `/asesi/asesmen/${asesi.id_izin}/ia09` },
                            { key: 'ia10', path: `/asesi/asesmen/${asesi.id_izin}/ia10` },
                            { key: 'ak02', path: `/asesi/asesmen/${asesi.id_izin}/ak02` },
                            { key: 'ak03', path: `/asesi/asesmen/${asesi.id_izin}/ak03` },
                          ]
                        } else if (isLowJenjang) {
                          tahap2Steps = [
                            { key: 'ia01', path: `/asesi/asesmen/${asesi.id_izin}/ia01` },
                            { key: 'ia02', path: `/asesi/asesmen/${asesi.id_izin}/ia02` },
                            { key: 'ia03', path: `/asesi/asesmen/${asesi.id_izin}/ia03` },
                            { key: 'upload-tugas', path: `/asesi/asesmen/${asesi.id_izin}/upload-tugas` },
                            { key: 'ia05', path: `/asesi/asesmen/${asesi.id_izin}/ia05` },
                            { key: 'ak02', path: `/asesi/asesmen/${asesi.id_izin}/ak02` },
                            { key: 'ak03', path: `/asesi/asesmen/${asesi.id_izin}/ak03` },
                          ]
                        } else {
                          tahap2Steps = [
                            { key: 'ia04a', path: `/asesi/asesmen/${asesi.id_izin}/ia04a` },
                            { key: 'upload-tugas', path: `/asesi/asesmen/${asesi.id_izin}/upload-tugas` },
                            { key: 'ia04b', path: `/asesi/asesmen/${asesi.id_izin}/ia04b` },
                            { key: 'ia05', path: `/asesi/asesmen/${asesi.id_izin}/ia05` },
                            { key: 'ak02', path: `/asesi/asesmen/${asesi.id_izin}/ak02` },
                            { key: 'ak03', path: `/asesi/asesmen/${asesi.id_izin}/ak03` },
                          ]
                        }

                        // Check steps: API path = /asesmen/{idIzin}/{stepKey}, nav path = /asesi/asesmen/{idIzin}/{stepKey}
                        const token = localStorage.getItem("access_token")
                        const headers = { "Accept": "application/json", "Authorization": `Bearer ${token}` }
                        for (const step of tahap2Steps) {
                          try {
                            const apiPath = `/asesmen/${asesi.id_izin}/${step.key}`
                            const res = await fetch(`${API_BASE_URL}${apiPath}`, { headers })
                            if (!res.ok) continue
                            const json = await res.json()
                            const filled = json.data?.barcodes?.asesi?.url ||
                              json.data?.units?.some?.((u: any) => u.subunits?.some?.((s: any) => !!s.barcodes?.asesi?.url))
                            if (!filled) {
                              navigate(step.path, { state: { fromInternal: true } })
                              return
                            }
                          } catch { /* continue */ }
                        }
                        // All filled → navigate to default page
                        navigate(`/asesi/asesmen/${asesi.id_izin}/ia04a`, { state: { fromInternal: true } })
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{idx + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 dark:text-slate-100">{asesi.nama}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">ID: {asesi.id_izin}</p>
                          </div>
                        </div>

                        {/* Kompeten Indicator Only - Glowing Green */}
                        {asesi.kompeten === "K" && (
                          <div className="relative">
                            {/* Glow effect */}
                            <div className="absolute inset-0 rounded-full bg-emerald-400 blur-md opacity-50 animate-pulse" />
                            {/* The dot */}
                            <div className="relative w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
