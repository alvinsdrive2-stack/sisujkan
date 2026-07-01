import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Calendar, Users, CheckCircle2, Clock, ChevronRight, ChevronLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useKegiatanAdminTUK } from "@/hooks/useKegiatan"
import { formatDateWIB, formatTimeWIB } from "@/lib/date-utils"
import { SimpleSpinner } from "@/components/ui/loading-spinner"
import { useState } from "react"
import { jenisKelasLabel } from "@/lib/utils"

export default function DashboardAdminTUK() {
  const navigate = useNavigate()
  const { kegiatans, isLoading, error } = useKegiatanAdminTUK()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Pagination logic
  const totalPages = Math.ceil(kegiatans.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedKegiatans = kegiatans.slice(startIndex, endIndex)

  const _adminTukStats = [
    {
      title: "Kegiatan Terjadwal",
      value: isLoading ? "..." : kegiatans.length.toString(),
      change: "mendatang",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Total Asesi",
      value: "78",
      change: "terdaftar",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Perlu Verifikasi",
      value: "12",
      change: "pending",
      icon: Shield,
      color: "text-amber-600",
      bgColor: "bg-amber-50"
    },
    {
      title: "Tersertifikasi",
      value: "156",
      change: "bulan ini",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    }
  ]
  // Prevent unused variable warning - stats reserved for future UI
  void _adminTukStats.length

  const getStatusBadge = (_isStarted: string, tahap: number) => {
    // is_started = "0" → Belum Mulai
    if (tahap === 0) {
      return (
        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300">
          Belum Mulai
        </Badge>
      )
    }
    // tahap = "1" → Tahap 1 - Pra-Asesmen
    if (tahap === 1) {
      return (
        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300">
          Pra-Asesmen
        </Badge>
      )
    }

    // tahap = "2" → Tahap 2 - Asesmen
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300">
        Asesmen
      </Badge>
    )
  }

  const formatDateTime = (dateTime: string) => formatTimeWIB(dateTime)

  const formatDateString = (dateTime: string) => formatDateWIB(dateTime)

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Admin TUK</h2>
        <p className="text-slate-600">Kelola verifikasi asesi dan kegiatan asesmen</p>
      </div>

      {/* Admin TUK Stats */}
      
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Jadwal Mendatang
            {isLoading && <SimpleSpinner size="sm" className="ml-2 text-primary" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border border-slate-200 rounded-lg animate-pulse">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="h-5 bg-slate-200 rounded w-48 mb-2"></div>
                      <div className="h-4 bg-slate-200 rounded w-64 mb-1"></div>
                      <div className="h-3 bg-slate-200 rounded w-96"></div>
                    </div>
                    <div className="h-6 bg-slate-200 rounded w-20"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-4 bg-slate-200 rounded w-16"></div>
                      <div className="h-4 bg-slate-200 rounded w-24"></div>
                      <div className="h-4 bg-slate-200 rounded w-16"></div>
                    </div>
                    <div className="h-9 bg-slate-200 rounded w-28"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Gagal memuat jadwal: {error}
            </div>
          ) : kegiatans.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Tidak ada jadwal mendatang
            </div>
          ) : (
            <>
            <div className="space-y-3">
              {paginatedKegiatans.map((kegiatan) => (
                <div
                  key={kegiatan.jadwal_id}
                  onClick={() => navigate(`/admin-tuk/list-asesi/${kegiatan.jadwal_id}`)}
                  className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary cursor-pointer transition-all hover:shadow-md bg-white dark:bg-slate-800"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-100">{kegiatan.nama_kegiatan}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {kegiatan.asesor?.nama?.toUpperCase() || ''}{kegiatan.asesor2 ? ` & ${kegiatan.asesor2.nama?.toUpperCase() || ''}` : ''} • {kegiatan.tuk?.nama?.toUpperCase() || ''}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{kegiatan.tuk?.alamat || ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(kegiatan.is_started, kegiatan.tahap)}
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDateTime(kegiatan.tanggal_uji)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDateString(kegiatan.tanggal_uji)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {jenisKelasLabel(kegiatan.jenis_kelas)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                <div className="text-sm text-slate-600">
                  Menampilkan {startIndex + 1}-{Math.min(endIndex, kegiatans.length)} dari {kegiatans.length} kegiatan
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-slate-600">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Schedule */}
      
    </div>
  )
}
