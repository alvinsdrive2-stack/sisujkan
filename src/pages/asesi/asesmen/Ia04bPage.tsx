import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
import { useNavigate, useParams } from "react-router-dom"
import ModularAsesiLayout from "@/components/ModularAsesiLayout"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/ToastContext"
import { extractErrorMessage } from "@/lib/error-utils"
import { useDataDokumenAsesmen } from "@/hooks/useDataDokumenAsesmen"
import { useDataDokumenPraAsesmen } from "@/hooks/useDataDokumenPraAsesmen"
import { useAsesorRole } from "@/hooks/useAsesorRole"
import { useKegiatanByRole } from "@/hooks/useKegiatanByRole"
import { useAbsenCheck } from "@/hooks/useAbsenCheck"
import { useSigningState, BarcodeState } from "@/hooks/useSigningState"
import { getAsesmenSteps } from "@/lib/asesmen-steps"
import { CustomCheckbox } from "@/components/ui/Checkbox"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { ActionButton } from "@/components/ui/ActionButton"
import { WebcamModal } from "@/components/ui/WebcamModal"
import { FullPageLoader } from "@/components/ui/loading-spinner"
import { API_BASE_URL } from "@/config/api"

interface Soal {
  id: number
  no: string
  jenis: string
  soal: string
  soal1: string
  soal2: string
  is_komentar: string | null
  jawaban?: string
  pencapaian?: boolean
}

interface Rekomendasi {
  id: number
  no: string
  jenis: string
  soal: string
  is_komentar: string | null
  rekomendasi?: boolean
}

type BarcodeData = {
  url: string
  tanggal: string
  nama: string
}

interface ApiResponse {
  message: string
  data: {
    barcodes?: {
      asesi?: BarcodeData
      asesor1?: BarcodeData | null
      asesor2?: BarcodeData | null
    }
    dokumen: {
      id: number
      nama_dokumen: string
    }
    soal: Soal[]
    rekomendasi?: Rekomendasi
  }
}

