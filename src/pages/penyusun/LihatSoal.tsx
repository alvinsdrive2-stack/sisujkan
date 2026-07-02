import { useState, useRef, useCallback } from "react"
import { extractFromDocx, extractAnswersFromDocx } from "@/lib/docx-extractor"

type SoalRow = Record<string, string | number>

export default function LihatSoal() {
  const [selectedJabker, setSelectedJabker] = useState("")
  const [selectedDokumen, setSelectedDokumen] = useState("")
  const [soalData, setSoalData] = useState<SoalRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fileName, setFileName] = useState("")
  const [answerFileName, setAnswerFileName] = useState("")
  const [answerKey, setAnswerKey] = useState<Record<number, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const answerInputRef = useRef<HTMLInputElement>(null)

  const mergeAnswers = useCallback((rows: SoalRow[], answers: Record<number, string>) => {
    return rows.map(row => ({
      ...row,
      jawaban: answers[row.no as number] || (row.jawaban as string) || '',
    }))
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.docx')) {
      setError("File harus format .docx")
      return
    }

    if (!selectedDokumen) {
      setError("Pilih jenis dokumen KAN dulu (IA.04B / IA.05 / IA.06)")
      return
    }

    setError("")
    setLoading(true)
    setFileName(file.name)

    try {
      const rows = await extractFromDocx(file, selectedDokumen)
      const merged = mergeAnswers(rows, answerKey)
      setSoalData(merged)
    } catch (err: any) {
      setError(err.message || "Gagal extract")
    }

    setLoading(false)
    // Reset file input so re-uploading same file triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAnswerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.docx')) {
      setError("File kunci jawaban harus format .docx")
      return
    }

    setError("")
    setLoading(true)
    setAnswerFileName(file.name)

    try {
      const answers = await extractAnswersFromDocx(file)
      setAnswerKey(answers)

      // Merge into existing soalData if any
      if (soalData.length > 0) {
        setSoalData(prev => mergeAnswers(prev, answers))
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
      { no: prev.length + 1, soal: '', lingkup: '', kode_unit: '', kode_kuk: '', jawab_a: '', jawab_b: '', jawab_c: '', jawab_d: '', jawaban: '' }
    ])
  }

  const handleDeleteRow = (idx: number) => {
    setSoalData(prev => prev.filter((_, i) => i !== idx).map((row, i) => ({ ...row, no: i + 1 })))
  }

  const handleFieldChange = (idx: number, field: string, value: string) => {
    setSoalData(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row))
  }

  const handleSave = async () => {
    setLoading(true)
    setError("")

    const payload = {
      jabker_id: selectedJabker,
      dokumen: selectedDokumen,
      soals: soalData,
    }

    console.log('Payload siap dikirim:', payload)
    alert(`[MOCKUP] Soal siap disimpan.\nJumlah soal: ${soalData.length}\n\nCek console untuk payload detail.`)
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Lihat Soal</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Input, edit, dan kelola soal KAN</p>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pilih Jabatan Kerja</label>
          <select
            value={selectedJabker}
            onChange={(e) => setSelectedJabker(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
          >
            <option value="">-- Pilih Jabker --</option>
            <option value="1">Teknisi Muda Listrik</option>
            <option value="2">Analis Sistem Informasi</option>
            <option value="3">Ahli K3 Muda</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pilih Dokumen KAN</label>
          <select
            value={selectedDokumen}
            onChange={(e) => { setSelectedDokumen(e.target.value); setError("") }}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
          >
            <option value="">-- Pilih Dokumen --</option>
            <option value="ia04b">IA.04B — Lembar Periksa Kegiatan Terstruktur</option>
            <option value="ia05">IA.05 — Pertanyaan Pilihan Ganda</option>
            <option value="ia06">IA.06 — Pertanyaan Esai</option>
          </select>
        </div>

        <div className="flex items-end gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {loading ? "Extracting..." : "Extract Soal dari Word"}
          </button>

          {selectedDokumen === 'ia05' && (
            <>
              <input
                ref={answerInputRef}
                type="file"
                accept=".docx"
                className="hidden"
                onChange={handleAnswerUpload}
              />
              <button
                onClick={() => answerInputRef.current?.click()}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {answerFileName ? "Ganti Kunci Jawaban" : "+ Kunci Jawaban (05B)"}
              </button>
            </>
          )}

          <button
            onClick={handleAddManual}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
          >
            + Tambah Manual
          </button>
        </div>
      </div>

      {fileName && (
        <div className="mb-2 text-sm text-slate-500 dark:text-slate-400">
          File Soal: <span className="font-medium text-slate-700 dark:text-slate-300">{fileName}</span>
        </div>
      )}
      {answerFileName && (
        <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Kunci Jawaban: <span className="font-medium text-slate-700 dark:text-slate-300">{answerFileName}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Preview Table */}
      {soalData.length > 0 && (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-600 rounded-lg mb-4">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300 w-12">No</th>
                <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">Soal</th>
                {selectedDokumen === 'ia04b' && (
                  <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">Lingkup</th>
                )}
                {selectedDokumen === 'ia04b' && (
                  <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">Kode Unit</th>
                )}
                {selectedDokumen === 'ia05' && (
                  <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">KUK</th>
                )}
                {selectedDokumen === 'ia05' && (
                  <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">Jawaban</th>
                )}
                {selectedDokumen === 'ia06' && (
                  <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">KUK</th>
                )}
                <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {soalData.map((row, idx) => (
                <tr key={idx} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{row.no}</td>
                  <td className="py-2 px-3">
                    <textarea
                      value={row.soal as string}
                      onChange={(e) => handleFieldChange(idx, 'soal', e.target.value)}
                      className="w-full bg-transparent border border-dashed border-slate-300 dark:border-slate-500 rounded px-2 py-1 text-sm resize-none"
                      rows={2}
                    />
                  </td>
                  {selectedDokumen === 'ia04b' && (
                    <td className="py-2 px-3">
                      <input
                        value={row.lingkup as string}
                        onChange={(e) => handleFieldChange(idx, 'lingkup', e.target.value)}
                        className="w-full bg-transparent border border-dashed border-slate-300 dark:border-slate-500 rounded px-2 py-1 text-sm"
                      />
                    </td>
                  )}
                  {selectedDokumen === 'ia04b' && (
                    <td className="py-2 px-3">
                      <input
                        value={row.kode_unit as string}
                        onChange={(e) => handleFieldChange(idx, 'kode_unit', e.target.value)}
                        className="w-full bg-transparent border border-dashed border-slate-300 dark:border-slate-500 rounded px-2 py-1 text-sm"
                      />
                    </td>
                  )}
                  {selectedDokumen === 'ia05' && (
                    <td className="py-2 px-3">
                      <input
                        value={row.kode_kuk as string}
                        onChange={(e) => handleFieldChange(idx, 'kode_kuk', e.target.value)}
                        className="w-full bg-transparent border border-dashed border-slate-300 dark:border-slate-500 rounded px-2 py-1 text-sm"
                      />
                    </td>
                  )}
                  {selectedDokumen === 'ia05' && (
                    <td className="py-2 px-3">
                      <select
                        value={row.jawaban as string}
                        onChange={(e) => handleFieldChange(idx, 'jawaban', e.target.value)}
                        className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-xs text-slate-700 dark:text-slate-200"
                      >
                        <option value="">-- Pilih --</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </td>
                  )}
                  {selectedDokumen === 'ia06' && (
                    <td className="py-2 px-3">
                      <input
                        value={row.kode_kuk as string}
                        onChange={(e) => handleFieldChange(idx, 'kode_kuk', e.target.value)}
                        className="w-full bg-transparent border border-dashed border-slate-300 dark:border-slate-500 rounded px-2 py-1 text-sm"
                      />
                    </td>
                  )}
                  <td className="py-2 px-3">
                    <button
                      onClick={() => handleDeleteRow(idx)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {soalData.length === 0 && !loading && (
        <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
          <p className="text-slate-400 dark:text-slate-500 mb-2">Belum ada soal</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Pilih jabker + dokumen KAN, lalu upload DOCX atau tambah manual
          </p>
        </div>
      )}

      {loading && (
        <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
          <p className="text-blue-500 font-medium">Memproses file...</p>
        </div>
      )}

      {/* Actions */}
      {soalData.length > 0 && (
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => { setSoalData([]); setFileName(""); setAnswerKey({}); setAnswerFileName("") }}
            className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-6 py-2 rounded-lg text-sm font-medium"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg text-sm font-medium"
          >
            {loading ? "Menyimpan..." : "Simpan ke Backend"}
          </button>
        </div>
      )}
    </div>
  )
}
