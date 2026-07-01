import { useState, useEffect, Fragment, useCallback, useMemo, useRef } from "react"
import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
import { useNavigate, useParams } from "react-router-dom"
import ModularAsesiLayout from "@/components/ModularAsesiLayout"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/ToastContext"
import { extractErrorMessage, extractApiError } from "@/lib/error-utils"
import { useDataDokumenAsesmen } from "@/hooks/useDataDokumenAsesmen"
import { useDataDokumenPraAsesmen } from "@/hooks/useDataDokumenPraAsesmen"
import { useAsesorRole } from "@/hooks/useAsesorRole"
import { useKegiatanByRole } from "@/hooks/useKegiatanByRole"
import { useAbsenCheck } from "@/hooks/useAbsenCheck"
import { useSigningState, BarcodeState } from "@/hooks/useSigningState"
import { getAsesmenSteps } from "@/lib/asesmen-steps"
import { CustomCheckbox } from "@/components/ui/Checkbox"
import { ActionButton } from "@/components/ui/ActionButton"
import { WebcamModal } from "@/components/ui/WebcamModal"
import { FullPageLoader } from "@/components/ui/loading-spinner"
import { API_BASE_URL } from "@/config/api"

interface BarcodeData {
  url: string
  tanggal: string
  nama: string
}

interface Soal {
  id: number
  no: string
  jenis: string
  id_kelompok: number
  soal: string
  tanggapan: string | null
  pencapaian: boolean | null
  id_unitkompetensi: number
  unitkompetensi: {
    id: number
    kode: string
  }
  kuk: {
    id: number
    kode: string
  }
  subunitkompetensi: {
    id: number
    kode: string
  }
}

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
  soal: Soal[]
}

interface Ia03Response {
  message: string
  data: {
    barcodes?: {
      asesi?: BarcodeData
      asesor1?: BarcodeData | null
      asesor2?: BarcodeData | null
    }
    kelompok_kerja: {
      id: number
      kode: string
      nama_dokumen: string
      kelompok_kerja: KelompokKerja[]
    }
    umpan_balik: string
  }
}

