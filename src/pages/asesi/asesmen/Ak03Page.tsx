import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import ModularAsesiLayout from "@/components/ModularAsesiLayout"
import { useAuth } from "@/contexts/auth-context"
import { FullPageLoader } from "@/components/ui/loading-spinner"
import { useToast } from "@/contexts/ToastContext"
import { extractErrorMessage, extractApiError } from "@/lib/error-utils"
import { useAsesorRole } from "@/hooks/useAsesorRole"
import { useDataDokumenAsesmen } from "@/hooks/useDataDokumenAsesmen"
import { useDataDokumenPraAsesmen } from "@/hooks/useDataDokumenPraAsesmen"
import { useAbsenCheck } from "@/hooks/useAbsenCheck"
import { useKegiatanByRole } from "@/hooks/useKegiatanByRole"
import { getAsesmenSteps } from "@/lib/asesmen-steps"
import { CustomCheckbox } from "@/components/ui/Checkbox"
import { ActionButton } from "@/components/ui/ActionButton"
import { useSigningState } from "@/hooks/useSigningState"
import { WebcamModal } from "@/components/ui/WebcamModal"
import { API_BASE_URL } from "@/config/api"

interface SoalAPI {
  id: number
  no: string
  jenis: string
  soal: string
  is_kompeten: boolean | null
  catatan: string | null
}

interface FeedbackItem {
  id: number
  pertanyaan: string
  ya: boolean
  tidak: boolean
  catatan: string
}

interface Ak03Response {
  message: string
  data: {
    soal: SoalAPI[]
    catatan: string
    barcodes?: {
      asesi?: BarcodeData | null
      asesor1?: BarcodeData | null
      asesor2?: BarcodeData | null
    }
  }
}

interface BarcodeData {
  url: string
  tanggal: string
  nama: string
}

