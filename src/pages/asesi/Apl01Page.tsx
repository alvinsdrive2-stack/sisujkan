import { useState, useEffect, useCallback, useRef } from "react"
import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
import { useNavigate, useParams } from "react-router-dom"
import AsesiLayout from "@/components/AsesiLayout"
import DashboardNavbar from "@/components/DashboardNavbar"
import UuidStepIndicator from "@/components/UuidStepIndicator"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/ToastContext"
import { kegiatanService } from "@/lib/kegiatan-service"
import { CustomCheckbox } from "@/components/ui/Checkbox"
import { ActionButton } from "@/components/ui/ActionButton"
import { useKegiatanByRole } from "@/hooks/useKegiatanByRole"
import { useDataDokumenPraAsesmen } from "@/hooks/useDataDokumenPraAsesmen"
import { useAbsenCheck } from "@/hooks/useAbsenCheck"
import { WebcamModal } from "@/components/ui/WebcamModal"
import { API_BASE_URL } from "@/config/api"
import { useSigningState, BarcodeState } from "@/hooks/useSigningState"
import { FullPageLoader } from "@/components/ui/loading-spinner"

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("access_token")
  const h: Record<string, string> = { "Accept": "application/json" }
  if (token) h["Authorization"] = `Bearer ${token}`
  return h
}

interface DataPribadi {
  nama: string
  nik: string
  tempat_lahir: string
  tanggal_lahir: string
  jenis_kelamin: string
  kebangsaan: string
  alamat: string
  telepon_rumah: string | null
  telepon_hp: string
  kode_pos: string | null
  email: string
  kualifikasi: string
}

interface DataPekerjaan {
  perusahaan: string
  jabatan: string
  alamat_kantor: string | null
  kode_pos: number | null
  telepon_kantor: string | null
  fax: string | null
  email_kantor: string | null
}

interface SertifikasiOption {
  id: string
  label: string
  checked: boolean
}

interface DataSertifikasi {
  judul: string
  nomor: string
  options: SertifikasiOption[]
}

interface UnitKompetensi {
  kode: string
  nama: string
}

interface BuktiPersyaratan {
  no: string
  bukti: string
  checked: boolean
}

interface BuktiAdministratif {
  no: string
  bukti: string
  checked?: boolean
}

interface BarcodeInfo {
  url: string | null
  tanggal: string | null
  nama: string | null
}

interface ApiResponse {
  message: string
  data: {
    data_pribadi: DataPribadi
    data_pekerjaan: DataPekerjaan
    data_sertifikasi?: DataSertifikasi
    is_memenuhi_syarat?: boolean
    skkni?: string
    id_jadwal?: number
    data_unit_kompetensi?: Array<{
      kode: string
      nama: string
    }>
    bukti_persyaratan?: Array<{
      no: string
      bukti: string
      checked: boolean
    }>
    bukti_administratif?: Array<{
      no: string
      bukti: string
      checked?: boolean
    }>
    is_diterima?: boolean
    catatan?: string | null
    barcodes?: {
      asesi: BarcodeInfo
      admin: BarcodeInfo
    }
  }
}

function Apl01Layout({ isUuidFlow, idIzin, tahap, children }: { isUuidFlow: boolean; idIzin?: string; tahap?: number; children: React.ReactNode }) {
  return isUuidFlow ? (
    <div style={{ padding: '30px 16px', maxWidth: '860px', margin: '0 auto' }}>
      <UuidStepIndicator currentStep={2} isVerifikasiPage={false} />
      <div style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', padding: '32px 40px', marginTop: '24px', borderRadius: '2px' }}>
        {children}
      </div>
    </div>
  ) : (
    <AsesiLayout currentStep={2} idIzin={idIzin} tahap={tahap} showVerifikasiTukAjj={false}>{children}</AsesiLayout>
  )
}