export default function Ia04bPage() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { id } = useParams<{ id?: string }>()
  const { jenjang, metode, jabatanKerja, nomorSkema, namaAsesor: _namaAsesor, tuk, asesorList, namaAsesi, jadwalId } = useDataDokumenAsesmen(id)
  const { tahap } = useDataDokumenPraAsesmen(id)
  const { role: asesorRole } = useAsesorRole(id)
  const { showSuccess, showError, showWarning } = useToast()
  const { kegiatan: _kegiatan, isAsesor } = useKegiatanByRole()

  const [ia04bData, setIa04bData] = useState<ApiResponse["data"] | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [answers, setAnswers] = useState<Record<number, 'ya' | 'tidak'>>({})
  const [rekomendasi, setRekomendasi] = useState<'kompeten' | 'belum_kompeten' | null>(null)
  const initializedRef = useRef(false)
  const [jawabanAnswers, setJawabanAnswers] = useState<Record<number, string>>({})
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [barcodes, setBarcodes] = useState<{
    asesi?: BarcodeData
    asesor1?: BarcodeData | null
    asesor2?: BarcodeData | null
  } | null>(null)
  const fetchingRef = useRef(false)

  // Absen check - auto-detect role (asesi/asesor1/asesor2)
  const { showAwalModal, submitAbsenAwal, handleAwalModalClose } = useAbsenCheck({
    phase: 'asesmen',
    role: 'auto',
    checkOnMount: true,
    idIzin: id,
    asesorList
  })

  const fetchData = useCallback(async () => {
      if (authLoading) return
      if (!id) {
        console.error("No id_izin found in user data")
        return
      }
      if (fetchingRef.current) return
      fetchingRef.current = true

      try {
        const token = localStorage.getItem("access_token")
        const response = await fetch(`${API_BASE_URL}/asesmen/${id}/ia04b`, {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const result: ApiResponse = await response.json()

          if (result.message === "Success") {
            setIa04bData(result.data)

            // Set barcodes - use asesor1/asesor2 format directly
            if (result.data.barcodes) {
              const apiBarcodes = result.data.barcodes as {
                asesi?: BarcodeData
                asesor1?: BarcodeData | null
                asesor2?: BarcodeData | null
              }

              setBarcodes({
                asesi: apiBarcodes.asesi,
                asesor1: apiBarcodes.asesor1,
                asesor2: apiBarcodes.asesor2,
              })
            }

            // Initialize checkbox states from API response (only on first load, synchronous guard)
            if (!initializedRef.current) {
              const newAnswers: Record<number, 'ya' | 'tidak'> = {}
              const newJawabanAnswers: Record<number, string> = {}
              result.data.soal.forEach((soal) => {
                if (soal.pencapaian === true) {
                  newAnswers[soal.id] = 'ya'
                } else if (soal.pencapaian === false) {
                  newAnswers[soal.id] = 'tidak'
                }
                if (soal.jawaban) {
                  newJawabanAnswers[soal.id] = soal.jawaban
                }
              })
              setAnswers(newAnswers)
              setJawabanAnswers(newJawabanAnswers)

              if (result.data.rekomendasi?.rekomendasi === true) {
                setRekomendasi('kompeten')
              } else if (result.data.rekomendasi?.rekomendasi === false) {
                setRekomendasi('belum_kompeten')
              }

              initializedRef.current = true
            }
          }
        } else {
          console.warn(`IA04B API returned ${response.status}`)
        }
      } catch (error) {
        console.error("Error fetching IA04B:", error)
      } finally {
        fetchingRef.current = false
      }
  }, [id, authLoading, asesorList])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const asesmenSteps = useMemo(() => getAsesmenSteps(jenjang, isAsesor, asesorRole, asesorList.length, metode, tahap), [jenjang, isAsesor, asesorRole, asesorList.length, metode, tahap])
  const nextStepLabel = asesmenSteps[asesmenSteps.findIndex(s => s.href.includes('ia04b')) + 1]?.label
  const signing = useSigningState({
    pageKey: 'ia04b',
    isAsesor,
    tahap,
    barcodes: barcodes as unknown as BarcodeState | null,
    setBarcodes: setBarcodes as unknown as React.Dispatch<React.SetStateAction<BarcodeState | null>>,
    asesorList,
    userId: user?.id,
    userName: user?.name,
    isSaving,
    idIzin: id,
    jadwalId,
    nextPageName: nextStepLabel,
    onRefresh: fetchData,
  })
  const publishUpdate = signing.publishUpdate

  const canEdit = isAsesor && !signing.asesorHasSigned

  const handleAnswerChange = (soalId: number, value: 'ya' | 'tidak') => {
    setAnswers(prev => ({
      ...prev,
      [soalId]: value
    }))
  }

  const handleJawabanChange = (soalId: number, value: string) => {
    setJawabanAnswers(prev => ({
      ...prev,
      [soalId]: value
    }))
  }

  const autoResizeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  const saveNilaiIA04B = async () => {
    if (!ia04bData) return

    try {
      const token = localStorage.getItem('access_token')

      // Build evaluations array from answers state
      const evaluations = ia04bData.soal.map(soal => ({
        soal_id: soal.id,
        pencapaian: answers[soal.id] === 'ya' // 'ya' = true, 'tidak' = false
      }))

      // Build rekomendasi
      const rekomendasiPayload = {
        soal_id: ia04bData.rekomendasi?.id!,
        value: rekomendasi === 'kompeten' // 'kompeten' = true, 'belum_kompeten' = false
      }

      const payload = {
        dokumen_id: ia04bData.dokumen.id,
        evaluations,
        rekomendasi: rekomendasiPayload
      }

      const response = await fetch(`${API_BASE_URL}/asesmen/${id}/nilai-ia04b`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      return response.ok
    } catch (error) {
      console.error('Error saving nilai IA04B:', error)
      return false
    }
  }

  const handleSave = async () => {
    // Tahap 0: skip save/TTD, langsung navigasi next
    if (tahap === 0) {
      const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ia04b'))
      const nextStep = asesmenSteps[currentStepIndex + 1]
      navigate(nextStep ? nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`) : `/asesi/asesmen/${id}/selesai`)
      return
    }
    // If all signed → redirect
    if (signing.allSigned) {
      const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ia04b'))
      const nextStep = asesmenSteps[currentStepIndex + 1]
      if (nextStep) {
        const nextPath = nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`)
        navigate(nextPath)
      } else {
        navigate(`/asesi/asesmen/${id}/selesai`)
      }
      return
    }

    // If current user already signed but others haven't → redirect (prevent re-generate QR)
    if (!isAsesor && signing.asesiHasSigned) {
      const stepIdx = asesmenSteps.findIndex(s => s.href.includes('ia04b'))
      const next = asesmenSteps[stepIdx + 1]
      navigate(next ? next.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`) : `/asesi/asesmen/${id}/selesai`)
      return
    }

    if (isAsesor && signing.asesorHasSigned) {
      const stepIdx = asesmenSteps.findIndex(s => s.href.includes('ia04b'))
      const next = asesmenSteps[stepIdx + 1]
      navigate(next ? next.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`) : `/asesi/asesmen/${id}/selesai`)
      return
    }

    if (!signing.agreedChecklist) {
      showWarning('Silakan centang pernyataan terlebih dahulu.')
      return
    }

    // Guard: asesi cannot submit until all asesor have signed
    if (!isAsesor && !signing.allAsesorSigned) {
      showWarning(`Menunggu tanda tangan: ${signing.missingLabels.join(', ')}`)
      return
    }

    if (!ia04bData) {
      showWarning('Data belum dimuat.')
      return
    }

    if (!id) {
      showWarning('ID tidak ditemukan.')
      return
    }

    setIsSaving(true)

    try {
      const token = localStorage.getItem('access_token')

      // 1. Save jawaban answers
      const answersPayload = ia04bData.soal.map(soal => ({
        soal_id: soal.id,
        jawaban: jawabanAnswers[soal.id] || soal.jawaban || ''
      }))

      const payload = {
        dokumen_id: ia04bData.dokumen.id,
        answers: answersPayload
      }

      const response = await fetch(`${API_BASE_URL}/asesmen/${id}/ia04b`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const result = await response.json()
        showError(`Gagal menyimpan jawaban: ${result.message || 'Terjadi kesalahan'}`)
        setIsSaving(false)
        return
      }

      // 2. Save nilai evaluations (only if asesor)
      if (isAsesor) {
        const nilaiSuccess = await saveNilaiIA04B()
        if (!nilaiSuccess) {
          showError('Gagal menyimpan nilai evaluasi. Silakan coba lagi.')
          setIsSaving(false)
          return
        }
      }

      // 3. Generate QR
      await signing.generateQR()
      publishUpdate()

      showSuccess('IA 04.B berhasil disimpan!')
    } catch (error) {
      showError(extractErrorMessage(error, 'Gagal menyimpan data. Silakan coba lagi.'))
    } finally {
      setIsSaving(false)
    }
  }

  // Auto-resize textareas when data is loaded
  useEffect(() => {
    if (initializedRef.current) {
      const textareas = document.querySelectorAll('textarea[data-auto-resize]')
      textareas.forEach((textarea) => {
        const ta = textarea as HTMLTextAreaElement
        ta.style.height = 'auto'
        ta.style.height = `${ta.scrollHeight}px`
      })
    }
  }, [ia04bData, jawabanAnswers])

  if (!ia04bData) return <FullPageLoader text="Memuat data..." />

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>

      <AsesmenBreadcrumb currentPage="IA.04.B" />

      <ModularAsesiLayout currentStep={asesmenSteps.find(s => s.href.includes('ia04b'))?.number || 2} steps={asesmenSteps} id={id} metode={metode}>
        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>
            FR.IA.04.B  {ia04bData?.dokumen?.nama_dokumen || 'LEMBAR PERIKSA KEGIATAN TERSTRUKTUR'}
          </h1>
        </div>

        {/* Info Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px', fontSize: '13px', background: '#ffffff', border: '1px solid #000' }}>
          <tbody>
            <tr style={{ background: '#ffffff' }}>
              <td style={{ width: '30%', border: '1px solid #000', padding: '6px' }}>Skema Sertifikasi (̶𝙺̶𝙺̶𝙽̶𝙸̶/Okupasi/̶𝙺̶𝚕̶𝚊̶𝚜̶𝚝̶𝚎̶𝚛̶)̶</td>
              <td style={{ width: '5%', border: '1px solid #000', padding: '6px' }}>Judul</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>{jabatanKerja?.toLocaleUpperCase() || ''}</td>
            </tr>
            <tr style={{ background: '#ffffff' }}>
              <td style={{ border: '1px solid #000', padding: '6px' }}></td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Nomor</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>{nomorSkema?.toUpperCase() || ''}</td>
            </tr>
            <tr style={{ background: '#ffffff' }}>
              <td style={{ border: '1px solid #000', padding: '6px' }}>TUK</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>{tuk?.toLocaleUpperCase() || ''}</td>
            </tr>
            {asesorList.length > 1 ? (
              asesorList.map((asesor, idx) => (
                <tr key={asesor.id} style={{ background: '#ffffff' }}>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>Nama Asesor {idx + 1}</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>:</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>
                    {asesor.nama?.toUpperCase() || ''}
                  </td>
                </tr>
              ))
            ) : (
              <tr style={{ background: '#ffffff' }}>
                <td style={{ border: '1px solid #000', padding: '6px' }}>Nama Asesor</td>
                <td style={{ border: '1px solid #000', padding: '6px' }}>:</td>
                <td style={{ border: '1px solid #000', padding: '6px' }}>
                  {asesorList[0]?.nama?.toUpperCase() || ''}
                </td>
              </tr>
            )}
            <tr style={{ background: '#ffffff' }}>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Nama Asesi</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>{namaAsesi?.toUpperCase() || user?.name?.toLocaleUpperCase() || ''}</td>
            </tr>
            <tr style={{ background: '#ffffff' }}>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Tanggal</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ fontSize: '12px', marginTop: '5px' }}>*Coret yang tidak perlu</div>

        {/* Panduan Bagi Asesor */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '14px', fontSize: '14px', background: '#fff', border: '1px solid #000' }}>
          <tbody>
            <tr style={{ background: '#c40000', color: '#fff', fontWeight: 'bold' }}>
              <td>PANDUAN BAGI ASESOR</td>
            </tr>
            <tr>
              <td style={{ background: '#ffffffe', border: '1px solid #000', padding: '6px' }}>
                <ul style={{ margin: '4px 0 4px 18px', paddingLeft: '18px', listStyleType: 'disc' }}>
                  <li style={{ marginBottom: '4px' }}>Lakukan penilaian pencapaian hasil proyek singkat atau kegiatan terstruktur lainnya melalui presentasi.</li>
                  <li style={{ marginBottom: '4px' }}>Penilaian dapat dilakukan untuk keseluruhan unit kompetensi atau per kelompok pekerjaan.</li>
                  <li style={{ marginBottom: '4px' }}>Pertanyaan disampaikan oleh asesor saat asesi melakukan presentasi.</li>
                  <li style={{ marginBottom: '4px' }}>Pertanyaan untuk pemenuhan pencapaian 5 dimensi kompetensi.</li>
                  <li style={{ marginBottom: '4px' }}>Isilah kolom lingkup penyajian proyek sesuai sektor/sub-sektor/profesi.</li>
                  <li style={{ marginBottom: '0' }}>Berikan keputusan pencapaian berdasarkan kesimpulan jawaban asesi.</li>
                </ul>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Main Assessment Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '14px', fontSize: '13px', background: '#fff', border: '1px solid #000' }}>
          <tbody>
            {/* Header Row 1 */}
            <tr style={{ background: '#c40000', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
              <td rowSpan={2} style={{ width: '5%', border: '1px solid #000', padding: '6px' }}>No</td>
              <td colSpan={3} style={{ width: '30%', border: '1px solid #000', padding: '6px' }}>Aspek Penilaian</td>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>Pencapaian</td>
            </tr>
            {/* Header Row 2 */}
            <tr style={{ background: '#c40000', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
              <td style={{ width: '30%', border: '1px solid #000', padding: '6px' }}>Lingkup Penyajian proyek atau kegiatan terstruktur lainnya</td>
              <td style={{ width: '25%', border: '1px solid #000', padding: '6px' }}>Daftar Pertanyaan</td>
              <td style={{ width: '25%', border: '1px solid #000', padding: '6px' }}>Kesesuaian dengan standar kompetensi kerja</td>
              <td style={{ width: '7%', border: '1px solid #000', padding: '6px' }}>Ya</td>
              <td style={{ width: '7%', border: '1px solid #000', padding: '6px' }}>Tdk</td>
            </tr>

            {/* Data Rows */}
            {ia04bData?.soal.map((item) => (
              <tr key={item.id}>
                <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>{item.no}</td>
                <td style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>{item.soal}</td>
                <td style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                  <div>{item.soal1.replace(/\r\n/g, ' ')}</div>
                  <p style={{ margin: '8px 0 4px 0', fontSize: '12px', fontWeight: 'bold' }}>Jawaban asesi:</p>
                  <textarea
                    data-auto-resize
                    value={jawabanAnswers[item.id] || ''}
                    onChange={(e) => {
                      handleJawabanChange(item.id, e.target.value)
                      autoResizeTextarea(e)
                    }}
                    disabled={!canEdit}
                    placeholder="Jawaban..."
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      cursor: !canEdit ? 'not-allowed' : 'text',
                      backgroundColor: !canEdit ? '#f5f5f5' : '#fff',
                      resize: 'none',
                      overflow: 'hidden',
                      minHeight: '60px',
                      height: 'auto'
                    }}
                  />
                </td>
                <td style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>{item.soal2.replace(/\r\n/g, ' ')}</td>
                <td
                  onClick={() => canEdit && handleAnswerChange(item.id, 'ya')}
                  style={{
                    textAlign: 'center',
                    border: '1px solid #000',
                    padding: '6px',
                    cursor: !canEdit ? 'not-allowed' : 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <CustomCheckbox
                    checked={answers[item.id] === 'ya'}
                    onChange={() => {}}
                    disabled={!canEdit}
                    style={{ pointerEvents: 'none' }}
                  />
                </td>
                <td
                  onClick={() => canEdit && handleAnswerChange(item.id, 'tidak')}
                  style={{
                    textAlign: 'center',
                    border: '1px solid #000',
                    padding: '6px',
                    cursor: !canEdit ? 'not-allowed' : 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <CustomCheckbox
                    checked={answers[item.id] === 'tidak'}
                    onChange={() => {}}
                    disabled={!canEdit}
                    style={{ pointerEvents: 'none' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Rekomendasi Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '14px', fontSize: '13px', background: '#fff', border: '1px solid #000' }}>
          <tbody>
            <tr>
              <td style={{ width: '30%', fontWeight: 'bold', border: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                {ia04bData?.rekomendasi?.soal || 'Rekomendasi Asesor:'}
              </td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>
                Asesi telah memenuhi/belum memenuhi pencapaian seluruh kriteria unjuk kerja, direkomendasikan:<br /><br />
                <div
                  onClick={() => { if (canEdit) setRekomendasi(rekomendasi === 'kompeten' ? null : 'kompeten') }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: canEdit ? 'pointer' : 'not-allowed', userSelect: 'none' }}
                >
                  <CustomCheckbox
                    checked={rekomendasi === 'kompeten'}
                    onChange={() => {}}
                    disabled={!canEdit}
                    style={{ pointerEvents: 'none' }}
                  />
                  Kompeten
                </div>
                <div
                  onClick={() => { if (canEdit) setRekomendasi(rekomendasi === 'belum_kompeten' ? null : 'belum_kompeten') }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: canEdit ? 'pointer' : 'not-allowed', userSelect: 'none' }}
                >
                  <CustomCheckbox
                    checked={rekomendasi === 'belum_kompeten'}
                    onChange={() => {}}
                    disabled={!canEdit}
                    style={{ pointerEvents: 'none' }}
                  />
                  Belum Kompeten
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Asesi Signature Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '14px', fontSize: '13px', background: '#fff', border: '1px solid #000' }}>
          <tbody>
            <tr style={{ fontWeight: 'bold' }}>
              <td colSpan={3} style={{ border: '1px solid #000', padding: '6px' }}>Asesi :</td>
            </tr>
            <tr>
              <td style={{ width: '30%', border: '1px solid #000', padding: '6px' }}>Nama</td>
              <td style={{ width: '5%', border: '1px solid #000', padding: '6px' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>{namaAsesi?.toUpperCase() || user?.name?.toLocaleUpperCase() || ''}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Tanda tangan/ Tanggal</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>:</td>
              <td style={{ height: '60px', border: '1px solid #000', padding: '6px', verticalAlign: 'middle', textAlign: 'center' }}>
                {barcodes?.asesi?.url ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <img
                      src={barcodes.asesi.url}
                      alt="Tanda Tangan Asesi"
                      style={{ height: '50px', width: '50px', objectFit: 'contain' }}
                    />
                    {barcodes.asesi.tanggal && (
                      <div style={{ fontSize: '11px', color: '#333' }}>
                        {new Date(barcodes.asesi.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                ) : null}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Asesor Signature Table */}
        {asesorList.map((asesor, idx) => {
          const asesorBarcode = idx === 0 ? barcodes?.asesor1 : barcodes?.asesor2
          return asesorBarcode?.url ? (
            <table key={asesor.id} style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', background: '#fff', border: '1px solid #000' }}>
              <tbody>
                <tr style={{ fontWeight: 'bold' }}>
                  <td colSpan={3} style={{ border: '1px solid #000', padding: '6px' }}>Asesor {idx + 1} :</td>
                </tr>
                <tr>
                  <td style={{ width: '30%', border: '1px solid #000', padding: '6px' }}>Nama</td>
                  <td style={{ width: '5%', border: '1px solid #000', padding: '6px' }}>:</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>
                    {asesorBarcode.nama?.toUpperCase() || ''}
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>Tanda tangan/ Tanggal</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>:</td>
                  <td style={{ height: '60px', border: '1px solid #000', padding: '6px', verticalAlign: 'middle', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <img
                        src={asesorBarcode.url}
                        alt={`Tanda Tangan Asesor ${idx + 1}`}
                        style={{ height: '50px', width: '50px', objectFit: 'contain' }}
                      />
                      {asesorBarcode.tanggal && (
                        <div style={{ fontSize: '11px', color: '#333' }}>
                          {new Date(asesorBarcode.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          ) : null
        })}

        {/* Actions */}
        <div style={{ marginTop: '20px' }}>
          {/* Pernyataan Checkbox */}
          {!signing.allSigned && (
          <div style={{ background: '#fff', border: '1px solid #999', borderRadius: '4px', padding: '16px', marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <CustomCheckbox
                checked={signing.agreedChecklist}
                onChange={() => signing.setAgreedChecklist(!signing.agreedChecklist)}
                disabled={signing.allSigned}
                style={{ marginTop: '2px' }}
              />
              <span style={{ fontSize: '13px', color: '#333' }}>
                Saya menyatakan dengan sebenar-benarnya bahwa saya telah memberikan jawaban yang jujur dan dapat dipertanggungjawabkan sesuai dengan pengetahuan dan pengalaman yang saya miliki.
              </span>
            </label>
          </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            {isAsesor && (
            <ActionButton variant="secondary" onClick={() => navigate(`/asesi/asesmen/${id}/upload-tugas`)}>
              Kembali
            </ActionButton>
            )}
            <ActionButton variant="primary" disabled={signing.buttonDisabled} onClick={handleSave}>
              {signing.buttonText}
            </ActionButton>
          </div>
        </div>
      </ModularAsesiLayout>

      {/* Confirmation Dialog for Asesi before Ujian */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Masuk ke Ujian"
        message="Apakah Anda sudah siap untuk mengerjakan ujian? Pastikan Anda memiliki waktu yang cukup dan koneksi internet yang stabil."
        confirmText="Ya, Siap"
        cancelText="Belum"
        onConfirm={() => {
          setShowConfirmDialog(false)
          setTimeout(() => navigate(`/asesi/asesmen/${id}/ia05`), 100)
        }}
        onCancel={() => setShowConfirmDialog(false)}
      />

      {/* Absen Awal Modal */}
      <WebcamModal
        isOpen={showAwalModal}
        onClose={handleAwalModalClose}
        onSubmit={submitAbsenAwal}
        title="Absen Masuk Asesmen"
        description="Silakan ambil foto wajah Anda untuk absen masuk"
        canClose={false}
      />
    </div>
  )
}
