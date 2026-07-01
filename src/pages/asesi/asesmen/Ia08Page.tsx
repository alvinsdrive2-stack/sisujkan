import { useState, useEffect, useCallback, useMemo } from "react"
import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
import { useNavigate, useParams } from "react-router-dom"
import ModularAsesiLayout from "@/components/ModularAsesiLayout"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/ToastContext"
import { extractErrorMessage, extractApiError } from "@/lib/error-utils"
import { useDataDokumenAsesmen } from "@/hooks/useDataDokumenAsesmen"
import { useDataDokumenPraAsesmen } from "@/hooks/useDataDokumenPraAsesmen"
import { useKegiatanByRole } from "@/hooks/useKegiatanByRole"
import { useAbsenCheck } from "@/hooks/useAbsenCheck"
import { getAsesmenSteps } from "@/lib/asesmen-steps"
import { CustomCheckbox } from "@/components/ui/Checkbox"
import { ActionButton } from "@/components/ui/ActionButton"
import { WebcamModal } from "@/components/ui/WebcamModal"
import { useSigningState, BarcodeState } from "@/hooks/useSigningState"
import { FullPageLoader } from "@/components/ui/loading-spinner"
import { API_BASE_URL } from "@/config/api"

interface BarcodeData {
  url: string
  tanggal: string
  nama: string
}

interface Ia08File {
  id: number
  original_name: string
  path: string
  filetype: string | null
  answer: {
    valid: boolean | null
    asli: boolean | null
    terkini: boolean | null
    memadai: boolean | null
  } | null
}

interface WawancaraItem {
  id: number
  unit_kompetensi: string
  no_elemen: number
  materi: string
  checked: boolean
}

interface Ia08Referensi {
  id: number
  nama: string
  id_kelompok: number
  id_kategori: number | null
  id_subkategori: number | null
  kategori_rel: { id: number; nama: string; no: string } | null
  kelompok_rel: { id: number; kategori: string; no: string; urut: number; nama: string | null }
  subkategori_rel: { id: number; nama: string; no: string } | null
}


