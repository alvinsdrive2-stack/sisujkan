import { useState, useEffect, useCallback } from "react"
import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
import { useNavigate, useParams } from "react-router-dom"
import MukLayout from "@/components/MukLayout"
import { useAuth } from "@/contexts/auth-context"
import { RoleId } from "@/lib/rbac-config"
import { useToast } from "@/contexts/ToastContext"
import { extractErrorMessage, extractApiError } from "@/lib/error-utils"
import { useKegiatanAsesi } from "@/hooks/useKegiatan"
import { useDataDokumenPraAsesmen } from "@/hooks/useDataDokumenPraAsesmen"
import { CustomCheckbox } from "@/components/ui/Checkbox"
import { ActionButton } from "@/components/ui/ActionButton"
import { useAbsenCheck } from "@/hooks/useAbsenCheck"
import { WebcamModal } from "@/components/ui/WebcamModal"
import { API_BASE_URL } from "@/config/api"
import { useSigningState, BarcodeState } from "@/hooks/useSigningState"
import { FullPageLoader } from "@/components/ui/loading-spinner"

interface Referensi {
  id: number
  nama: string
  jawaban: boolean
}

interface Kelompok {
  id: number
  nama: string | null
  urut: number
  referensis: Referensi[]
}

interface Ak04Data {
  kelompoks: Kelompok[]
  alasan: string
  barcodes?: {
    asesi?: { url: string; tanggal: string; nama: string }
  }
}

interface ApiResponse {
  message: string
  data: Ak04Data | { data: Ak04Data }  // Supports both flat and nested structures
}

type AnswerType = boolean | null

