import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
import { useNavigate, useParams } from "react-router-dom"
import ModularAsesiLayout from "@/components/ModularAsesiLayout"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/ToastContext"
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

interface KelompokKerjaData {
  id: number
  kode: string
  nama_dokumen: string
  kelompok_kerja: KelompokKerja[]
}

interface ReferensiForm {
  id: number
  nama: string
}

interface Soal {
  id: number
  urut: string
  jenis: string
  soal: string
  jawaban: string
  is_komentar: string | null
}

interface Ia04aResponse {
  message: string
  data: {
    kelompok_kerja: KelompokKerjaData
    referensi_form: ReferensiForm[]
    soal: Soal[]
    barcodes?: {
      asesi?: { url: string; tanggal: string; nombre: string }
      asesor1?: { url: string; tanggal: string; nombre: string } | null
      asesor2?: { url: string; tanggal: string; nombre: string } | null
    }
  }
}

interface ApiResponse {
  message: string
  data: Ia04aResponse["data"]
}

type BarcodeData = {
  url: string
  tanggal: string
  nama: string
}

export default function Ia04aPage() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { id } = useParams<{ id?: string }>()
  const { jenjang, metode, jabatanKerja, nomorSkema, namaAsesor: _namaAsesor, tuk, asesorList, namaAsesi, namaPenyusun, namaValidator, barcodePenyusun, barcodeValidator, noregPenyusun, noregValidator, tanggalPenyusun, tanggalValidator, jadwalId } = useDataDokumenAsesmen(id)
  const { tahap } = useDataDokumenPraAsesmen(id)
  const { role: asesorRole, isAsesor1 } = useAsesorRole(id)
  const { showSuccess, showWarning, showError } = useToast()
  const { kegiatan: _kegiatan, isAsesor } = useKegiatanByRole()

  const [ia04aData, setIa04aData] = useState<Ia04aResponse["data"] | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [umpanBalikMap, setUmpanBalikMap] = useState<Record<number, string>>({})
  const [barcodes, setBarcodes] = useState<{
    asesi?: BarcodeData
    asesor1?: BarcodeData | null
    asesor2?: BarcodeData | null
  } | null>(null)

  // Absen check - auto-detect role (asesi/asesor1/asesor2)
  const { showAwalModal, submitAbsenAwal, handleAwalModalClose } = useAbsenCheck({
    phase: 'asesmen',
    role: 'auto',
    checkOnMount: true,
    idIzin: id,
    asesorList
  })

  // Get dynamic steps based on asesor role
  const asesmenSteps = useMemo(() => getAsesmenSteps(jenjang, isAsesor, asesorRole, asesorList.length, metode, tahap), [jenjang, isAsesor, asesorRole, asesorList.length, metode, tahap])

  const initialFetchDone = useRef(false)

  const fetchData = useCallback(async () => {
      // Wait for auth to load
      if (authLoading) {
        return
      }

      if (!id) {
        console.error("No id_izin found in user data")

        return
      }

      try {
        const token = localStorage.getItem("access_token")

        
        

        const response = await fetch(`${API_BASE_URL}/asesmen/${id}/ia04a`, {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const result: ApiResponse = await response.json()
          if (result.message === "Success") {
            setIa04aData(result.data)

            // Initialize umpan balik map from soal with is_komentar === "2"
            const umpanBalikInit: Record<number, string> = {}
            result.data.soal.forEach(soal => {
              if (soal.is_komentar === "2" && soal.jawaban) {
                umpanBalikInit[soal.id] = soal.jawaban
              }
            })
            setUmpanBalikMap(umpanBalikInit)

            // Set barcodes - use asesor1/asesor2 format directly
            if (result.data.barcodes) {
              const apiBarcodes = result.data.barcodes as {
                asesi?: BarcodeData
                asesor1?: BarcodeData | null
                asesor2?: BarcodeData | null
              }

              setBarcodes({
                asesi: apiBarcodes.asesi,
                asesor1: apiBarcodes.asesor1,
                asesor2: apiBarcodes.asesor2,
              })
            }

            
          }
        } else {
          console.warn(`IA04A API returned ${response.status}`)
        }
      } catch (error) {
        console.error("Error fetching IA04A:", error)
      }
  }, [id, authLoading, user, asesorList])

  useEffect(() => {
    if (initialFetchDone.current) return
    initialFetchDone.current = true
    fetchData()
  }, [fetchData])

  const nextStepLabel = asesmenSteps[asesmenSteps.findIndex(s => s.href.includes('ia04a')) + 1]?.label
  const signing = useSigningState({
    pageKey: 'ia04a',
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
    nextPageName: nextStepLabel,
    onRefresh: fetchData,
  })
  const publishUpdate = signing.publishUpdate

  const handleNext = async () => {
    // Tahap 0: skip save/TTD, langsung navigasi next
    if (tahap === 0) {
      const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ia04a'))
      const nextStep = asesmenSteps[currentStepIndex + 1]
      navigate(nextStep ? nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`) : `/asesi/asesmen/${id}/selesai`)
      return
    }
    // If all signed → redirect
    if (signing.allSigned) {
      const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ia04a'))
      const nextStep = asesmenSteps[currentStepIndex + 1]
      if (nextStep) {
        const nextPath = nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`)
        navigate(nextPath)
      } else {
        navigate(`/asesi/asesmen/${id}/selesai`)
      }
      return
    }

    // If current user already signed but others haven't → redirect (prevent re-generate QR)
    if (!isAsesor && signing.asesiHasSigned) {
      const stepIdx = asesmenSteps.findIndex(s => s.href.includes('ia04a'))
      const next = asesmenSteps[stepIdx + 1]
      navigate(next ? next.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`) : `/asesi/asesmen/${id}/selesai`)
      return
    }

    if (isAsesor && signing.asesorHasSigned) {
      const stepIdx = asesmenSteps.findIndex(s => s.href.includes('ia04a'))
      const next = asesmenSteps[stepIdx + 1]
      navigate(next ? next.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`) : `/asesi/asesmen/${id}/selesai`)
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

    // Asesor 1 wajib isi umpan balik (cari soal dengan is_komentar === "2")
    const umpanBalikSoal = ia04aData?.soal.find(s => s.is_komentar === "2")
    if (isAsesor && isAsesor1 && umpanBalikSoal) {
      const umpanBalikValue = umpanBalikMap[umpanBalikSoal.id] || ''
      const trimmed = umpanBalikValue.trim()
      if (!trimmed) {
        showWarning('Silakan isi umpan balik terlebih dahulu')
        return
      }
      if (trimmed.length < 10) {
        showWarning('Umpan balik minimal 10 karakter')
        return
      }
      const words = trimmed.split(/\s+/).filter(w => w.length > 0)
      if (words.length < 3) {
        showWarning('Umpan balik minimal 3 kata')
        return
      }
      // Block single-char repeated / placeholder patterns like "-", "...", "bagus", "baik"
      const strippedSpecial = trimmed.replace(/[^a-zA-Z0-9]/g, '')
      if (strippedSpecial.length < 5) {
        showWarning('Umpan balik terlalu singkat, berikan masukan yang lebih detail')
        return
      }
    }

    const isAsesor2 = isAsesor && !isAsesor1
    const umpanBalikSoalId = umpanBalikSoal?.id
    const umpanBalikValue = umpanBalikSoalId ? (umpanBalikMap[umpanBalikSoalId] || '') : ''
    const isAsesor1WithUmpan = isAsesor && isAsesor1 && umpanBalikValue.trim()
    const token = localStorage.getItem("access_token")

    setIsSaving(true)

    try {
      // Asesor_2 hanya generate QR/tanda tangan jika belum ada
      if (isAsesor2) {
        if (!jadwalId) {
          showError('Jadwal tidak ditemukan')
          return
        }

        await signing.generateQR()
        publishUpdate()

        showSuccess('IA 04.A berhasil disimpan!')
        return
      }

      // Asesor_1: simpan umpan balik, lalu generate QR
      if (isAsesor1WithUmpan && umpanBalikSoalId) {
        try {
          const response = await fetch(`${API_BASE_URL}/asesmen/${id}/ia04a`, {
            method: 'POST',
            headers: {
              "Accept": "application/json",
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              soal_id: umpanBalikSoalId,
              jawaban: umpanBalikValue,
            }),
          })

          if (response.ok) {
            await response.json()
            await signing.generateQR()
            publishUpdate()
          } else {
            console.error('Failed to save umpan balik:', response.status)
          }
        } catch (err) {
          console.error('Error in asesor_1 flow:', err)
        }

        showSuccess('IA 04.A berhasil disimpan!')
        return
      }

      // Asesi: generate QR jika belum ada
      if (!isAsesor) {
        await signing.generateQR()
        publishUpdate()

        showSuccess('IA 04.A berhasil disimpan!')
        return
      }
    } finally {
      setIsSaving(false)
    }
  }

  const kelompokKerja = ia04aData?.kelompok_kerja?.kelompok_kerja?.[0]
  const units = kelompokKerja?.units || []

  if (!ia04aData) return <FullPageLoader text="Memuat data..." />

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Header */}

      <AsesmenBreadcrumb currentPage="IA.04.A" />

      <ModularAsesiLayout currentStep={1} steps={asesmenSteps} id={id} metode={metode}>
        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', letterSpacing: '1px' }}>
            {ia04aData?.kelompok_kerja.kode}
          </h1> {ia04aData?.kelompok_kerja.nama_dokumen || 'FR.IA.04. PENJELASAN SINGKAT PROYEK TERKAIT PEKERJAAN KEGIATAN TERSTRUKTUR LAINNYA'}
        </div>

        {/* Info Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '14px', background: '#fff', border: '1px solid #000' }}>
          <tbody>
            <tr style={{ background: '#e9e9e9e' }}>
              <td style={{ width: '30%', border: '1px solid #000', padding: '6px' }}>Skema Sertifikasi (̶𝙺̶𝙺̶𝙽̶𝙸̶/Okupasi/̶𝙺̶𝚕̶𝚊̶𝚜̶𝚝̶𝚎̶𝚛̶)̶</td>
              <td style={{ width: '5%', border: '1px solid #000', padding: '6px' }}>Judul</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>{jabatanKerja?.toLocaleUpperCase() || ''}</td>
            </tr>
            <tr style={{ background: '#e9e9e9e' }}>
              <td style={{ border: '1px solid #000', padding: '6px' }}></td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Nomor</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>{nomorSkema?.toUpperCase() || ''}</td>
            </tr>
            <tr style={{ background: '#e9e9e9e' }}>
              <td style={{ border: '1px solid #000', padding: '6px' }}>TUK</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>{tuk?.toUpperCase() || ''}</td>
            </tr>
            {asesorList.length > 1 ? (
              asesorList.map((asesor, idx) => (
                <tr key={asesor.id} style={{ background: '#e9e9e9e' }}>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>Nama Asesor {idx + 1}</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>:</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>
                    {asesor.nama?.toUpperCase() || ''}
                  </td>
                </tr>
              ))
            ) : (
              <tr style={{ background: '#e9e9e9e' }}>
                <td style={{ border: '1px solid #000', padding: '6px' }}>Nama Asesor</td>
                <td style={{ border: '1px solid #000', padding: '6px' }}>:</td>
                <td style={{ border: '1px solid #000', padding: '6px' }}>
                  {asesorList[0]?.nama?.toUpperCase() || ''}
                </td>
              </tr>
            )}
            <tr style={{ background: '#e9e9e9e' }}>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Nama Asesi</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>{namaAsesi?.toUpperCase() || user?.name?.toUpperCase() || ''}</td>
            </tr>
            <tr style={{ background: '#e9e9e9e' }}>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Tanggal</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ fontSize: '12px', marginTop: '5px' }}>*Coret yang tidak perlu</div>

        {/* Panduan Bagi Asesor */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '14px', fontSize: '14px', background: '#fff', border: '1px solid #000' }}>
          <tbody>
            <tr style={{ background: '#c40000', color: '#fff', fontWeight: 'bold' }}>
              <td>PANDUAN BAGI ASESOR</td>
            </tr>
            <tr>
              <td style={{ background: '#e9e9e9e', border: '1px solid #000', padding: '6px' }}>
                <ul style={{ margin: '5px 0 5px 18px', paddingLeft: '18px', listStyleType: 'disc' }}>
                  <li style={{ marginBottom: '6px' }}>Tentukan proyek singkat atau kegiatan terstruktur lainnya yang harus dipersiapkan dan dipresentasikan oleh asesi.</li>
                  <li style={{ marginBottom: '6px' }}>Proyek singkat atau kegiatan terstruktur lainnya dibuat untuk keseluruhan unit kompetensi dalam Skema Sertifikasi atau untuk masing-masing kelompok pekerjaan.</li>
                  <li style={{ marginBottom: '0' }}>Kumpulkan hasil proyek singkat atau kegiatan terstruktur lainnya sesuai dengan hasil keluaran yang telah ditetapkan.</li>
                </ul>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Kelompok Pekerjaan Table */}
        {kelompokKerja && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '14px', fontSize: '14px', background: '#fff', border: '1px solid #000' }}>
            <tbody>
              <tr style={{ background: '#c40000', color: '#fff', fontWeight: 'bold' }}>
                <td rowSpan={units.length + 1} style={{ width: '20%', textAlign: 'center', verticalAlign: 'middle', border: '1px solid #000', padding: '6px' }}>
                  {kelompokKerja.nama}
                </td>
                <td style={{ width: '8%', textAlign: 'center', border: '1px solid #000', padding: '6px' }}>No.</td>
                <td style={{ width: '25%', textAlign: 'center', border: '1px solid #000', padding: '6px' }}>Kode Unit</td>
                <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px' }}>Judul Unit</td>
              </tr>
              {units.map((unit, index) => (
                <tr key={unit.id_unit}>
                  <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px' }}>{index + 1}</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>{unit.kode_unit}</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>{unit.nama_unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <br />
        {/* Soal Sections */}
        {ia04aData?.soal.map((soalItem) => (
          <table key={soalItem.id} style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', background: '#fff', border: '1px solid #000' }}>
            <tbody>
              <tr>
                <td style={{ width: '28%', background: '#e9e9e9e', fontWeight: 'bold', border: '1px solid #000', padding: '6px' }}>
                  {soalItem.soal}
                </td>
                <td style={{ border: '1px solid #000', padding: '6px' }}>
                  {soalItem.is_komentar === "2" ? (
                    // Umpan balik - editable for asesor_1
                    isAsesor && isAsesor1 ? (
                      <textarea
                        value={umpanBalikMap[soalItem.id] || ''}
                        onChange={(e) => setUmpanBalikMap(prev => ({ ...prev, [soalItem.id]: e.target.value }))}
                        style={{ width: '100%', height: '100px', border: '1px solid #ccc', padding: '8px', fontSize: '13px', resize: 'none', fontFamily: 'Arial, Helvetica, sans-serif' }}
                        placeholder="Tuliskan umpan balik untuk asesi (minimal 10 karakter / 3 kata)..."
                      />
                    ) : (
                      <p style={{ margin: '5px 0' }}>{umpanBalikMap[soalItem.id] || soalItem.jawaban || '-'}</p>
                    )
                  ) : soalItem.jenis === '1' ? (
                    <div
                      style={{ margin: '5px 0', lineHeight: '1.6' }}
                      dangerouslySetInnerHTML={{ __html: soalItem.jawaban }}
                    />
                  ) : (
                    <div style={{ height: '60px' }}></div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        ))}

        {/* Signature Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '14px', fontSize: '14px', background: '#fff', border: '1px solid #000' }}>
          <tbody>
            <tr style={{ textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000' }}>
              <td>Tanda Tangan Asesi</td>
              <td colSpan={asesorList.length}>Tanda Tangan Asesor</td>
              <td style={{ display: asesorList.length > 0 ? 'none' : 'table-cell' }}>Nama & Tanda Tangan Supervisor Tempat Kerja</td>
            </tr>
            {/* Asesi Signature Row */}
            <tr>
              <td style={{ height: '120px', border: '1px solid #000', padding: '6px', verticalAlign: 'middle', textAlign: 'center' }}>
                {barcodes?.asesi?.url ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {barcodes.asesi.nama}
                    </div>
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
              {asesorList.map((asesor, idx) => {
                const asesorBarcode = idx === 0 ? barcodes?.asesor1 : barcodes?.asesor2
                return (
                  <td key={asesor.id} style={{ height: '120px', border: '1px solid #000', padding: '6px', verticalAlign: 'middle', textAlign: 'center' }}>
                    {asesorBarcode?.url ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                          {asesorBarcode.nama.toUpperCase()}
                        </div>
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
                )
              })}
              <td style={{ display: asesorList.length > 0 ? 'none' : 'table-cell', height: '120px', border: '1px solid #000', padding: '6px' }}></td>
            </tr>
          </tbody>
        </table>

        {/* Status Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '14px', fontSize: '14px', background: '#fff', border: '1px solid #000' }}>
          <tbody>
            <tr style={{ textAlign: 'center', fontWeight: 'bold' }}>
              <td style={{ width: '15%', border: '1px solid #000', padding: '6px' }}>STATUS</td>
              <td style={{ width: '8%', border: '1px solid #000', padding: '6px' }}>NO</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>NAMA</td>
              <td style={{ width: '20%', border: '1px solid #000', padding: '6px' }}>NOMOR MET</td>
              <td style={{ width: '20%', border: '1px solid #000', padding: '6px' }}>TANDA TANGAN DAN TANGGAL</td>
            </tr>
            {/* PENYUSUN */}
            {(namaPenyusun || barcodePenyusun) ? (
              <tr style={{ background: '#e9e9e9e', fontWeight: 'bold' }}>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>PENYUSUN</td>
                <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px' }}>1</td>
                <td style={{ border: '1px solid #000', padding: '6px' }}>{namaPenyusun?.toUpperCase() || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '6px' }}>{noregPenyusun || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'middle', textAlign: 'center' }}>
                  {barcodePenyusun ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <img src={barcodePenyusun} alt="TTD Penyusun" style={{ height: '50px', width: '50px', objectFit: 'contain' }} />
                      {tanggalPenyusun && (
                        <div style={{ fontSize: '11px', color: '#333' }}>
                          {new Date(tanggalPenyusun).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  ) : '-'}
                </td>
              </tr>
            ) : (
              <>
                <tr style={{ background: '#e9e9e9e', fontWeight: 'bold' }}>
                  <td rowSpan={2} style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>PENYUSUN</td>
                  <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px' }}>1</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}></td>
                </tr>
                <tr style={{ background: '#e9e9e9e' }}>
                  <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px' }}>2</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}></td>
                </tr>
              </>
            )}
            {/* VALIDATOR */}
            {(namaValidator || barcodeValidator) ? (
              <tr style={{ background: '#e9e9e9e', fontWeight: 'bold' }}>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>VALIDATOR</td>
                <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px' }}>1</td>
                <td style={{ border: '1px solid #000', padding: '6px' }}>{namaValidator?.toUpperCase() || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '6px' }}>{noregValidator || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'middle', textAlign: 'center' }}>
                  {barcodeValidator ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <img src={barcodeValidator} alt="TTD Validator" style={{ height: '50px', width: '50px', objectFit: 'contain' }} />
                      {tanggalValidator && (
                        <div style={{ fontSize: '11px', color: '#333' }}>
                          {new Date(tanggalValidator).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  ) : '-'}
                </td>
              </tr>
            ) : (
              <>
                <tr style={{ background: '#e9e9e9e', fontWeight: 'bold' }}>
                  <td rowSpan={2} style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>VALIDATOR</td>
                  <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px' }}>1</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}></td>
                </tr>
                <tr style={{ background: '#e9e9e9e' }}>
                  <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px' }}>2</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}></td>
                </tr>
              </>
            )}
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
                Saya menyatakan dengan sebenar-benarnya bahwa saya telah memahami instruksi tugas terstruktur dan akan menyelesaikan tugas tersebut sesuai dengan ketentuan yang berlaku. Saya bertanggung jawab penuh atas keaslian dan kelengkapan tugas yang saya serahkan.
              </span>
            </label>
          </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            {isAsesor && (
            <ActionButton variant="secondary" onClick={() => navigate("/asesi/dashboard")}>
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
