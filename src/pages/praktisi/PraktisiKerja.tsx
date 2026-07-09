import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router-dom"
import { API_BASE_URL } from "@/config/api"

type DocType = "ia04b" | "ia05" | "ia06"

const TABS: { key: DocType; label: string }[] = [
  { key: "ia04b", label: "IA.04B" },
  { key: "ia05", label: "IA.05" },
  { key: "ia06", label: "IA.06" },
]

interface SoalBase {
  id: number
  no?: string
  soal?: string
  jawaban?: string | null
  skor?: number | null
  tipe?: number
}

interface SoalIA05 extends SoalBase {
  jawab_a?: string
  jawab_b?: string
  jawab_c?: string
  jawab_d?: string
  kunci_jawaban?: string
  jawaban_asesi?: string | null
}

interface DokumenRef {
  id: number
  kode?: string
  nama_dokumen?: string
}

interface Barcodes {
  praktisi?: { url?: string; nama?: string; noreg?: string } | null
  [k: string]: any
}

interface LoadState {
  dokumen: DokumenRef | null
  soalList: SoalBase[]
  barcodes: Barcodes | null
  extra: Record<string, any>
}

export default function PraktisiKerja() {
  const { id } = useParams<{ id: string }>()
  const token = localStorage.getItem("access_token") || ""

  const [tab, setTab] = useState<DocType>("ia04b")
  const [data, setData] = useState<Record<DocType, LoadState>>({
    ia04b: { dokumen: null, soalList: [], barcodes: null, extra: {} },
    ia05: { dokumen: null, soalList: [], barcodes: null, extra: {} },
    ia06: { dokumen: null, soalList: [], barcodes: null, extra: {} },
  })
  const [jawaban, setJawaban] = useState<Record<number, string>>({})
  const [skor, setSkor] = useState<Record<number, number>>({})
  const [umpanBalik, setUmpanBalik] = useState("")
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
      const list: SoalBase[] = d.soal_list || []
      setData(prev => ({
        ...prev,
        [doc]: {
          dokumen: d.dokumen || null,
          soalList: list,
          barcodes: d.barcodes || null,
          extra: {
            total_skor: d.total_skor,
            rekomendasi: d.rekomendasi,
            jumlah_benar: d.jumlah_benar,
            jumlah_salah: d.jumlah_salah,
            umpan_balik: d.umpan_balik,
            unit_elemen_kuk: d.unit_elemen_kuk,
          },
        },
      }))

      const jInit: Record<number, string> = {}
      const sInit: Record<number, number> = {}
      list.forEach((q) => {
        const jv = (q as SoalIA05).jawaban_asesi ?? q.jawaban ?? ""
        jInit[q.id] = jv || ""
        sInit[q.id] = q.skor ?? 0
      })
      setJawaban(jInit)
      setSkor(sInit)
      setUmpanBalik(d.umpan_balik || "")
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }, [id, token])

  useEffect(() => { load(tab) }, [tab])

  const save = async () => {
    if (!id) return
    setSaving(true)
    setError("")
    setInfo("")
    try {
      const dokumen_id = data[tab].dokumen?.id
      if (!dokumen_id) throw new Error("Dokumen belum terload")

      const answers = data[tab].soalList.map((q) => ({
        soal_id: q.id,
        jawaban: jawaban[q.id] || "",
        skor: skor[q.id] ?? 0,
      }))

      const body: any = { type: tab, dokumen_id, answers }
      if (tab !== "ia04b") body.umpan_balik = umpanBalik
      if (tab === "ia04b" && data.ia04b.extra.rekomendasi !== undefined) {
        body.rekomendasi = !!data.ia04b.extra.rekomendasi
      }

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
      const j = await res.json()
      setInfo(`QR ${tab.toUpperCase()} berhasil${j.url || j.data?.url ? "" : ""}`)
      load(tab)
    } catch (e: any) {
      setError(e.message)
    }
    setQring(false)
  }

  if (!id) {
    return <div className="p-12 text-center text-slate-400">ID tidak ditemukan</div>
  }

  const cur = data[tab]

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
      ) : cur.soalList.length === 0 ? (
        <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center text-slate-400">Belum ada soal</div>
      ) : (
        <div className="space-y-4">
          {/* Barcode praktisi */}
          {cur.barcodes?.praktisi?.url && (
            <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-3 flex items-center gap-3">
              <img src={cur.barcodes.praktisi.url} alt="QR Praktisi" className="w-20 h-20" />
              <div className="text-sm">
                <p className="font-medium text-slate-700 dark:text-slate-200">{cur.barcodes.praktisi.nama || "QR Praktisi"}</p>
                {cur.barcodes.praktisi.noreg && <p className="text-xs text-slate-500">{cur.barcodes.praktisi.noreg}</p>}
              </div>
            </div>
          )}

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-600 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300 w-12">No</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">Soal</th>
                  {tab === "ia05" && <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[120px]">Pilihan</th>}
                  <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[160px]">Jawaban</th>
                  {tab !== "ia05" && <th className="text-center py-3 px-3 font-semibold text-slate-600 dark:text-slate-300 w-24">Skor</th>}
                </tr>
              </thead>
              <tbody>
                {cur.soalList.map((q, i) => {
                  const s05 = q as SoalIA05
                  return (
                    <tr key={q.id} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{q.no || i + 1}</td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-200 text-xs whitespace-pre-wrap">{q.soal || "-"}</td>
                      {tab === "ia05" && (
                        <td className="py-2 px-3 text-xs space-y-1">
                          {(["jawab_a", "jawab_b", "jawab_c", "jawab_d"] as const).map((k) => {
                            const label = k.replace("jawab_", "").toUpperCase()
                            return s05[k] ? (
                              <div key={k}><span className="font-mono font-bold">{label}.</span> {s05[k]}</div>
                            ) : null
                          })}
                        </td>
                      )}
                      <td className="py-2 px-3">
                        {tab === "ia05" ? (
                          <select
                            value={jawaban[q.id] || ""}
                            onChange={(e) => setJawaban(p => ({ ...p, [q.id]: e.target.value }))}
                            className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-xs"
                          >
                            <option value="">-- Pilih --</option>
                            {["A", "B", "C", "D"].map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <textarea
                            value={jawaban[q.id] || ""}
                            onChange={(e) => setJawaban(p => ({ ...p, [q.id]: e.target.value }))}
                            className="w-full bg-transparent border border-dashed border-slate-300 rounded px-2 py-1 text-xs resize-none"
                            rows={2}
                          />
                        )}
                      </td>
                      {tab !== "ia05" && (
                        <td className="py-2 px-3 text-center">
                          <select
                            value={skor[q.id] ?? 0}
                            onChange={(e) => setSkor(p => ({ ...p, [q.id]: Number(e.target.value) }))}
                            className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-xs"
                          >
                            <option value={0}>0</option>
                            <option value={1}>1</option>
                            {tab !== "ia04b" && <><option value={2}>2</option><option value={3}>3</option></>}
                          </select>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Umpan balik IA05/IA06 */}
          {tab !== "ia04b" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Umpan Balik</label>
              <textarea
                value={umpanBalik}
                onChange={(e) => setUmpanBalik(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm"
                rows={2}
              />
            </div>
          )}

          {/* Extra info */}
          {(cur.extra.total_skor != null || cur.extra.jumlah_benar != null) && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {cur.extra.total_skor != null && <span className="mr-4">Total Skor: <b>{cur.extra.total_skor}</b></span>}
              {cur.extra.jumlah_benar != null && <span className="mr-4">Benar: <b>{cur.extra.jumlah_benar}</b></span>}
              {cur.extra.jumlah_salah != null && <span>Salah: <b>{cur.extra.jumlah_salah}</b></span>}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={genQr}
              disabled={qring}
              className="border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium"
            >
              {qring ? "Generate QR..." : `QR ${tab.toUpperCase()}`}
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg text-sm font-medium"
            >
              {saving ? "Menyimpan..." : `Simpan ${tab.toUpperCase()}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