export default function Ia03Page() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { id } = useParams<{ id?: string }>()
  const { jenjang, metode, jabatanKerja, nomorSkema, tuk, asesorList, namaAsesi, tanggalUji, namaPenyusun, namaValidator, tanggalPenyusun, tanggalValidator, barcodePenyusun, barcodeValidator, noregPenyusun, noregValidator, jadwalId } = useDataDokumenAsesmen(id)
  const { tahap } = useDataDokumenPraAsesmen(id)
  const { role: asesorRole, isAsesor1, isAsesor2 } = useAsesorRole(id)
  const { showSuccess, showWarning, showError } = useToast()
  const { kegiatan: _kegiatan, isAsesor } = useKegiatanByRole()

  // Get dynamic steps
  const asesmenSteps = useMemo(() => getAsesmenSteps(jenjang, isAsesor, asesorRole, asesorList.length, metode, tahap), [jenjang, isAsesor, asesorRole, asesorList.length, metode, tahap])

  // Asesor-only editable (asesi read-only)
  const isFormDisabledBase = !isAsesor1 && !isAsesor2

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

  const [barcodes, setBarcodes] = useState<{
    asesi?: BarcodeData
    asesor1?: BarcodeData | null
    asesor2?: BarcodeData | null
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [kelompokKerjaData, setKelompokKerjaData] = useState<KelompokKerja[]>([])
  const [umpanBalik, setUmpanBalik] = useState('')
  const [tanggapanAnswers, setTanggapanAnswers] = useState<Record<number, string>>({})
  const [pencapaianAnswers, setPencapaianAnswers] = useState<Record<number, boolean | null>>({})
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [dokumenId, setDokumenId] = useState<number | null>(null)
  const textareaRefs = useRef<Record<number, HTMLTextAreaElement>>({})
  const umpanBalikRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea function
  const autoResizeTextarea = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [])

  // Handle tanggapan change with auto-resize
  const handleTanggapanChange = useCallback((soalId: number, value: string) => {
    setTanggapanAnswers(prev => ({ ...prev, [soalId]: value }))
  }, [])

  // Handle pencapaian change (Ya/Tidak checkbox)
  const handlePencapaianChange = useCallback((soalId: number, value: boolean) => {
    setPencapaianAnswers(prev => ({ ...prev, [soalId]: value }))
  }, [])

  // Handle umpan balik change with auto-resize
  const handleUmpanBalikChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUmpanBalik(e.target.value)
    autoResizeTextarea(e)
  }, [autoResizeTextarea])

  // Memoized kelompok kerja data to prevent re-renders
  const memoizedKelompokKerja = useMemo(() => kelompokKerjaData, [kelompokKerjaData])

  // Fetch IA03 data
  const initialFetchDone = useRef(false)

  const fetchData = useCallback(async () => {
      if (authLoading) return

      if (!id) {
        console.error("No id_izin found")
        return
      }

      try {
        const token = localStorage.getItem("access_token")
        const response = await fetch(`${API_BASE_URL}/asesmen/${id}/ia03`, {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const result: Ia03Response = await response.json()
          if (result.message === "Success" && result.data?.kelompok_kerja) {
            // Set barcodes
            if (result.data.barcodes) {
              setBarcodes({
                asesi: result.data.barcodes.asesi,
                asesor1: result.data.barcodes.asesor1,
                asesor2: result.data.barcodes.asesor2,
              })
            }

            // Set dokumen_id
            setDokumenId(result.data.kelompok_kerja.id)

            // Set kelompok kerja data
            setKelompokKerjaData(result.data.kelompok_kerja.kelompok_kerja)

            // Set umpan balik
            if (result.data.umpan_balik) {
              setUmpanBalik(result.data.umpan_balik)
            }

            // Initialize tanggapan answers from API
            const answers: Record<number, string> = {}
            const pencapaian: Record<number, boolean | null> = {}
            result.data.kelompok_kerja.kelompok_kerja.forEach((kelompok) => {
              kelompok.soal.forEach((soal) => {
                if (soal.tanggapan) {
                  answers[soal.id] = soal.tanggapan
                }
                if (soal.pencapaian !== null) {
                  pencapaian[soal.id] = soal.pencapaian
                }
              })
            })
            setTanggapanAnswers(answers)
            setPencapaianAnswers(pencapaian)
          }
        }
      } catch (err) {
        console.error("Error fetching IA03:", err)
      } finally {
        setIsDataLoading(false)
      }
  }, [id, authLoading])

  useEffect(() => {
    if (initialFetchDone.current) return
    initialFetchDone.current = true
    fetchData()
  }, [fetchData])

  const nextStepLabel = asesmenSteps[asesmenSteps.findIndex(s => s.href.includes('ia03')) + 1]?.label

  const signing = useSigningState({
    pageKey: 'ia03',
    nextPageName: nextStepLabel,
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
    onRefresh: fetchData,
  })


  const isFormDisabled = isFormDisabledBase || signing.allSigned

  // Auto-resize textareas when data is loaded
  useEffect(() => {
    if (tanggapanAnswers) {
      // Resize tanggapan textareas
      Object.keys(tanggapanAnswers).forEach((soalId) => {
        const textarea = textareaRefs.current[parseInt(soalId)]
        if (textarea) {
          textarea.style.height = 'auto'
          textarea.style.height = `${textarea.scrollHeight}px`
        }
      })
    }
  }, [tanggapanAnswers])

  const handleNext = async () => {
    if (tahap === 0) {
      const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ia03'))
      const nextStep = asesmenSteps[currentStepIndex + 1]
      navigate(nextStep ? nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`) : `/asesi/asesmen/${id}/selesai`)
      return
    }
    if (signing.allSigned) {
      const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ia03'))
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

    // Guard: asesi cannot submit until all asesor have signed
    if (!isAsesor && !signing.allAsesorSigned) {
      showWarning(`Menunggu tanda tangan: ${signing.missingLabels.join(', ')}`)
      return
    }

    if (!id || !dokumenId) {
      showWarning('Data tidak lengkap')
      return
    }

    setIsSaving(true)

    try {
      const token = localStorage.getItem("access_token")

      // Build answers array from tanggapanAnswers and pencapaianAnswers
      const answers = kelompokKerjaData.flatMap((kelompok) =>
        kelompok.soal.map((soal) => ({
          soal_id: soal.id,
          tanggapan: tanggapanAnswers[soal.id] || soal.tanggapan || '',
          pencapaian: pencapaianAnswers[soal.id] ?? soal.pencapaian ?? false
        }))
      )

      const is_kompeten = answers.length > 0 && answers.every(a => a.pencapaian === true)
      const payload = {
        dokumen_id: dokumenId,
        answers,
        umpan_balik: umpanBalik,
        is_kompeten,
      }

      const response = await fetch(`${API_BASE_URL}/asesmen/${id}/ia03`, {
        method: 'POST',
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        showSuccess('IA.03 berhasil disimpan!')

        await signing.generateQR()
      } else {
        const msg = await extractApiError(response, 'Gagal menyimpan data. Silakan coba lagi.')
        showError(msg)
      }
    } catch (err) {
      console.error('Error saving IA03:', err)
      showError(extractErrorMessage(err, 'Terjadi kesalahan. Silakan coba lagi.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    navigate(`/asesi/asesmen/${id}/ia02`)
  }

  if (isDataLoading) return <FullPageLoader text="Memuat data..." />

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>

      <AsesmenBreadcrumb currentPage="IA.03" />

      <ModularAsesiLayout currentStep={asesmenSteps.find(s => s.href.includes('ia03'))?.number || 3} steps={asesmenSteps} id={id} metode={metode}>
        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', marginBottom: '4px', letterSpacing: '1px' }}>
            FR.IA.03. &nbsp; PERTANYAAN UNTUK MENDUKUNG OBSERVASI
          </h1>
        </div>

        {/* IDENTITAS Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '13px', background: '#fff', border: '2px solid #000' }}>
          <tbody>
            <tr>
              <td style={{ width: '25%', border: '1px solid #000', padding: '6px' }}>Skema Sertifikasi (̶𝙺̶𝙺̶𝙽̶𝙸̶/Okupasi/̶𝙺̶𝚕̶𝚊̶𝚜̶𝚝̶𝚎̶𝚛̶)</td>
              <td style={{ width: '2%', border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{jabatanKerja || '-'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Judul</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{nomorSkema || '-'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>TUK</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{tuk || '-'}</td>
            </tr>
            {asesorList.length > 1 ? (
              asesorList.map((asesor, idx) => (
                <tr key={asesor.id}>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>Nama Asesor {idx + 1}</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>
                    {asesor.nama?.toUpperCase() || ''}{asesor.noreg && ` (${asesor.noreg})`}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px' }}>Nama Asesor</td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
                <td style={{ border: '1px solid #000', padding: '6px' }}>
                  {asesorList[0]?.nama?.toUpperCase() || ''}{asesorList[0]?.noreg && ` (${asesorList[0].noreg})`}
                </td>
              </tr>
            )}
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Nama Asesi</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{namaAsesi?.toUpperCase() || user?.name?.toUpperCase() || '-'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Tanggal</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>{tanggalUji ? new Date(tanggalUji).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</td>
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
              <li>Formulir ini diisi oleh asesor kompetensi sebelum, pada saat atau setelah melakukan asesmen metode observasi demonstrasi.</li>
              <li>Pertanyaan dibuat dengan tujuan untuk menggali, dapat berisi pertanyaan yang berkaitan dengan dimensi kompetensi.</li>
              <li>Jika pertanyaan disampaikan sebelum asesmen melakukan praktik demonstrasi, maka pertanyaan dibuat berkaitan dengan aspek K3L, SOP, penggunaan peralatan.</li>
              <li>Jika setelah asesmen dilakukan praktik, maka pertanyaan pendukung observasi dapat dilakukan secara lisan.</li>
              <li>Tanggapan asesi ditulis pada kolom tanggapan.</li>
            </ul>
          </div>
        </div>

        {/* KELOMPOK KERJA */}
        {memoizedKelompokKerja.map((kelompok) => (
          <div key={kelompok.id} style={{ marginBottom: '15px' }}>
            {/* Units Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', background: '#fff', border: '2px solid #000' }}>
              <thead>
                <tr style={{ background: '#c40000', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                  <th style={{ width: '18%', border: '1px solid #000', padding: '6px' }}>Kelompok Pekerjaan {kelompok.urut}</th>
                  <th style={{ width: '5%', border: '1px solid #000', padding: '6px' }}>No</th>
                  <th style={{ width: '20%', border: '1px solid #000', padding: '6px' }}>Kode Unit</th>
                  <th style={{ border: '1px solid #000', padding: '6px' }}>Judul Unit</th>
                </tr>
              </thead>
              <tbody>
                {kelompok.units.map((unit, index) => (
                  <tr key={unit.id_unit}>
                    {index === 0 && (
                      <td rowSpan={kelompok.units.length} style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'top' }}></td>
                    )}
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>{unit.kode_unit}</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>{unit.nama_unit}</td>
                  </tr>
                ))}
              </tbody>
            </table><br />

            {/* Questions Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '-1px', fontSize: '13px', background: '#fff', border: '2px solid #000' }}>
              <thead>
                <tr style={{ background: '#c40000', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                  <th style={{ border: '1px solid #000', padding: '6px' }}>Pertanyaan</th>
                  <th style={{ width: '10%', border: '1px solid #000', padding: '6px' }}>Ya</th>
                  <th style={{ width: '10%', border: '1px solid #000', padding: '6px' }}>Tidak</th>
                </tr>
              </thead>
              <tbody>
                {kelompok.soal.map((soal) => (
                  <Fragment key={soal.id}>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>
                        {soal.no}. {soal.soal}
                        <br /><br />
                        <span style={{ fontSize: '11px' }}>Uk.{soal.unitkompetensi.kode} EK.{soal.subunitkompetensi.kode} KUK.{soal.kuk.kode}</span>
                      </td>
                      <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px' }}>
                        <CustomCheckbox
                          checked={pencapaianAnswers[soal.id] === true}
                          onChange={() => handlePencapaianChange(soal.id, true)}
                          disabled={isFormDisabled}
                          style={{ cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}
                        />
                      </td>
                      <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px' }}>
                        <CustomCheckbox
                          checked={pencapaianAnswers[soal.id] === false}
                          onChange={() => handlePencapaianChange(soal.id, false)}
                          disabled={isFormDisabled}
                          style={{ cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} style={{ border: '1px solid #000', padding: '6px' }}>
                        <b>Tanggapan:</b>
                        <textarea
                          ref={(el) => {
                            if (el) textareaRefs.current[soal.id] = el
                          }}
                          value={tanggapanAnswers[soal.id] || ''}
                          onChange={(e) => {
                            handleTanggapanChange(soal.id, e.target.value)
                            autoResizeTextarea(e)
                          }}
                          disabled={isFormDisabled}
                          placeholder="Tulis tanggapan..."
                          style={{
                            width: '100%',
                            minHeight: '50px',
                            height: 'auto',
                            border: '1px solid #ccc',
                            padding: '6px',
                            fontSize: '12px',
                            marginTop: '4px',
                            resize: 'none',
                            overflow: 'hidden',
                            cursor: isFormDisabled ? 'not-allowed' : 'text'
                          }}
                        />
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* UMPAN BALIK */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '13px', background: '#fff', border: '2px solid #000' }}>
          <tbody>
            <tr>
              <td style={{ height: '80px', border: '1px solid #000', padding: '6px', verticalAlign: 'top' }}><b>Umpan balik untuk asesi:</b></td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>
                <textarea
                  ref={umpanBalikRef}
                  value={umpanBalik}
                  onChange={handleUmpanBalikChange}
                  disabled={isFormDisabled}
                  placeholder="Tuliskan umpan balik untuk asesi..."
                  style={{
                    width: '100%',
                    minHeight: '70px',
                    height: 'auto',
                    border: '1px solid #ccc',
                    padding: '6px',
                    fontSize: '12px',
                    resize: 'none',
                    overflow: 'hidden',
                    cursor: isFormDisabled ? 'not-allowed' : 'text'
                  }}
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* TANDA TANGAN Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '13px', background: '#fff', border: '2px solid #000' }}>
          <tbody>
            <tr>
              <td colSpan={3} style={{ background: '#fff', border: '1px solid #000', padding: '6px' }}><b>Asesi</b></td>
            </tr>
            <tr>
              <td style={{ width: '30%', border: '1px solid #000', padding: '6px' }}>Nama Asesi</td>
              <td style={{ width: '2%', border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>: {namaAsesi?.toUpperCase() || user?.name?.toUpperCase() || ''}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Tanda Tangan dan Tanggal</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
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
              <td colSpan={3} style={{ background: '#fff', border: '1px solid #000', padding: '6px' }}><b>Asesor</b></td>
            </tr>
            {asesorList.map((asesor, idx) => {
              const asesorBarcode = idx === 0 ? barcodes?.asesor1 : barcodes?.asesor2
              const label = asesorList.length > 1 ? `Asesor ${idx + 1}` : 'Asesor'
              return (
                <Fragment key={asesor.id}>
                  <tr>
                    <td style={{ width: '30%', border: '1px solid #000', padding: '6px' }}>Nama {label}</td>
                    <td style={{ width: '2%', border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>: {asesor.nama?.toUpperCase() || ''}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>No. Reg{asesorList.length > 1 ? ` ${idx + 1}` : ''}</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>: {asesor.noreg || ''}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>Tanda Tangan dan Tanggal</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
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
                </Fragment>
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
                Saya menyatakan dengan sebenar-benarnya bahwa saya telah memahami instruksi tugas terstruktur dan akan menyelesaikan tugas tersebut sesuai dengan ketentuan yang berlaku.
              </span>
            </label>
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

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            {isAsesor && (
            <ActionButton variant="secondary" onClick={handleBack}>
              Kembali
            </ActionButton>
            )}
            <ActionButton variant="primary" disabled={signing.buttonDisabled} onClick={handleNext}>
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
