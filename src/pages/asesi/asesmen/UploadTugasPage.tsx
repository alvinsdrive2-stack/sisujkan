import { useState, useEffect, useCallback, useMemo } from "react"
import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
import { useNavigate, useParams } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCloudUploadAlt, faEye, faCheck, faRedo, faSpinner } from "@fortawesome/free-solid-svg-icons"
import ModularAsesiLayout from "@/components/ModularAsesiLayout"
import { useAuth } from "@/contexts/auth-context"
import { RoleId } from "@/lib/rbac-config"
import { useToast } from "@/contexts/ToastContext"
import { useAsesorRole } from "@/hooks/useAsesorRole"
import { getAsesmenSteps } from "@/lib/asesmen-steps"
import { useDataDokumenAsesmen } from "@/hooks/useDataDokumenAsesmen"
import { useDataDokumenPraAsesmen } from "@/hooks/useDataDokumenPraAsesmen"
import { useAbsenCheck } from "@/hooks/useAbsenCheck"
import { useKegiatanByRole } from "@/hooks/useKegiatanByRole"
import { ActionButton } from "@/components/ui/ActionButton"
import { useSigningState, BarcodeState } from "@/hooks/useSigningState"
import { WebcamModal } from "@/components/ui/WebcamModal"
import { API_BASE_URL } from "@/config/api"

interface TugasResponse {
  message: string
  data: {
    url: string
    extension: string
  }
}

