import { useState, useEffect } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, Calendar, Clock, MapPin, FileText, Check, ExternalLink } from "lucide-react"
import { useListAsesi } from "@/hooks/useKegiatan"
import { SimpleSpinner } from "@/components/ui/loading-spinner"
import { kegiatanService, KegiatanAsesor } from "@/lib/kegiatan-service"
import { useToast } from "@/contexts/ToastContext"
import { extractErrorMessage, extractApiError } from "@/lib/error-utils"
import { useDokumenModal } from "@/contexts/DokumenModalContext"
import { DokumenViewerModal } from "@/components/direktur"
import { API_BASE_URL } from "@/config/api"

interface DokumenDirekturResponse {
  message: string
  data: {
    sk_pelaksanaan_uji: string | null
    spt_asesor: string | null
    sk_komtek: string | null
    spt_komtek: string | null
    ba_komtek: string | null
    sk_penetapan: string | null
    approval_status: {
      sk_pelaksanaan_uji: boolean
      spt_asesor: boolean
      spt_komtek: boolean
      sk_komtek: boolean
      ba_komtek: { komtek1: boolean; komtek2: boolean; komtek3: boolean }
      sk_penetapan?: { asesi_status: Record<string, boolean> }
    }
  }
}

interface DokumenDirekturItem {
  key: string
  label: string
  url: string | null
}

interface SelectedDokumen {
  key: string
  url: string
  title: string
}

type DokumenKey = 'sk_pelaksanaan_uji' | 'spt_asesor' | 'sk_komtek' | 'spt_komtek' | 'ba_komtek' | 'sk_penetapan'

const DOKUMEN_DIREKTUR_CONFIG: Array<{ key: DokumenKey; label: string; approveEndpoint?: string }> = [
  { key: 'sk_pelaksanaan_uji', label: 'SK Pelaksanaan Uji', approveEndpoint: '/direktur/approve-sk-pelaksanaan-uji' },
  { key: 'spt_asesor', label: 'SPT Asesor', approveEndpoint: '/direktur/approve-spt-asesor' },
  { key: 'sk_komtek', label: 'SK Komtek' },
  { key: 'spt_komtek', label: 'SPT Komtek', approveEndpoint: '/direktur/approve-spt-komtek' },
  { key: 'ba_komtek', label: 'BA Komtek' },
  { key: 'sk_penetapan', label: 'SK Penetapan' },
]

