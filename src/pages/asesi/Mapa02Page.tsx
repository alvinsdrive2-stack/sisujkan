import { useState, useEffect, useCallback } from "react"
import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
import { useNavigate, useParams } from "react-router-dom"
import MukLayout from "@/components/MukLayout"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/ToastContext"
import { useKegiatanByRole } from "@/hooks/useKegiatanByRole"
import { useDataDokumenPraAsesmen } from "@/hooks/useDataDokumenPraAsesmen"
import { CustomCheckbox } from "@/components/ui/Checkbox"
import { ActionButton } from "@/components/ui/ActionButton"
import { useAbsenCheck } from "@/hooks/useAbsenCheck"
import { WebcamModal } from "@/components/ui/WebcamModal"
import { API_BASE_URL } from "@/config/api"
import { useSigningState } from "@/hooks/useSigningState"
import { FullPageLoader } from "@/components/ui/loading-spinner"

interface Unit {
  id_unit: number
  nama_unit: string
  kode_unit: string
}

interface KelompokKerja {
  id: number
  nama: string
  urut: string
  units: Unit[]
}

interface Referensi {
  id: number
  nama: string
  isdefault: number | null
  potensi_asesi_index: number
}

interface ReferensiForm {
  kategori: string
  referensis: Referensi[]
}

interface Mapa02Data {
  kelompok_kerja: {
    id: number
    kode: string
    nama_dokumen: string
    kelompok_kerja: KelompokKerja[]
  }
  referensi_form: ReferensiForm[]
}

interface ApiResponse {
  message: string
  data: Mapa02Data
}

