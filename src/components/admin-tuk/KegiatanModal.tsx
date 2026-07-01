import { useState, useEffect } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faClose, faCamera, faClock, faUpload, faImage, faUsers, faUserCheck, faFilePdf, faExternalLinkAlt, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons"
import { SimpleSpinner } from "@/components/ui/loading-spinner"
import { toast } from "@/components/ui/toast"
import { extractErrorMessage } from "@/lib/error-utils"
import QRCode from "qrcode"
import { encryptCaptureData } from "@/utils/crypto"

import { API_BASE_URL } from "@/config/api"
const CAPTURE_BASE_URL = "https://sisuj.vercel.app/capture"

type KegiatanType = 'foto_bersama' | 'daftar_hadir_asesi' | 'daftar_hadir_asesor'

interface KegiatanData {
  url_foto_bersama: string | null
  url_ttd_asesi_asesmen: string | null
  url_ttd_asesi_pra: string | null
  url_ttd_asesor_asesmen: string | null
  url_ttd_asesor_pra: string | null
}

interface UrlField {
  key: keyof KegiatanData
  label: string
}

interface KegiatanModalProps {
  isOpen: boolean
  type: KegiatanType
  jadwalId: string
  onClose: () => void
}

export function KegiatanModal({ isOpen, type, jadwalId, onClose }: KegiatanModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState<string | null>(null)
  const [data, setData] = useState<KegiatanData | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [selectedField, setSelectedField] = useState<UrlField | null>(null)
  const [imageLoadError, setImageLoadError] = useState(false)

  // Get labels based on type
  const getTypeInfo = (): {
    title: string
    subtitle: string
    icon: any
    iconBg: string
    captureType: string
    urlFields: UrlField[]
    uploadEndpoint: string
  } => {
    switch (type) {
      case 'foto_bersama':
        return {
          title: 'Foto Bersama',
          subtitle: 'Upload foto bersama kegiatan',
          icon: faImage,
          iconBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          captureType: 'foto_bersama',
          urlFields: [{ key: 'url_foto_bersama', label: 'Foto Bersama' }],
          uploadEndpoint: 'foto-bersama'
        }
      case 'daftar_hadir_asesi':
        return {
          title: 'Daftar Hadir Asesi',
          subtitle: 'Tanda tangan kehadiran asesi',
          icon: faUsers,
          iconBg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          captureType: 'daftar_hadir_asesi',
          urlFields: [
            { key: 'url_ttd_asesi_pra', label: 'Pra-Asesmen' },
            { key: 'url_ttd_asesi_asesmen', label: 'Asesmen' }
          ],
          uploadEndpoint: 'daftar-hadir/asesi'
        }
      case 'daftar_hadir_asesor':
        return {
          title: 'Daftar Hadir Asesor',
          subtitle: 'Tanda tangan kehadiran asesor',
          icon: faUserCheck,
          iconBg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
          captureType: 'daftar_hadir_asesor',
          urlFields: [
            { key: 'url_ttd_asesor_pra', label: 'Pra-Asesmen' },
            { key: 'url_ttd_asesor_asesmen', label: 'Asesmen' }
          ],
          uploadEndpoint: 'daftar-hadir/asesor'
        }
    }
  }

  const typeInfo = getTypeInfo()

  // Generate QR Code for mobile capture - use selectedField.key for correct field type
  useEffect(() => {
    if (isOpen && jadwalId && selectedField) {
      const token = generateTempToken()
      const authToken = localStorage.getItem("access_token") || ""

      // Encrypt all data into single parameter
      const encryptedData = encryptCaptureData({
        token,
        type: selectedField.key,
        auth: authToken,
        jadwalId
      })

      const url = `${CAPTURE_BASE_URL}?data=${encodeURIComponent(encryptedData)}`

      QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: { dark: '#000', light: '#fff' }
      }).then(setQrDataUrl)
    }
  }, [isOpen, jadwalId, selectedField])

  // Generate temporary token (30 min expiry)
  const generateTempToken = () => {
    const timestamp = Date.now()
    const expiry = timestamp + (30 * 60 * 1000) // 30 minutes
    const random = Math.random().toString(36).substring(2, 15)
    return btoa(`${expiry}.${random}.${jadwalId}`)
  }

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch data
  const fetchData = async () => {
    if (!jadwalId) return
    setIsLoading(true)

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/bukti/${jadwalId}/kegiatan`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.message === "success") {
          setData(result.data)
        }
      }
    } catch (error) {
      console.error('Error fetching kegiatan data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && jadwalId) {
      fetchData()
    }
  }, [isOpen, jadwalId])

  // Auto-select first field when data loads
  useEffect(() => {
    if (isOpen && !isLoading && !selectedField) {
      const firstField = typeInfo.urlFields[0]
      if (firstField) {
        setSelectedField(firstField)
      }
    }
  }, [isOpen, isLoading, selectedField, type])

  // Reset image load error when URL changes
  useEffect(() => {
    setImageLoadError(false)
  }, [selectedField])

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedField(null)
      setData(null)
    }
  }, [isOpen])

  const getUrl = (field: UrlField): string | null => {
    if (!data) return null
    const url = data[field.key]
    return url && url !== '' ? url : null
  }

  // Compute selectedUrl early (needed for useEffects)
  const selectedUrl = selectedField ? getUrl(selectedField) : null
  const isPdf = selectedUrl?.toLowerCase().endsWith('.pdf')

  // Debug logging
  console.log('[KegiatanModal] Field:', selectedField?.key, 'URL:', selectedUrl)
  console.log('[KegiatanModal] isPdf:', isPdf, 'imageLoadError:', imageLoadError)

  const handleUpload = async (fieldKey: string, file: File) => {
    if (!jadwalId) return

    setIsUploading(fieldKey)
    try {
      const token = localStorage.getItem("access_token")
      const formData = new FormData()

      // Map fieldKey (url_foto_bersama) to form field name (foto_bersama)
      const fieldName = fieldKey.replace('url_', '')
      formData.append(fieldName, file)

      const response = await fetch(`${API_BASE_URL}/bukti/${jadwalId}/kegiatan`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        toast(`${typeInfo.title} berhasil diupload!`, "success")
        fetchData() // Refresh data
      } else {
        const error = await response.json().catch(() => ({ message: "Gagal upload" }))
        toast(error.message || "Gagal mengupload", "error")
      }
    } catch (error) {
      console.error('Error uploading:', error)
      toast(extractErrorMessage(error, "Gagal mengupload"), "error")
    } finally {
      setIsUploading(null)
    }
  }

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          width: '85%',
          height: '85vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'modalSlideIn 0.3s ease-out',
          overflow: 'visible',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <style>{`
          @keyframes modalSlideIn {
            from { opacity: 0; transform: translateY(-20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FontAwesomeIcon icon={typeInfo.icon} style={{ fontSize: '22px', color: '#1e3a5f' }} />
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
                {typeInfo.title}
              </h3>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                {typeInfo.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              color: '#6b7280',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <FontAwesomeIcon icon={faClose} style={{ fontSize: '18px' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', flex: 1, overflow: 'auto', position: 'relative' }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <SimpleSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* Photo Preview Area */}
              {selectedField && (
                <div style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  {selectedUrl ? (
                    <>
                      {isPdf ? (
                        // PDF Preview
                        <>
                          {console.log('[KegiatanModal] Rendering PDF iframe for URL:', selectedUrl)}
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            background: '#f3f4f6',
                          }}>
                            <div style={{
                              padding: '12px 16px',
                              background: '#fff',
                              borderBottom: '1px solid #e5e7eb',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FontAwesomeIcon icon={faFilePdf} style={{ fontSize: '20px', color: '#ef4444' }} />
                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>PDF Document</span>
                              </div>
                            <a
                              href={selectedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                background: '#3b82f6',
                                color: '#fff',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                textDecoration: 'none',
                              }}
                            >
                              <FontAwesomeIcon icon={faExternalLinkAlt} style={{ fontSize: '10px' }} />
                              Buka
                            </a>
                          </div>
                          <iframe
                            src={selectedUrl}
                            style={{
                              width: '100%',
                              flex: 1,
                              border: 'none',
                            }}
                            title={selectedField.label}
                          />
                        </div>
                        </>
                      ) : (
                        // Image Preview or try image for unknown file type
                        !imageLoadError ? (
                          <img
                            src={selectedUrl}
                            alt={selectedField.label}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              background: '#fff',
                            }}
                            onLoad={() => {
                              console.log('[KegiatanModal] Image loaded successfully!')
                            }}
                            onError={() => {
                              console.log('[KegiatanModal] Image failed to load, URL:', selectedUrl)
                              setImageLoadError(true)
                            }}
                          />
                        ) : (
                        // Unknown file type - show download link
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '16px',
                          background: '#f9fafb',
                        }}>
                          <FontAwesomeIcon icon={faExternalLinkAlt} style={{ fontSize: '48px', color: '#6b7280' }} />
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '14px', color: '#374151', fontWeight: '500', marginBottom: '8px' }}>
                              File tidak dapat dipreview
                            </p>
                            <a
                              href={selectedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                background: '#3b82f6',
                                color: '#fff',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '600',
                                textDecoration: 'none',
                              }}
                            >
                              <FontAwesomeIcon icon={faExternalLinkAlt} style={{ fontSize: '12px' }} />
                              Buka File
                            </a>
                          </div>
                        </div>
                      )
                    )}
                  </>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '40px 24px',
                      gap: '24px',
                      flex: 1,
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <FontAwesomeIcon icon={typeInfo.icon} style={{ fontSize: '48px', color: '#1e3a5f', marginBottom: '12px' }} />
                        <p style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                          Belum ada foto untuk {selectedField.label}
                        </p>
                      </div>

                      {isMobile ? (
                        // Mobile - Camera option
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '300px' }}>
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '10px',
                              padding: '14px 24px',
                              background: '#1e3a5f',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '10px',
                              fontSize: '15px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            {isUploading === selectedField.key ? (
                              <>
                                <SimpleSpinner size="sm" className="text-white" />
                                Mengupload...
                              </>
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faCamera} />
                                Buka Kamera
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              capture="environment"
                              style={{ display: 'none' }}
                              disabled={!!isUploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file && selectedField) handleUpload(selectedField.key, file)
                              }}
                            />
                          </label>
                          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>atau</div>
                          <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '12px 20px',
                            background: '#f3f4f6',
                            color: '#374151',
                            border: '2px dashed #d1d5db',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                          }}>
                            <FontAwesomeIcon icon={faUpload} />
                            Pilih dari Galeri
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              style={{ display: 'none' }}
                              disabled={!!isUploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file && selectedField) handleUpload(selectedField.key, file)
                              }}
                            />
                          </label>
                        </div>
                      ) : (
                        // Desktop - QR Code + Upload
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%', maxWidth: '300px' }}>
                          {qrDataUrl ? (
                            <div style={{
                              padding: '12px',
                              background: '#fff',
                              border: '2px solid #e5e7eb',
                              borderRadius: '12px',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                            }}>
                              <img src={qrDataUrl} alt="QR Code" style={{ width: '160px', height: '160px' }} />
                            </div>
                          ) : (
                            <SimpleSpinner size="lg" />
                          )}
                          <div style={{
                            padding: '8px 14px',
                            background: '#fef3c7',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}>
                            <FontAwesomeIcon icon={faClock} style={{ color: '#d97706', fontSize: '12px' }} />
                            <span style={{ fontSize: '12px', color: '#92400e' }}>QR berlaku 30 menit</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>atau</span>
                            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                          </div>
                          <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '12px 20px',
                            background: '#f3f4f6',
                            color: '#374151',
                            border: '2px dashed #d1d5db',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            width: '100%',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#1e3a5f'
                            e.currentTarget.style.background = '#e8eef5'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#d1d5db'
                            e.currentTarget.style.background = '#f3f4f6'
                          }}
                          >
                            {isUploading === selectedField.key ? (
                              <>
                                <SimpleSpinner size="sm" className="text-[#1e3a5f]" />
                                Mengupload...
                              </>
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faUpload} />
                                Upload dari Komputer
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              style={{ display: 'none' }}
                              disabled={!!isUploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file && selectedField) handleUpload(selectedField.key, file)
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Navigation Tabs - Outside content div, positioned relative to modal */}
        {!isLoading && typeInfo.urlFields.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#fff',
            padding: '8px 16px',
            borderRadius: '50px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e5e7eb',
            zIndex: 10
          }}>
            {typeInfo.urlFields.map((field, index) => {
              const isSelected = selectedField?.key === field.key
              const isFirst = index === 0

              return (
                <button
                  key={field.key}
                  onClick={() => setSelectedField(field)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: isSelected ? '#e5e7eb' : '#10b981',
                    color: isSelected ? '#000': '#fff',
                    fontSize: '13px',
                    fontWeight: '600',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: isSelected ? 0.5 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  {isFirst ? (
                    <>
                      <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: '12px' }} />
                      <span>{field.label}</span>
                    </>
                  ) : (
                    <>
                      <span>{field.label}</span>
                      <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '12px' }} />
                    </>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* QR Overlay Modal */}
      <div
        id="qr-overlay"
        onClick={(e) => {
          e.stopPropagation()
          const overlay = document.getElementById('qr-overlay')
          if (overlay) overlay.style.display = 'none'
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '350px',
            width: '100%',
            textAlign: 'center',
          }}
        >
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#111827' }}>
              Scan dengan HP
            </h3>

          {qrDataUrl ? (
            <div style={{
              padding: '16px',
              background: '#f9fafb',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              marginBottom: '16px',
            }}>
              <img
                src={qrDataUrl}
                alt="QR Code"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          ) : (
            <SimpleSpinner size="lg" />
          )}

          <div style={{
            padding: '10px 16px',
            background: '#fef3c7',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}>
            <FontAwesomeIcon icon={faClock} style={{ color: '#d97706', fontSize: '14px' }} />
            <span style={{ fontSize: '13px', color: '#92400e' }}>
              QR berlaku 30 menit
            </span>
          </div>

          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
            Scan QR ini dengan HP untuk mengambil foto langsung dari kamera
          </p>

          <button
            onClick={() => {
              const overlay = document.getElementById('qr-overlay')
              if (overlay) overlay.style.display = 'none'
            }}
            style={{
              padding: '10px 24px',
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
