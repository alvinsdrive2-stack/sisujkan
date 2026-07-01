import { useEffect, useState, useRef } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFile, faFileText, faChevronLeft, faChevronRight, faEye, faClose, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons"
import { SimpleSpinner } from "@/components/ui/loading-spinner"
import { StatusStamp } from "@/components/ui/StatusStamp"
import { RoleId } from "@/lib/rbac-config"
import { API_BASE_URL } from "@/config/api"

interface DokumenResponse {
  message: string
  data: {
    [key: string]: string | null
  }
}

interface DokumenItem {
  key: string
  label: string
  url: string | null
  docType: string
}

// Document groups for 3 sections
const PRA_ASESMEN_DOCS = ['apl01', 'apl02', 'mapa01', 'mapa02', 'ak07', 'ak04', 'k3']
const PERJANJIAN_DOCS = ['ak01']

const getAsesmenDocs = (jenjang: string, metode?: string): string[] => {
  const jenjangNum = parseInt(jenjang) || 0
  const isPortofolio = metode?.toLowerCase() === 'portofolio'
  const closing = ['ak02', 'ak03', 'ak05', 'ak06', 'foto_kegiatan']

  if (jenjangNum >= 4 && isPortofolio) {
    return ['ia08', 'ia09', 'ia10', ...closing]
  } else if (jenjangNum >= 4) {
    return ['ia04a', 'tugas', 'ia04b', 'ia05', ...closing]
  } else {
    return ['ia01', 'ia02', 'ia03', 'tugas', 'ia05', ...closing]
  }
}

interface DocSection {
  title: string
  docs: string[]
}

const getDocSections = (jenjang: string, metode?: string): DocSection[] => [
  { title: 'Pra Asesmen', docs: PRA_ASESMEN_DOCS },
  { title: 'Perjanjian Asesmen (AK01)', docs: PERJANJIAN_DOCS },
  { title: 'Asesmen', docs: getAsesmenDocs(jenjang, metode) },
]

interface RekomendasiData {
  komtek1?: { id: string; rekomendasi: string | null }
  komtek2?: { id: string; rekomendasi: string | null }
  komtek3?: { id: string; rekomendasi: string | null }
}

interface DokumenModalProps {
  isOpen: boolean
  onClose: () => void
  asesiId: string
  asesiNama: string
  jadwalId?: string
  onPenilaianSuccess?: () => void
  readOnly?: boolean
}

