import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFilePdf, faFilePowerpoint, faFileImage, faFile, faArrowLeft, faSpinner, faCalendar, faClock, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons"
import DashboardNavbar from "@/components/DashboardNavbar"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/ToastContext"
import { extractErrorMessage, extractApiError } from "@/lib/error-utils"
import { kegiatanService, KegiatanAsesor } from "@/lib/kegiatan-service"
import { API_BASE_URL } from "@/config/api"
import { formatShortDateWIB, formatTimeWIB } from "@/lib/date-utils"

interface Asesor {
  jadwal_id: string
  id_izin: string
  nama: string
  is_started: string
  started_at: string | null
  kompeten: string
}

interface DokumenResponse {
  message: string
  list_asesi: Asesor[]
}

interface DokumenItem {
  key: string
  label: string
  url: string | null
  asesors?: Asesor[]
}

const getFileIcon = (url: string) => {
  if (!url) return faFile
  const extension = url.split('.').pop()?.toLowerCase() || ''
  switch (extension) {
    case 'pdf':
      return faFilePdf
    case 'ppt':
    case 'pptx':
      return faFilePowerpoint
    case 'jpg':
    case 'jpeg':
    case 'png':
      return faFileImage
    default:
      return faFile
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

export default function DetailDokumenAsesiPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showError } = useToast()

  const [dokumenResponse, setDokumenResponse] = useState<DokumenResponse | null>(null)
  const [kegiatan, setKegiatan] = useState<KegiatanAsesor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<DokumenItem | null>(null)

  useEffect(() => {
    const fetchDokumen = async () => {
      if (!id) return

      try {
        const token = localStorage.getItem("access_token")
        const response = await fetch(`${API_BASE_URL}/dokumen/asesi/${id}`, {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const result: DokumenResponse = await response.json()
          setDokumenResponse(result)
        } else {
          const msg = await extractApiError(response, 'Gagal memuat data dokumen')
          showError(msg)
        }
      } catch (error) {
        console.error("Error fetching dokumen:", error)
        showError(extractErrorMessage(error, 'Terjadi kesalahan saat memuat dokumen'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchDokumen()
  }, [id])

  // Fetch kegiatan detail
  useEffect(() => {
    const fetchKegiatan = async () => {
      if (!id) return

      try {
        const responseFalse = await kegiatanService.getKegiatanKomtek(false)
        let found = responseFalse.data.data.find((k: KegiatanAsesor) => k.jadwal_id === id)

        if (!found) {
          const responseTrue = await kegiatanService.getKegiatanKomtek(true)
          found = responseTrue.data.data.find((k: KegiatanAsesor) => k.jadwal_id === id)
        }

        if (found) {
          console.log('Kegiatan data:', found)
          console.log('asesor2:', found.asesor2)
          setKegiatan(found)
        }
      } catch (err) {
        console.error('Error fetching kegiatan:', err)
      }
    }
    fetchKegiatan()
  }, [id])

  // Build document list from list_asesi
  const documentList: DokumenItem[] = (dokumenResponse?.list_asesi || []).flatMap(asesiItem => {
    // Determine document key for each document type
    const docKeyMap: Record<string, string> = {
      'apl01': 'apl01',
      'apl02': 'apl02',
      'mapa01': 'mapa01',
      'mapa02': 'mapa02',
      'ak07': 'ak07',
      'ak04': 'ak04',
      'ak01': 'ak01',
      'ia04a': 'ia04a',
      'ak02': 'ak02',
      'ia04b': 'ia04b',
      'ak03': 'ak03',
      'ia05': 'ia05',
      'ak05': 'ak05',
      'ak06': 'ak06',
      'tugas': 'tugas'
    }

    const docKey = docKeyMap[asesiItem.kompeten] || asesiItem.kompeten
    if (!docKey) return [] // Skip if no matching document type

    return [{
      key: `${asesiItem.id_izin}-${docKey}`,
      label: asesiItem.nama,
      url: (dokumenResponse as any)?.[docKey] || null,
      asesors: [asesiItem]
    }]
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <DashboardNavbar userName={user?.name} />

      {/* Breadcrumb */}
      <div style={{ borderBottom: '1px solid #999', background: '#fff' }}>
        <div style={{ padding: '12px 16px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#666', alignItems: 'center' }}>
            <span
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => navigate("/komtek/tandatangan")}
            >
              Dokumen
            </span>
            <span>/</span>
            <span>Detail Dokumen Asesi</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Kegiatan Info Header */}
        {kegiatan && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                  {kegiatan.nama_kegiatan}
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                  {kegiatan.tuk?.nama?.toUpperCase() || ''} • {kegiatan.asesor?.nama?.toUpperCase() || ''}{kegiatan.asesor2 ? ` & ${kegiatan.asesor2.nama?.toUpperCase() || ''}` : ''}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FontAwesomeIcon icon={faCalendar} style={{ color: '#10b981', fontSize: '14px' }} />
                    {formatShortDateWIB(kegiatan.tanggal_uji)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FontAwesomeIcon icon={faClock} style={{ color: '#10b981', fontSize: '14px' }} />
                    {formatTimeWIB(kegiatan.tanggal_uji)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#10b981', fontSize: '14px' }} />
                    {kegiatan.tuk.alamat}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => navigate("/komtek/tandatangan")}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
          >
            <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: '14px' }} />
            Kembali
          </button>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <FontAwesomeIcon icon={faSpinner} style={{ fontSize: '32px', color: '#10b981', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
            {/* Left Panel - Document List with Flow */}
            <div>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                  Daftar Dokumen
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {documentList.map((doc) => {
                    const asesorsList = doc.asesors || []
                    const hasDocument = !!doc.url

                    return (
                      <>
                        {/* Connection Lines to Asesor Nodes */}
                        {asesorsList.map((_, asesorIndex) => (
                          <div key={`${doc.key}-${asesorIndex}`} style={{ position: 'relative' }}>
                            {/* Vertical Line */}
                            {asesorIndex < asesorsList.length - 1 && (
                              <div style={{
                                position: 'absolute',
                                left: '50%',
                                top: '-8px',
                                width: '2px',
                                height: 'calc(100% + 8px)',
                                background: '#10b981'
                              }} />
                            )}

                            {/* Node */}
                            <button
                              onClick={() => hasDocument ? setSelectedDoc(doc) : null}
                              disabled={!hasDocument}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                width: '100%',
                                padding: '12px',
                                background: selectedDoc?.key === doc.key ? '#ecfdf5' : '#fff',
                                border: selectedDoc?.key === doc.key ? '2px solid #10b981' : '1px solid #e5e7eb',
                                borderRadius: '8px',
                                cursor: hasDocument ? 'pointer' : 'not-allowed',
                                opacity: hasDocument ? 1 : 0.5,
                                transition: 'all 0.2s',
                                fontSize: '14px',
                                color: '#374151'
                              }}
                              onMouseEnter={(e) => {
                                if (hasDocument && selectedDoc?.key !== doc.key) {
                                  e.currentTarget.style.background = '#f9fafb'
                                  e.currentTarget.style.borderColor = '#d1d5db'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (hasDocument && selectedDoc?.key !== doc.key) {
                                  e.currentTarget.style.background = '#fff'
                                  e.currentTarget.style.borderColor = '#e5e7eb'
                                }
                              }}
                            >
                              {/* Node */}
                              <div style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                background: hasDocument ? '#10b981' : '#d1d5db',
                                border: '2px solid #fff',
                                boxShadow: '0 0 2px ' + (hasDocument ? '#10b981' : '#d1d5db'),
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {hasDocument && (
                                  <div style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: '#fff'
                                  }} />
                                )}
                              </div>

                              {/* Document Icon */}
                              <FontAwesomeIcon
                                icon={getFileIcon(doc.url || '')}
                                style={{
                                  fontSize: '18px',
                                  color: hasDocument ? '#10b981' : '#9ca3af',
                                  flexShrink: 0
                                }}
                              />

                              {/* Document Label */}
                              <span style={{ flex: 1, textAlign: 'left', fontWeight: '500' }}>
                                {doc.label}
                              </span>

                              {/* Empty Status */}
                              {!hasDocument && (
                                <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                                  Belum ada
                                </span>
                              )}
                            </button>
                          </div>
                        ))}
                      </>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right Panel - Document Preview */}
            <div>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', height: '100%' }}>
                {selectedDoc ? (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FontAwesomeIcon
                          icon={getFileIcon(selectedDoc.url || '')}
                          style={{ fontSize: '24px', color: '#10b981' }}
                        />
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
                          {selectedDoc.label}
                        </h3>
                      </div>
                      <a
                        href={selectedDoc.url || ''}
                        download
                        style={{
                          padding: '8px 16px',
                          background: '#10b981',
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: '600',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#059669' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#10b981' }}
                      >
                        Download
                      </a>
                    </div>

                    {/* Preview Area */}
                    <div style={{
                      flex: 1,
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      minHeight: '75vh'
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
                      ) : (
                        <img
                          src={selectedDoc.url || ''}
                          alt={selectedDoc.label}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af',
                    minHeight: '75vh'
                  }}>
                    <FontAwesomeIcon icon={faFile} style={{ fontSize: '64px', marginBottom: '16px' }} />
                    <p style={{ fontSize: '16px', fontWeight: '500' }}>
                      Pilih dokumen untuk melihat preview
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
