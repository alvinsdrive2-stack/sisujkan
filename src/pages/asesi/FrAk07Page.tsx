import { useState, useEffect, useCallback, useRef } from "react"
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

interface Referensi {
  id: number
  nama: string | null
  jawaban?: boolean | string | { bool: boolean; text: string } | null
}

interface Kategori {
  id: number | null
  kategori: string | null
  nama: string | null
  urut: number | null
  id_kelompok: number | null
  referensis: Referensi[]
}

interface Kelompok {
  id: number
  nama: string
  urut: number
  kategoris: Kategori[]
}

// API response now has kelompok properties directly on the item
interface Ak07DataItem {
  id: number
  nama: string
  urut: number
  kategoris: Kategori[]
  kelompok?: Kelompok // Keep for backward compatibility
}

interface ApiResponse {
  message: string
  data: {
    data?: {
      barcodes?: {
        asesi?: { url: string; tanggal: string; nama: string }
        asesor1?: { url: string; tanggal: string; nama: string }
        asesor2?: { url: string; tanggal: string; nama: string }
        asesor?: Record<string, { url: string; tanggal: string; nama: string }>
      }
      kelompoks: Ak07DataItem[]
    }
    // Backward compatibility - direct data
    barcodes?: {
      asesi?: { url: string; tanggal: string; nama: string }
      asesor1?: { url: string; tanggal: string; nama: string }
      asesor2?: { url: string; tanggal: string; nama: string }
      asesor?: Record<string, { url: string; tanggal: string; nama: string }>
    }
    kelompoks?: Ak07DataItem[]
  }
}

type SelectedReferences = Record<string, boolean | null>

