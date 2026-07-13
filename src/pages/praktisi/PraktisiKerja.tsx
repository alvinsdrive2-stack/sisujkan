import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams } from "react-router-dom"
import { API_BASE_URL } from "@/config/api"
import { CustomCheckbox } from "@/components/ui/Checkbox"
import { CustomRadio } from "@/components/ui/Radio"

type DocType = "ia04b" | "ia05" | "ia06"

const TABS: { key: DocType; label: string }[] = [
  { key: "ia04b", label: "IA.04B" },
  { key: "ia05", label: "IA.05" },
  { key: "ia06", label: "IA.06" },
]

interface SoalIA04B {
  id: number; no?: string; soal?: string; soal1?: string; soal2?: string | null
  tipe?: number; jawaban?: string; skor?: number; pencapaian?: number; unit_kode?: string
}

interface SoalIA05 {
  id: number; no?: string; soal?: string
  jawab_a?: string; jawab_b?: string; jawab_c?: string; jawab_d?: string
  kunci_jawaban?: string; jawaban_asesi?: string | null; skor?: number
  unit_kode?: string; kuk_kode?: string | null
}

interface SoalIA06 {
  id: number; no?: string; unit_kode?: string; kuk_kode?: string | null; soal?: string
  jawaban?: string; skor?: number
}

interface DokumenRef {
  id: number; kode?: string; nama_dokumen?: string
}

interface IdentitasData {
  jabatan_kerja?: string; nomor_skema?: string; tuk?: string
  asesor_list?: { nama?: string; no_reg?: string }[]
  nama_asesi?: string; jadwal_id?: number
}

interface PenyusunData {
  penyusun?: { nama?: string; nomor_met?: string }[]
  validator?: { nama?: string; nomor_met?: string }[]
}