export default function Ak03Page() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { id } = useParams<{ id?: string }>()
  const { role: asesorRole } = useAsesorRole(id)
  const { jenjang, asesorList, jadwalId, metode } = useDataDokumenAsesmen(id)
  const { tahap } = useDataDokumenPraAsesmen(id)
  const { showSuccess, showError, showWarning } = useToast()
  const { kegiatan: _kegiatan, isAsesor } = useKegiatanByRole()
  const asesmenSteps = useMemo(() => getAsesmenSteps(jenjang, isAsesor, asesorRole, asesorList.length, metode, tahap), [jenjang, isAsesor, asesorRole, asesorList.length, metode, tahap])

  // Absen check - auto-detect role (asesi/asesor1/asesor2)
  const {
    showAwalModal,
    showAkhirModal,
    setShowAkhirModal,
    submitAbsenAwal,
    submitAbsenAkhir,
    handleAwalModalClose,
    handleAkhirModalClose: _handleAkhirModalClose,
    shouldShowAkhirModal,
  } = useAbsenCheck({
    phase: 'asesmen',
    role: 'auto',
    checkOnMount: true,
    idIzin: id,
    asesorList
  })

  // Form state
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([])
  const [catatanUmum, setCatatanUmum] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [barcodes, setBarcodes] = useState<{
    asesi?: BarcodeData | null
    asesor1?: BarcodeData | null
    asesor2?: BarcodeData | null
  } | null>(null)
  const [pendingAfterAbsen, setPendingAfterAbsen] = useState(false)

  // Asesi fills form first, then signs. Asesor only signs after asesi signed.
  const isFormDisabled = isAsesor ? true : !!barcodes?.asesi?.url

  const fetchAk03Data = useCallback(async () => {
    if (authLoading) return
    if (!id) { return }

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/asesmen/${id}/ak03`, {
        headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
      })
      if (response.ok) {
        const result: Ak03Response = await response.json()
        if (result.message === "Success" && result.data?.soal) {
          const items: FeedbackItem[] = result.data.soal.map((soal) => ({
            id: soal.id, pertanyaan: soal.soal,
            ya: soal.is_kompeten === true, tidak: soal.is_kompeten === false,
            catatan: soal.catatan || '',
          }))
          setFeedbackItems(items)
          setCatatanUmum(result.data.catatan || '')
          if (result.data.barcodes) {
            setBarcodes({ asesi: result.data.barcodes.asesi, asesor1: result.data.barcodes.asesor1, asesor2: result.data.barcodes.asesor2 })
          }
        }
      }
    } catch (err) {
      console.error("Error fetching AK03:", err)
    }
  }, [id, authLoading])

  useEffect(() => { fetchAk03Data() }, [fetchAk03Data])

  const nextStepLabel = asesmenSteps[asesmenSteps.findIndex(s => s.href.includes('ak03')) + 1]?.label

  // Signing state hook
  const signing = useSigningState({
    pageKey: 'ak03',
    isAsesor,
    tahap,
    barcodes: barcodes as any,
    setBarcodes: setBarcodes as any,
    asesorList,
    userId: user?.id,
    userName: user?.name,
    isSaving,
    idIzin: id,
    jadwalId,
    onRefresh: fetchAk03Data,
    nextPageName: nextStepLabel,
  })


  const handleFeedbackChange = (id: number, field: 'ya' | 'tidak') => {
    setFeedbackItems(prev => prev.map(item => {
      if (item.id === id) {
        if (field === 'ya') {
          return { ...item, ya: !item.ya, tidak: false }
        } else {
          return { ...item, ya: false, tidak: !item.tidak }
        }
      }
      return item
    }))
  }

  const handleCatatanChange = (id: number, value: string) => {
    setFeedbackItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, catatan: value }
      }
      return item
    }))
  }

  // Determine back button from step config
  const getBackPath = () => {
    const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ak03'))
    const prevStep = asesmenSteps[currentStepIndex - 1]
    if (prevStep) {
      return prevStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`)
    }
    return `/asesi/asesmen/${id}/ak02`
  }

  // Handle save - POST to API
  const handleSave = async () => {
    // Tahap 0: skip save/TTD, langsung navigasi next
    if (tahap === 0) {
      const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ak03'))
      const nextStep = asesmenSteps[currentStepIndex + 1]
      navigate(nextStep ? nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`) : `/asesi/asesmen/${id}/selesai`)
      return
    }
    // If asesi already signed → check absen akhir before navigate
    if (!isAsesor && signing.asesiHasSigned) {
      const needsAbsenAkhir = await shouldShowAkhirModal()
      if (needsAbsenAkhir) {
        setPendingAfterAbsen(true)
        setShowAkhirModal(true)
        return
      }
      const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ak03'))
      const nextStep = asesmenSteps[currentStepIndex + 1]
      if (nextStep) {
        const nextPath = nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`)
        navigate(nextPath)
      } else {
        navigate(`/asesi/asesmen/${id}/selesai`)
      }
      return
    }

    // If asesor already signed → navigate directly
    if (isAsesor && signing.asesorHasSigned) {
      const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ak03'))
      const nextStep = asesmenSteps[currentStepIndex + 1]
      if (nextStep) {
        const nextPath = nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`)
        navigate(nextPath)
      } else {
        navigate(`/asesi/asesmen/${id}/selesai`)
      }
      return
    }

    if (!signing.agreedChecklist) {
      showWarning('Silakan centang pernyataan terlebih dahulu')
      return
    }

    if (!id) {
      showWarning('ID tidak ditemukan')
      return
    }

    setIsSaving(true)
    try {
      const token = localStorage.getItem("access_token")

      // Prepare answers array
      const answers = feedbackItems.map((item) => ({
        soal_id: item.id,
        is_kompeten: item.ya ? true : (item.tidak ? false : null),
        catatan: item.catatan,
      }))

      const response = await fetch(`${API_BASE_URL}/asesmen/${id}/ak03`, {
        method: 'POST',
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers,
          catatan: catatanUmum
        }),
      })

      if (response.ok) {
        showSuccess('AK 03 berhasil disimpan!')

        // Update state directly from response
        const result: Ak03Response = await response.json()
        if (result.data) {
          if (result.data.soal) {
            const items: FeedbackItem[] = result.data.soal.map((soal) => ({
              id: soal.id, pertanyaan: soal.soal,
              ya: soal.is_kompeten === true, tidak: soal.is_kompeten === false,
              catatan: soal.catatan || '',
            }))
            setFeedbackItems(items)
          }
          if (result.data.catatan !== undefined) setCatatanUmum(result.data.catatan || '')
          if (result.data.barcodes) {
            setBarcodes({
              asesi: result.data.barcodes.asesi,
              asesor1: result.data.barcodes.asesor1,
              asesor2: result.data.barcodes.asesor2,
            })
          }
        }

        // Generate QR via hook
        await signing.generateQR()
        signing.publishUpdate()
      } else {
        const msg = await extractApiError(response, 'Gagal menyimpan data. Silakan coba lagi.')
        showError(msg)
      }
    } catch (err) {
      console.error('Error saving AK03:', err)
      showError(extractErrorMessage(err, 'Terjadi kesalahan. Silakan coba lagi.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleAkhirModalClose = () => {
    _handleAkhirModalClose()
    if (pendingAfterAbsen) {
      setPendingAfterAbsen(false)
      const nextStep = asesmenSteps[asesmenSteps.findIndex(s => s.href.includes('ak03')) + 1]
      if (nextStep) {
        navigate(nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`))
      } else {
        navigate(`/asesi/asesmen/${id}/selesai`)
      }
    }
  }

  if (!feedbackItems.length) return <FullPageLoader text="Memuat data..." />

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      
      {/* Breadcrumb */}
      <AsesmenBreadcrumb currentPage="AK.03" />

      <ModularAsesiLayout currentStep={asesmenSteps.find(s => s.href.includes('ak03'))?.number || 6} steps={asesmenSteps} id={id} metode={metode}>
        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>
            FR.AK.03  UMPAN BALIK ASESI
          </h1>
        </div>

        <p style={{ fontSize: '13px', marginBottom: '15px' }}>
          Umpan balik dari Asesi (diisi oleh Asesi setelah pengambilan keputusan) :
        </p>

        {/* UM PAN BALIK Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '13px', background: '#fff', border: '2px solid #000' }}>
          <tbody>
            <tr style={{ background: '#d10000', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
              <th rowSpan={2} style={{ width: '55%', border: '1px solid #000', padding: '6px' }}>KOMPONEN</th>
              <th colSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>Hasil</th>
              <th rowSpan={2} style={{ width: '25%', border: '1px solid #000', padding: '6px' }}>Catatan/Komentar Asesi</th>
            </tr>
            <tr style={{ background: '#d10000', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
              <th style={{ width: '50px', border: '1px solid #000', padding: '6px' }}>Ya</th>
              <th style={{ width: '50px', border: '1px solid #000', padding: '6px' }}>Tidak</th>
            </tr>

            {feedbackItems.map((item) => (
              <tr key={item.id}>
                <td style={{ border: '1px solid #000', padding: '6px' }}>{item.pertanyaan}</td>
                <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px', fontSize: '18px' }}>
                  <CustomCheckbox
                    checked={item.ya}
                    onChange={() => handleFeedbackChange(item.id, 'ya')}
                    disabled={isFormDisabled || signing.allSigned}
                    style={{ cursor: (isFormDisabled || signing.allSigned) ? 'not-allowed' : 'pointer' }}
                  />
                </td>
                <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px', fontSize: '18px' }}>
                  <CustomCheckbox
                    checked={item.tidak}
                    onChange={() => handleFeedbackChange(item.id, 'tidak')}
                    disabled={isFormDisabled || signing.allSigned}
                    style={{ cursor: (isFormDisabled || signing.allSigned) ? 'not-allowed' : 'pointer' }}
                  />
                </td>
                <td style={{ border: '1px solid #000', padding: '6px' }}>
                  <textarea
                    value={item.catatan}
                    onChange={(e) => handleCatatanChange(item.id, e.target.value)}
                    disabled={isFormDisabled || signing.allSigned}
                    style={{ width: '100%', height: '80px', border: '1px solid #ccc', padding: '6px', fontSize: '13px', resize: 'none', cursor: (isFormDisabled || signing.allSigned) ? 'not-allowed' : 'text' }}
                    placeholder="Tuliskan catatan..."
                  />
                </td>
              </tr>
            ))}
            <tr>
              <td style={{ width: '20%', border: '1px solid #000', padding: '6px' }}><b>Catatan :</b></td>
              <td colSpan={3} style={{ border: '1px solid #000', padding: '6px' }}>
                <textarea
                  value={catatanUmum}
                  onChange={(e) => setCatatanUmum(e.target.value)}
                  disabled={isFormDisabled || signing.allSigned}
                  style={{ width: '100%', height: '80px', border: '1px solid #ccc', padding: '6px', fontSize: '13px', resize: 'none', cursor: (isFormDisabled || signing.allSigned) ? 'not-allowed' : 'text' }}
                  placeholder="Tuliskan catatan umum..."
                />
              </td>
            </tr>
          </tbody>
        </table>

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
                Saya menyatakan dengan sebenar-benarnya bahwa umpan balik yang saya berikan adalah jujur dan sesuai dengan pengalaman saya selama proses asesmen.
              </span>
            </label>
          </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            {isAsesor && (
              <ActionButton variant="secondary" onClick={() => navigate(getBackPath())}>
                Kembali
              </ActionButton>
            )}
            <ActionButton variant="primary" disabled={signing.buttonDisabled} onClick={handleSave}>
              {isSaving ? "Menyimpan..." : signing.buttonText}
            </ActionButton>
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

      {/* Absen Akhir Modal - for asesi only */}
      {!isAsesor && (
        <WebcamModal
          isOpen={showAkhirModal}
          onClose={handleAkhirModalClose}
          onSubmit={async (imageBlob: Blob) => {
            await submitAbsenAkhir(imageBlob)
          }}
          title="Absen Keluar Asesmen"
          description="Silakan ambil foto wajah Anda untuk absen keluar"
          canClose={true}
        />
      )}
    </div>
  )
}
