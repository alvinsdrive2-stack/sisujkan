import { useState, useEffect, useCallback, useMemo } from "react"

import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
import { useNavigate, useParams } from "react-router-dom"
import ModularAsesiLayout from "@/components/ModularAsesiLayout"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/ToastContext"
import { extractErrorMessage, extractApiError } from "@/lib/error-utils"
import { useAsesorRole } from "@/hooks/useAsesorRole"
import { useDataDokumenAsesmen } from "@/hooks/useDataDokumenAsesmen"
import { useDataDokumenPraAsesmen } from "@/hooks/useDataDokumenPraAsesmen"
import { useKegiatanByRole } from "@/hooks/useKegiatanByRole"
import { useAbsenCheck } from "@/hooks/useAbsenCheck"
import { getAsesmenSteps } from "@/lib/asesmen-steps"
import { ActionButton } from "@/components/ui/ActionButton"
import { CustomCheckbox } from "@/components/ui/Checkbox"
import { WebcamModal } from "@/components/ui/WebcamModal"
import { API_BASE_URL } from "@/config/api"

interface SurveyItem {
  id: number
  no: string
  aspek: string
  deskripsi: string
  skor: number | null
}

const REFERRAL_SOURCES = [
  'Rekomendasi Teman/ Organisasi Profesi',
  'Mitra TUK LSP Gatensi Karya Konstruksi',
  'Website Resmi LSP',
  'LinkedIn',
  'Tiktok',
  'Facebook',
  'Instagram',
] as const

const DEFAULT_SURVEY_ITEMS: SurveyItem[] = [
  { id: 1, no: '1', aspek: 'Informasi dan Transparansi', deskripsi: 'Informasi diterima dengan jelas meliputi persyaratan peserta dan biaya sertifikasi', skor: null },
  { id: 2, no: '2', aspek: 'Ketidakberpihakan (Impartiality)', deskripsi: 'Proses uji kompetensi dilakukan secara adil tanpa diskriminasi dan sikap objektif asesor saat asesmen', skor: null },
  { id: 3, no: '3', aspek: 'Kompetensi Asesor', deskripsi: 'Asesor bersikap profesional, komunikatif dan menguasai materi uji kompetensi', skor: null },
  { id: 4, no: '4', aspek: 'Pelaksanaan Sertifikasi', deskripsi: 'Proses asesmen berjalan sesuai prosedur dan waktu pelaksanaan sesuai jadwal', skor: null },
  { id: 5, no: '5', aspek: 'Hasil dan Banding', deskripsi: 'Hasil uji kompetensi dan mekanisme banding disampaikan dengan jelas', skor: null },
  { id: 6, no: '6', aspek: 'Kesiapan dan Kelengkapan Fasilitas TUK', deskripsi: 'Peralatan dan fasilitas pendukung serta bahan uji tersedia sesuai standar dan siap digunakan', skor: null },
  { id: 7, no: '7', aspek: 'Kondisi Lingkungan TUK', deskripsi: 'Keamanan, keselamatan, kebersihan dan kenyamanan area TUK terjaga', skor: null },
  { id: 8, no: '8', aspek: 'Dukungan TUK Pelaksanaan Uji', deskripsi: 'Petugas TUK memberi informasi yang jelas dan membantu dengan baik', skor: null },
  { id: 9, no: '9', aspek: 'Kepatuhan TUK terhadap Prosedur', deskripsi: 'Pelaksanaan uji kompetensi tanpa gangguan dan menerapkan protokol K3', skor: null },
]

interface SurveiResponse {
  status: string
  data: {
    id_izin: string
    surveys: {
      LSP: { saran: string; pernyataan: boolean; answers: { pertanyaan_id: string; aspek: string; pertanyaan: string; skor: string }[] }
      TUK: { saran: string; pernyataan: boolean; answers: { pertanyaan_id: string; aspek: string; pertanyaan: string; skor: string }[] }
    }
  }
}