export default function Mapa02Page() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { kegiatan, isAsesor } = useKegiatanByRole()
  const { idIzin: idIzinFromUrl } = useParams<{ idIzin: string }>()

  const idIzin = isAsesor ? idIzinFromUrl : user?.id_izin
  const { jabatanKerja, nomorSkema, namaPenyusun, namaValidator, tanggalPenyusun, tanggalValidator, barcodePenyusun, barcodeValidator, noregPenyusun, noregValidator, asesorList, tahap, jadwalId, metode, jenjang } = useDataDokumenPraAsesmen(idIzin)
  const { showSuccess, showWarning } = useToast()
  const [mapaData, setMapaData] = useState<Mapa02Data | null>(null)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [actualIdIzin, setActualIdIzin] = useState<string | undefined>(idIzin)
  const [isSaving, setIsSaving] = useState(false)
  const [barcodes, setBarcodes] = useState<{
    asesi?: { url: string; tanggal: string; nama: string }
    asesor1?: { url: string; tanggal: string; nama: string } | null
    asesor2?: { url: string; tanggal: string; nama: string } | null
  } | null>(null)
  const [selectedPotensi, setSelectedPotensi] = useState<Record<string, number>>({})

  // Absen check - auto-detect role (asesi/asesor1/asesor2)
  const { showAwalModal, submitAbsenAwal, handleAwalModalClose } = useAbsenCheck({
    phase: 'praasesmen',
    role: 'auto',
    checkOnMount: true, // Enable for both asesi and asesor
    idIzin: idIzin,
    asesorList: asesorList,
    tahap: tahap
  })

  const fetchMapa02Data = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token")
      let resolvedIdIzin = idIzin

      if (!resolvedIdIzin && !isAsesor && jadwalId) {
        const listAsesiResponse = await fetch(`${API_BASE_URL}/kegiatan/${jadwalId}/list-asesi`, {
          headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
        })
        if (listAsesiResponse.ok) {
          const listResult = await listAsesiResponse.json()
          if (listResult.message === "Success" && listResult.list_asesi?.[0]?.id_izin) {
            resolvedIdIzin = listResult.list_asesi[0].id_izin
          }
        }
      }

      if (!resolvedIdIzin) { return }

      setActualIdIzin(resolvedIdIzin)

      const mapa02Response = await fetch(`${API_BASE_URL}/praasesmen/${resolvedIdIzin}/mapa02`, {
        headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
      })

      if (mapa02Response.ok) {
        const result: ApiResponse = await mapa02Response.json()
        if (result.message === "Success") {
          setMapaData(result.data)
          if ((result.data as any).barcodes) {
            setBarcodes((result.data as any).barcodes)
          }
          const initialSelected: Record<string, number> = {}
          const kelompoks = result.data.kelompok_kerja?.kelompok_kerja || []
          result.data.referensi_form.forEach(refForm => {
            if (refForm.kategori === "MAPA02_1") {
              refForm.referensis.forEach(ref => {
                if (ref.isdefault && ref.potensi_asesi_index >= 1 && ref.potensi_asesi_index <= 5) {
                  kelompoks.forEach(k => {
                    initialSelected[`${k.id}_${ref.id}`] = ref.potensi_asesi_index
                  })
                }
              })
            }
          })
          setSelectedPotensi(initialSelected)
          setIsDataLoading(false)
        }
      }
    } catch (error) {
      setIsDataLoading(false)
    }
  }, [idIzin, isAsesor, kegiatan, jadwalId])

  useEffect(() => {
    window.scrollTo(0, 0)
    if (isAsesor && idIzin) fetchMapa02Data()
    else if (kegiatan || jadwalId) fetchMapa02Data()
  }, [idIzin, kegiatan, isAsesor, jadwalId, fetchMapa02Data])

  const signing = useSigningState({
    pageKey: 'mapa02',
    isAsesor,
    tahap,
    barcodes,
    setBarcodes,
    asesorList,
    userId: user?.id,
    userName: user?.name,
    isSaving,
    idIzin: actualIdIzin || idIzin,
    jadwalId,
    onRefresh: fetchMapa02Data,
  })


  const handleBack = () => {
    navigate(-1)
  }

  const isChecked = (kelompokId: number, refId: number, potensi: number) => {
    return selectedPotensi[`${kelompokId}_${refId}`] === potensi
  }

  const handleSubmit = async () => {
    const finalIdIzin = actualIdIzin || idIzin
    if (!finalIdIzin) {
      showWarning("ID Izin tidak ditemukan")
      return
    }

    // Tahap 0: langsung navigasi tanpa save/ttd
    if (tahap === 0) {
      navigate(`/asesi/praasesmen/${finalIdIzin}/ak07`)
      return
    }

    // Jika semua sudah ttd → redirect ke halaman berikutnya (skip untuk tahap 0)
    if (tahap !== 0 && !isAsesor && signing.asesiHasSigned && signing.allAsesorSigned) {
      navigate(`/asesi/praasesmen/${finalIdIzin}/ak07`)
      return
    }

    // Jika asesor sudah ttd → redirect (skip untuk tahap 0)
    if (tahap !== 0 && isAsesor && signing.asesorHasSigned) {
      navigate(`/asesi/praasesmen/${finalIdIzin}/ak07`)
      return
    }

    setIsSaving(true)
    try {
      const token = localStorage.getItem("access_token")

      // POST data mapa02
      const response = await fetch(`${API_BASE_URL}/praasesmen/${finalIdIzin}/mapa02`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        showWarning('Gagal menyimpan MAPA 02')
        return
      }

      // Generate QR (skip untuk tahap 0)
      if (tahap !== 0 && jadwalId) {
        const needsQr = isAsesor
          ? !signing.asesorHasSigned
          : !signing.asesiHasSigned

        if (needsQr) {
          const ok = await signing.generateQR()
          if (ok) {
            showSuccess('Dokumen berhasil ditandatangani!')
            return
          }
        }
      }

      showSuccess('MAPA 02 berhasil disimpan!')
      signing.publishUpdate()
      // Untuk tahap 0, langsung navigasi ke halaman berikutnya
      if (tahap === 0) {
        setTimeout(() => navigate(`/asesi/praasesmen/${finalIdIzin}/ak07`), 500)
      }
    } catch (error) {
      console.error('Error saving MAPA 02:', error)
      showWarning('Terjadi kesalahan saat menyimpan')
    } finally {
      setIsSaving(false)
    }
  }

  const referensiMAPA02 = mapaData?.referensi_form.find(r => r.kategori === "MAPA02_1")
  const keteranganReferensi = mapaData?.referensi_form.find(r => r.kategori === "MAPA02-1")

  if (isDataLoading) return <FullPageLoader text="Memuat data..." />

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Header */}
      
      <AsesmenBreadcrumb currentPage="MAPA 02" />

      <MukLayout currentStep={2} idIzin={idIzin} metode={metode} tahap={tahap} jenjang={jenjang}>
        <div style={{ padding: '20px' }}>
          {/* Title */}
          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <h1 style={{ fontSize: '14px', fontWeight: 'bold', color: '#000', marginBottom: '4px', textTransform: 'uppercase' }}>
              {mapaData?.kelompok_kerja.nama_dokumen || 'FR. MAPA.02 - FORMULIR MAPA 02'}
            </h1>
          </div>

          {/* Header Table - Skema Sertifikasi */}
          {mapaData && (
            <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '16px', fontSize: '13px', background: '#fff' }}>
              <tbody>
                <tr>
                  <td rowSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', width: '35%', fontWeight: 'bold' }}>
                    Skema Sertifikasi<br />
                    (̶𝙺̶𝙺̶𝙽̶𝙸̶/Okupasi/̶𝙺̶𝚕̶𝚊̶𝚜̶𝚝̶𝚎̶𝚛̶)̶
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', whiteSpace: 'nowrap', fontWeight: 'bold' }}>Judul</td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>:</td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>{jabatanKerja.toUpperCase() || ''}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', whiteSpace: 'nowrap', fontWeight: 'bold' }}>Nomor</td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>:</td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>{nomorSkema.toUpperCase() || mapaData?.kelompok_kerja.kode || ''}</td>
                </tr>
              </tbody>
            </table>
          )}

          

          {/* Kelompok Pekerjaan Tables with Instrumen Asesmen */}
          {mapaData?.kelompok_kerja?.kelompok_kerja?.map((kelompok) => (
            <div key={kelompok.id}>
              {/* Kelompok Pekerjaan Table */}
              <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '0', fontSize: '13px', background: '#fff' }}>
                <tbody>
                  <tr>
                    <th rowSpan={kelompok.units.length + 1} style={{ border: '1px solid #000', padding: '6px 8px', width: '25%', verticalAlign: 'top', textAlign: 'left' }}>
                      {kelompok.nama}
                    </th>
                    <th style={{ border: '1px solid #000', padding: '6px 8px', width: '5%' }}>No.</th>
                    <th style={{ border: '1px solid #000', padding: '6px 8px', width: '20%' }}>Kode Unit</th>
                    <th style={{ border: '1px solid #000', padding: '6px 8px' }}>Judul Unit</th>
                  </tr>
                  {kelompok.units.map((unit, unitIndex) => (
                    <tr key={unit.id_unit}>
                      <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>
                        {unitIndex + 1}.
                      </td>
                      <td style={{ border: '1px solid #000', padding: '6px 8px' }}>
                        {unit.kode_unit}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '6px 8px' }}>
                        {unit.nama_unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <br />

              {/* Instrumen Asesmen Table */}
              {referensiMAPA02 && (
                <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '16px', fontSize: '12px', background: '#fff' }}>
                  <tbody>
                    <tr>
                      <th rowSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', width: '5%', background: '#c00000', color: '#fff' }}>No.</th>
                      <th rowSpan={2} style={{ border: '1px solid #000', padding: '6px 8px',background: '#c00000', color: '#fff' }}>Instrumen Asesmen</th>
                      <th colSpan={5} style={{ border: '1px solid #000', padding: '6px 8px', background: '#c00000', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                        Potensi Asesi **
                      </th>
                    </tr>
                    <tr>
                      <th style={{ border: '1px solid #000', padding: '6px 8px', background: '#c00000', color: '#fff', fontWeight: 'bold', textAlign: 'center', width: '8%' }}>1</th>
                      <th style={{ border: '1px solid #000', padding: '6px 8px', background: '#c00000', color: '#fff', fontWeight: 'bold', textAlign: 'center', width: '8%' }}>2</th>
                      <th style={{ border: '1px solid #000', padding: '6px 8px', background: '#c00000', color: '#fff', fontWeight: 'bold', textAlign: 'center', width: '8%' }}>3</th>
                      <th style={{ border: '1px solid #000', padding: '6px 8px', background: '#c00000', color: '#fff', fontWeight: 'bold', textAlign: 'center', width: '8%' }}>4</th>
                      <th style={{ border: '1px solid #000', padding: '6px 8px', background: '#c00000', color: '#fff', fontWeight: 'bold', textAlign: 'center', width: '8%' }}>5</th>
                    </tr>
                    {referensiMAPA02.referensis.map((ref, refIndex) => (
                      <tr key={ref.id}>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>
                          {refIndex + 1}.
                        </td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }}>
                          {ref.nama}
                        </td>
                        {[1, 2, 3, 4, 5].map((potensi) => (
                          <td
                            key={potensi}
                            style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', cursor: 'not-allowed', userSelect: 'none', background: '#f5f5f5' }}
                          >
                            <CustomCheckbox
                              checked={isChecked(kelompok.id, ref.id, potensi)}
                              onChange={() => {}}
                              disabled
                              style={{ pointerEvents: 'none' }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}

          
          {/* Keterangan Table */}
          {keteranganReferensi && (
            <div style={{ background: '#ffffff', border: '1px solid #6f6f6f', marginBottom: '16px', padding: '12px', fontSize: '14px' }}>
              <div dangerouslySetInnerHTML={{ __html: keteranganReferensi.referensis[0]?.nama || '' }} />
            </div>
          )}

          {/* PENYUSUN DAN VALIDATOR */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }} cellSpacing="0">
            <tbody>
              <tr style={{ height: '28pt' }}>
                <td style={{ backgroundColor: '#C00000', border: '1px solid #000', padding: '6px 8px' }}><span style={{ color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>Status</span></td>
                <td style={{ backgroundColor: '#C00000', border: '1px solid #000', padding: '6px 8px' }}><span style={{ color: '#fff', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>No</span></td>
                <td style={{ backgroundColor: '#C00000', border: '1px solid #000', padding: '6px 8px' }}><span style={{ color: '#fff', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>Nama</span></td>
                <td style={{ backgroundColor: '#C00000', border: '1px solid #000', padding: '6px 8px' }}><span style={{ color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>Nomor MET</span></td>
                <td style={{ backgroundColor: '#C00000', border: '1px solid #000', padding: '6px 8px' }}><span style={{ color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>Tanda Tangan dan Tanggal</span></td>
              </tr>
              <tr style={{ height: '91pt' }}>
                <td rowSpan={2} style={{ border: '1px solid #000', padding: '15px 0 0 0', background: '#fff' }}><span style={{ fontSize: '12px', paddingLeft: '15px' }}>Penyusun</span></td>
                <td style={{ border: '1px solid #000', padding: '6px 8px', background: '#fff' }}><span style={{ fontSize: '12px', textAlign: 'center' }}>1</span></td>
                <td style={{ border: '1px solid #000', padding: '7px 8px', background: '#fff', fontSize: '12px' }}>{namaPenyusun || ''}</td>
                <td style={{ border: '1px solid #000', padding: '13px 8px', background: '#fff', fontSize: '12px' }}>{noregPenyusun || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '8px', background: '#fff', textAlign: 'center' }}>
                  {barcodePenyusun ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <img src={barcodePenyusun} alt="QR Penyusun" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                      {tanggalPenyusun && <span style={{ fontSize: '10px' }}>{new Date(tanggalPenyusun).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                    </div>
                  ) : ''}
                </td>
              </tr>
              <tr style={{ height: '23pt' }}>
                <td style={{ border: '1px solid #000', padding: '1px 8px', background: '#fff' }}></td>
                <td style={{ border: '1px solid #000', padding: '1px 8px', background: '#fff' }}></td>
                <td style={{ border: '1px solid #000', padding: '1px 8px', background: '#fff' }}></td>
                <td style={{ border: '1px solid #000', padding: '1px 8px', background: '#fff' }}></td>
              </tr>
              <tr style={{ height: '68pt' }}>
                <td rowSpan={2} style={{ border: '1px solid #000', padding: '18px 0 0 0', background: '#fff' }}><span style={{ fontSize: '12px', paddingLeft: '18px' }}>Validator</span></td>
                <td style={{ border: '1px solid #000', padding: '6px 8px', background: '#fff' }}><span style={{ fontSize: '12px', textAlign: 'center' }}>1</span></td>
                <td style={{ border: '1px solid #000', padding: '7px 8px', background: '#fff', fontSize: '12px' }}>{namaValidator || ''}</td>
                <td style={{ border: '1px solid #000', padding: '13px 8px', background: '#fff', fontSize: '12px' }}>{noregValidator || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '8px', background: '#fff', textAlign: 'center' }}>
                  {barcodeValidator ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <img src={barcodeValidator} alt="QR Validator" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                      {tanggalValidator && <span style={{ fontSize: '10px' }}>{new Date(tanggalValidator).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                    </div>
                  ) : ''}
                </td>
              </tr>
              <tr style={{ height: '23pt' }}>
                <td style={{ border: '1px solid #000', padding: '1px 8px', background: '#fff' }}></td>
                <td style={{ border: '1px solid #000', padding: '1px 8px', background: '#fff' }}></td>
                <td style={{ border: '1px solid #000', padding: '1px 8px', background: '#fff' }}></td>
                <td style={{ border: '1px solid #000', padding: '1px 8px', background: '#fff' }}></td>
              </tr>
            </tbody>
          </table>
          {/* Agreement Checklist */}
          {!signing.allSigned && (
          <div style={{ background: '#fff', border: '1px solid #000', borderRadius: '4px', marginBottom: '20px', padding: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: signing.allSigned ? 'not-allowed' : 'pointer' }}>
              <CustomCheckbox
                checked={signing.agreedChecklist}
                onChange={() => signing.setAgreedChecklist(!signing.agreedChecklist)}
                disabled={signing.allSigned}
                style={{ marginTop: '2px', cursor: signing.allSigned ? 'not-allowed' : 'pointer' }}
              />
              <span style={{ fontSize: '12px', color: '#000', lineHeight: '1.5' }}>
                <strong style={{ textTransform: 'uppercase' }}>Pernyataan:</strong> Saya menyatakan bahwa saya telah memahami dan memahami dokumen MAPA 02 (Matriks Pengembangan dan Penilaian Asesmen) ini dengan sebenar-benarnya.
              </span>
            </label>
          </div>
          )}

          

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            {isAsesor && (
              <ActionButton variant="secondary" onClick={handleBack} disabled={isSaving}>
                Kembali
              </ActionButton>
            )}
            <ActionButton variant="primary" disabled={signing.buttonDisabled} onClick={handleSubmit}>
              {signing.buttonText}
            </ActionButton>
          </div>
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
    </div>
  )
}
