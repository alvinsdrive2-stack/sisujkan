import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/config/api"
import { Badge } from "@/components/ui/badge"
import { CustomCheckbox } from "@/components/ui/Checkbox"
import { CustomRadio } from "@/components/ui/Radio"
import { Loader2, Eye } from "lucide-react"

type DocType = "ia04b" | "ia05" | "ia06"

interface SoalKosongPreviewProps {
  jabkerId: string
}

interface SoalItem {
  id: number
  no: number
  soal: string
  soal1?: string | null
  soal2?: string | null
  tipe: number
  jawab_a?: string | null
  jawab_b?: string | null
  jawab_c?: string | null
  jawab_d?: string | null
  unit_kode?: string | null
  kuk_kode?: string | null
  kunci_jawaban?: string | null
}

interface ApiResponse {
  message: string
  data: {
    skema: string
    dokumen: { id: number; kode: string; nama_dokumen: string }
    soal_list: SoalItem[]
  }
}

const td = { border: '0.2px solid black', padding: '4px 6px' }
const hdDok = { backgroundColor: '#c40000', color: '#fff' }
const hdDokB = { backgroundColor: '#d58a94', color: '#000' }
const panduanTitle: React.CSSProperties = { backgroundColor: '#c00000', color: '#fff', fontWeight: 'bold', padding: '4px 8px', fontSize: '11pt' }
const fontS: React.CSSProperties = { fontFamily: '"Arial Narrow", Calibri, Candara, Segoe, Segoe UI, Optima, Arial, sans-serif', fontSize: '12pt' }

function Td({ children, style, colSpan, rowSpan }: { children?: React.ReactNode; style?: React.CSSProperties; colSpan?: number; rowSpan?: number }) {
  return <td colSpan={colSpan} rowSpan={rowSpan} style={{ ...td, ...style }}>{children}</td>
}

