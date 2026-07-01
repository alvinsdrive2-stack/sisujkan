import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
import { XCircle, ZoomIn, ZoomOut, ExternalLink } from "lucide-react"
import DashboardNavbar from "@/components/DashboardNavbar"
import { API_BASE_URL } from "@/config/api"
import UuidStepIndicator from "@/components/UuidStepIndicator"
import { useDataDokumenPraAsesmen } from "@/hooks/useDataDokumenPraAsesmen"

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("access_token")
  const h: Record<string, string> = { "Accept": "application/json" }
  if (token) h["Authorization"] = `Bearer ${token}`
  return h
}

interface PersonalData {
  nama: string
  nik: string
  tempat_lahir: string
  tanggal_lahir: string
  jenis_kelamin: string
  alamat: string
  telepon: string
  email: string
  pendidikan: string
  npwp: string
  ktp: string
  pas_foto: string
  referensi_kerja: string
  ijazah: string
}

const documentConfig = [
  { key: "npwp" as const, label: "NPWP" },
  { key: "ktp" as const, label: "Kartu Tanda Penduduk" },
  { key: "pas_foto" as const, label: "Pas Foto 3x4" },
  { key: "referensi_kerja" as const, label: "Surat Referensi Kerja" },
  { key: "ijazah" as const, label: "Ijazah Terakhir" },
]

function formatDateIndo(dateString: string): string {
  const date = new Date(dateString)
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
  return `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`
}

