import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { API_BASE_URL } from "@/config/api"

const STEPS = ["APL.01", "IA.04B", "IA.05", "IA.06", "AK.02", "TTD"]

export default function JawabSoal() {
  const { idIzin } = useParams()
  const [activeStep, setActiveStep] = useState(0)
  const [, setStatus] = useState<any>(null)
  const [soalData, setSoalData] = useState<any[]>([])
  const [jawaban, setJawaban] = useState<Record<string, string>>({})
  const [skor, setSkor] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // TTD state
  const [ttdLoading, setTtdLoading] = useState(false)
  const [ttdSaving, setTtdSaving] = useState<string | null>(null)
  const [ttdBarcodes, setTtdBarcodes] = useState<Record<string, string>>({})
  const ttdDocs = [
    { key: "ia04b", label: "IA.04B — Penilaian Asesmen" },
    { key: "ia05", label: "IA.05 — Ujian Pilihan Ganda" },
    { key: "ia06", label: "IA.06 — Ujian Esai" },
    { key: "ak02", label: "AK.02 — Rekomendasi Keputusan" },
  ]

  const token = localStorage.getItem("access_token") || ""

  useEffect(() => {
    if (!idIzin) return
    loadStatus()
  }, [idIzin])

  const loadStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/praktisi/${idIzin}/status`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const j = await res.json()
        setStatus(j.data || j)
      }
    } catch { /* silent */ }
    setLoading(false)
  }

  const loadTtdStatus = async () => {
    setTtdLoading(true)
    try {
      const results: Record<string, string> = {}
      for (const doc of ttdDocs) {
        const res = await fetch(`${API_BASE_URL}/praktisi/${idIzin}/${doc.key}`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const j = await res.json()
          const d = j.data || j
          const bc = d.barcodes || {}
          if (bc?.asesi?.url) results[doc.key] = bc.asesi.url
        }
      }
      setTtdBarcodes(results)
    } catch { /* silent */ }
    setTtdLoading(false)
  }

  const handleTtd = async (jenis: string) => {
    setTtdSaving(jenis)
    setError("")
    try {
      const res = await fetch(`${API_BASE_URL}/praktisi/${idIzin}/qr/${jenis}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: "{}",
      })
      if (!res.ok) throw new Error(`Gagal TTD ${jenis}`)
      const j = await res.json()
      const url = j.data?.url_image || j.url_image || ""
      if (url) setTtdBarcodes(prev => ({ ...prev, [jenis]: url }))
      setSuccess(`${ttdDocs.find(d => d.key === jenis)?.label || jenis} berhasil ditandatangani`)
    } catch (err: any) { setError(err.message) }
    setTtdSaving(null)
  }

  const loadSoal = async (jenis: string) => {
    setLoading(true)
    setError("")
    try {
      const endpoint = jenis === "apl01"
        ? `${API_BASE_URL}/praktisi/${idIzin}/apl01`
        : `${API_BASE_URL}/praktisi/${idIzin}/${jenis}`

      const res = await fetch(endpoint, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Gagal load ${jenis}`)

      const j = await res.json()
      const d = j.data || j
      const list = d.soal_list || d.soal || (d.questions ? d.questions : [])
      setSoalData(Array.isArray(list) ? list : [])

      // Init existing answers
      if (Array.isArray(list)) {
        const initJwb: Record<string, string> = {}
        const initSkor: Record<string, number> = {}
        list.forEach((q: any, i: number) => {
          const key = q.id || q.soal_id || i
          initJwb[key] = q.jawaban || q.jawaban_asesi || ""
          initSkor[key] = q.skor ?? (q.tipe === 1 ? (q.jawaban_asesi === q.jawaban ? 1 : 0) : 0)
        })
        setJawaban(initJwb)
        setSkor(initSkor)
      }
    } catch (err: any) {
      setError(err.message)
      setSoalData([])
    }
    setLoading(false)
  }

  const handleStepChange = (idx: number) => {
    setActiveStep(idx)
    setError("")
    setSuccess("")
    const stepMap = ["apl01", "ia04b", "ia05", "ia06", "ak02", "ttd"]
    const jenis = stepMap[idx]
    if (jenis === "ttd") {
      loadTtdStatus()
    } else {
      loadSoal(jenis)
    }
  }

  const handleSubmitAll = async () => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      // Map current step to payload format
      const stepMap = ["apl01", "ia04b", "ia05", "ia06", "ak02", "ttd"]
      const jenis = stepMap[activeStep]

      let payload: any = {}

      if (jenis === "apl01") {
        payload.catatan = jawaban["catatan"] || ""
      } else if (jenis === "ia04b") {
        payload.ia04b = soalData.map((q: any, i: number) => ({
          soal_id: q.id || q.soal_id || i,
          jawaban: jawaban[q.id || q.soal_id || i] || "",
          skor: skor[q.id || q.soal_id || i] ?? 0,
        }))
      } else if (jenis === "ia05") {
        payload.ia05 = soalData.map((q: any, i: number) => ({
          soal_id: q.id || q.soal_id || i,
          jawaban: jawaban[q.id || q.soal_id || i] || "",
        }))
      } else if (jenis === "ia06") {
        payload.ia06 = soalData.map((q: any, i: number) => ({
          soal_id: q.id || q.soal_id || i,
          jawaban: jawaban[q.id || q.soal_id || i] || "",
          skor: skor[q.id || q.soal_id || i] ?? 0,
        }))
      } else if (jenis === "ak02") {
        payload.units = soalData
        payload.tindak_lanjut = jawaban["tindak_lanjut"] || ""
        payload.komentar = jawaban["komentar"] || ""
      }

      const res = await fetch(`${API_BASE_URL}/praktisi/${idIzin}/jawab`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || `Gagal simpan (${res.status})`)
      }

      setSuccess("Jawaban berhasil disimpan")
    } catch (err: any) {
      setError(err.message)
    }
    setSaving(false)
  }

  if (!idIzin) return <div className="p-12 text-center text-slate-400">ID Izin tidak ditemukan</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Jawab Soal</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Flow asesmen — ikuti tahapan berikut</p>
      </div>

      {/* Steps */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {STEPS.map((step, i) => (
          <button
            key={step}
            onClick={() => handleStepChange(i)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              i === activeStep
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500 hover:bg-slate-200"
            }`}
          >
            {step}
            {i < STEPS.length - 1 && <span className="text-slate-300 dark:text-slate-600">→</span>}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 rounded-lg text-sm text-red-600">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 rounded-lg text-sm text-green-600">{success}</div>}

      {/* Content per step */}
      {activeStep === 0 && (
        <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-6">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">APL.01 — Review Formulir Pendaftaran</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Catatan</label>
            <textarea
              value={jawaban["catatan"] || ""}
              onChange={(e) => setJawaban(prev => ({ ...prev, catatan: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm"
              rows={4}
              placeholder="Catatan review APL.01..."
            />
          </div>
        </div>
      )}

      {[1, 2, 3].includes(activeStep) && (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-600 rounded-lg">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Memuat soal...</div>
          ) : soalData.length === 0 ? (
            <div className="p-12 text-center text-slate-400">Belum ada soal</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300 w-12">No</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">Soal</th>
                  {activeStep === 2 && <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[100px]">Pilihan</th>}
                  <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[150px]">Jawaban</th>
                  {activeStep !== 2 && <th className="text-center py-3 px-3 font-semibold text-slate-600 dark:text-slate-300 w-20">Skor</th>}
                </tr>
              </thead>
              <tbody>
                {soalData.map((q: any, i: number) => {
                  const key = q.id || q.soal_id || i
                  return (
                    <tr key={key} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="py-2 px-3 text-slate-600">{q.no || i + 1}</td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-200 text-xs">{q.soal || "-"}</td>
                      {activeStep === 2 && (
                        <td className="py-2 px-3">
                          <div className="text-xs space-y-1">
                            {["jawab_a","jawab_b","jawab_c","jawab_d"].map((jwb) => {
                              const label = jwb.replace("jawab_", "").toUpperCase()
                              return q[jwb] ? <div key={jwb}><span className="font-mono font-bold">{label}.</span> {q[jwb]}</div> : null
                            })}
                          </div>
                        </td>
                      )}
                      <td className="py-2 px-3">
                        {activeStep === 2 ? (
                          <select
                            value={jawaban[key] || ""}
                            onChange={(e) => setJawaban(prev => ({ ...prev, [key]: e.target.value }))}
                            className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-xs"
                          >
                            <option value="">-- Pilih --</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        ) : (
                          <textarea
                            value={jawaban[key] || ""}
                            onChange={(e) => setJawaban(prev => ({ ...prev, [key]: e.target.value }))}
                            className="w-full bg-transparent border border-dashed border-slate-300 rounded px-2 py-1 text-xs resize-none"
                            rows={2}
                          />
                        )}
                      </td>
                      {activeStep !== 2 && (
                        <td className="py-2 px-3 text-center">
                          <select
                            value={skor[key] ?? 0}
                            onChange={(e) => setSkor(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                            className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-xs"
                          >
                            <option value={0}>0</option>
                            <option value={1}>1</option>
                            {activeStep !== 1 && <><option value={2}>2</option><option value={3}>3</option></>}
                          </select>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeStep === 4 && (
        <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-6">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">AK.02 — Rekomendasi Keputusan</h3>
          <p className="text-xs text-slate-500 mb-4">Isi tindak lanjut dan komentar untuk asesi ini.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tindak Lanjut</label>
              <textarea value={jawaban["tindak_lanjut"] || ""} onChange={(e) => setJawaban(prev => ({ ...prev, tindak_lanjut: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Komentar</label>
              <textarea value={jawaban["komentar"] || ""} onChange={(e) => setJawaban(prev => ({ ...prev, komentar: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm" rows={3} />
            </div>
          </div>
        </div>
      )}

      {activeStep === 5 && (
        <div className="space-y-4">
          <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-6">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Tanda Tangan Digital</h3>
            <p className="text-xs text-slate-500 mb-4">TTD dokumen asesmen. Klik tombol TTD untuk membubuhkan tanda tangan.</p>

            {ttdLoading ? (
              <div className="text-center text-slate-400 py-8">Memuat status TTD...</div>
            ) : (
              <div className="space-y-3">
                {ttdDocs.map((doc) => {
                  const signed = !!ttdBarcodes[doc.key]
                  return (
                    <div key={doc.key} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${signed ? 'bg-green-500' : 'bg-slate-300'}`} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{doc.label}</span>
                        {signed && <span className="text-xs text-green-600">Sudah TTD</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        {ttdBarcodes[doc.key] && (
                          <img src={ttdBarcodes[doc.key]} alt="barcode" className="h-10 w-10 object-contain" />
                        )}
                        <button
                          onClick={() => handleTtd(doc.key)}
                          disabled={ttdSaving === doc.key}
                          className={`px-4 py-1.5 rounded text-xs font-medium ${
                            signed
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {ttdSaving === doc.key ? "Memproses..." : signed ? "TTD Ulang" : "TTD"}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
            <p className="text-xs text-slate-500">
              TTD digital menggunakan QR code yang terverifikasi. Setelah TTD, dokumen PDF akan digenerate secara otomatis.
            </p>
          </div>
        </div>
      )}

      {/* Submit */}
      {activeStep < 5 && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmitAll}
            disabled={saving || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg text-sm font-medium"
          >
            {saving ? "Menyimpan..." : `Simpan ${STEPS[activeStep]}`}
          </button>
        </div>
      )}
    </div>
  )
}
