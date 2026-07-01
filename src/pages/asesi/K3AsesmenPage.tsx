import { useState, useEffect, useCallback } from "react"
import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
import { useNavigate, useParams } from "react-router-dom"
import MukLayout from "@/components/MukLayout"
import { useAuth } from "@/contexts/auth-context"
import { RoleId } from "@/lib/rbac-config"
import { useToast } from "@/contexts/ToastContext"
import { ActionButton } from "@/components/ui/ActionButton"
import { useDataDokumenPraAsesmen } from "@/hooks/useDataDokumenPraAsesmen"
import { useAbsenCheck } from "@/hooks/useAbsenCheck"
import { WebcamModal } from "@/components/ui/WebcamModal"
import { API_BASE_URL } from "@/config/api"
import { useSigningState, BarcodeState } from "@/hooks/useSigningState"
import { FullPageLoader } from "@/components/ui/loading-spinner"

interface K3Response {
  message: string
  data: {
    file: string
    barcodes?: BarcodeState
  }
}

export default function K3AsesmenPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { idIzin: idIzinFromUrl } = useParams<{ idIzin: string }>()
  const isAsesor = user?.role?.id === RoleId.ASESOR

  const idIzin = isAsesor ? idIzinFromUrl : user?.id_izin
  const { showWarning, showSuccess } = useToast()
  const { asesorList, tahap, jadwalId, metode, jenjang } = useDataDokumenPraAsesmen(idIzin)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [barcodes, setBarcodes] = useState<BarcodeState | null>(null)

  const fetchK3Data = useCallback(async () => {
    if (!idIzin) return
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/praasesmen/${idIzin}/file-k3`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result: K3Response = await response.json()
        if (result.message === "Success" && result.data) {
          if (result.data.file) setPdfUrl(result.data.file)
          if (result.data.barcodes) setBarcodes(result.data.barcodes as BarcodeState)
        }
        setIsDataLoading(false)
      } else {
        console.warn(`K3 API returned ${response.status}`)
        setIsDataLoading(false)
      }
    } catch (error) {
      console.error("Error fetching K3:", error)
      setIsDataLoading(false)
    }
  }, [idIzin])

  const signing = useSigningState({
    pageKey: 'k3',
    isAsesor: isAsesor,
    tahap: tahap ?? 1,
    barcodes: barcodes as any,
    setBarcodes: setBarcodes as any,
    asesorList: asesorList,
    userId: user?.id,
    userName: user?.name,
    idIzin: idIzin,
    jadwalId: jadwalId,
    onRefresh: fetchK3Data,
  })

  // Absen check - auto-detect role (asesi/asesor1/asesor2)
  const { showAwalModal, submitAbsenAwal, handleAwalModalClose, showAkhirModal, setShowAkhirModal, submitAbsenAkhir, handleAkhirModalClose, shouldShowAkhirModal: _shouldShowAkhirModal } = useAbsenCheck({
    phase: 'praasesmen',
    role: 'auto',
    checkOnMount: true, // Enable for both asesi and asesor
    idIzin: idIzin,
    asesorList: asesorList,
    tahap: tahap
  })

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchK3Data()
  }, [idIzin, fetchK3Data])

  // SSE: auto-refresh when another user saves

  const handleBack = () => {
    navigate(-1)
  }

  const handleLanjut = async () => {
    if (!signing.agreedChecklist && !signing.allSigned) {
      showWarning("Silakan centang pernyataan bahwa Anda telah memahami dokumen K3 Asesmen.")
      return
    }
    // Jika belum semua ttd, generate QR
    if (!signing.allSigned) {
      // Asesi tanda tangan duluan
      if (!signing.asesiHasSigned) {
        const ok = await signing.generateQR()
        if (!ok) return
        showSuccess("QR Code berhasil dibuat. Menunggu tanda tangan Asesor.")
        signing.publishUpdate()
        return
      }
      // Asesor tanda tangan
      if (!signing.asesorHasSigned) {
        const ok = await signing.generateQR()
        if (!ok) return
        showSuccess("QR Code berhasil dibuat.")
        signing.publishUpdate()
        return
      }
    }
    // Semua sudah ttd → absen akhir sebelum redirect
    const needsAbsenAkhir = await _shouldShowAkhirModal()
    if (needsAbsenAkhir) {
      setShowAkhirModal(true)
      return
    }
    // Absen akhir sudah ada → langsung dashboard
    navigate(isAsesor ? '/asesor/dashboard' : '/asesi/dashboard')
  }

  const handleAbsenAkhirSubmit = async (blob: Blob) => {
    await submitAbsenAkhir(blob)
    navigate(isAsesor ? '/asesor/dashboard' : '/asesi/dashboard')
  }

  if (isDataLoading) return <FullPageLoader text="Memuat data..." />

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Header */}
      
      <AsesmenBreadcrumb currentPage="K3" />

      <MukLayout currentStep={5} idIzin={idIzin} metode={metode} tahap={tahap} jenjang={jenjang}>
        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', marginBottom: '4px', textTransform: 'uppercase' }}>K3 ASESMEN</h2>
          <p style={{ fontSize: '13px', color: '#666' }}>Baca dan pahami dokumen K3 Asesmen di bawah ini</p>
        </div>

        {/* PDF Viewer */}
        {pdfUrl ? (
          <div style={{ background: '#fff', border: '1px solid #000', borderRadius: '4px', marginBottom: '20px', overflow: 'hidden' }}>
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=fitH`}
              style={{
                width: '100%',
                height: '800px',
                border: 'none'
              }}
              title="K3 Asesmen PDF"
            />
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #000', borderRadius: '4px', padding: '40px', textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ fontSize: '14px', color: '#666' }}>Dokumen K3 Asesmen tidak tersedia</p>
          </div>
        )}

        {/* Agreement Checklist */}
        {!signing.allSigned && (
        <div style={{ background: '#fff', border: '1px solid #000', borderRadius: '4px', marginBottom: '20px', padding: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: signing.allSigned ? 'not-allowed' : 'pointer' }}>
            <input
              type="checkbox"
              checked={signing.agreedChecklist}
              onChange={(e) => signing.setAgreedChecklist(e.target.checked)}
              disabled={signing.allSigned}
              style={{ marginTop: '2px', width: '16px', height: '16px', cursor: signing.allSigned ? 'not-allowed' : 'pointer' }}
            />
            <span style={{ fontSize: '12px', color: '#000', lineHeight: '1.5' }}>
              <strong style={{ textTransform: 'uppercase' }}>Pernyataan:</strong> Saya menyatakan bahwa saya telah membaca, memahami, dan menyetujui dokumen K3 Asesmen ini dengan sebenar-benarnya.
            </span>
          </label>
        </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          {isAsesor && (
            <ActionButton variant="secondary" onClick={handleBack}>
              Kembali
            </ActionButton>
          )}
          <ActionButton variant="primary" disabled={signing.buttonDisabled} onClick={handleLanjut}>
            {signing.buttonText}
          </ActionButton>
        </div>
      </MukLayout>

      {/* Absen Awal Modal */}
      <WebcamModal
        isOpen={showAwalModal}
        onClose={handleAwalModalClose}
        onSubmit={submitAbsenAwal}
        title="Absen Masuk Pra-Asesmen"
        description="Silakan ambil foto wajah Anda untuk absen masuk"
        canClose={false}
      />

      {/* Absen Akhir Pra-Asesmen Modal */}
      <WebcamModal
        isOpen={showAkhirModal}
        onClose={handleAkhirModalClose}
        onSubmit={handleAbsenAkhirSubmit}
        title="Absen Akhir Pra-Asesmen"
        description="Silakan ambil foto wajah Anda untuk absen akhir pra-asesmen"
        canClose={false}
      />
    </div>
  )
}
