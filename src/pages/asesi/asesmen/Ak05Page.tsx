import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import ModularAsesiLayout from "@/components/ModularAsesiLayout"
import { useAuth } from "@/contexts/auth-context"
import { RoleId } from "@/lib/rbac-config"
import { FullPageLoader } from "@/components/ui/loading-spinner"
import { useToast } from "@/contexts/ToastContext"
import { extractErrorMessage } from "@/lib/error-utils"
import { useAsesorRole } from "@/hooks/useAsesorRole"
import { useDataDokumenAsesmen } from "@/hooks/useDataDokumenAsesmen"
import { useDataDokumenPraAsesmen } from "@/hooks/useDataDokumenPraAsesmen"
import { useKegiatanByRole } from "@/hooks/useKegiatanByRole"
import { useAbsenCheck } from "@/hooks/useAbsenCheck"
import { useSigningState } from "@/hooks/useSigningState"
import { getAsesmenSteps } from "@/lib/asesmen-steps"
import { CustomCheckbox } from "@/components/ui/Checkbox"
import { ActionButton } from "@/components/ui/ActionButton"
import { WebcamModal } from "@/components/ui/WebcamModal"
import { API_BASE_URL } from "@/config/api"

type BarcodeData = {
  url: string
  tanggal: string
  nama: string
}

interface Ak05Data {
  kompeten: boolean
  keterangan: string
  aspek_positif_negatif: string
  pencatatan_penolakan: string
  saran: string
  catatan: string
}

interface Ak05PerAsesi {
  kompeten: boolean
  keterangan: string
}

interface AsesiItem {
  id_izin: string
  nama: string
}

