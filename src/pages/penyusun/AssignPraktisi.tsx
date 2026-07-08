import { useState, useEffect, useCallback } from "react"
import { API_BASE_URL } from "@/config/api"

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
}

type Page = "list" | "add"

export default function AssignPraktisi() {
  const [jabkerList, setJabkerList] = useState<Jabker[]>([])
  const [selectedJabker, setSelectedJabker] = useState("")
  const [praktisiList, setPraktisiList] = useState<PraktisiItem[]>([])
  const [praktisiLoading, setPraktisiLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Add modal state
  const [page, setPage] = useState<Page>("list")
  const [newUserId, setNewUserId] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const token = localStorage.getItem("access_token") || ""

  useEffect(() => {
    setPraktisiLoading(true)
    fetch(`${API_BASE_URL}/penyusun/jabker`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(j => {
        const d = j.data || j
        setJabkerList(Array.isArray(d) ? d : [])
      })
      .catch(() => {})
      .finally(() => setPraktisiLoading(false))
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
    } catch (err: any) {
      setError(err.message)
      setPraktisiList([])
    }
    setPraktisiLoading(false)
  }, [selectedJabker, token])

  useEffect(() => {
    loadPraktisi()
  }, [loadPraktisi])

  const handleAssign = async () => {
    if (!newUserId.trim()) return
    setSubmitting(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch(`${API_BASE_URL}/kan/config/assign-praktisi`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id_jabatan_kerja: selectedJabker, id_user: Number(newUserId) }),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || `Gagal assign (${res.status})`)
      }
      setSuccess("Praktisi berhasil ditambahkan")
      setNewUserId("")
      setPage("list")
      loadPraktisi()
    } catch (err: any) {
      setError(err.message)
    }
    setSubmitting(false)
  }

  const handleRemove = async (idUser: number) => {
    if (!confirm("Hapus praktisi ini dari jabatan kerja?")) return
    setError("")
    setSuccess("")
    try {
      const res = await fetch(`${API_BASE_URL}/kan/config/assign-praktisi`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id_jabatan_kerja: selectedJabker, id_user: idUser }),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || `Gagal hapus (${res.status})`)
      }
      setSuccess("Praktisi berhasil dihapus")
      loadPraktisi()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const selectedJabkerName = jabkerList.find(j => j.id_jabatan_kerja === selectedJabker)?.jabatan_kerja || selectedJabker

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Assign Praktisi</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Atur praktisi/asesor untuk setiap jabatan kerja</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg text-sm text-green-600">{success}</div>}

      {/* Jabker Selector */}
      <div className="mb-6 max-w-xs">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pilih Jabatan Kerja</label>
        <select
          value={selectedJabker}
          onChange={(e) => { setSelectedJabker(e.target.value); setPage("list") }}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
        >
          <option value="">-- Pilih Jabatan --</option>
          {jabkerList.map((j) => (
            <option key={j.id_jabatan_kerja} value={j.id_jabatan_kerja}>{j.jabatan_kerja}</option>
          ))}
        </select>
      </div>

      {!selectedJabker ? (
        <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
          <p className="text-slate-400">Pilih jabatan kerja untuk lihat daftar praktisi</p>
        </div>
      ) : page === "add" ? (
        /* Add Form */
        <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-6 max-w-md">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Tambah Praktisi ke {selectedJabkerName}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ID User</label>
              <input
                type="number"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm"
                placeholder="Masukkan ID user praktisi"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAssign}
                disabled={submitting || !newUserId.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                onClick={() => { setPage("list"); setError(""); setNewUserId("") }}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Praktisi List */
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">
              Daftar Praktisi — {selectedJabkerName}
            </h3>
            <button
              onClick={() => setPage("add")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
            >
              + Tambah Praktisi
            </button>
          </div>

          {praktisiLoading ? (
            <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
              <p className="text-slate-400">Memuat data...</p>
            </div>
          ) : praktisiList.length === 0 ? (
            <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
              <p className="text-slate-400">Belum ada praktisi untuk jabatan ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-600 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">Nama</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">Email</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">No. Registrasi</th>
                    <th className="text-center py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {praktisiList.map((p) => (
                    <tr key={p.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-200 font-medium">{p.user?.name || "-"}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 text-xs">{p.user?.email || "-"}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 text-xs">{p.user?.noreg || "-"}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleRemove(p.id_user)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 text-xs font-medium"
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
        </div>
      )}
    </div>
  )
}
