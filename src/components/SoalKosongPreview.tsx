import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/config/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Eye } from "lucide-react"

type DocType = "ia04b" | "ia05" | "ia06"

interface SoalKosongPreviewProps {
  jabkerId: string
}

interface DokumenInfo {
  id: number
  kode: string
  nama_dokumen: string
}

interface SoalItem {
  id: number
  no: number
  soal: string
  soal1?: string | null
  tipe: number
  jawab_a?: string | null
  jawab_b?: string | null
  jawab_c?: string | null
  jawab_d?: string | null
}

interface ApiResponse {
  message: string
  data: {
    tuk: string
    skema: string
    dokumen: DokumenInfo
    soal_list: SoalItem[]
  }
}

const tdStyle: React.CSSProperties = { border: '0.2px solid black', padding: '4px 6px', fontSize: '11pt' }
const hdRed: React.CSSProperties = { backgroundColor: '#c40000', color: '#fff', fontWeight: 'bold', textAlign: 'center' }
const hdPink: React.CSSProperties = { backgroundColor: '#d58a94', color: '#000', fontWeight: 'bold', textAlign: 'center' }
const panduanTitle: React.CSSProperties = { backgroundColor: '#c00000', color: '#fff', fontWeight: 'bold', padding: '4px 8px', fontSize: '11pt' }
const baseFont: React.CSSProperties = { fontFamily: '"Arial Narrow", Calibri, Candara, Segoe, Segoe UI, Optima, Arial, sans-serif', fontSize: '12pt' }

function Td({ children, style, colSpan, rowSpan }: { children?: React.ReactNode; style?: React.CSSProperties; colSpan?: number; rowSpan?: number }) {
  return <td colSpan={colSpan} rowSpan={rowSpan} style={{ ...tdStyle, ...style }}>{children}</td>
}

const TAB_META: Record<DocType, { label: string; fullLabel: string }> = {
  ia04b: { label: "FR.IA.04.B", fullLabel: "LEMBAR PERIKSA KEGIATAN TERSTRUKTUR" },
  ia05: { label: "FR.IA.05", fullLabel: "PERTANYAAN TERTULIS PILIHAN GANDA" },
  ia06: { label: "FR.IA.06", fullLabel: "PERTANYAAN TERTULIS ESAI" },
}

