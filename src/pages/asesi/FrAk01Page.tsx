import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import AsesiLayout from "@/components/AsesiLayout"
import ModularAsesiLayout from "@/components/ModularAsesiLayout"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/ToastContext"
import { useKegiatanByRole } from "@/hooks/useKegiatanByRole"
import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useDataDokumenPraAsesmen } from "@/hooks/useDataDokumenPraAsesmen"
import { ActionButton } from "@/components/ui/ActionButton"
import { CustomCheckbox } from "@/components/ui/Checkbox"
import { useAbsenCheck } from "@/hooks/useAbsenCheck"
import { WebcamModal } from "@/components/ui/WebcamModal"
import { TimePickerModal } from "@/components/ui/TimePickerModal"
import { API_BASE_URL } from "@/config/api"
import { useSigningState, BarcodeState } from "@/hooks/useSigningState"
import { getAsesmenSteps } from "@/lib/asesmen-steps"
import { FullPageLoader } from "@/components/ui/loading-spinner"

interface BuktiAsesmen {
  id: number
  nama: string
}

interface BarcodeData {
  url: string
  tanggal: string
  nama: string
}

interface Answer {
  id_referensi: number
  jawaban: boolean
}

interface Ak01Data {
  skemaJudul?: string
  skemaNomor?: string
  tuk?: string
  namaAsesor?: string
  namaAsesi?: string
  hariTanggal?: string
  waktu?: string
  tukPelaksanaan?: string
  buktiYangDikumpulkan?: number[]
  tandaTanganAsesor?: string
  tanggalTandaTanganAsesor?: string
  tandaTanganAsesi?: string
  tanggalTandaTanganAsesi?: string
}

interface Ak01ApiResponse {
  message: string
  data: {
    barcodes?: {
      asesi?: BarcodeData | null
      asesor1?: BarcodeData | null
      asesor2?: BarcodeData | null
    }
    items: BuktiAsesmen[]
    waktu?: string
  }
}