export default function KonfirmasiDataPage() {
  const { idIzin } = useParams<{ idIzin: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<PersonalData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<{ url: string; label: string; type: string } | null>(null)
  const [zoom, setZoom] = useState(1)

  const { tuk, tanggalUji, jabatanKerja, nomorSkema } = useDataDokumenPraAsesmen(idIzin)

  useEffect(() => {
    if (!idIzin) { setError("ID tidak valid"); return }
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/praasesmen/kebenaran-data/${idIzin}`, { headers: authHeaders() })
        if (!res.ok) throw new Error("Gagal memuat data")
        const json = await res.json()
        if (json.success && json.data) {
          setData(json.data)
        } else {
          throw new Error("Data tidak ditemukan")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan")
      }
    })()
  }, [idIzin])

  const handleConfirm = () => {
    navigate(`/praasesmen/${idIzin}/apl01`, { replace: true })
  }

  const openDocument = (url: string, label: string) => {
    const ext = url.split('.').pop()?.toLowerCase()
    const type = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '') ? 'image' : 'pdf'
    setSelectedDoc({ url, label, type })
  }

  const closeDocPreview = () => {
    setSelectedDoc(null)
    setZoom(1)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, sans-serif' }}>
      <DashboardNavbar userName={data?.nama || 'Asesi'} />

      <AsesmenBreadcrumb currentPage="Konfirmasi Data" />

      {error && (
        <div style={{ padding: '20px', maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '40px', textAlign: 'center', marginTop: '20px' }}>
            <XCircle style={{ width: '48px', height: '48px', color: '#999', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '16px', color: '#c00', marginBottom: '12px' }}>Gagal Memuat Data</h2>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>{error}</p>
            <button onClick={() => window.location.reload()} style={{ padding: '8px 24px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {data && (
        <div style={{ padding: '30px 16px', maxWidth: '860px', margin: '0 auto' }}>
          <UuidStepIndicator currentStep={1} isVerifikasiPage={false} />

          <div style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', padding: '32px 40px', marginTop: '24px', borderRadius: '2px' }}>
            {/* Panduan */}
            <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d2137" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: '16px' }}>
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                </svg>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>Panduan Pra-Asesmen</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                  <div style={{ width: '20px', height: '20px', background: '#f0f4f8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <span style={{ fontWeight: '500', color: '#333' }}>Periksa data diri</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                  <div style={{ width: '20px', height: '20px', background: '#f0f4f8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  </div>
                  <span style={{ fontWeight: '500', color: '#333' }}>Cek dokumen pendukung</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                  <div style={{ width: '20px', height: '20px', background: '#f0f4f8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </div>
                  <span style={{ fontWeight: '500', color: '#333' }}>Lanjut ke APL 01</span>
                </div>
              </div>
            </div>

            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', marginBottom: '4px' }}>Konfirmasi Data Diri</h2>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>Mohon periksa kembali data Anda sebelum memulai pra-asesmen</p>

            {/* Data Diri Table */}
            <table style={{ width: '100%', border: '1px solid #999', borderCollapse: 'collapse', fontSize: '13px', color: '#000', marginBottom: '20px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '180px', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>Nama</td>
                  <td style={{ width: '10px', textAlign: 'center', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>:</td>
                  <td style={{ border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }} colSpan={8}>{data.nama}</td>
                </tr>
                <tr>
                  <td style={{ width: '180px', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>No. NIK</td>
                  <td style={{ width: '10px', textAlign: 'center', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>:</td>
                  <td style={{ border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }} colSpan={8}>{data.nik}</td>
                </tr>
                <tr>
                  <td style={{ width: '180px', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>Tempat/tgl. Lahir</td>
                  <td style={{ width: '10px', textAlign: 'center', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>:</td>
                  <td style={{ border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }} colSpan={8}>
                    {data.tempat_lahir.toUpperCase()}, {formatDateIndo(data.tanggal_lahir)}
                  </td>
                </tr>
                <tr>
                  <td style={{ width: '180px', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>Jenis kelamin</td>
                  <td style={{ width: '10px', textAlign: 'center', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>:</td>
                  <td style={{ border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }} colSpan={8}>{data.jenis_kelamin}</td>
                </tr>
                <tr>
                  <td style={{ width: '180px', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>Alamat rumah</td>
                  <td style={{ width: '10px', textAlign: 'center', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>:</td>
                  <td style={{ border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }} colSpan={8}>{data.alamat}</td>
                </tr>
                <tr>
                  <td style={{ width: '180px', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>No. Telp/E-mail</td>
                  <td style={{ width: '10px', textAlign: 'center', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>:</td>
                  <td style={{ width: '90px', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>Rumah</td>
                  <td style={{ width: '10px', textAlign: 'center', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>:</td>
                  <td style={{ width: '180px', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>-</td>
                  <td style={{ width: '90px', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>Kantor</td>
                  <td style={{ width: '10px', textAlign: 'center', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>:</td>
                  <td style={{ border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>-</td>
                </tr>
                <tr>
                  <td style={{ width: '180px', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}></td>
                  <td style={{ width: '10px', textAlign: 'center', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}></td>
                  <td style={{ width: '90px', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>HP</td>
                  <td style={{ width: '10px', textAlign: 'center', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>:</td>
                  <td style={{ width: '180px', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>{data.telepon}</td>
                  <td style={{ width: '90px', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>Email</td>
                  <td style={{ width: '10px', textAlign: 'center', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>:</td>
                  <td style={{ border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>{data.email}</td>
                </tr>
                <tr>
                  <td style={{ width: '180px', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>Kualifikasi/Pendidikan</td>
                  <td style={{ width: '10px', textAlign: 'center', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>:</td>
                  <td style={{ border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }} colSpan={8}>{data.pendidikan}</td>
                </tr>
              </tbody>
            </table>

            {/* Jadwal Pra-Asesmen */}
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#000', marginBottom: '12px' }}>Jadwal Pra-Asesmen</h3>
            <table style={{ width: '100%', border: '1px solid #999', borderCollapse: 'collapse', fontSize: '13px', color: '#000', marginBottom: '20px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '180px', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>Skema Sertifikasi</td>
                  <td style={{ width: '10px', textAlign: 'center', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>:</td>
                  <td style={{ border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }} colSpan={8}>{jabatanKerja || nomorSkema || '-'}</td>
                </tr>
                <tr>
                  <td style={{ width: '180px', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>Tempat Uji Kompetensi</td>
                  <td style={{ width: '10px', textAlign: 'center', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>:</td>
                  <td style={{ border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }} colSpan={8}>{tuk || '-'}</td>
                </tr>
                {tanggalUji && (
                <tr>
                  <td style={{ width: '180px', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>Tanggal</td>
                  <td style={{ width: '10px', textAlign: 'center', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>:</td>
                  <td style={{ border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }} colSpan={8}>{formatDateIndo(tanggalUji)}</td>
                </tr>
                )}
              </tbody>
            </table>

            {/* Dokumen Pendukung */}
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#000', marginBottom: '12px' }}>Dokumen Pendukung</h3>
            <table style={{ width: '100%', border: '1px solid #999', borderCollapse: 'collapse', fontSize: '13px', color: '#000', marginBottom: '20px' }}>
              <tbody>
                {documentConfig.map((doc) => {
                  const docUrl = data[doc.key]
                  return (
                    <tr key={doc.key}>
                      <td style={{ width: '180px', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>{doc.label}</td>
                      <td style={{ width: '10px', textAlign: 'center', border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }}>:</td>
                      <td style={{ border: '1px solid #999', padding: '6px 8px', verticalAlign: 'middle' }} colSpan={8}>
                        {docUrl ? (
                          <button
                            onClick={() => openDocument(docUrl, doc.label)}
                            style={{ background: 'none', border: 'none', color: '#0066cc', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '13px' }}
                          >
                            Lihat Dokumen
                          </button>
                        ) : (
                          <span style={{ color: '#999', fontSize: '13px' }}>Tidak ada</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Notice */}
            <div style={{ background: '#fff9e6', border: '1px solid #e6b800', marginBottom: '20px', padding: '12px' }}>
              <p style={{ fontSize: '13px', color: '#000', margin: 0 }}>
                <strong>Penting:</strong> Data yang Anda masukkan bersifat resmi dan dapat dipertanggungjawabkan secara hukum.
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={handleConfirm}
                style={{
                  padding: '10px 32px', background: '#0066cc', color: '#fff',
                  border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Data Sudah Benar, Lanjut ke APL 01
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.5)' }}
          onClick={closeDocPreview}
        >
          <div
            style={{ background: '#fff', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '900px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #999', background: '#f0f0f0' }}>
              <h3 style={{ fontWeight: 'bold', color: '#000', margin: 0 }}>{selectedDoc.label}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedDoc.type === "pdf" && (
                  <>
                    <button onClick={() => setZoom(p => Math.max(p - 0.25, 0.5))} style={{ padding: '4px', border: '1px solid #999', background: '#fff', cursor: 'pointer', opacity: zoom <= 0.5 ? 0.5 : 1 }}>
                      <ZoomOut style={{ width: '16px', height: '16px' }} />
                    </button>
                    <span style={{ fontSize: '13px', color: '#000', minWidth: '48px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(p => Math.min(p + 0.25, 3))} style={{ padding: '4px', border: '1px solid #999', background: '#fff', cursor: 'pointer', opacity: zoom >= 3 ? 0.5 : 1 }}>
                      <ZoomIn style={{ width: '16px', height: '16px' }} />
                    </button>
                  </>
                )}
                <button onClick={() => window.open(selectedDoc.url, "_blank")} style={{ padding: '4px', border: '1px solid #999', background: '#fff', cursor: 'pointer' }}>
                  <ExternalLink style={{ width: '16px', height: '16px' }} />
                </button>
                <button onClick={closeDocPreview} style={{ padding: '4px', border: '1px solid #999', background: '#fff', cursor: 'pointer' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', justifyContent: 'center' }}>
              {selectedDoc.type === "image" ? (
                <img src={selectedDoc.url} alt={selectedDoc.label} style={{ maxWidth: '100%', display: 'block' }} />
              ) : (
                <iframe src={`${selectedDoc.url}#toolbar=0`} title={selectedDoc.label} style={{ width: '100%', height: '80vh', border: 'none', transform: `scale(${zoom})`, transformOrigin: 'top center' }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
