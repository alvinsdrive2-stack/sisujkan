import { useState, useRef, useCallback } from "react"
import favicon from "@/assets/favicon.png"

interface DriveUploaderProps {
  googleClientId: string | undefined
  folderName: string
  parentFolderId: string | undefined
  namaAsesi: string
  onUploadSuccess: (webViewLink: string) => void
  onClose: () => void
}

type UploadState = "idle" | "uploading" | "success" | "error"

interface UploadFileInfo {
  name: string
  size: number
  type: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function getUploadStatusText(progress: number, phase: string): string {
  if (phase === "auth") return "Mengotentikasi ke Google..."
  if (progress < 100) return `Mengupload... ${progress}%`
  if (phase === "saving") return "Menyimpan tautan..."
  if (phase === "success") return "Upload berhasil!"
  if (phase === "error") return "Upload gagal"
  return "Memproses..."
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  modal: {
    background: '#fff',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    animation: 'driveModalIn 0.25s ease-out',
  } as React.CSSProperties,
  dropzone: {
    border: '2px dashed #d1d5db',
    borderRadius: '12px',
    padding: '40px 24px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: '#fafafa',
  } as React.CSSProperties,
  dropzoneActive: {
    borderColor: '#4285F4',
    backgroundColor: '#f0f7ff',
  } as React.CSSProperties,
  progressBarBg: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '16px',
  },
  progressBarFill: (pct: number) => ({
    width: `${pct}%`,
    height: '100%',
    background: 'linear-gradient(90deg, #4285F4, #34A853)',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  }),
  driveIcon: {
    width: '48px',
    height: '48px',
    marginBottom: '16px',
  },
}

