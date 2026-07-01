import React, { useState, useEffect, useCallback, useMemo } from "react"
import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
import { useNavigate, useParams } from "react-router-dom"
import ModularAsesiLayout from "@/components/ModularAsesiLayout"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/ToastContext"
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

interface BarcodeData {
  url: string
  tanggal: string
  nama: string
}

interface Questions {
  id: number
  isi_nonsoal: string
}

interface Ia02Response {
  message: string
  data: {
    barcodes?: {
      asesi?: BarcodeData | null
      asesor1?: BarcodeData | null
      asesor2?: BarcodeData | null
    }
    questions: Questions
  }
}

// Decode HTML entities
const decodeHtmlEntities = (html: string) => {
  const textArea = document.createElement('textarea')
  textArea.innerHTML = html
  return textArea.value
}

// Parse and convert unit listings to table
const convertUnitListingsToTable = (html: string) => {
  let decoded = decodeHtmlEntities(html)

  // Pattern to match: Kelompok<br />Pekerjaan X<br /><br />No. Kode Unit Judul Unit<br />...
  const unitListPattern = /Kelompok\s*<br\s*\/?>\s*Pekerjaan\s*(\d+)\s*<br\s*\/?>\s*<br\s*\/?>\s*No\.\s*Kode\s*Unit\s*Judul\s*Unit<br\s*\/?>([\s\S]*?)(?=<strong>|<p>|$)/gi

  decoded = decoded.replace(unitListPattern, (match, kelompokNum, unitsContent) => {
    // Split by <br /> and process
    const lines = unitsContent.split(/<br\s*\/?>/i)
    const units: Array<{ no: string, kode: string, judul: string }> = []
    let currentUnit: { no: string, kode: string, judul: string } | null = null

    console.log('IA02 Table Parse - kelompokNum:', kelompokNum)
    console.log('IA02 Table Parse - lines:', lines)

    for (const line of lines) {
      const trimmedLine = line.trim()

      // Skip empty lines - they don't end the unit
      if (trimmedLine.length === 0) {
        continue
      }

      // Check if line starts the next unit: "1. F.410100.001.01 Title"
      const unitMatch = trimmedLine.match(/^(\d+)\.\s*([A-Z0-9\.]+)\s+(.+)$/)

      if (unitMatch) {
        // Save previous unit if exists
        if (currentUnit) {
          units.push(currentUnit)
        }
        // Start new unit
        currentUnit = {
          no: unitMatch[1],
          kode: unitMatch[2],
          judul: unitMatch[3].trim()
        }
      } else if (currentUnit) {
        // Append to current unit's title (continuation line like "Kerja dan Lingkungan (K3-L)")
        currentUnit.judul += ' ' + trimmedLine
      }
    }

    // Don't forget the last unit
    if (currentUnit) {
      units.push(currentUnit)
    }

    // Clean up judul (remove extra whitespace)
    units.forEach(unit => {
      unit.judul = unit.judul.replace(/\s+/g, ' ').trim()
    })

    console.log('IA02 Table Parse - units parsed:', units)
    console.log('IA02 Table Parse - units.length:', units.length, 'rowspan will be:', units.length)

    if (units.length === 0) {
      return match // Return original if no units found
    }

    // Build table
    let tableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; border: 1px solid #000;">`
    tableHtml += `<tbody>`

    // Header row with Kelompok Pekerjaan cell that spans down
    tableHtml += `<tr style="background: #fff; font-weight: bold;">`
    tableHtml += `<th rowspan="${units.length + 1}" style="border: 1px solid #000; padding: 8px; text-align: center;">Kelompok Pekerjaan ${kelompokNum}</th>`
    tableHtml += `<th style="border: 1px solid #000; padding: 8px; text-align: center;">No.</th>`
    tableHtml += `<th style="border: 1px solid #000; padding: 8px; text-align: center;">Kode Unit</th>`
    tableHtml += `<th style="border: 1px solid #000; padding: 8px; text-align: center;">Judul Unit</th>`
    tableHtml += `</tr>`

    units.forEach((unit) => {
      tableHtml += `<tr>`
      tableHtml += `<td style="border: 1px solid #000; padding: 8px; text-align: center;">${unit.no}</td>`
      tableHtml += `<td style="border: 1px solid #000; padding: 8px;">${unit.kode}</td>`
      tableHtml += `<td style="border: 1px solid #000; padding: 8px;">${unit.judul}</td>`
      tableHtml += `</tr>`
    })

    tableHtml += `</tbody></table>`
    console.log('IA02 Table Parse - generated table HTML:', tableHtml)
    return tableHtml
  })

  return decoded
}