const td = { border: '0.2px solid black', padding: '4px 6px' }
const hdDok = { backgroundColor: '#c40000', color: '#fff' }
const hdDokB = { backgroundColor: '#d58a94', color: '#000' }
const panduanTitle = { backgroundColor: '#c00000', color: '#fff', fontWeight: 'bold' as const, padding: '4px 8px', fontSize: '11pt' }
const fontS = { fontFamily: '"Arial Narrow", Calibri, Candara, Segoe, Segoe UI, Optima, Arial, sans-serif', fontSize: '12pt' }
const formatter = new Intl.DateTimeFormat('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })

function Td({ children, style, colSpan, rowSpan }: { children?: React.ReactNode; style?: React.CSSProperties; colSpan?: number; rowSpan?: number }) {
  return <td colSpan={colSpan} rowSpan={rowSpan} style={{ ...td, ...style }}>{children}</td>
}

function IdentitasTable({ data }: { data: IdentitasData }) {
  return (
    <table style={{ border: '2px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
      <tbody>
        <tr>
          <Td rowSpan={2} style={{ width: '30%' }}>Skema Sertifikasi (KKNI/Okupasi/Klaster)</Td>
          <Td style={{ width: '12%' }}>Judul</Td>
          <Td style={{ width: '3%', textAlign: 'center' }}>:</Td>
          <Td style={{ textTransform: 'uppercase' }}>{data.jabatan_kerja || '-'}</Td>
        </tr>
        <tr>
          <Td>Nomor</Td>
          <Td style={{ textAlign: 'center' }}>:</Td>
          <Td style={{ textTransform: 'uppercase' }}>{data.nomor_skema || '-'}</Td>
        </tr>
        <tr>
          <Td>TUK</Td>
          <Td style={{ textAlign: 'center' }}>:</Td>
          <Td colSpan={2} style={{ textTransform: 'uppercase' }}>{data.tuk || '-'}</Td>
        </tr>
        {(data.asesor_list || []).map((a, i) => (
          <tr key={i}>
            <Td>Nama Asesor {i + 1}</Td>
            <Td style={{ textAlign: 'center' }}>:</Td>
            <Td colSpan={2} style={{ textTransform: 'uppercase' }}>{a?.nama || '-'}</Td>
          </tr>
        ))}
        <tr>
          <Td>Nama Asesi</Td>
          <Td style={{ textAlign: 'center' }}>:</Td>
          <Td colSpan={2} style={{ textTransform: 'uppercase' }}>{data.nama_asesi || '-'}</Td>
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

function PenyusunValidatorTable({ penyusun, validator }: PenyusunData) {
  const p = penyusun || []
  const v = validator || []
  const row = (item?: { nama?: string; nomor_met?: string }) => (
    <><Td>{item?.nama || ''}</Td><Td>{item?.nomor_met || ''}</Td><Td style={{ height: '50px' }}></Td></>
  )
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
          <Td rowSpan={Math.max(p.length, 1)}>PENYUSUN</Td>
          {p.length > 0 ? p.map((item, i) => (
            i === 0 ? <>{i + 1}{row(item)}</> : null
          )) : <><Td style={{ textAlign: 'center' }}>1</Td>{row()}</>}
        </tr>
        {p.length > 1 && p.slice(1).map((item, i) => (
          <tr key={i}><Td style={{ textAlign: 'center' }}>{i + 2}</Td>{row(item)}</tr>
        ))}
        <tr style={{ fontWeight: 'bold' }}>
          <Td rowSpan={Math.max(v.length, 1)}>VALIDATOR</Td>
          {v.length > 0 ? v.map((item, i) => (
            i === 0 ? <><Td style={{ textAlign: 'center' }}>{i + 1}</Td>{row(item)}</> : null
          )) : <><Td style={{ textAlign: 'center' }}>1</Td>{row()}</>}
        </tr>
        {v.length > 1 && v.slice(1).map((item, i) => (
          <tr key={i}><Td style={{ textAlign: 'center' }}>{i + 2}</Td>{row(item)}</tr>
        ))}
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

export default function PraktisiKerja() {
  const { id } = useParams<{ id: string }>()
  const token = localStorage.getItem("access_token") || ""

  const [tab, setTab] = useState<DocType>("ia04b")
  const [dokumen, setDokumen] = useState<DokumenRef | null>(null)
  const [soalList, setSoalList] = useState<any[]>([])
  const [barcodes, setBarcodes] = useState<any>(null)
  const [identitas, setIdentitas] = useState<IdentitasData>({})
  const [jawaban, setJawaban] = useState<Record<number, string>>({})
  const [skor, setSkor] = useState<Record<number, number>>({})
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({})
  const [umpanBalik, setUmpanBalik] = useState("")
  const [rekomendasi, setRekomendasi] = useState<'kompeten' | 'belum_kompeten' | null>(null)
  const [penyusunData, setPenyusunData] = useState<PenyusunData>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [qring, setQring] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")

  const load = useCallback(async (doc: DocType) => {
    if (!id) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${API_BASE_URL}/praktisi/jabatan/${id}/${doc}`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Gagal load ${doc} (${res.status})`)
      const j = await res.json()
      const d = j.data || j

      setDokumen(d.dokumen || null)
      setSoalList(d.soal_list || [])
      setBarcodes(d.barcodes || null)
      setUmpanBalik(d.umpan_balik || "")
      setRekomendasi(
        d.rekomendasi?.rekomendasi !== undefined
          ? (d.rekomendasi.rekomendasi ? 'kompeten' : 'belum_kompeten')
          : null
      )

      setIdentitas({
        jabatan_kerja: d.jabatan_kerja || '',
        nomor_skema: d.nomor_skema || '',
        tuk: d.tuk || '',
        asesor_list: d.asesor_list || [],
        nama_asesi: d.nama_asesi || '',
        jadwal_id: d.jadwal_id,
      })

      const jInit: Record<number, string> = {}
      const sInit: Record<number, number> = {}
      const aInit: Record<number, 'A'|'B'|'C'|'D'> = {}

      ;(d.soal_list || []).forEach((q: any) => {
        if (doc === "ia05") {
          const jv = (q as SoalIA05).jawaban_asesi
          if (jv && ['A','B','C','D'].includes(jv)) aInit[q.id] = jv as 'A'|'B'|'C'|'D'
        } else {
          const jv = (q as SoalIA04B).jawaban || (q as SoalIA06).jawaban || ""
          if (jv) jInit[q.id] = jv
          const pv = (q as SoalIA04B).pencapaian ?? (q as SoalIA06).skor
          if (pv !== undefined && pv !== null) sInit[q.id] = pv
        }
      })

      setJawaban(jInit)
      setSkor(sInit)
      setAnswers(aInit)

      // Fetch penyusun & validator
      fetch(`${API_BASE_URL}/praktisi/jabatan/${id}/data-dokumen`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      }).then(r => r.json()).then(j2 => {
        const d2 = j2.data || j2
        setPenyusunData({
          penyusun: d2.penyusun || [],
          validator: d2.validator || [],
        })
      }).catch(() => {})
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }, [id, token])

  useEffect(() => { load(tab) }, [tab, load])

  const totalSkor = useMemo(() => Object.values(skor).reduce((a, b) => a + b, 0), [skor])
  const jumlahSoal = soalList.length || 0
  const jumlahBenar = useMemo(
    () => soalList.filter((s: SoalIA05) => answers[s.id] === s.kunci_jawaban).length || 0,
    [soalList, answers]
  )
  const jumlahSalah = jumlahSoal - jumlahBenar

  const handleAnswerChange = (soalId: number, answer: 'A' | 'B' | 'C' | 'D') =>
    setAnswers(prev => ({ ...prev, [soalId]: answer }))

  const save = async () => {
    if (!id) return
    setSaving(true)
    setError("")
    setInfo("")
    try {
      if (!dokumen) throw new Error("Dokumen belum terload")

      let answersPayload: any[]
      if (tab === "ia05") {
        answersPayload = soalList.map((s: SoalIA05) => ({
          soal_id: s.id,
          jawaban: answers[s.id] || '',
          skor: answers[s.id] === s.kunci_jawaban ? 1 : 0,
        }))
      } else {
        answersPayload = soalList.map((q: any) => ({
          soal_id: q.id,
          jawaban: jawaban[q.id] || '',
          skor: skor[q.id] ?? null,
        }))
      }

      const body: any = { type: tab, dokumen_id: dokumen.id, answers: answersPayload }
      if (tab !== "ia04b") body.umpan_balik = umpanBalik
      if (tab === "ia04b" && rekomendasi) body.rekomendasi = rekomendasi === 'kompeten'

      const res = await fetch(`${API_BASE_URL}/praktisi/jabatan/${id}/jawab`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const ej = await res.json().catch(() => ({}))
        throw new Error(ej.message || `Gagal simpan (${res.status})`)
      }
      setInfo(`${tab.toUpperCase()} tersimpan`)
      load(tab)
    } catch (e: any) {
      setError(e.message)
    }
    setSaving(false)
  }

  const genQr = async () => {
    if (!id) return
    setQring(true)
    setError("")
    setInfo("")
    try {
      const res = await fetch(`${API_BASE_URL}/praktisi/jabatan/${id}/qr/${tab}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: "{}",
      })
      if (!res.ok) {
        const ej = await res.json().catch(() => ({}))
        throw new Error(ej.message || `Gagal QR (${res.status})`)
      }
      setInfo(`QR ${tab.toUpperCase()} berhasil`)
      load(tab)
    } catch (e: any) {
      setError(e.message)
    }
    setQring(false)
  }

  if (!id) {
    return <div className="p-12 text-center text-slate-400">ID tidak ditemukan</div>
  }

  const asesorList = identitas.asesor_list || []

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              tab === t.key
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
      {info && <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg text-sm text-green-600">{info}</div>}

      {loading ? (
        <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-12 text-center text-slate-400">Memuat {tab.toUpperCase()}...</div>
      ) : (
        <div style={{ ...fontS, maxWidth: '1000px', margin: '0 auto' }}>
          {tab === "ia04b" && renderIa04b()}
          {tab === "ia05" && renderIa05()}
          {tab === "ia06" && renderIa06()}

          {soalList.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 0' }}>
              <button
                onClick={genQr}
                disabled={qring}
                style={{ border: '1px solid #000', background: '#fff', padding: '8px 24px', cursor: qring ? 'not-allowed' : 'pointer', fontSize: '12pt' }}
              >
                {qring ? "Generate QR..." : `QR ${tab.toUpperCase()}`}
              </button>
              <button
                onClick={save}
                disabled={saving}
                style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 24px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '12pt' }}
              >
                {saving ? "Menyimpan..." : `Simpan ${tab.toUpperCase()}`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  // ===================== IA.04B =====================
  function renderIa04b() {
    const sList = soalList as SoalIA04B[]
    return (
      <>
        <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '1px', color: '#4F81BD', marginBottom: '16px' }}>
          FR.IA.04.B {dokumen?.nama_dokumen || 'LEMBAR PERIKSA KEGIATAN TERSTRUKTUR'}
        </div>

        <IdentitasTable data={identitas} />
        <p style={{ fontSize: '12px', margin: '4px 0' }}>*Coret yang tidak perlu</p>

        <Panduan title="PANDUAN BAGI ASESOR">
          <b>Instruksi:</b>
          <ul style={{ margin: '4px 0 4px 18px', paddingLeft: '18px', listStyleType: 'disc' }}>
            <li style={{ marginBottom: '4px' }}>Lakukan penilaian pencapaian hasil proyek singkat atau kegiatan terstruktur lainnya melalui presentasi.</li>
            <li style={{ marginBottom: '4px' }}>Penilaian dapat dilakukan untuk keseluruhan unit kompetensi dalam skema sertifikasi atau dapat pula dilakukan untuk masing-masing kelompok pekerjaan.</li>
            <li style={{ marginBottom: '4px' }}>Pertanyaan disampaikan oleh asesor pada saat asesi melakukan presentasi kegiatan terstruktur.</li>
            <li style={{ marginBottom: '4px' }}>Asesor menilai jawaban peserta uji berdasarkan jawaban yang diberikan. Penilaian dilakukan dengan memberikan tanda centang (✓) pada salah satu kolom skor penilaian 0, 1, 2, atau 3 sesuai dengan tingkat kesesuaian dan kelengkapan jawaban peserta, dengan ketentuan sebagai berikut:
              <br/>0 = Jawaban tidak sesuai, keliru, atau tidak menjawab
              <br/>1 = Jawaban sebagian benar, namun tidak lengkap/kurang tepat.
              <br/>2 = Jawaban benar dan sesuai, namun belum sepenuhnya lengkap.
              <br/>3 = Jawaban lengkap, tepat, runtut dan sesuai konteks
            </li>
            <li style={{ marginBottom: '4px' }}>Dibutuhkan jastifikasi profesional asesor untuk memutuskan hal ini.</li>
            <li style={{ marginBottom: '4px' }}>Seluruh hasil penilaian dijumlahkan dan dicatat pada kolom Rekapitulasi Skor Penilaian Pertanyaan Lisan.</li>
            <li style={{ marginBottom: '0' }}>Durasi presentasi yaitu 15 menit dan tanya jawab 15 menit.</li>
          </ul>
        </Panduan>

        <table style={{ border: '2px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
          <thead>
            <tr style={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#c40000', color: '#fff' }}>
              <Td rowSpan={2} style={{ width: '5%' }}>No</Td>
              <Td colSpan={3} style={{ width: '14%' }}>Aspek Penilaian</Td>
              <Td colSpan={4} style={{ width: '14%' }}>Pencapaian</Td>
            </tr>
            <tr style={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#c40000', color: '#fff' }}>
              <Td style={{ width: '30%' }}>Lingkup Penyajian Proyek atau Kegiatan Terstruktur Lainnya</Td>
              <Td style={{ width: '25%' }}>Daftar Pertanyaan</Td>
              <Td style={{ width: '25%' }}>Kesesuaian dengan standar kompetensi kerja</Td>
              <Td style={{ width: '3%' }}>0</Td>
              <Td style={{ width: '3%' }}>1</Td>
              <Td style={{ width: '3%' }}>2</Td>
              <Td style={{ width: '3%' }}>3</Td>
            </tr>
          </thead>
          <tbody>
            {sList.length === 0 ? (
              <tr><td colSpan={8} style={{ ...td, textAlign: 'center', padding: '20px' }}>Belum ada soal</td></tr>
            ) : sList.map((soal, idx) => (
              <tr key={soal.id}>
                <Td style={{ textAlign: 'center', verticalAlign: 'top' }}>{soal.no || idx + 1}</Td>
                <Td style={{ verticalAlign: 'top' }}>{soal.soal1}</Td>
                <Td style={{ verticalAlign: 'top' }}>
                  <div>{soal.soal}</div>
                  <p style={{ margin: '8px 0 4px 0', fontSize: '12px', fontWeight: 'bold' }}>Jawaban asesi:</p>
                  <textarea
                    value={jawaban[soal.id] || ""}
                    onChange={e => setJawaban(prev => ({ ...prev, [soal.id]: e.target.value }))}
                    style={{ width: '100%', minHeight: '50px', border: '1px solid #ccc', padding: '6px', fontSize: '12px', background: '#f9f9f9' }}
                  />
                </Td>
                <Td style={{ verticalAlign: 'top' }}>Kode Unit : {soal.soal2 || soal.unit_kode || ''}</Td>
                {[0, 1, 2, 3].map(n => (
                  <td key={n} style={{ ...td, textAlign: 'center', verticalAlign: 'middle' }}>
                    <CustomCheckbox
                      checked={skor[soal.id] === n}
                      onChange={() => setSkor(prev => {
                        if (prev[soal.id] === n) { const { [soal.id]: _, ...rest } = prev; return rest }
                        return { ...prev, [soal.id]: n }
                      })}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <br />

        <h2 style={{ fontSize: '14px', fontWeight: 'bold' }}>PENYUSUN DAN VALIDATOR</h2>
        <PenyusunValidatorTable penyusun={penyusunData.penyusun} validator={penyusunData.validator} />
        <br />

        <table style={{ width: '100%', border: '1px solid #000', borderCollapse: 'collapse', textAlign: 'center' }}>
          <tbody>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#c40000', color: '#fff' }}>
              <Td colSpan={2} style={{ textAlign: 'center' }}>
                Rekapitulasi Skor Penilaian Pertanyaan IA04B<br />
                <span style={{ fontWeight: 'normal' }}>( Penilaian = Jumlah skor seluruh butir soal)</span>
              </Td>
            </tr>
            <tr>
              <Td style={{ fontWeight: 'bold', width: '50%' }}>Total Skor Penilaian</Td>
              <Td style={{ fontWeight: 'bold', width: '50%', fontSize: '14pt' }}>{totalSkor}</Td>
            </tr>
          </tbody>
        </table>
        <br />

        <table style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
          <tbody>
            <tr>
              <Td style={{ fontWeight: 'bold', width: '30%' }}>Rekomendasi:</Td>
              <Td>
                <div onClick={() => setRekomendasi('kompeten')} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', cursor: 'pointer' }}>
                  <CustomCheckbox checked={rekomendasi === 'kompeten'} onChange={() => {}} />
                  Kompeten
                </div>
                <div onClick={() => setRekomendasi('belum_kompeten')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <CustomCheckbox checked={rekomendasi === 'belum_kompeten'} onChange={() => {}} />
                  Belum Kompeten
                </div>
              </Td>
            </tr>
          </tbody>
        </table>
        <br />

        {/* Umpan Balik + TTD Asesi */}
        <table style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
          <tbody>
            <tr>
              <Td style={{ fontWeight: 'bold' }}>Umpan balik untuk asesi:</Td>
              <Td style={{ width: '5%' }}>:</Td>
              <Td>Aspek pengetahuan seluruh unit kompetensi yang diujikan (tercapai / belum tercapai)* <br /><br />Tuliskan unit/elemen/KUK jika belum tercapai: …</Td>
            </tr>
            <tr style={{ fontWeight: 'bold' }}><Td colSpan={3}>Asesi :</Td></tr>
            <tr>
              <Td style={{ width: '20%' }}>Nama</Td>
              <Td style={{ width: '5%' }}>:</Td>
              <Td>{identitas.nama_asesi || '-'}</Td>
            </tr>
            <tr>
              <Td>Tanda tangan/ Tanggal</Td>
              <Td style={{ textAlign: 'center' }}>:</Td>
              <Td style={{ height: '70px', verticalAlign: 'middle', textAlign: 'center' }}>
                {(barcodes as any)?.['asesi']?.url ? (
                  <>
                    <img src={(barcodes as any)['asesi'].url} style={{ height: '50px', width: '50px', objectFit: 'contain' }} alt="barcode asesi" /><br />
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

        {asesorList.map((a: any, i: number) => (
          <div key={i}>
            <TTDTable
              title={`Asesor ${asesorList.length > 1 ? i + 1 : ''} :`}
              nama={a?.nama || '-'}
              noReg={a?.no_reg}
              barcode={(barcodes as any)?.[`asesor${i + 1}`]}
            />
          </div>
        ))}
        <br />
      </>
    )
  }

  // ===================== IA.05 =====================
  function renderIa05() {
    const sList = soalList as SoalIA05[]
    return (
      <>
        <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '1px', color: '#4F81BD', marginBottom: '16px' }}>
          FR.IA.05. PERTANYAAN TERTULIS PILIHAN GANDA
        </div>

        <IdentitasTable data={identitas} />
        <p style={{ fontSize: '12px', margin: '4px 0' }}>*Coret yang tidak perlu</p>

        <Panduan title="PANDUAN BAGI ASESOR">
          <b>Instruksi:</b>
          <ul style={{ margin: '4px 0 4px 18px', paddingLeft: '18px', listStyleType: 'disc' }}>
            <li style={{ marginBottom: '4px' }}>Pertanyaan pilihan ganda merupakan jenis bukti tambahan untuk mendukung bukti-bukti yang sudah ada.</li>
            <li style={{ marginBottom: '4px' }}>Asesor menilai jawaban peserta uji berdasarkan jawaban yang diberikan. Penilaian dapat diisi dengan centang (✓) pada kolom jawaban benar atau jawaban salah, dengan ketentuan skor penilaian sebagai berikut:
              <br/>0 = Jawaban Salah
              <br/>1 = Jawaban Benar
            </li>
            <li style={{ marginBottom: '4px' }}>Dibutuhkan justifikasi profesional asesor untuk memutuskan hal ini.</li>
          </ul>
        </Panduan>

        <Panduan title="PANDUAN BAGI ASESI">
          <b>Instruksi:</b>
          <ul style={{ margin: '4px 0 4px 18px', paddingLeft: '18px', listStyleType: 'disc' }}>
            <li style={{ marginBottom: '4px' }}>Pertanyaan pilihan ganda merupakan jenis bukti tambahan untuk mendukung bukti-bukti yang sudah ada.</li>
            <li style={{ marginBottom: '4px' }}>Baca dengan teliti dan cermat pertanyaan Pilihan Ganda pada lembar soal.</li>
            <li style={{ marginBottom: '0' }}>Tuliskan jawaban Anda pada Lembar Jawaban Pertanyaan Pilihan Ganda.</li>
          </ul>
        </Panduan>

        <table style={{ border: '2px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
          <thead>
            <tr>
              <Td style={{ textAlign: 'center', fontWeight: 'bold', width: '100px', color: '#fff', backgroundColor: '#c00000' }}>
                KUK
              </Td>
              <Td colSpan={2} style={{ fontWeight: 'bold', color: '#fff', backgroundColor: '#c00000' }}>
                SOAL, Pilih Jawaban semua pertanyaan berikut (A / B / C / D) :
              </Td>
            </tr>
          </thead>
          <tbody>
            {sList.length === 0 ? (
              <tr><td colSpan={3} style={{ ...td, textAlign: 'center', padding: '20px' }}>Belum ada soal</td></tr>
            ) : sList.flatMap((soal) => {
              const cols = [
                { key: 'A' as const, label: soal.jawab_a },
                { key: 'B' as const, label: soal.jawab_b },
                { key: 'C' as const, label: soal.jawab_c },
                { key: 'D' as const, label: soal.jawab_d },
              ]
              const optionRows = cols.map(({ key, label }) => (
                <tr key={`${soal.id}-${key}`}>
                  <Td></Td>
                  <Td style={{ textAlign: 'center' }}>
                    <CustomRadio name={`soal-${soal.id}`} value={key} checked={answers[soal.id] === key} onChange={() => handleAnswerChange(soal.id, key)} />
                  </Td>
                  <Td>&nbsp; {key.toLowerCase()}. {label}</Td>
                </tr>
              ))
              return [
                <tr key={soal.id}>
                  <Td style={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#d58a94' }}>
                    {soal.unit_kode}<br />{soal.kuk_kode || ''}
                  </Td>
                  <Td style={{ width: '40px', textAlign: 'center' }}>{soal.no}.</Td>
                  <Td>{soal.soal}</Td>
                </tr>,
                ...optionRows,
              ]
            })}
          </tbody>
        </table>
        <br />

        <h2 style={{ fontSize: '14px', fontWeight: 'bold' }}>PENYUSUN DAN VALIDATOR</h2>
        <PenyusunValidatorTable penyusun={penyusunData.penyusun} validator={penyusunData.validator} />
        <br /><br /><br />

        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#4F81BD' }}>FR.05.C. LEMBAR JAWABAN PERTANYAAN TERTULIS PILIHAN GANDA</h2>
        <br />
        <IdentitasTable data={identitas} />
        <p style={{ fontSize: '12px', margin: '4px 0' }}>*Coret yang tidak perlu</p>

        <table style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
          <tbody>
            <tr style={{ ...hdDok, fontWeight: 'bold', textAlign: 'center' }}>
              <td colSpan={2} style={td}>Lembar Jawaban</td>
              <td colSpan={2} style={td}>Rekomendasi</td>
            </tr>
            <tr style={{ ...hdDokB, fontWeight: 'bold', textAlign: 'center' }}>
              <td style={{ ...td, width: '10%' }}>No</td>
              <td style={{ ...td, width: '40%' }}>Jawaban</td>
              <td style={{ ...td, width: '25%' }}>Benar</td>
              <td style={{ ...td, width: '25%' }}>Salah</td>
            </tr>
            {sList.length === 0 ? (
              <tr><td colSpan={4} style={{ ...td, textAlign: 'center', padding: '20px' }}>Belum ada soal</td></tr>
            ) : sList.map((soal) => {
              const isCorrect = answers[soal.id] === soal.kunci_jawaban
              const hasAnswer = !!answers[soal.id]
              return (
                <tr key={soal.id}>
                  <td style={{ ...td, textAlign: 'center' }}>{soal.no}</td>
                  <td style={td}>
                    {answers[soal.id] ? (
                      <>{answers[soal.id]} - {soal[`jawab_${answers[soal.id]!.toLowerCase()}` as keyof SoalIA05] || ''}</>
                    ) : (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>Belum dijawab</span>
                    )}
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <CustomCheckbox checked={hasAnswer && isCorrect} onChange={() => {}} disabled />
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <CustomCheckbox checked={hasAnswer && !isCorrect} onChange={() => {}} disabled />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <br />

        <table style={{ width: '100%', border: '1px solid #000', borderCollapse: 'collapse', textAlign: 'center' }}>
          <tbody>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#c40000', color: '#fff' }}>
              <Td colSpan={2} style={{ textAlign: 'center' }}>Rekapitulasi Penilaian Pertanyaan Pilihan Ganda</Td>
            </tr>
            <tr>
              <Td style={{ fontWeight: 'bold', backgroundColor: '#c40000', color: '#fff' }}>Benar</Td>
              <Td style={{ fontWeight: 'bold', backgroundColor: '#c40000', color: '#fff' }}>Salah</Td>
            </tr>
            <tr>
              <Td style={{ textAlign: 'center', fontSize: '14pt' }}>{jumlahBenar}</Td>
              <Td style={{ textAlign: 'center', fontSize: '14pt' }}>{jumlahSalah}</Td>
            </tr>
          </tbody>
        </table>
        <br /><br />

        <table style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
          <tbody>
            <tr>
              <Td style={{ fontWeight: 'bold', width: '20%' }}>Umpan balik untuk asesi:</Td>
              <Td style={{ width: '5%' }}>:</Td>
              <Td>
                Aspek pengetahuan seluruh unit kompetensi yang diujikan (tercapai / belum tercapai)* <br /><br />Tuliskan unit/elemen/KUK jika belum tercapai: …
                <textarea
                  style={{ width: '100%', border: '1px solid #000', padding: '8px', minHeight: '60px', fontSize: '12pt', marginTop: '8px' }}
                  value={umpanBalik}
                  onChange={e => setUmpanBalik(e.target.value)}
                  placeholder="Tulis umpan balik..."
                />
              </Td>
            </tr>
            <tr style={{ fontWeight: 'bold' }}><Td colSpan={3}>Asesi :</Td></tr>
            <tr>
              <Td style={{ width: '20%' }}>Nama</Td>
              <Td style={{ width: '5%' }}>:</Td>
              <Td>{identitas.nama_asesi || '-'}</Td>
            </tr>
            <tr>
              <Td>Tanda tangan/ Tanggal</Td>
              <Td style={{ textAlign: 'center' }}>:</Td>
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
            <TTDTable
              title={`Asesor ${asesorList.length > 1 ? idx + 1 : ''} :`}
              nama={a?.nama || '-'}
              noReg={a?.no_reg}
              barcode={(barcodes as any)?.[`asesor${idx + 1}`]}
            />
          </div>
        ))}
      </>
    )
  }

  // ===================== IA.06 =====================
  function renderIa06() {
    const sList = soalList as SoalIA06[]
    return (
      <>
        <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '1px', color: '#4F81BD', marginBottom: '16px' }}>
          FR.IA.06C. LEMBAR JAWABAN PERTANYAAN TERTULIS ESAI
        </div>

        <IdentitasTable data={identitas} />
        <p style={{ fontSize: '12px', margin: '4px 0' }}>*Coret yang tidak perlu</p>

        <Panduan title="PANDUAN BAGI ASESOR">
          <b>Instruksi:</b>
          <ul style={{ margin: '4px 0 4px 18px', paddingLeft: '18px', listStyleType: 'disc' }}>
            <li style={{ marginBottom: '4px' }}>Pertanyaan esai merupakan jenis bukti tambahan untuk mendukung bukti-bukti yang sudah ada.</li>
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

        <Panduan title="PANDUAN BAGI ASESI">
          <b>Instruksi:</b>
          <ul style={{ margin: '4px 0 4px 18px', paddingLeft: '18px', listStyleType: 'disc' }}>
            <li style={{ marginBottom: '4px' }}>Pertanyaan esai merupakan jenis bukti tambahan untuk mendukung bukti-bukti yang sudah ada.</li>
            <li style={{ marginBottom: '4px' }}>Baca dengan teliti dan cermat pertanyaan esai pada lembar soal.</li>
            <li style={{ marginBottom: '0' }}>Tuliskan jawaban Anda pada Lembar Jawaban Pertanyaan Tertulis Esai.</li>
          </ul>
        </Panduan>

        <table style={{ border: '2px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
          <tbody>
            <tr>
              <td style={{ ...panduanTitle, width: '100px', textAlign: 'center' }}>KUK</td>
              <td colSpan={2} style={{ ...panduanTitle, textAlign: 'center' }}>SOAL ESAI</td>
            </tr>
            {sList.length === 0 && (
              <tr><td colSpan={3} style={{ ...td, textAlign: 'center', padding: '20px' }}>Belum ada soal esai.</td></tr>
            )}
            {sList.map((soal, idx) => (
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

        <h2 style={{ fontSize: '14px', fontWeight: 'bold' }}>PENYUSUN DAN VALIDATOR</h2>
        <PenyusunValidatorTable penyusun={penyusunData.penyusun} validator={penyusunData.validator} />
        <br /><br /><br />

        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#4F81BD' }}>FR.IA.06C. LEMBAR JAWABAN PERTANYAAN TERTULIS ESAI</h2>
        <IdentitasTable data={identitas} />
        <p style={{ fontSize: '12px', margin: '4px 0' }}>*Coret yang tidak perlu</p>

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
            {sList.length === 0 ? (
              <tr><td colSpan={7} style={{ ...td, textAlign: 'center', padding: '20px' }}>Belum ada soal</td></tr>
            ) : sList.map((soal, idx) => (
              <tr key={soal.id}>
                <Td style={{ textAlign: 'center', backgroundColor: '#d58a94', width: '15%' }}>{soal.unit_kode || idx + 1}</Td>
                <Td style={{ width: '5%', textAlign: 'center', backgroundColor: '#d58a94' }}>{idx + 1}</Td>
                <td style={{ ...td, textAlign: 'left' }}>
                  <textarea
                    style={{ width: '100%', border: '1px solid #000', padding: '4px', marginTop: '4px', minHeight: '60px', fontSize: '11pt' }}
                    value={jawaban[soal.id] || ""}
                    onChange={e => setJawaban(prev => ({ ...prev, [soal.id]: e.target.value }))}
                    placeholder="Tulis jawaban Anda di sini..."
                  />
                </td>
                {[0, 1, 2, 3].map(n => (
                  <td key={n} style={{ ...td, textAlign: 'center', verticalAlign: 'middle' }}>
                    <CustomCheckbox
                      checked={skor[soal.id] === n}
                      onChange={() => setSkor(prev => {
                        if (prev[soal.id] === n) { const { [soal.id]: _, ...rest } = prev; return rest }
                        return { ...prev, [soal.id]: n }
                      })}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <br />

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

        <table style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
          <tbody>
            <tr>
              <Td style={{ fontWeight: 'bold', width: '20%' }}>Umpan balik untuk asesi:</Td>
              <Td style={{ width: '5%' }}>:</Td>
              <Td>
                Aspek pengetahuan seluruh unit kompetensi yang diujikan (tercapai / belum tercapai)* <br /><br />Tuliskan unit/elemen/KUK jika belum tercapai: …
                <textarea
                  style={{ width: '100%', border: '1px solid #000', padding: '8px', minHeight: '60px', fontSize: '12pt', marginTop: '8px' }}
                  value={umpanBalik}
                  onChange={e => setUmpanBalik(e.target.value)}
                  placeholder="Tulis umpan balik..."
                />
              </Td>
            </tr>
            <tr style={{ fontWeight: 'bold' }}><Td colSpan={3}>Asesi :</Td></tr>
            <tr>
              <Td style={{ width: '20%' }}>Nama</Td>
              <Td style={{ width: '5%' }}>:</Td>
              <Td>{identitas.nama_asesi || '-'}</Td>
            </tr>
            <tr>
              <Td>Tanda tangan/ Tanggal</Td>
              <Td style={{ textAlign: 'center' }}>:</Td>
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
            <TTDTable
              title={`Asesor ${asesorList.length > 1 ? idx + 1 : ''} :`}
              nama={a?.nama || '-'}
              noReg={a?.no_reg}
              barcode={(barcodes as any)?.[`asesor${idx + 1}`]}
            />
          </div>
        ))}
      </>
    )
  }
}
