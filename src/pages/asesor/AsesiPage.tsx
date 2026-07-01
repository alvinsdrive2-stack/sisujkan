import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Clock, Calendar, MapPin, UserCheck, Check, AlertCircle, FileText } from "lucide-react"
import { useKegiatanAsesorList, useListAsesi, KegiatanAsesor } from "@/hooks/useKegiatan"
import { useBatchAbsenData, AbsenData } from "@/hooks/useAbsenData"
import { kegiatanService } from "@/lib/kegiatan-service"
import { SimpleSpinner } from "@/components/ui/loading-spinner"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useDokumenAsesiModal } from "@/contexts/DokumenAsesiContext"
import { API_BASE_URL } from "@/config/api"

interface CountdownTime {
  days: number
  hours: number
  minutes: number
  seconds: number
  isPast: boolean
}

// Helper function to calculate countdown (non-hook version for use in render)
function calculateCountdown(targetDate: string): CountdownTime {
  if (!targetDate) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: false
    }
  }

  const target = new Date(targetDate).getTime()
  const now = new Date().getTime()
  const difference = target - now

  if (difference <= 0) {
    const elapsed = Math.abs(difference)
    const totalMinutes = Math.floor(elapsed / (1000 * 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    const seconds = Math.floor((elapsed % (1000 * 60)) / 1000)

    return {
      days: 0,
      hours,
      minutes,
      seconds,
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

export default function AsesiPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { jadwalId } = useParams<{ jadwalId: string }>()
  const { openModal: openDokumenAsesiModal } = useDokumenAsesiModal()

  // Debug logging
  console.log('[AsesiPage] Render:', { jadwalId, userName: user?.name, userRole: user?.role?.name })

  const { kegiatans, isLoading: kegiatanLoading, error: kegiatanError } = useKegiatanAsesorList()
  const [allKegiatans, setAllKegiatans] = useState<KegiatanAsesor[]>(kegiatans)
  const currentKegiatan = allKegiatans.find(k => k.jadwal_id === jadwalId) || allKegiatans[0]
  const { asesiList, isLoading: asesiLoading, error: asesiError } = useListAsesi(jadwalId || "")

  // Keep sync with hook data + fallback fetch all pages if kegiatan not found on page 1
  useEffect(() => {
    setAllKegiatans(kegiatans)
  }, [kegiatans])

  useEffect(() => {
    if (kegiatanLoading) return
    const found = allKegiatans.find(k => k.jadwal_id === jadwalId)
    if (found) return
    if (allKegiatans.length === 0 && !kegiatanError) return

    const fetchAllPages = async () => {
      let page = 2
      let all = [...allKegiatans]
      while (true) {
        try {
          const response = await kegiatanService.getKegiatanAsesor(page)
          if (!response.data || response.data.length === 0) break
          all = [...all, ...response.data]
          const found = all.find(k => k.jadwal_id === jadwalId)
          if (found) {
            setAllKegiatans(all)
            return
          }
          page++
        } catch {
          break
        }
      }
      setAllKegiatans(all)
    }
    fetchAllPages()
  }, [kegiatanLoading, jadwalId])

  // State for countdowns - keyed by jadwal_id
  const [countdowns, setCountdowns] = useState<Record<string, CountdownTime>>({})

  // Update countdowns every second
  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdowns: Record<string, CountdownTime> = {}
      allKegiatans.forEach(kegiatan => {
        newCountdowns[kegiatan.jadwal_id] = calculateCountdown(kegiatan.tanggal_uji || "")
      })
      setCountdowns(newCountdowns)
    }

    updateCountdowns()
    const timer = setInterval(updateCountdowns, 1000)
    return () => clearInterval(timer)
  }, [allKegiatans.length]) // Only re-run when number of kegiatans changes, not array reference

  // Get asesi IDs for absen data fetch
  const asesiIds = asesiList.map(a => a.id_izin)
  const { absenData } = useBatchAbsenData(asesiIds, asesiIds.length > 0)

  // State for asesor IDs and jenjang per-asesi
  const [asesorIds, setAsesorIds] = useState<{ id_asesor_1: number | null; id_asesor_2: number | null }>({
    id_asesor_1: null,
    id_asesor_2: null,
  })
  const [jenjangMap, setJenjangMap] = useState<Record<string, string>>({})
  const [metodeMap, setMetodeMap] = useState<Record<string, string>>({})
  const [tahapMap, setTahapMap] = useState<Record<string, number>>({})

  // Fetch asesor IDs, jenjang, and metode from data-dokumen endpoint (per-asesi)
  useEffect(() => {
    const fetchAsesorData = async () => {
      if (asesiList.length === 0) return

      const token = localStorage.getItem("access_token")

      try {
        // Fetch jenjang & metode for each asesi in parallel
        const results = await Promise.all(
          asesiList.map(async (asesi) => {
            try {
              const response = await fetch(`${API_BASE_URL}/praasesmen/${asesi.id_izin}/data-dokumen`, {
                headers: {
                  "Accept": "application/json",
                  "Authorization": `Bearer ${token}`,
                },
              })

              if (response.ok) {
                const result = await response.json()
                if (result.message === "Success" && result.data) {
                  return {
                    id_izin: asesi.id_izin,
                    id_asesor_1: result.data.id_asesor_1,
                    id_asesor_2: result.data.id_asesor_2,
                    jenjang: result.data.jenjang || '0',
                    metode: (result.data.metode || '').toLowerCase(),
                    tahap: result.data.tahap ?? 0,
                  }
                }
              }
            } catch (err) {
              console.error('Error fetching asesor data:', err)
            }
            return null
          })
        )

        const validResults = results.filter((r): r is NonNullable<typeof r> => r !== null)
        if (validResults.length > 0) {
          setAsesorIds({
            id_asesor_1: validResults[0].id_asesor_1,
            id_asesor_2: validResults[0].id_asesor_2,
          })
          const newJenjangMap: Record<string, string> = {}
          const newMetodeMap: Record<string, string> = {}
          const newTahapMap: Record<string, number> = {}
          validResults.forEach(r => {
            newJenjangMap[r.id_izin] = r.jenjang
            newMetodeMap[r.id_izin] = r.metode
            newTahapMap[r.id_izin] = r.tahap
          })
          setJenjangMap(newJenjangMap)
          setMetodeMap(newMetodeMap)
          setTahapMap(newTahapMap)
        }
      } catch (err) {
        console.error('Error fetching asesor data:', err)
      }
    }

    fetchAsesorData()
  }, [asesiList])

  // Determine if user is asesor1 or asesor2
  const isAsesor1 = asesorIds.id_asesor_1 === Number(user?.id)
  const isAsesor2 = asesorIds.id_asesor_2 === Number(user?.id)
  const asesorRole = isAsesor1 ? 1 : isAsesor2 ? 2 : null

  // Helper function to get asesi absen status color
  const getAsesiAbsenStatus = (absen: AbsenData | undefined, phase: 'asesmen' | 'praasesmen') => {
    if (!absen) return 'yellow'

    if (phase === 'asesmen') {
      const akhir = absen.url_absen_asesi_akhir
      // If akhir has value -> green, otherwise yellow
      return akhir ? 'green' : 'yellow'
    } else {
      const akhir = absen.url_absen_asesi_pra_akhir
      return akhir ? 'green' : 'yellow'
    }
  }

  // Helper function to get asesor review status
  const getAsesorReviewStatus = (absen: AbsenData | undefined, phase: 'asesmen' | 'praasesmen', asesorNum: 1 | 2) => {
    if (!absen || !asesorNum) return 'Butuh ditinjau'

    if (phase === 'asesmen') {
      const awal = asesorNum === 1 ? absen.url_absen_asesor1_awal : absen.url_absen_asesor2_awal
      const akhir = asesorNum === 1 ? absen.url_absen_asesor1_akhir : absen.url_absen_asesor2_akhir
      if (akhir) return 'Sudah asesmen'
      if (awal) return 'Belum asesmen'
      return 'Butuh Ditinjau'
    } else if (phase === 'praasesmen') {
      const awal = asesorNum === 1 ? absen.url_absen_asesor1_pra_awal : absen.url_absen_asesor2_pra_awal
      const akhir = asesorNum === 1 ? absen.url_absen_asesor1_pra_akhir : absen.url_absen_asesor2_pra_akhir

      if (akhir) return 'Sudah Praasesmen'
      if (awal) return 'Belum Praasesmen'
      return 'Butuh Praasesmen'
    } else {
      const awal = asesorNum === 1 ? absen.url_absen_asesor1_pra_awal : absen.url_absen_asesor2_pra_awal
      const akhir = asesorNum === 1 ? absen.url_absen_asesor1_pra_akhir : absen.url_absen_asesor2_pra_akhir

      if (akhir) return 'Tinjau'
      if (awal) return 'Tinjau'
      return 'Tinjau'
    }
  }

  // Helper function to get status badge style
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Sudah asesmen':
      case 'Sudah Praasesmen':
        return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
      case 'Belum asesmen':
      case 'Belum Praasesmen':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      case 'Butuh Ditinjau':
      case 'Butuh Praasesmen':
      case 'Tinjau':
        return 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      default:
        return 'bg-slate-100 text-slate-700 hover:bg-slate-200'
    }
  }

  const handleViewAsesi = async (idIzin: string) => {
    const tahap = tahapMap[idIzin] ?? currentKegiatan?.tahap ?? 0

    // Mark valid navigation entry for asesmen routes
    sessionStorage.setItem('validNavigationEntry', 'true')

    if (tahap === 2) {
      // Check steps in order, navigate to first unfilled
      const token = localStorage.getItem("access_token")
      const jenjangId = parseInt(jenjangMap[idIzin] || "0")
      const metode = (metodeMap[idIzin] || '').toLowerCase()
      const isLowJenjang = jenjangId < 4
      const isPortofolio = metode === 'portofolio'

      const baseSteps: { key: string; path: string; apiPath: string }[] = []
      if (isPortofolio) {
        baseSteps.push({ key: 'ak01', path: `/perjanjian/${idIzin}/ak01`, apiPath: `/praasesmen/${idIzin}/ak01` })
        baseSteps.push({ key: 'ia08', path: `/asesmen/${idIzin}/ia08`, apiPath: `/asesmen/${idIzin}/ia08` })
        baseSteps.push({ key: 'ia09', path: `/asesmen/${idIzin}/ia09`, apiPath: `/asesmen/${idIzin}/ia09` })
        baseSteps.push({ key: 'ia10', path: `/asesmen/${idIzin}/ia10`, apiPath: `/asesmen/${idIzin}/ia10` })
      } else if (isLowJenjang) {
        baseSteps.push({ key: 'ak01', path: `/perjanjian/${idIzin}/ak01`, apiPath: `/praasesmen/${idIzin}/ak01` })
        baseSteps.push({ key: 'ia01', path: `/asesmen/${idIzin}/ia01`, apiPath: `/asesmen/${idIzin}/ia01` })
        baseSteps.push({ key: 'ia02', path: `/asesmen/${idIzin}/ia02`, apiPath: `/asesmen/${idIzin}/ia02` })
        baseSteps.push({ key: 'ia03', path: `/asesmen/${idIzin}/ia03`, apiPath: `/asesmen/${idIzin}/ia03` })
      } else {
        baseSteps.push({ key: 'ak01', path: `/perjanjian/${idIzin}/ak01`, apiPath: `/praasesmen/${idIzin}/ak01` })
        baseSteps.push({ key: 'ia04a', path: `/asesmen/${idIzin}/ia04a`, apiPath: `/asesmen/${idIzin}/ia04a` })
        baseSteps.push({ key: 'ia04b', path: `/asesmen/${idIzin}/ia04b`, apiPath: `/asesmen/${idIzin}/ia04b` })
        baseSteps.push({ key: 'ia05', path: `/asesmen/${idIzin}/ia05`, apiPath: `/asesmen/${idIzin}/ia05` })
      }

      for (const step of baseSteps) {
        try {
          const res = await fetch(`${API_BASE_URL}${step.apiPath}`, {
            headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
          })

          if (step.key === 'ak01') {
            if (!res.ok) {
              navigate(`/asesi${step.path}`, { state: { fromInternal: true } })
              return
            }
            const json = await res.json()
            if (!json.data?.barcodes?.asesi?.url) {
              navigate(`/asesi${step.path}`, { state: { fromInternal: true } })
              return
            }
            continue
          }

          if (!res.ok) continue
          const json = await res.json()
          const filled = json.data?.barcodes?.asesi?.url ||
            json.data?.units?.some?.((u: any) => u.subunits?.some?.((s: any) => !!s.barcodes?.asesi?.url))
          if (!filled) {
            navigate(`/asesi${step.path}`, { state: { fromInternal: true } })
            return
          }
        } catch { /* continue */ }
      }

      // All filled → fallback to AK.01
      navigate(`/asesi/perjanjian/${idIzin}/ak01`, { state: { fromInternal: true } })
    } else {
      // Asesor route — DashboardLayout (asesor navbar + sidebar)
      navigate(`/asesi/praasesmen/${idIzin}/apl01`, { state: { fromInternal: true } })
    }
  }

  if (kegiatanLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <SimpleSpinner size="lg" className="mx-auto mb-4 text-primary" />
          <p className="text-slate-600">Memuat data kegiatan...</p>
        </div>
      </div>
    )
  }

  // Group asesi by skema
  const skemaMap = new Map<string, string>()
  if (currentKegiatan?.asesi) {
    for (const a of currentKegiatan.asesi) {
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

  if (kegiatanError && !currentKegiatan) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Gagal memuat kegiatan: {kegiatanError}</p>
        <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
      </div>
    )
  }

  if (!allKegiatans || allKegiatans.length === 0) {
    return (
      <div className="text-center py-12">
        <UserCheck className="w-16 h-16 mx-auto mb-4 text-slate-400" />
        <h3 className="text-xl font-semibold text-slate-800 mb-2">Tidak Ada Kegiatan</h3>
        <p className="text-slate-600">Anda belum memiliki jadwal asesmen yang ditugaskan</p>
      </div>
    )
  }

  if (!currentKegiatan) {
    return (
      <div className="text-center py-12">
        <UserCheck className="w-16 h-16 mx-auto mb-4 text-slate-400" />
        <h3 className="text-xl font-semibold text-slate-800 mb-2">Kegiatan Tidak Ditemukan</h3>
        <p className="text-slate-600">Kegiatan dengan ID tersebut tidak tersedia</p>
        <Button onClick={() => navigate("/asesor/dashboard")} className="mt-4">Kembali ke Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Daftar Asesi</h2>
        <p className="text-slate-600">Asesi yang ditugaskan pada jadwal asesmen ini</p>
      </div>

      {/* Kegiatan Detail - Single */}
      {currentKegiatan && (
        <div className="p-6 border border-slate-200 rounded-xl bg-white">
          {(() => {
            const cd = countdowns[currentKegiatan.jadwal_id] || { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false }
            return (
              <div className="flex gap-6">
                {/* Left: Kegiatan Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-slate-800">{currentKegiatan.nama_kegiatan}</h3>
                    {currentKegiatan.tahap === 0 && (
                      <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                        Belum Mulai
                      </Badge>
                    )}
                    {currentKegiatan.tahap === 1 && (
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                        Pra-Asesmen
                      </Badge>
                    )}
                    {currentKegiatan.tahap === 2 && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                        Asesmen
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 mb-3">{currentKegiatan.tuk?.nama} • {currentKegiatan.asesor?.nama}{currentKegiatan.asesor2 ? ` & ${currentKegiatan.asesor2.nama}` : ''}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary" />
                      {new Date(currentKegiatan.tanggal_uji || '').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary" />
                      {new Date(currentKegiatan.tanggal_uji || '').toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" />
                      {currentKegiatan.tuk?.alamat}
                    </div>
                  </div>
                </div>

                {/* Right: Countdown */}
                <div className="w-[18%] flex flex-col items-center justify-center gap-3">
                  {!cd.isPast ? (
                    <div className="relative">
                      <div className="relative p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/10 shadow-lg shadow-primary/5">
                        <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 animate-pulse" />

                        <div className="relative text-center">
                          <div className="flex items-center justify-center gap-1 mb-2">
                            <Clock className="w-3 h-3 text-primary animate-pulse" />
                            <span className="text-[10px] font-medium text-primary/80 uppercase tracking-wider">Countdown</span>
                          </div>

                          <div className="flex items-baseline justify-center gap-1">
                            {cd.days > 0 && (
                              <>
                                <span className="text-3xl font-black bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                  {cd.days}
                                </span>
                                <span className="text-sm font-bold text-primary/60">d</span>
                                <span className="text-2xl font-bold text-primary/40">:</span>
                              </>
                            )}
                            <span className="text-3xl font-black bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent tabular-nums">
                              {String(cd.hours).padStart(2, '0')}
                            </span>
                            <span className="text-lg font-bold text-primary/40 animate-pulse">:</span>
                            <span className="text-3xl font-black bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent tabular-nums">
                              {String(cd.minutes).padStart(2, '0')}
                            </span>
                            <span className="text-lg font-bold text-primary/40 animate-pulse">:</span>
                            <span className="text-3xl font-black bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent tabular-nums">
                              {String(cd.seconds).padStart(2, '0')}
                            </span>
                          </div>

                          <div className="mt-2 h-1 bg-primary/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-1000 ease-linear"
                              style={{ width: `${((60 - cd.seconds) / 60) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl border shadow-md border-emerald-200">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-2">
                            <Clock className="w-3 h-3 text-emerald-600 animate-pulse" />
                            <span className="text-[10px] font-medium text-emerald-700 uppercase tracking-wider">Terlewati</span>
                          </div>
                          <div className="flex items-baseline justify-center gap-1">
                            {cd.hours > 0 && (
                              <>
                                <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent tabular-nums">
                                  {String(cd.hours).padStart(2, '0')}
                                </span>
                                <span className="text-sm font-bold text-emerald-500">j</span>
                                <span className="text-lg font-bold text-emerald-400">:</span>
                              </>
                            )}
                            <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent tabular-nums">
                              {String(cd.minutes).padStart(2, '0')}
                            </span>
                            <span className="text-sm font-bold text-emerald-500">m</span>
                            <span className="text-lg font-bold text-emerald-400">:</span>
                            <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent tabular-nums">
                              {String(cd.seconds).padStart(2, '0')}
                            </span>
                            <span className="text-sm font-bold text-emerald-500">d</span>
                          </div>
                          <div className="text-xs text-emerald-600 mt-1">Waktu Pengerjaan Asesi Telah Dimulai</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Info Card - Keterangan Indikator & Status */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-slate-700">Panduan Singkat</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {/* Klik baris */}
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Users className="w-3 h-3 text-primary" />
            </div>
            <div>
              <span className="font-medium text-slate-700">Klik baris asesi</span>
              <p className="text-slate-500">Untuk membuka halaman praasesi/asesmen</p>
            </div>
          </div>
          {/* Indikator hijau */}
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="relative w-2.5 h-2.5">
                <div className="absolute inset-0 rounded-full bg-emerald-500" />
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
              </div>
            </div>
            <div>
              <span className="font-medium text-slate-700">Hijau berkedip</span>
              <p className="text-slate-500">Asesi sudah selesai mengerjakan</p>
            </div>
          </div>
          {/* Indikator kuning */}
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            </div>
            <div>
              <span className="font-medium text-slate-700">Kuning</span>
              <p className="text-slate-500">Asesi belum/sedang mengerjakan</p>
            </div>
          </div>
          {/* Badge Sudah asesmen / Sudah Praasesmen */}
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-emerald-500" />
            </div>
            <div>
              <span className="font-medium text-slate-700">Sudah asesmen / Sudah Praasesmen</span>
              <p className="text-slate-500">Asesor sudah menyelesaikan review</p>
            </div>
          </div>
          {/* Badge Belum asesmen / Belum Praasesmen */}
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertCircle className="w-3 h-3 text-blue-500" />
            </div>
            <div>
              <span className="font-medium text-slate-700">Belum asesmen / Belum Praasesmen</span>
              <p className="text-slate-500">Asesor sudah absen awal tapi belum menyelesaikan review</p>
            </div>
          </div>
          {/* Badge Butuh ditinjau */}
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertCircle className="w-3 h-3 text-slate-400" />
            </div>
            <div>
              <span className="font-medium text-slate-700">Butuh ditinjau</span>
              <p className="text-slate-500">Asesor belum melakukan review</p>
            </div>
          </div>
        </div>
      </div>

      {/* Side by Side: Daftar Asesi (70%) + Dokumen Asesi (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left: Daftar Asesi - 70% */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Daftar Asesi
              {asesiLoading && <SimpleSpinner size="sm" className="ml-2 text-primary" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {asesiError && (
              <div className="text-center py-8 text-red-500">
                Gagal memuat daftar asesi: {asesiError}
              </div>
            )}

            {!asesiLoading && !asesiError && asesiList.length === 0 && (
              <div className="text-center py-8 text-slate-500">
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
                    {group.asesi.map((asesi, idx) => {
                      const absen = absenData[asesi.id_izin]

                      const asesiStatus = currentKegiatan?.tahap === 2
                        ? getAsesiAbsenStatus(absen, 'asesmen')
                        : getAsesiAbsenStatus(absen, 'praasesmen')

                      const reviewStatus = asesorRole
                        ? (currentKegiatan?.tahap === 2
                            ? getAsesorReviewStatus(absen, 'asesmen', asesorRole as 1 | 2)
                            : currentKegiatan?.tahap === 1
                              ? getAsesorReviewStatus(absen, 'praasesmen', asesorRole as 1 | 2)
                              : 'Butuh ditinjau')
                        : 'Butuh ditinjau'

                      return (
                        <div
                          key={asesi.id_izin}
                          onClick={() => handleViewAsesi(asesi.id_izin)}
                          className="p-4 border border-slate-200 rounded-lg bg-white transition-all hover:shadow-md hover:border-primary/30 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">{idx + 1}</span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-800">{asesi.nama}</h4>
                                <p className="text-xs text-slate-500">ID: {asesi.id_izin}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge className={getStatusBadgeStyle(reviewStatus)}>
                                {reviewStatus}
                              </Badge>
                              <div
                                className={`relative w-4 h-4 rounded-full ${
                                  asesiStatus === 'green'
                                    ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50'
                                    : 'bg-yellow-500 shadow-lg shadow-yellow-500/50'
                                }`}
                                title={asesiStatus === 'green' ? 'Absen selesai' : 'Absen belum selesai'}
                              >
                                {asesiStatus === 'green' && (
                                  <div className="absolute inset-0 rounded-full bg-emerald-400 blur-md opacity-50 animate-pulse" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right: Dokumen Asesi - 30% */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Dokumen Asesi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {asesiList.length > 0 ? (
                <button
                  onClick={() => openDokumenAsesiModal(asesiList[0].id_izin)}
                  className="w-full p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary/50 hover:bg-primary/5 transition-all text-center cursor-pointer group"
                >
                  <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300 group-hover:text-primary/60 transition-colors" />
                  <p className="font-semibold text-slate-700 group-hover:text-primary transition-colors">
                    Lihat Dokumen Asesi
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    SPT Asesor & Verifikasi TUK
                  </p>
                </button>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">Tidak ada asesi</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
