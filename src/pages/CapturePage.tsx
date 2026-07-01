import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCamera, faCheck, faSpinner, faExclamationTriangle, faRedo, faUserCheck, faImage } from "@fortawesome/free-solid-svg-icons"
import { SimpleSpinner } from "@/components/ui/loading-spinner"
import { decryptCaptureData } from "@/utils/crypto"

import { API_BASE_URL } from "@/config/api"

// Primary color: HSL(222, 80%, 25%) = #0d2137
const PRIMARY_COLOR = "#0d2137"
const PRIMARY_DARK = "#081624"

// Image compression settings
const MAX_IMAGE_SIZE = 500 * 1024 // 500KB
const MAX_WIDTH = 1024
const MAX_HEIGHT = 1024
const QUALITY = 0.8

// Compress image using Canvas
const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Try to compress to target size
        let quality = QUALITY
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'))
                return
              }
              if (blob.size <= MAX_IMAGE_SIZE || quality <= 0.1) {
                resolve(blob)
              } else {
                quality -= 0.1
                tryCompress()
              }
            },
            'image/jpeg',
            quality
          )
        }
        tryCompress()
      }
      img.onerror = () => reject(new Error('Failed to load image'))
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
  })
}

export default function CapturePage() {
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [compressedImageBlob, setCompressedImageBlob] = useState<Blob | null>(null)
  const [tokenData, setTokenData] = useState<{
    valid: boolean
    type?: string
    jadwalId?: string
    authToken?: string
    expired?: boolean
  } | null>(null)

  const encryptedData = searchParams.get("data")

  // Verify token on mount
  useEffect(() => {
    const verifyToken = () => {
      if (!encryptedData) {
        setTokenData({ valid: false })
        setError("Data tidak ditemukan")
        setIsLoading(false)
        return
      }

      try {
        const decrypted = decryptCaptureData(encryptedData)

        if (!decrypted) {
          setTokenData({ valid: false })
          setError("Data tidak valid")
          setIsLoading(false)
          return
        }

        const { token, auth, jadwalId } = decrypted

        if (!token) {
          setTokenData({ valid: false })
          setError("Token tidak ditemukan")
          setIsLoading(false)
          return
        }

        if (!auth) {
          setTokenData({ valid: false })
          setError("Autentikasi tidak ditemukan")
          setIsLoading(false)
          return
        }

        const decoded = atob(token)
        const [expiryStr, _random] = decoded.split(".")
        const expiry = parseInt(expiryStr)
        const now = Date.now()

        if (now > expiry) {
          setTokenData({ valid: false, expired: true })
          setError("QR Code sudah kedaluwarsa. Silakan scan ulang dari laptop.")
          setIsLoading(false)
          return
        }

        setTokenData({
          valid: true,
          jadwalId,
          authToken: auth,
          type: decrypted.type,
        })
      } catch (e) {
        setTokenData({ valid: false })
        setError("Data tidak valid")
        setIsLoading(false)
      } finally {
        setIsLoading(false)
      }
    }

    verifyToken()
  }, [encryptedData])

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        // Compress image before setting
        const compressedBlob = await compressImage(file)
        setCompressedImageBlob(compressedBlob)

        const reader = new FileReader()
        reader.onload = (e) => {
          setCapturedImage(e.target?.result as string)
        }
        reader.readAsDataURL(compressedBlob)
      } catch (err) {
        console.error('Compression error:', err)
        // Fallback to original file if compression fails
        const reader = new FileReader()
        reader.onload = (e) => {
          setCapturedImage(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleRetake = () => {
    setCapturedImage(null)
    setCompressedImageBlob(null)
  }

  const handleUpload = async () => {
    if (!compressedImageBlob || !tokenData?.jadwalId || !tokenData?.authToken) return

    setIsUploading(true)
    setError(null)

    try {
      // Create image file from compressed blob
      const imageFile = new File([compressedImageBlob], 'photo.jpg', { type: 'image/jpeg' })

      const formData = new FormData()
      const type = tokenData?.type || "url_foto_bersama"

      // Strip 'url_' prefix from type to get form field name
      // e.g., 'url_foto_bersama' -> 'foto_bersama'
      // e.g., 'url_ttd_asesi_pra' -> 'ttd_asesi_pra'
      const fieldName = type.replace('url_', '')
      formData.append(fieldName, imageFile)

      // All uploads go to /bukti/{jadwalId}/kegiatan
      const endpoint = `${API_BASE_URL}/bukti/${tokenData.jadwalId}/kegiatan`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${tokenData.authToken}`,
        },
        body: formData,
      })

      if (response.ok) {
        setIsSuccess(true)
      } else {
        const result = await response.json().catch(() => ({ message: "Upload gagal" }))

        setError(result.message || "Gagal mengupload foto")
      }
    } catch (e) {
      console.error('Upload error:', e)
      setError("Terjadi kesalahan. Periksa koneksi internet Anda.")
    } finally {
      setIsUploading(false)
    }
  }

  const getTypeLabel = () => {
    const type = tokenData?.type || "asesi"
    switch (type) {
      case "asesi":
        return "Daftar Hadir Asesi"
      case "asesor":
        return "Daftar Hadir Asesor"
      case "foto_bersama":
        return "Foto Bersama"
      case "daftar_hadir_asesi":
        return "Daftar Hadir Asesi"
      case "daftar_hadir_asesor":
        return "Daftar Hadir Asesor"
      default:
        return "Absensi"
    }
  }

  const getTypeIcon = () => {
    const type = tokenData?.type || "asesi"
    switch (type) {
      case "foto_bersama":
        return faImage
      default:
        return faUserCheck
    }
  }

  // Loading State
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${PRIMARY_DARK} 100%)`,
      }}>
        <div style={{
          padding: '24px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}>
          <SimpleSpinner size="lg" className="text-white" />
        </div>
      </div>
    )
  }

  // Error State
  if (!tokenData?.valid) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${PRIMARY_DARK} 100%)`,
      }}>
        <div style={{
          padding: '40px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          textAlign: 'center',
          maxWidth: '400px',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: '36px', color: '#fca5a5' }} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'white', marginBottom: '12px' }}>Oops!</h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>{error}</p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
            Silakan kembali ke laptop dan scan ulang QR Code
          </p>
        </div>
      </div>
    )
  }

  // Success State
  if (isSuccess) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${PRIMARY_DARK} 100%)`,
      }}>
        <div style={{
          padding: '40px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          textAlign: 'center',
          maxWidth: '400px',
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.3) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            border: '2px solid rgba(16, 185, 129, 0.3)',
          }}>
            <FontAwesomeIcon icon={faCheck} style={{ fontSize: '44px', color: '#6ee7b7' }} />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'white', marginBottom: '12px' }}>Berhasil!</h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>
            Foto {getTypeLabel()} berhasil diupload
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
            Silakan kembali ke laptop untuk melanjutkan
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${PRIMARY_DARK} 100%)`,
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Decorative Elements */}
      <div style={{
        position: 'fixed',
        top: '-100px',
        right: '-100px',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.03)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed',
        bottom: '-150px',
        left: '-150px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.02)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          marginBottom: '16px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}>
          <FontAwesomeIcon icon={getTypeIcon()} style={{ fontSize: '24px', color: 'white' }} />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
          {getTypeLabel()}
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
          Ambil foto untuk kehadiran
        </p>
      </div>

      {/* Main Card with Glass Effect */}
      <div style={{
        flex: 1,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {capturedImage ? (
          <>
            {/* Preview */}
            <div style={{
              flex: 1,
              borderRadius: '16px',
              overflow: 'hidden',
              marginBottom: '20px',
              background: 'rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img
                src={capturedImage}
                alt="Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleRetake}
                disabled={isUploading}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '14px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                <FontAwesomeIcon icon={faRedo} />
                Ulang
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                style={{
                  flex: 2,
                  padding: '16px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s',
                }}
              >
                {isUploading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Mengupload...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} />
                    Kirim Foto
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Camera Capture Area */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              padding: '40px 20px',
              marginBottom: '20px',
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}>
                <FontAwesomeIcon icon={faCamera} style={{ fontSize: '32px', color: 'rgba(255, 255, 255, 0.7)' }} />
              </div>
              <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '24px', textAlign: 'center' }}>
                Tekan tombol di bawah untuk membuka kamera
              </p>

              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '18px 36px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
                color: 'white',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s',
              }}>
                <FontAwesomeIcon icon={faCamera} style={{ fontSize: '18px' }} />
                Buka Kamera
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  style={{ display: 'none' }}
                  onChange={handleCapture}
                />
              </label>
            </div>

            {/* Gallery Option */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '16px',
              }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.15)' }} />
                <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>atau pilih dari galeri</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.15)' }} />
              </div>
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px 28px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.2s',
              }}>
                <FontAwesomeIcon icon={faImage} />
                Pilih dari Galeri
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleCapture}
                />
              </label>
            </div>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            marginTop: '20px',
            padding: '14px 18px',
            background: 'rgba(239, 68, 68, 0.15)',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#fca5a5',
            fontSize: '14px',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <p style={{
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: '12px',
        marginTop: '20px',
      }}>
        Pastikan wajah terlihat jelas dalam foto
      </p>
    </div>
  )
}
