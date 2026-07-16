import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Search, ChevronLeft, ChevronRight, UserPlus, Trash2, ExternalLink, CheckCircle2, Clock } from "lucide-react"
import { API_BASE_URL } from "@/config/api"

const PAGE_SIZE = 8

interface Jabker {
  id_jabatan_kerja: string
  jabatan_kerja: string
}

interface PraktisiItem {
  id: number
  id_jabatan_kerja: string
  id_user: number
  user: {
    id: number
    name: string
    email: string
    phone: string
    noreg: string
  }
  jabatan_kerja: {
    id_jabatan_kerja: string
    jabatan_kerja: string
  }
  ttd_status?: {
    IA04B: boolean
    IA05: boolean
    IA06: boolean
    AK02: boolean
    selesai: boolean
  }
}


function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="overflow-x-auto border border-slate-200 dark:border-slate-600 rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-700">
          <tr>
            <th className="py-3 px-3 font-semibold text-slate-600">Nama</th>
            <th className="py-3 px-3 font-semibold text-slate-600">Email</th>
            <th className="py-3 px-3 font-semibold text-slate-600">Registrasi</th>
            <th className="py-3 px-3 font-semibold text-slate-600 text-center">Status</th>
            <th className="py-3 px-3 font-semibold text-slate-600 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-t border-slate-100">
              {[30, 35, 15, 10, 10].map((_, j) => (
                <td key={j} className="py-3 px-3">
                  <div className={`h-4 rounded bg-slate-200 animate-pulse ${j >= 3 ? "mx-auto w-12" : ""}`}
                    style={{ maxWidth: j < 2 ? `${60 + Math.random() * 40}%` : undefined }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AssignPraktisi() {
  const navigate = useNavigate()
  const [jabkerList, setJabkerList] = useState<Jabker[]>([])
  const [jabkerLoading, setJabkerLoading] = useState(false)
  const [selectedJabker, setSelectedJabker] = useState("")
  const [praktisiList, setPraktisiList] = useState<PraktisiItem[]>([])
  const [praktisiLoading, setPraktisiLoading] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  // Add form state
  const [showAdd, setShowAdd] = useState(false)
  const [newUserId, setNewUserId] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const token = localStorage.getItem("access_token") || ""

  useEffect(() => {
    setJabkerLoading(true)
    fetch(`${API_BASE_URL}/penyusun/jabker`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(j => { const d = j.data || j; setJabkerList(Array.isArray(d) ? d : []) })
      .catch(() => {})
      .finally(() => setJabkerLoading(false))
  }, [token])

  const loadPraktisi = useCallback(async () => {
    if (!selectedJabker) { setPraktisiList([]); return }
    setPraktisiLoading(true)
    setError("")
    try {
      const res = await fetch(`${API_BASE_URL}/kan/config/praktisi-by-jabatan/${selectedJabker}?all=true`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Gagal ambil data praktisi")
      const j = await res.json()
      const d = j.data || j
      setPraktisiList(Array.isArray(d) ? d : [])
    } catch (err: any) { setError(err.message); setPraktisiList([]) }
    setPraktisiLoading(false)
  }, [selectedJabker, token])

  useEffect(() => { loadPraktisi() }, [loadPraktisi])
  useEffect(() => { setPage(1) }, [search, selectedJabker])

  const filtered = useMemo(() => {
    if (!search.trim()) return praktisiList
    const q = search.toLowerCase()
    return praktisiList.filter(p =>
      (p.user?.name || "").toLowerCase().includes(q) ||
      (p.user?.email || "").toLowerCase().includes(q) ||
      (p.user?.noreg || "").toLowerCase().includes(q)
    )
  }, [praktisiList, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const handleAssign = async () => {
    if (!newUserId.trim()) return
    setSubmitting(true)
    setError(""); setSuccess("")
    try {
      const res = await fetch(`${API_BASE_URL}/kan/config/assign-praktisi`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id_jabatan_kerja: selectedJabker, id_user: Number(newUserId) }),
      })
      if (!res.ok) { const ej = await res.json().catch(() => ({})); throw new Error(ej.message || `Gagal (${res.status})`) }
      setSuccess("Praktisi berhasil ditambahkan")
      setNewUserId(""); setShowAdd(false)
      loadPraktisi()
    } catch (err: any) { setError(err.message) }
    setSubmitting(false)
  }

  const handleRemove = async (idUser: number) => {
    if (!confirm("Hapus praktisi ini dari jabatan kerja?")) return
    setRemovingId(idUser)
    setError(""); setSuccess("")
    try {
      const res = await fetch(`${API_BASE_URL}/kan/config/assign-praktisi`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id_jabatan_kerja: selectedJabker, id_user: idUser }),
      })
      if (!res.ok) { const ej = await res.json().catch(() => ({})); throw new Error(ej.message || `Gagal (${res.status})`) }
      setSuccess("Praktisi berhasil dihapus")
      loadPraktisi()
    } catch (err: any) { setError(err.message) }
    setRemovingId(null)
  }

  const statusBadge = (p: PraktisiItem) => {
    const s = p.ttd_status
    if (!s) return null
    if (s.selesai) return <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><CheckCircle2 className="w-3 h-3" />Selesai</span>
    const done = [s.IA04B, s.IA05, s.IA06].filter(Boolean).length
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"><Clock className="w-3 h-3" />{done}/3</span>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Assign Praktisi</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Atur praktisi untuk setiap jabatan kerja</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">{success}</div>}

      {/* Jabker Selector */}
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div className="w-72">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pilih Jabatan Kerja</label>
          <div className="relative">
            <select value={selectedJabker} onChange={(e) => { setSelectedJabker(e.target.value); setShowAdd(false) }}
              disabled={jabkerLoading}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm disabled:opacity-50">
              <option value="">-- Pilih Jabatan --</option>
              {jabkerList.map(j => <option key={j.id_jabatan_kerja} value={j.id_jabatan_kerja}>{j.jabatan_kerja}</option>)}
            </select>
          </div>
        </div>
        {selectedJabker && (
          <button onClick={() => navigate(`/penyusun/detail-jabker/${selectedJabker}`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
            <ExternalLink className="w-4 h-4" /> Detail Jabker
          </button>
        )}
      </div>

      {!selectedJabker ? (
        <div className="border border-dashed border-slate-300 rounded-lg p-12 text-center">
          <UserPlus className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-400">Pilih jabatan kerja untuk lihat daftar praktisi</p>
        </div>
      ) : (
        <div>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari praktisi..." disabled={praktisiLoading}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{filtered.length} praktisi</span>
              <button onClick={() => { setShowAdd(!showAdd); setError(""); setNewUserId("") }}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                <UserPlus className="w-4 h-4" /> Tambah
              </button>
            </div>
          </div>

          {/* Add Form inline */}
          {showAdd && (
            <div className="mb-4 p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ID User</label>
                <input type="number" value={newUserId} onChange={e => setNewUserId(e.target.value)}
                  className="w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" placeholder="ID user" />
              </div>
              <button onClick={handleAssign} disabled={submitting || !newUserId.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium">
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
              <button onClick={() => setShowAdd(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium">
                Batal
              </button>
            </div>
          )}

          {/* Table */}
          {praktisiLoading ? <TableSkeleton rows={4} />
          : filtered.length === 0 ? (
            <div className="border border-dashed border-slate-300 rounded-lg p-12 text-center">
              <p className="text-slate-400">{search ? "Tidak ada praktisi cocok" : "Belum ada praktisi"}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-600 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">Nama</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300 hidden sm:table-cell">Email</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300 hidden md:table-cell">Registrasi</th>
                      <th className="text-center py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                      <th className="text-center py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((p) => (
                      <tr key={p.id} className={`border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${removingId === p.id_user ? "opacity-50" : ""}`}>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-700 dark:text-slate-200">{p.user?.name || "-"}</span>
                            {p.user?.phone && <span className="text-xs text-slate-400 hidden lg:inline">{p.user.phone}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-xs hidden sm:table-cell">{p.user?.email || "-"}</td>
                        <td className="py-3 px-3 text-slate-600 text-xs hidden md:table-cell">{p.user?.noreg || "-"}</td>
                        <td className="py-3 px-3 text-center">{statusBadge(p)}</td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => navigate(`/praktisi/kerja/${p.id}`)}
                              className="text-blue-600 hover:text-blue-800 text-xs p-1" title="Lihat detail">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleRemove(p.id_user)} disabled={removingId === p.id_user}
                              className="text-red-500 hover:text-red-700 text-xs p-1 disabled:opacity-40" title="Hapus">
                              {removingId === p.id_user ? <span className="text-xs">...</span> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
                  <span>{filtered.length} praktisi</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                      className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="px-2">{page}/{totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                      className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
