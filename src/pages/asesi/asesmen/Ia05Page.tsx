import React, { useState, useEffect, useCallback, useMemo } from "react"
import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
import { useNavigate, useParams } from "react-router-dom"
import ModularAsesiLayout from "@/components/ModularAsesiLayout"
import { useAuth } from "@/contexts/auth-context"
import { RoleId } from "@/lib/rbac-config"
import { useToast } from "@/contexts/ToastContext"
import { extractErrorMessage, extractApiError } from "@/lib/error-utils"
import { useAsesorRole } from "@/hooks/useAsesorRole"
import { useDataDokumenAsesmen } from "@/hooks/useDataDokumenAsesmen"
import { useDataDokumenPraAsesmen } from "@/hooks/useDataDokumenPraAsesmen"
import { useKegiatanByRole } from "@/hooks/useKegiatanByRole"
import { useAbsenCheck } from "@/hooks/useAbsenCheck"
import { useSigningState, BarcodeState } from "@/hooks/useSigningState"
import { getAsesmenSteps } from "@/lib/asesmen-steps"
import { FullPageLoader } from "@/components/ui/loading-spinner"
import { CustomRadio } from "@/components/ui/Radio"
import { CustomCheckbox } from "@/components/ui/Checkbox"
import { ActionButton } from "@/components/ui/ActionButton"
import { WebcamModal } from "@/components/ui/WebcamModal"
import { kegiatanService } from "@/lib/kegiatan-service"
import { API_BASE_URL } from "@/config/api"
import { useIa05Timer } from "@/hooks/useIa05Timer"
import { useMissingStepsRedirect } from "@/hooks/useAsesmenStepQrStatus"
import { setNavbarTimer } from "@/lib/navbar-timer"

interface Unit {
  id: number
  kode: string
}

interface Kuk {
  id: number
  kode: string
}

interface Soal {
  id: number
  no: string
  id_unitkompetensi: string
  id_kuk: string | null
  jenis: string
  soal: string
  jawab_a: string
  jawab_b: string
  jawab_c: string
  jawab_d: string
  file_a: string | null
  file_b: string | null
  file_c: string | null
  file_d: string | null
  kunci_jawaban: string
  jawaban_asesi: string | null
  unit: Unit
  kuk: Kuk | null
}

interface Dokumen {
  id: number
  nama_dokumen: string
}

interface Ia05Response {
  message: string
  data: {
    dokumen: Dokumen
    soal: Soal[]
    umpan_balik?: string
  }
}

interface ApiResponse {
  message: string
  data: Ia05Response["data"]
}

