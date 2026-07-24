import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { API_BASE_URL } from "@/config/api"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, Clock, FileSignature } from "lucide-react"
import { Mapa01Layout, Mapa01Header, Mapa01Section1, Mapa01Section2, Mapa01Section3, Mapa01TandaTangan } from "@/components/mapa01"
import { CustomCheckbox } from "@/components/ui/Checkbox"

// ── Types ──
interface Unit { id_unit: number; nama_unit: string; kode_unit: string }
interface KelompokKerja { id: number; nama: string; urut: string; units: Unit[] }

interface Referensi { id: number; nama: string; value: boolean }
interface Subkategori { id: number|null; nama: string; urut: number|null; referensis: Referensi[] }
interface Kategori { id: number|null; kategori: string|null; nama: string; urut: number|null; id_kelompok: number|null; subkategoris: Subkategori[] }
interface KelompokForm { id: number; nama: string|null; urut: number; kategoris: Kategori[] }
interface ReferensiFormItem { kelompok: KelompokForm }

interface MapaData {
  kelompok_kerja: { id: number; kode: string; nama_dokumen: string; kelompok_kerja: KelompokKerja[] }
  referensi_form: ReferensiFormItem[]
  skkni: string
  jenjang: string
  metode: string
  judul: string
  nomor: string
  penyusun_info: { nama: string|null; noreg: string|null; tanggal: string|null; barcode: string|null } | null
  validator_info: { nama: string|null; noreg: string|null; tanggal: string|null; barcode: string|null } | null
  manajer_info: { nama: string | null; tanggal: string | null; barcode: string | null } | null
}

