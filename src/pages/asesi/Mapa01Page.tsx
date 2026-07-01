import { useState, useEffect, useCallback, useRef } from "react"
import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
import { useNavigate, useParams } from "react-router-dom"
import MukLayout from "@/components/MukLayout"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/ToastContext"
import { extractErrorMessage } from "@/lib/error-utils"
import { useKegiatanByRole } from "@/hooks/useKegiatanByRole"
import { useDataDokumenPraAsesmen } from "@/hooks/useDataDokumenPraAsesmen"
import { CustomCheckbox } from "@/components/ui/Checkbox"
import { ActionButton } from "@/components/ui/ActionButton"
import {
  Mapa01Header,
  Mapa01Section1,
  Mapa01Section2,
  Mapa01Section3,
  Mapa01TandaTangan
} from "@/components/mapa01"
// import { uploadMapa01PdfToBackend } from "@/utils/mapa01PdfGenerator" // Commented: not currently used
import "@/components/mapa01/Mapa01.css"
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
  value: boolean
}

interface Subkategori {
  id: number | null
  nama: string
  urut: number | null
  referensis: Referensi[]
}

interface Kategori {
  id: number | null
  kategori: string | null
  nama: string
  urut: number | null
  id_kelompok: number | null
  subkategoris: Subkategori[]
}

interface KelompokForm {
  id: number
  nama: string | null
  urut: number
  kategoris: Kategori[]
}

interface ReferensiFormItem {
  kelompok: KelompokForm
}

interface Mapa01Data {
  kelompok_kerja: {
    id: number
    kode: string
    nama_dokumen: string
    kelompok_kerja: KelompokKerja[]
  }
  referensi_form: ReferensiFormItem[]
  skkni?: string
}

interface ApiResponse {
  message: string
  data: Mapa01Data
}

