import React, { useState, useEffect, useCallback, useMemo } from "react"
import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
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
import { useSigningState, BarcodeState } from "@/hooks/useSigningState"
import { getAsesmenSteps } from "@/lib/asesmen-steps"
import { CustomCheckbox } from "@/components/ui/Checkbox"
import { ActionButton } from "@/components/ui/ActionButton"
import { WebcamModal } from "@/components/ui/WebcamModal"
import { FullPageLoader } from "@/components/ui/loading-spinner"
import { API_BASE_URL } from "@/config/api"

interface Kuk {
  id: number
  nama: string
}

interface Soal {
  id: number
  no: string
  jenis: string
  id_kelompok: number
  penilaian_lanjut: string | null
  pencapaian: boolean | null
  kuk: Kuk
  id_subunitkompetensi: number
}

interface Subunit {
  id: number
  nama: string
  soal: Soal[]
}

interface Unit {
  id_unit: number
  nama_unit: string
  kode_unit: string
  subunits: Subunit[]
}

interface KelompokKerjaItem {
  id: number
  nama: string
  urut: string
  umpan_balik: string | null
  units: Unit[]
}

interface BarcodeData {
  url: string
  tanggal: string
  nama: string
}

interface Ia01Response {
  message: string
  data: {
    barcodes?: {
      asesi?: BarcodeData | null
      asesor1?: BarcodeData | null
      asesor2?: BarcodeData | null
    }
    kelompok_kerja: {
      id: number
      kode: string
      nama_dokumen: string
      kelompok_kerja: KelompokKerjaItem[]
    }
  }
}

interface SoalAnswer {
  pencapaian: boolean | null
  penilaian_lanjut: string | null
}