export default function FrAk07Page() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { kegiatan, isAsesor } = useKegiatanByRole()
  const { idIzin: idIzinFromUrl } = useParams<{ idIzin: string }>()

  const idIzin = isAsesor ? idIzinFromUrl : user?.id_izin
  const { jabatanKerja, nomorSkema, tuk, namaAsesor, asesorList, namaAsesi, tahap, jadwalId, metode, jenjang } = useDataDokumenPraAsesmen(idIzin)
  const { showSuccess, showError, showWarning } = useToast()

  const [ak07Data, setAk07Data] = useState<Ak07DataItem[] | null>(null)
  const [barcodes, setBarcodes] = useState<{
    asesi?: { url: string; tanggal: string; nama: string }
    asesor?: Record<string, { url: string; tanggal: string; nama: string }>
    asesor1?: { url: string; tanggal: string; nama: string }
    asesor2?: { url: string; tanggal: string; nama: string }
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedReferences, setSelectedReferences] = useState<SelectedReferences>({})
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({})
  const [isDataLoading, setIsDataLoading] = useState(true)

  // Absen check - auto-detect role (asesi/asesor1/asesor2)
  const { showAwalModal, submitAbsenAwal, handleAwalModalClose } = useAbsenCheck({
    phase: 'praasesmen',
    role: 'auto',
    checkOnMount: true, // Enable for both asesi and asesor
    idIzin: idIzin,
    asesorList: asesorList,
    tahap: tahap
  })

  // Transform barcodes from old API format (asesor1, asesor2) to new dynamic format
  useEffect(() => {
    if (!barcodes || asesorList.length === 0) return

    const apiBarcodes = barcodes as any

    // If already has asesor in new format, skip transformation
    if (apiBarcodes.asesor && Object.keys(apiBarcodes.asesor || {}).length > 0) return

    // Transform old format (asesor1, asesor2) to new dynamic format
    const transformedAsesor: Record<string, { url: string; tanggal: string; nama: string }> = {}

    // Only map non-null barcodes
    if (apiBarcodes.asesor1 && asesorList[0]) {
      transformedAsesor[String(asesorList[0].id)] = {
        url: apiBarcodes.asesor1.url,
        tanggal: apiBarcodes.asesor1.tanggal,
        nama: apiBarcodes.asesor1.nama
      }
    }
    if (apiBarcodes.asesor2 && asesorList[1]) {
      transformedAsesor[String(asesorList[1].id)] = {
        url: apiBarcodes.asesor2?.url || '',
        tanggal: apiBarcodes.asesor2?.tanggal || '',
        nama: apiBarcodes.asesor2?.nama || ''
      }
    }

    // Only update if we have transformed data
    if (Object.keys(transformedAsesor).length > 0) {
      setBarcodes({
        asesi: apiBarcodes.asesi,
        asesor: transformedAsesor,
        asesor1: apiBarcodes.asesor1,
        asesor2: apiBarcodes.asesor2,
      })
    }
  }, [barcodes, asesorList])

  const initialFetchDone = useRef(false)

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token")

      // Use idIzin from URL params
      let actualIdIzin = idIzin

      if (!actualIdIzin && !isAsesor && jadwalId) {
        // Fetch id_izin from list-asesi endpoint if not in URL
        const listAsesiResponse = await fetch(`${API_BASE_URL}/kegiatan/${jadwalId}/list-asesi`, {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        })

        if (listAsesiResponse.ok) {
          const listResult = await listAsesiResponse.json()
          if (listResult.message === "Success" && listResult.list_asesi && listResult.list_asesi.length > 0) {
            actualIdIzin = listResult.list_asesi[0].id_izin
          }
        }
      }

      if (!actualIdIzin) {
        setIsDataLoading(false)
        return
      }

      // Fetch AK 07 data
      const ak07Response = await fetch(`${API_BASE_URL}/praasesmen/${actualIdIzin}/ak07`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (ak07Response.ok) {
        const result: ApiResponse = await ak07Response.json()
        if (result.message === "Success") {
          // Handle nested data.data structure (new API format) or direct data (old format)
          const apiData = result.data?.data || result.data
          const kelompoks = apiData?.kelompoks || []
          setAk07Data(kelompoks)

          // Set barcodes raw from API - will be transformed in separate effect
          if (apiData?.barcodes) {
            setBarcodes(apiData.barcodes as any)
          }

          // Set textAnswers from API (for string jawaban or object with text)
          const newTextAnswers: Record<number, string> = {}
          kelompoks.forEach((item: Ak07DataItem) => {
            item.kategoris.forEach(kategori => {
              kategori.referensis.forEach(ref => {
                // Handle object jawaban format: { bool: boolean, text: string }
                if (typeof ref.jawaban === 'object' && ref.jawaban !== null && 'text' in ref.jawaban) {
                  newTextAnswers[ref.id] = ref.jawaban.text
                } else if (typeof ref.jawaban === 'string' && ref.jawaban) {
                  newTextAnswers[ref.id] = ref.jawaban
                }
              })
            })
          })
          setTextAnswers(newTextAnswers)

          // Set selectedReferences from API (per-ref key: refId_kategoriId_kelompokId)
          const newSelectedReferences: SelectedReferences = {}
          kelompoks.forEach((item: Ak07DataItem) => {
            item.kategoris.forEach(kategori => {
              kategori.referensis.forEach(ref => {
                const key = `${ref.id}_${kategori.id}_${item.id}`
                if (typeof ref.jawaban === 'object' && ref.jawaban !== null && 'bool' in ref.jawaban) {
                  newSelectedReferences[key] = ref.jawaban.bool
                } else if (ref.jawaban === true || ref.jawaban === false) {
                  newSelectedReferences[key] = ref.jawaban
                }
                // null/undefined → leave unset (default null = unanswered)
              })
            })
          })
          setSelectedReferences(newSelectedReferences)
        }
      } else {
        console.warn(`AK07 API returned ${ak07Response.status}`)
      }
    } catch (error) {
    } finally {
      setIsDataLoading(false)
    }
  }, [idIzin, kegiatan, isAsesor, jadwalId])

  useEffect(() => {
    if (initialFetchDone.current) return
    if ((isAsesor && idIzin) || kegiatan || jadwalId) {
      initialFetchDone.current = true
      window.scrollTo(0, 0)
      fetchData()
    }
  }, [idIzin, kegiatan, isAsesor, jadwalId, fetchData])

  const signing = useSigningState({
    pageKey: 'ak07',
    isAsesor,
    tahap,
    barcodes: barcodes as any,
    setBarcodes: setBarcodes as any,
    asesorList,
    userId: user?.id,
    userName: user?.name,
    isSaving,
    idIzin,
    jadwalId,
    onRefresh: fetchData,
  })


  const isFormDisabled = tahap !== 0 && (!isAsesor || signing.allSigned)

  const handleBack = () => {
    navigate(-1)
  }

  const handleReferenceChange = (kategoriId: number | null, kelompokId: number, refId: number, value: boolean) => {
    const key = `${refId}_${kategoriId}_${kelompokId}`
    setSelectedReferences(prev => ({
      ...prev,
      [key]: prev[key] === value ? null : value
    }))
  }

  const handleBulkToggle = (kelompokId: number, kategoris: Kategori[], value: boolean) => {
    const updates: SelectedReferences = {}
    kategoris.forEach(kategori => {
      if (!kategori.nama) return
      const refs = kategori.referensis
      refs.forEach((ref, idx) => {
        if (!ref.nama) return
        if (idx === refs.length - 1) return // skip last (nullable)
        const key = `${ref.id}_${kategori.id}_${kelompokId}`
        updates[key] = value
      })
    })
    setSelectedReferences(prev => ({ ...prev, ...updates }))
  }

  const getReferenceState = (kategoriId: number | null, kelompokId: number, refId: number): boolean | null => {
    // Cek dari selectedReferences dulu (user input) — per-ref key
    const key = `${refId}_${kategoriId}_${kelompokId}`
    if (key in selectedReferences) {
      return selectedReferences[key] // null, true, or false
    }

    // Kalau nggak ada di user selection, cek dari API data
    const ref = ak07Data
      ?.find(d => d.id === kelompokId)
      ?.kategoris
      .find(k => k.id === kategoriId)
      ?.referensis.find(r => r.id === refId)

    // Handle null/undefined jawaban → belum dijawab
    if (ref?.jawaban === null || ref?.jawaban === undefined) return null

    // Handle object jawaban format: { bool: boolean, text: string }
    if (typeof ref?.jawaban === 'object' && ref.jawaban !== null && 'bool' in ref.jawaban) {
      return ref.jawaban.bool
    }
    return ref?.jawaban === true
  }

  const isReferenceChecked = (kategoriId: number | null, kelompokId: number, refId: number): boolean => {
    return getReferenceState(kategoriId, kelompokId, refId) === true
  }

  const handleSave = async () => {
    // Resolve actualIdIzin for navigation
    let actualIdIzin = idIzin
    if (!actualIdIzin && jadwalId) {
      const token = localStorage.getItem("access_token")
      const listAsesiResponse = await fetch(`${API_BASE_URL}/kegiatan/${jadwalId}/list-asesi`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })
      if (listAsesiResponse.ok) {
        const listResult = await listAsesiResponse.json()
        if (listResult.message === "Success" && listResult.list_asesi && listResult.list_asesi.length > 0) {
          actualIdIzin = listResult.list_asesi[0].id_izin
        }
      }
    }

    if (!actualIdIzin) {
      showWarning("ID Izin tidak ditemukan")
      return
    }

    // Tahap 0: langsung navigasi tanpa save/ttd
    if (tahap === 0) {
      navigate(`/asesi/praasesmen/${actualIdIzin}/ak04`)
      return
    }

    // If already signed, navigate to FR AK 04 (skip untuk tahap 0)
    if (tahap !== 0 && signing.allSigned) {
      navigate(`/asesi/praasesmen/${actualIdIzin}/ak04`)
      return
    }

    if (!signing.agreedChecklist) {
      showWarning("Silakan centang pernyataan bahwa Anda telah memahami dokumen ini.")
      return
    }

    // Guard: asesi cannot submit until all asesor have signed
    if (!isAsesor && !signing.allAsesorSigned) {
      showWarning(`Menunggu tanda tangan: ${signing.missingLabels.join(', ')}`)
      return
    }

    // Asesi cannot edit, only sign after asesor signed
    if (!isAsesor && !signing.asesiHasSigned && signing.allAsesorSigned) {
      // proceed to save + QR generation for asesi signature
    }

    setIsSaving(true)
    try {
      // Build answers array
      const answers: Array<{ referensi_id: number; kelompok_id: number; value: boolean | string | { bool: boolean; text: string } | null; custom_name?: string }> = []

      if (!ak07Data) {
        throw new Error("Data AK07 tidak tersedia")
      }

      // Kelompok 4 (Potensi Asesi) - boolean per item
      const potensiAsesiData = ak07Data.find(d => d.urut === 1)
      if (potensiAsesiData) {
        potensiAsesiData.kategoris.forEach(kategori => {
          kategori.referensis.forEach(ref => {
            const isChecked = isReferenceChecked(kategori.id, potensiAsesiData.id, ref.id)
            answers.push({
              referensi_id: ref.id,
              kelompok_id: potensiAsesiData.id,
              value: isChecked
            })
          })
        })
      }

      // Kelompok 5 (Modifikasi) - boolean, custom_name for empty nama
      const modifikasiData = ak07Data.find(d => d.urut === 2)
      if (modifikasiData) {
        modifikasiData.kategoris.forEach(kategori => {
          kategori.referensis.forEach((ref, refIdx) => {
            const isLast = refIdx === kategori.referensis.length - 1
            if (isLast) {
              const state = getReferenceState(kategori.id, modifikasiData.id, ref.id)
              if (state !== null) {
                const customName = textAnswers[ref.id] || ''
                answers.push({ referensi_id: ref.id, kelompok_id: modifikasiData.id, value: state, custom_name: customName })
              }
            } else {
              const state = getReferenceState(kategori.id, modifikasiData.id, ref.id)
              if (state !== null) {
                answers.push({ referensi_id: ref.id, kelompok_id: modifikasiData.id, value: state })
              }
            }
          })
        })
      }

      // Kelompok 6 (Rekaman Rencana Asesmen) - boolean Ya/Tidak + text keterangan
      const rencanaAsesmenData = ak07Data.find(d => d.urut === 3)
      if (rencanaAsesmenData && rencanaAsesmenData.kategoris[0]) {
        const kategoriId = rencanaAsesmenData.kategoris[0].id
        rencanaAsesmenData.kategoris[0].referensis.forEach(ref => {
          const isChecked = isReferenceChecked(kategoriId, rencanaAsesmenData.id, ref.id)
          const keterangan = textAnswers[ref.id] || ''
          answers.push({
            referensi_id: ref.id,
            kelompok_id: rencanaAsesmenData.id,
            value: { bool: isChecked, text: keterangan }
          })
        })
      }

      // Kelompok 7 (Hasil Penyesuaian) - string/text
      const hasilPenyesuaianData = ak07Data.find(d => d.urut === 4)
      if (hasilPenyesuaianData) {
        hasilPenyesuaianData.kategoris[0]?.referensis.forEach(ref => {
          // Get user input, or use API value as fallback
          const userInput = textAnswers[ref.id]
          // Send empty string to clear the field on backend
          const finalValue = userInput !== undefined ? userInput : (typeof ref.jawaban === 'string' ? ref.jawaban : '')
          answers.push({
            referensi_id: ref.id,
            kelompok_id: hasilPenyesuaianData.id,
            value: finalValue
          })
        })
      }

      // POST to backend
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/praasesmen/${actualIdIzin}/ak07`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Gagal menyimpan data AK07" }))
        throw new Error(error.message || "Gagal menyimpan data AK07")
      }

      // Generate QR jika jadwalId tersedia (skip untuk tahap 0)
      console.log('[FR-AK-07] Generate QR:', { jadwalId, isAsesor, actualIdIzin })
      if (tahap !== 0 && jadwalId) {
        await signing.generateQR()
      }

      showSuccess('FR AK 07 berhasil disimpan!')
      signing.publishUpdate()
      // Untuk tahap 0, langsung navigasi ke halaman berikutnya
      if (tahap === 0) {
        setTimeout(() => navigate(`/asesi/praasesmen/${actualIdIzin}/ak04`), 500)
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Gagal menyimpan data AK07")
    } finally {
      setIsSaving(false)
    }
  }

  // Group data by kelompok
  const potensiAsesiData = ak07Data?.find(d => d.urut === 1)
  const modifikasiData = ak07Data?.find(d => d.urut === 2)
  const rencanaAsesmenData = ak07Data?.find(d => d.urut === 3)
  const hasilPenyesuaianData = ak07Data?.find(d => d.urut === 4)

  if (isDataLoading) return <FullPageLoader text="Memuat data..." />

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Header */}
      
      <AsesmenBreadcrumb currentPage="FR.AK.07" />

      <MukLayout currentStep={3} idIzin={idIzin} metode={metode} tahap={tahap} jenjang={jenjang}>
        <div style={{ padding: '20px' }}>
          {/* Title */}
          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <h1 style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', marginBottom: '4px', textTransform: 'uppercase' }}>
              FR.AK.07 - FORMULIR PENYESUAIAN ASESMEN
            </h1>
            <p style={{ fontSize: '12px', color: '#666' }}>Isi atau lengkapi data formulir AK 07 di bawah ini</p>
          </div>

          {/* Identitas Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '13px', background: '#fff' }}>
            <tbody>
              <tr>
                <td rowSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', width: '35%', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Skema Sertifikasi<br />
                  <span style={{ fontSize: '11px', fontWeight: 'normal' }}>(̶𝙺̶𝙺̶𝙽̶𝙸̶/Okupasi/̶𝙺̶𝚕̶𝚊̶𝚜̶𝚝̶𝚎̶𝚛̶)̶</span>
                </td>
                <td style={{ border: '1px solid #000', padding: '6px 8px', width: '15%', fontWeight: 'bold' }}>Judul</td>
                <td style={{ border: '1px solid #000', padding: '6px 8px', width: '5%', textAlign: 'center', fontWeight: 'bold' }}>:</td>
                <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{jabatanKerja?.toUpperCase() || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Nomor</td>
                <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>:</td>
                <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{nomorSkema?.toUpperCase() || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>TUK</td>
                <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>:</td>
                <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 8px' }}>{tuk?.toUpperCase() || 'Sewaktu/Tempat Kerja/Mandiri*'}</td>
              </tr>
              {asesorList.length > 1 ? (
                asesorList.map((asesor, idx) => (
                  <tr key={asesor.id}>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Nama Asesor {idx + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>:</td>
                    <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 8px' }}>
                      {asesor.nama?.toUpperCase() || ''}{asesor.noreg && ` (${asesor.noreg})`}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Nama Asesor</td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>:</td>
                  <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 8px' }}>
                    {asesorList[0]?.nama?.toUpperCase() || ''}{asesorList[0]?.noreg && ` (${asesorList[0].noreg})`}
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Nama Asesi</td>
                <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>:</td>
                <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 8px' }}>{namaAsesi || user?.name || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Tanggal</td>
                <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>:</td>
                <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 8px' }}>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
              </tr>
            </tbody>
          </table>

          <p style={{ fontSize: '11px', marginBottom: '12px', color: '#666' }}>*Coret yang tidak perlu</p>

          {/* Panduan */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '12px', background: '#fff' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', background: '#f0f0f0' }}>PANDUAN BAGI ASESOR</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', lineHeight: '1.6' }}>
                  • Formulir ini digunakan pada saat pelaksanaan pra asesmen<br />
                  • Formulir ini terdiri dari dua bagian yaitu A dan B<br />
                  • Coretlah pada tanda * yang tidak sesuai<br />
                  • Berilah tanda √ Ya atau Tidak pada tanda ** sesuai pilihan<br />
                  • Berilah tanda √ pada kotak ☐ pada kolom potensi asesi<br />
                  • Formulir ini juga digunakan untuk bagian B<br />
                  • Berilah tanda √ Ya atau Tidak pada tanda *** sesuai pilihan
                </td>
              </tr>
            </tbody>
          </table>

          {/* Potensi Asesi */}
          {potensiAsesiData && (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '14px', background: '#fff' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', width: '20%', fontWeight: 'bold', verticalAlign: 'top' }}>
                    Potensi Asesi
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px' }}>
                    {potensiAsesiData.kategoris[0]?.referensis.map((ref) => {
                      const isChecked = isReferenceChecked(potensiAsesiData.kategoris[0]?.id || null, potensiAsesiData.id, ref.id)

                      return (
                        <div key={ref.id} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <div style={{ marginRight: '10px' }}>
                            <CustomCheckbox
                              checked={isChecked}
                              disabled={isFormDisabled || isSaving}
                              onChange={() => !isFormDisabled && !isSaving && handleReferenceChange(potensiAsesiData.kategoris[0]?.id || null, potensiAsesiData.id, ref.id, true)}
                            />
                          </div>
                          <span style={{ flex: 1, fontSize: '14px' }}>{ref.nama}</span>
                        </div>
                      )
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          )}

          {/* Bagian A - Mengidentifikasi Persyaratan Modifikasi */}
          {modifikasiData && (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '14px', background: '#fff' }}>
              <tbody>
                <tr>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', width: '5%', background: '#c00000', color: '#fff', fontSize: '14px' }}>No</th>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', width: '35%', background: '#c00000', color: '#fff', fontSize: '14px' }}>Mengidentifikasi Persyaratan Modifikasi dan Kontekstualisasi</th>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', width: '60px', background: '#c00000', color: '#fff', textAlign: 'center', fontSize: '14px' }}>Ya</th>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', width: '60px', background: '#c00000', color: '#fff', textAlign: 'center', fontSize: '14px' }}>Tidak</th>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', background: '#c00000', color: '#fff', fontSize: '14px' }}>Keterangan</th>
                </tr>

                {modifikasiData.kategoris.map((kategori, kategoriIndex) => {
                  if (!kategori.nama) return null

                  const allReferensis = kategori.referensis

                  return allReferensis.map((ref, refIdx) => {
                    const isChecked = isReferenceChecked(kategori.id, modifikasiData.id, ref.id)
                    const isFirstRow = refIdx === 0
                    const isDisabled = isFormDisabled || isSaving

                    return (
                      <tr key={`${kategori.id || kategoriIndex}-${ref.id}`}>
                        {isFirstRow && (
                          <>
                            <td rowSpan={allReferensis.length} style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', verticalAlign: 'top' }}>
                              {kategori.urut || kategoriIndex + 1}
                            </td>
                            <td rowSpan={allReferensis.length} style={{ border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top' }}>
                              {kategori.nama}
                            </td>
                          </>
                        )}
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', borderBottom: refIdx < allReferensis.length - 1 ? '1px solid #ccc' : '1px solid #000' }}>
                          <CustomCheckbox
                            checked={isChecked}
                            onChange={(shiftKey) => {
                              if (isFormDisabled || isSaving) return
                              if (shiftKey) handleBulkToggle(modifikasiData.id, modifikasiData.kategoris, true)
                              else handleReferenceChange(kategori.id, modifikasiData.id, ref.id, true)
                            }}
                            disabled={isDisabled}
                          />
                        </td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', borderBottom: refIdx < allReferensis.length - 1 ? '1px solid #ccc' : '1px solid #000' }}>
                          <CustomCheckbox
                            checked={getReferenceState(kategori.id, modifikasiData.id, ref.id) === false}
                            onChange={(shiftKey) => {
                              if (isFormDisabled || isSaving) return
                              if (shiftKey) handleBulkToggle(modifikasiData.id, modifikasiData.kategoris, false)
                              else handleReferenceChange(kategori.id, modifikasiData.id, ref.id, false)
                            }}
                            disabled={isDisabled}
                          />
                        </td>
                        <td style={{ border: '1px solid #000', padding: '8px', borderBottom: refIdx < allReferensis.length - 1 ? '1px solid #ccc' : '1px solid #000', fontSize: '14px' }}>
                          {refIdx !== allReferensis.length - 1 && ref.nama}
                          {refIdx === allReferensis.length - 1 && (
                            <textarea
                              value={textAnswers[ref.id] ?? ref.nama ?? ''}
                              onChange={(e) => setTextAnswers(prev => ({ ...prev, [ref.id]: e.target.value }))}
                              disabled={isDisabled}
                              rows={1}
                              style={{ width: '100%', padding: '4px', border: '1px solid #ccc', fontSize: '12px', minHeight: '24px', overflow: 'hidden', resize: 'none', fontFamily: 'Arial, Helvetica, sans-serif', cursor: isDisabled ? 'not-allowed' : 'text', background: isDisabled ? '#f5f5f5' : '#fff', boxSizing: 'border-box', marginTop: '4px', display: 'block' }}
                              placeholder="Isi keterangan..."
                            />
                          )}
                        </td>
                      </tr>
                    )
                  })
                })}
              </tbody>
            </table>
          )}

          {/* Rekaman Rencana Asesmen */}
          {rencanaAsesmenData && rencanaAsesmenData.kategoris[0]?.referensis && (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '14px', background: '#fff' }}>
              <tbody>
                <tr>
                  <th colSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', width: '55%', background: '#fff', color: '#000',textAlign: 'left', fontSize: '14px' }}>Rekaman Rencana Asesmen</th>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', width: '60px', background: '#fff', color: '#000', textAlign: 'center', fontSize: '14px' }}>Ya</th>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', width: '60px', background: '#fff', color: '#000', textAlign: 'center', fontSize: '14px' }}>Tidak</th>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', width: '20%', background: '#fff', color: '#000', textAlign: 'left',fontSize: '14px' }}>Keterangan</th>
                </tr>

                {rencanaAsesmenData.kategoris[0].referensis.map((ref, refIdx) => {
                  const kategoriId = rencanaAsesmenData.kategoris[0]?.id || null
                  const isChecked = isReferenceChecked(kategoriId, rencanaAsesmenData.id, ref.id)
                  const isDisabled = isFormDisabled || isSaving

                  return (
                    <tr key={ref.id}>
                      <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', verticalAlign: 'top',borderRight:'none' }}>
                        {refIdx + 1}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top', borderLeft:'none' }}>
                        {ref.nama}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                        <CustomCheckbox
                          checked={isChecked}
                          onChange={(shiftKey) => {
                            if (isFormDisabled || isSaving) return
                            if (shiftKey) handleBulkToggle(rencanaAsesmenData.id, rencanaAsesmenData.kategoris, true)
                            else handleReferenceChange(kategoriId, rencanaAsesmenData.id, ref.id, true)
                          }}
                          disabled={isDisabled}
                        />
                      </td>
                      <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                        <CustomCheckbox
                          checked={getReferenceState(kategoriId, rencanaAsesmenData.id, ref.id) === false}
                          onChange={(shiftKey) => {
                            if (isFormDisabled || isSaving) return
                            if (shiftKey) handleBulkToggle(rencanaAsesmenData.id, rencanaAsesmenData.kategoris, false)
                            else handleReferenceChange(kategoriId, rencanaAsesmenData.id, ref.id, false)
                          }}
                          disabled={isDisabled}
                        />
                      </td>
                      <td style={{ border: '1px solid #000', padding: '4px', fontSize: '14px' }}>
                        <textarea
                          value={textAnswers[ref.id] || ''}
                          onInput={(e) => {
                            const el = e.currentTarget
                            el.style.height = '24px'
                            el.style.height = el.scrollHeight + 'px'
                          }}
                          ref={(el) => {
                            if (el) {
                              el.style.height = '24px'
                              el.style.height = el.scrollHeight + 'px'
                            }
                          }}
                          onChange={(e) => setTextAnswers(prev => ({ ...prev, [ref.id]: e.target.value }))}
                          disabled={isDisabled}
                          rows={1}
                          style={{ width: '100%', padding: '4px', border: '1px solid #ccc', fontSize: '12px', minHeight: '24px', height: '24px', overflow: 'hidden', resize: 'none', fontFamily: 'Arial, Helvetica, sans-serif', cursor: isDisabled ? 'not-allowed' : 'text', background: isDisabled ? '#f5f5f5' : '#fff', boxSizing: 'border-box' }}
                          placeholder="Keterangan..."
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {/* Hasil Penyesuaian */}
          {hasilPenyesuaianData && hasilPenyesuaianData.kategoris[0]?.referensis && (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '14px', background: '#fff' }}>
              <tbody>
                <tr>
                  <th colSpan={3} style={{ border: '1px solid #000', padding: '6px 8px', width: '45%', background: '#fff', color: '#000', fontSize: '14px', textAlign: 'left' }}>Hasil Penyesuaian yang wajar dan beralasan disepakati menggunakan:</th>

                </tr>

                {hasilPenyesuaianData.kategoris[0].referensis.map((ref, refIdx) => {
                  const isDisabled = isFormDisabled || isSaving
                  return (
                    <tr key={ref.id}>
                      <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'left', verticalAlign: 'top',borderRight:'none' }}>
                        {refIdx + 1}) {ref.nama}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '6px 8px', verticalAlign: 'top',borderLeft:'none', borderRight:'none' }}>
                        :
                      </td>
                      <td style={{ border: '1px solid #000', padding: '4px', fontSize: '14px', borderLeft:'none' }}>
                        <textarea
                          value={textAnswers[ref.id] ?? (typeof ref.jawaban === 'string' ? ref.jawaban : '')}
                          onInput={(e) => {
                            const el = e.currentTarget
                            el.style.height = '24px'
                            el.style.height = el.scrollHeight + 'px'
                          }}
                          ref={(el) => {
                            if (el) {
                              el.style.height = '24px'
                              el.style.height = el.scrollHeight + 'px'
                            }
                          }}
                          onChange={(e) => setTextAnswers(prev => ({ ...prev, [ref.id]: e.target.value }))}
                          disabled={isDisabled}
                          rows={1}
                          style={{ width: '100%', padding: '4px', border: '1px solid #ccc', fontSize: '12px', minHeight: '24px', height: '24px', overflow: 'hidden', resize: 'none', fontFamily: 'Arial, Helvetica, sans-serif', cursor: isDisabled ? 'not-allowed' : 'text', background: isDisabled ? '#f5f5f5' : '#fff', boxSizing: 'border-box' }}
                          placeholder="Jawaban..."
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {/* Tanda Tangan */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '12px', background: '#fff' }}>
            <tbody>
              {asesorList.length > 0 ? (
                asesorList.map((asesor, idx) => {
                  const asesorBarcode = barcodes?.asesor?.[String(asesor.id)]
                  const label = asesorList.length > 1 ? `Nama Asesor ${idx + 1}` : 'Nama Asesor'
                  return (
                    <tr key={asesor.id}>
                      <td style={{ border: '1px solid #000', padding: '8px', width: '50%', height: '100px' }}>
                        <div>{label} : {asesor.nama?.toUpperCase() || ''}</div>
                        {asesor.noreg && <div>No. Reg : {asesor.noreg}</div>}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '8px', width: '50%', verticalAlign: 'middle', textAlign: 'center' }}>
                        <div style={{ marginBottom: '4px', textAlign: 'left' }}>Tanggal dan Tanda Tangan Asesor :</div>
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
                  )
                })
              ) : (
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px', width: '50%', height: '100px' }}>
                    <div>Nama Asesor : {namaAsesor?.toUpperCase() || ''}</div>
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px', width: '50%', verticalAlign: 'middle', textAlign: 'center' }}>
                    <div style={{ marginBottom: '4px', textAlign: 'left' }}>Tanggal dan Tanda Tangan Asesor :</div>
                    {Object.values(barcodes?.asesor || {})[0]?.url ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <img
                          src={Object.values(barcodes?.asesor || {})[0].url}
                          alt="Tanda Tangan Asesor"
                          style={{ height: '50px', width: '50px', objectFit: 'contain' }}
                        />
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#333' }}>
                          {Object.values(barcodes?.asesor || {})[0].nama}
                        </div>
                        {Object.values(barcodes?.asesor || {})[0]?.tanggal && (
                          <div style={{ fontSize: '11px', color: '#333' }}>
                            {new Date(Object.values(barcodes?.asesor || {})[0].tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </td>
                </tr>
              )}
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', height: '100px' }}>
                  <div>Nama Asesi :</div>
                  <div>{namaAsesi?.toUpperCase() || user?.name?.toUpperCase() || ''}</div>
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'middle', textAlign: 'center' }}>
                  <div style={{ marginBottom: '4px', textAlign: 'left' }}>Tanggal dan Tanda Tangan Asesi :</div>
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
                style={{ marginTop: '2px', width: '16px', height: '16px', cursor: signing.allSigned ? 'not-allowed' : 'pointer' }}
              />
              <span style={{ fontSize: '12px', color: '#000', lineHeight: '1.5' }}>
                <strong style={{ textTransform: 'uppercase' }}>Pernyataan:</strong> Saya menyatakan bahwa saya telah memahami dan memahami dokumen AK 07 (Penyesuaian Asesmen) ini dengan sebenar-benarnya.
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
            <ActionButton variant="primary" disabled={signing.buttonDisabled} onClick={handleSave}>
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
