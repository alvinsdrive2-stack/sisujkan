import { useState, useRef, useCallback, useEffect } from "react"
import { X, Camera, RefreshCw, Check } from "lucide-react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFolderOpen } from "@fortawesome/free-solid-svg-icons"
import { SimpleSpinner } from "@/components/ui/loading-spinner"
import { toast } from "@/components/ui/toast"

interface WebcamModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (imageBlob: Blob) => Promise<void>
  title?: string
  description?: string
  canClose?: boolean // If false, user must take photo before closing
}

export function WebcamModal({
  isOpen,
  onClose,
  onSubmit,
  title = "Ambil Foto",
  description = "Posisikan wajah Anda di tengah frame",
  canClose = true
}: WebcamModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const isStartingRef = useRef(false)

  const [isLoading, setIsLoading] = useState(true)
  const [hasCamera, setHasCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [facingMode, _setFacingMode] = useState<"user" | "environment">("user")
  const [error, setError] = useState<string | null>(null)

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.load() // Reset video element
    }
  }, [])

  // Start camera
  const startCamera = useCallback(async () => {
    // Prevent double calls
    if (isStartingRef.current) return
    isStartingRef.current = true

    setIsLoading(true)
    setError(null)
    setCapturedImage(null)
    setHasCamera(false)

    // Stop any existing stream first
    stopCamera()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      })

      streamRef.current = stream

      const video = videoRef.current
      if (!video) {
        throw new Error("Video element not ready")
      }

      // Set srcObject and wait for it to load
      video.srcObject = stream

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Video load timeout"))
        }, 10000)

        video.onloadeddata = () => {
          clearTimeout(timeout)
          resolve()
        }

        video.onerror = () => {
          clearTimeout(timeout)
          reject(new Error("Video load error"))
        }
      })

      // Play the video
      await video.play()

      setHasCamera(true)
      setIsLoading(false)
      isStartingRef.current = false
    } catch (err) {
      console.error("Camera error:", err)
      stopCamera()
      setIsLoading(false)
      isStartingRef.current = false

      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setError("Izin kamera ditolak. Silakan izinkan akses kamera di browser.")
        } else if (err.name === "NotFoundError") {
          setError("Kamera tidak ditemukan.")
        } else if (err.message === "Video load timeout") {
          setError("Kamera tidak merespons. Coba tutup aplikasi lain yang menggunakan kamera.")
        } else {
          setError("Gagal mengakses kamera: " + err.message)
        }
      } else {
        setError("Gagal mengakses kamera.")
      }
    }
  }, [facingMode, stopCamera])

  // Start/stop camera when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure modal is rendered
      const timer = setTimeout(() => {
        startCamera()
      }, 100)
      return () => clearTimeout(timer)
    } else {
      stopCamera()
      setCapturedImage(null)
      setError(null)
      setHasCamera(false)
      setIsLoading(true)
    }
  }, [isOpen, facingMode]) // Include facingMode to restart when switching

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !hasCamera) return

    const video = videoRef.current
    const canvas = canvasRef.current

    // Use actual video dimensions
    const width = video.videoWidth || 640
    const height = video.videoHeight || 480

    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Mirror if front camera
    if (facingMode === "user") {
      ctx.translate(width, 0)
      ctx.scale(-1, 1)
    }

    ctx.drawImage(video, 0, 0, width, height)

    // Get image
    const imageUrl = canvas.toDataURL("image/jpeg", 0.8)
    setCapturedImage(imageUrl)

    // Stop camera after capture
    stopCamera()
    setHasCamera(false)
  }, [hasCamera, facingMode, stopCamera])

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
    setError(null)
    startCamera()
  }, [startCamera])

  // Submit photo
  const handleSubmit = async () => {
    if (!capturedImage) return

    setIsSubmitting(true)

    try {
      // Convert data URL to Blob
      const response = await fetch(capturedImage)
      const blob = await response.blob()

      await onSubmit(blob)

      onClose()
    } catch (err) {
      console.error("Error submitting photo:", err)
      toast(err instanceof Error ? err.message : "Gagal menyimpan foto", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Retry camera
  const retryCamera = useCallback(() => {
    setError(null)
    startCamera()
  }, [startCamera])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.85)",
        padding: "16px"
      }}
      onClick={(canClose || capturedImage) ? onClose : undefined}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px",
          borderBottom: "1px solid #e5e7eb"
        }}>
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: 0 }}>
            {title}
          </h3>
          {(canClose || capturedImage) && (
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "8px",
                color: "#6b7280"
              }}
            >
              <X style={{ width: "20px", height: "20px" }} />
            </button>
          )}
        </div>

        {/* Description */}
        <div style={{ padding: "12px 16px", background: "#f9fafb" }}>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>{description}</p>
        </div>

        {/* Camera / Preview Area */}
        <div style={{
          position: "relative",
          width: "100%",
          maxWidth: "600px",
          margin: "0 auto",
          aspectRatio: "4/3",
          background: "#000",
          overflow: "hidden"
        }}>
          {/* Loading State */}
          {isLoading && !capturedImage && (
            <div style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <SimpleSpinner size="lg" />
            </div>
          )}

          {/* Error State */}
          {error && !capturedImage && (
            <div style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              padding: "20px",
              textAlign: "center"
            }}>
              <Camera style={{ width: "48px", height: "48px", marginBottom: "16px", opacity: 0.5 }} />
              <p style={{ fontSize: "14px", marginBottom: "16px", lineHeight: 1.5 }}>
                {error}
              </p>
              <button
                onClick={retryCamera}
                style={{
                  padding: "10px 24px",
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Captured Image Preview */}
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />
          )}

          {/* Video Element */}
          {!capturedImage && !error && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: facingMode === "user" ? "scaleX(-1)" : "none",
                opacity: hasCamera ? 1 : 0,
                transition: "opacity 0.3s"
              }}
            />
          )}

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {/* Face guide overlay */}
          {hasCamera && !capturedImage && (
            <div style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none"
            }}>
              <div style={{
                width: "200px",
                height: "250px",
                border: "3px dashed rgba(255, 255, 255, 0.5)",
                borderRadius: "50%",
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.3)"
              }} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "20px",
          background: "#fff"
        }}>
          {capturedImage ? (
            <>
              <button
                onClick={retakePhoto}
                disabled={isSubmitting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.5 : 1
                }}
              >
                <RefreshCw style={{ width: "18px", height: "18px" }} />
                Ulangi
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? (
                  <>
                    <SimpleSpinner size="sm" className="text-white" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check style={{ width: "18px", height: "18px" }} />
                    Gunakan Foto
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={retryCamera}
                title="Refresh kamera"
                disabled={isLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "48px",
                  height: "48px",
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "50%",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.5 : 1
                }}
              >
                <RefreshCw style={{ width: "20px", height: "20px" }} />
              </button>
              <button
                onClick={capturePhoto}
                disabled={!hasCamera || isLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "72px",
                  height: "72px",
                  background: hasCamera ? "#10b981" : "#9ca3af",
                  color: "#fff",
                  border: "4px solid #fff",
                  borderRadius: "50%",
                  cursor: !hasCamera || isLoading ? "not-allowed" : "pointer",
                  opacity: !hasCamera || isLoading ? 0.5 : 1
                }}
              >
                <Camera style={{ width: "28px", height: "28px" }} />
              </button>
              <label
                title="Upload foto"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "48px",
                  height: "48px",
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "50%",
                  cursor: "pointer",
                }}
              >
                <FontAwesomeIcon icon={faFolderOpen} style={{ fontSize: "20px" }} />
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (ev) => {
                        setCapturedImage(ev.target?.result as string)
                        stopCamera()
                        setHasCamera(false)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
              </label>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