export default function Mapa01Page() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { idIzin: idIzinFromUrl } = useParams<{ idIzin: string }>()
  const { kegiatan, isAsesor } = useKegiatanByRole()

  // Use idIzin from URL when accessed by asesor, otherwise use from user context
  const idIzin = isAsesor ? idIzinFromUrl : user?.id_izin
  const { jabatanKerja, nomorSkema, jenjang, metode, tuk: _tuk, namaPenyusun, namaValidator, tanggalPenyusun, tanggalValidator, barcodePenyusun, barcodeValidator, noregPenyusun, noregValidator, namaManajer, tanggalManajer, barcodeManajer, asesorList, tahap, jadwalId } = useDataDokumenPraAsesmen(idIzin || "")
  const { showSuccess, showWarning, showError } = useToast()
  const [mapaData, setMapaData] = useState<Mapa01Data | null>(null)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [actualIdIzin, setActualIdIzin] = useState<string | undefined>(idIzin)
  const [isSaving, setIsSaving] = useState(false)
  const [barcodes, setBarcodes] = useState<{
    asesi?: { url: string; tanggal: string; nama: string }
    asesor1?: { url: string; tanggal: string; nama: string } | null
    asesor2?: { url: string; tanggal: string; nama: string } | null
  } | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Absen check - auto-detect role (asesi/asesor1/asesor2)
  const { showAwalModal, submitAbsenAwal, handleAwalModalClose } = useAbsenCheck({
    phase: 'praasesmen',
    role: 'auto',
    checkOnMount: true, // Enable for both asesi and asesor
    idIzin: idIzin,
    asesorList: asesorList,
    tahap: tahap
  })

  const fetchMapa01Data = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token")
      let fetchedIdIzin = idIzin

      if (!fetchedIdIzin && !isAsesor && jadwalId) {
        const listAsesiResponse = await fetch(`${API_BASE_URL}/kegiatan/${jadwalId}/list-asesi`, {
          headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
        })
        if (listAsesiResponse.ok) {
          const listResult = await listAsesiResponse.json()
          if (listResult.message === "Success" && listResult.list_asesi?.[0]?.id_izin) {
            fetchedIdIzin = listResult.list_asesi[0].id_izin
          }
        }
      }

      if (!fetchedIdIzin) { return }

      setActualIdIzin(fetchedIdIzin)

      const mapa01Response = await fetch(`${API_BASE_URL}/praasesmen/${fetchedIdIzin}/mapa01`, {
        headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
      })

      if (mapa01Response.ok) {
        const result: ApiResponse = await mapa01Response.json()
        if (result.message === "Success") {
          setMapaData(result.data)
          if ((result.data as any).barcodes) {
            setBarcodes((result.data as any).barcodes)
          }
          setIsDataLoading(false)
        }
      }
    } catch (error) {
      console.error("Error fetching MAPA 01:", error)
      setIsDataLoading(false)
    }
  }, [idIzin, isAsesor, kegiatan, jadwalId])

  useEffect(() => {
    window.scrollTo(0, 0)
    if (isAsesor && idIzin) fetchMapa01Data()
    else if (kegiatan || jadwalId) fetchMapa01Data()
  }, [kegiatan, idIzin, isAsesor, jadwalId, fetchMapa01Data])

  const signing = useSigningState({
    pageKey: 'mapa01',
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
    onRefresh: fetchMapa01Data,
  })


  const handleBack = () => {
    navigate(-1)
  }

  // NOTE: handleUploadPdf is commented out because it's not currently used
  // but kept for future reference when PDF upload functionality is needed
  /*
  const handleUploadPdf = async () => {
    if (!actualIdIzin) {
      showWarning("ID Izin tidak ditemukan")
      return
    }

    setIsSaving(true)
    try {
      const token = localStorage.getItem("access_token")
      const result = await uploadMapa01PdfToBackend(
        jabatanKerja?.toUpperCase() || mapaData?.kelompok_kerja?.nama_dokumen || '',
        nomorSkema?.toUpperCase() || mapaData?.kelompok_kerja?.kode || '',
        mapaData,
        `${API_BASE_URL}/praasesmen/${actualIdIzin}/mapa01/upload`,
        token || '',
        {
          idIzin: actualIdIzin,
          fileName: `mapa01_${actualIdIzin}.pdf`
        }
      )

      if (result.success) {
        showSuccess(result.message)
      } else {
        showWarning(result.message)
      }
    } catch (error) {
      console.error('Error uploading PDF:', error)
      showWarning('Gagal upload PDF')
    } finally {
      setIsSaving(false)
    }
  }
  */

  const handleSubmit = async () => {
    const finalIdIzin = actualIdIzin || idIzin
    if (!finalIdIzin) {
      showWarning("ID Izin tidak ditemukan")
      return
    }

    // Tahap 0: langsung navigasi tanpa save/ttd
    if (tahap === 0) {
      navigate(`/asesi/praasesmen/${finalIdIzin}/mapa02`)
      return
    }

    // Jika semua sudah ttd → redirect ke halaman berikutnya (skip untuk tahap 0)
    if (tahap !== 0 && !isAsesor && signing.asesiHasSigned && signing.allAsesorSigned) {
      navigate(`/asesi/praasesmen/${finalIdIzin}/mapa02`)
      return
    }

    // Jika asesor sudah ttd → redirect (skip untuk tahap 0)
    if (tahap !== 0 && isAsesor && signing.asesorHasSigned) {
      navigate(`/asesi/praasesmen/${finalIdIzin}/mapa02`)
      return
    }

    setIsSaving(true)
    try {
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

      showSuccess('MAPA 01 berhasil disimpan!')
      signing.publishUpdate()
      // Navigasi jika asesi sudah tanda tangan (redirect tetap jalan walau asesor belum ttd)
      if (tahap === 0 || (!isAsesor && signing.asesiHasSigned)) {
        setTimeout(() => navigate(`/asesi/praasesmen/${finalIdIzin}/mapa02`), 500)
      }
    } catch (error) {
      console.error('Error saving MAPA 01:', error)
      showError(extractErrorMessage(error, 'Terjadi kesalahan saat menyimpan'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isDataLoading) return <FullPageLoader text="Memuat data..." />

  return (
    <div style={{ minHeight: '100vh'}}>
      {/* Header */}
      
      <AsesmenBreadcrumb currentPage="MAPA 01" />

      <MukLayout currentStep={1} idIzin={actualIdIzin} metode={metode} tahap={tahap} jenjang={jenjang}>
        {/* A4 Size Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px'}}>
          <div className="mapa01-container">
            <div id="mapa01-content" ref={contentRef}>
          {/* STATIC: Header */}
          <Mapa01Header
            judul={jabatanKerja?.toUpperCase() || mapaData?.kelompok_kerja.nama_dokumen}
            nomor={nomorSkema?.toUpperCase() || mapaData?.kelompok_kerja.kode}
            skkni={mapaData?.skkni}
          />

          {/* STATIC: Section 1 - Pendekatan Asesmen */}
          <Mapa01Section1 referensiForm={mapaData?.referensi_form} isAsesor={isAsesor} disabled={tahap !== 0 && signing.allSigned} skkni={mapaData?.skkni} />

          {/* DYNAMIC/LOOPING: Section 2 - Kelompok Pekerjaan dari API */}
          {mapaData?.kelompok_kerja?.kelompok_kerja && (
            <Mapa01Section2
              kelompokKerja={mapaData.kelompok_kerja.kelompok_kerja}
              jenjang={jenjang}
              metode={metode}
            />
          )}

          {/* STATIC: Section 3 - Modifikasi */}
          <Mapa01Section3 referensiForm={mapaData?.referensi_form} kelompokKerja={mapaData?.kelompok_kerja?.kelompok_kerja} isAsesor={isAsesor} disabled={tahap !== 0 && signing.allSigned} />

          {/* STATIC: Tanda Tangan */}
          <Mapa01TandaTangan
            namaPenyusun={namaPenyusun}
            namaValidator={namaValidator}
            tanggalPenyusun={tanggalPenyusun}
            tanggalValidator={tanggalValidator}
            barcodePenyusun={barcodePenyusun}
            barcodeValidator={barcodeValidator}
            noregPenyusun={noregPenyusun}
            noregValidator={noregValidator}
            namaManajer={namaManajer}
            tanggalManajer={tanggalManajer}
            barcodeManajer={barcodeManajer}
            referensiForm={mapaData?.referensi_form}
            isAsesor={isAsesor}
          />
          </div>

          {/* Agreement Checklist */}
          {!signing.allSigned && (
          <div style={{ background: '#fff', border: '1px solid #000', marginBottom: '20px', padding: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: signing.allSigned ? 'not-allowed' : 'pointer' }}>
              <CustomCheckbox
                checked={signing.agreedChecklist}
                onChange={() => signing.setAgreedChecklist(!signing.agreedChecklist)}
                disabled={signing.allSigned}
                style={{ marginTop: '2px', cursor: signing.allSigned ? 'not-allowed' : 'pointer' }}
              />
              <span style={{ fontSize: '12px', color: '#000', lineHeight: '1.5' }}>
                <strong style={{ textTransform: 'uppercase' }}>Pernyataan:</strong> Saya menyatakan bahwa saya telah memahami dan memahami dokumen MAPA 01 (Matriks Pengembangan dan Penilaian Asesmen) ini dengan sebenar-benarnya.
              </span>
            </label>
          </div>
          )}

          {/* Actions */}
          <div className="mapa01-actions">

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
