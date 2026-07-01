import { useState, useEffect, useCallback, useMemo } from "react"
import AsesmenBreadcrumb from "@/components/AsesmenBreadcrumb"
import { useNavigate, useParams } from "react-router-dom"
import ModularAsesiLayout from "@/components/ModularAsesiLayout"
import { useAuth } from "@/contexts/auth-context"
import { RoleId } from "@/lib/rbac-config"
import { useAsesorRole } from "@/hooks/useAsesorRole"
import { useDataDokumenAsesmen } from "@/hooks/useDataDokumenAsesmen"
import { useDataDokumenPraAsesmen } from "@/hooks/useDataDokumenPraAsesmen"
import { useAbsenCheck } from "@/hooks/useAbsenCheck"
import { getAsesmenSteps, getStepNumberFromHref } from "@/lib/asesmen-steps"
import { FullPageLoader } from "@/components/ui/loading-spinner"
import { ActionButton } from "@/components/ui/ActionButton"
import { WebcamModal } from "@/components/ui/WebcamModal"
import { CustomCheckbox } from "@/components/ui/Checkbox"
import { useToast } from "@/contexts/ToastContext"
import { extractErrorMessage, extractApiError } from "@/lib/error-utils"
import { API_BASE_URL } from "@/config/api"

interface SoalEsai {
  id: number; no: string; unit_kode: string; kuk_kode: string; soal: string
  jawaban?: string; skor?: number
}