export default function Ak05Page() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { id } = useParams<{ id?: string }>()
  const { role } = useAsesorRole(id)
  const { jenjang, metode, jabatanKerja, nomorSkema, tuk, asesorList, namaAsesor, jadwalId } = useDataDokumenAsesmen(id)
  const { tahap } = useDataDokumenPraAsesmen(id)
  const { showSuccess, showError, showWarning } = useToast()
  const { kegiatan: _kegiatan } = useKegiatanByRole()

  // Get dynamic steps - AK.05 is only for asesor
  const isAsesor = user?.role?.id === RoleId.ASESOR

  // Asesi dapat lihat AK05 (K/BK disabled, dari AK02)

  // All asesor can edit (removed restriction to asesor_1 only)
  // K/BK selalu disabled — nilainya dari AK02
  const canEdit = isAsesor

  const resolvedAsesorRole = role || 'none'
  const asesmenSteps = useMemo(() => getAsesmenSteps(jenjang, isAsesor, resolvedAsesorRole, asesorList.length, metode, tahap), [jenjang, isAsesor, resolvedAsesorRole, asesorList.length, metode, tahap])
  const currentStep = asesmenSteps.find(s => s.href.includes('ak05'))?.number

  // Absen check
  const {
    showAwalModal,
    showAkhirModal,
    submitAbsenAwal,
    submitAbsenAkhir,
    handleAwalModalClose,
    handleAkhirModalClose,
  } = useAbsenCheck({
    phase: 'asesmen',
    role: 'auto',
    checkOnMount: true,
    idIzin: id,
    asesorList
  })

  // Form state - from GET API
  const [ak05Data, setAk05Data] = useState<Ak05Data>({
    kompeten: false,
    keterangan: '',
    aspek_positif_negatif: '',
    pencatatan_penolakan: '',
    saran: '',
    catatan: '',
  })
  const [barcodes, setBarcodes] = useState<{
    asesi?: BarcodeData | null
    asesor1?: BarcodeData | null
    asesor2?: BarcodeData | null
  }>({ asesi: null, asesor1: null, asesor2: null })
  const [isSaving, setIsSaving] = useState(false)

  // Multi-asesi state
  const [asesiList, setAsesiList] = useState<AsesiItem[]>([])
  const [ak05DataMap, setAk05DataMap] = useState<Record<string, Ak05PerAsesi>>({})

  // Fetch AK05 data - GET only
  const fetchAk05Data = useCallback(async () => {
    if (authLoading || !id) return

    try {
      const token = localStorage.getItem("access_token")

      // Fetch AK05 for current id first (for barcodes + report-level fields)
      const currentResponse = await fetch(`${API_BASE_URL}/asesmen/${id}/ak05`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (currentResponse.ok) {
        const result = await currentResponse.json()
        if (result.message === "Success" && result.data) {
          // kompeten: true = K, false = BK
          setAk05Data({
            kompeten: result.data.kompeten || false,
            keterangan: result.data.answers?.keterangan || '',
            aspek_positif_negatif: result.data.answers?.aspek || '',
            pencatatan_penolakan: result.data.answers?.pencatatan_penolakan || '',
            saran: result.data.answers?.saran || '',
            catatan: result.data.answers?.catatan || '',
          })
          // Handle barcodes
          if (result.data.barcodes) {
            setBarcodes({
              asesi: result.data.barcodes.asesi || null,
              asesor1: result.data.barcodes.asesor1 || null,
              asesor2: result.data.barcodes.asesor2 || null,
            })
          }
        }
      }

      // Fetch all asesi from kegiatan
      if (jadwalId) {
        const listRes = await fetch(`${API_BASE_URL}/kegiatan/${jadwalId}/list-asesi`, {
          headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
        })

        if (listRes.ok) {
          const listData = await listRes.json()
          const rawItems: AsesiItem[] = (listData?.list_asesi || [])
            .map((a: any) => ({ id_izin: a.id_izin, nama: a.nama }))
            .filter((a: AsesiItem) => a.id_izin)

          // Filter asesi by jabatan_kerja match against current jadwal's jabatan_kerja
          const targetJabatan = (jabatanKerja || '').trim().toLowerCase()
          let filteredItems: AsesiItem[] = rawItems

          if (targetJabatan) {
            const matched = await Promise.all(
              rawItems.map(async (a) => {
                try {
                  const r = await fetch(`${API_BASE_URL}/praasesmen/${a.id_izin}/data-dokumen`, {
                    headers: {
                      "Accept": "application/json",
                      "Authorization": `Bearer ${token}`,
                    },
                  })
                  if (!r.ok) return null
                  const j = await r.json()
                  const jk = (j?.data?.jabatan_kerja || '').toString().trim().toLowerCase()
                  return jk && jk === targetJabatan ? a : null
                } catch {
                  return null
                }
              })
            )
            filteredItems = matched.filter((a): a is AsesiItem => a !== null)
          } else {
            showWarning('Jabatan kerja jadwal belum terisi, menampilkan semua asesi.')
          }

          setAsesiList(filteredItems)

          // Fetch AK05 data per asesi
          const dataMap: Record<string, Ak05PerAsesi> = {}
          const fetches = filteredItems.map(async (asesi) => {
            try {
              // Ambil is_kompeten dari AK02
              const ak02Res = await fetch(`${API_BASE_URL}/asesmen/${asesi.id_izin}/ak02`, {
                headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
              })
              let kompeten = false
              if (ak02Res.ok) {
                const ak02Json = await ak02Res.json()
                if (ak02Json.message === "Success" && ak02Json.data) {
                  kompeten = ak02Json.data.is_kompeten === true
                }
              }
              dataMap[asesi.id_izin] = { kompeten, keterangan: '' }

              // AK05 data untuk keterangan
              const res = await fetch(`${API_BASE_URL}/asesmen/${asesi.id_izin}/ak05`, {
                headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
              })
              if (res.ok) {
                const json = await res.json()
                if (json.message === "Success" && json.data) {
                  dataMap[asesi.id_izin] = {
                    kompeten, // tetap pakai dari AK02
                    keterangan: json.data.answers?.keterangan || '',
                  }
                  return
                }
              }
            } catch (err) {
              console.error(`Error fetching AK05 for ${asesi.id_izin}:`, err)
            }
            if (!dataMap[asesi.id_izin]) {
              dataMap[asesi.id_izin] = { kompeten: false, keterangan: '' }
            }
          })

          await Promise.all(fetches)
          setAk05DataMap(dataMap)
        }
      }
    } catch (err) {
      console.error("Error fetching AK05:", err)
    }
  }, [id, authLoading, jadwalId])

  useEffect(() => { fetchAk05Data() }, [fetchAk05Data])

  const nextStepLabel = asesmenSteps[asesmenSteps.findIndex(s => s.href.includes('ak05')) + 1]?.label

  // Signing state hook — used for signing checks, button state, and realtime sync
  const signing = useSigningState({
    pageKey: 'ak05',
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
    onRefresh: fetchAk05Data,
    nextPageName: nextStepLabel,
  })

  // Keep derived values for display & multi-asesi logic
  const hasSigned = isAsesor ? signing.asesorHasSigned : signing.asesiHasSigned

  const handleSave = async () => {
    // Tahap 0: skip save/TTD, langsung navigasi next
    if (tahap === 0) {
      const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ak05'))
      const nextStep = asesmenSteps[currentStepIndex + 1]
      navigate(nextStep ? nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`) : `/asesi/asesmen/${id}/selesai`)
      return
    }
    // If user already signed → navigate to next page
    if (hasSigned) {
      const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ak05'))
      const nextStep = asesmenSteps[currentStepIndex + 1]
      if (nextStep) {
        const nextPath = nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`)
        navigate(nextPath)
      } else {
        navigate(`/asesi/asesmen/${id}/selesai`)
      }
      return
    }

    if (!id) {
      showWarning('ID tidak ditemukan')
      return
    }

    setIsSaving(true)
    try {
      const token = localStorage.getItem("access_token")
      let allSuccess = true

      // POST AK05 data for each asesi
      for (const asesi of asesiList) {
        const perAsesi = ak05DataMap[asesi.id_izin] || { kompeten: false, keterangan: '' }

        const response = await fetch(`${API_BASE_URL}/asesmen/${asesi.id_izin}/ak05`, {
          method: 'POST',
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kompeten: perAsesi.kompeten,
            keterangan: perAsesi.keterangan,
            aspek: ak05Data.aspek_positif_negatif,
            pencatatan_penolakan: ak05Data.pencatatan_penolakan,
            saran: ak05Data.saran,
            catatan: ak05Data.catatan,
          }),
        })

        if (!response.ok) {
          allSuccess = false
          console.error(`Failed to save AK05 for ${asesi.id_izin}`)
        }
      }

      if (allSuccess) {
        showSuccess('AK 05 berhasil disimpan!')

        // POST QR for each asesi (if not already signed)
        if (jadwalId) {
          for (const asesi of asesiList) {
            // Check existing barcode for this asesi's current role
            // Use the barcodes from the current fetch — for other asesi we don't have their barcodes,
            // so just try to generate QR unconditionally (API will handle duplicates)
            try {
              const qrResponse = await fetch(`${API_BASE_URL}/qr/${asesi.id_izin}/ak05`, {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ id_jadwal: jadwalId })
              })

              if (qrResponse.ok) {
                const qrResult = await qrResponse.json()
                // Only update local barcodes for the current id
                if (asesi.id_izin === id && qrResult.data?.url_image) {
                  if (role === 'asesor_1') {
                    setBarcodes(prev => ({ ...prev, asesor1: { url: qrResult.data.url_image, tanggal: new Date().toISOString(), nama: user?.name || '' } }))
                  } else {
                    setBarcodes(prev => ({ ...prev, asesor2: { url: qrResult.data.url_image, tanggal: new Date().toISOString(), nama: user?.name || '' } }))
                  }
                }
              }
            } catch (qrError) {
              console.error(`Error generating QR for ${asesi.id_izin}:`, qrError)
            }
          }
          signing.publishUpdate()
        }
      } else {
        showError('Gagal menyimpan data beberapa asesi. Silakan coba lagi.')
        return
      }
    } catch (err) {
      console.error('Error saving AK05:', err)
      showError(extractErrorMessage(err, 'Terjadi kesalahan. Silakan coba lagi.'))
      return
    } finally {
      setIsSaving(false)
    }
  }

  // Handle absen akhir submit
  const handleAbsenAkhirSubmit = async (imageBlob: Blob) => {
    await submitAbsenAkhir(imageBlob)
  }

  const formDisabled = !canEdit || signing.allSigned

  if (!asesiList.length) return <FullPageLoader text="Memuat data..." />

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      
      {/* Breadcrumb */}
      <AsesmenBreadcrumb currentPage="AK.05" isAsesorOverride={true} />

      <ModularAsesiLayout currentStep={currentStep || 7} steps={asesmenSteps} id={id} metode={metode}>
        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>
            FR.AK.05 &nbsp;&nbsp; LAPORAN ASESMEN
          </h1>
        </div>

        {/* HEADER Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '13px', background: '#fff', border: '1px solid #000' }}>
          <tbody>
            <tr>
              <td rowSpan={2} style={{ width: '25%', border: '1px solid #000', padding: '6px' }}>Skema Sertifikasi<br />(KKNI/Okupasi/Klaster)</td>
              <td style={{ width: '10%', border: '1px solid #000', padding: '6px' }}>Judul</td>
              <td style={{ width: '5%', border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{jabatanKerja || '-'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Nomor</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>{nomorSkema || '-'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>TUK</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
              <td colSpan={4} style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{tuk || '-'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Nama Asesor</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
              <td colSpan={4} style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{namaAsesor?.toUpperCase() || user?.name?.toUpperCase() || '-'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Tanggal</td>
              <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
              <td colSpan={4} style={{ border: '1px solid #000', padding: '6px' }}>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
            </tr>
          </tbody>
        </table>

        {/* TABEL ASESI - Multiple rows from kegiatan */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '13px', background: '#fff', border: '1px solid #000' }}>
          <tbody>
            <tr style={{ background: '#cc0000', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
              <th style={{ width: '5%', border: '1px solid #000', padding: '6px' }} rowSpan={2}>No.</th>
              <th style={{ width: '35%', border: '1px solid #000', padding: '6px' }} rowSpan={2}>Nama Asesi</th>
              <th colSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>Rekomendasi</th>
              <th style={{ width: '30%', border: '1px solid #000', padding: '6px' }} rowSpan={2}>Keterangan**</th>
            </tr>
            <tr style={{ background: '#cc0000', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
              <th style={{ width: '10%', border: '1px solid #000', padding: '6px' }}>K</th>
              <th style={{ width: '10%', border: '1px solid #000', padding: '6px' }}>BK</th>
            </tr>

            {asesiList.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', border: '1px solid #000', padding: '12px', color: '#999' }}>
                  Tidak ada data asesi
                </td>
              </tr>
            ) : (
              asesiList.map((asesi, idx) => {
                const perAsesi = ak05DataMap[asesi.id_izin] || { kompeten: false, keterangan: '' }
                const isCurrentAsesi = asesi.id_izin === id
                const rowDisabled = formDisabled || !isCurrentAsesi
                return (
                  <tr key={asesi.id_izin}>
                    <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px' }}>{idx + 1}.</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{asesi.nama || '-'}</td>
                    <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px', fontSize: '18px' }}>
                      <CustomCheckbox
                        checked={perAsesi.kompeten}
                        onChange={() => {}}
                        style={{ cursor: 'not-allowed', opacity: 0.6 }}
                      />
                    </td>
                    <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px', fontSize: '18px' }}>
                      <CustomCheckbox
                        checked={!perAsesi.kompeten}
                        onChange={() => {}}
                        style={{ cursor: 'not-allowed', opacity: 0.6 }}
                      />
                    </td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>
                      <textarea
                        value={perAsesi.keterangan}
                        onChange={(e) => canEdit && !signing.allSigned && isCurrentAsesi && setAk05DataMap(prev => ({
                          ...prev,
                          [asesi.id_izin]: { ...perAsesi, keterangan: e.target.value }
                        }))}
                        disabled={rowDisabled}
                        style={{ width: '100%', height: 'auto', minHeight: '40px', border: '1px solid #ccc', padding: '4px', fontSize: '13px', resize: 'vertical', cursor: rowDisabled ? 'not-allowed' : 'text' }}
                        placeholder="Keterangan..."
                      />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        <p style={{ fontSize: '11px', color: '#666', marginBottom: '15px' }}>
          ** tuliskan Kode dan Judul Unit Kompetensi yang dinyatakan BK bila mengases satu skema
        </p>

        {/* CATATAN Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '13px', background: '#fff', border: '1px solid #000' }}>
          <tbody>
            <tr>
              <td style={{ width: '30%', border: '1px solid #000', padding: '6px' }}>Aspek Negatif dan Positif dalam Asesmen</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>
                <textarea
                  value={ak05Data.aspek_positif_negatif}
                  onChange={(e) => canEdit && !signing.allSigned && setAk05Data(prev => ({ ...prev, aspek_positif_negatif: e.target.value }))}
                  disabled={formDisabled}
                  style={{ width: '100%', height: 'auto', minHeight: '80px', border: '1px solid #ccc', padding: '6px', fontSize: '13px', resize: 'vertical', cursor: formDisabled ? 'not-allowed' : 'text' }}
                  placeholder="Tuliskan aspek positif dan negatif..."
                />
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Pencatatan Penolakan Hasil Asesmen</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>
                <textarea
                  value={ak05Data.pencatatan_penolakan}
                  onChange={(e) => canEdit && !signing.allSigned && setAk05Data(prev => ({ ...prev, pencatatan_penolakan: e.target.value }))}
                  disabled={formDisabled}
                  style={{ width: '100%', height: 'auto', minHeight: '60px', border: '1px solid #ccc', padding: '6px', fontSize: '13px', resize: 'vertical', cursor: formDisabled ? 'not-allowed' : 'text' }}
                  placeholder="Tuliskan pencatatan penolakan..."
                />
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px' }}>Saran Perbaikan :<br />(Asesor/Personil Terkait)</td>
              <td style={{ border: '1px solid #000', padding: '6px' }}>
                <textarea
                  value={ak05Data.saran}
                  onChange={(e) => canEdit && !signing.allSigned && setAk05Data(prev => ({ ...prev, saran: e.target.value }))}
                  disabled={formDisabled}
                  style={{ width: '100%', height: 'auto', minHeight: '60px', border: '1px solid #ccc', padding: '6px', fontSize: '13px', resize: 'vertical', cursor: formDisabled ? 'not-allowed' : 'text' }}
                  placeholder="Tuliskan saran perbaikan..."
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* FOOTER Table - Both Asesor Signatures, Catatan only for Asesor 1 */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '13px', background: '#fff', border: '1px solid #000' }}>
          <tbody>
            {asesorList.map((asesor, index) => {
              const asesorBarcode = index === 0 ? barcodes.asesor1 : barcodes.asesor2
              const label = `Asesor ${index + 1}`
              return (
                <React.Fragment key={asesor.id}>
                  {/* Row 1: Catatan (only for Asesor 1) OR Label (for Asesor 2) */}
                  <tr>
                    {index === 0 ? (
                      <td style={{ width: '27%', border: '1px solid #000', padding: '6px', verticalAlign: 'top' }} rowSpan={asesorList.length * 4}>
                        <b>Catatan Asesor 1 :</b>
                        <div style={{ marginTop: '8px' }}>
                          <textarea
                            value={ak05Data.catatan}
                            onChange={(e) => canEdit && !signing.allSigned && setAk05Data(prev => ({ ...prev, catatan: e.target.value }))}
                            disabled={formDisabled}
                            style={{ width: '100%', height: 'auto', minHeight: '80px', border: '1px solid #ccc', padding: '4px', fontSize: '12px', resize: 'vertical', cursor: formDisabled ? 'not-allowed' : 'text' }}
                            placeholder="Tuliskan catatan..."
                          />
                        </div>
                      </td>
                    ) : (
                      ""
                    )}
                    <td colSpan={3} style={{ width: '15%', border: '1px solid #000', padding: '6px' }}>{label}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>Nama</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{asesor.nama?.toUpperCase() || ''}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>No. Reg</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>{asesor.noreg || ''}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>Tanda tangan / Tanggal</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>:</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', verticalAlign: 'middle' }}>
                      {asesorBarcode ? (
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
                      ) : (
                        <div style={{ minHeight: '50px' }}></div>
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              )
            })}
          </tbody>
        </table>

        {!canEdit && (
          <p style={{ fontSize: '12px', color: '#d10000', fontStyle: 'italic', marginBottom: '15px' }}>
            * Hanya Asesor 1 yang dapat mengisi form ini
          </p>
        )}

        {/* Actions */}
        <div style={{ marginTop: '20px' }}>
          {/* Pernyataan Checkbox */}
          {!signing.allSigned && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #999",
              borderRadius: "4px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
              <CustomCheckbox
                checked={signing.agreedChecklist}
                onChange={() => signing.setAgreedChecklist(!signing.agreedChecklist)}
                disabled={!isAsesor || signing.allSigned}
                style={{ marginTop: "2px" }}
              />
              <span style={{ fontSize: "13px", color: "#333" }}>
                Saya menyatakan data ini telah diisi dengan benar.
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
                  const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ak05'))
                  const prevStep = asesmenSteps[currentStepIndex - 1]
                  if (prevStep) {
                    const prevPath = prevStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`)
                    navigate(prevPath)
                  }
                }}
              >
                Kembali
              </ActionButton>
            )}
            <ActionButton variant="primary" disabled={signing.buttonDisabled} onClick={handleSave}>
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

      {/* Absen Akhir Modal */}
      <WebcamModal
        isOpen={showAkhirModal}
        onClose={handleAkhirModalClose}
        onSubmit={handleAbsenAkhirSubmit}
        title="Absen Keluar Asesmen"
        description="Silakan ambil foto wajah Anda untuk absen keluar"
        canClose={true}
      />
    </div>
  )
}
