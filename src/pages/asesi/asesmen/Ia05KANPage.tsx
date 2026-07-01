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
import { CustomRadio } from "@/components/ui/Radio"
import { CustomCheckbox } from "@/components/ui/Checkbox"
import { FullPageLoader } from "@/components/ui/loading-spinner"
import { ActionButton } from "@/components/ui/ActionButton"
import { WebcamModal } from "@/components/ui/WebcamModal"
import { useToast } from "@/contexts/ToastContext"
import { extractErrorMessage, extractApiError } from "@/lib/error-utils"
import { API_BASE_URL } from "@/config/api"

interface SoalKAN {
  id: number; no: string; soal: string
  jawab_a: string; jawab_b: string; jawab_c: string; jawab_d: string
  kunci_jawaban: string; jawaban_asesi: string | null; skor?: number
  unit_kode: string; kuk_kode: string | null
}

const td = { border: '0.2px solid black', padding: '4px 6px' }
const hdDok = { backgroundColor: '#c40000', color: '#fff' }
const hdDokB = { backgroundColor: '#d58a94', color: '#000' }
const panduanTitle = { backgroundColor: '#c00000', color: '#fff', fontWeight: 'bold' as const, padding: '4px 8px', fontSize: '11pt' }

const formatter = new Intl.DateTimeFormat('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })

export default function Ia05KANPage() {
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
  const currentStep = getStepNumberFromHref(asesmenSteps, '/asesi/asesmen/ia05')

  const { showAwalModal, submitAbsenAwal, handleAwalModalClose } = useAbsenCheck({
    phase: 'asesmen', role: 'auto', checkOnMount: true, idIzin: id, asesorList
  })

  const [dokumen, setDokumen] = useState<{ id: number; nama_dokumen: string } | null>(null)
  const [soalList, setSoalList] = useState<SoalKAN[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({})
  const [umpanBalik, setUmpanBalik] = useState("")
  const [barcodes, setBarcodes] = useState<any>(null)

  const fetchData = useCallback(async () => {
    if (!id) return
    try {
      const token = localStorage.getItem("access_token")
      const res = await fetch(`${API_BASE_URL}/asesmen/${id}/ia05?version=kan`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const body = await res.json()
        const d = body.data
        setDokumen(d.dokumen || null)
        setSoalList(d.soal_list || [])
        if (d.barcodes) setBarcodes(d.barcodes)
        const a: Record<number, 'A'|'B'|'C'|'D'> = {}
        ;(d.soal_list || []).forEach((s: SoalKAN) => { if (s.jawaban_asesi) a[s.id] = s.jawaban_asesi as 'A'|'B'|'C'|'D' })
        setAnswers(a)
        if (d.umpan_balik) setUmpanBalik(d.umpan_balik)
      }
    } catch (e) { console.error("Error fetching IA.05 KAN:", e)
    } finally { setIsLoading(false) }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const jumlahSoal = soalList.length || 0
  const jumlahBenar = useMemo(() =>
    soalList.filter(s => answers[s.id] === s.kunci_jawaban).length || 0,
    [soalList, answers])
  const jumlahSalah = jumlahSoal - jumlahBenar

  const handleAnswerChange = (soalId: number, answer: 'A' | 'B' | 'C' | 'D') =>
    setAnswers(prev => ({ ...prev, [soalId]: answer }))

  const handleSubmit = async () => {
    if (!id || !dokumen) return
    setIsSaving(true)
    try {
      const token = localStorage.getItem("access_token")
      const answersPayload = soalList.map(s => ({
        soal_id: s.id,
        jawaban: answers[s.id] || '',
        skor: answers[s.id] === s.kunci_jawaban ? 1 : 0,
      }))
      const payload: any = { dokumen_id: dokumen.id, answers: answersPayload }
      if (isAsesor) payload.umpan_balik = umpanBalik

      const res = await fetch(`${API_BASE_URL}/asesmen/${id}/ia05?version=kan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const msg = await extractApiError(res, 'Gagal menyimpan IA.05')
        showError(msg); setIsSaving(false); return
      }

      if (jadwalId) {
        await fetch(`${API_BASE_URL}/qr/${id}/ia05?version=kan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id_jadwal: jadwalId }),
        })
      }

      showSuccess('IA.05 berhasil disimpan!')
      const next = asesmenSteps[asesmenSteps.findIndex(s => s.href.includes('ia05')) + 1]
      const path = next ? next.href.replace("/asesi/asesmen/", `/asesi/asesmen/${id}/`) : `/asesi/asesmen/${id}/selesai`
      navigate(path)
    } catch (e) {
      showError(extractErrorMessage(e, 'Gagal menyimpan data'))
    } finally { setIsSaving(false) }
  }

  if (isLoading) return <FullPageLoader text="Memuat IA.05..." />

  const fontS = { fontFamily: '"Arial Narrow", Calibri, Candara, Segoe, Segoe UI, Optima, Arial, sans-serif', fontSize: '12pt' }

  return (
    <ModularAsesiLayout currentStep={currentStep} steps={asesmenSteps} id={id} metode={metode}>
      <AsesmenBreadcrumb currentPage="IA.05" />

      <div style={{ ...fontS, maxWidth: '1000px', margin: '0 auto' }}>
        {/* ==================== TITLE ==================== */}
        <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '1px', color: '#4F81BD', marginBottom: '16px' }}>
          FR.IA.05. PERTANYAAN TERTULIS PILIHAN GANDA
        </div>

        {/* ==================== IDENTITAS ==================== */}
        <IdentitasTable jabatanKerja={jabatanKerja} nomorSkema={nomorSkema} tuk={tuk} asesorList={asesorList} namaAsesi={namaAsesi || user?.name || '-'} />
        <p style={{ fontSize: '12px', margin: '4px 0' }}>*Coret yang tidak perlu</p>

        {/* ==================== PANDUAN ASESOR ==================== */}
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

        {/* ==================== PANDUAN ASESI ==================== */}
        <Panduan title="PANDUAN BAGI ASESI">
          <b>Instruksi:</b>
          <ul style={{ margin: '4px 0 4px 18px', paddingLeft: '18px', listStyleType: 'disc' }}>
            <li style={{ marginBottom: '4px' }}>Pertanyaan pilihan ganda merupakan jenis bukti tambahan untuk mendukung bukti-bukti yang sudah ada.</li>
            <li style={{ marginBottom: '4px' }}>Baca dengan teliti dan cermat pertanyaan Pilihan Ganda pada lembar soal.</li>
            <li style={{ marginBottom: '0' }}>Tuliskan jawaban Anda pada Lembar Jawaban Pertanyaan Pilihan Ganda.</li>
          </ul>
        </Panduan>

        {/* ==================== SOAL ==================== */}
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
            {soalList.flatMap((soal) => {
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
                    <CustomRadio name={`soal-${soal.id}`} value={key} checked={answers[soal.id] === key} onChange={() => handleAnswerChange(soal.id, key)} disabled={!isAsesi} />
                  </Td>
                  <Td>
                    &nbsp; {key.toLowerCase()}. {label}
                  </Td>
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

        {/* ==================== PENYUSUN DAN VALIDATOR ==================== */}
        <h2 style={{ fontSize: '14px', fontWeight: 'bold' }}>PENYUSUN DAN VALIDATOR</h2>
        <PenyusunValidatorTable />
        <br /><br /><br />
        {/* ==================== FR.05.C LEMBAR JAWABAN ==================== */}
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#4F81BD' }}>FR.05.C. LEMBAR JAWABAN PERTANYAAN TERTULIS PILIHAN GANDA</h2>
        <br />
        <IdentitasTable jabatanKerja={jabatanKerja} nomorSkema={nomorSkema} tuk={tuk} asesorList={asesorList} namaAsesi={namaAsesi || user?.name || '-'} />
        <p style={{ fontSize: '12px', margin: '4px 0' }}>*Coret yang tidak perlu</p>

        {/* ==================== LEMBAR JAWABAN TABLE ==================== */}
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
            {soalList.map((soal) => {
              const isCorrect = answers[soal.id] === soal.kunci_jawaban
              const hasAnswer = !!answers[soal.id]
              return (
                <tr key={soal.id}>
                  <td style={{ ...td, textAlign: 'center' }}>{soal.no}</td>
                  <td style={td}>
                    {answers[soal.id] ? (
                      <>{answers[soal.id]} - {soal[`jawab_${answers[soal.id]!.toLowerCase()}` as keyof SoalKAN] || ''}</>
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

        {/* ==================== REKAPITULASI ==================== */}
        <table style={{ width: '100%', border: '1px solid #000', borderCollapse: 'collapse', textAlign: 'center' }}>
          <tbody>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#c40000', color: '#fff' }}>
              <td colSpan={2} style={{ ...td, textAlign: 'center' }}>Rekapitulasi Penilaian Pertanyaan Pilihan Ganda</td>
            </tr>
            <tr>
              <td style={{ ...td, fontWeight: 'bold', backgroundColor: '#c40000', color: '#fff' }}>Benar</td>
              <td style={{ ...td, fontWeight: 'bold', backgroundColor: '#c40000', color: '#fff' }}>Salah</td>
            </tr>
            <tr>
              <td style={{ ...td, textAlign: 'center', fontSize: '14pt' }}>{jumlahBenar}</td>
              <td style={{ ...td, textAlign: 'center', fontSize: '14pt' }}>{jumlahSalah}</td>
            </tr>
          </tbody>
        </table>
        <br /><br />

        {/* ==================== UMPAN BALIK + TTD ASESI ==================== */}
        <table style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '100%' }} cellPadding="5" cellSpacing="0">
          <tbody>
            <tr>
              <td style={{ fontWeight: 'bold', width: '20%', ...td }}>Umpan balik untuk asesi:</td>
              <td style={{ width: '5%', ...td }}>:</td>
              <td style={td}>
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
              </td>
            </tr>
            <tr style={{ fontWeight: 'bold' }}>
              <td colSpan={3} style={td}>Asesi :</td>
            </tr>
            <tr>
              <td style={{ width: '20%', ...td }}>Nama</td>
              <td style={{ width: '5%', ...td }}>:</td>
              <td style={td}>{namaAsesi || user?.name || '-'}</td>
            </tr>
            <tr>
              <td style={td}>Tanda tangan/ Tanggal</td>
              <td style={{ ...td, textAlign: 'center' }}>:</td>
              <td style={{ ...td, height: '70px', verticalAlign: 'middle', textAlign: 'center' }}>
                {((barcodes as any)?.['asesi']?.url) ? (
                  <>
                    <img src={(barcodes as any)['asesi'].url} style={{ height: '50px', width: '50px', objectFit: 'contain' }} alt="barcode" /><br />
                    <span style={{ fontSize: '11px' }}>
                      {(barcodes as any)['asesi'].tanggal ? new Date((barcodes as any)['asesi'].tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                    </span>
                  </>
                ) : (
                  <span style={{ color: '#999' }}>Belum ditandatangani</span>
                )}
              </td>
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

        {/* ==================== BUTTONS ==================== */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 0' }}>
          <ActionButton variant="primary" onClick={handleSubmit}>
            {isSaving ? "Menyimpan..." : "Simpan & Lanjutkan"}
          </ActionButton>
        </div>
      </div>

      <WebcamModal isOpen={showAwalModal} onClose={handleAwalModalClose} onSubmit={submitAbsenAwal}
        title="Absen Masuk Asesmen" description="Silakan ambil foto wajah Anda untuk absen masuk" canClose={false} />
    </ModularAsesiLayout>
  )
}

/* --------------- Sub Components --------------- */

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
