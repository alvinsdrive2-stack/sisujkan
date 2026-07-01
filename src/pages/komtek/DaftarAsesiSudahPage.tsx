import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, Calendar, Clock, MapPin, FileText, ExternalLink, AlertCircle, Check } from "lucide-react"
import { useListAsesi } from "@/hooks/useKegiatan"
import { SimpleSpinner } from "@/components/ui/loading-spinner"
import { kegiatanService, KegiatanAsesor } from "@/lib/kegiatan-service"
import { useDokumenModal } from "@/contexts/DokumenModalContext"
import { DokumenViewerModal } from "@/components/direktur"
import { API_BASE_URL } from "@/config/api"
import { useToast } from "@/contexts/ToastContext"
import { extractErrorMessage, extractApiError } from "@/lib/error-utils"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

interface KomtekFiles {
  ba_komtek?: string
  ba_komtek_ttd_progress?: { komtek1: boolean; komtek2: boolean; komtek3: boolean }
  my_ttd_signed?: boolean
  my_position?: number
  spt_komtek?: string
  sk_komtek?: string
}

export default function DaftarAsesiSudahPage() {
  const { jadwalId } = useParams<{ jadwalId: string }>()
  const navigate = useNavigate()
  const { asesiList, isLoading: asesiLoading, error } = useListAsesi(jadwalId || "")
  const [kegiatan, setKegiatan] = useState<KegiatanAsesor | null>(null)
  const [_kegiatanLoading, setKegiatanLoading] = useState(true)
  const [komtekFiles, setKomtekFiles] = useState<KomtekFiles>({})
  const [komtekFilesLoading, setKomtekFilesLoading] = useState(false)
  const [selectedDokumen, setSelectedDokumen] = useState<{ url: string; title: string; onSign?: () => void } | null>(null)
  const [signedAsesiIds, setSignedAsesiIds] = useState<Set<string>>(new Set())
  const [isSigning, setIsSigning] = useState(false)
  const [showRapatConfirm, setShowRapatConfirm] = useState(false)

  // Modal context
  const { openModal: openDokumenModal } = useDokumenModal()
  const { showError, showSuccess, showWarning } = useToast()

  // Fetch rekomendasi status for all asesi to mark signed ones
  useEffect(() => {
    if (asesiList.length === 0) return

    const fetchSignedStatus = async () => {
      const token = localStorage.getItem("access_token")
      const userData = localStorage.getItem("user_data")
      const currentUserId = userData ? JSON.parse(userData)?.id?.toString() : null
      if (!currentUserId || !token) return

      const results = await Promise.all(
        asesiList.map(async (asesi) => {
          try {
            const res = await fetch(`${API_BASE_URL}/komtek/rekomendasi/${asesi.id_izin}`, {
              headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
            })
            if (!res.ok) return null
            const data = await res.json()
            for (const key of ['komtek1', 'komtek2', 'komtek3']) {
              if (data[key]?.id === currentUserId && data[key]?.rekomendasi !== null) {
                return asesi.id_izin
              }
            }
          } catch (e) {
            console.error(e)
          }
          return null
        })
      )

      setSignedAsesiIds(new Set(results.filter(Boolean) as string[]))
    }

    fetchSignedStatus()
  }, [asesiList])

  // Fetch komtek files
  useEffect(() => {
    const fetchKomtekFiles = async () => {
      if (!jadwalId) return

      setKomtekFilesLoading(true)
      try {
        const token = localStorage.getItem("access_token")
        const response = await fetch(`${API_BASE_URL}/komtek/files/${jadwalId}`, {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setKomtekFiles(data)
        }
      } catch (err) {
        console.error('Error fetching komtek files:', err)
      } finally {
        setKomtekFilesLoading(false)
      }
    }
    fetchKomtekFiles()
  }, [jadwalId])

  // Fetch kegiatan detail (dari yang belum dan sudah ditandatangani)
  useEffect(() => {
    const fetchKegiatan = async () => {
      try {
        // Fetch dari yang belum ditandatangani
        const responseFalse = await kegiatanService.getKegiatanKomtek(false)
        let found = responseFalse.data.data.find((k: KegiatanAsesor) => k.jadwal_id === jadwalId)

        // Kalau ga ketemu, cari dari yang sudah ditandatangani
        if (!found) {
          const responseTrue = await kegiatanService.getKegiatanKomtek(true)
          found = responseTrue.data.data.find((k: KegiatanAsesor) => k.jadwal_id === jadwalId)
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const openFile = (url: string, title: string) => {
    setSelectedDokumen({ url, title })
  }

  const handleSignBaKomtek = async () => {
    if (!jadwalId) return
    setIsSigning(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/komtek/approve-ba-komtek/${jadwalId}`, {
        method: 'POST',
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })
      if (response.ok) {
        setSelectedDokumen(null)
        showSuccess('BA Komtek berhasil ditandatangani!')
      } else {
        const msg = await extractApiError(response, 'Gagal menandatangani BA Komtek')
        showError(msg)
      }
    } catch (err) {
      console.error('Error signing BA Komtek:', err)
      showError(extractErrorMessage(err, 'Terjadi kesalahan saat menandatangani BA Komtek'))
    } finally {
      setIsSigning(false)
    }
  }

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
          onClick={() => navigate("/komtek/sudah-ditandatangani")}
          className="hover:bg-primary/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Daftar Asesi</h2>
          <p className="text-slate-600 dark:text-slate-400">Pilih asesi untuk melihat detail dokumen</p>
        </div>
      </div>

      {/* Kegiatan Detail */}
      {kegiatan && (
        <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
          <div className="flex gap-6">
            {/* Left: Kegiatan Info */}
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
                {kegiatan.tuk.nama} • {kegiatan.asesor.nama}
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  {formatDate(kegiatan.tanggal_uji)}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  {formatTime(kegiatan.tanggal_uji)}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  {kegiatan.tuk.alamat}
                </div>
              </div>
            </div>

            {/* Right: Status indicator */}
            <div className="w-[18%] flex flex-col items-center justify-center">
              <div className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/10 shadow-lg shadow-primary/5">
                <div className="text-center">
                  <Users className="w-8 h-8 text-primary mx-auto mb-2" />
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

      {/* Info Card - Panduan Komtek */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-slate-700">Panduan Komtek</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
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
              <FileText className="w-3 h-3 text-emerald-500" />
            </div>
            <div>
              <span className="font-medium text-slate-700">Dokumen Komtek</span>
              <p className="text-slate-500">Klik untuk buka dokumen tersedia</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertCircle className="w-3 h-3 text-slate-400" />
            </div>
            <div>
              <span className="font-medium text-slate-700">Dokumen belum tersedia</span>
              <p className="text-slate-500">Button akan disabled jika belum ada</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-emerald-500" />
            </div>
            <div>
              <span className="font-medium text-slate-700">BA Komtek status</span>
              <p className="text-slate-500">Hijau = sudah ditandatangani, Merah = perlu TTD</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-amber-600" />
            </div>
            <div>
              <span className="font-medium text-slate-700">TTD otomatis terdeteksi</span>
              <p className="text-slate-500">Status TTD Anda tampil di tombol BA Komtek</p>
            </div>
          </div>
        </div>
      </div>

      {/* Split Layout: Asesi List & Dokumen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asesi List - 2 columns */}
        <Card className="lg:col-span-2">
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

            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {groupedAsesi.map((group) => (
                <div key={group.skema}>
                  <h5 className="text-sm font-bold text-primary mb-2 px-1 uppercase tracking-wider">
                    {group.skema}
                  </h5>
                  <div className="space-y-2">
                    {group.asesi.map((asesi, idx) => (
                      <div
                        key={asesi.id_izin}
                        onClick={() => openDokumenModal(asesi.id_izin, asesi.nama)}
                        className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer bg-white dark:bg-slate-800"
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
                          <div className="flex items-center gap-2">
                            {signedAsesiIds.has(asesi.id_izin) && (
                              <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3" />
                                Signed
                              </div>
                            )}
                            {asesi.kompeten && (
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                asesi.kompeten === 'K'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {asesi.kompeten}
                              </span>
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

        {/* Dokumen - 1 column */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Dokumen Komtek
              {komtekFilesLoading && <SimpleSpinner size="sm" className="ml-2 text-primary" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">

            {/* SK Komtek */}
            <Button
              variant="outline"
              className="w-full h-16 border-primary/20 hover:bg-primary/5 hover:border-primary flex items-center justify-between px-4"
              disabled={!komtekFiles.sk_komtek}
              onClick={() => komtekFiles.sk_komtek && openFile(komtekFiles.sk_komtek, 'SK Komtek')}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <span className="text-sm font-semibold block">SK Komtek</span>
                  <span className="text-xs text-muted-foreground">
                    {komtekFiles.sk_komtek ? 'Klik untuk buka' : 'Belum tersedia'}
                  </span>
                </div>
              </div>
              {komtekFiles.sk_komtek && <ExternalLink className="w-5 h-5 text-primary" />}
            </Button>

            {/* SPT Komtek */}
            <Button
              variant="outline"
              className="w-full h-16 border-primary/20 hover:bg-primary/5 hover:border-primary flex items-center justify-between px-4"
              disabled={!komtekFiles.spt_komtek}
              onClick={() => komtekFiles.spt_komtek && openFile(komtekFiles.spt_komtek, 'SPT Komtek')}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <span className="text-sm font-semibold block">SPT Komtek</span>
                  <span className="text-xs text-muted-foreground">
                    {komtekFiles.spt_komtek ? 'Klik untuk buka' : 'Belum tersedia'}
                  </span>
                </div>
              </div>
              {komtekFiles.spt_komtek && <ExternalLink className="w-5 h-5 text-primary" />}
            </Button>

            {/* BA Komtek */}
            {(() => {
              const hasDoc = !!komtekFiles.ba_komtek
              const mySigned = komtekFiles.my_ttd_signed ?? false
              const progress = komtekFiles.ba_komtek_ttd_progress
              const allSigned = progress ? progress.komtek1 && progress.komtek2 && progress.komtek3 : false
              const isGreen = mySigned || allSigned
              const colorClass = isGreen ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100' : hasDoc ? 'border-red-300 bg-red-50 hover:bg-red-100 hover:border-red-400' : ''
              return (
                <Button
                  variant="outline"
                  className={`w-full h-auto min-h-16 flex items-center justify-between px-4 ${colorClass}`}
                  disabled={!hasDoc}
                  onClick={() => {
                    if (!hasDoc) return
                    const pos = komtekFiles.my_position
                    const p = komtekFiles.ba_komtek_ttd_progress
                    const isKetua = pos === 1
                    const rapatSudahMulai = p?.komtek1

                    if (isKetua) {
                      if (!mySigned) {
                        setShowRapatConfirm(true)
                        return
                      }
                    } else if (!rapatSudahMulai) {
                      showWarning('Rapat belum dimulai oleh ketua komtek')
                      return
                    }
                    setSelectedDokumen({
                      url: komtekFiles.ba_komtek!,
                      title: 'BA Komtek',
                      onSign: handleSignBaKomtek,
                    })
                  }}
                >
                  <div className="flex items-center gap-3">
                    <FileText className={`w-5 h-5 ${isGreen ? 'text-emerald-500' : hasDoc ? 'text-red-500' : 'text-slate-400'}`} />
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold block">BA Komtek</span>
                        {isGreen && <Check className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {!hasDoc ? 'Belum tersedia' : mySigned ? 'Sudah Anda tandatangani' : 'Anda belum tanda tangan'}
                      </span>
                    </div>
                  </div>
                  {hasDoc && !isGreen && (
                    <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                      Perlu TTD
                    </span>
                  )}
                  {hasDoc && isGreen && <ExternalLink className="w-5 h-5 text-emerald-500" />}
                </Button>
              )
            })()}

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
      onSign={selectedDokumen?.onSign}
      isSigning={isSigning}
    />

    <ConfirmDialog
      isOpen={showRapatConfirm}
      title="Konfirmasi Rapat"
      message="Apakah hari ini Anda akan mengadakan rapat?"
      confirmText="Ya, adakan rapat"
      cancelText="Tidak"
      onConfirm={() => {
        setShowRapatConfirm(false)
        setSelectedDokumen({
          url: komtekFiles.ba_komtek!,
          title: 'BA Komtek',
          onSign: handleSignBaKomtek,
        })
      }}
      onCancel={() => setShowRapatConfirm(false)}
    />
  </>
  )
}