// Button styles matching ActionButton but with green theme
const greenButtonStyles = {
  primary: {
    padding: '10px 20px',
    border: 'none',
    background: '#10b981',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
  },
  primaryHover: {
    background: '#059669',
    transform: 'translateY(-2px)'
  },
  secondary: {
    padding: '10px 20px',
    border: '2px solid #10b981',
    background: '#fff',
    color: '#10b981',
    fontSize: '14px',
    fontWeight: '600',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  secondaryHover: {
    background: '#ecfdf5',
    transform: 'translateY(-2px)'
  }
}

export default function UploadTugasPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { id } = useParams<{ id?: string }>()
  const { role: asesorRole } = useAsesorRole(id)
  const { asesorList, jenjang, jadwalId, metode } = useDataDokumenAsesmen(id)
  const { showSuccess, showError, showWarning } = useToast()

  // Check if user is an asesor (view-only mode)
  const isAsesor = user?.role?.id === RoleId.ASESOR
  const isReadOnly = isAsesor

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedTugas, setUploadedTugas] = useState<{ url: string; extension: string; fileName: string } | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [barcodes, setBarcodes] = useState<BarcodeState | null>(null)

  const { kegiatan: _kegiatan } = useKegiatanByRole()
  const { tahap } = useDataDokumenPraAsesmen(id)

  // Get dynamic steps
  const asesmenSteps = useMemo(() => getAsesmenSteps(jenjang, isAsesor, asesorRole, asesorList.length, metode, tahap), [jenjang, isAsesor, asesorRole, asesorList.length, metode, tahap])

  // Absen check - auto-detect role (asesi/asesor1/asesor2)
  const { showAwalModal, submitAbsenAwal, handleAwalModalClose } = useAbsenCheck({
    phase: 'asesmen',
    role: 'auto',
    checkOnMount: true,
    idIzin: id,
    asesorList
  })

  // Fetch existing tugas
  const fetchTugas = useCallback(async () => {
    if (!id) return
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/asesmen/${id}/tugas`, {
        headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
      })
      if (response.ok) {
        const result: TugasResponse = await response.json()
        if (result.message === "Success" && result.data?.url) {
          setUploadedTugas({ url: result.data.url, extension: result.data.extension, fileName: `Tugas.${result.data.extension}` })
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
    } catch (error) {
      console.error("Error fetching tugas:", error)
    }
  }, [id])

  useEffect(() => { fetchTugas() }, [fetchTugas])

  const signing = useSigningState({
    pageKey: 'upload-tugas',
    isAsesor,
    tahap,
    barcodes: barcodes as BarcodeState | null,
    setBarcodes: setBarcodes as React.Dispatch<React.SetStateAction<BarcodeState | null>>,
    asesorList,
    userId: user?.id,
    userName: user?.name,
    idIzin: id,
    jadwalId,
    onRefresh: fetchTugas,
  })
  const publishUpdate = signing.publishUpdate

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (signing.allSigned) return
    const file = e.target.files?.[0]
    if (file && validateFile(file)) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || signing.allSigned) return

    setIsUploading(true)
    try {
      const token = localStorage.getItem("access_token")
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(`${API_BASE_URL}/asesmen/${id}/upload-tugas`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      })

      const result = await response.json()
      

      if (response.ok) {
        // Refetch tugas data to get the correct URL from server
        await fetchTugas()
        publishUpdate()
        setSelectedFile(null)
        showSuccess(result.message || 'Tugas berhasil diupload!')
        setShowModal(true)
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        showError(result.message || 'Gagal mengupload tugas')
      }
    } catch (error) {
      console.error("Error uploading tugas:", error)
      showError('Terjadi kesalahan saat mengupload tugas')
    } finally {
      setIsUploading(false)
    }
  }

  const validateFile = (file: File): boolean => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ]
    const allowedExtensions = ['.pdf', '.ppt', '.pptx', '.jpg', '.jpeg', '.png']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      showError('Format file tidak didukung. Gunakan PDF, PPT, PPTX, JPG, atau PNG.')
      return false
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      showError('Ukuran file terlalu besar. Maksimal 10MB.')
      return false
    }

    return true
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (signing.allSigned) return
    const file = e.dataTransfer.files?.[0]
    if (file && validateFile(file)) {
      setSelectedFile(file)
    }
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleGantiFile = () => {
    if (signing.allSigned) return
    setUploadedTugas(null)
    setSelectedFile(null)
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Header */}
      
      {/* Breadcrumb */}
      <AsesmenBreadcrumb currentPage="Upload Tugas" />

      <ModularAsesiLayout currentStep={asesmenSteps.find(s => s.href.includes('upload-tugas'))?.number || 2} steps={asesmenSteps} id={id} metode={metode}>
        {/* Main Container */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '24px' }}>
          {/* Header */}
          {!isReadOnly && (
          <div style={{  paddingBottom: '16px', borderBottom: '1px solid #eee', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', marginBottom: '4px' }}>
              UPLOAD FILE TUGAS
            </h2>
            <p style={{ fontSize: '13px', color: '#666' }}>
              Silakan upload tugas terstruktur Anda (PDF, PPT, PPTX - Max 10MB)
            </p>
          </div>
          )}
          {isReadOnly && uploadedTugas && (
          <div style={{  paddingBottom: '16px', borderBottom: '1px solid #eee', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', marginBottom: '4px' }}>
              FILE TUGAS DARI ASESI
            </h2>
            <p style={{ fontSize: '13px', color: '#666' }}>
              Silakan cek tugas terstruktur dari asesi berikut
            </p>
          </div>
          )}
          {/* Asesor view-only - show preview directly */}
          {isReadOnly && uploadedTugas && (
            <div style={{ borderRadius: '12px' }}>
              <div style={{
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                

                {/* Preview Area */}
                <div style={{
                  width: '100%',
                  height: '90vh',
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  {['pdf', 'ppt', 'pptx'].includes(uploadedTugas.extension.toLowerCase()) ? (
                    // PDF/PPT - use object
                    <object
                      data={uploadedTugas.url + '#toolbar=0&navpanes=0&scrollbar=0'}
                      type={uploadedTugas.extension === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation'}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none'
                      }}
                    >
                      <p style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        Loading preview...
                      </p>
                    </object>
                  ) : (
                    // Images - use img
                    <img
                      src={uploadedTugas.url}
                      alt={uploadedTugas.fileName}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  )}
                </div>
              </div>
                          </div>
          )}

          {/* Upload area - hide for asesor (view-only) */}
          {!isReadOnly && (
            <div style={{ borderRadius: '12px' }}>
              {/* KONDISI 1: File sudah ada dari API - Upload area HIJAU */}
              {uploadedTugas && !selectedFile ? (
                <div style={{ textAlign: 'center', maxWidth: '100%',
                      maxHeight: '100%',
                      margin: '0 auto',
                      padding: '32px',
                      background: isDragging ? '#F5FFF6' : '#F5FFF6',
                      borderRadius: '16px',
                      border: isDragging ? '2px dashed #B0D9B2' : '2px dashed #B0D9B2',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer' }}>
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                      position: 'relative',

                    }}>
                    <FontAwesomeIcon icon={faCheck} style={{ fontSize: '48px', color: '#10b981' }} />
                  </div>

                  <p style={{ fontSize: '16px', color: '#065f46', fontWeight: '600', marginTop: '12px' }}>
                    File berhasil diupload!
                  </p>
                   <span style={{ fontSize: '14px', color: '#166534', fontWeight: '500', marginBottom: '24px', display: 'block', marginTop: '8px' }}>
                <strong>{uploadedTugas.fileName}</strong>
              </span>

                  {/* Tombol Lihat dan Ganti File - ActionButton style with green theme */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button
                      onClick={() => setShowModal(true)}
                      style={greenButtonStyles.primary}
                      onMouseEnter={(e) => {
                        Object.assign(e.currentTarget.style, greenButtonStyles.primaryHover)
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = greenButtonStyles.primary.background
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <FontAwesomeIcon icon={faEye} style={{ marginRight: '8px' }} />
                      Lihat
                    </button>
                    <button
                      onClick={handleGantiFile}
                      style={greenButtonStyles.secondary}
                      onMouseEnter={(e) => {
                        Object.assign(e.currentTarget.style, greenButtonStyles.secondaryHover)
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = greenButtonStyles.secondary.background
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <FontAwesomeIcon icon={faRedo} style={{ marginRight: '8px' }} />
                      Ganti File
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* KONDISI 2: Belum ada file ATAU setelah Ganti File dipencet - Upload area default */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      margin: '0 auto',
                      padding: '32px',
                      background: isDragging ? '#f0f9ff' : '#fafafa',
                      borderRadius: '16px',
                      border: isDragging ? '2px dashed #10b981' : '2px dashed #d1d5db',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      background: isDragging ? '#d1fae5' : '#e5e7eb',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}>
                      <FontAwesomeIcon icon={faCloudUploadAlt} style={{ fontSize: '32px', color: isDragging ? '#10b981' : '#6b7280' }} />
                    </div>

                    {selectedFile ? (
                      <>
                        <p style={{ fontSize: '14px', color: '#10b981', fontWeight: '600', marginBottom: '4px' }}>
                          {selectedFile.name}
                        </p>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button
                            onClick={handleUpload}
                            disabled={isUploading}
                            style={{
                              padding: '12px 24px',
                              background: isUploading ? '#9ca3af' : '#10b981',
                              color: '#fff',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: isUploading ? 'not-allowed' : 'pointer',
                              border: 'none',
                              borderRadius: '8px',
                              transition: 'all 0.2s',
                              boxShadow: isUploading ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.2)'
                            }}
                          >
                            {isUploading ? (
                              <>
                                <FontAwesomeIcon icon={faSpinner} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} />
                                Mengupload...
                              </>
                            ) : 'Upload'}
                          </button>
                          <button
                            onClick={() => setSelectedFile(null)}
                            disabled={isUploading}
                            style={{
                              padding: '12px 24px',
                              background: '#fff',
                              color: '#6b7280',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: isUploading ? 'not-allowed' : 'pointer',
                              border: '2px solid #e2e8f0',
                              borderRadius: '8px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#cbd5e1' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0' }}
                          >
                            Batal
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p style={{ fontSize: '14px', color: '#374151', fontWeight: '500', marginBottom: '16px' }}>
                          Drag & drop file Anda di sini
                        </p>
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 32px',
                            background: '#3b82f6',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            border: 'none',
                            borderRadius: '8px',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.transform = 'translateY(0)' }}
                        >
                          <FontAwesomeIcon icon={faCloudUploadAlt} />
                          Pilih File
                          <input
                            type="file"
                            accept=".pdf,.ppt,.pptx"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '16px' }}>
                          PDF, PPT, PPTX, JPG, PNG • Maks 10MB
                        </p>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

          <div style={{ marginTop: '16px'}}>
            {!signing.allSigned && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <input
                type="checkbox"
                checked={signing.agreedChecklist}
                onChange={(e) => signing.setAgreedChecklist(e.target.checked)}
                disabled={signing.allSigned}
                style={{ marginTop: '4px', width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>
                Saya menyatakan bahwa file yang saya upload adalah hasil karya sendiri dan tidak melanggar hak cipta pihak lain. Saya bersedia bertanggung jawab atas keaslian dokumen yang saya sertakan.
              </span>
            </label>
            )}
            {tahap===0 && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <input
                type="checkbox"
                checked={signing.agreedChecklist}
                onChange={(e) => signing.setAgreedChecklist(e.target.checked)}
                style={{ marginTop: '4px', width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>
                Saya menyatakan bahwa file yang saya upload adalah hasil karya sendiri dan tidak melanggar hak cipta pihak lain. Saya bersedia bertanggung jawab atas keaslian dokumen yang saya sertakan.
              </span>
            </label>
            )}
          </div>

        {/* Actions - hide for asesor */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
          {isAsesor && (
          <ActionButton
            variant="secondary"
            disabled={isNavigating}
            onClick={() => {
              const jenjangNum = parseInt(jenjang)
              if (jenjangNum < 4) {
                navigate(`/asesi/asesmen/${id}/ia03`)
              } else {
                navigate(`/asesi/asesmen/${id}/ia04b`)
              }
            }}
          >
            Kembali
          </ActionButton>
          )}
          <ActionButton
            variant="primary"
            disabled={isNavigating || signing.buttonDisabled}
            onClick={async () => {
              if (tahap === 0) {
                const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('upload-tugas') || s.href.includes('tugas'))
                const nextStep = asesmenSteps[currentStepIndex + 1]
                navigate(nextStep ? nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`) : `/asesi/asesmen/${id}/selesai`)
                return
              }
              if (signing.allSigned) {
                const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('upload-tugas') || s.href.includes('tugas'))
                const nextStep = asesmenSteps[currentStepIndex + 1]
                if (nextStep) {
                  const nextPath = nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`)
                  navigate(nextPath)
                } else {
                  navigate(`/asesi/asesmen/${id}/selesai`)
                }
                return
              }
              if (!uploadedTugas || !signing.agreedChecklist) {
                showWarning("Silakan centang pernyataan bahwa file adalah hasil karya sendiri.")
                return
              }
              if (!signing.asesiHasSigned) {
                const ok = await signing.generateQR()
                if (!ok) return
                showSuccess("QR Code berhasil dibuat. Menunggu tanda tangan Asesor.")
                signing.publishUpdate()
                return
              }
              setIsNavigating(true)
              const jenjangNum = parseInt(jenjang)
              if (jenjangNum < 4) {
                navigate(`/asesi/asesmen/${id}/ia05`)
              } else {
                navigate(`/asesi/asesmen/${id}/ia04b`)
              }
            }}
          >
            {isNavigating ? 'Memproses...' : signing.buttonText}
          </ActionButton>
        </div>
      </ModularAsesiLayout>

      {/* File Preview Modal - only for non-asesor */}
      {!isReadOnly && showModal && uploadedTugas && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '10px'
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              maxWidth: '68%',
              width: '100%',
              height: '90%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Content - File Preview */}
            <div style={{ flex: 1, overflow: 'hidden', padding: '5px', background: '#fafafa', position: 'relative' }}>
              {['pdf', 'ppt', 'pptx'].includes(uploadedTugas.extension.toLowerCase()) ? (
                // PDF/PPT - use iframe or object
                <object
                  data={uploadedTugas.url}
                  type={uploadedTugas.extension === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation'}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                >
                  <p style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    Loading preview...
                  </p>
                </object>
              ) : (
                // Images - use img
                <img
                  src={uploadedTugas.url}
                  alt={uploadedTugas.fileName}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px'
                  }}
                />
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '8px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <a
                href={uploadedTugas.url}
                download={uploadedTugas.fileName}
                style={{
                  padding: '10px 20px',
                  background: '#fff',
                  color: '#10b981',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: '2px solid #10b981',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#ecfdf5'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                Download
              </a>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#CC3131',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#8C2222' }}
                onMouseLeave={(e) => e.currentTarget.style.background = '#CC3131'}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

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