export default function DetailDokumenDirekturPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const isSudah = location.pathname.includes('/sudah-ditandatangani/')
  const backPath = isSudah ? '/direktur/sudah-ditandatangani' : '/direktur/belum-ditandatangani'
  const { showError, showSuccess } = useToast()
  const { asesiList, isLoading: asesiLoading, error } = useListAsesi(id || "")
  const [kegiatan, setKegiatan] = useState<KegiatanAsesor | null>(null)
  const [dokumenDirektur, setDokumenDirektur] = useState<DokumenDirekturResponse['data'] | null>(null)
  const [selectedDokumen, setSelectedDokumen] = useState<SelectedDokumen | null>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [approvedDocs, setApprovedDocs] = useState<Set<string>>(new Set())

  // Modal context
  const { openModal: openDokumenModal } = useDokumenModal()

  // Fetch kegiatan detail
  useEffect(() => {
    const fetchKegiatan = async () => {
      if (!id) return

      try {
        // Search all pages for both ttd states
        for (const ttd of [false, true]) {
          let page = 1
          let found = false

          while (!found) {
            const response = await kegiatanService.getKegiatanDirektur(ttd, page)
            const match = response.data.data.find((k: KegiatanAsesor) => String(k.jadwal_id) === id)

            if (match) {
              setKegiatan(match)
              found = true
              break
            }

            if (page >= response.data.last_page) break
            page++
          }

          if (found) break
        }
      } catch (err) {
        console.error('Error fetching kegiatan:', err)
      }
    }
    fetchKegiatan()
  }, [id])

  // Fetch dokumen direktur
  useEffect(() => {
    const fetchDokumenDirektur = async () => {
      if (!id) return

      try {
        const token = localStorage.getItem("access_token")
        const response = await fetch(`${API_BASE_URL}/direktur/files/${id}`, {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const result: DokumenDirekturResponse = await response.json()
          setDokumenDirektur(result.data)
        } else {
          const msg = await extractApiError(response, 'Gagal memuat dokumen direktur')
          showError(msg)
        }
      } catch (error) {
        console.error("Error fetching dokumen direktur:", error)
        showError(extractErrorMessage(error, 'Terjadi kesalahan saat memuat dokumen'))
      }
    }

    fetchDokumenDirektur()
  }, [id])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const handleOpenDokumenModal = (asesi: { id_izin: string; nama: string }) => {
    openDokumenModal(asesi.id_izin, asesi.nama, true, id)
  }

  const direkturDocuments: DokumenDirekturItem[] = DOKUMEN_DIREKTUR_CONFIG.map(config => ({
    key: config.key,
    label: config.label,
    url: (dokumenDirektur?.[config.key as keyof typeof dokumenDirektur] as string | null) || null,
  }))

  const handleSignDokumen = async (docKey: string) => {
    if (!id) return

    const config = DOKUMEN_DIREKTUR_CONFIG.find(c => c.key === docKey)
    if (!config?.approveEndpoint) {
      showError('Dokumen ini tidak perlu ditandatangani')
      return
    }

    setIsSigning(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}${config.approveEndpoint}/${id}`, {
        method: 'POST',
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setApprovedDocs(prev => new Set(prev).add(docKey))
        setSelectedDokumen(null)

        // Update approval_status locally
        setDokumenDirektur(prev => {
          if (!prev) return prev
          const status = prev.approval_status
          if (docKey in status) {
            return { ...prev, approval_status: { ...status, [docKey]: true } }
          }
          return prev
        })

        showSuccess(`${config.label} berhasil ditandatangani!`)
      } else {
        const msg = await extractApiError(response, `Gagal menandatangani ${config.label}`)
        showError(msg)
      }
    } catch (error) {
      console.error(`Error approving ${docKey}:`, error)
      showError(extractErrorMessage(error, 'Terjadi kesalahan'))
    } finally {
      setIsSigning(false)
    }
  }

  const isDocApproved = (docKey: string): boolean => {
    const status = dokumenDirektur?.approval_status as Record<string, boolean | object> | undefined
    if (status && docKey in status) {
      const val = status[docKey]
      if (typeof val === 'boolean') return val
      // ba_komtek: check all komtek positions
      if (docKey === 'ba_komtek' && typeof val === 'object' && val !== null) {
        return Object.values(val as Record<string, boolean>).every(Boolean)
      }
      // sk_penetapan: check all asesi approved
      if (docKey === 'sk_penetapan' && typeof val === 'object' && val !== null) {
        const asesiStatus = (val as { asesi_status?: Record<string, boolean> }).asesi_status
        return asesiStatus ? Object.values(asesiStatus).every(Boolean) : false
      }
    }
    return approvedDocs.has(docKey)
  }

  const getBaKomtekPending = (): string[] => {
    const baStatus = dokumenDirektur?.approval_status?.ba_komtek
    if (!baStatus || typeof baStatus === 'boolean') return []
    return Object.entries(baStatus)
      .filter(([, v]) => !v)
      .map(([k]) => k)
  }

  const getSkPenetapanStatus = (): { approved: number; total: number } => {
    const skStatus = dokumenDirektur?.approval_status?.sk_penetapan
    if (!skStatus?.asesi_status) return { approved: 0, total: 0 }
    const entries = Object.values(skStatus.asesi_status)
    return {
      approved: entries.filter(Boolean).length,
      total: entries.length,
    }
  }

  // Map asesi id -> sk_penetapan approval status
  const skPenAsesiMap: Record<string, boolean> =
    dokumenDirektur?.approval_status?.sk_penetapan?.asesi_status ?? {}

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
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(backPath)}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Daftar Asesi</h2>
            <p className="text-slate-600 dark:text-slate-400">Pilih asesi untuk melihat dokumen</p>
          </div>
        </div>

        {/* Kegiatan Detail */}
        {kegiatan && (
          <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
            <div className="flex gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{kegiatan.nama_kegiatan}</h3>
                  {kegiatan.is_started === "0" && (
                    <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300">
                      Belum Mulai
                    </Badge>
                  )}
                  {kegiatan.is_started === "1" && (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Sedang Berjalan
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  {kegiatan.tuk?.nama?.toUpperCase() || ''}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Asesor | {kegiatan.asesor?.nama?.toUpperCase() || ''}{kegiatan.asesor2 ? ` & ${kegiatan.asesor2.nama?.toUpperCase() || ''}` : ''}</p>

                <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary" />
                    {formatDate(kegiatan.tanggal_uji)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" />
                    {formatTime(kegiatan.tanggal_uji)}
                  </div>
                  <br />
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" />
                    {kegiatan.tuk.alamat}
                  </div>
                </div>
              </div>

              <div className="w-[18%] flex flex-col items-center justify-center gap-4">
                <div className="p-20 py-2 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/10 shadow-lg shadow-primary/5">
                  <div className="text-center">
                    <Users className="w-5 h-5 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-black text-primary">
                      {asesiList.length}
                    </div>
                    <div className="text-xs font-medium text-primary/70 uppercase tracking-wider">
                      Asesi
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Card - Panduan Direktur */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-slate-700">Panduan Direktur</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="w-3 h-3 text-primary" />
              </div>
              <div>
                <span className="font-medium text-slate-700">Klik baris asesi</span>
                <p className="text-slate-500">Untuk melihat detail dokumen asesi</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-emerald-500" />
              </div>
              <div>
                <span className="font-medium text-slate-700">Hijau = sudah TTD</span>
                <p className="text-slate-500">Dokumen sudah ditandatangani</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="w-3 h-3 text-red-600" />
              </div>
              <div>
                <span className="font-medium text-slate-700">Merah = perlu TTD</span>
                <p className="text-slate-500">Dokumen tersedia, perlu ditandatangani</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="w-3 h-3 text-slate-400" />
              </div>
              <div>
                <span className="font-medium text-slate-700">Abu = belum tersedia</span>
                <p className="text-slate-500">Dokumen belum digenerate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Side by Side: Daftar Asesi (70%) + Dokumen Direktur (30%) */}
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
                      {group.asesi.map((asesi) => (
                        <div
                          key={asesi.id_izin}
                          onClick={() => handleOpenDokumenModal({ id_izin: asesi.id_izin, nama: asesi.nama })}
                          className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer bg-white dark:bg-slate-800"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">{group.asesi.indexOf(asesi) + 1}</span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-800 dark:text-slate-100">{asesi.nama}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">ID: {asesi.id_izin}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* SK Penetapan Status */}
                              {asesi.id_izin in skPenAsesiMap && (
                                skPenAsesiMap[asesi.id_izin]
                                  ? (
                                    <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                      Disetujui
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                                      Menunggu
                                    </div>
                                  )
                              )}

                              {/* Kompeten Badge */}
                              <Badge variant="outline" className="border-slate-300 dark:border-slate-600">
                                {asesi.kompeten}
                              </Badge>

                              {/* Status Indicator */}
                              {asesi.is_started && (
                                <div className="flex items-center gap-1.5 text-emerald-600">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="text-xs font-medium">Aktif</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right: Dokumen Direktur - 30% */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Dokumen Direktur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {direkturDocuments.map((doc) => {
                const hasDocument = !!doc.url
                const alreadyApproved = isDocApproved(doc.key)
                const hasApproveEndpoint = DOKUMEN_DIREKTUR_CONFIG.find(c => c.key === doc.key)?.approveEndpoint
                const isBaKomtek = doc.key === 'ba_komtek'
                const baPending = isBaKomtek ? getBaKomtekPending() : []
                const baAllApproved = isBaKomtek && baPending.length === 0
                const isSkKomtek = doc.key === 'sk_komtek'
                const isSkPenetapan = doc.key === 'sk_penetapan'
                const skPenStatus = isSkPenetapan ? getSkPenetapanStatus() : { approved: 0, total: 0 }
                const skPenAllApproved = isSkPenetapan && skPenStatus.total > 0 && skPenStatus.approved === skPenStatus.total
                return (
                  <Button
                    key={doc.key}
                    variant="outline"
                    className={`w-full h-auto min-h-16 flex items-center justify-between px-4 ${
                      isSkKomtek
                        ? 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                        : isSkPenetapan
                          ? skPenAllApproved
                            ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100'
                            : 'border-amber-300 bg-amber-50 hover:bg-amber-100'
                          : alreadyApproved || baAllApproved
                          ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100'
                          : 'border-red-300 bg-red-50 hover:bg-red-100 hover:border-red-400'
                    }`}
                    disabled={!hasDocument}
                    onClick={() => {
                      if (!hasDocument) return
                      setSelectedDokumen({ key: doc.key, url: doc.url!, title: doc.label })
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className={`w-5 h-5 ${isSkKomtek ? 'text-slate-400' : isSkPenetapan ? (skPenAllApproved ? 'text-emerald-500' : 'text-amber-500') : alreadyApproved || baAllApproved ? 'text-emerald-500' : hasDocument ? 'text-red-500' : 'text-slate-400'}`} />
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold block">{doc.label}</span>
                          {(alreadyApproved || baAllApproved || skPenAllApproved) && !isSkKomtek && (
                            <Check className="w-4 h-4 text-emerald-500" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {isSkKomtek
                            ? hasDocument ? 'Klik untuk buka' : 'Belum tersedia'
                            : isSkPenetapan
                              ? skPenAllApproved
                                ? 'Semua asesi disetujui'
                                : `${skPenStatus.approved}/${skPenStatus.total} asesi disetujui`
                              : alreadyApproved || baAllApproved
                                ? 'Sudah ditandatangani'
                                : isBaKomtek && baPending.length > 0
                                  ? `Belum diapprove: ${baPending.join(', ')}`
                                : hasDocument
                                  ? 'Klik untuk tanda tangan'
                                  : 'Belum tersedia'
                          }
                        </span>
                      </div>
                    </div>
                    {isSkKomtek && hasDocument && (
                      <ExternalLink className="w-5 h-5 text-slate-400" />
                    )}
                    {hasDocument && !alreadyApproved && !baAllApproved && !skPenAllApproved && hasApproveEndpoint && !isSkKomtek && !isSkPenetapan && (
                      <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                        Perlu TTD
                      </span>
                    )}
                  </Button>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dokumen Viewer Modal */}
      <DokumenViewerModal
        isOpen={selectedDokumen !== null}
        onClose={() => {
          if (!isSigning) setSelectedDokumen(null)
        }}
        url={selectedDokumen?.url || null}
        title={selectedDokumen?.title || ''}
        onSign={selectedDokumen?.key && DOKUMEN_DIREKTUR_CONFIG.find(c => c.key === selectedDokumen.key)?.approveEndpoint && !isDocApproved(selectedDokumen.key)
          ? () => handleSignDokumen(selectedDokumen.key!)
          : undefined
        }
        isSigning={isSigning}
      />
    </>
  )
}
