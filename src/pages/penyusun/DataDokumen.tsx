import { useState, useEffect, useCallback } from "react"
import { Search, ChevronLeft, ChevronRight, Download, FileText, CheckSquare, Square } from "lucide-react"
import { API_BASE_URL } from "@/config/api"

const PER_PAGE = 20

export default function DataDokumen() {
  const [skemaList, setSkemaList] = useState<any[]>([])
  const [selectedSkema, setSelectedSkema] = useState("")
  const [pesertaList, setPesertaList] = useState<any[]>([])
  const [pesertaLoading, setPesertaLoading] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [lastPage, setLastPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const token = localStorage.getItem("access_token") || ""

  useEffect(() => {
    fetch(`${API_BASE_URL}/penyusun/skema`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(j => {
        const d = j.data || j
        setSkemaList(Array.isArray(d) ? d : [])
      })
      .catch(() => {})
  }, [token])

  useEffect(() => { setPage(1) }, [selectedSkema, search])
  useEffect(() => { setSelectedIds(new Set()) }, [pesertaList])

  const fetchPeserta = useCallback(async () => {
    if (!selectedSkema) { setPesertaList([]); setTotal(0); return }
    setPesertaLoading(true)
    setError("")

    const params = new URLSearchParams()
    if (search.trim()) params.set("search", search.trim())
    params.set("per_page", String(PER_PAGE))
    params.set("page", String(page))

    fetch(`${API_BASE_URL}/kan/config/praktisi-by-jabatan/${selectedSkema}?${params.toString()}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error("Gagal ambil peserta"); return r.json() })
      .then(j => {
        const d = j.data || j
        if (d.data && Array.isArray(d.data)) {
          setPesertaList(d.data)
          setTotal(d.total || 0)
          setLastPage(d.last_page || 1)
        } else if (Array.isArray(d)) {
          setPesertaList(d)
          setTotal(d.length)
          setLastPage(1)
        } else {
          setPesertaList([])
          setTotal(0)
          setLastPage(1)
        }
      })
      .catch((err: any) => setError(err.message))
      .finally(() => setPesertaLoading(false))
  }, [selectedSkema, search, page, token])

  useEffect(() => {
    const timer = setTimeout(fetchPeserta, 300)
    return () => clearTimeout(timer)
  }, [fetchPeserta])

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === pesertaList.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pesertaList.map(p => p.id)))
    }
  }

  const handleDownload = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/kan/asesmen/${id}/generate-pdf`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Gagal download")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `dokumen-kan-${id}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleBulkDownload = async () => {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    setError("")
    try {
      const res = await fetch(`${API_BASE_URL}/kan/asesmen/bulk-generate-pdf`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })
      if (!res.ok) {
        const msg = (await res.json().catch(() => null))?.message || "Gagal download bulk"
        throw new Error(msg)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "dokumen-kan-bulk.zip"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBulkLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Data Dokumen</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Daftar praktisi per skema</p>
      </div>

      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div className="w-72">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pilih Skema</label>
          <select value={selectedSkema} onChange={(e) => { setSelectedSkema(e.target.value); setSearch("") }}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
            <option value="">-- Pilih Skema --</option>
            {skemaList.map((s: any) => (
              <option key={s.id} value={s.id}>{s.jabatan_kerja || s.nama}</option>
            ))}
          </select>
        </div>
        {selectedSkema && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari praktisi..." disabled={pesertaLoading}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {pesertaLoading ? (
        <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
          <p className="text-slate-400 dark:text-slate-500">Memuat peserta...</p>
        </div>
      ) : !selectedSkema ? (
        <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400">Pilih skema buat lihat praktisi</p>
        </div>
      ) : pesertaList.length === 0 ? (
        <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
          <p className="text-slate-400 dark:text-slate-500">{search ? "Tidak ada praktisi cocok" : "Belum ada praktisi"}</p>
        </div>
      ) : (
        <>
          {selectedIds.size > 0 && (
            <div className="mb-3 flex items-center gap-3">
              <span className="text-sm text-slate-600 dark:text-slate-400">{selectedIds.size} terpilih</span>
              <button onClick={handleBulkDownload} disabled={bulkLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                {bulkLoading ? "Memproses..." : `Download ${selectedIds.size} Praktisi`}
              </button>
            </div>
          )}

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-600 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="w-10 py-3 px-2 text-center">
                    <button onClick={toggleSelectAll} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                      {selectedIds.size === pesertaList.length
                        ? <CheckSquare className="w-4 h-4" />
                        : <Square className="w-4 h-4" />
                      }
                    </button>
                  </th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">Praktisi</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300 hidden sm:table-cell">Email</th>
                  <th className="text-center py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pesertaList.map((p: any) => (
                  <tr key={p.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="py-3 px-2 text-center">
                      <button onClick={() => toggleSelect(p.id)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                        {selectedIds.has(p.id)
                          ? <CheckSquare className="w-4 h-4 text-blue-600" />
                          : <Square className="w-4 h-4" />
                        }
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{p.user?.name || "-"}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 text-xs hidden sm:table-cell">{p.user?.email || "-"}</td>
                    <td className="py-3 px-3 text-center">
                      <button onClick={() => handleDownload(p.id)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs font-medium whitespace-nowrap">
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {lastPage > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
              <span>{total} peserta</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <span className="px-2">{page}/{lastPage}</span>
                <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page >= lastPage}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
