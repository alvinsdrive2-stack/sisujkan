import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import ModularAsesiLayout from "@/components/ModularAsesiLayout"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/ToastContext"
import { extractErrorMessage, extractApiError } from "@/lib/error-utils"
import { useAsesorRole } from "@/hooks/useAsesorRole"
import { useDataDokumenAsesmen } from "@/hooks/useDataDokumenAsesmen"
import { useDataDokumenPraAsesmen } from "@/hooks/useDataDokumenPraAsesmen"
import { useKegiatanByRole } from "@/hooks/useKegiatanByRole"
import { useAbsenCheck } from "@/hooks/useAbsenCheck"
import { getAsesmenSteps } from "@/lib/asesmen-steps"
import { CustomCheckbox } from "@/components/ui/Checkbox"
import { ActionButton } from "@/components/ui/ActionButton"
import { useSigningState } from "@/hooks/useSigningState"
import { WebcamModal } from "@/components/ui/WebcamModal"
import { API_BASE_URL } from "@/config/api"
import { FullPageLoader } from "@/components/ui/loading-spinner"

interface UnitKompetensiAPI {
  id: number
  kode: string
  nama: string
  observasi: boolean
  portofolio: boolean
  pertanyaan_wawancara: boolean
  pertanyaan_lisan: boolean
  pertanyaan_tertulis: boolean
  proyek_kerja: boolean
  lainnya?: boolean
}

interface UnitKompetensi {
  id: number
  kode: string
  nama: string
}

type BarcodeData = {
  url: string
  tanggal: string
  nama: string
}

interface Ak02Response {
  message: string
  data: {
    barcodes?: {
      asesi?: BarcodeData
      asesor1?: BarcodeData | null
      asesor2?: BarcodeData | null
    }
    data_unit_kompetensi: UnitKompetensiAPI[]
    is_kompeten: boolean
    tindak_lanjut: string
    komentar: string
  }
}

interface EvidenceCheck {
  observasi: boolean
  portofolio: boolean
  pertanyaan_wawancara: boolean
  pertanyaan_lisan: boolean
  pertanyaan_tertulis: boolean
  proyek_kerja: boolean
  lainnya: boolean
}