export default function FrAk04Page() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { kegiatan } = useKegiatanAsesi()
  const { idIzin: idIzinFromUrl } = useParams<{ idIzin: string }>()
  const isAsesor = user?.role?.id === RoleId.ASESOR

  const idIzin = isAsesor ? idIzinFromUrl : user?.id_izin
  const { jabatanKerja, nomorSkema, namaAsesor: _namaAsesor, asesorList, namaAsesi, tahap, jadwalId, metode, jenjang } = useDataDokumenPraAsesmen(idIzin)
  const { showSuccess, showError, showWarning } = useToast()
  const [ak04Data, setAk04Data] = useState<Ak04Data | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [answers, setAnswers] = useState<Record<number, AnswerType>>({})
  const [alasanBanding, setAlasanBanding] = useState('')
  const [barcodes, setBarcodes] = useState<{ asesi?: { url: string; tanggal: string; nama: string } } | null>(null)
  const [actualIdIzin, setActualIdIzin] = useState<string | undefined>(idIzin)
  const [isDataLoading, setIsDataLoading] = useState(true)

  const hasTrueAnswer = Object.values(answers).some(a => a === true)

  // Absen check - auto-detect role (asesi/asesor1/asesor2)
  const { showAwalModal, submitAbsenAwal, handleAwalModalClose } = useAbsenCheck({
    phase: 'praasesmen',
    role: 'auto',
    checkOnMount: true, // Enable for both asesi and asesor
    idIzin: idIzin,
    asesorList: asesorList,
    tahap: tahap
  })

  const fetchAk04Data = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token")
      let resolvedIdIzin = idIzin

      if (!resolvedIdIzin && !isAsesor && jadwalId) {
        const listAsesiResponse = await fetch(`${API_BASE_URL}/kegiatan/${jadwalId}/list-asesi`, {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        })

        if (listAsesiResponse.ok) {
          const listResult = await listAsesiResponse.json()
          if (listResult.message === "Success" && listResult.list_asesi && listResult.list_asesi.length > 0) {
            resolvedIdIzin = listResult.list_asesi[0].id_izin
          }
        }
      }

      if (!resolvedIdIzin) {
        setIsDataLoading(false)
        return
      }

      setActualIdIzin(resolvedIdIzin)

      const ak04Response = await fetch(`${API_BASE_URL}/praasesmen/${resolvedIdIzin}/ak04`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (ak04Response.ok) {
        const result: ApiResponse = await ak04Response.json()

        if (result.message === "Success") {
          const apiData = ('data' in result.data && 'kelompoks' in (result.data as { data: Ak04Data }).data)
            ? (result.data as { data: Ak04Data }).data
            : result.data as Ak04Data

          setAk04Data(apiData)

          const initialAnswers: Record<number, AnswerType> = {}
          apiData.kelompoks.forEach(kelompok => {
            kelompok.referensis.forEach(ref => {
              initialAnswers[ref.id] = ref.jawaban
            })
          })
          setAnswers(initialAnswers)

          if (apiData.alasan) setAlasanBanding(apiData.alasan)
          if (apiData.barcodes) {
            const bc = apiData.barcodes as any
            setBarcodes({
              asesi: bc.asesi?.url_image
                ? { url: bc.asesi.url_image, tanggal: bc.asesi.tanggal, nama: bc.asesi.nama }
                : bc.asesi,
            })
          }
        }
      } else {
        console.warn(`AK04 API returned ${ak04Response.status}`)
      }
    } catch (error) {
    } finally {
      setIsDataLoading(false)
    }
  }, [idIzin, isAsesor, kegiatan, jadwalId])

  useEffect(() => {
    window.scrollTo(0, 0)
    if (isAsesor && idIzin) {
      fetchAk04Data()
    } else if (kegiatan || jadwalId) {
      fetchAk04Data()
    }
  }, [idIzin, kegiatan, isAsesor, jadwalId, fetchAk04Data])

  const signing = useSigningState({
    pageKey: 'ak04',
    isAsesor,
    tahap,
    barcodes: barcodes as unknown as BarcodeState | null,
    setBarcodes: setBarcodes as unknown as React.Dispatch<React.SetStateAction<BarcodeState | null>>,
    asesorList,
    userId: user?.id,
    userName: user?.name,
    isSaving,
    idIzin: actualIdIzin || idIzin,
    jadwalId,
    onRefresh: fetchAk04Data,
  })

  // Only asesi can edit this form
  const isFormDisabled = isAsesor || signing.allSigned

  const handleBack = () => {
    navigate(-1)
  }

  const handleAnswerChange = (refId: number, value: boolean) => {
    if (isFormDisabled) return
    setAnswers(prev => {
      const current = prev[refId]
      if (current === value) {
        // Uncheck if clicking the same value
        const { [refId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [refId]: value }
    })
  }

  const handleCellClick = (refId: number) => {
    if (isFormDisabled) return
    setAnswers(prev => {
      const current = prev[refId]
      // Toggle: null -> true -> false -> null
      if (current === undefined || current === null) {
        return { ...prev, [refId]: true }
      } else if (current === true) {
        return { ...prev, [refId]: false }
      } else {
        const { [refId]: _, ...rest } = prev
        return rest
      }
    })
  }

  const handleSave = async () => {
    const finalIdIzin = actualIdIzin || idIzin
    if (!finalIdIzin) {
      showWarning("ID Izin tidak ditemukan")
      return
    }

    // Tahap 0: langsung navigasi tanpa save/ttd
    if (tahap === 0) {
      navigate(`/asesi/praasesmen/${finalIdIzin}/ak01`)
      return
    }

    // Asesi already signed & all asesor signed → navigate to K3
    if (tahap !== 0 && !isAsesor && signing.asesiHasSigned && signing.allAsesorSigned) {
      navigate(`/asesi/praasesmen/${finalIdIzin}/k3-asesmen`)
      return
    }

    // Asesor already signed → navigate to K3
    if (tahap !== 0 && isAsesor && signing.asesorHasSigned) {
      navigate(`/asesi/praasesmen/${finalIdIzin}/k3-asesmen`)
      return
    }

    // Asesi - validate and save
    if (!signing.agreedChecklist) {
      showWarning("Silakan centang pernyataan bahwa Anda telah memahami dokumen ini.")
      return
    }

    const hasAnswers = Object.values(answers).some(a => a !== undefined && a !== null)
    const hasAlasan = alasanBanding.trim().length > 0

    setIsSaving(true)
    try {
      const token = localStorage.getItem("access_token")

      // POST answers hanya jika ada jawaban
      if (hasAnswers || hasAlasan) {
        const kelompokId = ak04Data?.kelompoks?.[0]?.id || 1
        const answersArray = Object.entries(answers).map(([referensiId, jawaban]) => ({
          referensi_id: Number(referensiId),
          kelompok_id: kelompokId,
          jawaban: jawaban === true ? true : null
        }))

        const payload = {
          answers: answersArray,
          alasan: alasanBanding
        }

        const response = await fetch(`${API_BASE_URL}/praasesmen/${finalIdIzin}/ak04`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          const errMsg = await extractApiError(response, "Gagal menyimpan data")
          showError(errMsg)
          return
        }
        const result = await response.json()
        if (result.message !== "AK04 successfully submitted") {
          showError("Gagal menyimpan data: " + (result.message || "Unknown error"))
          return
        }
      }

      // QR tetap digenerate meski jawaban kosong
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
          showError('Gagal membuat tanda tangan, coba lagi')
          return
        }
      }

      showSuccess('FR AK 04 berhasil disimpan!')
      signing.publishUpdate()
      if (tahap === 0) {
        setTimeout(() => navigate(`/asesi/praasesmen/${finalIdIzin}/ak01`), 500)
      }
    } catch (error) {
      console.error("Error saving AK04:", error)
      showError(extractErrorMessage(error, "Terjadi kesalahan saat menyimpan data"))
    } finally {
      setIsSaving(false)
    }
  }

  if (isDataLoading) return <FullPageLoader text="Memuat data..." />

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Header */}
      
      <AsesmenBreadcrumb currentPage="FR.AK.04" />

      <MukLayout currentStep={4} idIzin={idIzin} metode={metode} tahap={tahap} jenjang={jenjang}>
        <div style={{ padding: '20px' }}>
          {/* Title */}
          <div style={{ marginBottom: '16px' }}>
            <h1 style={{ fontSize: '14px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>
              FR.AK.04 BANDING ASESMEN
            </h1>
          </div>

          {/* Main Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '13px', background: '#fff' }}>
            <tbody>
              {/* Nama Asesi */}
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px 8px', width: '25%' }}>Nama Asesi</td>
                <td colSpan={3} style={{ border: '1px solid #000', padding: '6px 8px' }}>: {namaAsesi?.toUpperCase() || user?.name.toUpperCase() || ''}</td>
              </tr>

              {/* Nama Asesor */}
              {asesorList.length > 1 ? (
                asesorList.map((asesor, idx) => (
                  <tr key={asesor.id}>
                    <td style={{ border: '1px solid #000', padding: '6px 8px' }}>Nama Asesor {idx + 1}</td>
                    <td colSpan={3} style={{ border: '1px solid #000', padding: '6px 8px' }}>: {asesor.nama?.toUpperCase() || ''}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={{ border: '1px solid #000', padding: '6px 8px' }}>Nama Asesor</td>
                  <td colSpan={3} style={{ border: '1px solid #000', padding: '6px 8px' }}>: {asesorList[0]?.nama?.toUpperCase() || ''}</td>
                </tr>
              )}

              {/* Tanggal Asesmen */}
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px 8px' }}>Tanggal Asesmen</td>
                <td colSpan={3} style={{ border: '1px solid #000', padding: '6px 8px' }}>: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
              </tr>

              {/* Header Row */}
              <tr>
                <td colSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>
                  Jawablah dengan Ya atau Tidak pertanyaan-pertanyaan berikut ini :
                </td>
                <td style={{ border: '1px solid #000', padding: '6px 8px', width: '10%', fontWeight: 'bold', textAlign: 'center' }}>YA</td>
                <td style={{ border: '1px solid #000', padding: '6px 8px', width: '10%', fontWeight: 'bold', textAlign: 'center' }}>TIDAK</td>
              </tr>

              {/* Questions */}
              {ak04Data?.kelompoks?.[0]?.referensis.map((ref) => {
                const answer = answers[ref.id]

                return (
                  <tr key={ref.id}>
                    <td
                      colSpan={2}
                      style={{ width: '95%', border: '1px solid #000', padding: '6px 8px', cursor: isFormDisabled ? 'default' : 'pointer' }}
                      onClick={() => handleCellClick(ref.id)}
                    >
                      {ref.nama}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '6px 30px', textAlign: 'center' }}>
                      <CustomCheckbox
                        checked={answer === true}
                        onChange={() => handleAnswerChange(ref.id, true)}
                        disabled={isFormDisabled}
                        style={{ width: '5%', height: '18px', cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}
                      />
                    </td>
                    <td style={{ border: '1px solid #000', padding: '6px 30px', textAlign: 'center' }}>
                      <CustomCheckbox
                        checked={answer === false}
                        onChange={() => handleAnswerChange(ref.id, false)}
                        disabled={isFormDisabled}
                        style={{ width: '5%', height: '18px', cursor: isFormDisabled ? 'not-allowed' : 'pointer' }}
                      />
                    </td>
                  </tr>
                )
              })}

              {/* Skema Sertifikasi Info */}
              <tr>
                <td colSpan={4} style={{ border: '1px solid #000', padding: '8px' }}>
                  Banding ini diajukan atas Keputusan Asesmen yang dibuat terhadap Skema Sertifikasi (̶𝙺̶𝙺̶𝙽̶𝙸̶/Okupasi/̶𝙺̶𝚕̶𝚊̶𝚜̶𝚝̶𝚎̶𝚛̶)̶ berikut :
                  <br /><br />
                  Skema Sertifikasi : {jabatanKerja?.toUpperCase() || ''}<br />
                  No. Skema Sertifikasi : {nomorSkema?.toUpperCase() || ''}
                </td>
              </tr>

              {/* Alasan Banding */}
              <tr>
                <td colSpan={4} style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>
                  <div style={{ marginBottom: '8px' }}>Banding ini diajukan atas alasan sebagai berikut :</div>
                  <textarea
                    value={alasanBanding}
                    onChange={(e) => setAlasanBanding(e.target.value)}
                    disabled={isFormDisabled}
                    placeholder="Tuliskan alasan banding..."
                    style={{
                      width: '100%',
                      minHeight: '70px',
                      border: '1px solid #ccc',
                      padding: '8px',
                      fontSize: '13px',
                      fontFamily: 'Arial, Helvetica, sans-serif',
                      resize: 'vertical',
                      cursor: isFormDisabled ? 'not-allowed' : 'text',
                      background: isFormDisabled ? '#f5f5f5' : '#fff'
                    }}
                  />
                </td>
              </tr>

              {/* Info */}
              <tr>
                <td colSpan={4} style={{ border: '1px solid #000', padding: '8px' }}>
                  Anda mempunyai hak mengajukan banding jika Anda menilai proses asesmen tidak sesuai SOP dan tidak memenuhi Prinsip Asesmen.
                </td>
              </tr>

              {/* Tanda Tangan */}
              <tr>
                <td colSpan={4} style={{ border: '1px solid #000', padding: '8px', minHeight: '80px' }}>
                  <div>Tanda tangan Asesi : {namaAsesi?.toUpperCase() || user?.name?.toUpperCase() || ''}</div>
                  {barcodes?.asesi?.url && hasTrueAnswer ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', marginTop: '8px' }}>
                      <img
                        src={barcodes.asesi.url}
                        alt="Tanda Tangan Asesi"
                        style={{ height: '50px', width: '50px', objectFit: 'contain' }}
                      />
                      <div style={{ fontSize: '11px', color: '#333' }}>
                        Tanggal : {new Date(barcodes.asesi.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: '8px' }}>
                      <br />
                      Tanggal : {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Agreement Checklist */}
          {!signing.allSigned && (
          <div style={{ background: '#fff', border: '1px solid #000', borderRadius: '4px', marginBottom: '20px', padding: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: signing.allSigned ? 'not-allowed' : 'pointer' }}>
              <input
                type="checkbox"
                checked={signing.agreedChecklist}
                onChange={(e) => signing.setAgreedChecklist(e.target.checked)}
                disabled={signing.allSigned}
                style={{ marginTop: '2px', width: '16px', height: '16px', cursor: signing.allSigned ? 'not-allowed' : 'pointer' }}
              />
              <span style={{ fontSize: '12px', color: '#000', lineHeight: '1.5' }}>
                <strong style={{ textTransform: 'uppercase' }}>Pernyataan:</strong> Saya menyatakan bahwa saya telah memahami dan memahami dokumen AK 04 (Banding Asesmen) ini dengan sebenar-benarnya.
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
            <ActionButton
              variant="primary"
              disabled={signing.buttonDisabled}
              onClick={handleSave}
            >
              {isSaving ? "Menyimpan..." : signing.buttonText}
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