export default function FrAk01Page() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showWarning, showSuccess } = useToast()
  const { kegiatan, isAsesor } = useKegiatanByRole()
  const { idIzin: idIzinFromUrl } = useParams<{ idIzin: string }>()
  const location = useLocation()

  const idIzin = isAsesor ? idIzinFromUrl : user?.id_izin
  const isAsesmenFlow = location.pathname.includes('/asesmen/')
  const isPerjanjianFlow = location.pathname.includes('/perjanjian/')
  const successPath = isPerjanjianFlow ? '/asesi/perjanjian/ak01-success' : '/asesi/praasesmen/ak01-success'

  const [buktiList, setBuktiList] = useState<BuktiAsesmen[]>([])
  const [barcodes, setBarcodes] = useState<{
    asesi?: BarcodeData | null
    asesor1?: BarcodeData | null
    asesor2?: BarcodeData | null
  } | null>(null)
  const [formData, setFormData] = useState<Ak01Data>({
    buktiYangDikumpulkan: []
  })
  const [isSaving, setIsSaving] = useState(false)
  const [actualIdIzin, setActualIdIzin] = useState<string | undefined>(idIzin)
  const [waktuAk01, setWaktuAk01] = useState('')
  const [jam, setJam] = useState(() => {
    // Initialize to current Indonesian time (WIB = GMT+7)
    const now = new Date()
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
    const wib = new Date(utc + (3600000 * 7))
    return String(wib.getHours()).padStart(2, '0')
  })
  const [menit, setMenit] = useState(() => {
    const now = new Date()
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
    const wib = new Date(utc + (3600000 * 7))
    return String(wib.getMinutes()).padStart(2, '0')
  })
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [pendingToSuccessPage, setPendingToSuccessPage] = useState(false)
  const [showMasukAsesmenModal, setShowMasukAsesmenModal] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const { jabatanKerja, nomorSkema, tuk, namaAsesor, asesorList, namaAsesi, tanggalUji, tahap, jadwalId, jenjang, metode } = useDataDokumenPraAsesmen(actualIdIzin)
  const isLowJenjangAsesor = jenjang && parseInt(jenjang) < 4 && isAsesor

  // Absen check - auto-detect role (asesi/asesor1/asesor2)
  const {
    showAwalModal,
    showAkhirModal,
    setShowAkhirModal,
    submitAbsenAwal,
    submitAbsenAkhir,
    handleAwalModalClose,
    shouldShowAkhirModal: _shouldShowAkhirModal,
  } = useAbsenCheck({
    phase: 'praasesmen',
    role: 'auto',
    checkOnMount: true, // Enable for both asesi and asesor
    idIzin: actualIdIzin,
    asesorList: asesorList,
    tahap: tahap
  })

  // Format tanggal_uji untuk Hari/Tanggal dan Waktu
  const formatTanggalUji = (tanggalUjiStr: string) => {
    if (!tanggalUjiStr) return { hariTanggal: '', waktu: '' }

    const date = new Date(tanggalUjiStr)

    // Format Hari/Tanggal: "Jumat, 06 Februari 2026"
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    const hariTanggal = `${days[date.getDay()]}, ${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`

    // Format Waktu: "19:05"
    const waktu = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

    return { hariTanggal, waktu }
  }

  const { hariTanggal } = formatTanggalUji(tanggalUji)

  const initialFetchDone = useRef(false)

  const fetchData = useCallback(async () => {
      const token = localStorage.getItem("access_token")

      // Use idIzin from URL params or fetch from list-asesi
      let fetchedIdIzin = idIzin

      if (!fetchedIdIzin && !isAsesor && jadwalId) {
        const listAsesiResponse = await fetch(`${API_BASE_URL}/kegiatan/${jadwalId}/list-asesi`, {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        })

        if (listAsesiResponse.ok) {
          const listResult = await listAsesiResponse.json()
          if (listResult.message === "Success" && listResult.list_asesi && listResult.list_asesi.length > 0) {
            fetchedIdIzin = listResult.list_asesi[0].id_izin
            setActualIdIzin(fetchedIdIzin)
          }
        }
      }

      if (!fetchedIdIzin) {
        setIsDataLoading(false)
        return
      }

      // Fetch bukti asesmen options
      const buktiRes = await fetch(`${API_BASE_URL}/praasesmen/${fetchedIdIzin}/ak01`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })
      if (buktiRes.ok) {
        const result: Ak01ApiResponse = await buktiRes.json()

        // Set bukti list and barcodes
        const data = result.data?.items || []
        setBuktiList(data)

        // Set barcodes from response
        if (result.data?.barcodes) {
          setBarcodes(result.data.barcodes)
        }

        // Set checked items from jawaban field
        const checkedIds = data
          .filter((item: any) => item.jawaban === true)
          .map((item: any) => item.id)
        setFormData(prev => ({ ...prev, buktiYangDikumpulkan: checkedIds }))

        // Set waktu from API response
        if (result.data?.waktu) {
          setWaktuAk01(result.data.waktu)
          // Parse "HH:MM - Selesai" format
          const match = result.data.waktu.match(/^(\d{1,2}):(\d{2})/)
          if (match) {
            setJam(match[1].padStart(2, '0'))
            setMenit(match[2])
          }
        }
      }
      setIsDataLoading(false)
  }, [idIzin, kegiatan, isAsesor, jadwalId])

  useEffect(() => {
    if (initialFetchDone.current) return
    if ((isAsesor && idIzin) || kegiatan || jadwalId) {
      initialFetchDone.current = true
      window.scrollTo(0, 0)
      fetchData()
    }
  }, [idIzin, kegiatan, isAsesor, jadwalId, fetchData])

  const signing = useSigningState({
    pageKey: 'ak01',
    isAsesor,
    tahap,
    barcodes: barcodes as BarcodeState | null,
    setBarcodes: setBarcodes as React.Dispatch<React.SetStateAction<BarcodeState | null>>,
    asesorList,
    userId: user?.id,
    userName: user?.name,
    isSaving,
    idIzin: actualIdIzin,
    jadwalId,
    onRefresh: fetchData,
    nextPageName: 'Proses Asesmen',
  })

  const asesmenSteps = useMemo(() => {
    if (!jenjang) return []
    return getAsesmenSteps(jenjang, isAsesor, undefined, 0, metode)
  }, [jenjang, isAsesor, metode])

  // Legacy aliases for hook-managed state
  const allSigned = signing.allSigned
  const allAsesorSigned = signing.allAsesorSigned
  const asesiHasSigned = signing.asesiHasSigned
  const missingAsesorLabels = signing.missingLabels
  const asesorHasSigned = signing.asesorHasSigned

  // Sync waktuAk01 when jam/menit changes (not when allSigned)
  useEffect(() => {
    if (!allSigned) {
      setWaktuAk01(`${jam}:${menit} - Selesai`)
    }
  }, [jam, menit, allSigned])

  const handleBack = () => {
    navigate(-1)
  }

  // Handle absen akhir modal close
  const handleAbsenAkhirModalClose = () => {
    setShowAkhirModal(false)

    // If waiting for absen akhir before navigating
    if (pendingToSuccessPage) {
      setPendingToSuccessPage(false)
      // Asesor & asesi both go to success page
      navigate(successPath, { state: { jadwalId } })
    }
  }

  // Handle absen akhir submission
  const handleAbsenAkhirSubmit = async (blob: Blob) => {
    await submitAbsenAkhir(blob)
    // Modal will close via handleAbsenAkhirModalClose which handles navigation
  }

  const handleSave = async () => {
    // Tahap 0: langsung navigasi tanpa save/ttd
    if (tahap === 0) {
      const isLowJenjang = jenjang && parseInt(jenjang) < 4
      const isPortofolio = metode?.toLowerCase() === 'portofolio'
      const nextStep = isLowJenjang ? 'ia01' : (isPortofolio ? 'ia08' : 'ia04a')
      navigate(`/asesi/asesmen/${actualIdIzin}/${nextStep}`)
      return
    }

    // If asesor already signed -> check absen akhir before navigate (skip untuk tahap 0)
    if (tahap !== 0 && isAsesor && asesorHasSigned) {
      if (isAsesmenFlow || tahap === 2 || isLowJenjangAsesor) {
        setShowMasukAsesmenModal(true)
        return
      }
      // Check if absen akhir needed
      const needsAbsenAkhir = await _shouldShowAkhirModal()
      if (needsAbsenAkhir) {
        setPendingToSuccessPage(true)
        setShowAkhirModal(true)
        return
      }
      navigate(successPath, { state: { jadwalId } })
      return
    }

    // If asesi already signed -> check absen akhir before navigate (skip untuk tahap 0)
    if (tahap !== 0 && !isAsesor && asesiHasSigned) {
      if (isAsesmenFlow || tahap === 2) {
        setShowMasukAsesmenModal(true)
        return
      }
      // Check if absen akhir needed
      const needsAbsenAkhir = await _shouldShowAkhirModal()
      if (needsAbsenAkhir) {
        setPendingToSuccessPage(true)
        setShowAkhirModal(true)
        return
      }
      if (isAsesor) {
        navigate(`/asesor/asesi/${jadwalId}`)
      } else {
        navigate(successPath)
      }
      return
    }

    // Guard: asesi cannot submit until all asesor have signed (skip untuk tahap 0)
    if (tahap !== 0 && !isAsesor && !allAsesorSigned) {
      showWarning(`Menunggu tanda tangan: ${missingAsesorLabels.join(', ')}`)
      return
    }

    setIsSaving(true)
    try {
      const token = localStorage.getItem("access_token")

      // Transform selected bukti to answers format
      const answers: Answer[] = buktiList.map(bukti => ({
        id_referensi: bukti.id,
        jawaban: formData.buktiYangDikumpulkan?.includes(bukti.id) || false
      }))

      const response = await fetch(`${API_BASE_URL}/praasesmen/${actualIdIzin}/ak01`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ answers, waktu: waktuAk01 || `${jam}:${menit} - Selesai` }),
      })

      if (response.ok) {
        // Generate QR using hook (handles both asesor and asesi roles)
        if (tahap !== 0 && jadwalId) {
          await signing.generateQR()
        }

        // Show success toast, stay on page
        showSuccess('Dokumen berhasil ditandatangani!')

        // Notify other users viewing this page
        signing.publishUpdate()

        // Untuk asesmen flow, show floating modal
        if (isAsesmenFlow) {
          setShowMasukAsesmenModal(true)
          return
        }

        // Perjanjian flow (tahap 2) or jenjang 1 asesor: show floating modal to proceed to asesmen
        if (tahap === 2 || isLowJenjangAsesor) {
          setShowMasukAsesmenModal(true)
          return
        }

        // Untuk tahap 0, langsung navigasi ke halaman berikutnya
        if (tahap === 0) {
          setTimeout(() => {
            navigate(`/asesi/asesmen/{actualIdIzin}/ia04a`)
          }, 500)
        }
      } else {
        console.error('Failed to save:', await response.text())
      }
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const pageContent = (
    <>
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', marginBottom: '4px', textTransform: 'uppercase' }}>FR.AK.01 - PERSETUJUAN ASESMEN</h2>
        <p style={{ fontSize: '13px', color: '#666' }}>Isi atau lengkapi data formulir AK 01 di bawah ini</p>

      </div>

      {/* Form Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', background: '#fff' }}>
        <tbody>
          {/* Penjelasan */}
          <tr>
            <td colSpan={4} style={{ border: '1px solid #000', padding: '6px 8px' }}>
              Persetujuan Asesmen ini untuk menjamin bahwa Asesi telah diberi arahan
              secara rinci tentang perencanaan dan proses asesmen
            </td>
          </tr>

          {/* Skema Sertifikasi */}
          <tr>
            <td rowSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', width: '35%', fontWeight: 'bold', verticalAlign: 'top' }}>
              Skema Sertifikasi<br />(̶𝙺̶𝙺̶𝙽̶𝙸̶/Okupasi/̶𝙺̶𝚕̶𝚊̶𝚜̶𝚝̶𝚎̶𝚛̶)̶
            </td>
            <td style={{ border: '1px solid #000', padding: '6px 8px', width: '15%', fontWeight: 'bold' }}>Judul</td>
            <td style={{ border: '1px solid #000', padding: '6px 8px', width: '5%', textAlign: 'center', fontWeight: 'bold' }}>:</td>
            <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{jabatanKerja?.toUpperCase() || formData.skemaJudul || '-'}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Nomor</td>
            <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>:</td>
            <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{nomorSkema?.toUpperCase() || formData.skemaNomor || '-'}</td>
          </tr>

          {/* Identitas */}
          <tr>
            <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>TUK</td>
            <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>:</td>
            <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 8px' }}>{tuk?.toUpperCase() || formData.tuk || 'Sewaktu/Tempat Kerja/Mandiri*'}</td>
          </tr>
          {asesorList.length > 1 ? (
            asesorList.map((asesor, idx) => (
              <tr key={asesor.id}>
                <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Nama Asesor {idx + 1}</td>
                <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>:</td>
                <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 8px' }}>
                  {asesor.nama?.toUpperCase() || ''}{asesor.noreg && ` (${asesor.noreg})`}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Nama Asesor</td>
              <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>:</td>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 8px' }}>
                {asesorList.length > 0
                  ? `${asesorList[0].nama?.toUpperCase() || ''}${asesorList[0].noreg ? ` (${asesorList[0].noreg})` : ''}`
                  : namaAsesor?.toUpperCase() || formData.namaAsesor || '-'}
              </td>
            </tr>
          )}
          <tr>
            <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Nama Asesi</td>
            <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>:</td>
            <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 8px' }}>{namaAsesi?.toUpperCase() || user?.name?.toUpperCase() || formData.namaAsesi || '-'}</td>
          </tr>

          {/* Bukti yang akan dikumpulkan */}
          <tr>
            <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', verticalAlign: 'top' }}>
              Bukti yang akan dikumpulkan :
            </td>
            <td colSpan={3} style={{ border: '1px solid #000', padding: '6px 8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {buktiList.map((bukti, index) => {
                    const isFirstInRow = index % 2 === 0
                    return (
                      <tr key={bukti.id}>
                        {isFirstInRow && (
                          <>
                            <td style={{ padding: '2px 4px', border: 'none' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'not-allowed', opacity: '0.7' }}>
                                <CustomCheckbox
                                  checked={formData.buktiYangDikumpulkan?.includes(bukti.id) || false}
                                  onChange={() => {}}
                                  disabled
                                />
                                {bukti.nama}
                              </label>
                            </td>
                            {buktiList[index + 1] ? (
                              <td style={{ padding: '2px 4px', border: 'none' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'not-allowed', opacity: '0.7' }}>
                                  <CustomCheckbox
                                    checked={formData.buktiYangDikumpulkan?.includes(buktiList[index + 1].id) || false}
                                    onChange={() => {}}
                                    disabled
                                  />
                                  {buktiList[index + 1].nama}
                                </label>
                              </td>
                            ) : (
                              <td style={{ padding: '2px 4px', border: 'none' }}></td>
                            )}
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </td>
          </tr>

          {/* Jadwal Pelaksanaan */}
          <tr>
            <td rowSpan={3} style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', verticalAlign: 'top' }}>
              Pelaksanaan asesmen disepakati pada:
            </td>
            <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Hari / Tanggal</td>
            <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>:</td>
            <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{hariTanggal || formData.hariTanggal || ''}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Waktu</td>
            <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>:</td>
            <td style={{ border: '1px solid #000', padding: '6px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>{waktuAk01 || `${jam}:${menit} - Selesai`}</span>
                <button
                  type="button"
                  onClick={() => isAsesor && setShowTimePicker(true)}
                  disabled={allSigned || !isAsesor}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: (allSigned || !isAsesor) ? '#cbd5e1' : '#fff',
                    color: (allSigned || !isAsesor) ? '#fff' : '#64748b',
                    fontSize: '13px',
                    fontWeight: '600',
                    borderRadius: '6px',
                    cursor: (allSigned || !isAsesor) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: (allSigned || !isAsesor) ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (allSigned || !isAsesor) return
                    e.currentTarget.style.backgroundColor = '#f8fafc'
                    e.currentTarget.style.borderColor = '#cbd5e1'
                  }}
                  onMouseLeave={(e) => {
                    if (allSigned || !isAsesor) return
                    e.currentTarget.style.backgroundColor = '#fff'
                    e.currentTarget.style.borderColor = '#e2e8f0'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Pilih Jam
                </button>
              </div>
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>TUK</td>
            <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>:</td>
            <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{tuk?.toUpperCase() || formData.tukPelaksanaan || ''}</td>
          </tr>

                <tr>
            <td colSpan={4} style={{ border: '1px solid #000', padding: '6px 8px' }}>
              <span style={{ fontWeight: 'bold' }}>Asesi :</span><br /><br />
              Bahwa saya telah mendapatkan penjelasan terkait hak dan prosedur banding asesmen dari asesor.
            </td>
          </tr>
          {/* Pernyataan Asesor */}
          <tr>
            <td colSpan={4} style={{ border: '1px solid #000', padding: '6px 8px' }}>
              <span style={{ fontWeight: 'bold' }}>Asesor :</span><br /><br />
              Menyatakan tidak akan membuka hasil pekerjaan yang saya peroleh karena
              penugasan saya sebagai Asesor dalam pekerjaan Asesmen kepada siapapun
              atau organisasi apapun selain kepada pihak yang berwenang sehubungan
              dengan kewajiban saya sebagai Asesor yang ditugaskan oleh LSP.
            </td>
          </tr>

          {/* Pernyataan Asesi */}
          <tr>
            <td colSpan={4} style={{ border: '1px solid #000', padding: '6px 8px' }}>
              <span style={{ fontWeight: 'bold' }}>Asesi :</span><br /><br />
              Saya setuju mengikuti asesmen dengan pemahaman bahwa informasi yang
              dikumpulkan hanya digunakan untuk pengembangan profesional dan hanya
              dapat diakses oleh orang tertentu saja.
            </td>
          </tr>

          {/* Tanda Tangan */}
          {barcodes?.asesor2?.url ? (
            // Jika ada 2 asesor, tampilkan 2 baris terpisah
            <>
              <tr>
                <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', height: '70px', verticalAlign: 'bottom' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    Tanda tangan Asesor 1 :<br />
                    {barcodes?.asesor1?.url ? (
                      <>
                        <img src={barcodes.asesor1?.url} alt="Tanda Tangan Asesor 1" style={{ height: '50px', width: '50px', objectFit: 'contain' }} />
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#333' }}>
                          {barcodes.asesor1?.nama?.toUpperCase()}
                        </div>
                        {barcodes?.asesor1?.tanggal && (
                          <span style={{ fontSize: '10px', color: '#666' }}>
                            {new Date(barcodes.asesor1?.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>{formData.tandaTanganAsesor || '.............................................'}</span>
                    )}
                  </div>
                </td>
                <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', height: '70px', verticalAlign: 'bottom' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    Tanda tangan Asesor 2 :<br />
                    {barcodes?.asesor2?.url ? (
                      <>
                        <img src={barcodes.asesor2?.url} alt="Tanda Tangan Asesor 2" style={{ height: '50px', width: '50px', objectFit: 'contain' }} />
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#333' }}>
                          {barcodes.asesor2?.nama?.toUpperCase()}
                        </div>
                        {barcodes?.asesor2?.tanggal && (
                          <span style={{ fontSize: '10px', color: '#666' }}>
                            {new Date(barcodes.asesor2.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>{formData.tandaTanganAsesor || '.............................................'}</span>
                    )}
                  </div>
                </td>
              </tr>
              {/* Asesi tetap ditampilkan di baris terpisah */}
              <tr>
                <td colSpan={4} style={{ border: '1px solid #000', padding: '6px 8px', height: '70px', verticalAlign: 'bottom' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    Tanda tangan Asesi :<br />
                    {barcodes?.asesi?.url ? (
                      <>
                        <img src={barcodes.asesi?.url} alt="Tanda Tangan Asesi" style={{ height: '50px', width: '50px', objectFit: 'contain' }} />
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#333' }}>
                          {barcodes.asesi?.nama?.toUpperCase()}
                        </div>
                        {barcodes?.asesi?.tanggal && (
                          <span style={{ fontSize: '10px', color: '#666' }}>
                            {new Date(barcodes.asesi?.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>{formData.tandaTanganAsesi || '..............................................'}</span>
                    )}
                  </div>
                </td>
              </tr>
            </>
          ) : (
            // Jika hanya 1 asesor atau belum ada QR, tampilkan 1 baris
            <tr>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', height: '70px', verticalAlign: 'bottom' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  Tanda tangan Asesor :<br />
                  {barcodes?.asesor1?.url ? (
                    <>
                      <img src={barcodes.asesor1?.url} alt="Tanda Tangan Asesor" style={{ height: '50px', width: '50px', objectFit: 'contain' }} />
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#333' }}>
                        {barcodes.asesor1?.nama?.toUpperCase()}
                      </div>
                      {barcodes?.asesor1?.tanggal && (
                        <span style={{ fontSize: '10px', color: '#666' }}>
                          {new Date(barcodes.asesor1?.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      )}
                    </>
                  ) : (
                    <span>{formData.tandaTanganAsesor || '.............................................'}</span>
                  )}
                </div>
              </td>
            <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', height: '70px', verticalAlign: 'bottom' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                Tanda tangan Asesi :<br />
                {barcodes?.asesi?.url ? (
                  <>
                    <img src={barcodes.asesi.url} alt="Tanda Tangan Asesi" style={{ height: '50px', width: '50px', objectFit: 'contain' }} />
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#333' }}>
                      {barcodes.asesi.nama?.toUpperCase()}
                    </div>
                    {barcodes?.asesi?.tanggal && (
                      <span style={{ fontSize: '10px', color: '#666' }}>
                        {new Date(barcodes.asesi.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    )}
                  </>
                ) : (
                  <span>{formData.tandaTanganAsesi || '..............................................'}</span>
                )}
              </div>
            </td>

          </tr>
          )}
        </tbody>
      </table>

      <p style={{ fontSize: '12px' }}>* Coret yang tidak perlu</p>

      {/* Pernyataan */}
      {!allSigned && (
      <div style={{ background: '#fff', border: '1px solid #000', marginBottom: '20px', padding: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: allSigned ? 'not-allowed' : 'pointer' }}>
          <CustomCheckbox
            checked={signing.agreedChecklist}
            onChange={() => signing.setAgreedChecklist(!signing.agreedChecklist)}
            disabled={allSigned}
            style={{ marginTop: '2px', cursor: allSigned ? 'not-allowed' : 'pointer' }}
          />
          <span style={{ fontSize: '12px', color: '#000', lineHeight: '1.5' }}>
            <strong style={{ textTransform: 'uppercase' }}>Pernyataan:</strong> Saya menyatakan bahwa saya telah memahami dan menyetujui isi FR.AK.01 (Persetujuan Asesmen) ini dengan sebenar-benarnya.
          </span>
        </label>
      </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
        {isAsesor && (
          <ActionButton variant="secondary" onClick={handleBack} disabled={isSaving}>
            Kembali
          </ActionButton>
        )}
        <ActionButton variant="primary" onClick={handleSave} disabled={signing.buttonDisabled}>
          {isSaving ? 'Menyimpan...' : signing.buttonText}
        </ActionButton>
      </div>
    </>
  )

  if (isDataLoading) return <FullPageLoader text="Memuat data..." />

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Header */}

      <AsesmenBreadcrumb currentPage="FR.AK.01" />

      {isAsesmenFlow ? (
        <ModularAsesiLayout currentStep={1} steps={asesmenSteps} id={actualIdIzin} title="Perjanjian Asesmen">
          {pageContent}
        </ModularAsesiLayout>
      ) : (
        <AsesiLayout currentStep={isPerjanjianFlow ? 1 : 9} idIzin={actualIdIzin} tahap={tahap} flow={isPerjanjianFlow ? 'perjanjian' : 'praasesmen'}>
          {pageContent}
        </AsesiLayout>
      )}

      {/* Absen Awal Modal */}
      <WebcamModal
        isOpen={showAwalModal}
        onClose={handleAwalModalClose}
        onSubmit={submitAbsenAwal}
        title="Absen Masuk Pra-Asesmen"
        description="Silakan ambil foto wajah Anda untuk absen masuk"
        canClose={false}
      />

      {/* Absen Akhir Modal */}
      <WebcamModal
        isOpen={showAkhirModal}
        onClose={handleAbsenAkhirModalClose}
        onSubmit={handleAbsenAkhirSubmit}
        title="Absen Keluar Pra-Asesmen"
        description="Silakan ambil foto wajah Anda untuk absen keluar"
        canClose={false}
      />

      {/* Time Picker Modal */}
      <TimePickerModal
        isOpen={showTimePicker}
        initialHour={jam}
        initialMinute={menit}
        onSave={(h, m) => {
          setJam(h)
          setMenit(m)
          setShowTimePicker(false)
        }}
        onClose={() => setShowTimePicker(false)}
      />

      {/* Masuk ke Proses Asesmen Modal */}
      {showMasukAsesmenModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            animation: 'modalSlideIn 0.3s ease-out',
            textAlign: 'center',
          }}>
            <style>{`
              @keyframes modalSlideIn {
                from { opacity: 0; transform: translateY(-20px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>

            {/* Success icon */}
            <svg style={{ width: '56px', height: '56px', margin: '0 auto 16px' }} viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="25" fill="#10b981" opacity="0.15"/>
              <path d="M14 27l7 7 16-16" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
              Perjanjian Asesmen Selesai
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', lineHeight: '1.5' }}>
              Seluruh proses perjanjian asesmen telah selesai. Silakan masuk ke proses asesmen untuk melanjutkan.
            </p>

            <button
              onClick={() => {
                setShowMasukAsesmenModal(false)
                const firstStep = asesmenSteps.length > 1 ? asesmenSteps[1] : null
                if (firstStep) {
                  const targetHref = firstStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${actualIdIzin}/`)
                  navigate(targetHref)
                } else {
                  navigate('/asesi/dashboard')
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                background: '#0066cc',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#0052a3'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#0066cc'}
            >
              Lanjut ke Proses Asesmen
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
