import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { RoleId } from "@/lib/rbac-config"
import { useToast } from "@/contexts/ToastContext"
import { extractErrorMessage } from "@/lib/error-utils"
import { useDataDokumenAsesmen } from "@/hooks/useDataDokumenAsesmen"
import { useKegiatanByRole } from "@/hooks/useKegiatanByRole"
import { useAbsenCheck } from "@/hooks/useAbsenCheck"
import { FullPageLoader } from "@/components/ui/loading-spinner"
import { CustomRadio } from "@/components/ui/Radio"
import { Check, ArrowLeft, Lightbulb } from 'lucide-react'
import { WebcamModal } from "@/components/ui/WebcamModal"
import { useRealtimeSync } from "@/hooks/useRealtimeSync"
import { kegiatanService } from "@/lib/kegiatan-service"
import { getAsesmenSteps } from "@/lib/asesmen-steps"
import { useAsesorRole } from "@/hooks/useAsesorRole"
import { API_BASE_URL } from "@/config/api"

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

interface UjianResponse {
  message: string
  data: {
    dokumen: Dokumen
    soal: Soal[]
  }
}

// Color palette around #00488f
const colors = {
  primary: '#00488f',
  secondary: '#0066cc',
  accent: '#4a90a4',
  light: '#e3f2fd',
  lighter: '#f0f7ff',
  success: '#00a86b',
  text: '#1e293b',
  textLight: '#64748b',
  border: '#e2e8f0',
}