/* ==================== IA04b Preview ==================== */
function Ia04bPreview({ skema, tuk, soalList }: { skema: string; tuk: string; soalList: SoalItem[] }) {
  return (
    <div style={{ ...baseFont, maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '1px', color: '#4F81BD', marginBottom: '16px' }}>
        FR.IA.04.B LEMBAR PERIKSA KEGIATAN TERSTRUKTUR
      </div>

      {/* Identitas */}
      <table width="100%" cellPadding="5" style={{ borderCollapse: 'collapse', border: '2px solid #000', background: '#fff' }}>
        <tbody>
          <tr>
            <td rowSpan={2} style={{ width: '30%', verticalAlign: 'top', border: '1px solid #000', padding: '6px' }}>Skema Sertifikasi (KKNI/Okupasi/Klaster)</td>
            <td style={{ width: '12%', border: '1px solid #000', padding: '6px' }}>Judul</td>
            <td style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{skema || '-'}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '6px' }}>Nomor</td>
            <td style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>-</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '6px' }}>TUK</td>
            <td style={{ border: '1px solid #000', padding: '6px' }}>:</td>
            <td style={{ border: '1px solid #000', padding: '6px', textTransform: 'uppercase' }}>{tuk || '-'}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: '12px' }}>*Coret yang tidak perlu</p>

      {/* Panduan Asesor */}
      <table width="100%" cellPadding="5" style={{ borderCollapse: 'collapse', border: '1px solid #000', background: '#fff' }}>
        <tbody>
          <tr><td style={{ fontWeight: 'bold', background: '#c40000', color: '#fff', border: '1px solid #000' }}>PANDUAN BAGI ASESOR</td></tr>
          <tr><td style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>
            <ul style={{ margin: '4px 0 4px 18px', paddingLeft: '18px', listStyleType: 'disc' }}>
              <li style={{ marginBottom: '4px' }}>Lakukan penilaian pencapaian hasil proyek singkat atau kegiatan terstruktur lainnya melalui presentasi.</li>
              <li style={{ marginBottom: '4px' }}>Penilaian dapat dilakukan untuk keseluruhan unit kompetensi dalam skema sertifikasi atau dapat pula dilakukan untuk masing-masing kelompok pekerjaan.</li>
              <li style={{ marginBottom: '4px' }}>Pertanyaan disampaikan oleh asesor pada saat asesi melakukan presentasi kegiatan terstruktur.</li>
              <li style={{ marginBottom: '4px' }}>Asesor menilai jawaban peserta uji berdasarkan jawaban yang diberikan. Penilaian dilakukan dengan memberikan tanda centang (✓) pada salah satu kolom skor penilaian 0, 1, 2, atau 3 sesuai dengan tingkat kesesuaian dan kelengkapan jawaban peserta, dengan ketentuan sebagai berikut:
                <br />0 = Jawaban tidak sesuai, keliru, atau tidak menjawab
                <br />1 = Jawaban sebagian benar, namun tidak lengkap/kurang tepat.
                <br />2 = Jawaban benar dan sesuai, namun belum sepenuhnya lengkap.
                <br />3 = Jawaban lengkap, tepat, runtut dan sesuai konteks
              </li>
              <li style={{ marginBottom: '4px' }}>Dibutuhkan jastifikasi profesional asesor untuk memutuskan hal ini.</li>
              <li style={{ marginBottom: '4px' }}>Seluruh hasil penilaian dijumlahkan dan dicatat pada kolom Rekapitulasi Skor Penilaian Pertanyaan Lisan.</li>
              <li style={{ marginBottom: '0' }}>Durasi presentasi yaitu 15 menit dan tanya jawab 15 menit.</li>
            </ul>
          </td></tr>
        </tbody>
      </table>
      <br />

      {/* Soal Table */}
      <table width="100%" cellPadding="5" style={{ borderCollapse: 'collapse', border: '1px solid #000', background: '#fff' }}>
        <thead>
          <tr style={{ fontWeight: 'bold', textAlign: 'center', background: '#c40000', color: '#fff' }}>
            <td rowSpan={2} style={{ width: '5%', border: '1px solid #000', padding: '6px' }}>No</td>
            <td colSpan={3} style={{ width: '14%', border: '1px solid #000', padding: '6px' }}>Aspek Penilaian</td>
            <td colSpan={4} style={{ width: '14%', border: '1px solid #000', padding: '6px' }}>Pencapaian</td>
          </tr>
          <tr style={{ fontWeight: 'bold', textAlign: 'center', background: '#c40000', color: '#fff' }}>
            <td style={{ width: '30%', border: '1px solid #000', padding: '6px' }}>Lingkup Penyajian Proyek atau Kegiatan Terstruktur Lainnya</td>
            <td style={{ width: '25%', border: '1px solid #000', padding: '6px' }}>Daftar Pertanyaan</td>
            <td style={{ width: '25%', border: '1px solid #000', padding: '6px' }}>Kesesuaian dengan standar kompetensi kerja</td>
            <td style={{ width: '3%', border: '1px solid #000', padding: '6px' }}>0</td>
            <td style={{ width: '3%', border: '1px solid #000', padding: '6px' }}>1</td>
            <td style={{ width: '3%', border: '1px solid #000', padding: '6px' }}>2</td>
            <td style={{ width: '3%', border: '1px solid #000', padding: '6px' }}>3</td>
          </tr>
        </thead>
        <tbody>
          {soalList.length === 0 ? (
            <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', padding: '20px' }}>Belum ada soal</td></tr>
          ) : soalList.map((soal, idx) => (
            <tr key={soal.id}>
              <td style={{ textAlign: 'center', verticalAlign: 'top', border: '1px solid #000', padding: '6px' }}>{soal.no || idx + 1}</td>
              <td style={{ verticalAlign: 'top', border: '1px solid #000', padding: '6px' }}>{soal.soal1 || ''}</td>
              <td style={{ verticalAlign: 'top', border: '1px solid #000', padding: '6px' }}>{soal.soal}</td>
              <td style={{ verticalAlign: 'top', border: '1px solid #000', padding: '6px' }}>Kode Unit : </td>
              {[0, 1, 2, 3].map(n => (
                <td key={n} style={{ textAlign: 'center', verticalAlign: 'middle', border: '1px solid #000', padding: '6px' }}></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <br />

      {/* Penyusun dan Validator */}
      <h2 style={{ fontSize: '14px', fontWeight: 'bold' }}>PENYUSUN DAN VALIDATOR</h2>
      <table width="100%" cellPadding="5" style={{ borderCollapse: 'collapse', border: '1px solid #000', background: '#fff' }}>
        <tbody>
          <tr style={{ fontWeight: 'bold', textAlign: 'center' }}>
            <td style={{ width: '15%', border: '1px solid #000', padding: '6px' }}>Status</td>
            <td style={{ width: '8%', border: '1px solid #000', padding: '6px' }}>No</td>
            <td style={{ border: '1px solid #000', padding: '6px' }}>Nama</td>
            <td style={{ width: '20%', border: '1px solid #000', padding: '6px' }}>Nomor MET</td>
            <td style={{ width: '20%', border: '1px solid #000', padding: '6px' }}>Tanda Tangan Dan Tanggal</td>
          </tr>
          <tr style={{ fontWeight: 'bold' }}>
            <td rowSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>Penyusun</td>
            <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px' }}>1</td>
            <td style={{ border: '1px solid #000', padding: '6px' }}></td>
            <td style={{ border: '1px solid #000', padding: '6px' }}></td>
            <td style={{ height: '50px', border: '1px solid #000', padding: '6px' }}></td>
          </tr>
          <tr>
            <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px' }}>2</td>
            <td style={{ border: '1px solid #000', padding: '6px' }}></td>
            <td style={{ border: '1px solid #000', padding: '6px' }}></td>
            <td style={{ height: '50px', border: '1px solid #000', padding: '6px' }}></td>
          </tr>
          <tr style={{ fontWeight: 'bold' }}>
            <td rowSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>Validator</td>
            <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px' }}>1</td>
            <td style={{ border: '1px solid #000', padding: '6px' }}></td>
            <td style={{ border: '1px solid #000', padding: '6px' }}></td>
            <td style={{ height: '50px', border: '1px solid #000', padding: '6px' }}></td>
          </tr>
          <tr>
            <td style={{ textAlign: 'center', border: '1px solid #000', padding: '6px' }}>2</td>
            <td style={{ border: '1px solid #000', padding: '6px' }}></td>
            <td style={{ border: '1px solid #000', padding: '6px' }}></td>
            <td style={{ height: '50px', border: '1px solid #000', padding: '6px' }}></td>
          </tr>
        </tbody>
      </table>
      <br />

      {/* Rekapitulasi */}
      <table width="100%" cellPadding="5" style={{ borderCollapse: 'collapse', border: '1px solid #000', background: '#fff' }}>
        <tbody>
          <tr style={{ fontWeight: 'bold', textAlign: 'center', background: '#c40000', color: '#fff' }}>
            <td colSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>
              Rekapitulasi Skor Penilaian Pertanyaan IA04B
              <span style={{ fontWeight: 'normal' }}><br />(Penilaian = Jumlah skor seluruh butir soal)</span>
            </td>
          </tr>
          <tr style={{ textAlign: 'center' }}>
            <td style={{ fontWeight: 'bold', border: '1px solid #000', padding: '6px' }}>Total Skor Penilaian</td>
            <td style={{ fontWeight: 'bold', height: '50px', border: '1px solid #000', padding: '6px', fontSize: '18px' }}></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

/* ==================== IA05 Preview ==================== */
function Ia05Preview({ skema, tuk, soalList }: { skema: string; tuk: string; soalList: SoalItem[] }) {
  return (
    <div style={{ ...baseFont, maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '1px', color: '#4F81BD', marginBottom: '16px' }}>
        FR.IA.05. PERTANYAAN TERTULIS PILIHAN GANDA
      </div>

      {/* Identitas */}
      <IdentitasTable skema={skema} tuk={tuk} />
      <p style={{ fontSize: '12px', margin: '4px 0' }}>*Coret yang tidak perlu</p>

      {/* Panduan Asesor */}
      <Panduan title="PANDUAN BAGI ASESOR">
        <b>Instruksi:</b>
        <ul style={{ margin: '4px 0 4px 18px', paddingLeft: '18px', listStyleType: 'disc' }}>
          <li style={{ marginBottom: '4px' }}>Pertanyaan pilihan ganda merupakan jenis bukti tambahan untuk mendukung bukti-bukti yang sudah ada.</li>
          <li style={{ marginBottom: '4px' }}>Asesor menilai jawaban peserta uji berdasarkan jawaban yang diberikan. Penilaian dapat diisi dengan centang (✓) pada kolom jawaban benar atau jawaban salah, dengan ketentuan skor penilaian sebagai berikut:
            <br />0 = Jawaban Salah
            <br />1 = Jawaban Benar
          </li>
          <li style={{ marginBottom: '4px' }}>Dibutuhkan justifikasi profesional asesor untuk memutuskan hal ini.</li>
        </ul>
      </Panduan>

      {/* Panduan Asesi */}
      <Panduan title="PANDUAN BAGI ASESI">
        <b>Instruksi:</b>
        <ul style={{ margin: '4px 0 4px 18px', paddingLeft: '18px', listStyleType: 'disc' }}>
          <li style={{ marginBottom: '4px' }}>Pertanyaan pilihan ganda merupakan jenis bukti tambahan untuk mendukung bukti-bukti yang sudah ada.</li>
          <li style={{ marginBottom: '4px' }}>Baca dengan teliti dan cermat pertanyaan Pilihan Ganda pada lembar soal.</li>
          <li style={{ marginBottom: '0' }}>Tuliskan jawaban Anda pada Lembar Jawaban Pertanyaan Pilihan Ganda.</li>
        </ul>
      </Panduan>

      {/* Soal Table */}
      <table style={{ border: '2px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
        <thead>
          <tr>
            <Td style={{ textAlign: 'center', fontWeight: 'bold', width: '100px', color: '#fff', backgroundColor: '#c00000' }}>KUK</Td>
            <Td colSpan={2} style={{ fontWeight: 'bold', color: '#fff', backgroundColor: '#c00000' }}>SOAL, Pilih Jawaban semua pertanyaan berikut (A / B / C / D) :</Td>
          </tr>
        </thead>
        <tbody>
          {soalList.length === 0 ? (
            <tr><td colSpan={3} style={{ ...tdStyle, textAlign: 'center', padding: '20px' }}>Belum ada soal</td></tr>
          ) : soalList.flatMap((soal) => {
            const optionRows = [
              { key: 'A', label: soal.jawab_a },
              { key: 'B', label: soal.jawab_b },
              { key: 'C', label: soal.jawab_c },
              { key: 'D', label: soal.jawab_d },
            ].filter(o => o.label).map(({ key, label }) => (
              <tr key={`${soal.id}-${key}`}>
                <Td></Td>
                <Td style={{ textAlign: 'center' }}></Td>
                <Td>&nbsp; {key.toLowerCase()}. {label || '-'}</Td>
              </tr>
            ))
            return [
              <tr key={soal.id}>
                <Td style={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#d58a94' }}></Td>
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

      {/* Penyusun dan Validator */}
      <h2 style={{ fontSize: '14px', fontWeight: 'bold' }}>PENYUSUN DAN VALIDATOR</h2>
      <PenyusunValidatorTable />
      <br /><br /><br />

      {/* FR.05.C Lembar Jawaban */}
      <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#4F81BD' }}>FR.05.C. LEMBAR JAWABAN PERTANYAAN TERTULIS PILIHAN GANDA</h2>
      <br />
      <IdentitasTable skema={skema} tuk={tuk} />
      <p style={{ fontSize: '12px', margin: '4px 0' }}>*Coret yang tidak perlu</p>

      {/* Lembar Jawaban Table */}
      <table style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
        <tbody>
          <tr style={{ ...hdRed }}>
            <td colSpan={2} style={tdStyle}>Lembar Jawaban</td>
            <td colSpan={2} style={tdStyle}>Rekomendasi</td>
          </tr>
          <tr style={{ ...hdPink }}>
            <td style={{ ...tdStyle, width: '10%' }}>No</td>
            <td style={{ ...tdStyle, width: '40%' }}>Jawaban</td>
            <td style={{ ...tdStyle, width: '25%' }}>Benar</td>
            <td style={{ ...tdStyle, width: '25%' }}>Salah</td>
          </tr>
          {soalList.length === 0 ? (
            <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', padding: '20px' }}>Belum ada soal</td></tr>
          ) : soalList.map((soal) => (
            <tr key={soal.id}>
              <td style={{ ...tdStyle, textAlign: 'center' }}>{soal.no}</td>
              <td style={tdStyle}><span style={{ color: '#999', fontStyle: 'italic' }}>Belum dijawab</span></td>
              <td style={{ ...tdStyle, textAlign: 'center' }}></td>
              <td style={{ ...tdStyle, textAlign: 'center' }}></td>
            </tr>
          ))}
        </tbody>
      </table>
      <br />

      {/* Rekapitulasi */}
      <table width="100%" cellPadding="5" style={{ borderCollapse: 'collapse', border: '1px solid #000', background: '#fff' }}>
        <tbody>
          <tr style={{ fontWeight: 'bold', textAlign: 'center', background: '#c40000', color: '#fff' }}>
            <td colSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>
              Rekapitulasi Skor Penilaian Pertanyaan IA05
              <span style={{ fontWeight: 'normal' }}><br />(Penilaian = Jumlah skor seluruh butir soal)</span>
            </td>
          </tr>
          <tr style={{ textAlign: 'center' }}>
            <td style={{ fontWeight: 'bold', border: '1px solid #000', padding: '6px' }}>Total Skor Penilaian</td>
            <td style={{ fontWeight: 'bold', height: '50px', border: '1px solid #000', padding: '6px', fontSize: '18px' }}></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

/* ==================== IA06 Preview ==================== */
function Ia06Preview({ skema, tuk, soalList }: { skema: string; tuk: string; soalList: SoalItem[] }) {
  return (
    <div style={{ ...baseFont, maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '1px', color: '#4F81BD', marginBottom: '16px' }}>
        FR.IA.06. PERTANYAAN TERTULIS ESAI
      </div>

      {/* Identitas */}
      <IdentitasTable skema={skema} tuk={tuk} />
      <p style={{ fontSize: '12px', margin: '4px 0' }}>*Coret yang tidak perlu</p>

      {/* Panduan Asesor */}
      <Panduan title="PANDUAN BAGI ASESOR">
        <b>Instruksi:</b>
        <ul style={{ margin: '4px 0 4px 18px', paddingLeft: '18px', listStyleType: 'disc' }}>
          <li style={{ marginBottom: '4px' }}>Pertanyaan esai merupakan jenis bukti tambahan untuk mendukung bukti-bukti yang sudah ada.</li>
          <li style={{ marginBottom: '4px' }}>Asesor menilai jawaban peserta uji berdasarkan jawaban yang diberikan. Penilaian dilakukan dengan memberikan tanda centang (✓) pada salah satu kolom skor penilaian 0, 1, 2, atau 3 sesuai dengan tingkat kesesuaian dan kelengkapan jawaban peserta, dengan ketentuan sebagai berikut:
            <br />0 = Jawaban tidak sesuai, keliru atau tidak menjawab.
            <br />1 = Jawaban sebagian benar, namun tidak lengkap/ kurang tepat.
            <br />2 = Jawaban benar dan sesuai, namun belum sepenuhnya lengkap.
            <br />3 = Jawaban lengkap, tepat, runtut dan sesuai konteks.
          </li>
          <li style={{ marginBottom: '4px' }}>Dibutuhkan jastifikasi profesional asesor untuk memutuskan hal ini.</li>
          <li style={{ marginBottom: '0' }}>Seluruh hasil penilaian di jumlahkan dan di catat pada kolom Rekapitulasi Skor Penilaian Pertanyaan Esai.</li>
        </ul>
      </Panduan>

      {/* Panduan Asesi */}
      <Panduan title="PANDUAN BAGI ASESI">
        <b>Instruksi:</b>
        <ul style={{ margin: '4px 0 4px 18px', paddingLeft: '18px', listStyleType: 'disc' }}>
          <li style={{ marginBottom: '4px' }}>Pertanyaan esai merupakan jenis bukti tambahan untuk mendukung bukti-bukti yang sudah ada.</li>
          <li style={{ marginBottom: '4px' }}>Baca dengan teliti dan cermat pertanyaan esai pada lembar soal.</li>
          <li style={{ marginBottom: '0' }}>Tuliskan jawaban Anda pada Lembar Jawaban Pertanyaan Tertulis Esai.</li>
        </ul>
      </Panduan>

      {/* Soal Table */}
      <table style={{ border: '2px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
        <tbody>
          <tr>
            <Td style={{ ...panduanTitle, width: '100px', textAlign: 'center' }}>KUK</Td>
            <Td colSpan={2} style={{ ...panduanTitle, textAlign: 'center' }}>SOAL ESAI</Td>
          </tr>
          {soalList.length === 0 ? (
            <tr><td colSpan={3} style={{ ...tdStyle, textAlign: 'center', padding: '20px' }}>Belum ada soal esai.</td></tr>
          ) : soalList.map((soal, idx) => (
            <tr key={soal.id}>
              <Td style={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#d58a94' }}></Td>
              <Td style={{ width: '40px', textAlign: 'center' }}>{idx + 1}.</Td>
              <Td>{soal.soal}</Td>
            </tr>
          ))}
        </tbody>
      </table>
      <br />

      {/* Penyusun dan Validator */}
      <h2 style={{ fontSize: '14px', fontWeight: 'bold' }}>PENYUSUN DAN VALIDATOR</h2>
      <PenyusunValidatorTable />
      <br /><br /><br />

      {/* FR.IA.06C Lembar Jawaban */}
      <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#4F81BD' }}>FR.IA.06C. LEMBAR JAWABAN PERTANYAAN TERTULIS ESAI</h2>
      <IdentitasTable skema={skema} tuk={tuk} />
      <p style={{ fontSize: '12px', margin: '4px 0' }}>*Coret yang tidak perlu</p>

      {/* Lembar Jawaban Table */}
      <table style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
        <tbody>
          <tr style={{ ...hdRed, fontWeight: 'bold', textAlign: 'center' }}>
            <Td rowSpan={2}>No</Td>
            <Td rowSpan={2} colSpan={2}>JAWABAN SOAL ESAI</Td>
            <Td colSpan={4}>Skor Penilaian</Td>
          </tr>
          <tr style={{ ...hdRed, fontWeight: 'bold', textAlign: 'center' }}>
            <Td style={{ width: '5%' }}>0</Td>
            <Td style={{ width: '5%' }}>1</Td>
            <Td style={{ width: '5%' }}>2</Td>
            <Td style={{ width: '5%' }}>3</Td>
          </tr>
          {soalList.length === 0 ? (
            <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', padding: '20px' }}>Belum ada soal</td></tr>
          ) : soalList.map((soal, idx) => (
            <tr key={soal.id}>
              <Td style={{ textAlign: 'center', width: '5%' }}>{idx + 1}</Td>
              <Td style={{ width: '5%' }}></Td>
              <td style={tdStyle}></td>
              {[0, 1, 2, 3].map(n => (
                <td key={n} style={{ ...tdStyle, textAlign: 'center', verticalAlign: 'middle' }}></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <br />

      {/* Rekapitulasi */}
      <table style={{ width: '100%', border: '1px solid #000', borderCollapse: 'collapse', textAlign: 'center' }}>
        <tbody>
          <tr style={{ fontWeight: 'bold', backgroundColor: '#c40000', color: '#fff' }}>
            <Td colSpan={2} style={{ textAlign: 'center' }}>
              Rekapitulasi Skor Penilaian Pertanyaan IA06
              <br /><span style={{ fontWeight: 'normal' }}>(Penilaian = Jumlah skor seluruh butir soal)</span>
            </Td>
          </tr>
          <tr>
            <Td style={{ textAlign: 'center', fontWeight: 'bold', width: '50%' }}>Total Skor Penilaian</Td>
            <Td style={{ textAlign: 'center', width: '50%', fontSize: '14pt' }}></Td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

/* ==================== Shared Sub Components ==================== */
function IdentitasTable({ skema, tuk }: { skema: string; tuk: string }) {
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
        <tr>
          <Td>TUK</Td>
          <Td style={{ textAlign: 'center' }}>:</Td>
          <Td colSpan={2} style={{ textTransform: 'uppercase' }}>{tuk || '-'}</Td>
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

/* ==================== Main Export ==================== */
export function SoalKosongPreview({ jabkerId }: SoalKosongPreviewProps) {
  const [activeTab, setActiveTab] = useState<DocType>("ia04b")
  const [data, setData] = useState<Record<DocType, { skema: string; tuk: string; soalList: SoalItem[] }>>({
    ia04b: { skema: "", tuk: "", soalList: [] },
    ia05: { skema: "", tuk: "", soalList: [] },
    ia06: { skema: "", tuk: "", soalList: [] },
  })
  const [loading, setLoading] = useState<Record<DocType, boolean>>({ ia04b: true, ia05: true, ia06: true })
  const [errors, setErrors] = useState<Record<DocType, string>>({ ia04b: "", ia05: "", ia06: "" })

  const token = localStorage.getItem("access_token") || ""

  useEffect(() => {
    ;(["ia04b", "ia05", "ia06"] as DocType[]).forEach((jenis) => fetchSoal(jenis))
  }, [jabkerId])

  const fetchSoal = async (jenis: DocType) => {
    setLoading((prev) => ({ ...prev, [jenis]: true }))
    setErrors((prev) => ({ ...prev, [jenis]: "" }))
    try {
      const res = await fetch(`${API_BASE_URL}/kan/config/soal-kosong/${jabkerId}/${jenis}`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Gagal load (${res.status})`)
      const json: ApiResponse = await res.json()
      setData((prev) => ({
        ...prev,
        [jenis]: {
          skema: json.data?.skema || "",
          tuk: json.data?.tuk || "",
          soalList: json.data?.soal_list || [],
        },
      }))
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [jenis]: err.message || "Gagal fetch" }))
    }
    setLoading((prev) => ({ ...prev, [jenis]: false }))
  }

  const currentData = data[activeTab]
  const currentLoading = loading[activeTab]
  const currentError = errors[activeTab]
  const meta = TAB_META[activeTab]

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg sticky top-0 z-10">
        {(Object.entries(TAB_META) as [DocType, typeof meta][]).map(([key, m]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === key
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Eye className="w-4 h-4" />
            {m.label}
            <Badge variant={activeTab === key ? "default" : "outline"} className="text-xs ml-1">
              {data[key].soalList.length}
            </Badge>
          </button>
        ))}
      </div>

      {/* Content */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="w-4 h-4 text-primary" />
            Preview — {meta.label} {meta.fullLabel}
            <span className="ml-auto text-sm font-normal text-slate-500">{currentData.soalList.length} Soal</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Memuat soal...</span>
            </div>
          ) : currentError ? (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {currentError}
            </div>
          ) : activeTab === "ia04b" ? (
            <div className="overflow-x-auto">
              <Ia04bPreview skema={currentData.skema} tuk={currentData.tuk} soalList={currentData.soalList} />
            </div>
          ) : activeTab === "ia05" ? (
            <div className="overflow-x-auto">
              <Ia05Preview skema={currentData.skema} tuk={currentData.tuk} soalList={currentData.soalList} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Ia06Preview skema={currentData.skema} tuk={currentData.tuk} soalList={currentData.soalList} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