export default function GoogleDriveUploader({
  googleClientId,
  folderName,
  parentFolderId,
  namaAsesi,
  onUploadSuccess,
  onClose,
}: DriveUploaderProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [selectedFile, setSelectedFile] = useState<UploadFileInfo | null>(null)
  const [selectedFileBlob, setSelectedFileBlob] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)
  const [resultLink, setResultLink] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { createGoogleDriveFile } = useDriveClient()

  const handleFileSelect = useCallback((file: File) => {
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      setErrorMsg(`File terlalu besar (${formatFileSize(file.size)}). Maksimal 500MB.`)
      setUploadState("error")
      return
    }

    if (!file.type.startsWith("video/")) {
      setErrorMsg("Hanya file video yang didukung (.mp4, .avi, .mkv, .mov, .webm)")
      setUploadState("error")
      return
    }

    setSelectedFile({ name: file.name, size: file.size, type: file.type })
    setSelectedFileBlob(file)
    setErrorMsg("")
    setUploadState("idle")
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const startUpload = useCallback(async () => {
    if (!selectedFileBlob || !googleClientId) return

    setUploadState("uploading")
    setProgress(0)
    setPhase("auth")
    setErrorMsg("")

    try {
      const result = await createGoogleDriveFile(
        googleClientId,
        folderName,
        selectedFileBlob,
        parentFolderId,
        (pct) => {
          setProgress(pct)
          if (pct > 0) setPhase("upload")
        }
      )

      setProgress(100)
      setPhase("saving")

      // Callback to parent to save the link
      onUploadSuccess(result.webViewLink)
      setResultLink(result.webViewLink)

      setPhase("success")
      setUploadState("success")
    } catch (err: any) {
      console.error("Drive upload error:", err)
      const msg =
        err.message?.includes("user_cancelled")
          ? "Upload dibatalkan."
          : err.message || "Gagal upload ke Google Drive."
      setErrorMsg(msg)
      setPhase("error")
      setUploadState("error")
    }
  }, [selectedFileBlob, googleClientId, folderName, parentFolderId, onUploadSuccess, createGoogleDriveFile])

  const resetUpload = useCallback(() => {
    setUploadState("idle")
    setSelectedFile(null)
    setSelectedFileBlob(null)
    setProgress(0)
    setPhase("")
    setErrorMsg("")
    setResultLink("")
  }, [])

  const handleTryAgain = useCallback(() => {
    resetUpload()
  }, [resetUpload])

  return (
    <div style={styles.overlay} onClick={(e) => {
      if (e.target === e.currentTarget && uploadState !== "uploading") onClose()
    }}>
      <style>{`
        @keyframes driveModalIn {
          from { opacity: 0; transform: translateY(-20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes drivePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes driveCheckIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes driveShimmer {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
      `}</style>

      <div style={styles.modal}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>
              Upload Video AJJ
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
              Unggah video asesmen <strong style={{ color: '#111827' }}>{namaAsesi}</strong> ke Google Drive
            </p>
          </div>
          {uploadState !== "uploading" && (
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px', borderRadius: '6px', color: '#9ca3af',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#374151'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* === IDLE STATE === */}
        {uploadState === "idle" && !selectedFile && (
          <div
            style={{ ...styles.dropzone, ...(isDragOver ? styles.dropzoneActive : {}) }}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <img src={favicon} alt="SISUJ" style={{ width: '48px', height: '48px', marginBottom: '16px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#374151', margin: '0 0 4px' }}>
              Klik untuk pilih video
            </p>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
              atau seret file ke sini
            </p>
            <p style={{ fontSize: '11px', color: '#d1d5db', marginTop: '12px' }}>
              MP4, AVI, MKV, MOV, WEBM — Maks 500MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,.mp4,.avi,.mkv,.mov,.webm"
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* === FILE SELECTED STATE === */}
        {uploadState === "idle" && selectedFile && (
          <div style={{
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* File icon */}
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: '#f0f7ff', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedFile.name}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                onClick={resetUpload}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px', borderRadius: '6px', color: '#9ca3af',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <button
              onClick={startUpload}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                width: '100%', padding: '14px', marginTop: '16px',
                background: '#4285F4', color: '#fff', fontSize: '15px', fontWeight: '600',
                border: 'none', borderRadius: '10px', cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 1px 3px rgba(66,133,244,0.3)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#3367D6'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(66,133,244,0.4)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#4285F4'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(66,133,244,0.3)' }}
            >
              <img src={favicon} alt="" style={{ width: '18px', height: '18px' }} />
              Upload ke Google Drive
            </button>
          </div>
        )}

        {/* === UPLOADING STATE === */}
        {uploadState === "uploading" && (
          <div style={{
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px 20px',
            textAlign: 'center',
          }}>
            {/* Animated Drive icon */}
            <div style={{ animation: 'drivePulse 1.5s ease-in-out infinite', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <img src={favicon} alt="" style={{ width: '40px', height: '40px' }} />
            </div>

            {selectedFile && (
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                {selectedFile.name}
              </p>
            )}
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#6b7280' }}>
              {getUploadStatusText(progress, phase)}
            </p>
            <p style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: '700', color: '#4285F4' }}>
              {progress}%
            </p>

            {/* Progress bar */}
            <div style={styles.progressBarBg}>
              <div style={styles.progressBarFill(progress)} />
            </div>

            {/* Shimmer effect on progress */}
            <div style={{
              width: `${progress}%`,
              height: '8px',
              marginTop: '-8px',
              borderRadius: '4px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              backgroundSize: '200px 100%',
              animation: progress < 100 ? 'driveShimmer 1.5s ease-in-out infinite' : 'none',
              position: 'relative',
            }} />

            {/* File size info */}
            {selectedFile && (
              <p style={{ marginTop: '12px', fontSize: '11px', color: '#9ca3af' }}>
                {formatFileSize(selectedFile.size)} — Jangan tutup halaman ini
              </p>
            )}
          </div>
        )}

        {/* === SUCCESS STATE === */}
        {uploadState === "success" && (
          <div style={{
            textAlign: 'center',
            padding: '16px 0',
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#ecfdf5', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px',
              animation: 'driveCheckIn 0.4s ease-out',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: '#111827' }}>
              Upload Berhasil!
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280' }}>
              Video AJJ berhasil diupload ke Google Drive
            </p>

            {resultLink && (
              <a
                href={resultLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '10px 16px', background: '#f0f7ff',
                  border: '1px solid #93c5fd', borderRadius: '8px',
                  fontSize: '13px', color: '#1d4ed8', textDecoration: 'none',
                  marginBottom: '20px', wordBreak: 'break-all',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Buka di Google Drive
              </a>
            )}

            <button
              onClick={onClose}
              style={{
                display: 'block', width: '100%', padding: '12px',
                background: '#111827', color: '#fff', fontSize: '14px', fontWeight: '600',
                border: 'none', borderRadius: '10px', cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#374151'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#111827'}
            >
              Selesai
            </button>
          </div>
        )}

        {/* === ERROR STATE === */}
        {uploadState === "error" && (
          <div style={{
            border: '2px solid #fecaca',
            borderRadius: '12px',
            padding: '24px 20px',
            textAlign: 'center',
            backgroundColor: '#fef2f2',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: '#fee2e2', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 12px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700', color: '#991b1b' }}>
              Upload Gagal
            </p>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#b91c1c' }}>
              {errorMsg}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '12px',
                  background: '#fff', color: '#374151', fontSize: '14px', fontWeight: '600',
                  border: '1px solid #d1d5db', borderRadius: '10px', cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                onClick={handleTryAgain}
                style={{
                  flex: 1, padding: '12px',
                  background: '#4285F4', color: '#fff', fontSize: '14px', fontWeight: '600',
                  border: 'none', borderRadius: '10px', cursor: 'pointer',
                }}
              >
                Coba Lagi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Hook to lazy-import createGoogleDriveFile and avoid circular deps.
 * Same signature as the lib function.
 */
function useDriveClient() {
  const createGoogleDriveFile = useCallback(async (
    clientId: string,
    folderName: string,
    file: File,
    parentFolderId?: string,
    onProgress?: (pct: number) => void
  ) => {
    const mod = await import("@/lib/google-drive")
    return mod.createGoogleDriveFile(clientId, folderName, file, parentFolderId, onProgress)
  }, [])

  return { createGoogleDriveFile }
}