export function DokumenModal({ isOpen, onClose, asesiId, asesiNama, jadwalId, onPenilaianSuccess, readOnly = false }: DokumenModalProps) {
  const [dokumenResponse, setDokumenResponse] = useState<DokumenResponse | null>(null)
  const [jenjang, setJenjang] = useState<string>('0')
  const [metode, setMetode] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<DokumenItem | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rekomendasiValue, setRekomendasiValue] = useState<string | null>(null) // "K" or "BK" or null
  const [isPreviewHovered, setIsPreviewHovered] = useState(false)
  const [isPenetapanDone, setIsPenetapanDone] = useState(false)
  const [penetapanValue, setPenetapanValue] = useState<string | null>(null)

  // Check if current user is direktur with a jadwalId
  const isDirekturMode = (() => {
    try {
      const userData = JSON.parse(localStorage.getItem("user_data") || "{}")
      return userData?.role?.id === RoleId.DIREKTUR_LSP && !!jadwalId
    } catch { return false }
  })()
  const documentListRef = useRef<HTMLDivElement>(null)

  // Fetch dokumen dan rekomendasi status
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !asesiId) return

      setIsLoading(true)
      try {
        const token = localStorage.getItem("access_token")

        // Fetch jenjang from data-dokumen API
        const dataDokumenResponse = await fetch(`${API_BASE_URL}/asesmen/${asesiId}/data-dokumen`, {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        })
        if (dataDokumenResponse.ok) {
          const dataResult = await dataDokumenResponse.json()
          if (dataResult.data?.jenjang) {
            setJenjang(dataResult.data.jenjang)
          }
          if (dataResult.data?.metode) {
            setMetode(dataResult.data.metode)
          }
        }

        // Fetch dokumen
        const response = await fetch(`${API_BASE_URL}/dokumen/asesi/${asesiId}`, {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const result = await response.json()
          setDokumenResponse(result)
        }

        // Fetch rekomendasi status
        const userData = localStorage.getItem("user_data")
        const currentUser = userData ? JSON.parse(userData) : null
        const currentUserId = currentUser?.id?.toString()

        if (currentUserId) {
          const rekomendasiResponse = await fetch(`${API_BASE_URL}/komtek/rekomendasi/${asesiId}`, {
            headers: {
              "Accept": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          })

          if (rekomendasiResponse.ok) {
            const rekomendasiData: RekomendasiData = await rekomendasiResponse.json()
            const komtekKeys: (keyof RekomendasiData)[] = ['komtek1', 'komtek2', 'komtek3']
            for (const key of komtekKeys) {
              const komtek = rekomendasiData[key]
              if (komtek && komtek.id === currentUserId) {
                setIsCompleted(komtek.rekomendasi !== null)
                setRekomendasiValue(komtek.rekomendasi)
                break
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [isOpen, asesiId])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedDoc(null)
      setShowConfirmModal(false)
      setIsCompleted(false)
      setRekomendasiValue(null)
      setIsPreviewHovered(false)
      setJenjang('0')
      setMetode('')
      setIsPenetapanDone(false)
      setPenetapanValue(null)
    }
  }, [isOpen])

  // Build document list from data object grouped by sections
  const documentList: DokumenItem[] = (() => {
    if (!dokumenResponse?.data) return []

    const sections = getDocSections(jenjang, metode)
    const data = dokumenResponse.data

    const items: DokumenItem[] = []
    sections.forEach(section => {
      section.docs.forEach(docType => {
        if (docType in data) {
          items.push({
            key: `${asesiId}-${docType}`,
            label: docType.toUpperCase().replace(/_/g, ' '),
            url: data[docType] || null,
            docType: docType,
          })
        }
      })
    })
    return items
  })()

  // Get only documents that have URLs
  const documentsWithUrls = documentList.filter(doc => doc.url !== null)

  // Auto-select first document when modal opens
  useEffect(() => {
    if (isOpen && !selectedDoc && documentsWithUrls.length > 0) {
      setSelectedDoc(documentsWithUrls[0])
    }
  }, [isOpen, documentsWithUrls])

  // Auto-scroll to selected document
  useEffect(() => {
    if (selectedDoc && documentListRef.current) {
      const selectedElement = documentListRef.current.querySelector(`[data-doc-key="${selectedDoc.key}"]`)
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [selectedDoc])

  const goToPrevDoc = () => {
    if (!selectedDoc) return
    const currentIndex = documentsWithUrls.findIndex(d => d.key === selectedDoc.key)
    if (currentIndex > 0) {
      setSelectedDoc(documentsWithUrls[currentIndex - 1])
    }
  }

  const goToNextDoc = () => {
    if (!selectedDoc) {
      const firstDoc = documentsWithUrls[0]
      if (firstDoc) setSelectedDoc(firstDoc)
      return
    }
    const currentIndex = documentsWithUrls.findIndex(d => d.key === selectedDoc.key)
    if (currentIndex < documentsWithUrls.length - 1) {
      setSelectedDoc(documentsWithUrls[currentIndex + 1])
    }
  }

  const submitPenetapan = async (kompeten: boolean) => {
    if (!jadwalId) return
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/direktur/approve-sk-penetapan/${jadwalId}`, {
        method: 'POST',
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id_izin: asesiId, kompeten: kompeten ? 'K' : 'BK' }),
      })

      if (response.ok) {
        setIsPenetapanDone(true)
        setPenetapanValue(kompeten ? 'K' : 'BK')
        setShowConfirmModal(false)
        onPenilaianSuccess?.()
        onClose()
      } else {
        const error = await response.json()
        console.error('Error submitting penetapan:', error)
      }
    } catch (err) {
      console.error('Error submitting penetapan:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitRekomendasi = async (kompeten: boolean) => {
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/komtek/rekomendasi/${asesiId}`, {
        method: 'POST',
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ kompeten }),
      })

      if (response.ok) {
        setIsCompleted(true)
        setRekomendasiValue(kompeten ? 'K' : 'BK')
        setShowConfirmModal(false)
        onPenilaianSuccess?.()
        onClose()
      } else {
        const error = await response.json()
        console.error('Error submitting rekomendasi:', error)
      }
    } catch (err) {
      console.error('Error submitting rekomendasi:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getFileType = (url: string) => {
    if (!url) return 'unknown'
    const extension = url.split('.').pop()?.toLowerCase() || ''
    return extension
  }

  const getPdfUrl = (url: string) => {
    const fileType = getFileType(url)
    if (fileType === 'pdf') {
      return url + '#toolbar=0&navpanes=0&scrollbar=0'
    }
    return url
  }

  const currentIndex = documentsWithUrls.findIndex(d => d.key === selectedDoc?.key)
  const isLastDoc = currentIndex === documentsWithUrls.length - 1

  if (!isOpen) return null

  return (
    <>
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
            maxWidth: '1200px',
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
            padding: '10px 12px',
            borderBottom: '1px solid #e5e7eb',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '8px' }}>
              <FontAwesomeIcon icon={faFileText} style={{ fontSize: '20px', color: '#10b981' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
                Daftar Dokumen - {asesiNama}
              </h3>
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
              <FontAwesomeIcon icon={faClose} style={{ fontSize: '18px', color: '#6b7280' }} />
            </button>
          </div>

          {/* Modal Content */}
          <div style={{
            padding: '24px',
            flex: 1,
            display: 'flex',
          }}>
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', width: '100%' }}>
                <SimpleSpinner size="lg" />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', width: '100%' }}>
                {/* Left - Document List (Sectioned with Nodes) */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '16px', textTransform: 'uppercase' }}>
                    Daftar Dokumen
                  </h4>
                  <div
                    ref={documentListRef}
                    style={{
                      overflowY: 'auto',
                      maxHeight: 'calc(90vh - 180px)',
                      paddingRight: '10px',
                      paddingBottom: '20px',
                    }}
                  >
                    {(() => {
                      const sections = getDocSections(jenjang, metode)
                      const sectionColors = ['#3b82f6', '#f59e0b', '#10b981']
                      let globalIndex = 0
                      return sections.map((section, si) => {
                        const sectionDocs = documentList.filter(d => section.docs.includes(d.docType))
                        if (sectionDocs.length === 0) return null
                        const sectionColor = sectionColors[si] || sectionColors[0]
                        const startIdx = globalIndex
                        globalIndex += sectionDocs.length
                        return (
                          <div key={section.title} style={{ marginBottom: si < sections.length - 1 ? '20px' : '0' }}>
                            {/* Section Title */}
                            <div style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              color: sectionColor,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginBottom: '10px',
                              paddingBottom: '4px',
                              borderBottom: `2px solid ${sectionColor}20`,
                            }}>
                              {section.title}
                            </div>
                            {/* Section Docs with Timeline Nodes */}
                            <div style={{ position: 'relative' }}>
                              {/* Vertical Line */}
                              <div style={{
                                position: 'absolute',
                                left: '17px',
                                top: '12px',
                                bottom: '12px',
                                width: '3px',
                                background: '#ddd',
                                zIndex: 0,
                              }} />
                              {sectionDocs.map((doc, di) => {
                                const hasDocument = !!doc.url
                                const isSelected = selectedDoc?.key === doc.key
                                const isLastInSection = di === sectionDocs.length - 1
                                return (
                                  <div
                                    key={doc.key}
                                    data-doc-key={doc.key}
                                    onClick={() => hasDocument ? setSelectedDoc(doc) : null}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      marginBottom: isLastInSection ? '0' : '18px',
                                      position: 'relative',
                                      cursor: hasDocument ? 'pointer' : 'not-allowed',
                                    }}
                                  >
                                    {/* Node Circle */}
                                    <div style={{
                                      width: '34px',
                                      height: '34px',
                                      borderRadius: '50%',
                                      background: isSelected
                                        ? sectionColor
                                        : hasDocument
                                          ? '#0b815a'
                                          : '#f5f5f5',
                                      color: isSelected
                                        ? '#fff'
                                        : hasDocument
                                          ? '#fff'
                                          : '#aaa',
                                      border: '3px solid',
                                      borderColor: isSelected
                                        ? sectionColor
                                        : hasDocument
                                          ? '#0b815a'
                                          : '#ddd',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '13px',
                                      fontWeight: hasDocument ? 'bold' : 'normal',
                                      flexShrink: 0,
                                      zIndex: 1,
                                      transition: 'transform 0.2s ease',
                                      transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                                    }}>
                                      {isSelected ? (
                                        <FontAwesomeIcon icon={faEye} style={{ fontSize: '12px' }} />
                                      ) : (
                                        startIdx + di + 1
                                      )}
                                    </div>
                                    {/* Label */}
                                    <span style={{
                                      marginLeft: '12px',
                                      fontSize: '13px',
                                      color: isSelected
                                        ? sectionColor
                                        : hasDocument
                                          ? '#4e4e4e'
                                          : '#999',
                                      fontWeight: isSelected ? 'bold' : hasDocument ? '600' : 'normal',
                                      paddingTop: '7px',
                                    }}>
                                      {doc.label}
                                      {!hasDocument && (
                                        <span style={{ fontSize: '11px', color: '#bbb', fontWeight: 'normal', marginLeft: '6px' }}>
                                          (Belum ada)
                                        </span>
                                      )}
                                    </span>
                                    {/* Colored line segment for completed/has-doc nodes */}
                                    {hasDocument && !isLastInSection && (
                                      <div style={{
                                        position: 'absolute',
                                        left: '17px',
                                        top: '34px',
                                        width: '3px',
                                        height: '18px',
                                        background: sectionColor,
                                        zIndex: 0,
                                      }} />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>

                {/* Right - Document Preview */}
                <div>
                  <div style={{ borderRadius: '12px', height: '70vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    {selectedDoc ? (
                      <>
                        {/* Preview Area */}
                        <div
                          onMouseEnter={() => setIsPreviewHovered(true)}
                          onMouseLeave={() => setIsPreviewHovered(false)}
                          style={{
                            flex: 1,
                            background: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            margin: '0 16px 16px 16px',
                            minHeight: '50vh',
                            position: 'relative'
                          }}>
                          {['pdf', 'ppt', 'pptx'].includes(getFileType(selectedDoc.url || '')) ? (
                            <object
                              data={getPdfUrl(selectedDoc.url || '')}
                              type={getFileType(selectedDoc.url || '') === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation'}
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
                          ) : selectedDoc.url ? (
                            <img
                              src={selectedDoc.url}
                              alt={selectedDoc.label}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                              }}
                            />
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
                              <FontAwesomeIcon icon={faFile} style={{ fontSize: '48px', marginBottom: '16px' }} />
                              <p style={{ fontSize: '14px', fontWeight: '500' }}>
                                File tidak tersedia
                              </p>
                            </div>
                          )}

                          {/* Overlay Image - disappears on hover */}
                          {(rekomendasiValue || (isDirekturMode && penetapanValue)) && !isPreviewHovered && (
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              pointerEvents: 'none',
                              transition: 'opacity 0.3s ease',
                              background: 'rgba(255, 255, 255, 0.7)'
                            }}>
                              <StatusStamp kompeten={(rekomendasiValue || penetapanValue) === 'K'} />
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
                        <FontAwesomeIcon icon={faFile} style={{ fontSize: '48px', marginBottom: '16px' }} />
                        <p style={{ fontSize: '15px', fontWeight: '500' }}>
                          Pilih dokumen untuk melihat preview
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          {!isLoading && (
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
                onClick={goToPrevDoc}
                disabled={currentIndex <= 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: currentIndex > 0 ? '#10b981' : '#e5e7eb',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '600',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: currentIndex > 0 ? 'pointer' : 'not-allowed',
                  opacity: currentIndex > 0 ? 1 : 0.5,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (currentIndex > 0) {
                    e.currentTarget.style.background = '#059669'
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentIndex > 0) {
                    e.currentTarget.style.background = '#10b981'
                  }
                }}
              >
                <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: '12px' }} />
                Sebelumnya
              </button>
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', minWidth: '50px', textAlign: 'center' }}>
                {currentIndex + 1} / {documentsWithUrls.length}
              </span>
              <button
                onClick={() => {
                  if (isDirekturMode && isLastDoc) {
                    if (isPenetapanDone) onClose()
                    else setShowConfirmModal(true)
                  } else if (readOnly && isLastDoc) {
                    onClose()
                  } else if (isLastDoc && isCompleted) {
                    onClose()
                  } else if (isLastDoc && !isCompleted) {
                    setShowConfirmModal(true)
                  } else if (!isLastDoc) {
                    goToNextDoc()
                  }
                }}
                disabled={false}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: isDirekturMode
                    ? isPenetapanDone || !isLastDoc
                      ? '#10b981'
                      : '#f59e0b'
                    : readOnly || isCompleted
                      ? '#10b981'
                      : isLastDoc
                        ? '#f59e0b'
                        : '#10b981',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '600',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#059669'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDirekturMode
                    ? isPenetapanDone || !isLastDoc ? '#10b981' : '#f59e0b'
                    : readOnly || isCompleted ? '#10b981' : isLastDoc ? '#f59e0b' : '#10b981'
                }}
              >
                {isDirekturMode && isLastDoc ? (
                  isPenetapanDone ? (
                    'Selesai'
                  ) : (
                    <>
                      Lanjut ke Penilaian
                      <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '12px' }} />
                    </>
                  )
                ) : readOnly && isLastDoc ? (
                  <>
                    Tutup
                    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '12px' }} />
                  </>
                ) : isLastDoc ? (
                  isCompleted ? (
                    'Tutup'
                  ) : (
                    <>
                      Lanjut ke Penilaian
                      <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '12px' }} />
                    </>
                  )
                ) : (
                  <>
                    Berikutnya
                    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '12px' }} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
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
              padding: '32px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              animation: 'modalSlideIn 0.3s ease-out',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <FontAwesomeIcon icon={faFileText} style={{ fontSize: '28px', color: '#10b981' }} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                {isDirekturMode ? 'Penetapan Asesi' : 'Penilaian Asesi'}
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                {isDirekturMode ? 'Tetapkan status untuk' : 'Berikan penilaian untuk'} <strong>{asesiNama}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', transform: 'translateY(20px)' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  background: '#f3f4f6',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.5 : 1,
                  transition: 'all 0.2s',
                  flex: 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = '#e5e7eb'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = '#f3f4f6'
                  }
                }}
              >
                <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: '12px' }} />
                Kembali
              </button>

              <button
                onClick={() => isDirekturMode ? submitPenetapan(false) : submitRekomendasi(false)}
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  background: '#fef2f2',
                  color: '#dc2626',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: '2px solid #fecaca',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.5 : 1,
                  transition: 'all 0.2s',
                  flex: 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = '#fee2e2'
                    e.currentTarget.style.borderColor = '#f87171'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = '#fef2f2'
                    e.currentTarget.style.borderColor = '#fecaca'
                  }
                }}
              >
                {isSubmitting ? (
                  <SimpleSpinner size="sm" />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faTimes} style={{ fontSize: '14px' }} />
                    Tidak Kompeten
                  </>
                )}
              </button>

              <button
                onClick={() => isDirekturMode ? submitPenetapan(true) : submitRekomendasi(true)}
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  padding: '14px 10px',
                  background: '#10b981',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.5 : 1,
                  transition: 'all 0.2s',
                  flex: 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = '#059669'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = '#10b981'
                  }
                }}
              >
                {isSubmitting ? (
                  <SimpleSpinner size="sm" />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} style={{ fontSize: '14px' }} />
                    Kompeten
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