export default function Apl01Page() {
  const navigate = useNavigate()
  const isUuidSession = sessionStorage.getItem("isUuidFlow") === "true"
  const { user } = useAuth()
  const { isAsesor } = useKegiatanByRole()
  const { idIzin: idIzinFromUrl } = useParams<{ idIzin: string }>()

  const idIzin = isUuidSession ? idIzinFromUrl : (isAsesor ? idIzinFromUrl : user?.id_izin)

  // Get asesor data for absen check
  const { asesorList, tahap, jadwalId, namaAsesi } = useDataDokumenPraAsesmen(idIzin)

  // UUID flow only valid at tahap 0
  const isUuidFlow = isUuidSession && (tahap === 0 || tahap === undefined)

  const { showSuccess, showError, showWarning } = useToast()

  const [_dataPribadi, setDataPribadi] = useState<DataPribadi | null>(null)
  const [_dataPekerjaan, setDataPekerjaan] = useState<DataPekerjaan | null>(null)
  const [dataSertifikasi, setDataSertifikasi] = useState<DataSertifikasi | null>(null)
  const [dataUnitKompetensi, setDataUnitKompetensi] = useState<UnitKompetensi[]>([])
  const [buktiPersyaratan, setBuktiPersyaratan] = useState<BuktiPersyaratan[]>([])
  const [buktiAdministratif, setBuktiAdministratif] = useState<BuktiAdministratif[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [skkni, setSkkni] = useState<string>("")
  const [catatan, setCatatan] = useState<string | null>(null)
  const [isDiterima, setIsDiterima] = useState<boolean | undefined>(undefined)
  const [barcodes, setBarcodes] = useState<{ asesi: BarcodeInfo; admin: BarcodeInfo } | null>(null)
  const [dokumenAsesi, setDokumenAsesi] = useState<Record<string, string>>({})
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

  // Form state for data pribadi
  const [formDataPribadi, setFormDataPribadi] = useState<DataPribadi>({
    nama: "",
    nik: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    jenis_kelamin: "",
    kebangsaan: "",
    alamat: "",
    telepon_rumah: "",
    telepon_hp: "",
    kode_pos: "",
    email: "",
    kualifikasi: ""
  })

  // Form state for data pekerjaan - sesuai API response
  const [formDataPekerjaan, setFormDataPekerjaan] = useState<DataPekerjaan>({
    perusahaan: "",
    jabatan: "",
    alamat_kantor: "",
    kode_pos: null,
    telepon_kantor: "",
    fax: "",
    email_kantor: ""
  })

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token")

      if (!idIzin) {
        return
      }

      const apl01Response = await fetch(`${API_BASE_URL}/praasesmen/${idIzin}/apl01`, {
        headers: isUuidFlow ? authHeaders() : {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (apl01Response.ok) {
        const result: ApiResponse = await apl01Response.json()
        if (result.message === "Success") {
          setDataPribadi(result.data.data_pribadi)
          setDataPekerjaan(result.data.data_pekerjaan)
          setFormDataPribadi(result.data.data_pribadi)
          setFormDataPekerjaan(result.data.data_pekerjaan)
          if (result.data.data_sertifikasi) {
            setDataSertifikasi(result.data.data_sertifikasi)
          }
          if (result.data.data_unit_kompetensi) {
            setDataUnitKompetensi(result.data.data_unit_kompetensi)
          }
          if (result.data.bukti_persyaratan) {
            setBuktiPersyaratan(result.data.bukti_persyaratan)
          }
          if (result.data.bukti_administratif) {
            setBuktiAdministratif(result.data.bukti_administratif)
          }
          if (result.data.skkni) {
            setSkkni(result.data.skkni)
          }
          if (result.data.catatan !== undefined) {
            setCatatan(result.data.catatan)
          }
          if (result.data.is_diterima !== undefined) {
            setIsDiterima(result.data.is_diterima)
          }
          if (result.data.barcodes) {
            setBarcodes(result.data.barcodes)
          }
          setIsDataLoading(false)
        }
      }

      // fetch dokumen file URLs for bukti persyaratan
      let dokumenMap: Record<string, string> = {}
      try {
        const docRes = await fetch(`${API_BASE_URL}/kegiatan/${idIzin}/dokumen-asesi`, {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
          },
        })
        if (docRes.ok) {
          const docJson = await docRes.json()
          if (docJson.message === "Success" && docJson.data) {
            dokumenMap = { ...docJson.data }
          }
        }
      } catch {}

      // fetch kebenaran-data for pas_foto (used by bukti administratif)
      try {
        const kebRes = await fetch(`${API_BASE_URL}/praasesmen/kebenaran-data/${idIzin}`, {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
          },
        })
        if (kebRes.ok) {
          const kebJson = await kebRes.json()
          if (kebJson.success && kebJson.data) {
            if (kebJson.data.pas_foto) dokumenMap['pas_foto'] = kebJson.data.pas_foto
            if (kebJson.data.ktp) dokumenMap['ktp'] = kebJson.data.ktp
          }
        }
      } catch {}

      setDokumenAsesi(dokumenMap)

    } catch (error) {
      // Continue with empty form
      setIsDataLoading(false)
    }
  }, [idIzin])

  // map bukti label to dokumen-asesi key
  const getDokumenUrl = useCallback((label: string): string | null => {
    const lower = label.toLowerCase()
    if (lower.includes('ktp')) return dokumenAsesi['ktp'] ?? null
    if (lower.includes('npwp')) return dokumenAsesi['npwp'] ?? null
    if (lower.includes('ijazah')) return dokumenAsesi['ijazah'] ?? null
    if (lower.includes('pas') && lower.includes('foto')) return dokumenAsesi['pas_foto'] ?? null
    if (lower.includes('foto')) return dokumenAsesi['pas_foto'] ?? null
    if (lower.includes('referensi') || lower.includes('surat')) return dokumenAsesi['referensi_kerja'] ?? null
    if (lower.includes('spt') || lower.includes('asesor')) return dokumenAsesi['spt_asesor'] ?? null
    if (lower.includes('verifikasi') || lower.includes('tuk')) return dokumenAsesi['verifikasi_tuk'] ?? null
    return null
  }, [dokumenAsesi])

  const signing = useSigningState({
    pageKey: 'apl01',
    isAsesor,
    tahap,
    barcodes: barcodes as unknown as BarcodeState | null,
    setBarcodes: setBarcodes as unknown as React.Dispatch<React.SetStateAction<BarcodeState | null>>,
    asesorList,
    userId: user?.id,
    userName: user?.name,
    isSaving,
    idIzin,
    jadwalId,
    onRefresh: fetchData,
  })

  const initialFetchDone = useRef(false)

  useEffect(() => {
    if (initialFetchDone.current) return
    initialFetchDone.current = true
    window.scrollTo(0, 0)
    if (idIzin) {
      fetchData()
    }
  }, [idIzin, fetchData])

  const handleSave = async () => {
    const targetIdIzin = idIzin || user?.id_izin
    if (!targetIdIzin) {
      return
    }

    // UUID flow: save, generate QR, then redirect to public route
    if (isUuidFlow) {
      if (!signing.agreedChecklist) { showWarning('Silakan centang pernyataan terlebih dahulu'); return }
      setIsSaving(true)
      try {
        const res = await fetch(`${API_BASE_URL}/praasesmen/${targetIdIzin}/apl01`, {
          method: "POST",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify(formDataPekerjaan),
        })
        if (!res.ok) throw new Error("Gagal menyimpan")

        // Generate QR for UUID flow
        try {
          await fetch(`${API_BASE_URL}/qr/${targetIdIzin}/apl01`, {
            method: 'POST',
            headers: { ...authHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_jadwal: jadwalId ?? "" }),
          })
        } catch (qrErr) {
          console.error('Error generating QR APL01:', qrErr)
        }

        showSuccess('APL 01 berhasil ditandatangani!')
        navigate(`/praasesmen/${targetIdIzin}/apl02`)
      } catch (err) {
        showError(err instanceof Error ? err.message : "Gagal menyimpan data pekerjaan")
      } finally { setIsSaving(false) }
      return
    }

    // Tahap 0: langsung navigasi tanpa save/ttd (asesor route, asesor navbar)
    if (tahap === 0) {
      navigate(`/asesi/praasesmen/${targetIdIzin}/apl02`)
      return
    }

    // Asesor — asesor route, asesor navbar
    if (isAsesor) {
      navigate(`/asesi/praasesmen/${targetIdIzin}/apl02`)
      return
    }

    // Jika asesi sudah pernah tanda tangan, langsung navigate ke APL 02
    if (signing.asesiHasSigned) {
      navigate(`/asesi/praasesmen/${targetIdIzin}/apl02`)
      return
    }

    if (!signing.agreedChecklist) {
      showWarning('Silakan centang pernyataan terlebih dahulu')
      return
    }

    // Asesi - generate QR dulu kalau belum ada, lalu save data pekerjaan
    try {
      setIsSaving(true)

      // Generate QR jika belum ada (skip untuk tahap 0)
      if (tahap !== 0 && !barcodes?.asesi?.url && jadwalId) {
        await signing.generateQR()
      }

      // Save data pekerjaan
      await kegiatanService.saveApl01DataPekerjaan(targetIdIzin, formDataPekerjaan)
      showSuccess('APL 01 berhasil disimpan!')
      signing.publishUpdate()
    } catch (error) {
      showError(error instanceof Error ? error.message : "Gagal menyimpan data pekerjaan")
    } finally {
      setIsSaving(false)
    }
  }

  if (isDataLoading) return <FullPageLoader text="Memuat data..." />

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif'}}>
      {isUuidFlow && <DashboardNavbar userName={namaAsesi || 'Asesi'} />}

      {!isUuidFlow && <AsesmenBreadcrumb currentPage="APL 01" />}

      <Apl01Layout isUuidFlow={isUuidFlow} idIzin={idIzin} tahap={tahap}>
            {/* Title */}
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', marginBottom: '4px', textTransform: 'uppercase' }}>FR. APL.01 - FORMULIR APL 01</h2>
              <p style={{ fontSize: '13px', color: '#666' }}>Isi atau lengkapi data formulir APL 01 di bawah ini</p>
            </div>

            
            <div style={{  padding: '4px ', marginBottom: '5px' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>Bagian 1 :  Rincian Data Pemohon Sertifikasi</span>
            </div>
            <div style={{  padding: '2px 12px', marginBottom: '10px' }}>
              <span style={{ fontSize: '16px', color: '#000', }}>Pada bagian ini, cantumkan data pribadi, data pendidikan formal serta data pekerjaan 
anda pada saat ini.</span>
            </div>

            {/* A. DATA PRIBADI */}
            <div style={{  padding: '8px 12px', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>A. DATA PRIBADI</span>
            </div>

        <table style={{ width: '100%', maxWidth: '100%', background: '#fff', border: '1px solid #000', borderCollapse: 'collapse', fontSize: '13px', color: '#000', marginBottom: '20px' }}>
          <tbody>
            <tr>
              <td style={{ width: '200px', background: '#fff', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'middle', textTransform: 'uppercase' }}>Nama</td>
              <td style={{ border: '1px solid #000', padding: '4px 8px', verticalAlign: 'middle' }}>
                <input
                  type="text"
                  value={formDataPribadi.nama}
                  disabled
                  style={{ width: '100%', padding: '4px 6px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Arial, Helvetica, sans-serif', cursor: 'not-allowed', background: '#f5f5f5', textTransform: 'uppercase' }}
                />
              </td>
            </tr>
            <tr>
              <td style={{ width: '200px', background: '#fff', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'middle', textTransform: 'uppercase' }}>No. NIK</td>
              <td style={{ border: '1px solid #000', padding: '4px 8px', verticalAlign: 'middle' }}>
                <input
                  type="text"
                  value={formDataPribadi.nik}
                  disabled
                  style={{ width: '100%', padding: '4px 6px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Arial, Helvetica, sans-serif', cursor: 'not-allowed', background: '#f5f5f5', textTransform: 'uppercase' }}
                />
              </td>
            </tr>
            <tr>
              <td style={{ width: '200px', background: '#fff', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'middle', textTransform: 'uppercase' }}>Tempat/tgl. Lahir</td>
              <td style={{ border: '1px solid #000', padding: '4px 8px', verticalAlign: 'middle' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={formDataPribadi.tempat_lahir}
                    disabled
                    placeholder="Tempat Lahir"
                    style={{ flex: 1, padding: '4px 6px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Arial, Helvetica, sans-serif', cursor: 'not-allowed', background: '#f5f5f5', textTransform: 'uppercase' }}
                  />
                  <input
                    type="date"
                    value={formDataPribadi.tanggal_lahir}
                    disabled
                    style={{ flex: 1, padding: '4px 6px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Arial, Helvetica, sans-serif', cursor: 'not-allowed', background: '#f5f5f5' }}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td style={{ width: '200px', background: '#fff', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'middle', textTransform: 'uppercase' }}>Jenis kelamin</td>
              <td style={{ border: '1px solid #000', padding: '4px 8px', verticalAlign: 'middle' }}>
                <select
                  value={formDataPribadi.jenis_kelamin}
                  disabled
                  style={{ padding: '4px 6px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Arial, Helvetica, sans-serif', minWidth: '150px', cursor: 'not-allowed', background: '#f5f5f5', textTransform: 'uppercase' }}
                >
                  <option value="">Pilih</option>
                  <option value="Pria">Pria</option>
                  <option value="Wanita">Wanita</option>
                </select>
              </td>
            </tr>
            <tr>
              <td style={{ width: '200px', background: '#fff', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'middle', textTransform: 'uppercase' }}>Kebangsaan</td>
              <td style={{ border: '1px solid #000', padding: '4px 8px', verticalAlign: 'middle' }}>
                <input
                  type="text"
                  value={formDataPribadi.kebangsaan}
                  disabled
                  style={{ width: '100%', padding: '4px 6px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Arial, Helvetica, sans-serif', cursor: 'not-allowed', background: '#f5f5f5', textTransform: 'uppercase' }}
                />
              </td>
            </tr>
            <tr>
              <td style={{ width: '200px', background: '#fff', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'middle', textTransform: 'uppercase' }}>Alamat</td>
              <td style={{ border: '1px solid #000', padding: '4px 8px', verticalAlign: 'middle' }}>
                <textarea
                  value={formDataPribadi.alamat}
                  disabled
                  rows={3}
                  style={{ width: '100%', padding: '4px 6px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Arial, Helvetica, sans-serif', resize: 'vertical', cursor: 'not-allowed', background: '#f5f5f5', textTransform: 'uppercase' }}
                />
              </td>
            </tr>
            <tr>
              <td style={{ width: '200px', background: '#fff', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'middle', textTransform: 'uppercase' }}>No. Telp/E-mail</td>
              <td style={{ border: '1px solid #000', padding: '4px 8px', verticalAlign: 'middle' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '80px', padding: '2px', textTransform: 'uppercase' }}>Rumah</td>
                      <td style={{ padding: '2px' }}>
                        <input
                          type="text"
                          value={formDataPribadi.telepon_rumah || ""}
                          disabled
                          style={{ width: '100%', padding: '4px 6px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Arial, Helvetica, sans-serif', cursor: 'not-allowed', background: '#f5f5f5', textTransform: 'uppercase' }}
                        />
                      </td>
                      <td style={{ width: '30px', padding: '2px', textTransform: 'uppercase' }}>HP</td>
                      <td style={{ padding: '2px' }}>
                        <input
                          type="text"
                          value={formDataPribadi.telepon_hp}
                          disabled
                          style={{ width: '100%', padding: '4px 6px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Arial, Helvetica, sans-serif', cursor: 'not-allowed', background: '#f5f5f5', textTransform: 'uppercase' }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style={{ width: '80px', padding: '2px', textTransform: 'uppercase' }}>Email</td>
                      <td colSpan={3} style={{ padding: '2px' }}>
                        <input
                          type="email"
                          value={formDataPribadi.email}
                          disabled
                          style={{ width: '100%', padding: '4px 6px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Arial, Helvetica, sans-serif', cursor: 'not-allowed', background: '#f5f5f5', textTransform: 'uppercase' }}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td style={{ width: '200px', background: '#fff', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'middle', textTransform: 'uppercase' }}>Kualifikasi/Pendidikan</td>
              <td style={{ border: '1px solid #000', padding: '4px 8px', verticalAlign: 'middle' }}>
                <input
                  type="text"
                  value={formDataPribadi.kualifikasi}
                  disabled
                  style={{ width: '100%', padding: '4px 6px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Arial, Helvetica, sans-serif', cursor: 'not-allowed', background: '#f5f5f5', textTransform: 'uppercase' }}
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* B. DATA PEKERJAAN */}
        <div style={{  padding: '8px 12px', marginBottom: '10px'}}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>B. DATA PEKERJAAN</span>
        </div>

        <table style={{ width: '100%', maxWidth: '100%', background: '#fff', border: '1px solid #000', borderCollapse: 'collapse', fontSize: '13px', color: '#000', marginBottom: '20px' }}>
          <tbody>
            <tr>
              <td style={{ width: '200px', background: '#fff', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'middle', textTransform: 'uppercase' }}>Nama Perusahaan</td>
              <td style={{ border: '1px solid #000', padding: '4px 8px', verticalAlign: 'middle' }}>
                <input
                  type="text"
                  value={formDataPekerjaan.perusahaan}
                  onChange={(e) => setFormDataPekerjaan({ ...formDataPekerjaan, perusahaan: e.target.value })}
                  disabled={isAsesor || isSaving}
                  style={{ width: '100%', padding: '4px 6px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Arial, Helvetica, sans-serif', textTransform: 'uppercase', cursor: (isAsesor || isSaving) ? 'not-allowed' : 'text', background: (isAsesor || isSaving) ? '#f5f5f5' : '#fff' }}
                />
              </td>
            </tr>
            <tr>
              <td style={{ width: '200px', background: '#fff', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'middle', textTransform: 'uppercase' }}>Jabatan</td>
              <td style={{ border: '1px solid #000', padding: '4px 8px', verticalAlign: 'middle' }}>
                <input
                  type="text"
                  value={formDataPekerjaan.jabatan}
                  onChange={(e) => setFormDataPekerjaan({ ...formDataPekerjaan, jabatan: e.target.value })}
                  disabled={isAsesor || isSaving}
                  style={{ width: '100%', padding: '4px 6px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Arial, Helvetica, sans-serif', textTransform: 'uppercase', cursor: (isAsesor || isSaving) ? 'not-allowed' : 'text', background: (isAsesor || isSaving) ? '#f5f5f5' : '#fff' }}
                />
              </td>
            </tr>
            <tr>
              <td style={{ width: '200px', background: '#fff', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'middle', textTransform: 'uppercase' }}>Alamat Perusahaan</td>
              <td style={{ border: '1px solid #000', padding: '4px 8px', verticalAlign: 'middle' }}>
                <textarea
                  value={formDataPekerjaan.alamat_kantor || ""}
                  onChange={(e) => setFormDataPekerjaan({ ...formDataPekerjaan, alamat_kantor: e.target.value })}
                  disabled={isAsesor || isSaving}
                  rows={3}
                  style={{ width: '100%', padding: '4px 6px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Arial, Helvetica, sans-serif', resize: 'vertical', textTransform: 'uppercase', cursor: (isAsesor || isSaving) ? 'not-allowed' : 'text', background: (isAsesor || isSaving) ? '#f5f5f5' : '#fff' }}
                />
              </td>
            </tr>
            <tr>
              <td style={{ width: '200px', background: '#fff', border: '1px solid #000', padding: '6px 8px', verticalAlign: 'middle', textTransform: 'uppercase' }}>No. Telp/Fax/Email</td>
              <td style={{ border: '1px solid #000', padding: '4px 8px', verticalAlign: 'middle' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '50px', padding: '2px', textTransform: 'uppercase' }}>Telp</td>
                      <td style={{ padding: '2px' }}>
                        <input
                          type="text"
                          value={formDataPekerjaan.telepon_kantor || ""}
                          onChange={(e) => setFormDataPekerjaan({ ...formDataPekerjaan, telepon_kantor: e.target.value })}
                          disabled={isAsesor || isSaving}
                          style={{ width: '100%', padding: '4px 6px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Arial, Helvetica, sans-serif', textTransform: 'uppercase', cursor: (isAsesor || isSaving) ? 'not-allowed' : 'text', background: (isAsesor || isSaving) ? '#f5f5f5' : '#fff' }}
                        />
                      </td>
                      <td style={{ width: '40px', textTransform: 'uppercase', padding: '6px 8px'  }}>Fax</td>
                      <td style={{ padding: '2px' }}>
                        <input
                          type="text"
                          value={formDataPekerjaan.fax || ""}
                          onChange={(e) => setFormDataPekerjaan({ ...formDataPekerjaan, fax: e.target.value })}
                          disabled={isAsesor || isSaving}
                          style={{ width: '100%', padding: '4px 6px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Arial, Helvetica, sans-serif', textTransform: 'uppercase', cursor: (isAsesor || isSaving) ? 'not-allowed' : 'text', background: (isAsesor || isSaving) ? '#f5f5f5' : '#fff' }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style={{ width: '50px', padding: '2px', textTransform: 'uppercase' }}>Email</td>
                      <td  style={{ padding: '2px' }}>
                        <input
                          type="email"
                          value={formDataPekerjaan.email_kantor || ""}
                          onChange={(e) => setFormDataPekerjaan({ ...formDataPekerjaan, email_kantor: e.target.value })}
                          disabled={isAsesor || isSaving}
                          style={{ width: '100%', padding: '4px 6px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Arial, Helvetica, sans-serif', textTransform: 'uppercase', cursor: (isAsesor || isSaving) ? 'not-allowed' : 'text', background: (isAsesor || isSaving) ? '#f5f5f5' : '#fff' }}
                        />
                      </td>
                      <td style={{ width: '200px', background: '#fff', padding: '6px 8px', verticalAlign: 'middle', textTransform: 'uppercase' }}>Kode Pos</td>
              <td style={{ verticalAlign: 'middle' }}>
                <input
                  type="number"
                  value={formDataPekerjaan.kode_pos || ""}
                  onChange={(e) => setFormDataPekerjaan({ ...formDataPekerjaan, kode_pos: e.target.value ? parseInt(e.target.value) : null })}
                  disabled={isAsesor || isSaving}
                  style={{ width: '100%', padding: '4px 6px', border: '1px solid #000', fontSize: '13px', fontFamily: 'Arial, Helvetica, sans-serif', cursor: (isAsesor || isSaving) ? 'not-allowed' : 'text', background: (isAsesor || isSaving) ? '#f5f5f5' : '#fff' }}
                />
              </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{  padding: '4px ', marginBottom: '5px' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>Bagian  2 :  Data Sertifikasi</span>
            </div>
            <div style={{  padding: '2px 12px', marginBottom: '10px' }}>
              <span style={{ fontSize: '16px', color: '#000', }}>Tuliskan Judul dan Nomor Skema Sertifikasi serta Daftar Unit Kompetensi sesuai kemasan pada skema sertifikasi yang anda ajukan untuk mendapatkan pengakuan sesuai dengan latar belakang pendidikan, pelatihan serta pengalaman kerja yang anda miliki.</span>
            </div>
            

        <table style={{ width: '100%', maxWidth: '100%', background: '#fff', border: '1px solid #000', borderCollapse: 'collapse', fontSize: '14px', color: '#000', marginBottom: '20px' }}>
          <tbody>
            {/* Skema Sertifikasi */}
            <tr>
              <td rowSpan={2} style={{ width: '25%', border: '1px solid #000', padding: '8px 10px', verticalAlign: 'middle', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Skema Sertifikasi Okupasi Nasional
              </td>
              <td style={{ width: '10%', border: '1px solid #000', padding: '8px 10px', verticalAlign: 'middle', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' }}>Judul</td>
              <td style={{ width: '65%', border: '1px solid #000', padding: '8px 10px', verticalAlign: 'middle' }}>
                : {dataSertifikasi?.judul || '-'}
              </td>
            </tr>
            <tr>
              <td style={{ width: '10%', border: '1px solid #000', padding: '8px 10px', verticalAlign: 'middle', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' }}>Nomor</td>
              <td style={{ width: '65%', border: '1px solid #000', padding: '8px 10px', verticalAlign: 'middle' }}>
                : {dataSertifikasi?.nomor || '-'}
              </td>
            </tr>

            {/* Tujuan Asesmen */}
            {dataSertifikasi?.options && dataSertifikasi.options.length > 0 ? (
              dataSertifikasi.options.map((option, index) => (
                <tr key={option.id}>
                  {index === 0 && (
                    <td rowSpan={dataSertifikasi.options.length} style={{ width: '25%', border: '1px solid #000', padding: '8px 10px', verticalAlign: 'middle', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      Tujuan Asesmen
                    </td>
                  )}
                  <td style={{ width: '10%', border: '1px solid #000', padding: '8px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <CustomCheckbox checked={option.checked} onChange={() => {}} disabled />
                    </div>
                  </td>
                  <td style={{ width: '65%', border: '1px solid #000', padding: '8px 10px', verticalAlign: 'middle', textTransform: 'uppercase' }}>{option.label}</td>
                </tr>
              ))
            ) : (
              <>
                <tr>
                  <td rowSpan={5} style={{ width: '25%', border: '1px solid #000', padding: '8px 10px', verticalAlign: 'middle', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    Tujuan Asesmen
                  </td>
                  <td style={{ width: '10%', border: '1px solid #000', padding: '8px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <CustomCheckbox checked={false} onChange={() => {}} disabled />
                    </div>
                  </td>
                  <td style={{ width: '65%', border: '1px solid #000', padding: '8px 10px', verticalAlign: 'middle', textTransform: 'uppercase' }}>Sertifikasi</td>
                </tr>
                <tr>
                  <td style={{ width: '10%', border: '1px solid #000', padding: '8px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <CustomCheckbox checked={false} onChange={() => {}} disabled />
                    </div>
                  </td>
                  <td style={{ width: '65%', border: '1px solid #000', padding: '8px 10px', verticalAlign: 'middle', textTransform: 'uppercase' }}>Sertifikasi Ulang</td>
                </tr>
                <tr>
                  <td style={{ width: '10%', border: '1px solid #000', padding: '8px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <CustomCheckbox checked={false} onChange={() => {}} disabled />
                    </div>
                  </td>
                  <td style={{ width: '65%', border: '1px solid #000', padding: '8px 10px', verticalAlign: 'middle', textTransform: 'uppercase' }}>Pengakuan Kompetensi Terkini (PKT)</td>
                </tr>
                <tr>
                  <td style={{ width: '10%', border: '1px solid #000', padding: '8px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <CustomCheckbox checked={false} onChange={() => {}} disabled />
                    </div>
                  </td>
                  <td style={{ width: '65%', border: '1px solid #000', padding: '8px 10px', verticalAlign: 'middle', textTransform: 'uppercase' }}>Rekognisi pembelajaran lampau</td>
                </tr>
                <tr>
                  <td style={{ width: '10%', border: '1px solid #000', padding: '8px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <CustomCheckbox checked={false} onChange={() => {}} disabled />
                    </div>
                  </td>
                  <td style={{ width: '65%', border: '1px solid #000', padding: '8px 10px', verticalAlign: 'middle', textTransform: 'uppercase' }}>Lainnya:</td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        {/* D. DAFTAR UNIT KOMPETENSI */}
        <div style={{  padding: '8px 12px', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>DAFTAR UNIT KOMPETENSI</span>
        </div>

        <table style={{ width: '100%', maxWidth: '100%', background: '#fff', border: '1px solid #000', borderCollapse: 'collapse', fontSize: '13px', color: '#000', marginBottom: '20px' }}>
          <thead>
            <tr style={{ background: '#c40000', color: '#fff' }}>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '50px', textTransform: 'uppercase' }}>No</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '150px', textTransform: 'uppercase' }}>Kode Unit</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', textTransform: 'uppercase' }}>Judul Unit</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '180px', textTransform: 'uppercase' }}>Jenis Standar (SKKNI / Standar Internasional / Standar Khusus)</th>
            </tr>
          </thead>
          <tbody>
            {dataUnitKompetensi.length > 0 ? (
              dataUnitKompetensi.map((unit, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{index + 1}</td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{unit.kode}</td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{unit.nama}</td>
                  {index === 0 && (
                    <td rowSpan={dataUnitKompetensi.length} style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                      {skkni || '-'}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ border: '1px solid #000', padding: '12px', textAlign: 'center', color: '#999' }}>Belum ada data unit kompetensi</td>
              </tr>
            )}
          </tbody>
        </table>
        <div style={{  padding: '4px ', marginBottom: '5px' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>Bagian  3  :  Bukti Kelengkapan  Pemohon </span>
            </div>
        {/* E. BUKTI PERSYARATAN */}
        <div style={{  padding: '8px 12px', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>A. BUKTI PERSYARATAN</span>
        </div>

        <table style={{ width: '100%', maxWidth: '100%', background: '#fff', border: '1px solid #000', borderCollapse: 'collapse', fontSize: '13px', color: '#000', marginBottom: '20px' }}>
          <thead>
            <tr style={{ background: '#c40000', color: '#fff' }}>
              <th rowSpan={2} style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '50px', verticalAlign: 'middle', textTransform: 'uppercase' }}>No</th>
              <th rowSpan={2} style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', verticalAlign: 'middle', textTransform: 'uppercase' }}>Bukti Persyaratan Dasar</th>
              <th colSpan={2} style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', textTransform: 'uppercase' }}>Ada</th>
              <th rowSpan={2} style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '100px', verticalAlign: 'middle', textTransform: 'uppercase' }}>Tidak Ada</th>
            </tr>
            <tr style={{ background: '#c40000', color: '#fff' }}>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '100px', textTransform: 'uppercase' }}>Memenuhi Syarat</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '100px', textTransform: 'uppercase' }}>Tidak Memenuhi</th>
            </tr>
          </thead>
          <tbody>
            {buktiPersyaratan.length > 0 ? (
              buktiPersyaratan.map((bukti, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{bukti.no}</td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px' }}>
                    {(() => {
                      const url = bukti.checked ? getDokumenUrl(bukti.bukti) : null
                      if (url) {
                        return <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', fontWeight: 'bold', textDecoration: 'underline' }}>{bukti.bukti}</a>
                      }
                      return <span>{bukti.bukti}</span>
                    })()}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <CustomCheckbox checked={bukti.checked} onChange={() => {}} disabled />
                    </div>
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <CustomCheckbox checked={false} onChange={() => {}} disabled />
                    </div>
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <CustomCheckbox checked={false} onChange={() => {}} disabled />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ border: '1px solid #000', padding: '12px', textAlign: 'center', color: '#999' }}>Belum ada data bukti persyaratan</td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* F. BUKTI ADMINISTRATIF */}
        <div style={{ padding: '8px 12px', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>B. BUKTI ADMINISTRATIF</span>
        </div>

        <table style={{ width: '100%', maxWidth: '100%', background: '#fff', border: '1px solid #000', borderCollapse: 'collapse', fontSize: '13px', color: '#000', marginBottom: '20px' }}>
          <thead>
            <tr style={{ background: '#c40000', color: '#fff' }}>
              <th rowSpan={2} style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '50px', verticalAlign: 'middle', textTransform: 'uppercase' }}>No</th>
              <th rowSpan={2} style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', verticalAlign: 'middle', textTransform: 'uppercase' }}>Bukti Administratif</th>
              <th colSpan={2} style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', textTransform: 'uppercase' }}>Ada</th>
              <th rowSpan={2} style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '100px', verticalAlign: 'middle', textTransform: 'uppercase' }}>Tidak Ada</th>
            </tr>
            <tr style={{ background: '#c40000', color: '#fff' }}>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '100px', textTransform: 'uppercase' }}>Memenuhi Syarat</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '100px', textTransform: 'uppercase' }}>Tidak Memenuhi</th>
            </tr>
          </thead>
          <tbody>
            {buktiAdministratif.length > 0 ? (
              buktiAdministratif.map((bukti, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{bukti.no}</td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px' }}>
                    {(() => {
                      const url = bukti.checked ? getDokumenUrl(bukti.bukti) : null
                      if (url) {
                        return <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', fontWeight: 'bold', textDecoration: 'underline' }}>{bukti.bukti}</a>
                      }
                      return <span>{bukti.bukti}</span>
                    })()}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <CustomCheckbox checked={bukti.checked || false} onChange={() => {}} disabled />
                    </div>
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <CustomCheckbox checked={false} onChange={() => {}} disabled />
                    </div>
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <CustomCheckbox checked={false} onChange={() => {}} disabled />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ border: '1px solid #000', padding: '12px', textAlign: 'center', color: '#999' }}>Belum ada data bukti administratif</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* G. CATATAN / REKOMENDASI */}
        <div style={{ padding: '8px 12px', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>G. CATATAN / REKOMENDASI</span>
        </div>

        <table style={{ width: '100%', maxWidth: '100%', background: '#fff', border: '1px solid #000', borderCollapse: 'collapse', fontSize: '13px', color: '#000', marginBottom: '20px' }}>
          <tbody>
            {/* Rekomendasi & Pemohon Row 1 */}
            <tr>
              <td rowSpan={3} style={{ width: '60%', border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>
                <span style={{ fontWeight: 'bold' }}>Rekomendasi (diisi oleh LSP):</span><br /><br />
                Berdasarkan ketentuan persyaratan dasar,<br />
                maka pemohon:<br /><br />
                <span style={{ fontWeight: 'bold', textDecoration: isDiterima === true ? 'none' : isDiterima === false ? 'line-through' : 'none' }}>
                  Diterima
                </span> /{' '}
                <span style={{ fontWeight: 'bold', textDecoration: isDiterima === false ? 'none' : isDiterima === true ? 'line-through' : 'none' }}>
                  Tidak diterima
                </span> *) sebagai peserta
                sertifikasi<br /><br />
                * coret yang tidak sesuai
              </td>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Pemohon :</td>
            </tr>
            {/* Pemohon Row 2 */}
            <tr>
              <td style={{ width: '20%', border: '1px solid #000', padding: '8px' }}>Nama</td>
              <td style={{ width: '20%', border: '1px solid #000', padding: '8px' }}>{formDataPribadi.nama?.toUpperCase() || ''}</td>
            </tr>
            {/* Pemohon Row 3 - Signature */}
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>Tanda tangan /<br />Tanggal</td>
              <td style={{ height: '140px', border: '1px solid #000', padding: '8px', verticalAlign: 'middle', textAlign: 'center' }}>
                {barcodes?.asesi?.url ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <img
                      src={barcodes.asesi.url}
                      alt="Tanda Tangan Asesi"
                      style={{ height: '80px', width: '80px', objectFit: 'contain' }}
                    />
                    {barcodes.asesi.tanggal && (
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                        {new Date(barcodes.asesi.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                ) : null}
              </td>
            </tr>

            {/* Catatan & Admin */}
            <tr>
              <td rowSpan={3} style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>
                <span style={{ fontWeight: 'bold' }}>Catatan :</span>
                {catatan && (
                  <>
                    <br /><br />
                    <span style={{ whiteSpace: 'pre-wrap' }}>{catatan}</span>
                  </>
                )}
              </td>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Admin:</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px' }}>Nama</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>{barcodes?.admin?.nama?.toUpperCase() || ''}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>Tanda tangan / tanggal</td>
              <td style={{ height: '90px', border: '1px solid #000', padding: '8px', verticalAlign: 'middle', textAlign: 'center' }}>
                {barcodes?.admin?.url ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <img
                      src={barcodes.admin.url}
                      alt="Tanda Tangan Admin"
                      style={{ height: '60px', width: '60px', objectFit: 'contain' }}
                    />
                    {barcodes.admin.tanggal && (
                      <div style={{ fontSize: '12px', color: '#333' }}>
                        {new Date(barcodes.admin.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                ) : null}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Pernyataan */}
        {!signing.allSigned && (
        <div style={{ background: '#fff', border: '1px solid #999', borderRadius: '4px', padding: '16px', marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
            <CustomCheckbox
              checked={signing.agreedChecklist}
              onChange={() => signing.setAgreedChecklist(!signing.agreedChecklist)}
              style={{ marginTop: '2px' }}
            />
            <span style={{ fontSize: '13px', color: '#333' }}>
              Saya menyatakan dengan sebenar-benarnya bahwa data yang saya isi dalam APL 01 ini adalah benar dan dapat dipertanggungjawabkan.
            </span>
          </label>
        </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          {isAsesor && (
            <ActionButton variant="secondary" onClick={() => navigate(-1)} disabled={isSaving}>
              Kembali
            </ActionButton>
          )}
          <ActionButton variant="primary" disabled={signing.buttonDisabled} onClick={handleSave}>
            {isSaving ? "Menyimpan..." : signing.buttonText}
          </ActionButton>
        </div>
      </Apl01Layout>

      {!isUuidFlow && (
        <WebcamModal
          isOpen={showAwalModal}
          onClose={handleAwalModalClose}
          onSubmit={submitAbsenAwal}
          title="Absen Masuk Pra-Asesmen"
          description="Silakan ambil foto wajah Anda untuk absen masuk"
          canClose={false}
        />
      )}
    </div>
  )
}