export default function Ia02Page() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { id } = useParams<{ id?: string }>()
  const { role: asesorRole } = useAsesorRole(id)
  const { jenjang, jabatanKerja, nomorSkema, tuk, asesorList, namaAsesi, tanggalUji, jadwalId, metode } = useDataDokumenAsesmen(id)
  const { tahap } = useDataDokumenPraAsesmen(id)
  const { showSuccess, showWarning } = useToast()
  const { kegiatan: _kegiatan, isAsesor } = useKegiatanByRole()

  // Get dynamic steps
  const asesmenSteps = useMemo(() => getAsesmenSteps(jenjang, isAsesor, asesorRole, asesorList.length, metode, tahap), [jenjang, isAsesor, asesorRole, asesorList.length, metode, tahap])

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

  const [questions, setQuestions] = useState<Questions | null>(null)
  const [barcodes, setBarcodes] = useState<{
    asesi?: BarcodeData | null
    asesor1?: BarcodeData | null
    asesor2?: BarcodeData | null
  } | null>(null)

  // Fetch IA02 data
  const fetchIa02Data = useCallback(async () => {
    if (authLoading) return

    if (!id) {
      console.error("No id_izin found")
      return
    }

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/asesmen/${id}/ia02`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result: Ia02Response = await response.json()
        if (result.message === "Success" && result.data?.questions) {
          // Set barcodes
          if (result.data.barcodes) {
            setBarcodes({
              asesi: result.data.barcodes.asesi,
              asesor1: result.data.barcodes.asesor1,
              asesor2: result.data.barcodes.asesor2,
            })
          }

          // Set questions
          setQuestions(result.data.questions)
        }
      }
    } catch (err) {
      console.error("Error fetching IA02:", err)
    }
  }, [id, authLoading])

  useEffect(() => { fetchIa02Data() }, [fetchIa02Data])

  const [isSaving, setIsSaving] = useState(false)

  const nextStepLabel = asesmenSteps[asesmenSteps.findIndex(s => s.href.includes('ia02')) + 1]?.label

  const signing = useSigningState({
    pageKey: 'ia02',
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
    onRefresh: fetchIa02Data,
  })


  const handleNext = async () => {
    if (tahap === 0) {
      const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ia02'))
      const nextStep = asesmenSteps[currentStepIndex + 1]
      navigate(nextStep ? nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`) : `/asesi/asesmen/${id}/selesai`)
      return
    }
    if (signing.allSigned) {
      const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ia02'))
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

    setIsSaving(true)

    await signing.generateQR()

    showSuccess('IA.02 berhasil disimpan!')
    setIsSaving(false)
  }

  const handleBack = () => {
    navigate(`/asesi/asesmen/${id}/ia01`)
  }

  if (!questions) return <FullPageLoader text="Memuat data..." />

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Arial, sans-serif' }}>

      <AsesmenBreadcrumb currentPage="IA.02" />

      <ModularAsesiLayout currentStep={2} steps={asesmenSteps} id={id} metode={metode}>
        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', marginBottom: '4px', letterSpacing: '1px' }}>
            FR.IA.02. TPD - TUGAS PRAKTIK DEMONSTRASI
          </h1>
        </div>

        {/* IDENTITAS Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '13px', background: '#fff', border: '2px solid #000' }}>
          <tbody>
            <tr>
              <td style={{ width: '25%', border: '1px solid #000', padding: '8px' }}>Skema Sertifikasi</td>
              <td style={{ width: '5%', border: '1px solid #000', padding: '8px', textAlign: 'end' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '8px', textTransform: 'uppercase' }}>{jabatanKerja || '-'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px' }}>Nomor</td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'end' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '8px', textTransform: 'uppercase' }}>{nomorSkema || '-'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px' }}>TUK</td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'end' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '8px', textTransform: 'uppercase' }}>{tuk || '-'}</td>
            </tr>
            {asesorList.length > 1 ? (
              asesorList.map((asesor, idx) => (
                <tr key={asesor.id}>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Nama Asesor {idx + 1}</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'end' }}>:</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>
                    {asesor.nama?.toUpperCase() || ''}{asesor.noreg && ` (${asesor.noreg})`}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px' }}>Nama Asesor</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'end' }}>:</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>
                  {asesorList[0]?.nama?.toUpperCase() || ''}{asesorList[0]?.noreg && ` (${asesorList[0].noreg})`}
                </td>
              </tr>
            )}
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px' }}>Nama Asesi</td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'end' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '8px', textTransform: 'uppercase' }}>{namaAsesi?.toUpperCase() || user?.name?.toUpperCase() || '-'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px' }}>Tanggal</td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'end' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>{tanggalUji ? new Date(tanggalUji).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</td>
            </tr>
          </tbody>
        </table>

        <p style={{ fontSize: '12px', fontStyle: 'italic', marginBottom: '15px' }}>*Coret yang tidak perlu</p>

        {/* QUESTIONS CONTENT */}
        {questions && (
          <div
            style={{
              marginBottom: '20px',
              padding: '20px',
              background: '#fff',
              fontSize: '14px',
              lineHeight: '1.6'
            }}
            dangerouslySetInnerHTML={{ __html: convertUnitListingsToTable(questions.isi_nonsoal) }}
          />
        )}

        {/* TANDA TANGAN Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px', fontSize: '13px', background: '#fff', border: '2px solid #000' }}>
          <tbody>
            <tr>
              <td colSpan={3} style={{ background: '#fff', border: '1px solid #000', padding: '6px' }}><b>Asesi</b></td>
            </tr>
            <tr>
              <td style={{ width: '30%', border: '1px solid #000', padding: '6px' }}>Nama Asesi</td>
              <td style={{ width: '2%', border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{namaAsesi?.toUpperCase() || user?.name?.toUpperCase() || ''}</td>
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
              const label = asesorList.length > 1 ? `Nama Asesor ${idx + 1}` : 'Nama Asesor'
              return (
                <React.Fragment key={asesor.id}>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>{label}</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>{asesor.nama?.toUpperCase() || ''}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>No. Reg{asesorList.length > 1 ? ` ${idx + 1}` : ''}</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'end' }}>:</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>{asesor.noreg || ''}</td>
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
                Saya menyatakan dengan sebenar-benarnya bahwa saya telah memahami instruksi tugas terstruktur dan akan menyelesaikan tugas tersebut sesuai dengan ketentuan yang berlaku.
              </span>
            </label>
          </div>
          )}

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
