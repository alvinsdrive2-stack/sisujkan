import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, TrendingUp, Calendar } from "lucide-react"

export default function DashboardAdminLSP() {
  const stats = [
    { title: "Total Asesi", value: "1,234", change: "+12%", note: "dari bulan lalu" },
    { title: "Sertifikasi Aktif", value: "56", change: "+5%", note: "dari bulan lalu" },
    { title: "Asesmen Hari Ini", value: "23", change: null, note: "Stabil bulan ini" },
    { title: "Tingkat Kelulusan", value: "87%", change: "+3%", note: "dari bulan lalu" },
  ]

  const recentActivities = [
    { id: 1, text: "Asesi John Doe menyelesaikan asesmen", time: "5 menit lalu", type: "success" },
    { id: 2, text: "Sertifikasi baru dibuat", time: "15 menit lalu", type: "info" },
    { id: 3, text: "Asesor Jane Smith memperbarui hasil", time: "1 jam lalu", type: "info" },
    { id: 4, text: "3 asesi terdaftar untuk sertifikasi", time: "2 jam lalu", type: "success" }
  ]

  const upcomingSchedule = [
    { id: 1, title: "Asesmen Teknisi Jaringan", date: "20 Jan 2025", time: "08:00", location: "TUK 1", status: "scheduled" },
    { id: 2, title: "Asesmen Administrator", date: "21 Jan 2025", time: "09:00", location: "TUK 2", status: "scheduled" },
    { id: 3, title: "Asesmen Digital Marketing", date: "22 Jan 2025", time: "08:00", location: "TUK 3", status: "scheduled" }
  ]

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Admin LSP</h2>
        <p className="text-slate-600">Overview aktivitas sertifikasi</p>
      </div>

      {/* Stats Strip */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100">
            {stats.map((stat, index) => (
              <div key={index} className="px-6 py-5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.title}</p>
                <p className="text-3xl font-semibold text-slate-900 mt-1 tabular-nums">{stat.value}</p>
                <p className={`text-xs mt-1 ${stat.change?.startsWith('+') ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {stat.change ? `${stat.change} ${stat.note}` : stat.note}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${activity.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                  <div className="flex-1">
                    <p className="text-sm text-slate-800">{activity.text}</p>
                    <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Jadwal Mendatang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingSchedule.map((schedule) => (
                <div key={schedule.id} className="p-3 border border-slate-200 rounded-lg hover:border-primary transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-slate-800">{schedule.title}</h4>
                    <Badge variant="outline" className="text-xs">Scheduled</Badge>
                  </div>
                  <p className="text-xs text-slate-600">{schedule.date} • {schedule.time}</p>
                  <p className="text-xs text-slate-500">{schedule.location}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section (Placeholder for actual chart) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Statistik Sertifikasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
            <p className="text-slate-500">Chart akan ditampilkan di sini</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