const animations = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  @keyframes confetti {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }

  .animate-slideIn {
    animation: slideIn 0.4s ease-out forwards;
  }

  .option-card {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .progress-dot {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .confetti-piece {
    position: fixed;
    width: 10px;
    height: 10px;
    animation: confetti 3s ease-out forwards;
  }
`

export default function UjianPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { id } = useParams<{ id?: string }>()
  const { jabatanKerja, asesorList, jenjang, metode, jadwalId } = useDataDokumenAsesmen(id)
  const { showSuccess, showError, showWarning } = useToast()
  const { kegiatan: _kegiatan } = useKegiatanByRole()
  const { isAsesor1: _isAsesor1 } = useAsesorRole(id)

  const isAsesor = user?.role?.id === RoleId.ASESOR

  const asesmenSteps = useMemo(() => getAsesmenSteps(jenjang, isAsesor, undefined, asesorList.length, metode, _kegiatan?.tahap), [jenjang, isAsesor, asesorList.length, metode, _kegiatan?.tahap])
  const canEdit = !isAsesor
  // Note: Ujian page doesn't have kegiatan data, so we use "0" as default jenjang_id
  // This page is part of the asesmen flow but the jenjang_id is not critical for ujian steps

  // Absen check - auto-detect role (asesi/asesor1/asesor2)
  // Note: absen akhir for asesi is now handled in Ak02Page
  const {
    showAwalModal,
    submitAbsenAwal,
    handleAwalModalClose,
  } = useAbsenCheck({
    phase: 'asesmen',
    role: 'auto',
    checkOnMount: true,
    idIzin: id,
    asesorList
  })

  // Anti-cheat states
  const [violationCount, setViolationCount] = useState(0)
  const [displayViolationCount, setDisplayViolationCount] = useState(0)
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')
  const MAX_VIOLATIONS = 3

  const [soalList, setSoalList] = useState<Soal[]>([])
  const [dokumen, setDokumen] = useState<Dokumen | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [barcodes, setBarcodes] = useState<{
    asesi?: { url: string; tanggal: string; nama: string } | null
    asesor1?: { url: string; tanggal: string; nama: string } | null
    asesor2?: { url: string; tanggal: string; nama: string } | null
  } | null>(null)
  const prevIndexRef = useRef(currentIndex)
  const violationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveAnswerRef = useRef<() => Promise<void>>(async () => {})

  const fetchUjianData = useCallback(async () => {
    if (!id) return
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/asesmen/${id}/ia05`, {
        headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
      })
      if (response.ok) {
        const result: UjianResponse = await response.json()
        if (result.message === "Success") {
          const sortedSoal = result.data.soal.sort((a, b) => (parseInt(a.no) || 0) - (parseInt(b.no) || 0))
          setSoalList(sortedSoal)
          setDokumen(result.data.dokumen)
          const newAnswers: Record<number, 'A' | 'B' | 'C' | 'D'> = {}
          sortedSoal.forEach(soal => { if (soal.jawaban_asesi) newAnswers[soal.id] = soal.jawaban_asesi as 'A' | 'B' | 'C' | 'D' })
          setAnswers(newAnswers)
          if (sortedSoal.length > 0 && sortedSoal[0].jawaban_asesi) {
            setSelectedOption(sortedSoal[0].jawaban_asesi as 'A' | 'B' | 'C' | 'D')
          }
          // Set barcodes if exists
          if ((result as any).data?.barcodes) {
            setBarcodes({
              asesi: (result as any).data.barcodes.asesi,
              asesor1: (result as any).data.barcodes.asesor1,
              asesor2: (result as any).data.barcodes.asesor2,
            })
          }
        }
      }
    } catch (error) {
      console.error("Error fetching ujian data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => { fetchUjianData() }, [fetchUjianData])

  const { publishUpdate } = useRealtimeSync({
    channelName: `asesmen:${id}`,
    onUpdate: fetchUjianData
  })

  const asesiHasSigned = !!barcodes?.asesi?.url
  const asesorHasSigned = (() => {
    if (!isAsesor) return false
    const idx = asesorList.findIndex(a => String(a.id) === String(user?.id))
    return (idx === 0 || idx === -1) ? !!barcodes?.asesor1?.url : !!barcodes?.asesor2?.url
  })()
  const hasSigned = isAsesor ? asesorHasSigned : asesiHasSigned
  const allSigned = asesiHasSigned && (asesorList.length === 0 || (
    !!barcodes?.asesor1?.url && (asesorList.length < 2 || !!barcodes?.asesor2?.url)
  ))

  useEffect(() => {
    if (soalList[currentIndex]) {
      setSelectedOption(answers[soalList[currentIndex].id] || null)
    }
    prevIndexRef.current = currentIndex
  }, [currentIndex, soalList, answers])

  // Anti-cheat: Disable inspect element and detect violations
  useEffect(() => {
    if (isAsesor) return // Only apply for asesi

    const handleViolation = (type: string) => {
      const newCount = violationCount + 1
      setViolationCount(newCount)
      setDisplayViolationCount(newCount) // Update immediately for display

      const messages = [
        `${type} tidak diperbolekan selama ujian!`,
        `${type} tidak diperbolehan selama ujian!`,
        `Pelanggaran ke-3: Ujian otomatis dihentikan!`,
      ]

      setWarningMessage(messages[newCount - 1])
      setShowWarningModal(true)

      if (newCount >= MAX_VIOLATIONS) {
        // Auto-save then redirect
        const doRedirect = async () => {
          try {
            await saveAnswerRef.current()
          } catch (e) {
            console.error('Error saving before redirect:', e)
          }
          navigate('/asesi/dashboard')
        }
        setTimeout(doRedirect, 2000)
      } else {
        // Auto-hide warning after 3 seconds
        if (violationTimeoutRef.current) {
          clearTimeout(violationTimeoutRef.current)
        }
        violationTimeoutRef.current = setTimeout(() => {
          setShowWarningModal(false)
        }, 3000)
      }
    }

    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      handleViolation('Klik kanan')
    }

    // Disable keyboard shortcuts for inspect element
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'U') ||
        (e.ctrlKey && e.key === 'C') || // Disable copy
        (e.ctrlKey && e.key === 'V')    // Disable paste
      ) {
        e.preventDefault()
        const action = e.key === 'F12' ? 'Inspect Element' :
                      e.ctrlKey && e.key === 'C' ? 'Copy' :
                      e.ctrlKey && e.key === 'V' ? 'Paste' :
                      e.ctrlKey && e.key === 'U' ? 'View Source' : 'Developer Tools'
        handleViolation(action)
      }
    }

    // Prevent screenshot (on some systems)
    const handleKeyUp = (e: KeyboardEvent) => {
      // Windows: Win+Shift+S, PrintScreen
      // Mac: Cmd+Shift+4, Cmd+Shift+5
      if (
        e.key === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && (e.key === '4' || e.key === '5')) ||
        (e.ctrlKey && e.shiftKey && e.key === 'S')
      ) {
        e.preventDefault()
        handleViolation('Screenshot')
        // Clear clipboard to prevent screenshot
        try {
          navigator.clipboard.writeText('')
        } catch {}
      }
    }

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      if (violationTimeoutRef.current) {
        clearTimeout(violationTimeoutRef.current)
      }
    }
  }, [violationCount, isAsesor])

  // Prevent page exit without confirmation
  useEffect(() => {
    if (isAsesor) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isAsesor])

  const currentSoal = soalList[currentIndex]
  const totalQuestions = soalList.length
  const progress = Object.keys(answers).length
  const progressPercentage = Math.round((progress / totalQuestions) * 100)

  const handleAnswerChange = (answer: 'A' | 'B' | 'C' | 'D') => {
    if (!currentSoal || !canEdit || allSigned) return
    setSelectedOption(answer)
    setAnswers(prev => ({ ...prev, [currentSoal.id]: answer }))
  }

  const saveAnswer = async () => {
    if (!id || !dokumen) return

    try {
      const token = localStorage.getItem('access_token')

      const answersPayload = soalList
        .filter(soal => answers[soal.id])
        .map(soal => ({
          soal_id: soal.id,
          jawaban: answers[soal.id]
        }))

      const payload = {
        id_izin: parseInt(id),
        dokumen_id: dokumen.id,
        answers: answersPayload
      }

      const response = await fetch(`${API_BASE_URL}/asesmen/${id}/ia05`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Error saving answer:', error)
      throw error
    }
  }

  // Keep ref in sync for stale closure prevention
  saveAnswerRef.current = saveAnswer

  const handleNext = async () => {
    if (!canEdit) {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        navigate(`/asesi/asesmen/${id}/selesai`)
      }
      return
    }

    if (answers[currentSoal.id]) {
      setIsSaving(true)
      try {
        await saveAnswer()
      } catch (error) {
        showError(extractErrorMessage(error, 'Gagal menyimpan jawaban. Silakan coba lagi.'))
        setIsSaving(false)
        return
      }
      setIsSaving(false)
    }

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      await handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (hasSigned) {
      const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ia05') || s.href.includes('ujian'))
      const nextStep = asesmenSteps[currentStepIndex + 1]
      if (nextStep) {
        const nextPath = nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`)
        navigate(nextPath)
      } else {
        navigate(`/asesi/asesmen/${id}/selesai`)
      }
      return
    }

    if (!id || !dokumen) {
      showWarning('Data tidak lengkap')
      return
    }

    setIsSaving(true)
    setShowCelebration(true)

    try {
      await saveAnswer()
      publishUpdate()
      showSuccess('Ujian berhasil diselesaikan!')

      // Generate QR after successful save
      try {
        if (jadwalId) {
          await kegiatanService.generateQRUjian(id, jadwalId)
        }
      } catch (qrError) {
        console.error('Failed to generate QR Ujian:', qrError)
      }
    } catch (error) {
      showError(extractErrorMessage(error, 'Gagal menyimpan jawaban. Silakan coba lagi.'))
      setShowCelebration(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDotClick = (index: number) => {
    if (answers[currentSoal.id] && canEdit) {
      saveAnswer().catch(console.error)
    }
    setCurrentIndex(index)
  }

  const generateConfetti = () => {
    if (!showCelebration) return null

    const confettiColors = [colors.primary, colors.secondary, colors.accent, colors.success, '#6ba3b8']
    const confetti = []

    for (let i = 0; i < 50; i++) {
      const style = {
        left: `${Math.random() * 100}%`,
        top: `${-20}px`,
        backgroundColor: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        animationDelay: `${Math.random() * 0.5}s`,
        animationDuration: `${2 + Math.random() * 2}s`,
      }
      confetti.push(<div key={i} className="confetti-piece" style={style} />)
    }

    return confetti
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
                <FullPageLoader text="Memuat soal ujian..." />
      </div>
    )
  }

  if (!currentSoal) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
                <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Tidak ada soal ditemukan</h2>
        </div>
      </div>
    )
  }

  const isAnswered = !!answers[currentSoal.id]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
      <style>{`
        ${animations}

        /* Anti-screenshot & Anti-cheat CSS */
        body {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }

        * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }

        input, textarea {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
        }

        /* Prevent print screen */
        @media print {
          body { display: none !important; }
        }

        /* Prevent drag and save images */
        img {
          -webkit-user-drag: none !important;
          user-drag: none !important;
          pointer-events: none !important;
        }
      `}</style>

      {/* Anti-cheat Warning Modal */}
      {showWarningModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          animation: 'slideIn 0.3s ease-out',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '28px 32px',
            maxWidth: '420px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.3)',
            border: `3px solid ${displayViolationCount >= MAX_VIOLATIONS ? '#dc2626' : '#f59e0b'}`,
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: displayViolationCount >= MAX_VIOLATIONS
                ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
                : 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '32px',
              color: '#fff',
              fontWeight: 'bold',
            }}>
              {displayViolationCount >= MAX_VIOLATIONS ? '×' : '!'}
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              margin: '0 0 12px 0',
              color: displayViolationCount >= MAX_VIOLATIONS ? '#dc2626' : '#f59e0b',
            }}>
              {displayViolationCount >= MAX_VIOLATIONS ? 'Ujian Dihentikan' : 'Peringatan!'}
            </h3>
            <p style={{
              fontSize: '15px',
              color: '#475569',
              margin: '0 0 8px 0',
              lineHeight: '1.6',
            }}>
              {warningMessage}
            </p>
            <p style={{
              fontSize: '13px',
              color: '#64748b',
              margin: '0',
            }}>
              Sisa pelanggaran: {MAX_VIOLATIONS - displayViolationCount} dari {MAX_VIOLATIONS}
            </p>
            {displayViolationCount < MAX_VIOLATIONS && (
              <button
                onClick={() => setShowWarningModal(false)}
                style={{
                  marginTop: '20px',
                  padding: '12px 32px',
                  background: colors.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = colors.secondary}
                onMouseLeave={(e) => e.currentTarget.style.background = colors.primary}
              >
                Mengerti
              </button>
            )}
          </div>
        </div>
      )}

      {showCelebration && generateConfetti()}

      
      <div style={{ width: '100%', margin: '0 auto', padding: '20px 16px 40px' }}>
        

        {/* Header Card */}
        <div style={{
          background: 'linear-gradient(135deg, ' + colors.primary + ' 0%, ' + colors.secondary + ' 100%)',
          borderRadius: '14px',
          padding: '18px 20px',
          marginBottom: '18px',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 6px 24px rgba(0, 72, 143, 0.18)',
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '140px',
            height: '140px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '50%',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <h1 style={{ fontSize: '16px', fontWeight: '700', margin: 0, marginBottom: '4px' }}>
                  {dokumen?.nama_dokumen || 'Ujian'}
                </h1>
                <p style={{ fontSize: '12px', opacity: 0.9, margin: 0 }}>
                  {jabatanKerja || '-'}
                </p>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '10px 16px',
                textAlign: 'center',
                minWidth: '90px',
              }}>
                <div style={{ fontSize: '28px', fontWeight: '800', lineHeight: 1 }}>
                  {currentIndex + 1}/{totalQuestions}
                </div>
                <div style={{ fontSize: '10px', opacity: 0.9, marginTop: '2px' }}>
                  {progress} dijawab
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', opacity: 0.95 }}>
                <span>Progress</span>
                <span>{progressPercentage}%</span>
              </div>
              <div style={{
                height: '6px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${progressPercentage}%`,
                  background: 'linear-gradient(90deg, ' + colors.success + ' 0%, #00c78e 100%)',
                  borderRadius: '8px',
                  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                    animation: 'shimmer 2s infinite',
                  }} />
                </div>
              </div>
            </div>

            {/* Progress Dots */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {soalList.map((soal, index) => {
                const isCurrent = index === currentIndex
                const isThisAnswered = answers[soal.id]

                return (
                  <button
                    key={soal.id}
                    onClick={() => handleDotClick(index)}
                    disabled={!canEdit && !allSigned}
                    className="progress-dot"
                    style={{
                      width: isCurrent ? '28px' : '22px',
                      height: isCurrent ? '28px' : '22px',
                      borderRadius: '50%',
                      border: isCurrent ? '2px' : '2px',
                      borderColor: isCurrent
                        ? '#fff'
                        : isThisAnswered
                          ? colors.success
                          : 'rgba(255,255,255,0.4)',
                      backgroundColor: isCurrent
                        ? '#fff'
                        : isThisAnswered
                          ? colors.success
                          : 'transparent',
                      cursor: canEdit ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isCurrent ? '12px' : '10px',
                      fontWeight: '700',
                      color: isCurrent ? colors.primary : '#fff',
                      opacity: isCurrent || isThisAnswered ? 1 : 0.5,
                      boxShadow: isCurrent ? '0 0 0 3px rgba(255,255,255,0.2)' : 'none',
                    }}
                    title={`Soal ${soal.no}`}
                  >
                    {isThisAnswered && !isCurrent && <Check className="h-2 w-2" />}
                    {isCurrent && index + 1}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div
          className="animate-slideIn"
          style={{
            background: '#fff',
            borderRadius: '14px',
            padding: '22px',
            marginBottom: '18px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 3px 16px rgba(0, 72, 143, 0.06)',
          }}
        >
          {/* Question Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: isAnswered
                ? 'linear-gradient(135deg, ' + colors.success + ' 0%, #00c78e 100%)'
                : 'linear-gradient(135deg, ' + colors.primary + ' 0%, ' + colors.secondary + ' 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: '800',
              boxShadow: isAnswered ? '0 3px 12px rgba(0, 168, 107, 0.25)' : '0 3px 12px rgba(0, 72, 143, 0.2)',
            }}>
              {isAnswered ? <Check className="h-4 w-4" /> : currentIndex + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', color: colors.textLight, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {currentSoal.unit.kode} {currentSoal.kuk?.kode ? `• ${currentSoal.kuk.kode}` : ''}
              </div>
              <div style={{
                fontSize: '13px',
                color: isAnswered ? colors.success : colors.textLight,
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
              }}>
                {isAnswered ? 'Sudah dijawab' : 'Belum dijawab'}
              </div>
            </div>
          </div>

          {/* Question Text */}
          <div style={{
            fontSize: '16px',
            lineHeight: '1.6',
            color: colors.text,
            marginBottom: '20px',
            fontWeight: '600',
          }}>
            {currentSoal.soal}
          </div>

          {/* Answer Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { key: 'A' as const, text: currentSoal.jawab_a, color: colors.primary },
              { key: 'B' as const, text: currentSoal.jawab_b, color: colors.secondary },
              { key: 'C' as const, text: currentSoal.jawab_c, color: colors.accent },
              { key: 'D' as const, text: currentSoal.jawab_d, color: '#5ba3b8' },
            ].map((option, index) => {
              const isSelected = selectedOption === option.key

              return (
                <label
                  key={option.key}
                  className="option-card animate-slideIn"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 16px',
                    border: '2px solid',
                    borderColor: isSelected
                      ? option.color
                      : '#e2e8f0',
                    borderRadius: '10px',
                    cursor: canEdit ? 'pointer' : 'default',
                    background: isSelected
                      ? option.color + '12'
                      : '#fff',
                    opacity: canEdit ? 1 : 0.8,
                    position: 'relative',
                    animationDelay: `${index * 0.05}s`,
                  }}
                  onMouseEnter={(e) => {
                    if (canEdit && !isSelected) {
                      e.currentTarget.style.borderColor = option.color
                      e.currentTarget.style.transform = 'translateX(3px)'
                      e.currentTarget.style.boxShadow = `0 2px 12px ${option.color}20`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#e2e8f0'
                      e.currentTarget.style.transform = 'translateX(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isSelected
                      ? option.color
                      : '#f1f5f9',
                    color: isSelected ? '#fff' : colors.textLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '800',
                    flexShrink: 0,
                  }}>
                    {option.key}
                  </div>

                  <div style={{ flex: 1, display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <CustomRadio
                      name={`soal-${currentSoal.id}`}
                      value={option.key}
                      checked={isSelected}
                      onChange={() => handleAnswerChange(option.key)}
                      disabled={!canEdit || allSigned}
                      style={{ marginTop: '3px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        lineHeight: '1.5',
                        color: isSelected ? colors.text : colors.textLight,
                        fontWeight: isSelected ? '500' : '400',
                      }}>
                        {option.text}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '18px',
                      color: option.color,
                    }}>
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </label>
              )
            })}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0 || isSaving}
            style={{
              padding: '10px 20px',
              border: '2px solid #e2e8f0',
              background: '#fff',
              color: currentIndex === 0 || isSaving ? '#cbd5e1' : colors.textLight,
              fontSize: '13px',
              fontWeight: '600',
              cursor: currentIndex === 0 || isSaving ? 'not-allowed' : 'pointer',
              borderRadius: '10px',
              opacity: currentIndex === 0 || isSaving ? 0.5 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
            }}
            onMouseEnter={(e) => {
              if (currentIndex !== 0 && !isSaving) {
                e.currentTarget.style.borderColor = colors.primary
                e.currentTarget.style.color = colors.primary
                e.currentTarget.style.transform = 'translateX(-2px)'
              }
            }}
            onMouseLeave={(e) => {
              if (currentIndex !== 0) {
                e.currentTarget.style.borderColor = '#e2e8f0'
                e.currentTarget.style.color = colors.textLight
                e.currentTarget.style.transform = 'translateX(0)'
              }
            }}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Sebelumnya
          </button>

          <div style={{
            fontSize: '12px',
            color: colors.textLight,
            fontWeight: '500',
            padding: '8px 16px',
            background: '#fff',
            borderRadius: '10px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
          }}>
            {isSaving ? 'Menyimpan...' : `Soal ${currentIndex + 1} dari ${totalQuestions}`}
          </div>

          <button
            onClick={handleNext}
            disabled={isSaving || (!canEdit && !allSigned)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: isSaving || (!canEdit && !allSigned) ? '#cbd5e1' : 'linear-gradient(135deg, ' + colors.primary + ' 0%, ' + colors.secondary + ' 100%)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '700',
              cursor: isSaving || (!canEdit && !allSigned) ? 'not-allowed' : 'pointer',
              borderRadius: '10px',
              opacity: isSaving || !canEdit ? 0.5 : 1,
              minWidth: '100px',
              transition: 'all 0.2s',
              boxShadow: isSaving || !canEdit ? 'none' : '0 3px 12px rgba(0, 72, 143, 0.2)',
            }}
            onMouseEnter={(e) => {
              if (!isSaving && (canEdit || allSigned)) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 5px 16px rgba(0, 72, 143, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isSaving && (canEdit || allSigned)) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 3px 12px rgba(0, 72, 143, 0.2)'
              }
            }}
          >
            {isSaving
              ? 'Menyimpan...'
              : allSigned
                ? 'Lanjut'
                : currentIndex === totalQuestions - 1
                  ? 'Selesai'
                  : 'Selanjutnya'
            }
          </button>
        </div>

        {/* Info Banner */}
        {canEdit && !isAnswered && (
          <div style={{
            marginTop: '16px',
            padding: '10px 16px',
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1px solid #fcd34d',
            borderRadius: '10px',
            fontSize: '12px',
            color: '#92400e',
            textAlign: 'center',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 2px 6px rgba(252, 211, 77, 0.15)',
          }}>
            <Lightbulb className="h-3.5 w-3.5 animate-bounce" />
            Pilih jawaban sebelum melanjutkan ke soal berikutnya
          </div>
        )}
      </div>

      {/* Absen Awal Modal */}
      <WebcamModal
        isOpen={showAwalModal}
        onClose={handleAwalModalClose}
        onSubmit={submitAbsenAwal}
        title="Absen Masuk Ujian"
        description="Silakan ambil foto wajah Anda untuk absen masuk"
        canClose={false}
      />
    </div>
  )
}
