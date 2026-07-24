import { useState, useRef, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { extractFromDocx, extractAnswersFromDocx } from "@/lib/docx-extractor"
import { API_BASE_URL } from "@/config/api"
import { useAuth } from "@/contexts/auth-context"
import { RoleId } from "@/lib/rbac-config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, Upload, Plus, Save, X, BookOpen, ExternalLink, Eye } from "lucide-react"

type SoalRow = Record<string, string | number>
type DocType = "ia04b" | "ia05" | "ia06"

const DOKEMEN_OPTIONS: { value: DocType; label: string }[] = [
  { value: "ia04b", label: "FR.IA.04.B — Lembar Periksa Kegiatan Terstruktur" },
  { value: "ia05", label: "FR.IA.05 — Pertanyaan Pilihan Ganda" },
  { value: "ia06", label: "FR.IA.06 — Pertanyaan Esai" },
]

export default function DetailSoal() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [jabkerName, setJabkerName] = useState("")
  const [selectedDokumen, setSelectedDokumen] = useState<DocType | "">("")
  const [soalData, setSoalData] = useState<SoalRow[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [fileName, setFileName] = useState("")
  const [answerFileName, setAnswerFileName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const answerInputRef = useRef<HTMLInputElement>(null)

  const token = localStorage.getItem("access_token") || ""
  const { user } = useAuth()
  const isValidator = user?.role?.id === RoleId.VALIDATOR

  // Load jabker name
  useEffect(() => {
    if (!id) return
    fetch(`${API_BASE_URL}/penyusun/jabker`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(j => {
        const d = j.data || j
        if (Array.isArray(d)) {
          const found = d.find((x: any) => String(x.id) === id || x.id_jabatan_kerja === id)
          setJabkerName(found?.nama || found?.jabatan_kerja || found?.name || "")
        }
      })
      .catch(() => {})
  }, [id])

  // Auto-fetch soal when dokumen selected
  useEffect(() => {
    if (!id || !selectedDokumen) return

    const fetchSoal = async () => {
      setFetchLoading(true)
      setError("")
      setSuccess("")
      try {
        const res = await fetch(`${API_BASE_URL}/kan/soal/${selectedDokumen}/${id}`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error("Gagal fetch")
        const json = await res.json()
        const data = json.data?.soal || json.data || []
        setSoalData(Array.isArray(data) && data.length > 0 ? data : [])
      } catch {
        setSoalData([])
      }
      setFetchLoading(false)
    }
    fetchSoal()
  }, [id, selectedDokumen])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.docx')) { setError("File harus format .docx"); return }
    if (!selectedDokumen) { setError("Pilih jenis dokumen KAN dulu"); return }

    setError("")
    setSuccess("")
    setLoading(true)
    setFileName(file.name)

    try {
      const rows = await extractFromDocx(file, selectedDokumen)
      setSoalData(rows)
      setAnswerFileName("")
    } catch (err: any) {
      setError(err.message || "Gagal extract")
    }
    setLoading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAnswerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.docx')) { setError("File kunci jawaban harus format .docx"); return }

    setError("")
    setSuccess("")
    setLoading(true)
    setAnswerFileName(file.name)

    try {
      const answers = await extractAnswersFromDocx(file)
      if (soalData.length > 0) {
        setSoalData(prev => prev.map(row => ({
          ...row,
          jawaban: answers[row.no as number] || (row.jawaban as string) || '',
        })))
      }
    } catch (err: any) {
      setError(err.message || "Gagal extract kunci jawaban")
    }
    setLoading(false)
    if (answerInputRef.current) answerInputRef.current.value = ''
  }

  const handleAddManual = () => {
    setSoalData(prev => [
      ...prev,
      { no: prev.length + 1, soal: '', soal1: '', kode_unit: '', kode_kuk: '', jawab_a: '', jawab_b: '', jawab_c: '', jawab_d: '', jawaban: '' },
    ])
  }

  const handleDeleteRow = (idx: number) => {
    setSoalData(prev => prev.filter((_, i) => i !== idx).map((row, i) => ({ ...row, no: i + 1 })))
  }

  const handleFieldChange = (idx: number, field: string, value: string) => {
    setSoalData(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row))
  }

  const handleSave = async () => {
    if (!id || !selectedDokumen) { setError("Pilih dokumen KAN dulu"); return }
    if (soalData.length === 0) { setError("Belum ada soal"); return }

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const payload: any = { nama: jabkerName || id, soal: [] }

      if (selectedDokumen === "ia04b") {
        payload.soal = soalData.map((row: any) => ({
          no: row.no, soal: row.soal, soal1: row.soal1 || "", kode_unit: row.kode_unit || "",
        }))
      } else if (selectedDokumen === "ia05") {
        payload.soal = soalData.map((row: any) => ({
          no: row.no, soal: row.soal,
          jawab_a: row.jawab_a || "", jawab_b: row.jawab_b || "",
          jawab_c: row.jawab_c || "", jawab_d: row.jawab_d || "",
          jawaban: row.jawaban || "", kode_kuk: row.kode_kuk || "",
        }))
      } else if (selectedDokumen === "ia06") {
        payload.soal = soalData.map((row: any) => ({
          no: row.no, soal: row.soal, kode_kuk: row.kode_kuk || "",
        }))
      }

      const res = await fetch(`${API_BASE_URL}/kan/import/${selectedDokumen}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || `Gagal simpan (${res.status})`)
      }

      const result = await res.json()
      setSuccess(result.message || `Berhasil simpan ${soalData.length} soal`)
    } catch (err: any) {
      setError(err.message || "Gagal simpan")
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/penyusun/lihat-soal")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Kelola Soal KAN</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">{id}</Badge>
            {jabkerName && <span className="font-medium text-slate-700 dark:text-slate-300">{jabkerName}</span>}
            {isValidator && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Eye className="w-3 h-3" /> View Only
              </Badge>
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-600 dark:text-green-400">{success}</div>
      )}

      {/* Main content: Tools + Table (70%) | Info (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left: Tools & Table */}
        <div className="lg:col-span-7 space-y-4">
          {/* Dokumen Selector + Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4 text-primary" />
                Dokumen KAN
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-full sm:w-64">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Pilih Dokumen</label>
                  <select
                    value={selectedDokumen}
                    onChange={(e) => { setSelectedDokumen(e.target.value as DocType); setError(""); setSuccess("") }}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
                  >
                    <option value="">-- Pilih Dokumen --</option>
                    {DOKEMEN_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {!isValidator && (
                    <><input ref={fileInputRef} type="file" accept=".docx" className="hidden" onChange={handleFileUpload} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || !selectedDokumen}
                  >
                    <Upload className="w-4 h-4 mr-1.5" />
                    {loading ? "Extracting..." : "Extract DOCX"}
                  </Button>

                  {selectedDokumen === 'ia05' && (
                    <>
                      <input ref={answerInputRef} type="file" accept=".docx" className="hidden" onChange={handleAnswerUpload} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => answerInputRef.current?.click()}
                        disabled={loading}
                      >
                        <Upload className="w-4 h-4 mr-1.5" />
                        {answerFileName ? "Ganti Kunci" : "+ Kunci Jawaban"}
                      </Button>
                    </>
                  )}

                  <Button variant="default" size="sm" onClick={handleAddManual}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    Tambah Manual
                  </Button></>
                  )}
                </div>
              </div>

              {fileName && (
                <p className="mt-2 text-xs text-slate-500">
                  File: <span className="font-medium text-slate-700 dark:text-slate-300">{fileName}</span>
                </p>
              )}
              {answerFileName && (
                <p className="mt-1 text-xs text-slate-500">
                  Kunci: <span className="font-medium text-slate-700 dark:text-slate-300">{answerFileName}</span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Soal Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="w-4 h-4 text-primary" />
                Daftar Soal
                {soalData.length > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs">{soalData.length} Soal</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fetchLoading ? (
                <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
                  <p className="text-blue-500 text-sm font-medium">Memuat soal...</p>
                </div>
              ) : !selectedDokumen ? (
                <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
                  <p className="text-slate-400 text-sm">Pilih dokumen KAN dulu</p>
                </div>
              ) : soalData.length === 0 ? (
                <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
                  <p className="text-slate-400 text-sm mb-1">Belum ada soal</p>
                  <p className="text-xs text-slate-400">Upload DOCX atau tambah manual</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                      <tr>
                        <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300 w-12">No</th>
                        <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300">Soal</th>
                        {selectedDokumen === 'ia04b' && <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300">Lingkup</th>}
                        {selectedDokumen === 'ia04b' && <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300">Kode Unit</th>}
                        {selectedDokumen === 'ia05' && <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[110px]">A</th>}
                        {selectedDokumen === 'ia05' && <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[110px]">B</th>}
                        {selectedDokumen === 'ia05' && <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[110px]">C</th>}
                        {selectedDokumen === 'ia05' && <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300 min-w-[110px]">D</th>}
                        {selectedDokumen === 'ia05' && <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300">KUK</th>}
                        {selectedDokumen === 'ia05' && <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300 w-20">Jawaban</th>}
                        {selectedDokumen === 'ia06' && <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300">KUK</th>}
                        <th className="text-left py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300 w-14">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {soalData.map((row, idx) => (
                        <tr key={idx} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-xs">{row.no}</td>
                          <td className="py-2 px-3">
                            <textarea value={row.soal as string} onChange={(e) => handleFieldChange(idx, 'soal', e.target.value)}
                              className="w-full bg-transparent border border-dashed border-slate-300 dark:border-slate-500 rounded px-2 py-1 text-xs resize-none" rows={2} readOnly={isValidator} />
                          </td>
                          {selectedDokumen === 'ia04b' && (
                            <td className="py-2 px-3">
                              <input value={row.soal1 as string} onChange={(e) => handleFieldChange(idx, 'soal1', e.target.value)}
                                className="w-full bg-transparent border border-dashed border-slate-300 dark:border-slate-500 rounded px-2 py-1 text-xs" readOnly={isValidator} />
                            </td>
                          )}
                          {selectedDokumen === 'ia04b' && (
                            <td className="py-2 px-3">
                              <input value={(row as any).unit?.kode ?? row.kode_unit ?? ""} onChange={(e) => handleFieldChange(idx, 'kode_unit', e.target.value)}
                                className="w-full bg-transparent border border-dashed border-slate-300 dark:border-slate-500 rounded px-2 py-1 text-xs" readOnly={isValidator} />
                            </td>
                          )}
                          {selectedDokumen === 'ia05' && (
                            <td className="py-2 px-3">
                              <textarea value={row.jawab_a as string} onChange={(e) => handleFieldChange(idx, 'jawab_a', e.target.value)}
                                className="w-full bg-transparent border border-dashed border-slate-300 dark:border-slate-500 rounded px-2 py-1 text-xs resize-none" rows={2} readOnly={isValidator} />
                            </td>
                          )}
                          {selectedDokumen === 'ia05' && (
                            <td className="py-2 px-3">
                              <textarea value={row.jawab_b as string} onChange={(e) => handleFieldChange(idx, 'jawab_b', e.target.value)}
                                className="w-full bg-transparent border border-dashed border-slate-300 dark:border-slate-500 rounded px-2 py-1 text-xs resize-none" rows={2} readOnly={isValidator} />
                            </td>
                          )}
                          {selectedDokumen === 'ia05' && (
                            <td className="py-2 px-3">
                              <textarea value={row.jawab_c as string} onChange={(e) => handleFieldChange(idx, 'jawab_c', e.target.value)}
                                className="w-full bg-transparent border border-dashed border-slate-300 dark:border-slate-500 rounded px-2 py-1 text-xs resize-none" rows={2} readOnly={isValidator} />
                            </td>
                          )}
                          {selectedDokumen === 'ia05' && (
                            <td className="py-2 px-3">
                              <textarea value={row.jawab_d as string} onChange={(e) => handleFieldChange(idx, 'jawab_d', e.target.value)}
                                className="w-full bg-transparent border border-dashed border-slate-300 dark:border-slate-500 rounded px-2 py-1 text-xs resize-none" rows={2} readOnly={isValidator} />
                            </td>
                          )}
                          {selectedDokumen === 'ia05' && (
                            <td className="py-2 px-3">
                              <input value={(row as any).kuk?.kode ?? row.kode_kuk ?? ""} onChange={(e) => handleFieldChange(idx, 'kode_kuk', e.target.value)}
                                className="w-full bg-transparent border border-dashed border-slate-300 dark:border-slate-500 rounded px-2 py-1 text-xs" readOnly={isValidator} />
                            </td>
                          )}
                          {selectedDokumen === 'ia05' && (
                            <td className="py-2 px-3">
                              <select value={row.jawaban as string} onChange={(e) => handleFieldChange(idx, 'jawaban', e.target.value)} disabled={isValidator}
                                className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-xs text-slate-700 dark:text-slate-200">
                                <option value="">--</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                              </select>
                            </td>
                          )}
                          {selectedDokumen === 'ia06' && (
                            <td className="py-2 px-3">
                              <input value={(row as any).kuk?.kode ?? row.kode_kuk ?? ""} onChange={(e) => handleFieldChange(idx, 'kode_kuk', e.target.value)}
                                className="w-full bg-transparent border border-dashed border-slate-300 dark:border-slate-500 rounded px-2 py-1 text-xs" readOnly={isValidator} />
                            </td>
                          )}
                          <td className="py-2 px-3">
                            {!isValidator && (
                              <button onClick={() => handleDeleteRow(idx)} className="text-red-500 hover:text-red-700 text-xs font-medium">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save button */}
          {!isValidator && soalData.length > 0 && (
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Menyimpan..." : "Simpan ke Backend"}
              </Button>
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="lg:col-span-3 space-y-4">
          <Button
            variant="outline"
            className="w-full gap-2 text-primary border-primary hover:bg-primary/5"
            onClick={() => navigate(`/penyusun/soal-kosong/${id}`)}
          >
            <ExternalLink className="w-4 h-4" />
            Lihat Hasil
          </Button>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4 text-primary" />
                Informasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500 text-xs">ID Jabatan Kerja</p>
                <p className="font-mono font-medium text-slate-800 dark:text-slate-200">{id}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Nama Jabker</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{jabkerName || "-"}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Dokumen Terpilih</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedDokumen ? DOKEMEN_OPTIONS.find(o => o.value === selectedDokumen)?.label || selectedDokumen : "-"}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Total Soal</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{soalData.length} soal</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="w-4 h-4 text-primary" />
                Petunjuk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-500">
              {isValidator ? (
                <p>Mode lihat saja. Tidak bisa mengubah soal.</p>
              ) : (
                <>
                  <p>1. Pilih jenis dokumen KAN</p>
                  <p>2. Upload file DOCX atau tambah manual</p>
                  <p>3. Edit soal langsung di tabel</p>
                  <p>4. Simpan ke backend</p>
                  <p className="text-slate-400 mt-2 italic">Untuk IA.05 bisa upload kunci jawaban terpisah</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