export default function SurveiPage() {
  const navigate = useNavigate()
  const { isLoading: authLoading } = useAuth()
  const { id } = useParams<{ id?: string }>()
  const { role: asesorRole } = useAsesorRole(id)
  const { jenjang, asesorList, namaAsesi, jabatanKerja, tuk, tanggalUji, metode } = useDataDokumenAsesmen(id)
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
  const [surveyItems, setSurveyItems] = useState<SurveyItem[]>(DEFAULT_SURVEY_ITEMS)
  const [saran, setSaran] = useState('')
  const [pernyataan, setPernyataan] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [pendingAfterAbsen, setPendingAfterAbsen] = useState(false)
  const [referralSources, setReferralSources] = useState<string[]>([])
  const [referralLainnya, setReferralLainnya] = useState('')

  const isFormDisabled = isAsesor || isSubmitted

  const fetchSurveiData = useCallback(async () => {
    if (authLoading) return
    if (!id) { return }

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/survey/${id}`, {
        headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
      })
      if (response.ok) {
        const result: SurveiResponse = await response.json()
        if (result.status === "success" && result.data?.surveys) {
          const allAnswers = [
            ...(result.data.surveys.LSP?.answers || []),
            ...(result.data.surveys.TUK?.answers || []),
          ]
          if (allAnswers.length > 0) {
            setSurveyItems(prev => prev.map(item => {
              const answer = allAnswers.find(a => parseInt(a.pertanyaan_id) === item.id)
              if (answer) {
                return {
                  ...item,
                  aspek: answer.aspek.replace(/^Aspek\s+/i, ''),
                  deskripsi: answer.pertanyaan.trim(),
                  skor: parseInt(answer.skor),
                }
              }
              return item
            }))
          }
          setSaran(result.data.surveys.LSP?.saran || '')
          setPernyataan(result.data.surveys.LSP?.pernyataan || false)
          setIsSubmitted(result.data.surveys.LSP?.pernyataan === true)
        }
      }
    } catch (err) {
      console.error("Error fetching survei:", err)
    }
  }, [id, authLoading])

  useEffect(() => { fetchSurveiData() }, [fetchSurveiData])

  const handleSkorChange = (id: number, value: number) => {
    setSurveyItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, skor: item.skor === value ? null : value }
      }
      return item
    }))
  }

  const handleReferralToggle = (src: string) => {
    if (isFormDisabled) return
    setReferralSources(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src])
  }

  const getBackPath = () => {
    const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('survei'))
    const prevStep = asesmenSteps[currentStepIndex - 1]
    if (prevStep) {
      return prevStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`)
    }
    return `/asesi/asesmen/${id}/ak03`
  }

  const handleSave = async () => {
    // Tahap 0: skip save/TTD, langsung navigasi next
    if (tahap === 0) {
      navigate(getNextPath())
      return
    }
    if (!pernyataan) {
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

      const lspAnswers = surveyItems
        .filter(item => parseInt(item.no) <= 5 && item.skor !== null)
        .map(item => ({ pertanyaan_id: item.id, skor: item.skor }))

      const tukAnswers = surveyItems
        .filter(item => parseInt(item.no) >= 6 && item.skor !== null)
        .map(item => ({ pertanyaan_id: item.id, skor: item.skor }))

      const response = await fetch(`${API_BASE_URL}/survey/${id}`, {
        method: 'POST',
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-API-Key": import.meta.env.VITE_APP_API_KEY || "",
        },
        body: JSON.stringify({
          LSP: lspAnswers,
          TUK: tukAnswers,
          saran,
          pernyataan,
        }),
      })

      if (response.ok) {
        showSuccess('Survei berhasil disimpan!')
        setIsSubmitted(true)
        setPernyataan(true)

        // Check absen akhir for asesi
        if (!isAsesor) {
          const needsAbsenAkhir = await shouldShowAkhirModal()
          if (needsAbsenAkhir) {
            setPendingAfterAbsen(true)
            setShowAkhirModal(true)
            return
          }
        }
      } else {
        const msg = await extractApiError(response, 'Gagal menyimpan survei. Silakan coba lagi.')
        showError(msg)
      }
    } catch (err) {
      console.error('Error saving survei:', err)
      showError(extractErrorMessage(err, 'Terjadi kesalahan. Silakan coba lagi.'))
    } finally {
      setIsSaving(false)
    }
  }

  const getNextPath = () => {
    const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('survei'))
    const nextStep = asesmenSteps[currentStepIndex + 1]
    if (nextStep) {
      return nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`)
    }
    return `/asesi/asesmen/${id}/selesai`
  }

  const handleNext = () => {
    navigate(getNextPath())
  }

  const handleAkhirModalClose = () => {
    _handleAkhirModalClose()
    if (pendingAfterAbsen) {
      setPendingAfterAbsen(false)
      navigate(getNextPath())
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      
      {/* Breadcrumb */}
      <AsesmenBreadcrumb currentPage="Survei" />

      <ModularAsesiLayout currentStep={asesmenSteps.find(s => s.href.includes('survei'))?.number || 7} steps={asesmenSteps} id={id} metode={metode}>
        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>
            FORM SURVEI KEPUASAN TERHADAP PROSES SERTIFIKASI
          </h1>
        </div>

        {/* Section A - Identitas */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '10px', color: '#000' }}>
            A. Identitas Responden
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', background: '#fff', border: '1px solid #000' }}>
            <tbody>
              <tr>
                <td style={{ width: '220px', fontWeight: 'bold', border: '1px solid #000', padding: '8px' }}>Nama</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{namaAsesi || '-'}</td>
              </tr>
              <tr>
                <td style={{ width: '220px', fontWeight: 'bold', border: '1px solid #000', padding: '8px' }}>ID Ijin</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{id || '-'}</td>
              </tr>
              <tr>
                <td style={{ width: '220px', fontWeight: 'bold', border: '1px solid #000', padding: '8px' }}>Skema Sertifikasi</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{jabatanKerja || '-'}</td>
              </tr>
              <tr>
                <td style={{ width: '220px', fontWeight: 'bold', border: '1px solid #000', padding: '8px' }}>Tempat Uji Kompetensi (TUK)</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{tuk || '-'}</td>
              </tr>
              <tr>
                <td style={{ width: '220px', fontWeight: 'bold', border: '1px solid #000', padding: '8px' }}>Tanggal Uji Kompetensi</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{tanggalUji || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section B - Petunjuk Pengisian */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '10px', color: '#000' }}>
            B. Petunjuk Pengisian
          </h2>
          <p style={{ fontSize: '13px', marginBottom: '10px' }}>
            Beri penilaian sesuai pengalaman Anda selama proses sertifikasi. <br></br>
            <div style={{ marginLeft: '20px', marginTop: '8px' }}>
            1.	Berikan () pada kotak penilaian yang telah disediakan<br></br>
            2.	Penilaian Sesuai Pengalaman Anda Selama Proses Sertifikasi. 
            </div>
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', background: '#fff', border: '2px solid #000' }}>
            <thead>
              <tr style={{ background: '#d10000', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                <th style={{ width: '100px', border: '1px solid #000', padding: '6px' }}>Skor</th>
                <th style={{ border: '1px solid #000', padding: '6px' }}>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>1</td><td style={{ border: '1px solid #000', padding: '6px' }}>Sangat Tidak Puas</td></tr>
              <tr><td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>2</td><td style={{ border: '1px solid #000', padding: '6px' }}>Tidak Puas</td></tr>
              <tr><td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>3</td><td style={{ border: '1px solid #000', padding: '6px' }}>Cukup Puas</td></tr>
              <tr><td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>4</td><td style={{ border: '1px solid #000', padding: '6px' }}>Puas</td></tr>
              <tr><td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>5</td><td style={{ border: '1px solid #000', padding: '6px' }}>Sangat Puas</td></tr>
            </tbody>
          </table>
        </div>

        {/* Section C - Penilaian */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '10px', color: '#000' }}>
            C. Penilaian Berdasarkan Prinsip Asesmen
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', background: '#fff', border: '2px solid #000' }}>
            <thead>
              <tr style={{ background: '#d10000', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                <th rowSpan={2} style={{ width: '50px', border: '1px solid #000', padding: '6px' }}>No.</th>
                <th rowSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>Aspek Penilaian</th>
                <th colSpan={5} style={{ border: '1px solid #000', padding: '6px' }}>Skor</th>
              </tr>
              <tr style={{ background: '#d10000', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                <th style={{ width: '50px', border: '1px solid #000', padding: '6px' }}>1</th>
                <th style={{ width: '50px', border: '1px solid #000', padding: '6px' }}>2</th>
                <th style={{ width: '50px', border: '1px solid #000', padding: '6px' }}>3</th>
                <th style={{ width: '50px', border: '1px solid #000', padding: '6px' }}>4</th>
                <th style={{ width: '50px', border: '1px solid #000', padding: '6px' }}>5</th>
              </tr>
            </thead>
            <tbody>
              {surveyItems.map((item) => (
                <tr key={item.id}>
                  <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>{item.no}</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{item.aspek}</div>
                    <div style={{ fontStyle: 'italic', fontSize: '12px', lineHeight: '1.5' }}>{item.deskripsi}</div>
                  </td>
                  {[1, 2, 3, 4, 5].map((skor) => (
                    <td key={skor} style={{ textAlign: 'center', border: '1px solid #000', padding: '6px' }}>
                      <CustomCheckbox
                        checked={item.skor === skor}
                        onChange={() => handleSkorChange(item.id, skor)}
                        disabled={isFormDisabled}
                        style={{ cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td colSpan={7} style={{ border: '1px solid #000', padding: '10px', background: '#fafafa' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px' }}>
                    Darimana Anda mengetahui LSP ini? (dapat memilih lebih dari satu)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px', fontSize: '13px' }}>
                    {REFERRAL_SOURCES.map((src) => (
                      <label key={src} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}>
                        <CustomCheckbox
                          checked={referralSources.includes(src)}
                          onChange={() => handleReferralToggle(src)}
                          disabled={isFormDisabled}
                        />
                        <span>{src}</span>
                      </label>
                    ))}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}>
                      <CustomCheckbox
                        checked={referralSources.includes('Lainnya')}
                        onChange={() => handleReferralToggle('Lainnya')}
                        disabled={isFormDisabled}
                      />
                      <span>Lainnya:</span>
                      <input
                        type="text"
                        value={referralLainnya}
                        onChange={(e) => setReferralLainnya(e.target.value)}
                        disabled={isFormDisabled || !referralSources.includes('Lainnya')}
                        style={{
                          flex: 1,
                          border: 'none',
                          borderBottom: '1px dotted #000',
                          outline: 'none',
                          padding: '2px 4px',
                          fontSize: '13px',
                          fontFamily: 'Arial, Helvetica, sans-serif',
                          background: 'transparent',
                        }}
                      />
                    </label>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section D - Saran */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '10px', color: '#000' }}>
            D. Saran dan Masukan
          </h2>
          <textarea
            value={saran}
            onChange={(e) => setSaran(e.target.value)}
            disabled={isFormDisabled}
            style={{
              width: '100%',
              minHeight: '100px',
              border: '1px solid #000',
              padding: '8px',
              fontSize: '13px',
              resize: 'vertical',
              cursor: isFormDisabled ? 'not-allowed' : 'text',
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
            placeholder="Tuliskan saran dan masukan Anda..."
          />
        </div>

        {/* Section E - Pernyataan */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '10px', color: '#000' }}>
            E. Pernyataan
          </h2>
          <p style={{ fontSize: '13px', marginBottom: '10px' }}>
            Saya mengisi survei ini dengan jujur sesuai pengalaman saya.
          </p>

          {!isSubmitted && (
            <div style={{ background: '#fff', border: '1px solid #999', borderRadius: '4px', padding: '16px', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <CustomCheckbox
                  checked={pernyataan}
                  onChange={() => setPernyataan(!pernyataan)}
                  disabled={isFormDisabled}
                />
                <span style={{ fontSize: '13px', color: '#333' }}>
                  Saya menyatakan dengan sebenar-benarnya bahwa survei ini saya isi dengan jujur dan sesuai dengan pengalaman saya selama proses sertifikasi.
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
          {isAsesor && (
            <ActionButton variant="secondary" onClick={() => navigate(getBackPath())}>
              Kembali
            </ActionButton>
          )}
          {!isSubmitted ? (
            <ActionButton variant="primary" disabled={isSaving} onClick={handleSave}>
              {isSaving ? "Menyimpan..." : "Simpan"}
            </ActionButton>
          ) : (
            <ActionButton variant="primary" onClick={handleNext}>
              Selanjutnya
            </ActionButton>
          )}
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