export default function Ia05Page() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { id } = useParams<{ id?: string }>()
  const { role: asesorRole } = useAsesorRole(id)
  const { jenjang, metode, jabatanKerja, nomorSkema, tuk, asesorList, namaAsesi, idAsesor1: _idAsesor1, namaPenyusun, namaValidator, tanggalPenyusun, tanggalValidator, barcodePenyusun, barcodeValidator, noregPenyusun, noregValidator, isLoading: isDataLoading, jadwalId } = useDataDokumenAsesmen(id)
  const { showSuccess, showError, showWarning } = useToast()
  const { kegiatan: _kegiatan } = useKegiatanByRole()
  const { tahap } = useDataDokumenPraAsesmen(id)

  // Get dynamic steps
  const isAsesor = user?.role?.id === RoleId.ASESOR
  const isAsesi = user?.role?.id === RoleId.ASESI
  // Check if current user is asesor
  const canEditIa05 = isAsesi // Only asesi can answer the questions
  const canEditUmpanBalik = isAsesor // All asesor can edit umpan_balik
  const asesmenSteps = useMemo(() => getAsesmenSteps(jenjang, isAsesor, asesorRole, asesorList.length, metode, tahap), [jenjang, isAsesor, asesorRole, asesorList.length, metode, tahap])

  // Absen check - auto-detect role (asesi/asesor1/asesor2)
  const { showAwalModal, submitAbsenAwal, handleAwalModalClose } = useAbsenCheck({
    phase: 'asesmen',
    role: 'auto',
    checkOnMount: true,
    idIzin: id,
    asesorList
  })

  const [ia05Data, setIa05Data] = useState<Ia05Response["data"] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [umpanBalik, setUmpanBalik] = useState<string>('')

  // Barcodes state untuk cek tanda tangan asesor
  const [barcodes, setBarcodes] = useState<{
    asesi?: { url: string; tanggal: string; nama: string } | null
    asesor1?: { url: string; tanggal: string; nama: string } | null
    asesor2?: { url: string; tanggal: string; nama: string } | null
  } | null>(null)

  const fetchIa05Data = useCallback(async () => {
    if (!id) return
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/asesmen/${id}/ia05`, {
        headers: { "Authorization": `Bearer ${token}` },
      })
      if (response.ok) {
        const result: ApiResponse = await response.json()
        if (result.message === "Success") {
          const sortedSoal = result.data.soal.sort((a, b) => {
            const numA = parseInt(a.no) || 0
            const numB = parseInt(b.no) || 0
            return numA - numB
          })
          setIa05Data({ ...result.data, soal: sortedSoal })
          // Ambil barcodes dari response utama jika ada
          if ((result.data as any)?.barcodes) {
            setBarcodes((result.data as any).barcodes)
          }
          const newAnswers: Record<number, 'A' | 'B' | 'C' | 'D'> = {}
          sortedSoal.forEach((soal) => {
            if (soal.jawaban_asesi) {
              newAnswers[soal.id] = soal.jawaban_asesi as 'A' | 'B' | 'C' | 'D'
            }
          })
          setAnswers(newAnswers)
          if (result.data.umpan_balik) setUmpanBalik(result.data.umpan_balik)
        }
      }
    } catch (error) {
      console.error("Error fetching IA.05 data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => { fetchIa05Data() }, [fetchIa05Data])

  const nextStepLabel = asesmenSteps[asesmenSteps.findIndex(s => s.href.includes('ia05')) + 1]?.label

  // Timer for asesi (1 hour, localStorage - persists across page close)
  const { remainingSeconds, isExpired } = useIa05Timer({
    idIzin: id,
    onExpired: () => { /* auto-save handled by useEffect below */ },
  })

  // Check all steps for missing QR and redirect
  const { checked: stepsChecked } = useMissingStepsRedirect(id, isAsesi && !isLoading && !isDataLoading)
  const signing = useSigningState({
    pageKey: 'ia05',
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
    onRefresh: fetchIa05Data,
  })


  const handleAnswerChange = (soalId: number, answer: 'A' | 'B' | 'C' | 'D') => {
    setAnswers(prev => ({ ...prev, [soalId]: answer }))
  }

  // Handler for asesi to submit answers (memoized for timer hook)
  const handleSubmit = useCallback(async () => {
    // Tahap 0: skip save/TTD, langsung navigasi next
    if (tahap === 0) {
      const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ia05'))
      const nextStep = asesmenSteps[currentStepIndex + 1]
      navigate(nextStep ? nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`) : `/asesi/asesmen/${id}/selesai`)
      return
    }
    // If asesi already signed → redirect (prevent re-generate QR)
    if (isAsesi && signing.asesiHasSigned) {
      const idx = asesmenSteps.findIndex(s => s.href.includes('ia05'))
      const next = asesmenSteps[idx + 1]
      navigate(next ? next.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`) : `/asesi/asesmen/${id}/selesai`)
      return
    }

    if (!ia05Data) {
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

      // Build answers array for POST
      const answersPayload = ia05Data.soal
        .filter(soal => answers[soal.id]) // Only include answered questions
        .map(soal => ({
          soal_id: soal.id,
          jawaban: answers[soal.id]
        }))

      const payload = {
        id_izin: id,
        dokumen_id: ia05Data.dokumen.id,
        answers: answersPayload,
        umpan_balik: umpanBalik || undefined
      }

      const response = await fetch(`${API_BASE_URL}/asesmen/${id}/ia05`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        showSuccess('IA 05 berhasil disimpan!')
        signing.publishUpdate()

        // Generate QR after successful save
        console.log('🔍 QR Generation Check - jadwalId:', jadwalId, 'id:', id)
        try {
          if (jadwalId) {
            console.log('Generating QR for IA05...', { id, jadwalId })
            await kegiatanService.generateQRIa05(id, jadwalId)
            console.log('✅ QR IA05 successfully generated!')
          } else {
            console.warn('⚠️ jadwalId is null/undefined, skipping QR generation')
          }
        } catch (qrError) {
          console.error('❌ Failed to generate QR IA05:', qrError)
          // Don't block navigation on QR failure
        }

        // Tahap 0 → dashboard instead of continuing asesmen
        if (_kegiatan?.tahap === 0) {
          setTimeout(() => navigate(isAsesor ? '/asesor/dashboard' : '/asesi/dashboard'), 500)
          return
        }

        // Navigate to next step based on asesmenSteps
        const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ia05'))
        const nextStep = asesmenSteps[currentStepIndex + 1]
        if (nextStep) {
          if (nextStep.href.includes('ak02')) {
            setTimeout(() => navigate(`/asesi/asesmen/${id}/ak02`), 500)
          } else if (nextStep.href.includes('ak03')) {
            setTimeout(() => navigate(`/asesi/asesmen/${id}/ak03`), 500)
          } else if (nextStep.href.includes('selesai')) {
            setTimeout(() => navigate(`/asesi/asesmen/${id}/selesai`), 500)
          } else {
            const nextPath = nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`)
            setTimeout(() => navigate(nextPath), 500)
          }
        } else {
          setTimeout(() => navigate(`/asesi/asesmen/${id}/selesai`), 500)
        }
      } else {
        const msg = await extractApiError(response, 'Gagal menyimpan data. Silakan coba lagi.')
        showError(msg)
      }
    } catch (error) {
      console.error('Error saving IA05:', error)
      showError(extractErrorMessage(error, 'Gagal menyimpan data. Silakan coba lagi.'))
    } finally {
      setIsSaving(false)
    }
  }, [isAsesi, signing, asesmenSteps, navigate, ia05Data, id, answers, umpanBalik, jadwalId, showSuccess, showWarning, showError, tahap])

  // Handler for asesor to save umpan_balik
  const handleSaveUmpanBalik = async () => {
    // If asesor already signed → redirect
    if (isAsesor && signing.asesorHasSigned) {
      const idx = asesmenSteps.findIndex(s => s.href.includes('ia05'))
      const next = asesmenSteps[idx + 1]
      navigate(next ? next.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`) : `/asesi/asesmen/${id}/selesai`)
      return
    }

    if (!ia05Data || !id) return

    setIsSaving(true)
    try {
      const token = localStorage.getItem('access_token')

      // Build answers array
      const answersPayload = ia05Data.soal
        .filter(soal => answers[soal.id])
        .map(soal => ({
          soal_id: soal.id,
          jawaban: answers[soal.id]
        }))

      const payload = {
        id_izin: id,
        dokumen_id: ia05Data.dokumen.id,
        answers: answersPayload,
        umpan_balik: umpanBalik
      }

      const response = await fetch(`${API_BASE_URL}/asesmen/${id}/ia05`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        showSuccess('Umpan balik berhasil disimpan!')
        signing.publishUpdate()

        // Generate QR after successful save
        console.log('🔍 QR Generation Check - jadwalId:', jadwalId, 'id:', id)
        try {
          if (jadwalId) {
            console.log('Generating QR for IA05...', { id, jadwalId })
            await kegiatanService.generateQRIa05(id, jadwalId)
            console.log('✅ QR IA05 successfully generated!')
          } else {
            console.warn('⚠️ jadwalId is null/undefined, skipping QR generation')
          }
        } catch (qrError) {
          console.error('❌ Failed to generate QR IA05:', qrError)
          // Don't block navigation on QR failure
        }

        // Tahap 0 → dashboard
        if (_kegiatan?.tahap === 0) {
          setTimeout(() => navigate(isAsesor ? '/asesor/dashboard' : '/asesi/dashboard'), 500)
          return
        }

        // Navigate to AK02
        setTimeout(() => navigate(`/asesi/asesmen/${id}/ak02`), 500)
      } else {
        const msg = await extractApiError(response, 'Gagal menyimpan umpan balik. Silakan coba lagi.')
        showError(msg)
      }
    } catch (error) {
      console.error('Error saving umpan balik:', error)
      showError(extractErrorMessage(error, 'Gagal menyimpan umpan balik. Silakan coba lagi.'))
    } finally {
      setIsSaving(false)
    }
  }

  // Auto-save when timer expires (must be after handleSubmit definition)
  useEffect(() => {
    if (isExpired && isAsesi && ia05Data && !isSaving) {
      handleSubmit()
    }
  }, [isExpired, isAsesi, ia05Data, isSaving, handleSubmit])

  // Sync timer to navbar
  useEffect(() => {
    const node = isAsesi && !signing.asesiHasSigned ? (
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '18px', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
          {isExpired
            ? '00:00'
            : `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`
          }
        </div>
        <div style={{ color: '#000', fontSize: '11px', fontWeight: 500 }}>Sisa Waktu</div>
      </div>
    ) : null
    setNavbarTimer(node)
    return () => setNavbarTimer(null)
  }, [remainingSeconds, isExpired, isAsesi, signing.asesiHasSigned])

  const isQuestionAnswered = (soalId: number) => answers[soalId]

  if (isLoading || isDataLoading || !stepsChecked) {
    return <FullPageLoader text="Memuat data IA.05..." />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>

      <AsesmenBreadcrumb currentPage="IA.05" />

      <ModularAsesiLayout currentStep={asesmenSteps.find(s => s.href.includes('ia05'))?.number || 4} steps={asesmenSteps} id={id} metode={metode}>
                {/* IDENTITAS Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', fontSize: '14px', background: '#fff', border: '2px solid #000' }}>
          <tbody>
            <tr>
              <td rowSpan={2} style={{ width: '30%', border: '1px solid #000', padding: '6px' }}>Skema Sertifikasi<br />(̶𝙺̶𝙺̶𝙽̶𝙸̶/Okupasi/̶𝙺̶𝚕̶𝚊̶𝚜̶𝚝̶𝚎̶𝚛̶)̶</td>
              <td style={{ width: '12%', border: '1px solid #000', padding: '6px' }}>Judul</td>
              <td style={{ width: '3%', border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{jabatanKerja || '-'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Nomor</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{nomorSkema || '-'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>TUK</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{tuk || '-'}</td>
            </tr>
            {asesorList.length > 1 ? (
              asesorList.map((asesor, idx) => (
                <tr key={asesor.id}>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>Nama Asesor {idx + 1}</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
                  <td colSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>
                    {asesor.nama?.toUpperCase() || ''}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px' }}>Nama Asesor</td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
                <td colSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>
                  {asesorList[0]?.nama?.toUpperCase() || ''}
                </td>
              </tr>
            )}
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Nama Asesi</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{namaAsesi?.toUpperCase() || user?.name?.toUpperCase() || '-'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Tanggal</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>*Coret yang tidak perlu</div>

        

        {/* SOAL Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px', background: '#fff', border: '2px solid #000' }}>
          <tbody>
            <tr style={{ background: '#c40000', color: '#fff', fontWeight: 'bold' }}>
              <td style={{ width: '160', border: '1px solid #000', padding: '6px', textAlign: 'center' }}>KUK</td>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>SOAL, Pilih Jawaban semua pertanyaan berikut (A / B / C / D) :</td>
            </tr>
            {ia05Data?.soal.map((soal) => (
              <React.Fragment key={soal.id}>
                <tr>
                  <td className="kuk" style={{
                    background: isQuestionAnswered(soal.id) ? '#d58a94' : '#d58a94',
                    color: isQuestionAnswered(soal.id) ? '#000' : '#000',
                    width: '160px',
                    textAlign: 'center',
                    border: '1px solid #000',
                    padding: '6px',
                    fontWeight: isQuestionAnswered(soal.id) ? 'bold' : 'normal'
                  }}>
                    {soal.unit.kode}<br />{soal.kuk?.kode || ''}
                  </td>
                  <td style={{ width: '40', border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{soal.no}.</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>{soal.soal}</td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: !canEditIa05 ? 'default' : 'pointer' }} onClick={() => canEditIa05 && handleAnswerChange(soal.id, 'A')}>
                      <CustomRadio
                        name={`soal-${soal.id}`}
                        value="A"
                        checked={answers[soal.id] === 'A'}
                        onChange={() => {}}
                        disabled={!canEditIa05}
                        style={{ pointerEvents: 'none' }}
                      />
                      <span>a. {soal.jawab_a}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: !canEditIa05 ? 'default' : 'pointer' }} onClick={() => canEditIa05 && handleAnswerChange(soal.id, 'B')}>
                      <CustomRadio
                        name={`soal-${soal.id}`}
                        value="B"
                        checked={answers[soal.id] === 'B'}
                        onChange={() => {}}
                        disabled={!canEditIa05}
                        style={{ pointerEvents: 'none' }}
                      />
                      <span>b. {soal.jawab_b}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: !canEditIa05 ? 'default' : 'pointer' }} onClick={() => canEditIa05 && handleAnswerChange(soal.id, 'C')}>
                      <CustomRadio
                        name={`soal-${soal.id}`}
                        value="C"
                        checked={answers[soal.id] === 'C'}
                        onChange={() => {}}
                        disabled={!canEditIa05}
                        style={{ pointerEvents: 'none' }}
                      />
                      <span>c. {soal.jawab_c}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: !canEditIa05 ? 'default' : 'pointer' }} onClick={() => canEditIa05 && handleAnswerChange(soal.id, 'D')}>
                      <CustomRadio
                        name={`soal-${soal.id}`}
                        value="D"
                        checked={answers[soal.id] === 'D'}
                        onChange={() => {}}
                        disabled={!canEditIa05}
                        style={{ pointerEvents: 'none' }}
                      />
                      <span>d. {soal.jawab_d}</span>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
{/* Summary Row - Asesor selalu lihat, Asesi hanya lihat jika semua asesor ttd */}
          {(isAsesor || signing.allAsesorSigned) && (
          <div style={{ marginTop: '20px' }}>
            <h2 style={{ fontSize: '16px', marginBottom: '10px', fontWeight: 'bold' }}>FR. IA.05.C. LEMBAR JAWABAN PERTANYAAN TERTULIS PILIHAN GANDA</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px', background: '#f8f8f8' }}>
              <tbody>
                <tr>
                  <th colSpan={2} style={{ background: '#c00000', color: 'white', fontWeight: 'bold', textAlign: 'center', border: '1px solid #000', padding: '5px' }}>Lembar Jawaban</th>
                  <th colSpan={2} style={{ background: '#c00000', color: 'white', fontWeight: 'bold', textAlign: 'center', border: '1px solid #000', padding: '5px' }}>Rekomendasi</th>
                </tr>
                <tr>
                  <th style={{ background: '#c28ea0', fontWeight: 'bold', textAlign: 'center', border: '1px solid #000', padding: '5px' }}>No.</th>
                  <th style={{ background: '#c28ea0', fontWeight: 'bold', textAlign: 'center', border: '1px solid #000', padding: '5px' }}>Jawaban</th>
                  <th style={{ background: '#c28ea0', fontWeight: 'bold', textAlign: 'center', border: '1px solid #000', padding: '5px' }}>K</th>
                  <th style={{ background: '#c28ea0', fontWeight: 'bold', textAlign: 'center', border: '1px solid #000', padding: '5px' }}>BK</th>
                </tr>

                {ia05Data?.soal.map((soal) => {
                  const isCorrect = soal.jawaban_asesi === soal.kunci_jawaban
                  const hasAnswer = !!soal.jawaban_asesi

                  return (
                    <tr key={`grading-${soal.id}`}>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', backgroundColor: '#fff' }}>{soal.no}</td>
                      <td style={{ border: '1px solid #000', padding: '5px', backgroundColor: '#fff' }}>
                        {soal.jawaban_asesi ? (
                          <span>{soal.jawaban_asesi} - {String(soal[`jawab_${soal.jawaban_asesi.toLowerCase()}` as keyof Soal] || '')}</span>
                        ) : (
                          <span style={{ color: '#999', fontStyle: 'italic' }}>Belum dijawab</span>
                        )}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center',backgroundColor: '#fff' }}>
                        <CustomCheckbox
                          checked={hasAnswer && isCorrect}
                          onChange={() => {}}
                          disabled={true}
                        />
                      </td>
                      <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center',backgroundColor: '#fff' }}>
                        <CustomCheckbox
                          checked={hasAnswer && !isCorrect}
                          onChange={() => {}}
                          disabled={true}
                        />
                      </td>
                    </tr>
                  )
                })}

                
                
              </tbody>
            </table>
          </div>
          )}

          {/* Ringkasan Jawaban - Tanpa Rekomendasi/K/BK - Hanya Asesor */}
        {isAsesor && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '10px', fontWeight: 'bold' }}>FR. IA.05.B. LEMBAR KUNCI JAWABAN PERTANYAAN TERTULIS PILIHAN GANDA</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', background: '#fff', border: '2px solid #000' }}>
            <thead>
              <tr style={{ background: '#c00000', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                <th colSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>Lembar Jawaban</th>
              </tr>
              <tr style={{ background: '#c28ea0', fontWeight: 'bold', textAlign: 'center' }}>
                <th style={{ width: '10%', border: '1px solid #000', padding: '6px' }}>No.</th>
                <th style={{ width: '90%', border: '1px solid #000', padding: '6px' }}>Jawaban</th>
              </tr>
            </thead>
            <tbody>
              {ia05Data?.soal.map((soal) => (
                <tr key={`summary-${soal.id}`}>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{soal.no}</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>{soal.kunci_jawaban}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {/* UMPAN BALIK UNTUK ASESI - Only visible for asesor */}
        {isAsesor && (
        <div style={{ marginTop: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px', background: '#fff', border: '1px solid #000' }}>
            <tbody>
              <tr>
                <td style={{ width: '30%', border: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                  Umpan balik untuk asesi:
                    <textarea
                      defaultValue={umpanBalik}
                      onBlur={(e) => setUmpanBalik(e.target.value)}
                      placeholder="Tuliskan umpan balik untuk asesi..."
                      disabled={!canEditUmpanBalik}
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontFamily: 'Arial, Helvetica, sans-serif',
                        resize: 'vertical',
                        backgroundColor: canEditUmpanBalik ? '#fff' : '#f5f5f5',
                        cursor: canEditUmpanBalik ? 'text' : 'not-allowed'
                      }}
                    />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        )}

        {/* PENYUSUN DAN VALIDATOR Table */}
        <h2 style={{ fontSize: '14px', marginBottom: '10px' }}>PENYUSUN DAN VALIDATOR</h2>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px', background: '#fff', border: '1px solid #000' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ width: '140', border: '1px solid #000', padding: '6px',backgroundColor: '#fff' }}>Status</th>
              <th style={{ width: '40', border: '1px solid #000', padding: '6px',backgroundColor: '#fff' }}>No</th>
              <th style={{ border: '1px solid #000', padding: '6px',backgroundColor: '#fff' }}>Nama</th>
              <th style={{ width: '180', border: '1px solid #000', padding: '6px',backgroundColor: '#fff' }}>Nomor MET</th>
              <th style={{ width: '180', border: '1px solid #000', padding: '6px',backgroundColor: '#fff' }}>Tanda Tangan Dan Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {/* Penyusun row */}
            <tr>
              <td rowSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>Penyusun</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>1</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>{namaPenyusun || '-'}</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>{noregPenyusun || '-'}</td>
              <td style={{ height: '80px', border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                {barcodePenyusun ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <img src={barcodePenyusun} alt="QR Penyusun" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                    {tanggalPenyusun && <span style={{ fontSize: '11px' }}>{new Date(tanggalPenyusun).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                  </div>
                ) : '-'}
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>2</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}></td>
              <td style={{ border: '1px solid #000', padding: '6px' }}></td>
              <td style={{ height: '60px', border: '1px solid #000', padding: '6px' }}></td>
            </tr>

            {/* Validator row */}
            <tr>
              <td rowSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>Validator</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>1</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>{namaValidator || '-'}</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>{noregValidator || '-'}</td>
              <td style={{ height: '80px', border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                {barcodeValidator ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <img src={barcodeValidator} alt="QR Validator" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                    {tanggalValidator && <span style={{ fontSize: '11px' }}>{new Date(tanggalValidator).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                  </div>
                ) : '-'}
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>2</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}></td>
              <td style={{ border: '1px solid #000', padding: '6px' }}></td>
              <td style={{ height: '60px', border: '1px solid #000', padding: '6px' }}></td>
            </tr>
          </tbody>
        </table>

        {/* Actions */}
        <div style={{ marginTop: '20px' }}>
          {/* Pernyataan Checkbox */}
          <div style={{ background: '#fff', border: '1px solid #999', borderRadius: '4px', padding: '16px', marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={signing.agreedChecklist}
                onChange={(e) => signing.setAgreedChecklist(e.target.checked)}
                style={{ marginTop: '2px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px', color: '#333' }}>
                Saya menyatakan dengan sebenar-benarnya bahwa jawaban yang saya berikan adalah benar dan sesuai dengan pengetahuan yang saya miliki. Saya bertanggung jawab penuh atas keaslian dan kelengkapan jawaban yang saya serahkan.
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            {/* Buttons for Asesi */}
            {isAsesi && (
              <>
                {isAsesor && (
                <ActionButton variant="secondary" onClick={() => navigate(`/asesi/asesmen/${id}/ia04b`)}>
                  Kembali
                </ActionButton>
                )}
                <ActionButton variant="primary" disabled={isSaving || !signing.agreedChecklist || isExpired} onClick={handleSubmit}>
                  {isExpired ? "Waktu Habis" : isSaving ? "Menyimpan..." : "Lanjut"}
                </ActionButton>
              </>
            )}
            {/* Buttons for Asesor */}
            {isAsesor && (
              <>
                {isAsesor && (
                <ActionButton variant="secondary" onClick={() => navigate(-1)}>
                  Kembali
                </ActionButton>
                )}
                  <ActionButton variant="primary" disabled={isSaving || !signing.agreedChecklist || (isAsesor && signing.asesorHasSigned)} onClick={handleSaveUmpanBalik}>
                    {isSaving ? "Menyimpan..." : signing.asesorHasSigned ? "Lanjut" : "Simpan Umpan Balik"}
                  </ActionButton>
              </>
            )}
          </div>
        </div>
      </ModularAsesiLayout>

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
