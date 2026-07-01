import { useState, useEffect, useRef } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronLeft, faChevronRight, faEye, faClose, faCamera, faUsers, faClock, faQrcode, faUpload, faFilePdf, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons"
import { SimpleSpinner } from "@/components/ui/loading-spinner"
import QRCode from "qrcode"
import { useAbsenData, AbsenData } from "@/hooks/useAbsenData"
import { toast } from "@/components/ui/toast"

import { API_BASE_URL } from "@/config/api"

interface DaftarHadirModalProps {
  isOpen: boolean
  mode: 'qr' | 'detail'
  personType: 'asesi' | 'asesor'
  personId: string
  personName: string
  jadwalId: string
  onClose: () => void
}

interface AbsenNode {
  id: string
  label: string
  status: 'pending' | 'done'
  url?: string | null
  canUpload: boolean // Only foto_kegiatan and foto_bersama can be uploaded
}

export function DaftarHadirModal({
  isOpen,
  mode,
  personType,
  personId,
  personName,
  jadwalId,
  onClose
}: DaftarHadirModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [isMobile, setIsMobile] = useState(false)
  const [selectedNode, setSelectedNode] = useState<AbsenNode | null>(null)
  const [uploadingNode, setUploadingNode] = useState<string | null>(null)
  const documentListRef = useRef<HTMLDivElement>(null)

  // Fetch absen data from API
  const { data: absenData, isLoading: absenLoading, refetch } = useAbsenData(personId, isOpen && mode === 'detail')

  // Absen nodes based on person type and real data
  const getAbsenNodes = (data: AbsenData | null): AbsenNode[] => {
    if (personType === 'asesi') {
      return [
        // Asesi - Pra Asesmen
        {
          id: 'url_absen_asesi_pra_awal',
          label: 'Absen Asesi Masuk Pra-Asesmen',
          status: data?.url_absen_asesi_pra_awal ? 'done' : 'pending',
          url: data?.url_absen_asesi_pra_awal,
          canUpload: false
        },
        {
          id: 'url_absen_asesi_pra_akhir',
          label: 'Absen Asesi Selesai Pra-Asesmen',
          status: data?.url_absen_asesi_pra_akhir ? 'done' : 'pending',
          url: data?.url_absen_asesi_pra_akhir,
          canUpload: false
        },
        // Asesi - Asesmen
        {
          id: 'url_absen_asesi_awal',
          label: 'Absen Asesi Masuk Asesmen',
          status: data?.url_absen_asesi_awal ? 'done' : 'pending',
          url: data?.url_absen_asesi_awal,
          canUpload: false
        },
        {
          id: 'url_absen_asesi_akhir',
          label: 'Absen Asesi Selesai Asesmen',
          status: data?.url_absen_asesi_akhir ? 'done' : 'pending',
          url: data?.url_absen_asesi_akhir,
          canUpload: false
        },
        // Asesor 1 - Pra Asesmen
        {
          id: 'url_absen_asesor1_pra_awal',
          label: 'Absen Asesor 1 Masuk Pra-Asesmen',
          status: data?.url_absen_asesor1_pra_awal ? 'done' : 'pending',
          url: data?.url_absen_asesor1_pra_awal,
          canUpload: false
        },
        {
          id: 'url_absen_asesor1_pra_akhir',
          label: 'Absen Asesor 1 Selesai Pra-Asesmen',
          status: data?.url_absen_asesor1_pra_akhir ? 'done' : 'pending',
          url: data?.url_absen_asesor1_pra_akhir,
          canUpload: false
        },
        // Asesor 1 - Asesmen
        {
          id: 'url_absen_asesor1_awal',
          label: 'Absen Asesor 1 Masuk Asesmen',
          status: data?.url_absen_asesor1_awal ? 'done' : 'pending',
          url: data?.url_absen_asesor1_awal,
          canUpload: false
        },
        {
          id: 'url_absen_asesor1_akhir',
          label: 'Absen Asesor 1 Selesai Asesmen',
          status: data?.url_absen_asesor1_akhir ? 'done' : 'pending',
          url: data?.url_absen_asesor1_akhir,
          canUpload: false
        },
        // Asesor 2 - Pra Asesmen
        {
          id: 'url_absen_asesor2_pra_awal',
          label: 'Absen Asesor 2 Masuk Pra-Asesmen',
          status: data?.url_absen_asesor2_pra_awal ? 'done' : 'pending',
          url: data?.url_absen_asesor2_pra_awal,
          canUpload: false
        },
        {
          id: 'url_absen_asesor2_pra_akhir',
          label: 'Absen Asesor 2 Selesai Pra-Asesmen',
          status: data?.url_absen_asesor2_pra_akhir ? 'done' : 'pending',
          url: data?.url_absen_asesor2_pra_akhir,
          canUpload: false
        },
        // Asesor 2 - Asesmen
        {
          id: 'url_absen_asesor2_awal',
          label: 'Absen Asesor 2 Masuk Asesmen',
          status: data?.url_absen_asesor2_awal ? 'done' : 'pending',
          url: data?.url_absen_asesor2_awal,
          canUpload: false
        },
        {
          id: 'url_absen_asesor2_akhir',
          label: 'Absen Asesor 2 Selesai Asesmen',
          status: data?.url_absen_asesor2_akhir ? 'done' : 'pending',
          url: data?.url_absen_asesor2_akhir,
          canUpload: false
        },
        // Foto
        {
          id: 'foto_kegiatan',
          label: 'Foto Kegiatan',
          status: data?.foto_kegiatan ? 'done' : 'pending',
          url: data?.foto_kegiatan,
          canUpload: true
        },
      ]
    } else {
      // Asesor nodes - same structure
      return [
        {
          id: 'url_absen_asesi_pra_awal',
          label: 'Absen Asesi Masuk Pra-Asesmen',
          status: data?.url_absen_asesi_pra_awal ? 'done' : 'pending',
          url: data?.url_absen_asesi_pra_awal,
          canUpload: false
        },
        {
          id: 'url_absen_asesi_pra_akhir',
          label: 'Absen Asesi Selesai Pra-Asesmen',
          status: data?.url_absen_asesi_pra_akhir ? 'done' : 'pending',
          url: data?.url_absen_asesi_pra_akhir,
          canUpload: false
        },
        {
          id: 'url_absen_asesi_awal',
          label: 'Absen Asesi Masuk Asesmen',
          status: data?.url_absen_asesi_awal ? 'done' : 'pending',
          url: data?.url_absen_asesi_awal,
          canUpload: false
        },
        {
          id: 'url_absen_asesi_akhir',
          label: 'Absen Asesi Selesai Asesmen',
          status: data?.url_absen_asesi_akhir ? 'done' : 'pending',
          url: data?.url_absen_asesi_akhir,
          canUpload: false
        },
        {
          id: 'url_absen_asesor1_pra_awal',
          label: 'Absen Asesor 1 Masuk Pra-Asesmen',
          status: data?.url_absen_asesor1_pra_awal ? 'done' : 'pending',
          url: data?.url_absen_asesor1_pra_awal,
          canUpload: false
        },
        {
          id: 'url_absen_asesor1_pra_akhir',
          label: 'Absen Asesor 1 Selesai Pra-Asesmen',
          status: data?.url_absen_asesor1_pra_akhir ? 'done' : 'pending',
          url: data?.url_absen_asesor1_pra_akhir,
          canUpload: false
        },
        {
          id: 'url_absen_asesor1_awal',
          label: 'Absen Asesor 1 Masuk Asesmen',
          status: data?.url_absen_asesor1_awal ? 'done' : 'pending',
          url: data?.url_absen_asesor1_awal,
          canUpload: false
        },
        {
          id: 'url_absen_asesor1_akhir',
          label: 'Absen Asesor 1 Selesai Asesmen',
          status: data?.url_absen_asesor1_akhir ? 'done' : 'pending',
          url: data?.url_absen_asesor1_akhir,
          canUpload: false
        },
        {
          id: 'url_absen_asesor2_pra_awal',
          label: 'Absen Asesor 2 Masuk Pra-Asesmen',
          status: data?.url_absen_asesor2_pra_awal ? 'done' : 'pending',
          url: data?.url_absen_asesor2_pra_awal,
          canUpload: false
        },
        {
          id: 'url_absen_asesor2_pra_akhir',
          label: 'Absen Asesor 2 Selesai Pra-Asesmen',
          status: data?.url_absen_asesor2_pra_akhir ? 'done' : 'pending',
          url: data?.url_absen_asesor2_pra_akhir,
          canUpload: false
        },
        {
          id: 'url_absen_asesor2_awal',
          label: 'Absen Asesor 2 Masuk Asesmen',
          status: data?.url_absen_asesor2_awal ? 'done' : 'pending',
          url: data?.url_absen_asesor2_awal,
          canUpload: false
        },
        {
          id: 'url_absen_asesor2_akhir',
          label: 'Absen Asesor 2 Selesai Asesmen',
          status: data?.url_absen_asesor2_akhir ? 'done' : 'pending',
          url: data?.url_absen_asesor2_akhir,
          canUpload: false
        },
        {
          id: 'foto_kegiatan',
          label: 'Foto Kegiatan',
          status: data?.foto_kegiatan ? 'done' : 'pending',
          url: data?.foto_kegiatan,
          canUpload: true
        },
      ]
    }
  }

  const absenNodes = getAbsenNodes(absenData)

  // Get only nodes that are clickable (have URL or can upload)
  const clickableNodes = absenNodes.filter(node => (node.url && node.url !== null) || node.canUpload)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Generate QR Code
  useEffect(() => {
    // Generate QR for 'qr' mode OR when in detail mode viewing an uploadable node without photo
    const shouldGenerateQR = isOpen && (
      (mode === 'qr' && jadwalId) ||
      (mode === 'detail' && selectedNode?.canUpload && !selectedNode.url && personId)
    )

    if (shouldGenerateQR) {
      const token = generateTempToken()
      const authToken = localStorage.getItem("access_token") || ""
      // In detail mode, use personId (idIzin), in qr mode use jadwalId
      const idForQR = mode === 'detail' ? personId : jadwalId
      const url = `https://sisuj.vercel.app/attendance?token=${token}&type=${personType}&auth=${encodeURIComponent(authToken)}&id=${idForQR}`

      QRCode.toDataURL(url, {
        width: 220,
        margin: 2,
        color: { dark: '#000', light: '#fff' }
      }).then(setQrDataUrl).catch(console.error)
    } else if (!isOpen) {
      // Reset QR when modal closes
      setQrDataUrl("")
    }
  }, [isOpen, mode, personType, jadwalId, selectedNode, personId])

  // Generate temporary token (30 min expiry)
  const generateTempToken = () => {
    const timestamp = Date.now()
    const expiry = timestamp + (30 * 60 * 1000) // 30 minutes
    const random = Math.random().toString(36).substring(2, 15)
    return btoa(`${expiry}.${random}.${jadwalId}`)
  }

  // Auto-select first node that has a URL (prioritize over uploadable nodes without URL)
  useEffect(() => {
    // Wait for data to be loaded (absenData should not be null)
    if (isOpen && !absenLoading && absenData && !selectedNode && clickableNodes.length > 0) {
      // First try to find a node that has a URL
      const nodeWithUrl = clickableNodes.find(node => node.url)
      // If found, select it; otherwise select the first clickable node
      setSelectedNode(nodeWithUrl || clickableNodes[0])
    }
  }, [isOpen, absenLoading, absenData, clickableNodes])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedNode(null)
    }
  }, [isOpen])

  // Auto-scroll to selected node
  useEffect(() => {
    if (selectedNode && documentListRef.current) {
      const selectedElement = documentListRef.current.querySelector(`[data-node-id="${selectedNode.id}"]`)
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [selectedNode])

  const goToPrevNode = () => {
    if (!selectedNode) return
    const currentIndex = clickableNodes.findIndex(n => n.id === selectedNode.id)
    if (currentIndex > 0) {
      setSelectedNode(clickableNodes[currentIndex - 1])
    }
  }

  const goToNextNode = () => {
    if (!selectedNode) {
      // Select first node if none selected
      const firstNode = clickableNodes[0]
      if (firstNode) setSelectedNode(firstNode)
      return
    }
    const currentIndex = clickableNodes.findIndex(n => n.id === selectedNode.id)
    if (currentIndex < clickableNodes.length - 1) {
      setSelectedNode(clickableNodes[currentIndex + 1])
    }
  }

  const handleFileUpload = async (nodeId: string, file: File) => {
    if (!personId) return

    setUploadingNode(nodeId)

    try {
      const token = localStorage.getItem("access_token")
      const formData = new FormData()
      formData.append('id_izin', personId)
      formData.append('type', nodeId) // foto_kegiatan or foto_bersama
      formData.append('file', file)

      const response = await fetch(`${API_BASE_URL}/dokumen/absen/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to upload file" }))
        throw new Error(error.message || "Failed to upload file")
      }

      toast("Foto berhasil diupload!", "success")
      refetch() // Refresh data
    } catch (error) {
      console.error('Error uploading file:', error)
      toast(error instanceof Error ? error.message : "Gagal mengupload foto", "error")
    } finally {
      setUploadingNode(null)
    }
  }

  if (!isOpen) return null

  // QR Mode styling - matching KegiatanModal
  const qrContent = (
    <div style={{ textAlign: 'center', padding: '24px' }}>
      <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
        {isMobile
          ? 'Gunakan kamera untuk mengambil foto kehadiran'
          : 'Scan QR Code dengan HP untuk mengambil foto'
        }
      </p>

      {isMobile ? (
        // Mobile - Camera option
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '20px 32px',
              background: 'linear-gradient(135deg, #1e3a5f 0%, #0d2137 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <FontAwesomeIcon icon={faCamera} style={{ fontSize: '20px' }} />
            Buka Kamera
            <input type="file" accept="image/*,.pdf" capture="environment" style={{ display: 'none' }} />
          </label>

          <div style={{ color: '#9ca3af', fontSize: '13px' }}>atau</div>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '16px 24px',
            background: '#f3f4f6',
            color: '#374151',
            border: '2px dashed #d1d5db',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
          }}>
            <FontAwesomeIcon icon={faCamera} />
            Upload dari Galeri
            <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} />
          </label>
        </div>
      ) : (
        // Desktop - QR Code + Upload
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          {qrDataUrl ? (
            <div style={{
              padding: '16px',
              background: '#fff',
              border: '2px solid #e5e7eb',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            }}>
              <img
                src={qrDataUrl}
                alt="QR Code"
                style={{ width: '220px', height: '220px' }}
              />
            </div>
          ) : (
            <SimpleSpinner size="lg" />
          )}

          <div style={{
            padding: '12px 20px',
            background: '#fef3c7',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <FontAwesomeIcon icon={faClock} style={{ color: '#d97706', fontSize: '14px' }} />
            <span style={{ fontSize: '13px', color: '#92400e' }}>
              QR berlaku 30 menit
            </span>
          </div>

          <div style={{ color: '#9ca3af', fontSize: '13px' }}>atau</div>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '14px 24px',
            background: '#f3f4f6',
            color: '#374151',
            border: '2px dashed #d1d5db',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
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
            <FontAwesomeIcon icon={faCamera} />
            Upload dari Komputer
            <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} />
          </label>
        </div>
      )}
    </div>
  )

  // Detail mode with same layout as DokumenModal
  const detailContent = absenLoading ? (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', width: '100%' }}>
      <SimpleSpinner size="lg" />
    </div>
  ) : (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', width: '100%' }}>
      {/* Left - Timeline Nodes */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '16px', textTransform: 'uppercase', marginLeft: '60px' }}>
          Absen {personType === 'asesi' ? 'Asesi' : 'Asesor'}
        </h4>
        <div
          ref={documentListRef}
          style={{
            position: 'relative',
            marginLeft: '80px',
            overflowY: 'hidden',
            overflowX: 'hidden',
            maxHeight: 'calc(90vh - 180px)',
            paddingRight: '10px',
            paddingBottom: '20px'
          }}>
          {/* Vertical Line */}
          <div style={{
            position: 'absolute',
            left: '14px',
            top: '12px',
            bottom: '32px',
            width: '3px',
            background: '#ddd',
            transform: 'translateX(10px)',
          }}></div>

          {/* Nodes */}
          {absenNodes.map((node, index) => {
            const hasDocument = !!node.url
            const isSelected = selectedNode?.id === node.id
            const isClickable = hasDocument || node.canUpload // Can click if has doc OR can upload

            return (
              <div
                key={node.id}
                data-node-id={node.id}
                onClick={() => isClickable ? setSelectedNode(node) : null}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: index < absenNodes.length - 1 ? '24px' : '0px',
                  position: 'relative',
                  cursor: isClickable ? 'pointer' : 'not-allowed',
                  transform: 'translateY(2px)',
                }}
              >
                {/* Node Circle */}
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: isSelected
                      ? '#10b981'
                      : hasDocument
                        ? '#4e4e4e'
                        : '#f5f5f5',
                    color: isSelected
                      ? '#fff'
                      : hasDocument
                        ? '#fff'
                        : '#aaa',
                    border: '3px solid',
                    borderColor: isSelected
                      ? '#10b981'
                      : hasDocument
                        ? '#4e4e4e'
                        : '#ddd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: hasDocument ? 'bold' : 'normal',
                    flexShrink: 0,
                    zIndex: 1,
                    transition: 'all 0.3s ease',
                     transform: isSelected && index === 0 ? 'scale(1.15) translateX(10px) translateY(2px)':isSelected && index === 12 ? 'scale(1.15) translateX(10px) translateY(-2px)' : isSelected ? 'scale(1.2) translateX(10px)' : 'scale(1) translateX(10px)'
                  }}>
                  {isSelected ? (
                    <FontAwesomeIcon icon={faEye} style={{ color: 'white', fontSize: '12px' }} />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Label */}
                <span style={{
                  marginLeft: '14px',
                  fontSize: '13px',
                  color: isSelected
                    ? '#10b981'
                    : hasDocument
                      ? '#4e4e4e'
                      : '#333',
                  fontWeight: isSelected ? 'bold' : hasDocument ? '600' : 'normal',
                  paddingTop: '6px',
                  flex: 1,
                  transition: 'all 0.3s ease',
                  transform: isSelected && index === 12 ? 'scale(1.2) translateX(20px) translateY(-5px)' : isSelected ? 'scale(1.1) translateX(20px) translateY(-9px)' : 'scale(1) translateX(10px) translateY(-9px)'
                }}>
                  {node.label}
                  {!hasDocument && (
                    <span style={{ fontSize: '11px', color: '#999', fontWeight: 'normal', marginLeft: '8px' }}>
                      (Belum ada)
                    </span>
                  )}
                </span>

                {/* Completed Line Segment */}
                {hasDocument && index < absenNodes.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    left: '24px',
                    top: '8px',
                    width: '3px',
                    height: 'calc(15vh - 36px)',
                    background: '#10b981',
                    zIndex: 0
                  }}></div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Right - Image Preview */}
      <div>
        <div style={{ borderRadius: '12px', height: '70vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {selectedNode ? (
            <>
              {/* Preview Area */}
              <div style={{
                flex: 1,
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
                margin: '0 16px 16px 16px',
                minHeight: '50vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                {selectedNode.url ? (
                  <>
                    {(() => {
                      const url = selectedNode.url
                      const isPdf = url?.toLowerCase().endsWith('.pdf')
                      const isImage = url && /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url)

                      if (isPdf) {
                        return (
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
                                href={url}
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
                              src={url}
                              style={{
                                width: '100%',
                                flex: 1,
                                border: 'none',
                              }}
                              title={selectedNode.label}
                            />
                          </div>
                        )
                      } else if (isImage) {
                        return (
                          <img
                            src={url}
                            alt={selectedNode.label}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain'
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        )
                      } else {
                        return (
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
                                href={url}
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
                      }
                    })()}
                    {/* Ganti Button - only when has photo */}
                    {selectedNode.canUpload && (
                      <label
                        style={{
                          position: 'absolute',
                          bottom: '16px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 20px',
                          background: '#fff',
                          color: '#059669',
                          border: '2px solid #10b981',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#ecfdf5'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                      >
                        {uploadingNode === selectedNode.id ? (
                          <>
                            <SimpleSpinner size="sm" className="text-emerald-600" />
                            <span>Mengupload...</span>
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faCamera} style={{ fontSize: '14px' }} />
                            <span>Ganti Foto</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleFileUpload(selectedNode.id, file)
                            }
                          }}
                        />
                      </label>
                    )}
                  </>
                ) : selectedNode.canUpload ? (
                  // Show QR + Upload options for uploadable nodes without photo
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', gap: '24px', flex: 1 }}>
                    <div style={{ textAlign: 'center' }}>
                      <FontAwesomeIcon icon={faCamera} style={{ fontSize: '48px', color: '#1e3a5f', marginBottom: '12px' }} />
                      <p style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                        Belum ada foto untuk {selectedNode.label}
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
                          {uploadingNode === selectedNode.id ? (
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
                          <input type="file" accept="image/*,.pdf" capture="environment" style={{ display: 'none' }}
                            disabled={!!uploadingNode}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload(selectedNode.id, file)
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
                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            disabled={!!uploadingNode}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload(selectedNode.id, file)
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
                          {uploadingNode === selectedNode.id ? (
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
                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            disabled={!!uploadingNode}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload(selectedNode.id, file)
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ) : (
                  // Non-uploadable node without photo
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                    <FontAwesomeIcon icon={faCamera} style={{ fontSize: '48px', marginBottom: '16px' }} />
                    <p style={{ fontSize: '14px', fontWeight: '500' }}>
                      Foto tidak tersedia
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              minHeight: '55vh'
            }}>
              <FontAwesomeIcon icon={faCamera} style={{ fontSize: '48px', marginBottom: '16px' }} />
              <p style={{ fontSize: '15px', fontWeight: '500' }}>
                Pilih foto untuk melihat preview
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

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
          maxWidth: mode === 'qr' ? '500px' : '1200px',
          width: '100%',
          maxHeight: '90vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'modalSlideIn 0.3s ease-out',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <style>{`
          @keyframes modalSlideIn {
            from { opacity: 0; transform: translateY(-20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* Modal Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FontAwesomeIcon
              icon={mode === 'qr' ? faQrcode : faUsers}
              style={{ fontSize: '22px', color: '#1e3a5f' }}
            />
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
                {mode === 'qr'
                  ? `Daftar Hadir ${personType === 'asesi' ? 'Asesi' : 'Asesor'}`
                  : `Detail Absen - ${personName}`
                }
              </h3>
              {mode === 'qr' && (
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                  Scan QR untuk absensi
                </p>
              )}
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

        {/* Modal Content */}
        <div style={{
          padding: '24px',
          flex: 1,
          display: 'flex',
          alignItems: mode === 'qr' ? 'center' : 'flex-start',
          justifyContent: mode === 'qr' ? 'center' : 'flex-start',
          overflow: 'auto',
        }}>
          {mode === 'qr' ? qrContent : detailContent}
        </div>

        {/* Navigation Buttons (only in detail mode) */}
        {mode === 'detail' && !absenLoading && (
          <div style={{
            position: 'absolute',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-8%)',
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
            <button
              onClick={goToPrevNode}
              disabled={clickableNodes.findIndex(n => n.id === selectedNode?.id) <= 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: clickableNodes.findIndex(n => n.id === selectedNode?.id) > 0 ? '#10b981' : '#e5e7eb',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '600',
                borderRadius: '20px',
                border: 'none',
                cursor: clickableNodes.findIndex(n => n.id === selectedNode?.id) > 0 ? 'pointer' : 'not-allowed',
                opacity: clickableNodes.findIndex(n => n.id === selectedNode?.id) > 0 ? 1 : 0.5,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (clickableNodes.findIndex(n => n.id === selectedNode?.id) > 0) {
                  e.currentTarget.style.background = '#059669'
                }
              }}
              onMouseLeave={(e) => {
                if (clickableNodes.findIndex(n => n.id === selectedNode?.id) > 0) {
                  e.currentTarget.style.background = '#10b981'
                }
              }}
            >
              <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: '12px' }} />
              Sebelumnya
            </button>
            <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', minWidth: '50px', textAlign: 'center' }}>
              {clickableNodes.findIndex(n => n.id === selectedNode?.id) + 1} / {clickableNodes.length}
            </span>
            <button
              onClick={goToNextNode}
              disabled={clickableNodes.findIndex(n => n.id === selectedNode?.id) >= clickableNodes.length - 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: clickableNodes.findIndex(n => n.id === selectedNode?.id) < clickableNodes.length - 1 ? '#10b981' : '#e5e7eb',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '600',
                borderRadius: '20px',
                border: 'none',
                cursor: clickableNodes.findIndex(n => n.id === selectedNode?.id) < clickableNodes.length - 1 ? 'pointer' : 'not-allowed',
                opacity: clickableNodes.findIndex(n => n.id === selectedNode?.id) < clickableNodes.length - 1 ? 1 : 0.5,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (clickableNodes.findIndex(n => n.id === selectedNode?.id) < clickableNodes.length - 1) {
                  e.currentTarget.style.background = '#059669'
                }
              }}
              onMouseLeave={(e) => {
                if (clickableNodes.findIndex(n => n.id === selectedNode?.id) < clickableNodes.length - 1) {
                  e.currentTarget.style.background = '#10b981'
                }
              }}
            >
              Berikutnya
              <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '12px' }} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