function IdentitasTable({ skema }: { skema: string }) {
  return (
    <table style={{ border: '2px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
      <tbody>
        <tr>
          <Td rowSpan={2} style={{ width: '30%' }}>Skema Sertifikasi (KKNI/Okupasi/Klaster)</Td>
          <Td style={{ width: '12%' }}>Judul</Td>
          <Td style={{ width: '3%', textAlign: 'center' }}>:</Td>
          <Td style={{ textTransform: 'uppercase' }}>{skema || '-'}</Td>
        </tr>
        <tr>
          <Td>Nomor</Td>
          <Td style={{ textAlign: 'center' }}>:</Td>
          <Td style={{ textTransform: 'uppercase' }}>-</Td>
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
          <Td style={{ textAlign: 'center' }}>1</Td><Td></Td><Td></Td>
          <Td style={{ height: '50px', textAlign: 'center' }}><span style={{ color: '#999' }}>Belum ditandatangani</span></Td>
        </tr>
        <tr><Td style={{ textAlign: 'center' }}>2</Td><Td></Td><Td></Td><Td style={{ height: '50px' }}></Td></tr>
        <tr style={{ fontWeight: 'bold' }}>
          <Td rowSpan={2}>VALIDATOR</Td>
          <Td style={{ textAlign: 'center' }}>1</Td><Td></Td><Td></Td>
          <Td style={{ height: '50px', textAlign: 'center' }}><span style={{ color: '#999' }}>Belum ditandatangani</span></Td>
        </tr>
        <tr><Td style={{ textAlign: 'center' }}>2</Td><Td></Td><Td></Td><Td style={{ height: '50px' }}></Td></tr>
      </tbody>
    </table>
  )
}

function TTDAsesi() {
  return (
    <table style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
      <tbody>
        <tr style={{ fontWeight: 'bold', textAlign: 'center' }}><Td colSpan={3}>Asesi</Td></tr>
        <tr><Td style={{ width: '20%', textAlign: 'center' }}>Nama</Td><Td style={{ width: '5%', textAlign: 'center' }}>:</Td><Td style={{ textAlign: 'center' }}>-</Td></tr>
        <tr>
          <Td style={{ textAlign: 'center' }}>Tanda Tangan / Tanggal</Td>
          <Td style={{ textAlign: 'center' }}>:</Td>
          <Td style={{ height: '70px', verticalAlign: 'middle', textAlign: 'center' }}>
            <span style={{ color: '#999' }}>Belum ditandatangani</span>
          </Td>
        </tr>
      </tbody>
    </table>
  )
}

const TABS: { key: DocType; label: string }[] = [
  { key: "ia04b", label: "IA.04B" },
  { key: "ia05", label: "IA.05" },
  { key: "ia06", label: "IA.06" },
]

export function SoalKosongPreview({ jabkerId }: SoalKosongPreviewProps) {
  const [tab, setTab] = useState<DocType>("ia04b")
  const [dokumen, setDokumen] = useState<{ id: number; nama_dokumen: string } | null>(null)
  const [skema, setSkema] = useState("")
  const [soalList, setSoalList] = useState<SoalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const token = localStorage.getItem("access_token") || ""

  useEffect(() => {
    fetchSoal()
  }, [tab, jabkerId])

  const fetchSoal = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${API_BASE_URL}/kan/config/soal-kosong/${jabkerId}/${tab}`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Gagal load ${tab} (${res.status})`)
      const json: ApiResponse = await res.json()
      setSkema(json.data?.skema || "")
      setDokumen(json.data?.dokumen || null)
      setSoalList(json.data?.soal_list || [])
    } catch (err: any) {
      setError(err.message || "Gagal fetch")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg sticky top-0 z-10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Eye className="w-4 h-4" />
            {t.label}
            <Badge variant={tab === t.key ? "default" : "outline"} className="text-xs ml-1">
              {tab === t.key ? soalList.length : 0}
            </Badge>
          </button>
        ))}
      </div>

      {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Memuat {tab.toUpperCase()}...</span>
        </div>
      ) : (
        <div style={{ ...fontS, maxWidth: '1000px', margin: '0 auto' }}>
          {tab === "ia04b" && renderIa04b()}
          {tab === "ia05" && renderIa05()}
          {tab === "ia06" && renderIa06()}
        </div>
      )}
    </div>
  )

  // ===================== IA.04B =====================
  function renderIa04b() {
    return (
      <>
        <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '1px', color: '#4F81BD', marginBottom: '16px' }}>
          FR.IA.04.B {dokumen?.nama_dokumen || 'LEMBAR PERIKSA KEGIATAN TERSTRUKTUR'}
        </div>

        <IdentitasTable skema={skema}  />
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
            {soalList.length === 0 ? (
              <tr><td colSpan={8} style={{ ...td, textAlign: 'center', padding: '20px' }}>Belum ada soal</td></tr>
            ) : soalList.map((soal, idx) => (
              <tr key={soal.id}>
                <Td style={{ textAlign: 'center', verticalAlign: 'top' }}>{soal.no || idx + 1}</Td>
                <Td style={{ verticalAlign: 'top' }}>{soal.soal1}</Td>
                <Td style={{ verticalAlign: 'top' }}>
                  <div>{soal.soal}</div>
                  <p style={{ margin: '8px 0 4px 0', fontSize: '12px', fontWeight: 'bold' }}>Jawaban asesi:</p>
                  <textarea disabled
                    style={{ width: '100%', minHeight: '50px', border: '1px solid #ccc', padding: '6px', fontSize: '12px', background: '#e9e9e9', resize: 'none', overflow: 'hidden' }}
                  />
                </Td>
                <Td style={{ verticalAlign: 'top' }}>{soal.soal2 || soal.unit_kode || ''}</Td>
                {[0, 1, 2, 3].map(n => (
                  <td key={n} style={{ ...td, textAlign: 'center', verticalAlign: 'middle' }}>
                    <CustomCheckbox checked={false} onChange={() => {}} disabled />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <br />

        <h2 style={{ fontSize: '14px', fontWeight: 'bold' }}>PENYUSUN DAN VALIDATOR</h2>
        <PenyusunValidatorTable />
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
              <Td style={{ fontWeight: 'bold', width: '50%', fontSize: '14pt' }}>0</Td>
            </tr>
          </tbody>
        </table>
        <br />

        <TTDAsesi />
        <br />
      </>
    )
  }

  // ===================== IA.05 =====================
  function renderIa05() {
    return (
      <>
        <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '1px', color: '#4F81BD', marginBottom: '16px' }}>
          FR.IA.05. PERTANYAAN TERTULIS PILIHAN GANDA
        </div>

        <IdentitasTable skema={skema}  />
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
              <Td style={{ textAlign: 'center', fontWeight: 'bold', width: '100px', color: '#fff', backgroundColor: '#c00000' }}>KUK</Td>
              <Td colSpan={2} style={{ fontWeight: 'bold', color: '#fff', backgroundColor: '#c00000' }}>SOAL, Pilih Jawaban semua pertanyaan berikut (A / B / C / D) :</Td>
            </tr>
          </thead>
          <tbody>
            {soalList.length === 0 ? (
              <tr><td colSpan={3} style={{ ...td, textAlign: 'center', padding: '20px' }}>Belum ada soal</td></tr>
            ) : soalList.flatMap((soal) => {
              const cols = [
                { key: 'A' as const, label: soal.jawab_a },
                { key: 'B' as const, label: soal.jawab_b },
                { key: 'C' as const, label: soal.jawab_c },
                { key: 'D' as const, label: soal.jawab_d },
              ]
              const isKunci = (s: SoalItem, k: string) => (s as any).kunci_jawaban === k
              const optionRows = cols.filter(o => o.label).map(({ key, label }) => {
                const kunci = isKunci(soal, key)
                return (
                  <tr key={`${soal.id}-${key}`}>
                    <Td style={{ textAlign: 'center', backgroundColor: kunci ? '#d4edda' : undefined }}>
                      {kunci && <span style={{ color: 'green' }}>✓</span>}
                    </Td>
                    <Td style={{ textAlign: 'center' }}>
                      <CustomRadio name={`soal-${soal.id}`} value={key} checked={false} onChange={() => {}} disabled />
                    </Td>
                    <Td style={{ backgroundColor: kunci ? '#d4edda' : undefined }}>
                      &nbsp; {key.toLowerCase()}. {label}
                      {kunci && <span style={{ color: 'green', marginLeft: '8px', fontWeight: 'bold' }}>(Kunci Jawaban)</span>}
                    </Td>
                  </tr>
                )
              })
              return [
                <tr key={soal.id}>
                  <Td style={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#d58a94' }}>
                    {soal.unit_kode && <>{soal.unit_kode}<br /></>}
                    {soal.kuk_kode || ''}
                  </Td>
                  <Td style={{ width: '40px', textAlign: 'center' }}>{soal.no}.</Td>
                  <Td>{soal.soal}</Td>
                </tr>,
                ...(optionRows.length > 0 ? optionRows : [
                  <tr key={`${soal.id}-empty`}>
                    <Td></Td>
                    <Td colSpan={2} style={{ fontStyle: 'italic', color: '#999' }}>Belum ada pilihan jawaban</Td>
                  </tr>
                ]),
              ]
            })}
          </tbody>
        </table>
        <br />

        <h2 style={{ fontSize: '14px', fontWeight: 'bold' }}>PENYUSUN DAN VALIDATOR</h2>
        <PenyusunValidatorTable />
        <br /><br /><br />

        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#4F81BD' }}>FR.05.C. LEMBAR JAWABAN PERTANYAAN TERTULIS PILIHAN GANDA</h2>
        <br />
        <IdentitasTable skema={skema}  />
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
            {soalList.length === 0 ? (
              <tr><td colSpan={4} style={{ ...td, textAlign: 'center', padding: '20px' }}>Belum ada soal</td></tr>
            ) : soalList.map((soal) => (
              <tr key={soal.id}>
                <td style={{ ...td, textAlign: 'center' }}>{soal.no}</td>
                <td style={td}><span style={{ color: '#999', fontStyle: 'italic' }}>Belum dijawab</span></td>
                <td style={{ ...td, textAlign: 'center' }}><CustomCheckbox checked={false} onChange={() => {}} disabled /></td>
                <td style={{ ...td, textAlign: 'center' }}><CustomCheckbox checked={false} onChange={() => {}} disabled /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <br />

        <table width="100%" cellPadding="5" style={{ borderCollapse: 'collapse', border: '1px solid #000', background: '#fff' }}>
          <tr style={{ fontWeight: 'bold', textAlign: 'center', background: '#c40000', color: '#fff' }}>
            <td colSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>
              Rekapitulasi Skor Penilaian Pertanyaan IA.05 <span style={{ fontWeight: 'normal' }}><br/>(Penilaian = Jumlah skor seluruh butir soal)</span>
            </td>
          </tr>
          <tr style={{ textAlign: 'center' }}>
            <td style={{ fontWeight: 'bold', border: '1px solid #000', padding: '6px', width: '50%' }}>Total Skor Penilaian</td>
            <td style={{ fontWeight: 'bold', height: '50px', border: '1px solid #000', padding: '6px', fontSize: '18px', width: '50%' }}>0</td>
          </tr>
        </table>
        <br /><br />

        <TTDAsesi />
        <br /><br />
      </>
    )
  }

  // ===================== IA.06 =====================
  function renderIa06() {
    return (
      <>
        <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '1px', color: '#4F81BD', marginBottom: '16px' }}>
          FR.IA.06C. LEMBAR JAWABAN PERTANYAAN TERTULIS ESAI
        </div>

        <IdentitasTable skema={skema}  />
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

        <h2 style={{ fontSize: '14px', fontWeight: 'bold' }}>PENYUSUN DAN VALIDATOR</h2>
        <PenyusunValidatorTable />
        <br /><br /><br />

        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#4F81BD' }}>FR.IA.06C. LEMBAR JAWABAN PERTANYAAN TERTULIS ESAI</h2>
        <IdentitasTable skema={skema}  />
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
            {soalList.length === 0 ? (
              <tr><td colSpan={7} style={{ ...td, textAlign: 'center', padding: '20px' }}>Belum ada soal</td></tr>
            ) : soalList.map((soal, idx) => (
              <tr key={soal.id}>
                <Td style={{ textAlign: 'center', backgroundColor: '#d58a94', width: '15%' }}>{soal.unit_kode || idx + 1}</Td>
                <Td style={{ width: '5%', textAlign: 'center', backgroundColor: '#d58a94' }}>{idx + 1}</Td>
                <td style={{ ...td, textAlign: 'left' }}>
                  <textarea disabled
                    style={{ width: '100%', border: '1px solid #000', padding: '4px', marginTop: '4px', minHeight: '60px', fontSize: '11pt', background: '#e9e9e9', resize: 'none', overflow: 'hidden' }}
                    placeholder="Tulis jawaban Anda di sini..."
                  />
                </td>
                {[0, 1, 2, 3].map(n => (
                  <td key={n} style={{ ...td, textAlign: 'center', verticalAlign: 'middle' }}>
                    <CustomCheckbox checked={false} onChange={() => {}} disabled />
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
              <Td style={{ textAlign: 'center', width: '50%', fontSize: '14pt' }}>0</Td>
            </tr>
          </tbody>
        </table>
        <br /><br />

        <TTDAsesi />
        <br /><br />
      </>
    )
  }
}