export default function Ak02Page() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { id } = useParams<{ id?: string }>()
  const { role: asesorRole } = useAsesorRole(id)
  const { jenjang, metode, jabatanKerja, nomorSkema, tuk, asesorList, namaAsesi, tanggalUji, jadwalId } = useDataDokumenAsesmen(id)
  const { showSuccess, showError, showWarning } = useToast()
  const { kegiatan: _kegiatan, isAsesor } = useKegiatanByRole()
  const { tahap } = useDataDokumenPraAsesmen(id)

  // Get dynamic steps
  const asesmenSteps = useMemo(() => getAsesmenSteps(jenjang, isAsesor, asesorRole, asesorList.length, metode, tahap), [jenjang, isAsesor, asesorRole, asesorList.length, metode, tahap])

  // All asesor can fill (removed restriction to asesor_1 only)
  const isFormDisabled = !isAsesor

  // Absen check - auto-detect role (asesi/asesor1/asesor2)
  // Note: absen akhir for asesi is now handled in Ak03Page
  const {
    showAwalModal,
    submitAbsenAwal,
    handleAwalModalClose,
  } = useAbsenCheck({
    phase: 'asesmen',
    role: 'auto',
    checkOnMount: true,
    idIzin: id,
    asesorList
  })

  // Form state
  const [evidenceChecks, setEvidenceChecks] = useState<Record<number, EvidenceCheck>>({})
  const [isKompeten, setIsKompeten] = useState<boolean | null>(null)
  const [tindakLanjut, setTindakLanjut] = useState('')
  const [komentar, setKomentar] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [barcodes, setBarcodes] = useState<{
    asesi?: BarcodeData
    asesor1?: BarcodeData | null
    asesor2?: BarcodeData | null
  } | null>(null)

  // Unit kompetensi state
  const [unitKompetensi, setUnitKompetensi] = useState<UnitKompetensi[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)

  // Fetch unit kompetensi data
  const fetchAk02Data = useCallback(async () => {
    if (authLoading) return
    if (!id) {
      setIsDataLoading(false)
      return
    }

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/asesmen/${id}/ak02`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result: Ak02Response = await response.json()
        if (result.message === "Success" && result.data?.data_unit_kompetensi) {
          if (result.data.barcodes) {
            setBarcodes({
              asesi: result.data.barcodes.asesi,
              asesor1: result.data.barcodes.asesor1,
              asesor2: result.data.barcodes.asesor2,
            })
          }

          const units: UnitKompetensi[] = []
          const checks: Record<number, EvidenceCheck> = {}

          result.data.data_unit_kompetensi.forEach((unit) => {
            units.push({ id: unit.id, kode: unit.kode, nama: unit.nama })
            checks[unit.id] = {
              observasi: unit.observasi,
              portofolio: unit.portofolio,
              pertanyaan_wawancara: unit.pertanyaan_wawancara,
              pertanyaan_lisan: unit.pertanyaan_lisan,
              pertanyaan_tertulis: unit.pertanyaan_tertulis,
              proyek_kerja: unit.proyek_kerja,
              lainnya: unit.lainnya ?? false,
            }
          })

          setUnitKompetensi(units)
          setEvidenceChecks(checks)
          setIsKompeten(result.data.is_kompeten ?? null)
          setTindakLanjut(result.data.tindak_lanjut || '')
          setKomentar(result.data.komentar || '')
        }
      }
    } catch (err) {
      console.error("Error fetching AK02:", err)
    } finally {
      setIsDataLoading(false)
    }
  }, [id, authLoading])

  useEffect(() => { fetchAk02Data() }, [fetchAk02Data])

  const nextStepLabel = asesmenSteps[asesmenSteps.findIndex(s => s.href.includes('ak02')) + 1]?.label

  // Signing state hook
  const signing = useSigningState({
    pageKey: 'ak02',
    isAsesor,
    tahap,
    barcodes: barcodes as any,
    setBarcodes: setBarcodes as any,
    asesorList,
    userId: user?.id,
    userName: user?.name,
    isSaving,
    idIzin: id,
    jadwalId,
    onRefresh: fetchAk02Data,
    nextPageName: nextStepLabel,
  })

  const handleEvidenceChange = (unitId: number, field: keyof EvidenceCheck) => {
    setEvidenceChecks(prev => ({
      ...prev,
      [unitId]: {
        ...prev[unitId],
        [field]: !prev[unitId]?.[field]
      }
    }))
  }

  if (isDataLoading) return <FullPageLoader text="Memuat data..." />

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>

      {/* Breadcrumb */}
      <AsesmenBreadcrumb currentPage="AK.02" />

      <ModularAsesiLayout currentStep={asesmenSteps.find(s => s.href.includes('ak02'))?.number || 5} steps={asesmenSteps} id={id} metode={metode}>
        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#000', marginBottom: '4px', letterSpacing: '1px' }}>
            FR.AK.02 &nbsp;&nbsp; FORMULIR REKAMAN ASESMEN KOMPETENSI
          </h1>
        </div>

        {/* IDENTITAS Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '13px', background: '#fff', border: '2px solid #000' }}>
          <tbody>
            <tr>
              <td rowSpan={2} style={{ width: '30%', border: '1px solid #000', padding: '6px' }}>Skema Sertifikasi (̶𝙺̶𝙺̶𝙽̶𝙸̶/Okupasi/̶𝙺̶𝚕̶𝚊̶𝚜̶𝚝̶𝚎̶𝚛̶)̶</td>
              <td style={{ width: '12%', border: '1px solid #000', padding: '6px' }}>Judul</td>
              <td style={{ width: '3%', border: '1px solid #000', padding: '6px',textAlign: 'end' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{jabatanKerja || '-'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Nomor</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{nomorSkema || '-'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>TUK</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{tuk || '-'}</td>
            </tr>
            {asesorList.length > 1 ? (
              asesorList.map((asesor, idx) => (
                <tr key={asesor.id}>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>Nama Asesor {idx + 1}</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
                  <td colSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>
                    {asesor.nama?.toUpperCase() || ''}{asesor.noreg && ` (${asesor.noreg})`}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px' }}>Nama Asesor</td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
                <td colSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>
                  {asesorList[0]?.nama?.toUpperCase() || ''}{asesorList[0]?.noreg && ` (${asesorList[0].noreg})`}
                </td>
              </tr>
            )}
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Nama Asesi</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{namaAsesi?.toUpperCase() || user?.name?.toUpperCase() || '-'}</td>
            </tr>
            <tr>
              <td rowSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>Tanggal Asesmen</td>
              <td style={{ border: '1px solid #000', padding: '6px',textAlign: 'right' }}>Mulai :</td>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>{tanggalUji ? new Date(tanggalUji).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px',textAlign: 'right' }}>Selesai :</td>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>{tanggalUji ? new Date(tanggalUji).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</td>
            </tr>
          </tbody>
        </table>

        <p style={{ fontSize: '13px', marginBottom: '15px' }}>
          Beri tanda centang (√) di kolom yang sesuai untuk mencerminkan bukti yang diperoleh untuk menentukan Kompetensi asesi untuk setiap Unit Kompetensi.
        </p>

        {/* MATRIKS KOMPETENSI Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '13px', background: '#fff', border: '2px solid #000' }}>
          <tbody>
            <tr style={{color: '#000', fontWeight: 'bold', textAlign: 'center' }}>
              <th style={{ width: '30%', border: '1px solid #000', padding: '6px' }}>Unit kompetensi</th>
              {[
                ['Observasi Demonstrasi'],
                ['Portofolio'],
                ['Pernyataan Pihak Ketiga', 'Pertanyaan wawancara'],
                ['Pertanyaan Lisan'],
                ['Pertanyaan Tertulis'],
                ['Proyek Kerja'],
                ['Lainnya'],
              ].map((lines) => (
                <th key={lines.join('')} style={{ border: '1px solid #000', padding: '8px 4px', width: '20px', textAlign: 'center', verticalAlign: 'middle', position: 'relative' }}>
                  <div style={{ writingMode: 'vertical-rl', whiteSpace: 'nowrap', visibility: 'hidden', fontSize: '12px', lineHeight: '1.3' }}>
                    {lines.map((line, i) => (
                      <span key={i}>{line}{i < lines.length - 1 && <br/>}</span>
                    ))}
                  </div>
                  <div style={{ position: 'absolute', top: '0', left: '0', right: '0', bottom: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', fontSize: '12px', lineHeight: '1.3' }}>
                      {lines.map((line, i) => (
                        <span key={i}>{line}{i < lines.length - 1 && <br/>}</span>
                      ))}
                    </div>
                  </div>
                </th>
              ))}
            </tr>

            {unitKompetensi.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
                  Memuat data unit kompetensi...
                </td>
              </tr>
            )}
            {unitKompetensi.map((unit) => (
              <tr key={unit.id}>
                <td style={{ border: '1px solid #000', padding: '6px' }}>
                  {unit.kode}<br />
                  {unit.nama}
                </td>
                <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px', fontSize: '20px' }}>
                  <CustomCheckbox
                    checked={evidenceChecks[unit.id]?.observasi || false}
                    onChange={() => handleEvidenceChange(unit.id, 'observasi')}
                    disabled={isFormDisabled || signing.allSigned}
                    style={{ cursor: (isFormDisabled || signing.allSigned) ? 'not-allowed' : 'pointer' }}
                  />
                </td>
                <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px', fontSize: '20px' }}>
                  <CustomCheckbox
                    checked={evidenceChecks[unit.id]?.portofolio || false}
                    onChange={() => handleEvidenceChange(unit.id, 'portofolio')}
                    disabled={isFormDisabled || signing.allSigned}
                    style={{ cursor: (isFormDisabled || signing.allSigned) ? 'not-allowed' : 'pointer' }}
                  />
                </td>
                <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px', fontSize: '20px' }}>
                  <CustomCheckbox
                    checked={evidenceChecks[unit.id]?.pertanyaan_wawancara || false}
                    onChange={() => handleEvidenceChange(unit.id, 'pertanyaan_wawancara')}
                    disabled={isFormDisabled || signing.allSigned}
                    style={{ cursor: (isFormDisabled || signing.allSigned) ? 'not-allowed' : 'pointer' }}
                  />
                </td>
                <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px', fontSize: '20px' }}>
                  <CustomCheckbox
                    checked={evidenceChecks[unit.id]?.pertanyaan_lisan || false}
                    onChange={() => handleEvidenceChange(unit.id, 'pertanyaan_lisan')}
                    disabled={isFormDisabled || signing.allSigned}
                    style={{ cursor: (isFormDisabled || signing.allSigned) ? 'not-allowed' : 'pointer' }}
                  />
                </td>
                <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px', fontSize: '20px' }}>
                  <CustomCheckbox
                    checked={evidenceChecks[unit.id]?.pertanyaan_tertulis || false}
                    onChange={() => handleEvidenceChange(unit.id, 'pertanyaan_tertulis')}
                    disabled={isFormDisabled || signing.allSigned}
                    style={{ cursor: (isFormDisabled || signing.allSigned) ? 'not-allowed' : 'pointer' }}
                  />
                </td>
                <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px', fontSize: '20px' }}>
                  <CustomCheckbox
                    checked={evidenceChecks[unit.id]?.proyek_kerja || false}
                    onChange={() => handleEvidenceChange(unit.id, 'proyek_kerja')}
                    disabled={isFormDisabled || signing.allSigned}
                    style={{ cursor: (isFormDisabled || signing.allSigned) ? 'not-allowed' : 'pointer' }}
                  />
                </td>
                <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px', fontSize: '20px' }}>
                  <CustomCheckbox
                    checked={evidenceChecks[unit.id]?.lainnya || false}
                    onChange={() => handleEvidenceChange(unit.id, 'lainnya')}
                    disabled={isFormDisabled || signing.allSigned}
                    style={{ cursor: (isFormDisabled || signing.allSigned) ? 'not-allowed' : 'pointer' }}
                  />
                </td>
              </tr>
            ))}

            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}><b>Rekomendasi hasil asesmen</b></td>
              <td colSpan={7} style={{ textAlign: 'center', border: '1px solid #000', padding: '6px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginRight: '20px', cursor: (isFormDisabled || signing.allSigned) ? 'not-allowed' : 'pointer' }}>
                  <CustomCheckbox
                    checked={isKompeten === true}
                    onChange={() => setIsKompeten(isKompeten === true ? null : true)}
                    disabled={isFormDisabled || signing.allSigned}
                  />
                  Kompeten
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: (isFormDisabled || signing.allSigned) ? 'not-allowed' : 'pointer' }}>
                  <CustomCheckbox
                    checked={isKompeten === false}
                    onChange={() => setIsKompeten(isKompeten === false ? null : false)}
                    disabled={isFormDisabled || signing.allSigned}
                  />
                  Belum kompeten
                </label>
              </td>
            </tr>

            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>
                <b>Tindak lanjut yang dibutuhkan</b><br />
                <span style={{ fontSize: '13px' }}>(Masukkan pekerjaan tambahan dan asesmen yang diperlukan untuk mencapai kompetensi)</span>
              </td>
              <td colSpan={7} style={{ border: '1px solid #000', padding: '6px' }}>
                <textarea
                  value={tindakLanjut}
                  onChange={(e) => setTindakLanjut(e.target.value)}
                  disabled={isFormDisabled || signing.allSigned}
                  style={{ width: '100%', height: '70px', border: '1px solid #ccc', padding: '6px', fontSize: '13px', resize: 'none', cursor: (isFormDisabled || signing.allSigned) ? 'not-allowed' : 'text' }}
                  placeholder="Tuliskan tindak lanjut..."
                />
              </td>
            </tr>

            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}><b>Komentar / Observasi oleh asesor</b></td>
              <td colSpan={7} style={{ border: '1px solid #000', padding: '6px' }}>
                <textarea
                  value={komentar}
                  onChange={(e) => setKomentar(e.target.value)}
                  disabled={isFormDisabled || signing.allSigned}
                  style={{ width: '100%', height: '60px', border: '1px solid #ccc', padding: '6px', fontSize: '13px', resize: 'none', cursor: (isFormDisabled || signing.allSigned) ? 'not-allowed' : 'text' }}
                  placeholder="Tuliskan komentar..."
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* TANDA TANGAN Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '13px', background: '#fff', border: '2px solid #000' }}>
          <tbody>
            <tr>
              <td colSpan={3} style={{ border: '1px solid #000', padding: '6px' }}><b>Asesi :</b></td>
            </tr>
            <tr>
              <td style={{ width: '30%', border: '1px solid #000', padding: '6px' }}>Nama</td>
              <td style={{ width: '3%', border: '1px solid #000', padding: '6px' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{namaAsesi?.toUpperCase() || user?.name?.toUpperCase() || ''}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Tanda tangan dan tanggal</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>:</td>
              <td style={{ height: '60px', border: '1px solid #000', padding: '6px', verticalAlign: 'middle', textAlign: 'center' }}>
                {barcodes?.asesi?.url ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <img
                      src={barcodes.asesi.url}
                      alt="Tanda Tangan Asesi"
                      style={{ height: '50px', width: '50px', objectFit: 'contain' }}
                    />
                    {barcodes.asesi.tanggal && (
                      <div style={{ fontSize: '11px', color: '#333' }}>
                        {new Date(barcodes.asesi.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                ) : null}
              </td>
            </tr>

            {/* Asesor rows - dynamic */}
            {asesorList.map((asesor, idx) => {
              const asesorBarcode = idx === 0 ? barcodes?.asesor1 : barcodes?.asesor2
              const label = asesorList.length > 1 ? `Nama Asesor ${idx + 1}` : 'Nama Asesor'
              return (
                <React.Fragment key={asesor.id}>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>{label}</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>:</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{asesor.nama?.toUpperCase() || ''}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>No. Reg {asesorList.length > 1 ? idx + 1 : ''}</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>:</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>{asesor.noreg || ''}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>Tanda tangan dan tanggal</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>:</td>
                    <td style={{ height: '60px', border: '1px solid #000', padding: '6px', verticalAlign: 'middle', textAlign: 'center' }}>
                      {asesorBarcode?.url ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <img
                            src={asesorBarcode.url}
                            alt={`Tanda Tangan ${asesor.nama}`}
                            style={{ height: '50px', width: '50px', objectFit: 'contain' }}
                          />
                          {asesorBarcode.tanggal && (
                            <div style={{ fontSize: '11px', color: '#333' }}>
                              {new Date(asesorBarcode.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                </React.Fragment>
              )
            })}
          </tbody>
        </table>

        {/* LAMPIRAN DOKUMEN */}
        <div style={{ fontSize: '13px', marginBottom: '15px' }}>
          <b>LAMPIRAN DOKUMEN:</b><br />
          1. Dokumen APL 01 peserta<br />
          2. Dokumen APL 02 peserta<br />
          3. Bukti-bukti berkualitas peserta<br />
          4. Tinjauan proses asesmen
        </div>

        {/* Actions */}
        <div style={{ marginTop: '20px' }}>
          {/* Pernyataan Checkbox */}
          {!signing.allSigned && (
          <div style={{ background: '#fff', border: '1px solid #999', borderRadius: '4px', padding: '16px', marginBottom: '16px'  }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <CustomCheckbox
                checked={signing.agreedChecklist}
                onChange={() => signing.setAgreedChecklist(!signing.agreedChecklist)}
                disabled={signing.allSigned}
                style={{ marginTop: '2px' }}
              />
              <span style={{ fontSize: '13px', color: '#333' }}>
                Saya menyatakan dengan sebenar-benarnya bahwa hasil frageman antara asesor ini telah saya isi dengan jujur dan dapat dipertanggungjawabkan.
              </span>
            </label>
          </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            {isAsesor && (
              <ActionButton
                variant="secondary"
                onClick={() => {
                  const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ak02'))
                  const prevStep = asesmenSteps[currentStepIndex - 1]
                  if (prevStep) {
                    const prevPath = prevStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`)
                    navigate(prevPath)
                  } else {
                    navigate(`/asesi/asesmen/${id}/ia05`)
                  }
                }}
              >
                Kembali
              </ActionButton>
            )}
            <ActionButton
              variant="primary"
              disabled={signing.buttonDisabled}
              onClick={async () => {
                // Tahap 0: skip save/TTD, langsung navigasi next
                if (tahap === 0) {
                  const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ak02'))
                  const nextStep = asesmenSteps[currentStepIndex + 1]
                  navigate(nextStep ? nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`) : `/asesi/asesmen/${id}/selesai`)
                  return
                }
                // If user already signed → navigate to next page
                if (signing.allSigned || (isAsesor ? signing.asesorHasSigned : signing.asesiHasSigned)) {
                  const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ak02'))
                  const nextStep = asesmenSteps[currentStepIndex + 1]
                  if (nextStep) {
                    const nextPath = nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`)
                    navigate(nextPath)
                  } else {
                    navigate(`/asesi/asesmen/${id}/selesai`)
                  }
                  return
                }

                if (!signing.agreedChecklist) {
                  showWarning('Silakan centang pernyataan terlebih dahulu')
                  return
                }

                if (isKompeten === null) {
                  showWarning('Silakan pilih rekomendasi (Kompeten / Belum kompeten)')
                  return
                }

                if (!id) {
                  showWarning('ID tidak ditemukan')
                  return
                }

                setIsSaving(true)
                try {
                  const token = localStorage.getItem("access_token")

                  // Prepare answers array
                  const answers = unitKompetensi.map((unit) => ({
                    id_unit_kompetensi: unit.id,
                    observasi: evidenceChecks[unit.id]?.observasi || false,
                    portofolio: evidenceChecks[unit.id]?.portofolio || false,
                    pertanyaan_wawancara: evidenceChecks[unit.id]?.pertanyaan_wawancara || false,
                    pertanyaan_lisan: evidenceChecks[unit.id]?.pertanyaan_lisan || false,
                    pertanyaan_tertulis: evidenceChecks[unit.id]?.pertanyaan_tertulis || false,
                    proyek_kerja: evidenceChecks[unit.id]?.proyek_kerja || false,
                    lainnya: evidenceChecks[unit.id]?.lainnya || false,
                  }))

                  const response = await fetch(`${API_BASE_URL}/asesmen/${id}/ak02`, {
                    method: 'POST',
                    headers: {
                      "Accept": "application/json",
                      "Authorization": `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      answers,
                      is_kompeten: isKompeten,
                      tindak_lanjut: tindakLanjut,
                      komentar: komentar,
                    }),
                  })

                  if (response.ok) {
                    showSuccess('AK 02 berhasil disimpan!')

                    // Update state directly from response
                    const result: Ak02Response = await response.json()
                    if (result.data) {
                      if (result.data.barcodes) {
                        setBarcodes({
                          asesi: result.data.barcodes.asesi,
                          asesor1: result.data.barcodes.asesor1,
                          asesor2: result.data.barcodes.asesor2,
                        })
                      }
                      if (result.data.is_kompeten !== undefined) setIsKompeten(result.data.is_kompeten)
                      if (result.data.tindak_lanjut !== undefined) setTindakLanjut(result.data.tindak_lanjut)
                      if (result.data.komentar !== undefined) setKomentar(result.data.komentar)
                    }

                    // Generate QR via hook
                    await signing.generateQR()
                    signing.publishUpdate()
                  } else {
                    const msg = await extractApiError(response, 'Gagal menyimpan data. Silakan coba lagi.')
                    showError(msg)
                  }
                } catch (err) {
                  console.error('Error saving AK02:', err)
                  showError(extractErrorMessage(err, 'Terjadi kesalahan. Silakan coba lagi.'))
                } finally {
                  setIsSaving(false)
                }
              }}
            >
              {isSaving ? "Menyimpan..." : signing.buttonText}
            </ActionButton>
          </div>
        </div>
      </ModularAsesiLayout>

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
