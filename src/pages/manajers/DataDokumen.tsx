import { useState, useEffect, useCallback, useRef } from "react"
import {
  Search, ChevronLeft, ChevronRight, ChevronDown, Check, Download, FileText, CheckSquare, Square,
  Users, FolderOpen, Loader2
} from "lucide-react"
import { API_BASE_URL } from "@/config/api"

const PER_PAGE = 20

const fadeIn = {
  animation: 'fadeSlideIn 0.35s ease-out forwards'
}

const staggerDelays = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45]

const styles = `
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
}
.dark .skeleton {
  background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
  background-size: 200% 100%;
}
`

export default function DataDokumen() {
  const [skemaList, setSkemaList] = useState<any[]>([])
  const [selectedSkema, setSelectedSkema] = useState("")
  const [skemaOpen, setSkemaOpen] = useState(false)
  const [skemaQuery, setSkemaQuery] = useState("")
  const [pesertaList, setPesertaList] = useState<any[]>([])
  const [pesertaLoading, setPesertaLoading] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [lastPage, setLastPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [allLoading, setAllLoading] = useState(false)
  const [progress, setProgress] = useState<{ show: boolean; pct: number; status: string; error?: string }>({ show: false, pct: 0, status: '' })

  const token = localStorage.getItem("access_token") || ""
  const skemaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (skemaRef.current && !skemaRef.current.contains(e.target as Node)) {
        setSkemaOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const selectedSkemaItem = skemaList.find(s => String(s.id) === String(selectedSkema))
  const filteredSkema = skemaList.filter((s: any) =>
    (s.jabatan_kerja || s.nama || "").toLowerCase().includes(skemaQuery.toLowerCase())
  )

  const pickSkema = (id: any) => {
    setSelectedSkema(String(id))
    setSkemaQuery("")
    setSkemaOpen(false)
    setSearch("")
  }

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
    setDownloadingId(id)
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
    } finally {
      setDownloadingId(null)
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

  const handleDownloadAll = async () => {
    setAllLoading(true)
    setError("")
    const uid = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
    setProgress({ show: true, pct: 0, status: 'Memulai...' })

    try {
      // Trigger background job — return langsung (status=started)
      const startRes = await fetch(`${API_BASE_URL}/kan/asesmen/download-all-dokumen?token=${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (startRes.status === 202) {
        // sudah ada process berjalan dari request lain — lanjut polling
      } else if (!startRes.ok) {
        const msg = (await startRes.json().catch(() => null))?.message || "Gagal mulai proses"
        throw new Error(msg)
      }

      let done = false
      while (!done) {
        await new Promise(r => setTimeout(r, 2000))
        try {
          const pRes = await fetch(`${API_BASE_URL}/kan/asesmen/download-all-dokumen/progress?token=${uid}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          const pData = await pRes.json()
          if (pData.status === 'done') {
            setProgress(p => ({ ...p, pct: 100, status: 'Selesai, mendownload...' }))
            done = true
          } else if (pData.status === 'error') {
            throw new Error(pData.error || 'Gagal memproses dokumen')
          } else {
            setProgress(p => ({ ...p, pct: pData.progress ?? 0, status: `Memproses ${pData.done}/${pData.total} praktisi` }))
          }
        } catch (e: any) {
          if (e.message?.includes('Gagal memproses')) throw e
        }
      }

      const res = await fetch(`${API_BASE_URL}/kan/asesmen/download-all-dokumen?token=${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const msg = (await res.json().catch(() => null))?.message || "Gagal download ZIP"
        throw new Error(msg)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "dokumen-all-praktisi.zip"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message)
      setProgress(p => ({ ...p, status: 'error', error: err.message }))
      setTimeout(() => setProgress(p => ({ ...p, show: false })), 3000)
    } finally {
      setAllLoading(false)
      setProgress(p => ({ ...p, show: false }))
    }
  }

  const SkeletonRow = ({ index }: { index: number }) => (
    <tr className="border-t border-slate-100 dark:border-slate-700" style={{ ...fadeIn, animationDelay: `${staggerDelays[index % 10]}s` }}>
      {[1,2,3,4].map(c => (
        <td key={c} className="py-3 px-3">
          <div className="skeleton h-5 w-full" style={{ maxWidth: c === 3 ? '180px' : c === 4 ? '80px' : '100%' }} />
        </td>
      ))}
    </tr>
  )

  return (
    <div className="space-y-6">
      <style>{styles}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Data Dokumen</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Download dokumen praktisi per skema</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleDownloadAll} disabled={allLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none">
            {allLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {allLoading ? "Memproses..." : "Download All Praktisi"}
          </button>
          {selectedSkema && !pesertaLoading && pesertaList.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
              <Users className="w-3.5 h-3.5" />
              <span>{total} praktisi</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-full sm:w-72">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <FolderOpen className="w-full h-3.5 inline mr-1.5 -mt-0.5" />
              Pilih Skema
            </label>
            <div className="relative" ref={skemaRef}>
              <button type="button" onClick={() => setSkemaOpen(o => !o)}
                className="w-full flex items-center justify-between gap-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow">
                <span className={`truncate ${selectedSkemaItem ? '' : 'text-slate-400 dark:text-slate-500'}`}>
                  {selectedSkemaItem ? (selectedSkemaItem.jabatan_kerja || selectedSkemaItem.nama) : '-- Pilih Skema --'}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${skemaOpen ? 'rotate-180' : ''}`} />
              </button>

              {skemaOpen && (
                <div className="absolute z-20 mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
                  <div className="relative p-2 pb-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      autoFocus
                      type="text"
                      value={skemaQuery}
                      onChange={e => setSkemaQuery(e.target.value)}
                      placeholder="Cari skema..."
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-shadow"
                    />
                  </div>
                  <ul className="py-1 max-h-60 overflow-y-auto">
                    {filteredSkema.length === 0 ? (
                      <li className="px-3 py-2.5 text-sm text-slate-400 dark:text-slate-500 text-center">Skema tidak ditemukan</li>
                    ) : filteredSkema.map((s: any) => {
                      const label = s.jabatan_kerja || s.nama
                      const active = String(s.id) === String(selectedSkema)
                      return (
                        <li key={s.id}>
                          <button type="button" onClick={() => pickSkema(s.id)}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors ${
                              active
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}>
                            <span className="truncate">{label}</span>
                            {active && <Check className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
          {selectedSkema && (
            <div className="relative flex-1 w-full sm:max-w-xs">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:hidden">Cari</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari praktisi..." disabled={pesertaLoading}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow disabled:opacity-50" />
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={fadeIn} className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block shrink-0" />
          {error}
        </div>
      )}

      {/* Content */}
      {pesertaLoading && selectedSkema ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <div className="skeleton h-5 w-32" />
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                {['', 'Praktisi', 'Email', 'Aksi'].map(h => (
                  <th key={h} className="py-3 px-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} index={i} />)}
            </tbody>
          </table>
        </div>
      ) : !selectedSkema ? (
        <div style={fadeIn} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 mb-4">
            <FolderOpen className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">Belum pilih skema</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500">Pilih skema dulu buat lihat & download dokumen praktisi</p>
        </div>
      ) : pesertaList.length === 0 ? (
        <div style={fadeIn} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 mb-4">
            <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {search ? 'Praktisi tidak ditemukan' : 'Belum ada praktisi'}
          </h3>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {search ? 'Coba search dengan kata kunci lain' : 'Skema ini belum punya praktisi terdaftar'}
          </p>
        </div>
      ) : (
        <>
          {/* Bulk Download Bar */}
          <div style={fadeIn} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedIds.size > 0 && (
                <span className="text-sm text-slate-600 dark:text-slate-400 animate-pulse">
                  {selectedIds.size} praktisi dipilih
                </span>
              )}
            </div>
            {selectedIds.size > 0 && (
              <button onClick={handleBulkDownload} disabled={bulkLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none">
                {bulkLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {bulkLoading ? "Memproses..." : `Download ${selectedIds.size} Berkas`}
              </button>
            )}
          </div>

          {/* Table Card */}
          <div style={fadeIn} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="w-12 py-4 px-2 text-center">
                      <button onClick={toggleSelectAll}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        {selectedIds.size === pesertaList.length
                          ? <CheckSquare className="w-4.5 h-4.5 text-blue-600" />
                          : <Square className="w-4.5 h-4.5" />
                        }
                      </button>
                    </th>
                    <th className="text-left py-4 px-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Praktisi</th>
                    <th className="text-left py-4 px-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider hidden sm:table-cell">Email</th>
                    <th className="text-center py-4 px-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {pesertaList.map((p: any, i: number) => (
                    <tr key={p.id}
                      className={`group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-150 ${
                        selectedIds.has(p.id) ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''
                      }`}
                      style={{ ...fadeIn, animationDelay: `${staggerDelays[i % 10]}s` }}>
                      <td className="py-3.5 px-2 text-center">
                        <button onClick={() => toggleSelect(p.id)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                          {selectedIds.has(p.id)
                            ? <CheckSquare className="w-4.5 h-4.5 text-blue-600" />
                            : <Square className="w-4.5 h-4.5 group-hover:text-slate-500" />
                          }
                        </button>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0 shadow-sm">
                            {(p.user?.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-slate-700 dark:text-slate-200">{p.user?.name || '-'}</span>
                            {p.user?.noreg && (
                              <span className="block text-xs text-slate-400 dark:text-slate-500 mt-0.5">Reg. {p.user.noreg}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 text-xs hidden sm:table-cell">
                        {p.user?.email || '-'}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button onClick={() => handleDownload(p.id)} disabled={downloadingId === p.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none">
                          {downloadingId === p.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          {downloadingId === p.id ? 'Downloading...' : 'Download'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {lastPage > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Halaman {page} dari {lastPage} ({total} praktisi)
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                    className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent transition-colors">
                    <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>
                  {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => {
                    let pageNum: number
                    if (lastPage <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= lastPage - 2) {
                      pageNum = lastPage - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    return (
                      <button key={pageNum} onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                          page === pageNum
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}>
                        {pageNum}
                      </button>
                    )
                  })}
                  <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page >= lastPage}
                    className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent transition-colors">
                    <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Progress Modal */}
      {progress.show && (
        <div style={fadeIn} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 w-full max-w-sm mx-4">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
                Download All Praktisi
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{progress.status}</p>

              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress.pct}%` }} />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1.5 block">
                {progress.pct}%
              </span>

              {progress.status === 'error' && (
                <p className="text-xs text-red-500 mt-2">{progress.error}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