const td = { border: '0.2px solid black', padding: '4px 6px' }
const hdDok = { backgroundColor: '#c40000', color: '#fff' }
const panduanTitle = { backgroundColor: '#c00000', color: '#fff', fontWeight: 'bold' as const, padding: '4px 8px', fontSize: '11pt' }
const fontS = { fontFamily: '"Arial Narrow", Calibri, Candara, Segoe, Segoe UI, Optima, Arial, sans-serif', fontSize: '12pt' }
const formatter = new Intl.DateTimeFormat('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })

function Td({ children, style, colSpan, rowSpan }: { children?: React.ReactNode; style?: React.CSSProperties; colSpan?: number; rowSpan?: number }) {
  return <td colSpan={colSpan} rowSpan={rowSpan} style={{ ...td, ...style }}>{children}</td>
}

function IdentitasTable({ jabatanKerja, nomorSkema, tuk, asesorList, namaAsesi }: {
  jabatanKerja?: string; nomorSkema?: string; tuk?: string; asesorList: any[]; namaAsesi: string
}) {
  return (
    <table style={{ border: '2px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
      <tbody>
        <tr>
          <Td rowSpan={2} style={{ width: '30%' }}>Skema Sertifikasi (KKNI/Okupasi/Klaster)</Td>
          <Td style={{ width: '12%' }}>Judul</Td>
          <Td style={{ width: '3%', textAlign: 'center' }}>:</Td>
          <Td style={{ textTransform: 'uppercase' }}>{jabatanKerja || '-'}</Td>
        </tr>
        <tr>
          <Td>Nomor</Td>
          <Td style={{ textAlign: 'center' }}>:</Td>
          <Td style={{ textTransform: 'uppercase' }}>{nomorSkema || '-'}</Td>
        </tr>
        <tr>
          <Td>TUK</Td>
          <Td style={{ textAlign: 'center' }}>:</Td>
          <Td colSpan={2} style={{ textTransform: 'uppercase' }}>{tuk || '-'}</Td>
        </tr>
        {asesorList.map((a: any, i: number) => (
          <tr key={i}>
            <Td>Nama Asesor {asesorList.length > 1 ? i + 1 : ''}</Td>
            <Td style={{ textAlign: 'center' }}>:</Td>
            <Td colSpan={2} style={{ textTransform: 'uppercase' }}>{a?.nama || '-'}</Td>
          </tr>
        ))}
        <tr>
          <Td>Nama Asesi</Td>
          <Td style={{ textAlign: 'center' }}>:</Td>
          <Td colSpan={2} style={{ textTransform: 'uppercase' }}>{namaAsesi || '-'}</Td>
        </tr>
        <tr>
          <Td>Tanggal</Td>
          <Td style={{ textAlign: 'center' }}>:</Td>
          <Td colSpan={2}>{formatter.format(new Date())}</Td>
        </tr>
      </tbody>
    </table>
  )
}

function Panduan({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <div style={panduanTitle}>{title}</div>
      <table style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
        <tbody>
          <tr>
            <td style={{ border: 'none', fontSize: '11pt' }}>{children}</td>
          </tr>
        </tbody>
      </table>
      <br />
    </>
  )
}

function PenyusunValidatorTable() {
  return (
    <table style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
      <tbody>
        <tr style={{ fontWeight: 'bold', textAlign: 'center' }}>
          <Td style={{ width: '15%' }}>Status</Td>
          <Td style={{ width: '8%' }}>No</Td>
          <Td>Nama</Td>
          <Td style={{ width: '20%' }}>Nomor MET</Td>
          <Td style={{ width: '25%' }}>Tanda Tangan Dan Tanggal</Td>
        </tr>
        <tr style={{ fontWeight: 'bold' }}>
          <Td rowSpan={2}>PENYUSUN</Td>
          <Td style={{ textAlign: 'center' }}>1</Td>
          <Td></Td>
          <Td></Td>
          <Td style={{ height: '50px' }}></Td>
        </tr>
        <tr>
          <Td style={{ textAlign: 'center' }}>2</Td>
          <Td></Td>
          <Td></Td>
          <Td style={{ height: '50px' }}></Td>
        </tr>
        <tr style={{ fontWeight: 'bold' }}>
          <Td rowSpan={2}>VALIDATOR</Td>
          <Td style={{ textAlign: 'center' }}>1</Td>
          <Td></Td>
          <Td></Td>
          <Td style={{ height: '50px' }}></Td>
        </tr>
        <tr>
          <Td style={{ textAlign: 'center' }}>2</Td>
          <Td></Td>
          <Td></Td>
          <Td style={{ height: '50px' }}></Td>
        </tr>
      </tbody>
    </table>
  )
}

function TTDTable({ title, nama, noReg, barcode }: {
  title: string; nama: string; noReg?: string; barcode?: any
}) {
  return (
    <table style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
      <tbody>
        <tr style={{ fontWeight: 'bold' }}>
          <Td colSpan={3}>{title}</Td>
        </tr>
        <tr>
          <Td style={{ width: '20%' }}>Nama</Td>
          <Td style={{ width: '5%' }}>:</Td>
          <Td>{nama}</Td>
        </tr>
        {noReg !== undefined && (
          <tr>
            <Td>No. Reg</Td>
            <Td style={{ textAlign: 'center' }}>:</Td>
            <Td>{noReg || ''}</Td>
          </tr>
        )}
        <tr>
          <Td>Tanda tangan/ Tanggal</Td>
          <Td style={{ textAlign: 'center' }}>:</Td>
          <Td style={{ height: '70px', verticalAlign: 'middle', textAlign: 'center' }}>
            {barcode?.url ? (
              <>
                <img src={barcode.url} style={{ height: '50px', width: '50px', objectFit: 'contain' }} alt="barcode" /><br />
                <span style={{ fontSize: '11px' }}>
                  {barcode?.tanggal ? new Date(barcode.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                </span>
              </>
            ) : (
              <span style={{ color: '#999' }}>Belum ditandatangani</span>
            )}
          </Td>
        </tr>
      </tbody>
    </table>
  )
}

export default function Ia06Page() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { id } = useParams<{ id?: string }>()
  const { role: asesorRole } = useAsesorRole(id)
  const { jenjang, metode, asesorList, jabatanKerja, nomorSkema, tuk, namaAsesi, jadwalId } = useDataDokumenAsesmen(id)
  const { tahap } = useDataDokumenPraAsesmen(id)
  const { showSuccess, showError } = useToast()

  const isAsesor = user?.role?.id === RoleId.ASESOR
  const isAsesi = user?.role?.id === RoleId.ASESI
  const asesmenSteps = useMemo(() => getAsesmenSteps(jenjang, isAsesor, asesorRole, asesorList.length, metode, tahap), [jenjang, isAsesor, asesorRole, asesorList.length, metode, tahap])
  const currentStep = getStepNumberFromHref(asesmenSteps, '/asesi/asesmen/ia06')

  const { showAwalModal, submitAbsenAwal, handleAwalModalClose } = useAbsenCheck({
    phase: 'asesmen', role: 'auto', checkOnMount: true, idIzin: id, asesorList
  })

  const [dokumen, setDokumen] = useState<{ id: number; nama_dokumen: string } | null>(null)
  const [soalList, setSoalList] = useState<SoalEsai[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [jawaban, setJawaban] = useState<Record<number, string>>({})
  const [skor, setSkor] = useState<Record<number, number>>({})
  const [umpanBalik, setUmpanBalik] = useState("")
  const [barcodes, setBarcodes] = useState<any>(null)

  const fetchIa06Data = useCallback(async () => {
    if (!id) return
    try {
      const token = localStorage.getItem("access_token")
      const res = await fetch(`${API_BASE_URL}/asesmen/${id}/ia06`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const body = await res.json()
        const d = body.data
        setDokumen(d.dokumen || null)
        setSoalList(d.soal_list || [])
        if (d.barcodes) setBarcodes(d.barcodes)
        const savedJawaban: Record<number, string> = {}
        const savedSkor: Record<number, number> = {}
        ;(d.soal_list || []).forEach((s: SoalEsai) => {
          if (s.jawaban) savedJawaban[s.id] = s.jawaban
          if (s.skor !== undefined && s.skor !== null) savedSkor[s.id] = s.skor
        })
        setJawaban(savedJawaban)
        setSkor(savedSkor)
        if (d.umpan_balik) setUmpanBalik(d.umpan_balik)
      }
    } catch (error) { console.error("Error fetching IA.06 data:", error)
    } finally { setIsLoading(false) }
  }, [id])

  useEffect(() => { fetchIa06Data() }, [fetchIa06Data])

  const totalSkor = useMemo(() => Object.values(skor).reduce((a, b) => a + b, 0), [skor])

  const handleSave = async () => {
    if (!id) return
    setIsSaving(true)
    try {
      const token = localStorage.getItem("access_token")
      const answers = soalList.map(s => ({
        soal_id: s.id,
        jawaban: jawaban[s.id] || '',
        skor: skor[s.id] ?? null,
      }))
      const payload: any = { answers, umpan_balik: umpanBalik, unit_elemen_kuk: null }
      if (dokumen) payload.dokumen_id = dokumen.id
      else if (soalList[0]) payload.dokumen_id = 0

      const res = await fetch(`${API_BASE_URL}/asesmen/${id}/ia06`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const msg = await extractApiError(res, 'Gagal menyimpan IA.06')
        showError(msg); setIsSaving(false); return
      }

      if (jadwalId) {
        await fetch(`${API_BASE_URL}/qr/${id}/ia06`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id_jadwal: jadwalId }),
        })
      }

      showSuccess('IA.06 berhasil disimpan!')
      const currentIdx = asesmenSteps.findIndex(s => s.href.includes("ia06"))
      const nextStep = asesmenSteps[currentIdx + 1]
      const nextPath = nextStep ? nextStep.href.replace("/asesi/asesmen/", `/asesi/asesmen/${id}/`) : `/asesi/asesmen/${id}/selesai`
      navigate(nextPath)
    } catch (e) {
      showError(extractErrorMessage(e, 'Gagal menyimpan data'))
    } finally { setIsSaving(false) }
  }

  if (isLoading) return <FullPageLoader text="Memuat IA.06..." />

  return (
    <ModularAsesiLayout currentStep={currentStep} steps={asesmenSteps} id={id} metode={metode}>
      <AsesmenBreadcrumb currentPage="IA.06" />

      <div style={{ ...fontS, maxWidth: '1000px', margin: '0 auto' }}>
        {/* TITLE */}
        <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '1px', color: '#4F81BD', marginBottom: '16px' }}>
          FR.IA.06C. LEMBAR JAWABAN PERTANYAAN TERTULIS ESAI
        </div>

        {/* IDENTITAS */}
        <IdentitasTable jabatanKerja={jabatanKerja} nomorSkema={nomorSkema} tuk={tuk} asesorList={asesorList} namaAsesi={namaAsesi || user?.name || '-'} />
        <p style={{ fontSize: '12px', margin: '4px 0' }}>*Coret yang tidak perlu</p>

        {/* PANDUAN ASESOR */}
        <Panduan title="PANDUAN BAGI ASESOR">
          <b>Instruksi:</b>
          <ul style={{ margin: '4px 0 4px 18px', paddingLeft: '18px', listStyleType: 'disc' }}>
            <li style={{ marginBottom: '4px' }}>Pertanyaan pilihan ganda merupakan jenis bukti tambahan untuk mendukung bukti-bukti yang sudah ada.</li>
            <li style={{ marginBottom: '4px' }}>Asesor menilai jawaban peserta uji berdasarkan jawaban yang diberikan. Penilaian dilakukan dengan memberikan tanda centang (✓) pada salah satu kolom skor penilaian 0, 1, 2, atau 3 sesuai dengan tingkat kesesuaian dan kelengkapan jawaban peserta, dengan ketentuan sebagai berikut:
              <br/>0 = Jawaban tidak sesuai, keliru atau tidak menjawab.
              <br/>1 = Jawaban sebagian benar, namun tidak lengkap/ kurang tepat.
              <br/>2 = Jawaban benar dan sesuai, namun belum sepenuhnya lengkap.
              <br/>3 = Jawaban lengkap, tepat, runtut dan sesuai konteks.
            </li>
            <li style={{ marginBottom: '4px' }}>Dibutuhkan jastifikasi profesional asesor untuk memutuskan hal ini.</li>
            <li style={{ marginBottom: '0' }}>Seluruh hasil penilaian di jumlahkan dan di catat pada kolom Rekapitulasi Skor Penilaian Pertanyaan Esai.</li>
          </ul>
        </Panduan>

        {/* PANDUAN ASESI */}
        <Panduan title="PANDUAN BAGI ASESI">
          <b>Instruksi:</b>
          <ul style={{ margin: '4px 0 4px 18px', paddingLeft: '18px', listStyleType: 'disc' }}>
            <li style={{ marginBottom: '4px' }}>Pertanyaan esai merupakan jenis bukti tambahan untuk mendukung bukti-bukti yang sudah ada.</li>
            <li style={{ marginBottom: '4px' }}>Baca dengan teliti dan cermat pertanyaan esai pada lembar soal.</li>
            <li style={{ marginBottom: '0' }}>Tuliskan jawaban Anda pada Lembar Jawaban Pertanyaan Tertulis Esai.</li>
          </ul>
        </Panduan>

        {/* SOAL */}
        <table style={{ border: '2px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
          <tbody>
            <tr>
              <td style={{ ...panduanTitle, width: '100px', textAlign: 'center' }}>KUK</td>
              <td colSpan={2} style={{ ...panduanTitle, textAlign: 'center' }}>SOAL ESAI</td>
            </tr>
            {soalList.length === 0 && (
              <tr><td colSpan={3} style={{ ...td, textAlign: 'center', padding: '20px' }}>Belum ada soal esai.</td></tr>
            )}
            {soalList.map((soal, idx) => (
              <tr key={soal.id}>
                <td style={{ ...td, textAlign: 'center', fontWeight: 'bold', backgroundColor: '#d58a94' }}>
                  {soal.unit_kode && <>{soal.unit_kode}<br /></>}
                  {soal.kuk_kode || ''}
                </td>
                <td style={{ ...td, width: '40px', textAlign: 'center' }}>{idx + 1}.</td>
                <td style={td}>{soal.soal}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <br />

        {/* PENYUSUN DAN VALIDATOR */}
        <h2 style={{ fontSize: '14px', fontWeight: 'bold' }}>PENYUSUN DAN VALIDATOR</h2>
        <PenyusunValidatorTable />
            <br/><br/><br/>
        {/* FR.IA.06C LEMBAR JAWABAN */}
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#4F81BD' }}>FR.IA.06C. LEMBAR JAWABAN PERTANYAAN TERTULIS ESAI</h2>
        <IdentitasTable jabatanKerja={jabatanKerja} nomorSkema={nomorSkema} tuk={tuk} asesorList={asesorList} namaAsesi={namaAsesi || user?.name || '-'} />
        <p style={{ fontSize: '12px', margin: '4px 0' }}>*Coret yang tidak perlu</p>

        {/* LEMBAR JAWABAN TABLE */}
        <table style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
          <tbody>
            <tr style={{ ...hdDok, fontWeight: 'bold', textAlign: 'center' }}>
              <Td rowSpan={2}>KUK</Td>
              <Td rowSpan={2} colSpan={2}>JAWABAN SOAL ESAI</Td>
              <Td colSpan={4}>Skor Penilaian</Td>
            </tr>
            <tr style={{ ...hdDok, fontWeight: 'bold', textAlign: 'center' }}>
              <Td style={{ width: '5%' }}>0</Td>
              <Td style={{ width: '5%' }}>1</Td>
              <Td style={{ width: '5%' }}>2</Td>
              <Td style={{ width: '5%' }}>3</Td>
            </tr>
            {soalList.map((soal, idx) => (
              <tr key={soal.id}>
                <Td style={{ textAlign: 'center', backgroundColor: '#d58a94', width: '15%' }}>{idx + 1}</Td>
                <Td style={{ width: '5%', textAlign: 'center', backgroundColor: '#d58a94' }}>{idx + 1}</Td>
                <td style={{ ...td, textAlign: 'left' }}>
                  {isAsesi && (
                    <textarea
                      style={{ width: '100%', border: '1px solid #000', padding: '4px', marginTop: '4px', minHeight: '60px', fontSize: '11pt' }}
                      value={jawaban[soal.id] || ""}
                      onChange={e => setJawaban(prev => ({ ...prev, [soal.id]: e.target.value }))}
                      placeholder="Tulis jawaban Anda di sini..."
                    />
                  )}
                  {isAsesor && jawaban[soal.id] && (
                    <div style={{ marginTop: '4px', padding: '4px', border: '1px dashed #999', background: '#f9f9f9' }}>
                      <b>Jawaban Asesi:</b><br />{jawaban[soal.id]}
                    </div>
                  )}
                </td>
                {[0, 1, 2, 3].map(n => (
                  <td key={n} style={{ ...td, textAlign: 'center', verticalAlign: 'middle' }}>
                    <CustomCheckbox
                      checked={skor[soal.id] === n}
                      onChange={() => setSkor(prev => {
                        if (prev[soal.id] === n) { const { [soal.id]: _, ...rest } = prev; return rest }
                        return { ...prev, [soal.id]: n }
                      })}
                      disabled={!isAsesor}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <br />

        {/* REKAPITULASI */}
        <table style={{ width: '100%', border: '1px solid #000', borderCollapse: 'collapse', textAlign: 'center' }}>
          <tbody>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#c40000', color: '#fff' }}>
              <Td colSpan={2} style={{ textAlign: 'center' }}>
                Rekapitulasi Skor Penilaian Pertanyaan IA06<br />
                <span style={{ fontWeight: 'normal' }}>( Penilaian = Jumlah skor seluruh butir soal)</span>
              </Td>
            </tr>
            <tr>
              <Td style={{ textAlign: 'center', fontWeight: 'bold', width: '50%' }}>Total Skor Penilaian</Td>
              <Td style={{ textAlign: 'center', width: '50%', fontSize: '14pt' }}>{totalSkor}</Td>
            </tr>
          </tbody>
        </table>
        <br /><br />

        {/* ==================== UMPAN BALIK + TTD ASESI ==================== */}
        <table style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
          <tbody>
            <tr>
              <Td style={{ fontWeight: 'bold', width: '20%' }}>Umpan balik untuk asesi:</Td>
              <Td style={{ width: '5%' }}>:</Td>
              <Td>
                Aspek pengetahuan seluruh unit kompetensi yang diujikan (tercapai / belum tercapai)* <br /><br />Tuliskan unit/elemen/KUK jika belum tercapai: …
                {isAsesor ? (
                  <textarea
                    style={{ width: '100%', border: '1px solid #000', padding: '8px', minHeight: '60px', fontSize: '12pt', marginTop: '8px' }}
                    value={umpanBalik}
                    onChange={e => setUmpanBalik(e.target.value)}
                    placeholder="Tulis umpan balik..."
                  />
                ) : umpanBalik ? (
                  <div style={{ marginTop: '8px' }}>
                    <strong>Umpan Balik Asesor:</strong>
                    <p style={{ margin: '4px 0 0 0' }}>{umpanBalik}</p>
                  </div>
                ) : null}
              </Td>
            </tr>
            <tr style={{ fontWeight: 'bold' }}>
              <Td colSpan={3}>Asesi :</Td>
            </tr>
            <tr>
              <Td style={{ width: '20%' }}>Nama</Td>
              <Td style={{ width: '5%' }}>:</Td>
              <Td>{namaAsesi || user?.name || '-'}</Td>
            </tr>
            <tr>
              <Td>Tanda tangan/ Tanggal</Td>
              <Td>:</Td>
              <Td style={{ height: '70px', verticalAlign: 'middle', textAlign: 'center' }}>
                {(barcodes as any)?.['asesi']?.url ? (
                  <>
                    <img src={(barcodes as any)['asesi'].url} style={{ height: '50px', width: '50px', objectFit: 'contain' }} alt="barcode" /><br />
                    <span style={{ fontSize: '11px' }}>
                      {(barcodes as any)['asesi']?.tanggal ? new Date((barcodes as any)['asesi'].tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                    </span>
                  </>
                ) : (
                  <span style={{ color: '#999' }}>Belum ditandatangani</span>
                )}
              </Td>
            </tr>
          </tbody>
        </table>
        {asesorList.map((a: any, idx: number) => (
          <div key={idx}>
            <TTDTable title={`Asesor ${asesorList.length > 1 ? idx + 1 : ''} :`} nama={a?.nama || '-'} noReg={a?.no_reg} barcode={(barcodes as any)?.[`asesor${idx + 1}`]} />
          </div>
        ))}

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 0' }}>
          <ActionButton variant="primary" onClick={handleSave}>
            {isSaving ? "Menyimpan..." : "Simpan & Lanjutkan"}
          </ActionButton>
        </div>
      </div>

      <WebcamModal isOpen={showAwalModal} onClose={handleAwalModalClose} onSubmit={submitAbsenAwal}
        title="Absen Masuk Asesmen" description="Silakan ambil foto wajah Anda untuk absen masuk" canClose={false} />
    </ModularAsesiLayout>
  )
}