export default function Ia01Page() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { id } = useParams<{ id?: string }>()
  const { role: asesorRole } = useAsesorRole(id)
  const { jenjang, jabatanKerja, nomorSkema, tuk, asesorList, namaAsesi, tanggalUji, jadwalId, metode } = useDataDokumenAsesmen(id)
  const { tahap } = useDataDokumenPraAsesmen(id)
  const { showSuccess, showError, showWarning } = useToast()
  const { kegiatan: _kegiatan, isAsesor } = useKegiatanByRole()

  // Get dynamic steps
  const asesmenSteps = useMemo(() => getAsesmenSteps(jenjang, isAsesor, asesorRole, asesorList.length, metode, tahap), [jenjang, isAsesor, asesorRole, asesorList.length, metode, tahap])

  // All asesor can fill (removed restriction to asesor_1 only)
  const isFormDisabledBase = !isAsesor

  // Absen check
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
  const [soalAnswers, setSoalAnswers] = useState<Record<number, SoalAnswer>>({})
  const [umpanBalik, setUmpanBalik] = useState('')
  const [barcodes, setBarcodes] = useState<{
    asesi?: BarcodeData | null
    asesor1?: BarcodeData | null
    asesor2?: BarcodeData | null
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedKelompok, setExpandedKelompok] = useState<Set<number>>(new Set())
  const [dokumenId, setDokumenId] = useState<number | null>(null)
  const [kelompokKerjaData, setKelompokKerjaData] = useState<KelompokKerjaItem[]>([])

  // Toggle kelompok expansion
  const toggleKelompok = (kelompokId: number) => {
    setExpandedKelompok(prev => {
      const next = new Set(prev)
      if (next.has(kelompokId)) {
        next.delete(kelompokId)
      } else {
        next.add(kelompokId)
      }
      return next
    })
  }

  // Fetch IA01 data
  const fetchIa01Data = useCallback(async () => {
    if (authLoading) return

    if (!id) {
      console.error("No id_izin found")
      return
    }

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/asesmen/${id}/ia01`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result: Ia01Response = await response.json()
        if (result.message === "Success" && result.data?.kelompok_kerja) {
          // Set barcodes
          if (result.data.barcodes) {
            setBarcodes({
              asesi: result.data.barcodes.asesi,
              asesor1: result.data.barcodes.asesor1,
              asesor2: result.data.barcodes.asesor2,
            })
          }

          // Set dokumen_id (handle both nested and flat structure)
          let dokumenIdValue: number | null = null
          const kk = result.data.kelompok_kerja
          if (kk) {
            if ('id' in kk && typeof kk.id === 'number') {
              dokumenIdValue = kk.id
            } else if (Array.isArray(kk) && kk.length > 0) {
              const first = kk[0] as { id?: number }
              dokumenIdValue = first?.id ?? null
            }
          }
          setDokumenId(dokumenIdValue)

          // Set kelompok kerja data (handle both nested and flat API structure)
          let kelompokData: KelompokKerjaItem[] = []
          const kkData = result.data.kelompok_kerja
          if (kkData) {
            if ('kelompok_kerja' in kkData && Array.isArray((kkData as { kelompok_kerja: KelompokKerjaItem[] }).kelompok_kerja)) {
              kelompokData = (kkData as { kelompok_kerja: KelompokKerjaItem[] }).kelompok_kerja
            } else if (Array.isArray(kkData)) {
              kelompokData = kkData as KelompokKerjaItem[]
            }
          }
          setKelompokKerjaData(kelompokData)

          // Initialize answers and feedback from existing data
          const answers: Record<number, SoalAnswer> = {}
          let firstUmpanBalik = ''

          // Handle both nested and flat API structure for iteration
          const kelompokList = result.data.kelompok_kerja?.kelompok_kerja || result.data.kelompok_kerja || []
          ;(Array.isArray(kelompokList) ? kelompokList : []).forEach((kelompok) => {
            // Get first feedback as the main umpan balik
            if (!firstUmpanBalik && kelompok.umpan_balik) {
              firstUmpanBalik = kelompok.umpan_balik
            }

            // Set answers from soal
            kelompok.units.forEach((unit) => {
              unit.subunits.forEach((subunit) => {
                subunit.soal.forEach((soal) => {
                  answers[soal.id] = {
                    pencapaian: soal.pencapaian,
                    penilaian_lanjut: soal.penilaian_lanjut,
                  }
                })
              })
            })
          })

          setSoalAnswers(answers)
          setUmpanBalik(firstUmpanBalik)

          // Expand all by default
          const kelompokForExpand = result.data.kelompok_kerja?.kelompok_kerja || result.data.kelompok_kerja || []
          setExpandedKelompok(new Set((Array.isArray(kelompokForExpand) ? kelompokForExpand : []).map(k => k.id)))
        }
      }
    } catch (err) {
      console.error("Error fetching IA01:", err)
    }
  }, [id, authLoading])

  useEffect(() => { fetchIa01Data() }, [fetchIa01Data])

  const ia01NextStepLabel = asesmenSteps[asesmenSteps.findIndex(s => s.href.includes('ia01')) + 1]?.label

  const signing = useSigningState({
    pageKey: 'ia01',
    nextPageName: ia01NextStepLabel,
    isAsesor,
    tahap,
    barcodes: barcodes as unknown as BarcodeState | null,
    setBarcodes: setBarcodes as unknown as React.Dispatch<React.SetStateAction<BarcodeState | null>>,
    asesorList,
    userId: user?.id,
    userName: user?.name,
    isSaving,
    idIzin: id,
    jadwalId,
    onRefresh: fetchIa01Data,
  })


  const isFormDisabled = isFormDisabledBase || signing.allSigned

  const handlePencapaianChange = (soalId: number, value: boolean) => {
    setSoalAnswers(prev => ({
      ...prev,
      [soalId]: {
        ...prev[soalId],
        pencapaian: value
      }
    }))
  }

  const handlePenilaianLanjutChange = (soalId: number, value: string) => {
    setSoalAnswers(prev => ({
      ...prev,
      [soalId]: {
        ...prev[soalId],
        penilaian_lanjut: value
      }
    }))
  }

  const handleFeedbackChange = (value: string) => {
    setUmpanBalik(value)
  }

  if (!kelompokKerjaData.length) return <FullPageLoader text="Memuat data..." />

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>

      <AsesmenBreadcrumb currentPage="IA.01" />

      <ModularAsesiLayout currentStep={asesmenSteps.find(s => s.href.includes('ia01'))?.number || 1} steps={asesmenSteps} id={id} metode={metode}>
        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', marginBottom: '4px', letterSpacing: '1px' }}>
            FR.IA.01. &nbsp; CEKLIS OBSERVASI AKTIVITAS DITEMPAT KERJA ATAU TEMPAT KERJA SIMULASI
          </h1>
        </div>

        {/* IDENTITAS Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '13px', background: '#fff', border: '2px solid #000' }}>
          <tbody>
            <tr>
              <td rowSpan={2} style={{ width: '30%', border: '1px solid #000', padding: '6px' }}>Skema Sertifikasi (̶𝙺̶𝙺̶𝙽̶𝙸̶/Okupasi/̶𝙺̶𝚕̶𝚊̶𝚜̶𝚝̶𝚎̶𝚛̶)̶</td>
              <td style={{ width: '12%', border: '1px solid #000', padding: '6px' }}>Judul</td>
              <td style={{ width: '3%', border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
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
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>Mulai :</td>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>{tanggalUji ? new Date(tanggalUji).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>Selesai :</td>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>{tanggalUji ? new Date(tanggalUji).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</td>
            </tr>
          </tbody>
        </table>

        {/* PANDUAN BAGI ASESOR */}
        <div style={{ marginBottom: '15px', border: '2px solid #000', background: '#fff' }}>
          <div style={{ background: '#c40000', color: '#fff', padding: '6px', fontWeight: 'bold', fontSize: '13px' }}>
            PANDUAN BAGI ASESOR
          </div>
          <div style={{ padding: '10px', fontSize: '12px' }}>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Lengkapi nama unit kompetensi, elemen, dan kriteria unjuk kerja sesuai kolom dalam tabel.</li>
              <li>Isi standar industri atau tempat kerja.</li>
              <li>Beri tanda centang (✓) pada kolom "YA" jika asesi kompeten, dan "Tidak" jika sebaliknya.</li>
              <li>Penilaian lanjut diisi bila hasil belum dapat disimpulkan.</li>
              <li>Isi kolom KUK sesuai SKKNI.</li>
            </ul>
          </div>
        </div>

        {/* KELOMPOK PEKERJAAN */}
        {kelompokKerjaData.map((kelompok) => (
          <div key={kelompok.id} style={{ marginBottom: '15px' }}>
            {/* Kelompok Header */}
            <div
              onClick={() => toggleKelompok(kelompok.id)}
              style={{
                background: '#c40000',
                color: '#fff',
                padding: '10px 12px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                userSelect: 'none'
              }}
            >
              <span>Kelompok Pekerjaan {kelompok.urut}</span>
              <span style={{ fontSize: '16px' }}>{expandedKelompok.has(kelompok.id) ? '▼' : '▶'}</span>
            </div>

            {expandedKelompok.has(kelompok.id) && (
              <>
              <br />
                {/* Units Table - Header */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', background: '#fff', border: '2px solid #000', borderTop: 'none' }}>
                  <thead>
                    <tr style={{ background: '#c40000', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                      <th style={{ width: '20%', border: '1px solid #000', padding: '6px' }}>Kelompok Pekerjaan {kelompok.urut}</th>
                      <th style={{ width: '5%', border: '1px solid #000', padding: '6px' }}>No</th>
                      <th style={{ width: '20%', border: '1px solid #000', padding: '6px' }}>Kode Unit</th>
                      <th style={{ border: '1px solid #000', padding: '6px' }}>Judul Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kelompok.units
                      .filter((unit) => unit.subunits.some((subunit) => subunit.soal.length > 0))
                      .map((unit, index) => (
                      <tr key={unit.id_unit}>
                        {index === 0 && (
                          <td rowSpan={kelompok.units.filter((u) => u.subunits.some((s) => s.soal.length > 0)).length} style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                            {kelompok.nama}
                          </td>
                        )}
                        <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                          {index + 1}
                        </td>
                        <td style={{ border: '1px solid #000', padding: '6px' }}>{unit.kode_unit}</td>
                        <td style={{ border: '1px solid #000', padding: '6px' }}>{unit.nama_unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <br/>
                {/* Observation Table - per unit */}
                {kelompok.units
                  .filter((unit) => unit.subunits.some((subunit) => subunit.soal.length > 0))
                  .map((unit, filteredIndex) => (
                  <div key={unit.id_unit} style={{ marginBottom: '15px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', background: '#fff', border: '2px solid #000' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '20%', border: '1px solid #000', padding: '6px', background: '#fff' }}>Unit Kompetensi {filteredIndex + 1}</td>
                          <td style={{ width: '2%', border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
                          <td style={{ border: '1px solid #000', padding: '6px' }}>{unit.kode_unit}</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '6px', background: '#fff' }}>Judul Unit</td>
                          <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
                          <td style={{ border: '1px solid #000', padding: '6px' }}>{unit.nama_unit}</td>
                        </tr>
                      </tbody>
                    </table>
                    <br/>
                    {/* Soal Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', background: '#fff', border: '2px solid #000', borderTop: 'none' }}>
                      <thead>
                        <tr style={{ background: '#c40000', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                          <th rowSpan={2} style={{ width: '5%', border: '1px solid #000', padding: '6px' }}>No</th>
                          <th rowSpan={2} style={{ width: '20%', border: '1px solid #000', padding: '6px' }}>Elemen</th>
                          <th rowSpan={2} style={{ width: '35%', border: '1px solid #000', padding: '6px' }}>Kriteria Unjuk Kerja</th>
                          <th rowSpan={2} style={{ width: '15%', border: '1px solid #000', padding: '6px' }}>Standar Industri / Tempat Kerja</th>
                          <th colSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>Pencapaian</th>
                          <th rowSpan={2} style={{ width: '15%', border: '1px solid #000', padding: '6px' }}>Penilaian Lanjut</th>
                        </tr>
                        <tr style={{ background: '#c40000', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                          <th style={{ width: '5%', border: '1px solid #000', padding: '4px' }}>Ya</th>
                          <th style={{ width: '5%', border: '1px solid #000', padding: '4px' }}>Tidak</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unit.subunits.map((subunit) =>
                          subunit.soal.map((soal) => (
                            <tr key={soal.id}>
                              <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px' }}>{soal.no}</td>
                              <td style={{ border: '1px solid #000', padding: '6px' }}>{subunit.nama}</td>
                              <td style={{ border: '1px solid #000', padding: '6px' }}>{soal.kuk.nama}</td>
                              <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px' }}>SKKNI</td>
                              <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px' }}>
                                <CustomCheckbox
                                  checked={soalAnswers[soal.id]?.pencapaian === true}
                                  onChange={() => handlePencapaianChange(soal.id, true)}
                                  disabled={isFormDisabled}
                                  style={{ cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}
                                />
                              </td>
                              <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px' }}>
                                <CustomCheckbox
                                  checked={soalAnswers[soal.id]?.pencapaian === false}
                                  onChange={() => handlePencapaianChange(soal.id, false)}
                                  disabled={isFormDisabled}
                                  style={{ cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}
                                />
                              </td>
                              <td style={{ border: '1px solid #000', padding: '6px' }}>
                                <input
                                  type="text"
                                  value={soalAnswers[soal.id]?.penilaian_lanjut || ''}
                                  onChange={(e) => handlePenilaianLanjutChange(soal.id, e.target.value)}
                                  disabled={isFormDisabled}
                                  style={{
                                    width: '100%',
                                    border: '1px solid #ccc',
                                    padding: '4px',
                                    fontSize: '12px',
                                    cursor: isFormDisabled ? 'not-allowed' : 'text'
                                  }}
                                  placeholder="Isi penilaian lanjut..."
                                />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                ))}
              </>
            )}
          </div>
        ))}

        {/* UMPAN BALIK - Single at the end */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '13px', background: '#fff', border: '2px solid #000' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                <b>Umpan Balik untuk asesi:</b>
                <br />
                <textarea
                  value={umpanBalik}
                  onChange={(e) => handleFeedbackChange(e.target.value)}
                  disabled={isFormDisabled}
                  style={{
                    width: '100%',
                    minHeight: '70px',
                    border: '1px solid #ccc',
                    padding: '6px',
                    fontSize: '12px',
                    resize: 'vertical',
                    cursor: isFormDisabled ? 'not-allowed' : 'text',
                    marginTop: '8px'
                  }}
                  placeholder="Tuliskan umpan balik untuk asesi..."
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* REKOMENDASI & TTD Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '13px', background: '#fff', border: '2px solid #000' }}>
          <tbody>
            <tr>
              <td style={{ background: '#fff', border: '1px solid #000', padding: '6px' }}><b>Rekomendasi:</b></td>
              <td colSpan={2} style={{ background: '#fff', border: '1px solid #000', padding: '6px' }}><b>Asesi</b></td>
            </tr>
            <tr>
              <td rowSpan={3 + 3 * asesorList.length} style={{ width: '50%', border: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px', cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}>
                  <CustomCheckbox
                    checked={Object.values(soalAnswers).every(a => a.pencapaian === true)}
                    onChange={() => {}}
                    disabled={isFormDisabled}
                    style={{ marginTop: '2px' }}
                  />
                  <span style={{ fontSize: '12px' }}>Asesi telah memenuhi pencapaian seluruh kriteria unjuk kerja, direkomendasikan <b>KOMPETEN</b>.</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}>
                  <CustomCheckbox
                    checked={Object.values(soalAnswers).some(a => a.pencapaian === false)}
                    onChange={() => {}}
                    disabled={isFormDisabled}
                    style={{ marginTop: '2px' }}
                  />
                  <span style={{ fontSize: '12px' }}>Asesi belum memenuhi pencapaian seluruh kriteria unjuk kerja, direkomendasikan <b>BELUM KOMPETEN</b>.</span>
                </label>
              </td>
              <td style={{ width: '15%', border: '1px solid #000', padding: '6px' }}>Nama</td>
              <td style={{ width: '35%', border: '1px solid #000', padding: '6px' }}>: {namaAsesi?.toUpperCase() || user?.name?.toUpperCase() || ''}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Tanda tangan / Tanggal</td>
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
            <tr>
              <td colSpan={2} style={{ background: '#fff', border: '1px solid #000', padding: '6px' }}><b>Asesor</b></td>
              <td></td>
            </tr>
            {asesorList.map((asesor, idx) => {
              const asesorBarcode = idx === 0 ? barcodes?.asesor1 : barcodes?.asesor2
              const label = asesorList.length > 1 ? `Asesor ${idx + 1}` : 'Asesor'
              return (
                <React.Fragment key={asesor.id}>
                  <tr>
                    <td style={{ width: '15%', border: '1px solid #000', padding: '6px' }}>Nama {label}</td>
                    <td style={{ width: '35%', border: '1px solid #000', padding: '6px' }}>: {asesor.nama?.toUpperCase() || ''}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>No. Reg{asesorList.length > 1 ? ` ${idx + 1}` : ''}</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>: {asesor.noreg || ''}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>Tanda tangan / Tanggal</td>
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

        {/* Actions */}
        <div style={{ marginTop: '20px' }}>
          {/* Pernyataan Checkbox */}
          {!signing.allSigned && (
          <div style={{ background: '#fff', border: '1px solid #999', borderRadius: '4px', padding: '16px', marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <CustomCheckbox
                checked={signing.agreedChecklist}
                onChange={() => signing.setAgreedChecklist(!signing.agreedChecklist)}
                disabled={signing.allSigned}
                style={{ marginTop: '2px' }}
              />
              <span style={{ fontSize: '13px', color: '#333' }}>
                Saya menyatakan dengan sebenar-benarnya bahwa hasil penilaian observasi ini telah saya isi dengan jujur dan dapat dipertanggungjawabkan.
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
                  const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ia01'))
                  const prevStep = asesmenSteps[currentStepIndex - 1]
                  if (prevStep) {
                    const prevPath = prevStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`)
                    navigate(prevPath)
                  } else {
                    navigate(isAsesor ? "/asesor/dashboard" : "/asesi/dashboard")
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
                if (tahap === 0) {
                  const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ia01'))
                  const nextStep = asesmenSteps[currentStepIndex + 1]
                  navigate(nextStep ? nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`) : `/asesi/asesmen/${id}/selesai`)
                  return
                }
                if (signing.allSigned) {
                  const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ia01'))
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

                if (!id || !dokumenId) {
                  showWarning('Data tidak lengkap')
                  return
                }

                setIsSaving(true)

                try {
                  const token = localStorage.getItem("access_token")

                  // Prepare answers array - filter out answers with pencapaian = null
                  const answers = Object.entries(soalAnswers)
                    .filter(([, answer]) => answer.pencapaian !== null)
                    .map(([soalId, answer]) => ({
                      soal_id: parseInt(soalId),
                      penilaian_lanjut: answer.penilaian_lanjut?.trim() || null,
                      pencapaian: answer.pencapaian
                    }))

                  // Prepare feedback array - use same umpan balik for all kelompoks
                  const feedback = kelompokKerjaData.map((kelompok) => ({
                    kelompok_id: kelompok.id,
                    umpan_balik: umpanBalik
                  }))

                  const is_kompeten = answers.length > 0 && answers.every(a => a.pencapaian === true)

                  const payload = {
                    dokumen_id: dokumenId,
                    answers,
                    feedback,
                    is_kompeten,
                  }

                  console.log('Sending IA01 payload:', payload)

                  const response = await fetch(`${API_BASE_URL}/asesmen/${id}/ia01`, {
                    method: 'POST',
                    headers: {
                      "Accept": "application/json",
                      "Authorization": `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                  })

                  if (response.ok) {
                    showSuccess('IA 01 berhasil disimpan!')

                    await signing.generateQR()
                  } else {
                    const msg = await extractApiError(response, 'Gagal menyimpan data. Silakan coba lagi.')
                    showError(msg)
                  }
                } catch (err) {
                  console.error('Error saving IA01:', err)
                  showError(extractErrorMessage(err, 'Terjadi kesalahan. Silakan coba lagi.'))
                } finally {
                  setIsSaving(false)
                }
              }}
            >
              {signing.buttonText}
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
