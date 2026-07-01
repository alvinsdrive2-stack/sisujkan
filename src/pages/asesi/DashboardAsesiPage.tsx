import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Award,
  Timer,
  ChevronRight,
  FileCheck
} from "lucide-react"
import { PulsingIcon } from "@/components/ui/PulsingIcon"
import { FullPageLoader } from "@/components/ui/loading-spinner"
import { LoopingVideoBackground } from "@/components/ui/LoopingVideoBackground"
import loopVideo from "@/assets/Sequence 01.mp4"
import { useAuth } from "@/contexts/auth-context"
import { useKegiatanAsesi } from "@/hooks/useKegiatan"
import { useDataDokumenAsesmen } from "@/hooks/useDataDokumenAsesmen"
import { toast } from "@/components/ui/toast"
import { API_BASE_URL } from "@/config/api"

export default function DashboardAsesiPage() {
  const { user } = useAuth()
  const { kegiatan, isLoading: _isLoading, error: _error } = useKegiatanAsesi()
  const navigate = useNavigate()
  const [showPage, setShowPage] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [idIzin, setIdIzin] = useState<string | undefined>(undefined)

  // Fetch jenjang from data-dokumen API
  const { jenjang, metode } = useDataDokumenAsesmen(idIzin)

  // Fetch id_izin from list-asesi
  useEffect(() => {
    const fetchIdIzin = async () => {
      if (!kegiatan?.jadwal_id || !user?.name) return

      try {
        const token = localStorage.getItem("access_token")
        const response = await fetch(`${API_BASE_URL}/kegiatan/${kegiatan.jadwal_id}/list-asesi`, {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const result = await response.json()
          const matchedAsesi = result.list_asesi?.find((a: any) => a.nama === user.name)
          if (matchedAsesi?.id_izin) {
            setIdIzin(matchedAsesi.id_izin)
          }
        }
      } catch (error) {
        console.error("Error fetching id_izin:", error)
      }
    }

    fetchIdIzin()
  }, [kegiatan?.jadwal_id, user?.name])

  // Page entrance animation






  // Page entrance — CSS animation handles delay, no artificial loading
  useEffect(() => {
    setIsPageLoading(false)
    setShowPage(true)
  }, [])

  // Debug logging



  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isLate: false
  })

  useEffect(() => {
    // Skip if no exam date
    if (!kegiatan?.tanggal_uji) {
      return
    }

    const updateCountdown = () => {
      const now = new Date()
      const examDate = new Date(kegiatan.tanggal_uji)
      const diff = examDate.getTime() - now.getTime()

      if (diff <= 0) {
        // Calculate how late (elapsed time since exam started)
        const lateDiff = Math.abs(diff)
        const totalMinutes = Math.floor(lateDiff / (1000 * 60))
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        const seconds = Math.floor((lateDiff % (1000 * 60)) / 1000)

        setCountdown({
          days: 0,
          hours,
          minutes,
          seconds,
          isLate: true
        })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setCountdown({ days, hours, minutes, seconds, isLate: false })
    }

    // Initial call
    updateCountdown()

    // Calculate time until exam to determine interval
    const now = new Date()
    const examDate = new Date(kegiatan.tanggal_uji)
    const diffMs = examDate.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    // If more than 1 hour away, check every minute instead of every second
    const interval = diffHours > 1 ? 60000 : 1000

    const timer = setInterval(updateCountdown, interval)
    return () => clearInterval(timer)
  }, [kegiatan?.tanggal_uji])

  const examData = useMemo(() => {
    if (!kegiatan) {
      return {
        scheme: "Tidak ada sertifikasi aktif",
        schemeCode: "-",
        unit: {
          title: "-",
          code: "-"
        },
        schedule: {
          date: "-",
          time: "-",
          venue: "-",
          address: "-"
        },
        assessors: [],
        status: "none"
      }
    }

    const tanggalUji = new Date(kegiatan.tanggal_uji)

    // Handle multiple assessors - check if asesor is array or has multiple fields
    const assessors = []

    // Add first asesor if exists
    if (kegiatan.asesor?.nama) {
      assessors.push({
        name: kegiatan.asesor.nama,
        nip: kegiatan.asesor.noreg || "-",
        license: kegiatan.asesor.noreg || "-"
      })
    }

    // Add second asesor if exists (asesor2)
    if (kegiatan.asesor2?.nama) {
      assessors.push({
        name: kegiatan.asesor2?.nama || '',
        nip: kegiatan.asesor2?.noreg || "-",
        license: kegiatan.asesor2?.noreg || "-"
      })
    }

    // Determine phase
    let phase: {
      title: string
      variant: "default" | "secondary"
      color: string
    } = {
      title: "Belum Dimulai",
      variant: "secondary",
      color: "text-slate-600"
    }
    if (kegiatan.tahap === 1) {
      phase = {
        title: "Pra-Asesmen",
        variant: "default",
        color: "text-primary"
      }
    } else if (kegiatan.tahap === 2) {
      phase = {
        title: "Asesmen",
        variant: "default",
        color: "text-emerald-600"
      }
    }

    return {
      scheme: kegiatan.skema?.nama || "-",
      schemeCode: `SK-${kegiatan.skema_id}`,
      unit: {
        title: "Unit Kompetensi",
        code: kegiatan.skema_id
      },
      phase,
      schedule: {
        date: tanggalUji.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        time: `${tanggalUji.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
        venue: kegiatan.tuk?.nama || "-",
        address: kegiatan.tuk?.alamat || "-"
      },
      assessors,
      status: kegiatan.is_started === "1" ? "in-progress" : "scheduled"
    }
  }, [kegiatan])

  const isExamTime = (countdown: { days: number; hours: number; minutes: number; seconds: number; isLate: boolean }) => {
    // Show "Masuk ke Ujian" if:
    // 1. Late (waktu ujian sudah lewat) - tapi max 60 menit
    // 2. Kurang dari 15 menit sebelum ujian
    if (countdown.isLate) {
      // Only show button for 60 minutes after exam time
      const lateSeconds = countdown.minutes * 60 + countdown.seconds
      return lateSeconds <= 3600 // 60 minutes = 3600 seconds
    }
    const totalSeconds = countdown.days * 86400 + countdown.hours * 3600 + countdown.minutes * 60 + countdown.seconds
    return totalSeconds < 900 // 15 minutes = 900 seconds
  }


  // Memoize button text to prevent flickering - use stable state
  const [buttonText, setButtonText] = useState("Lihat Persiapan")
  const [isButtonLocked, setIsButtonLocked] = useState(false)

  useEffect(() => {
    // Skip if already locked or exam already started
    if (isButtonLocked || kegiatan?.is_started === "1") {
      return
    }

    const currentTimeToEnter = isExamTime(countdown)
    if (currentTimeToEnter) {
      setIsButtonLocked(true)
      if (kegiatan?.is_started_praasesmen === "1") {
        setButtonText("Masuk Pra-Asesmen")
      } else if (kegiatan?.is_started === "1") {
        setButtonText("Masuk Asesmen")
      } else {
        setButtonText("Masuk ke Ujian")
      }
    }
  }, [countdown, isButtonLocked, kegiatan?.is_started, kegiatan?.tahap])

  // Show loading overlay
  if (isPageLoading) {
    return (
      <>
        <LoopingVideoBackground videoSrc={loopVideo} />
        <FullPageLoader text="Memuat dashboard..." />
      </>
    )
  }

  return (
    <>
      {/* Fixed Background - Looping Video with Crossfade */}
      <LoopingVideoBackground videoSrc={loopVideo} />

      {/* Main Content */}
      <div className={`min-h-screen relative transition-opacity duration-300 ${showPage ? 'page-enter opacity-100' : 'opacity-0'}`}>

      {/* Header */}
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-slide-down bg-white backdrop-blur-sm rounded-lg p-6 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-primary">{user?.name || "Asesi"}</h2>
          <p className="text-slate-500 mt-0.5 text-sm">{user?.id_izin|| ""}</p>
        </div>

        {/* Countdown Banner - Big Container */}
        <Card className="animate-scale-in overflow-hidden">
          <div className="bg-primary text-white p-8">
            <div>
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="text-center lg:text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <PulsingIcon icon={Timer} className="w-8 h-8" autoHide={false} />
                    <h3 className="text-2xl font-bold">
                      {countdown.isLate && examData.phase?.title === "Asesmen" ? "Waktu Pengerjaan Asesi Telah Dimulai" :
                       countdown.isLate ? "Ayo Kerjakan Ujian Waktu Sudah Berjalan" :
                       "Ujian Akan Dimulai Dalam"}
                    </h3>
                  </div>
                  <p className="text-white/80">
                    {countdown.isLate ? (
                      <>
                        {countdown.hours > 0 ? (
                          <>Waktu pengerjaan telah berjalan {countdown.hours} jam {countdown.minutes} menit {countdown.seconds} detik.</>
                        ) : (
                          <>Waktu pengerjaan telah berjalan {countdown.minutes} menit {countdown.seconds} detik.</>
                        )}
                        <br />
                        <span className="text-white font-semibold">Segera masuk ujian!</span>
                      </>
                    ) : (
                      "Pastikan semua persiapan sudah lengkap"
                    )}
                  </p>
                </div>

                <div className="flex gap-4">
                  {[
                    { label: "Hari", value: countdown.days },
                    { label: "Jam", value: countdown.hours },
                    { label: "Menit", value: countdown.minutes },
                    { label: "Detik", value: countdown.seconds }
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="bg-white/20 rounded-lg p-4 min-w-[80px] text-center animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <p className="text-4xl font-bold">{String(item.value).padStart(2, '0')}</p>
                      <p className="text-sm text-white/80">{item.label}</p>
                    </div>
                  ))}
                </div>
                <Button
                  size="lg"
                  disabled={!idIzin || !kegiatan?.tahap}
                  className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg disabled:opacity-50"
                  onClick={async () => {
                    console.log('[Dashboard Button] Clicked - idIzin:', idIzin, 'tahap:', kegiatan?.tahap)

                    if (!idIzin) {
                      toast("ID Izin tidak ditemukan", "error")
                      return
                    }

                    // Mark valid navigation entry
                    sessionStorage.setItem('validNavigationEntry', 'true')

                    // KAN flow: langsung ke IA04b, skip tahap/jenjang/metode logic
                    const saatIni = import.meta.env.VITE_SAAT_INI
                    if (saatIni === 'KAN') {
                      sessionStorage.setItem('validNavigationEntry', 'true')
                      navigate(`/asesi/asesmen/${idIzin}/ia04b`, { state: { fromInternal: true } })
                      return
                    }

                    if (kegiatan?.tahap === 1) {
                      // Tahap 1: always go to APL-01
                      sessionStorage.setItem('validNavigationEntry', 'true')
                      navigate(`/asesi/praasesmen/${idIzin}/apl01`, { state: { fromInternal: true } })
                      return
                    }
                    if (kegiatan?.tahap === 2) {
                      // Dynamic tahap 2 steps based on jenjang and methode
                      const jenjangId = parseInt(jenjang || "0")
                      const isLowJenjang = jenjangId < 4
                      const isPortofolio = metode?.toLowerCase() === 'portofolio'
                      const token = localStorage.getItem("access_token")
                      const headers = { "Accept": "application/json", "Authorization": `Bearer ${token}` }

                      let tahap2Steps: { key: string; path: string }[] = []
                      if (isPortofolio) {
                        tahap2Steps = [
                          { key: 'ak01', path: `/perjanjian/${idIzin}/ak01` },
                          { key: 'ia08', path: `/asesmen/${idIzin}/ia08` },
                          { key: 'ia09', path: `/asesmen/${idIzin}/ia09` },
                          { key: 'ia10', path: `/asesmen/${idIzin}/ia10` },
                          { key: 'ak02', path: `/asesmen/${idIzin}/ak02` },
                          { key: 'ak03', path: `/asesmen/${idIzin}/ak03` },
                        ]
                      } else if (isLowJenjang) {
                        tahap2Steps = [
                          { key: 'ak01', path: `/perjanjian/${idIzin}/ak01` },
                          { key: 'ia01', path: `/asesmen/${idIzin}/ia01` },
                          { key: 'ia02', path: `/asesmen/${idIzin}/ia02` },
                          { key: 'ia03', path: `/asesmen/${idIzin}/ia03` },
                          { key: 'upload-tugas', path: `/asesmen/${idIzin}/upload-tugas` },
                          { key: 'ia05', path: `/asesmen/${idIzin}/ia05` },
                          { key: 'ak02', path: `/asesmen/${idIzin}/ak02` },
                          { key: 'ak03', path: `/asesmen/${idIzin}/ak03` },
                        ]
                      } else {
                        tahap2Steps = [
                          { key: 'ak01', path: `/perjanjian/${idIzin}/ak01` },
                          { key: 'ia04a', path: `/asesmen/${idIzin}/ia04a` },
                          { key: 'upload-tugas', path: `/asesmen/${idIzin}/upload-tugas` },
                          { key: 'ia04b', path: `/asesmen/${idIzin}/ia04b` },
                          { key: 'ia05', path: `/asesmen/${idIzin}/ia05` },
                          { key: 'ak02', path: `/asesmen/${idIzin}/ak02` },
                          { key: 'ak03', path: `/asesmen/${idIzin}/ak03` },
                        ]
                      }
                      for (const step of tahap2Steps) {
                        try {
                          // AK.01 API endpoint is under /praasesmen/, not /perjanjian/
                          const apiPath = step.key === 'ak01'
                            ? `/praasesmen/${idIzin}/ak01`
                            : step.path
                          const res = await fetch(`${API_BASE_URL}${apiPath}`, { headers })

                          // AK.01 returns 404 when no data yet — treat as unfilled
                          if (step.key === 'ak01') {
                            if (!res.ok) {
                              sessionStorage.setItem('validNavigationEntry', 'true')
                              navigate(`/asesi${step.path}`, { state: { fromInternal: true } })
                              return
                            }
                            const json = await res.json()
                            const filled = json.data?.barcodes?.asesi?.url
                            if (!filled) {
                              sessionStorage.setItem('validNavigationEntry', 'true')
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
                            sessionStorage.setItem('validNavigationEntry', 'true')
                            navigate(`/asesi${step.path}`, { state: { fromInternal: true } })
                            return
                          }
                        } catch { /* continue */ }
                      }
                      // All filled → button already disabled, do nothing
                    }
                  }}
                >
                  {buttonText}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Exam Details */}
            <Card className="shadow-lg animate-slide-up">
              <CardContent className="p-6">
                <div className="space-y-6 ">
                  {/* Scheme Info */}
                  <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
                    
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-20 h-20 text-primary/90 shrink-0 bg-blue-400/15 p-2.5 rounded-full" />
                      <div>
                        <p className="text-sm text-muted-foreground">Skema Sertifikasi</p>
                        <h3 className="text-xl font-bold text-slate-800">{examData.scheme}</h3>
                        <Badge variant="outline" className="text-xs mt-[2px]">{examData.schemeCode}</Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Phase Info */}
                  <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
                    <p className="text-sm text-muted-foreground mb-1">Fase Ujian</p>
                    <div className="flex items-center gap-2 font-bold">
                        {examData.phase?.title}
                      <span className={`text-xs font-semibold ${examData.phase?.color}`}>
                        {examData.phase?.title === "Belum Dimulai" && "Menunggu jadwal"}
                        {examData.phase?.title === "Pra-Asesmen" && "Persiapan dokumen"}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Schedule Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tanggal</p>
                        <p className="font-semibold text-slate-800">{examData.schedule.date}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Waktu</p>
                        <p className="font-semibold text-slate-800">{examData.schedule.time}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl md:col-span-2">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Lokasi</p>
                        <p className="font-semibold text-slate-800">{examData.schedule.venue}</p>
                        <p className="text-sm text-muted-foreground">{examData.schedule.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>


          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">

            {/* Assessor Info */}
            <Card className="shadow-lg animate-slide-up" style={{ animationDelay: "0.2s" }}>

              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <FileCheck className="w-6 h-6 text-primary" />
                  Informasi Asesor
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6">

                {examData.assessors.length > 0 ? (
                  <div className="space-y-4">
                    {examData.assessors.map((assessor, index) => {
                      const initials = assessor.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .substring(0, 2)

                      return (
                        <div key={index} className="flex items-center gap-4 mb-10">
                          <div className="relative">
                            <Avatar className="w-16 h-16">
                              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <Badge variant="default" className="absolute -top-1 -left-1 text-xs px-3 py-1">
                              {index + 1}
                            </Badge>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-slate-800">{assessor.name.toUpperCase()}</h4>
                            <Badge variant="error" className="mt-2">
                              <Award className="w-3 h-3 mr-1" />
                              No. Lisensi: {assessor.license}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Belum ada informasi asesor</p>
                )}

              </CardContent>
            </Card>
            {/* Help Card */}
            <Card className="border-slate-200 shadow-sm animate-slide-up" style={{ animationDelay: "0.5s" }}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <h5 className="font-semibold text-slate-800 text-sm">Butuh Bantuan?</h5>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Hubungi admin jika ada pertanyaan</p>
                <Button variant="outline" size="sm" className="w-full">
                  Hubungi Admin
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        </CardContent>
        </Card>
      </main>
    </div>
    </>
  )
}
