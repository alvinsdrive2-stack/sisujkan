import { useState, useEffect, useCallback, useMemo } from "react"
import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
import { useNavigate, useParams } from "react-router-dom"
import ModularAsesiLayout from "@/components/ModularAsesiLayout"
import { useAuth } from "@/contexts/auth-context"
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

interface Pertanyaan {
  id: number
  no: string
  pertanyaan: string
  kesimpulan: string
  k: boolean
  bk: boolean
}

interface Ia09File {
  id: number
  original_name: string
  path: string
  filetype: string | null
}

interface Ia09Response {
  message: string
  data?: {
    soal?: {
      "1"?: Array<{ id: number; soal: string; no: string; id_kelompok: string }>
      "2"?: Array<{ id: number; soal: string; no: string; id_kelompok: string }>
    }
    files?: Array<{ id: number; original_name: string; path: string; filetype: string | null }>
    answers?: Record<string, { kesimpulan?: string; is_kompeten?: boolean }>
    dokumen?: { id: number; nama_dokumen: string }
    barcodes?: {
      asesi?: BarcodeData | null
      asesor1?: BarcodeData | null
      asesor2?: BarcodeData | null
    }
  }
}

export default function Ia09Page() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { id } = useParams<{ id?: string }>()
  const {
    jabatanKerja,
    nomorSkema,
    tuk,
    jenjang,
    metode,
    asesorList,
    namaAsesi,
    namaAsesor: _namaAsesor,
    tanggalUji,
    jadwalId,
  } = useDataDokumenAsesmen(id)
  const { kegiatan: _kegiatan, isAsesor } = useKegiatanByRole()
  const { tahap } = useDataDokumenPraAsesmen(id)

  const asesmenSteps = useMemo(() => getAsesmenSteps(jenjang, isAsesor, undefined, asesorList.length, metode, tahap), [jenjang, isAsesor, asesorList.length, metode, tahap])

  const {
    showAwalModal,
    submitAbsenAwal,
    handleAwalModalClose,
  } = useAbsenCheck({
    phase: "asesmen",
    role: "auto",
    checkOnMount: true,
    idIzin: id,
    asesorList,
  })

  const [dokumenId, setDokumenId] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [pertanyaanList, setPertanyaanList] = useState<Pertanyaan[]>([])
  const [ia09Files, setIa09Files] = useState<Ia09File[]>([])
  const [barcodes, setBarcodes] = useState<{
    asesi?: BarcodeData | null
    asesor1?: BarcodeData | null
    asesor2?: BarcodeData | null
  } | null>(null)

  const fetchIa09Data = useCallback(async () => {
    if (!id || authLoading) return
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/asesmen/${id}/ia09`, {
        headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
      })
      if (response.ok) {
        const result: Ia09Response = await response.json()
        if (result.message === "Success" && result.data) {
          if (result.data.files) {
            setIa09Files(result.data.files)
          }
          if (result.data.soal?.["2"]) {
            const savedAnswers = result.data.answers || {}
            const pertanyaanData = result.data.soal["2"].map((item: any) => {
              const saved = savedAnswers[String(item.id)] || {}
              return {
                id: item.id, no: item.no || "1", pertanyaan: item.soal || "-",
                kesimpulan: saved.kesimpulan || "",
                k: saved.is_kompeten === true,
                bk: saved.is_kompeten === false,
              }
            })
            setPertanyaanList(pertanyaanData)
          }
          if (result.data.barcodes) {
            setBarcodes({ asesi: result.data.barcodes.asesi, asesor1: result.data.barcodes.asesor1, asesor2: result.data.barcodes.asesor2 })
          }
          if (result.data.dokumen?.id) {
            setDokumenId(result.data.dokumen.id)
          }
        }
      }
    } catch (err) {
      console.error("Error fetching IA09:", err)
    }

  }, [id, authLoading])

  useEffect(() => { fetchIa09Data() }, [fetchIa09Data])

  const nextStepLabel = asesmenSteps[asesmenSteps.findIndex(s => s.href.includes('ia09')) + 1]?.label

  const signing = useSigningState({
    pageKey: 'ia09',
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
    onRefresh: fetchIa09Data,
  })


  const hasSigned = isAsesor ? signing.asesorHasSigned : signing.asesiHasSigned

  const handleKChange = (id: number, value: boolean) => {
    setPertanyaanList(prev => prev.map(p => p.id === id ? { ...p, k: value, bk: value ? false : p.bk } : p))
  }

  const handleBKChange = (id: number, value: boolean) => {
    setPertanyaanList(prev => prev.map(p => p.id === id ? { ...p, bk: value, k: value ? false : p.k } : p))
  }

  const handleSave = async () => {
    // Tahap 0: skip save/TTD, langsung navigasi next
    if (tahap === 0) {
      const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ia09'))
      const nextStep = asesmenSteps[currentStepIndex + 1]
      navigate(nextStep ? nextStep.href.replace('/asesi/asesmen/', `/asesi/asesmen/${id}/`) : `/asesi/asesmen/${id}/selesai`)
      return
    }
    if (hasSigned) {
      const currentStepIndex = asesmenSteps.findIndex(s => s.href.includes('ia09'))
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
      return
    }

    setIsSaving(true)
    try {
      const token = localStorage.getItem("access_token")

      // POST answers
      const payload = {
        dokumen_id: dokumenId,
        answers: pertanyaanList.map(p => ({
          soal_id: p.id,
          kesimpulan: p.kesimpulan,
          is_kompeten: p.k,
        })),
      }

      const response = await fetch(`${API_BASE_URL}/asesmen/${id}/ia09`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        await signing.generateQR()
        signing.publishUpdate()
      }
    } catch (err) {
      console.error("Error saving IA09:", err)
    } finally {
      setIsSaving(false)
    }
  }

  if (!pertanyaanList.length) return <FullPageLoader text="Memuat data..." />

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >

      <AsesmenBreadcrumb currentPage="IA.09" />

      <ModularAsesiLayout
        currentStep={asesmenSteps.find((s) => s.href.includes("ia09"))?.number || 1}
        steps={asesmenSteps}
        id={id}
        metode={metode}
      >
        {/* Title */}
        <div style={{ marginBottom: "20px" }}>
          <h1
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: "#000",
              marginBottom: "4px",
              letterSpacing: "1px",
            }}
          >
            FR.IA.09. &nbsp; PERTANYAAN WAWANCARA
          </h1>
        </div>

        {/* Header Info Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "10px",
            fontSize: "13px",
            background: "#fff",
            border: "2px solid #000",
          }}
        >
          <tbody>
            <tr>
              <td rowSpan={2} style={{ width: "30%", border: "1px solid #000", padding: "6px" }}>
                Skema Sertifikasi
                <br />
                <span style={{ fontSize: "11px" }}>(KKNI/Okupasi/Klaster)</span>
              </td>
              <td style={{ width: "12%", border: "1px solid #000", padding: "6px" }}>Judul</td>
              <td style={{ width: "3%", border: "1px solid #000", padding: "6px", textAlign: "end" }}>:</td>
              <td style={{ border: "1px solid #000", padding: "6px", textTransform: "uppercase" }}>
                {jabatanKerja || "-"}
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "6px" }}>Nomor</td>
              <td style={{ border: "1px solid #000", padding: "6px", textAlign: "end" }}>:</td>
              <td style={{ border: "1px solid #000", padding: "6px", textTransform: "uppercase" }}>
                {nomorSkema || "-"}
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "6px" }}>TUK</td>
              <td style={{ border: "1px solid #000", padding: "6px", textAlign: "end" }}>:</td>
              <td colSpan={2} style={{ border: "1px solid #000", padding: "6px", textTransform: "uppercase" }}>
                {tuk || "-"}
              </td>
            </tr>
            {asesorList.map((asesor, idx) => (
              <tr key={asesor.id}>
                <td style={{ border: "1px solid #000", padding: "6px" }}>
                  Nama Asesor {asesorList.length > 1 ? idx + 1 : ""}
                </td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "end" }}>:</td>
                <td colSpan={2} style={{ border: "1px solid #000", padding: "6px" }}>
                  {asesor.nama?.toUpperCase() || ""}
                  {asesor.noreg && ` (${asesor.noreg})`}
                </td>
              </tr>
            ))}
            <tr>
              <td style={{ border: "1px solid #000", padding: "6px" }}>Nama Asesi</td>
              <td style={{ border: "1px solid #000", padding: "6px", textAlign: "end" }}>:</td>
              <td colSpan={2} style={{ border: "1px solid #000", padding: "6px", textTransform: "uppercase" }}>
                {namaAsesi?.toUpperCase() || user?.name?.toUpperCase() || "-"}
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "6px" }}>Tanggal</td>
              <td style={{ border: "1px solid #000", padding: "6px", textAlign: "end" }}>:</td>
              <td colSpan={2} style={{ border: "1px solid #000", padding: "6px" }}>
                {tanggalUji ? new Date(tanggalUji).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>*Coret yang tidak perlu</div>

        {/* Panduan */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "15px",
            fontSize: "13px",
            background: "#fff",
            border: "2px solid #000",
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  background: "#c40000",
                  color: "#fff",
                  padding: "6px",
                  fontWeight: "bold",
                  fontSize: "13px",
                  textAlign: "left",
                }}
              >
                PANDUAN BAGI ASESOR
              </td>
            </tr>
            <tr>
              <td style={{ padding: "10px", fontSize: "12px" }}>
                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                  <li>Pertanyaan wawancara dapat dilakukan untuk keseluruhan unit kompetensi atau kelompok pekerjaan.</li>
                  <li>Isilah bukti portofolio sesuai dengan bukti pada FR.IA.08.</li>
                  <li>Ajukan pertanyaan verifikasi portofolio untuk semua unit kompetensi.</li>
                  <li>Ajukan pertanyaan kepada asesi sebagai tindak lanjut verifikasi portofolio.</li>
                  <li>Jika hasil verifikasi belum memadai, ajukan pertanyaan tambahan.</li>
                  <li>Tuliskan pencapaian dengan mencentang (√) "Ya" atau "Tidak".</li>
                </ul>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Bukti */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "15px",
            fontSize: "13px",
            background: "#fff",
            border: "2px solid #000",
          }}
        >
          <thead>
            <tr style={{ background: "#c40000", color: "#fff", fontWeight: "bold", textAlign: "center" }}>
              <th style={{ width: "5%", border: "1px solid #000", padding: "6px" }}>No.</th>
              <th style={{ border: "1px solid #000", padding: "6px" }}>Bukti - Bukti Kompetensi</th>
            </tr>
          </thead>
          <tbody>
            {ia09Files.map((f, i) => (
              <tr key={f.id}>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{i + 1}</td>
                <td style={{ border: "1px solid #000", padding: "6px" }}>
                  <a href={f.path} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', fontWeight: 'bold', textDecoration: 'underline' }}>{f.original_name}</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pertanyaan */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "15px",
            fontSize: "13px",
            background: "#fff",
            border: "2px solid #000",
          }}
        >
          <thead>
            <tr style={{ background: "#c40000", color: "#fff", fontWeight: "bold", textAlign: "center" }}>
              <th style={{ width: "5%", border: "1px solid #000", padding: "6px" }}>No.</th>
              <th style={{ width: "40%", border: "1px solid #000", padding: "6px" }}>Daftar Pertanyaan Wawancara</th>
              <th style={{ width: "35%", border: "1px solid #000", padding: "6px" }}>Kesimpulan Jawaban Asesi</th>
              <th style={{ width: "10%", border: "1px solid #000", padding: "6px" }}>K</th>
              <th style={{ width: "10%", border: "1px solid #000", padding: "6px" }}>BK</th>
            </tr>
          </thead>
          <tbody>
            {pertanyaanList.map((p) => (
              <tr key={p.id}>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{p.no}</td>
                <td style={{ border: "1px solid #000", padding: "6px", whiteSpace: "pre-line" }}>{p.pertanyaan}</td>
                <td style={{ border: "1px solid #000", padding: "6px" }}>
                  <textarea
                    value={p.kesimpulan}
                    onChange={(e) => {
                      setPertanyaanList(prev => prev.map(item =>
                        item.id === p.id ? { ...item, kesimpulan: e.target.value } : item
                      ))
                    }}
                    disabled={!isAsesor || signing.allSigned}
                    style={{
                      width: "100%",
                      minHeight: "60px",
                      border: "1px solid #ccc",
                      padding: "4px",
                      fontSize: "12px",
                      resize: "vertical",
                    }}
                  />
                </td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>
                  <CustomCheckbox
                    checked={p.k}
                    onChange={() => isAsesor && handleKChange(p.id, !p.k)}
                    disabled={!isAsesor || signing.allSigned}
                  />
                </td>
                <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>
                  <CustomCheckbox
                    checked={p.bk}
                    onChange={() => isAsesor && handleBKChange(p.id, !p.bk)}
                    disabled={!isAsesor || signing.allSigned}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Tanda Tangan */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "20px",
            fontSize: "13px",
            background: "#fff",
            border: "2px solid #000",
          }}
        >
          <tbody>
            {/* Asesi */}
            <tr>
              <td colSpan={3} style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold" }}>
                Asesi :
              </td>
            </tr>
            <tr>
              <td style={{ width: "20%", border: "1px solid #000", padding: "6px" }}>Nama</td>
              <td style={{ width: "5%", border: "1px solid #000", padding: "6px", textAlign: "center" }}>:</td>
              <td style={{ border: "1px solid #000", padding: "6px" }}>
                {namaAsesi?.toUpperCase() || user?.name?.toUpperCase() || ""}
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "6px" }}>Tanda tangan dan Tanggal</td>
              <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>:</td>
              <td style={{ border: "1px solid #000", padding: "6px", height: "60px", textAlign: "center" }}>
                {barcodes?.asesi?.url ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <img src={barcodes.asesi.url} alt="Tanda Tangan" style={{ height: "50px", width: "50px", objectFit: "contain" }} />
                    {barcodes.asesi.tanggal && (
                      <div style={{ fontSize: "11px" }}>
                        {new Date(barcodes.asesi.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                ) : null}
              </td>
            </tr>

            {/* Asesor 1 */}
            <tr>
              <td colSpan={3} style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold" }}>
                Asesor 1 :
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "6px" }}>Nama</td>
              <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>:</td>
              <td style={{ border: "1px solid #000", padding: "6px" }}>
                {asesorList[0]?.nama?.toUpperCase() || ""}
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "6px" }}>No. Reg</td>
              <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>:</td>
              <td style={{ border: "1px solid #000", padding: "6px" }}>
                {asesorList[0]?.noreg || ""}
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "6px" }}>Tanda tangan dan Tanggal</td>
              <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>:</td>
              <td style={{ border: "1px solid #000", padding: "6px", height: "60px", textAlign: "center" }}>
                {barcodes?.asesor1?.url ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <img src={barcodes.asesor1.url} alt="Tanda Tangan" style={{ height: "50px", width: "50px", objectFit: "contain" }} />
                    {barcodes.asesor1.tanggal && (
                      <div style={{ fontSize: "11px" }}>
                        {new Date(barcodes.asesor1.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                ) : null}
              </td>
            </tr>

            {/* Asesor 2 */}
            {asesorList.length > 1 && (
              <>
                <tr>
                  <td colSpan={3} style={{ border: "1px solid #000", padding: "6px", fontWeight: "bold" }}>
                    Asesor 2 :
                  </td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #000", padding: "6px" }}>Nama</td>
                  <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>:</td>
                  <td style={{ border: "1px solid #000", padding: "6px" }}>
                    {asesorList[1]?.nama?.toUpperCase() || ""}
                  </td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #000", padding: "6px" }}>No. Reg</td>
                  <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>:</td>
                  <td style={{ border: "1px solid #000", padding: "6px" }}>
                    {asesorList[1]?.noreg || ""}
                  </td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #000", padding: "6px" }}>Tanda tangan dan Tanggal</td>
                  <td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>:</td>
                  <td style={{ border: "1px solid #000", padding: "6px", height: "60px", textAlign: "center" }}>
                    {barcodes?.asesor2?.url ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                        <img src={barcodes.asesor2.url} alt="Tanda Tangan" style={{ height: "50px", width: "50px", objectFit: "contain" }} />
                        {barcodes.asesor2.tanggal && (
                          <div style={{ fontSize: "11px" }}>
                            {new Date(barcodes.asesor2.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        {/* Actions */}
        <div style={{ marginTop: "20px" }}>
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
                disabled={signing.allSigned}
                style={{ marginTop: "2px" }}
              />
              <span style={{ fontSize: "13px", color: "#333" }}>
                Saya menyatakan data ini telah diisi dengan benar.
              </span>
            </label>
          </div>
          )}

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <ActionButton variant="secondary" onClick={() => navigate(-1)}>
              Kembali
            </ActionButton>
            <ActionButton
              variant="primary"
              disabled={signing.buttonDisabled}
              onClick={handleSave}
            >
              {isSaving ? "Menyimpan..." : signing.buttonText}
            </ActionButton>
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
