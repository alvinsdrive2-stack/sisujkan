import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Clock, ChevronRight, Search, AlertCircle, UserCheck } from "lucide-react"
import { useKegiatanAsesorList } from "@/hooks/useKegiatan"
import { SimpleSpinner } from "@/components/ui/loading-spinner"
import { Pagination } from "@/components/ui/Pagination"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { useAsesorAbsenPending } from "@/hooks/useAsesorAbsenPending"
import { useAsesorPersiapanPending } from "@/hooks/useAsesorPersiapanPending"
import { jenisKelasLabel } from "@/lib/utils"
import { formatShortDateWIB, formatTimeWIB } from "@/lib/date-utils"

const TAHAP_CONFIG: Record<number, { title: string; badge: string; badgeClass: string }> = {
  0: { title: "Persiapan Asesmen", badge: "Belum Mulai", badgeClass: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
  1: { title: "Praasesmen", badge: "Pra-Asesmen", badgeClass: "bg-purple-100 text-purple-700 hover:bg-purple-200" },
  2: { title: "Asesmen", badge: "Asesmen", badgeClass: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
}

interface TahapListPageProps {
  tahap: 0 | 1 | 2
}

export default function TahapListPage({ tahap }: TahapListPageProps) {
  const navigate = useNavigate()
  const config = TAHAP_CONFIG[tahap]
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { kegiatans, isLoading, error, pagination } = useKegiatanAsesorList(true, page, search, tahap)
  const absenPending = useAsesorAbsenPending()
  const persiapanPending = useAsesorPersiapanPending()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{config.title}</h2>
        <p className="text-slate-600">Kegiatan di tahap {config.title.toLowerCase()}</p>
      </div>

      {pagination.total > 2 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kegiatan..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Daftar Kegiatan
            {isLoading && <SimpleSpinner size="sm" className="ml-2 text-primary" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-center py-8 text-red-500">
              Gagal memuat kegiatan: {error}
            </div>
          )}
          {!isLoading && !error && kegiatans.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              Tidak ada kegiatan di tahap {config.title.toLowerCase()}
            </div>
          )}
          {kegiatans.length > 0 && (
            <>
              <div className="space-y-3">
                {kegiatans.map((kegiatan) => (
                  <div
                    key={kegiatan.jadwal_id}
                    className="p-4 border border-slate-200 rounded-lg hover:shadow-md bg-white cursor-pointer"
                    onClick={() => navigate(`/asesor/asesi/${kegiatan.jadwal_id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800">{kegiatan.nama_kegiatan}</h4>
                        <p className="text-sm text-slate-600 mt-1">{kegiatan.tuk?.nama}</p>
                        <p className="text-xs text-slate-500">{kegiatan.tuk?.alamat}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={config.badgeClass}>
                          {config.badge}
                        </Badge>
                        <ChevronRight />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatShortDateWIB(kegiatan.tanggal_uji || '')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTimeWIB(kegiatan.tanggal_uji || '')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {jenisKelasLabel(kegiatan.jenis_kelas)}
                      </span>
                      {tahap > 0 && absenPending.perKegiatan[kegiatan.jadwal_id] > 0 && (
                        <span className="flex items-center gap-1 text-red-600 font-medium">
                          <AlertCircle className="w-4 h-4" />
                          {absenPending.perKegiatan[kegiatan.jadwal_id]} asesi belum anda selesaikan
                        </span>
                      )}
                      {tahap === 0 && persiapanPending.perKegiatan[kegiatan.jadwal_id] > 0 && (
                        <span className="flex items-center gap-1 text-blue-600 font-medium">
                          <UserCheck className="w-4 h-4" />
                          {persiapanPending.perKegiatan[kegiatan.jadwal_id]} asesi sudah isi APL02
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Pagination
                page={page}
                lastPage={pagination.lastPage}
                total={pagination.total}
                perPage={pagination.perPage}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