export default function Ia08Page() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { id } = useParams<{ id?: string }>()
  const { jenjang, metode, jabatanKerja, nomorSkema, tuk, asesorList, namaAsesi, tanggalUji, jadwalId } = useDataDokumenAsesmen(id)
  const { tahap } = useDataDokumenPraAsesmen(id)
  const { showSuccess, showError, showWarning } = useToast()
  const { kegiatan: _kegiatan, isAsesor } = useKegiatanByRole()

  const asesmenSteps = useMemo(() => getAsesmenSteps(jenjang, isAsesor, undefined, asesorList.length, metode, tahap), [jenjang, isAsesor, asesorList.length, metode, tahap])

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

  const [wawancaraItems, setWawancaraItems] = useState<WawancaraItem[]>([
    { id: 1, unit_kompetensi: 'F.41BPC00.001.2', no_elemen: 1, materi: 'Ketentuan terkait tugas perencanaan', checked: false },
    { id: 2, unit_kompetensi: 'F.41BPC00.002.2', no_elemen: 2, materi: 'Lokasi kerja dan gambar rencana', checked: false },
    { id: 3, unit_kompetensi: 'F.41BPC00.003.2', no_elemen: 3, materi: 'Detail sambungan rencana', checked: false },
    { id: 4, unit_kompetensi: 'F.41BPC00.004.2', no_elemen: 2, materi: 'Produktivitas kerja', checked: false },
    { id: 5, unit_kompetensi: 'F.41BPC00.005.2', no_elemen: 5, materi: 'Spesifikasi teknis mutu', checked: false },
  ])

  const [buktiTambahan, setBuktiTambahan] = useState('')
  const [rekomendasiKompeten, setRekomendasiKompeten] = useState<boolean | null>(null)
  const [rekomendasiUnit, setRekomendasiUnit] = useState('')
  const [rekomendasiElemen, setRekomendasiElemen] = useState('')
  const [rekomendasiKuk, setRekomendasiKuk] = useState('')
  const [barcodes, setBarcodes] = useState<{
    asesi?: BarcodeData | null
    asesor1?: BarcodeData | null
    asesor2?: BarcodeData | null
  } | null>(null)
  const [_ia08Referensi, setIa08Referensi] = useState<Ia08Referensi[]>([])
  const [dokumenId, setDokumenId] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [ia08Files, setIa08Files] = useState<Ia08File[]>([])

  // Extractable fetch function — called on mount and by SSE events
  const fetchIa08Data = useCallback(async () => {
    if (!id || authLoading) return

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/asesmen/${id}/ia08`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.message === "Success" && result.data) {
          // Portfolio: use files directly (each file has answer)
          if (result.data.files) {
            setIa08Files(result.data.files)
          }

          // Map soal.2 (unit/kuk) to wawancara items
          if (result.data.soal?.["2"]) {
            const savedUnit = result.data.unit_answers || {}
            const wawancaraData = result.data.soal["2"].map((item: any, index: number) => ({
              id: item.id || index + 1,
              unit_kompetensi: item.unit?.kode || "-",
              no_elemen: parseInt(item.no) || index + 1,
              materi: item.subunit?.nama || "-",
              checked: savedUnit[String(item.id)] === true,
            }))
            setWawancaraItems(wawancaraData)
          }

          // Set bukti tambahan from recommendation or soal.3
          if (result.data.recommendation?.bukti_tambahan) {
            setBuktiTambahan(result.data.recommendation.bukti_tambahan)
          } else if (result.data.soal?.["3"]?.[0]) {
            setBuktiTambahan(result.data.soal["3"][0].soal || "")
          }

          // Set barcodes if exists
          if (result.data.barcodes) {
            setBarcodes({
              asesi: result.data.barcodes.asesi,
              asesor1: result.data.barcodes.asesor1,
              asesor2: result.data.barcodes.asesor2,
            })
          }

          // Set referensi
          if (result.data.referensi) {
            setIa08Referensi(result.data.referensi)
          }

          // Restore recommendation state
          if (result.data.recommendation) {
            const rec = result.data.recommendation
            if (rec.is_kompeten === true || rec.is_kompeten === false) {
              setRekomendasiKompeten(rec.is_kompeten)
            }
            if (rec.rekomendasi_unit) setRekomendasiUnit(rec.rekomendasi_unit)
            if (rec.rekomendasi_elemen) setRekomendasiElemen(rec.rekomendasi_elemen)
            if (rec.rekomendasi_kuk) setRekomendasiKuk(rec.rekomendasi_kuk)
          }

          // Store dokumen_id for POST
          if (result.data.dokumen?.id) {
            setDokumenId(result.data.dokumen.id)
          } else if (result.data.soal?.["2"]?.[0]?.id_dokumen) {
            setDokumenId(Number(result.data.soal["2"][0].id_dokumen))
          }
        }
      }
    } catch (err) {
      console.error("Error fetching IA08:", err)
    }

    setIsDataLoading(false)
  }, [id, authLoading])

  // Initial fetch
  useEffect(() => {
    fetchIa08Data()
  }, [fetchIa08Data])

  const nextStepLabel = asesmenSteps[asesmenSteps.findIndex(s => s.href.includes('ia08')) + 1]?.label

  const signing = useSigningState({
    pageKey: 'ia08',
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
    onRefresh: fetchIa08Data,
  })


  const hasSigned = isAsesor ? signing.asesorHasSigned : signing.asesiHasSigned

  const isFormDisabled = !isAsesor

  const handleFileCheck = (fileId: number, field: 'valid' | 'asli' | 'terkini' | 'memadai', value: boolean) => {
    if (isFormDisabled) return
    setIa08Files(prev => prev.map(f => {
      if (f.id !== fileId) return f
      const current = f.answer?.[field]
      const newVal = (current === value) ? null : value
      return {
        ...f,
        answer: { ...(f.answer || { valid: null, asli: null, terkini: null, memadai: null }), [field]: newVal },
      }
    }))
  }

  const handleWawancaraCheck = (id: number) => {
    if (isFormDisabled) return
    setWawancaraItems(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ))
  }

  const handleSave = async () => {
    // Tahap 0: skip save/TTD, langsung navigasi next
    if (tahap === 0) {
      const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ia08'))
      const nextStep = asesmenSteps[currentStepIndex + 1]
      navigate(nextStep ? nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`) : `/asesi/asesmen/${id}/selesai`)
      return
    }
    if (hasSigned) {
      // Asesi → navigate
      if (!isAsesor) {
        const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ia08'))
        const nextStep = asesmenSteps[currentStepIndex + 1]
        if (nextStep) {
          const nextPath = nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`)
          navigate(nextPath)
        } else {
          navigate(`/asesi/asesmen/${id}/selesai`)
        }
        return
      }
      // Asesor → fall through to re-save
    } else {
      if (!signing.agreedChecklist) {
        showWarning("Silakan centang pernyataan terlebih dahulu")
        return
      }
    }

    setIsSaving(true)
    try {
      const token = localStorage.getItem("access_token")

      const payload = {
        dokumen_id: dokumenId,
        apl2_answers: ia08Files.map(f => ({
          file_id: f.id,
          valid: f.answer?.valid ?? null,
          asli: f.answer?.asli ?? null,
          terkini: f.answer?.terkini ?? null,
          memadai: f.answer?.memadai ?? null,
        })),
        unit_answers: wawancaraItems.map(item => ({
          soal_id: item.id,
          is_checked: item.checked,
        })),
        bukti_tambahan: buktiTambahan,
        is_kompeten: rekomendasiKompeten,
        rekomendasi_unit: rekomendasiUnit,
        rekomendasi_elemen: rekomendasiElemen,
        rekomendasi_kuk: rekomendasiKuk,
      }

      const response = await fetch(`${API_BASE_URL}/asesmen/${id}/ia08`, {
        method: 'POST',
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        showSuccess('IA 08 berhasil disimpan!')
        await signing.generateQR()
        signing.publishUpdate()
      } else {
        const msg = await extractApiError(response, 'Gagal menyimpan IA 08')
        showError(msg)
      }
    } catch (err) {
      console.error('Error saving IA08:', err)
      showError(extractErrorMessage(err, 'Terjadi kesalahan'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isDataLoading) return <FullPageLoader text="Memuat data..." />

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif', userSelect: 'text' }}>

      <AsesmenBreadcrumb currentPage="IA.08" />

      <ModularAsesiLayout currentStep={asesmenSteps.find(s => s.href.includes('ia08'))?.number || 1} steps={asesmenSteps} id={id} metode={metode}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', marginBottom: '4px', letterSpacing: '1px' }}>
            FR.IA.08. CEKLIS VERIFIKASI PORTOFOLIO
          </h1>
        </div>

        {/* Identitas Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '13px', background: '#fff', border: '2px solid #000' }}>
          <tbody>
            <tr>
              <td style={{ width: '30%', border: '1px solid #000', padding: '6px' }}>
                Skema Sertifikasi<br /><span style={{ fontSize: '12px' }}>(KKNI/Okupasi/Klaster)</span>
              </td>
              <td style={{ width: '3%', border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{jabatanKerja || '-'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Judul</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{nomorSkema || '-'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>TUK</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{tuk || '-'}</td>
            </tr>
            {asesorList.length > 1 ? (
              <>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>Nama Asesor 1</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>{asesorList[0]?.nama?.toUpperCase() || ''}{asesorList[0]?.noreg && ` (${asesorList[0].noreg})`}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>Nama Asesor 2</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>{asesorList[1]?.nama?.toUpperCase() || ''}{asesorList[1]?.noreg && ` (${asesorList[1].noreg})`}</td>
                </tr>
              </>
            ) : (
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px' }}>Nama Asesor</td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
                <td style={{ border: '1px solid #000', padding: '6px' }}>{asesorList[0]?.nama?.toUpperCase() || ''}{asesorList[0]?.noreg && ` (${asesorList[0].noreg})`}</td>
              </tr>
            )}
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Nama Asesi</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{namaAsesi?.toUpperCase() || user?.name?.toUpperCase() || '-'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Tanggal</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>{tanggalUji ? new Date(tanggalUji).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ fontSize: '12px', marginBottom: '15px' }}>*Coret yang tidak perlu</div>

        {/* Panduan Bagi Asesor */}
        <div style={{ marginBottom: '15px', border: '2px solid #000', background: '#fff' }}>
          <div style={{ background: '#c40000', color: '#fff', padding: '6px', fontWeight: 'bold', fontSize: '13px' }}>
            PANDUAN BAGI ASESOR
          </div>
          <div style={{ padding: '10px', fontSize: '12px' }}>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Verifikasi portofolio dapat dilakukan untuk keseluruhan unit kompetensi dalam skema sertifikasi atau dilakukan untuk masing-masing kelompok pekerjaan dalam satu skema sertifikasi.</li>
              <li>Isilah bukti portofolio sesuai ketentuan bukti berkualitas dan relevan dengan standar kompetensi kerja.</li>
              <li>Lakukan verifikasi portofolio berdasarkan aturan bukti.</li>
              <li>Berikan hasil verifikasi portofolio dengan memberi centang (√).</li>
              <li>Jika belum memenuhi aturan bukti maka lanjutkan wawancara.</li>
            </ul>
          </div>
        </div>

        {/* Dokumen Portofolio Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '12px', background: '#fff', border: '2px solid #000' }}>
          <tbody>
            <tr style={{ background: '#c40000', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
              <td rowSpan={3} style={{ border: '1px solid #000', padding: '6px' }}>Dokumen Portofolio</td>
              <td colSpan={8} style={{ border: '1px solid #000', padding: '6px' }}>Aturan Bukti</td>
            </tr>
            <tr style={{ background: '#c40000', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>Valid</td>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>Asli</td>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>Terkini</td>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>Memadai</td>
            </tr>
            <tr style={{ background: '#c40000', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
              <td style={{ border: '1px solid #000', padding: '6px', width: '8%' }}>Ya</td>
              <td style={{ border: '1px solid #000', padding: '6px', width: '8%' }}>Tidak</td>
              <td style={{ border: '1px solid #000', padding: '6px', width: '8%' }}>Ya</td>
              <td style={{ border: '1px solid #000', padding: '6px', width: '8%' }}>Tidak</td>
              <td style={{ border: '1px solid #000', padding: '6px', width: '8%' }}>Ya</td>
              <td style={{ border: '1px solid #000', padding: '6px', width: '8%' }}>Tidak</td>
              <td style={{ border: '1px solid #000', padding: '6px', width: '8%' }}>Ya</td>
              <td style={{ border: '1px solid #000', padding: '6px', width: '8%' }}>Tidak</td>
            </tr>
            {ia08Files.map((file) => (
              <tr key={file.id}>
                <td style={{ border: '1px solid #000', padding: '6px' }}>
                  <a href={file.path} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', fontWeight: 'bold', textDecoration: 'underline' }}>{file.original_name}</a>
                </td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                  <CustomCheckbox checked={file.answer?.valid === true} onChange={() => handleFileCheck(file.id, 'valid', true)} disabled={isFormDisabled} />
                </td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                  <CustomCheckbox checked={file.answer?.valid === false} onChange={() => handleFileCheck(file.id, 'valid', false)} disabled={isFormDisabled} />
                </td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                  <CustomCheckbox checked={file.answer?.asli === true} onChange={() => handleFileCheck(file.id, 'asli', true)} disabled={isFormDisabled} />
                </td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                  <CustomCheckbox checked={file.answer?.asli === false} onChange={() => handleFileCheck(file.id, 'asli', false)} disabled={isFormDisabled} />
                </td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                  <CustomCheckbox checked={file.answer?.terkini === true} onChange={() => handleFileCheck(file.id, 'terkini', true)} disabled={isFormDisabled} />
                </td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                  <CustomCheckbox checked={file.answer?.terkini === false} onChange={() => handleFileCheck(file.id, 'terkini', false)} disabled={isFormDisabled} />
                </td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                  <CustomCheckbox checked={file.answer?.memadai === true} onChange={() => handleFileCheck(file.id, 'memadai', true)} disabled={isFormDisabled} />
                </td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                  <CustomCheckbox checked={file.answer?.memadai === false} onChange={() => handleFileCheck(file.id, 'memadai', false)} disabled={isFormDisabled} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Cek List Wawancara Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '12px', background: '#fff', border: '2px solid #000' }}>
          <tbody>
            <tr style={{ background: '#c40000', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
              <td style={{ border: '1px solid #000', padding: '6px', width: '5%' }}>Cek List</td>
              <td style={{ border: '1px solid #000', padding: '6px', width: '25%' }}>No. Unit Kompetensi</td>
              <td style={{ border: '1px solid #000', padding: '6px', width: '10%' }}>No. Elemen</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Materi/Substansi Wawancara</td>
            </tr>
            {wawancaraItems.map((item) => (
              <tr key={item.id}>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                  <CustomCheckbox checked={item.checked} onChange={() => handleWawancaraCheck(item.id)} disabled={isFormDisabled} />
                </td>
                <td style={{ border: '1px solid #000', padding: '6px' }}>{item.unit_kompetensi}</td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{item.no_elemen}</td>
                <td style={{ border: '1px solid #000', padding: '6px' }}>{item.materi}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Bukti Tambahan */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '13px', background: '#fff', border: '2px solid #000' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}><b>Bukti tambahan diperlukan pada unit / elemen kompetensi</b></td>
            </tr>
            <tr>
              <td style={{ height: '80px', border: '1px solid #000', padding: '6px', verticalAlign: 'top' }}>
                <b>Sebagai berikut :</b>
                <textarea
                  value={buktiTambahan}
                  onChange={(e) => setBuktiTambahan(e.target.value)}
                  disabled={isFormDisabled}
                  style={{
                    width: '100%',
                    minHeight: '50px',
                    border: '1px solid #ccc',
                    padding: '6px',
                    fontSize: '12px',
                    resize: 'vertical',
                    cursor: isFormDisabled ? 'not-allowed' : 'text',
                    marginTop: '6px'
                  }}
                  placeholder="Isi bukti tambahan..."
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Rekomendasi */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '13px', background: '#fff', border: '2px solid #000' }}>
          <tbody>
            <tr>
              <td style={{ background: '#c40000', color: '#fff', border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>Rekomendasi Asesor</td>
              <td style={{ border: '1px solid #000', padding: '6px', width: '80%' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px', cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}>
                  <CustomCheckbox
                    checked={rekomendasiKompeten === true}
                    onChange={() => setRekomendasiKompeten(rekomendasiKompeten === true ? null : true)}
                    disabled={isFormDisabled}
                    style={{ marginTop: '2px' }}
                  />
                  <span style={{ fontSize: '12px' }}>Asesi telah memenuhi pencapaian seluruh kriteria unjuk kerja, direkomendasikan <b>KOMPETEN</b></span>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}>
                  <CustomCheckbox
                    checked={rekomendasiKompeten === false}
                    onChange={() => setRekomendasiKompeten(rekomendasiKompeten === false ? null : false)}
                    disabled={isFormDisabled}
                    style={{ marginTop: '2px' }}
                  />
                  <span style={{ fontSize: '12px' }}>Asesi belum memenuhi pencapaian seluruh kriteria unjuk kerja, direkomendasikan uji demonstrasi pada:</span>
                </label>
                {rekomendasiKompeten === false && (
                  <div style={{ marginLeft: '24px', marginTop: '10px' }}>
                    <div style={{ marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>Unit :</label>
                      <input
                        type="text"
                        value={rekomendasiUnit}
                        onChange={(e) => setRekomendasiUnit(e.target.value)}
                        disabled={isFormDisabled}
                        style={{
                          width: '100%',
                          border: '1px solid #ccc',
                          padding: '4px',
                          fontSize: '12px',
                          cursor: isFormDisabled ? 'not-allowed' : 'text'
                        }}
                        placeholder="Isi unit..."
                      />
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>Elemen :</label>
                      <input
                        type="text"
                        value={rekomendasiElemen}
                        onChange={(e) => setRekomendasiElemen(e.target.value)}
                        disabled={isFormDisabled}
                        style={{
                          width: '100%',
                          border: '1px solid #ccc',
                          padding: '4px',
                          fontSize: '12px',
                          cursor: isFormDisabled ? 'not-allowed' : 'text'
                        }}
                        placeholder="Isi elemen..."
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>KUK :</label>
                      <input
                        type="text"
                        value={rekomendasiKuk}
                        onChange={(e) => setRekomendasiKuk(e.target.value)}
                        disabled={isFormDisabled}
                        style={{
                          width: '100%',
                          border: '1px solid #ccc',
                          padding: '4px',
                          fontSize: '12px',
                          cursor: isFormDisabled ? 'not-allowed' : 'text'
                        }}
                        placeholder="Isi KUK..."
                      />
                    </div>
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signature Tables */}
        {/* Asesi */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '13px', background: '#fff', border: '2px solid #000' }}>
          <tbody>
            <tr>
              <td colSpan={3} style={{ background: '#fff', border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}><b>Asesi</b></td>
            </tr>
            <tr>
              <td style={{ width: '15%', border: '1px solid #000', padding: '6px' }}>Nama</td>
              <td style={{ width: '3%', border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>{namaAsesi?.toUpperCase() || user?.name?.toUpperCase() || ''}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Tanda tangan dan tanggal</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
              <td style={{ height: '60px', border: '1px solid #000', padding: '6px', verticalAlign: 'middle', textAlign: 'center' }}>
                {barcodes?.asesi?.url ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <img src={barcodes.asesi.url} alt="Tanda Tangan Asesi" style={{ height: '50px', width: '50px', objectFit: 'contain' }} />
                    {barcodes.asesi.tanggal && (
                      <div style={{ fontSize: '11px', color: '#333' }}>
                        {new Date(barcodes.asesi.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                ) : null}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Asesor 1 */}
        {asesorList.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '13px', background: '#fff', border: '2px solid #000' }}>
            <tbody>
              <tr>
                <td colSpan={3} style={{ background: '#fff', border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}><b>Asesor {asesorList.length > 1 ? '1' : ''}</b></td>
              </tr>
              <tr>
                <td style={{ width: '15%', border: '1px solid #000', padding: '6px' }}>Nama</td>
                <td style={{ width: '3%', border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
                <td style={{ border: '1px solid #000', padding: '6px' }}>{asesorList[0]?.nama?.toUpperCase() || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px' }}>No. Reg</td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
                <td style={{ border: '1px solid #000', padding: '6px' }}>{asesorList[0]?.noreg || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px' }}>Tanda tangan dan tanggal</td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
                <td style={{ height: '60px', border: '1px solid #000', padding: '6px', verticalAlign: 'middle', textAlign: 'center' }}>
                  {barcodes?.asesor1?.url ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <img src={barcodes.asesor1.url} alt={`Tanda Tangan ${asesorList[0]?.nama}`} style={{ height: '50px', width: '50px', objectFit: 'contain' }} />
                      {barcodes.asesor1.tanggal && (
                        <div style={{ fontSize: '11px', color: '#333' }}>
                          {new Date(barcodes.asesor1.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  ) : null}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {/* Asesor 2 */}
        {asesorList.length > 1 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '13px', background: '#fff', border: '2px solid #000' }}>
            <tbody>
              <tr>
                <td colSpan={3} style={{ background: '#fff', border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}><b>Asesor 2</b></td>
              </tr>
              <tr>
                <td style={{ width: '15%', border: '1px solid #000', padding: '6px' }}>Nama</td>
                <td style={{ width: '3%', border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
                <td style={{ border: '1px solid #000', padding: '6px' }}>{asesorList[1]?.nama?.toUpperCase() || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px' }}>No. Reg</td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
                <td style={{ border: '1px solid #000', padding: '6px' }}>{asesorList[1]?.noreg || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px' }}>Tanda tangan dan tanggal</td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
                <td style={{ height: '60px', border: '1px solid #000', padding: '6px', verticalAlign: 'middle', textAlign: 'center' }}>
                  {barcodes?.asesor2?.url ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <img src={barcodes.asesor2.url} alt={`Tanda Tangan ${asesorList[1]?.nama}`} style={{ height: '50px', width: '50px', objectFit: 'contain' }} />
                      {barcodes.asesor2.tanggal && (
                        <div style={{ fontSize: '11px', color: '#333' }}>
                          {new Date(barcodes.asesor2.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  ) : null}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {/* Actions */}
        <div style={{ marginTop: '20px' }}>
        <div style={{ background: '#fff', border: '1px solid #999', borderRadius: '4px', padding: '16px', marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <CustomCheckbox
                checked={signing.agreedChecklist}
                onChange={() => signing.setAgreedChecklist(!signing.agreedChecklist)}
                style={{ marginTop: '2px' }}
              />
              <span style={{ fontSize: '13px', color: '#333' }}>
                Saya menyatakan data ini telah diisi dengan benar.
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <ActionButton variant="secondary" onClick={() => navigate(-1)}>
              Kembali
            </ActionButton>
            <ActionButton
              variant="primary"
              disabled={isSaving}
              onClick={handleSave}
            >
              {isSaving ? "Menyimpan..." : (isAsesor ? "Simpan & Tanda Tangan" : signing.buttonText)}
            </ActionButton>
            {isAsesor && hasSigned && (
              <ActionButton
                variant="primary"
                onClick={() => {
                  const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ia08'))
                  const nextStep = asesmenSteps[currentStepIndex + 1]
                  if (nextStep) {
                    navigate(nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`))
                  } else {
                    navigate(`/asesi/asesmen/${id}/selesai`)
                  }
                }}
              >
                Lanjut ke {nextStepLabel || 'IA09'}
              </ActionButton>
            )}
          </div>
        </div>
      </ModularAsesiLayout>

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