export default function PenyusunMapaTtd() {
  const { jabkerId, jenis } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem("access_token") || ""

  const docLabel = jenis === "mapa01" ? "MAPA 01" : "MAPA 02"

  const [mapaData, setMapaData] = useState<MapaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!jabkerId) return
    setLoading(true)
    setError("")
    setMapaData(null)
    loadAll()
  }, [jabkerId, jenis])

  const loadAll = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/penyusun/jabker/${jabkerId}/${jenis}/data`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const d = await res.json()
        setMapaData(d.data || null)
      } else {
        setError("Gagal load data dokumen")
      }
    } catch {
      setError("Gagal load data")
    }
    setLoading(false)
  }

  // ── All Signed Section ──
  const renderAllSigned = () => {
    const manajerSigned = !!mapaData?.manajer_info?.barcode
    const penyusunSigned = !!mapaData?.penyusun_info?.barcode
    const validatorSigned = !!mapaData?.validator_info?.barcode
    const signedCount = [manajerSigned, penyusunSigned, validatorSigned].filter(Boolean).length
    const allSigned = manajerSigned && penyusunSigned && validatorSigned

    const signatures = [
      { key: "manajer", label: "Manajer Sertifikasi", signed: manajerSigned, nama: mapaData?.manajer_info?.nama, tanggal: mapaData?.manajer_info?.tanggal },
      { key: "penyusun", label: "Penyusun", signed: penyusunSigned, nama: mapaData?.penyusun_info?.nama, tanggal: mapaData?.penyusun_info?.tanggal },
      { key: "validator", label: "Validator", signed: validatorSigned, nama: mapaData?.validator_info?.nama, tanggal: mapaData?.validator_info?.tanggal },
    ]

    return (
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/60 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileSignature className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Status Tanda Tangan</h3>
              <p className="text-xs text-slate-500">{signedCount} dari 3 telah menandatangani</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${allSigned ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
            {allSigned ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            {allSigned ? "Lengkap" : "Belum Lengkap"}
          </span>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {signatures.map((s) => (
            <div key={s.key} className={`rounded-lg border p-4 transition-colors ${s.signed ? "border-green-200 bg-green-50/40" : "border-slate-200 bg-slate-50/60"}`}>
              <div className="flex items-start justify-between mb-2 gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{s.label}</span>
                {s.signed
                  ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  : <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />}
              </div>
              <p className="text-sm font-semibold text-slate-800 truncate">{s.nama || "—"}</p>
              <p className="text-xs text-slate-500 mt-1">
                {s.signed ? (s.tanggal ? formatDate(s.tanggal) : "Sudah TTD") : "Belum TTD"}
              </p>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          {jenis === "mapa01" ? (
            <>
              <Button variant="outline" onClick={() => navigate(`/manager-mutu/detail-jabker/${jabkerId}`)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Detail Jabker
              </Button>
              <Button onClick={() => navigate(`/manager-mutu/mapa-ttd/mapa02/${jabkerId}`)}>
                Lanjut ke MAPA 02
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate(`/manager-mutu/mapa-ttd/mapa01/${jabkerId}`)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke MAPA 01
              </Button>
              <Button variant="default" onClick={() => navigate(`/manager-mutu/detail-jabker/${jabkerId}`)}>
                Kembali ke Detail Jabker
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  const formatDate = (t: string) => {
    try {
      return new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    } catch { return t }
  }

  // ── MAPA02 inline render ──
  const renderMapa02 = () => {
    const data = mapaData as any
    const kelompokKerja = data?.kelompok_kerja?.kelompok_kerja || []

    // Flatten referensi from API for MAPA02 (flat structure: {kategori, referensis[]})
    const flattenM2Refs = () => {
      const refs: { id: number; nama: string; isdefault: number | null; potensi_asesi_index: number }[] = []
      data?.referensi_form?.forEach((item: any) => {
        // Flat structure: item.kategori + item.referensis[]
        if (item.referensis && Array.isArray(item.referensis)) {
          if (item.kategori === "MAPA02_1") {
            item.referensis.forEach((ref: any) => {
              refs.push({
                id: ref.id,
                nama: ref.nama,
                isdefault: ref.isdefault ?? (ref.value ? 1 : 0),
                potensi_asesi_index: ref.potensi_asesi_index ?? 0,
              })
            })
          }
        }
        // Nested structure (MAPA01-style fallback): item.kelompok.kategoris[].subkategoris[].referensis[]
        else if (item.kelompok?.kategoris) {
          item.kelompok.kategoris.forEach((kat: any) => {
            if (kat.kategori === "MAPA02_1") {
              kat.subkategoris?.forEach((sub: any) => {
                sub.referensis?.forEach((ref: any) => {
                  refs.push({ id: ref.id, nama: ref.nama, isdefault: ref.value ? 1 : 0, potensi_asesi_index: 0 })
                })
              })
            }
          })
        }
      })
      return refs
    }

    const getKeteranganNama = () => {
      let nama = ""
      data?.referensi_form?.forEach((item: any) => {
        // Flat structure
        if (item.referensis && Array.isArray(item.referensis)) {
          if (item.kategori === "MAPA02-1" && item.referensis[0]?.nama) {
            nama = item.referensis[0].nama
          }
        }
        // Nested fallback
        else if (item.kelompok?.kategoris) {
          item.kelompok.kategoris.forEach((kat: any) => {
            if (kat.kategori === "MAPA02-1") {
              kat.subkategoris?.forEach((sub: any) => {
                sub.referensis?.forEach((ref: any) => {
                  nama = ref.nama
                })
              })
            }
          })
        }
      })
      return nama
    }

    const m2Refs = flattenM2Refs()
    const keteranganNama = getKeteranganNama()

    return (
      <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '12px', color: '#000' }}>
        {/* Title */}
        <div style={{ marginBottom: '16px', textAlign: 'left' }}>
          <h1 style={{ fontSize: '14px', fontWeight: 'bold', color: '#000', marginBottom: '4px', textTransform: 'uppercase' }}>
            {data?.kelompok_kerja?.nama_dokumen || 'FR. MAPA.02 - FORMULIR MAPA 02'}
          </h1>
        </div>

        {/* Header Table */}
        <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '16px', fontSize: '13px', background: '#fff' }}>
          <tbody>
            <tr>
              <td rowSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', width: '35%', fontWeight: 'bold' }}>
                Skema Sertifikasi
              </td>
              <td style={{ border: '1px solid #000', padding: '6px 8px', whiteSpace: 'nowrap', fontWeight: 'bold' }}>Judul</td>
              <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>{(data?.judul || '').toUpperCase()}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '6px 8px', whiteSpace: 'nowrap', fontWeight: 'bold' }}>Nomor</td>
              <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>:</td>
              <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>{data?.nomor || ''}</td>
            </tr>
          </tbody>
        </table>

        {/* Kelompok Pekerjaan */}
        {kelompokKerja.map((kelompok: KelompokKerja) => (
          <div key={kelompok.id}>
            <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '0', fontSize: '13px', background: '#fff' }}>
              <tbody>
                <tr>
                  <th rowSpan={kelompok.units.length + 1} style={{ border: '1px solid #000', padding: '6px 8px', width: '25%', verticalAlign: 'top', textAlign: 'left' }}>
                    {kelompok.nama}
                  </th>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', width: '5%' }}>No.</th>
                  <th style={{ border: '1px solid #000', padding: '6px 8px', width: '20%' }}>Kode Unit</th>
                  <th style={{ border: '1px solid #000', padding: '6px 8px' }}>Judul Unit</th>
                </tr>
                {kelompok.units.map((unit, idx) => (
                  <tr key={unit.id_unit}>
                    <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{idx + 1}.</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{unit.kode_unit}</td>
                    <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{unit.nama_unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <br />

            {/* Instrumen Asesmen */}
            {m2Refs.length > 0 && (
              <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '16px', fontSize: '12px', background: '#fff' }}>
                <tbody>
                  <tr>
                    <th rowSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', width: '5%', background: '#c00000', color: '#fff' }}>No.</th>
                    <th rowSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', background: '#c00000', color: '#fff' }}>Instrumen Asesmen</th>
                    <th colSpan={5} style={{ border: '1px solid #000', padding: '6px 8px', background: '#c00000', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                      Potensi Asesi
                    </th>
                  </tr>
                  <tr>
                    {[1, 2, 3, 4, 5].map((v) => (
                      <th key={v} style={{ border: '1px solid #000', padding: '6px 8px', background: '#c00000', color: '#fff', fontWeight: 'bold', textAlign: 'center', width: '8%' }}>{v}</th>
                    ))}
                  </tr>
                  {m2Refs.map((ref, idx) => (
                    <tr key={ref.id}>
                      <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{idx + 1}.</td>
                      <td style={{ border: '1px solid #000', padding: '6px 8px' }}>{ref.nama}</td>
                      {[1, 2, 3, 4, 5].map((potensi) => (
                        <td key={potensi} style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', background: '#f5f5f5' }}>
                          <CustomCheckbox
                            checked={ref.isdefault === 1 && ref.potensi_asesi_index === potensi}
                            onChange={() => {}}
                            disabled
                            style={{ pointerEvents: 'none' }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}

        {/* Keterangan */}
        {keteranganNama && (
          <div style={{ background: '#fff', border: '1px solid #6f6f6f', marginBottom: '16px', padding: '12px', fontSize: '14px' }}>
            <div dangerouslySetInnerHTML={{ __html: keteranganNama }} />
          </div>
        )}

        {/* Signature Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }} cellSpacing="0">
          <tbody>
            <tr style={{ height: '28pt' }}>
              <td style={{ backgroundColor: '#C00000', border: '1px solid #000', padding: '6px 8px' }}><span style={{ color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>Status</span></td>
              <td style={{ backgroundColor: '#C00000', border: '1px solid #000', padding: '6px 8px' }}><span style={{ color: '#fff', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>No</span></td>
              <td style={{ backgroundColor: '#C00000', border: '1px solid #000', padding: '6px 8px' }}><span style={{ color: '#fff', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>Nama</span></td>
              <td style={{ backgroundColor: '#C00000', border: '1px solid #000', padding: '6px 8px' }}><span style={{ color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>Nomor MET</span></td>
              <td style={{ backgroundColor: '#C00000', border: '1px solid #000', padding: '6px 8px' }}><span style={{ color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>Tanda Tangan dan Tanggal</span></td>
            </tr>
            {/* Penyusun */}
            <tr style={{ height: '91pt' }}>
              <td rowSpan={2} style={{ border: '1px solid #000', padding: '15px 0 0 0', background: '#fff' }}>
                <span style={{ fontSize: '12px', paddingLeft: '15px' }}>Penyusun</span>
              </td>
              <td style={{ border: '1px solid #000', padding: '6px 8px', background: '#fff' }}>
                <span style={{ fontSize: '12px', textAlign: 'center' }}>1</span>
              </td>
              <td style={{ border: '1px solid #000', padding: '7px 8px', background: '#fff', fontSize: '12px' }}>
                {data?.penyusun_info?.nama || ''}
              </td>
              <td style={{ border: '1px solid #000', padding: '13px 8px', background: '#fff', fontSize: '12px' }}>
                {data?.penyusun_info?.noreg || '-'}
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', background: '#fff', textAlign: 'center' }}>
                {data?.penyusun_info?.barcode ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <img src={data.penyusun_info.barcode} alt="QR" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                    {data.penyusun_info.tanggal && <span style={{ fontSize: '10px' }}>{new Date(data.penyusun_info.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                  </div>
                ) : ''}
              </td>
            </tr>
            <tr style={{ height: '23pt' }}>
              <td style={{ border: '1px solid #000', padding: '1px 8px', background: '#fff' }}></td>
              <td style={{ border: '1px solid #000', padding: '1px 8px', background: '#fff' }}></td>
              <td style={{ border: '1px solid #000', padding: '1px 8px', background: '#fff' }}></td>
              <td style={{ border: '1px solid #000', padding: '1px 8px', background: '#fff' }}></td>
            </tr>
            {/* Validator */}
            <tr style={{ height: '68pt' }}>
              <td rowSpan={2} style={{ border: '1px solid #000', padding: '18px 0 0 0', background: '#fff' }}>
                <span style={{ fontSize: '12px', paddingLeft: '18px' }}>Validator</span>
              </td>
              <td style={{ border: '1px solid #000', padding: '6px 8px', background: '#fff' }}>
                <span style={{ fontSize: '12px', textAlign: 'center' }}>1</span>
              </td>
              <td style={{ border: '1px solid #000', padding: '7px 8px', background: '#fff', fontSize: '12px' }}>
                {data?.validator_info?.nama || ''}
              </td>
              <td style={{ border: '1px solid #000', padding: '13px 8px', background: '#fff', fontSize: '12px' }}>
                {data?.validator_info?.noreg || '-'}
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', background: '#fff', textAlign: 'center' }}>
                {data?.validator_info?.barcode ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <img src={data.validator_info.barcode} alt="QR" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                    {data.validator_info.tanggal && <span style={{ fontSize: '10px' }}>{new Date(data.validator_info.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                  </div>
                ) : ''}
              </td>
            </tr>
            <tr style={{ height: '23pt' }}>
              <td style={{ border: '1px solid #000', padding: '1px 8px', background: '#fff' }}></td>
              <td style={{ border: '1px solid #000', padding: '1px 8px', background: '#fff' }}></td>
              <td style={{ border: '1px solid #000', padding: '1px 8px', background: '#fff' }}></td>
              <td style={{ border: '1px solid #000', padding: '1px 8px', background: '#fff' }}></td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  // ── MAPA01 render via components ──
  const renderMapa01 = () => {
    if (!mapaData) return null
    return (
      <Mapa01Layout>
        <Mapa01Header judul={mapaData.judul} nomor={mapaData.nomor} skkni={mapaData.skkni} />
        <Mapa01Section1 referensiForm={mapaData.referensi_form} isAsesor={false} disabled={true} skkni={mapaData.skkni} />
        <Mapa01Section2 kelompokKerja={mapaData.kelompok_kerja?.kelompok_kerja || []} jenjang={mapaData.jenjang} metode={mapaData.metode} />
        <Mapa01Section3 referensiForm={mapaData.referensi_form} kelompokKerja={mapaData.kelompok_kerja?.kelompok_kerja || []} isAsesor={false} disabled={true} />
        <Mapa01TandaTangan
          namaPenyusun={mapaData.penyusun_info?.nama}
          noregPenyusun={mapaData.penyusun_info?.noreg}
          tanggalPenyusun={mapaData.penyusun_info?.tanggal}
          barcodePenyusun={mapaData.penyusun_info?.barcode}
          namaValidator={mapaData.validator_info?.nama}
          noregValidator={mapaData.validator_info?.noreg}
          tanggalValidator={mapaData.validator_info?.tanggal}
          barcodeValidator={mapaData.validator_info?.barcode}
          konfirmasiList={mapaData.manajer_info?.nama ? [mapaData.manajer_info as { nama: string; tanggal: string; barcode: string }] : []}
          referensiForm={mapaData.referensi_form}
          isAsesor={false}
        />
      </Mapa01Layout>
    )
  }

  // ── Main Render ──
  return (
    <div key={jenis} style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Button variant="ghost" size="icon" onClick={() => navigate(`/manager-mutu/detail-jabker/${jabkerId}`)}>
          <ArrowLeft style={{ width: '20px', height: '20px' }} />
        </Button>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{docLabel}</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
            Tanda tangan dokumen {docLabel} — {mapaData?.judul || jabkerId}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ background: '#fff', borderRadius: '8px', padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ height: '20px', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 2s infinite' }} />
            ))}
          </div>
        </div>
      ) : mapaData ? (
        <>
          {/* Document Content */}
          <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e2e8f0' }}>
            {jenis === "mapa01" ? renderMapa01() : renderMapa02()}
          </div>

          {/* Status TTD */}
          {renderAllSigned()}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Data dokumen tidak ditemukan untuk jabker ini
        </div>
      )}
    </div>
  )
}
