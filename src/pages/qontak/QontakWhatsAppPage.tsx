import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MessageCircle,
  Send,
  Settings,
  CheckCircle2,
  XCircle,
  Loader2,
  Key,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import {
  qontakService,
  QontakService,
  type QontakConfig,
  type TemplateParams,
  type QontakLogEntry,
} from "@/lib/qontak-service"

export default function QontakWhatsAppPage() {
  // --- Config state ---
  const [config, setConfig] = useState<QontakConfig>(qontakService.getConfig())
  const [configOpen, setConfigOpen] = useState(!qontakService.isReady())
  const [savingConfig, setSavingConfig] = useState(false)
  const [generatingToken, setGeneratingToken] = useState(false)
  const [tokenMsg, setTokenMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // --- Send form state (pre-filled for quick testing) ---
  const [form, setForm] = useState({
    phone: "081234567890",
    nama_asesi: "Nama Asesi",
    tanggal_uji: "15 Mei 2026",
    tuk: "TUK Jakarta - Jl. Sudirman No. 123",
    skema: "Teknisi Jaringan Madya",
    link: "https://sisuj.example.com/asesi/praasesmen/123",
  })
  const [sending, setSending] = useState(false)
  const [sendMsg, setSendMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // --- Logs ---
  const [logs, setLogs] = useState<QontakLogEntry[]>(QontakService.getLogs())

  useEffect(() => {
    setLogs(QontakService.getLogs())
  }, [])

  // --- Config handlers ---
  const handleSaveConfig = () => {
    setSavingConfig(true)
    qontakService.saveConfig(config)
    setSavingConfig(false)
    setTokenMsg(null)
  }

  const handleRefreshToken = async () => {
    setGeneratingToken(true)
    setTokenMsg(null)
    try {
      const data = await qontakService.refreshToken()
      setConfig(qontakService.getConfig())
      setTokenMsg({
        type: "success",
        text: `Token berhasil di-refresh. Berlaku ${Math.round(data.expires_in / 86400)} hari.`,
      })
    } catch (err) {
      setTokenMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal refresh token",
      })
    } finally {
      setGeneratingToken(false)
    }
  }

  // --- Send handler ---
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setSendMsg(null)

    const params: TemplateParams = {
      nama_asesi: form.nama_asesi,
      tanggal_uji: form.tanggal_uji,
      tuk: form.tuk,
      skema: form.skema,
      link: form.link,
    }

    try {
      const res = await qontakService.sendMessage(form.phone, params)
      const log: QontakLogEntry = {
        id: res.data?.id || crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        to: form.phone,
        nama: form.nama_asesi,
        status: "success",
        response: res,
      }
      QontakService.addLog(log)
      setLogs(QontakService.getLogs())
      setSendMsg({ type: "success", text: `Pesan berhasil dikirim ke ${form.phone}` })
      setForm({ phone: "", nama_asesi: "", tanggal_uji: "", tuk: "", skema: "", link: "" })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Gagal mengirim pesan"
      const log: QontakLogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        to: form.phone,
        nama: form.nama_asesi,
        status: "error",
        error: errorMsg,
      }
      QontakService.addLog(log)
      setLogs(QontakService.getLogs())
      setSendMsg({ type: "error", text: errorMsg })
    } finally {
      setSending(false)
    }
  }

  const handleClearLogs = () => {
    QontakService.clearLogs()
    setLogs([])
  }

  const inputClass =
    "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-green-600" />
          WhatsApp Qontak
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Kirim notifikasi uji kompetensi ke asesi via WhatsApp
        </p>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant={qontakService.hasToken() ? "default" : "destructive"}>
          {qontakService.hasToken() ? "✓ Token aktif" : "✗ Token belum ada"}
        </Badge>
        <Badge variant={config.channel_integration_id ? "default" : "outline"}>
          {config.channel_integration_id ? "✓ Channel terhubung" : "○ Channel belum diisi"}
        </Badge>
        <Badge variant={config.message_template_id ? "default" : "outline"}>
          {config.message_template_id ? "✓ Template siap" : "○ Template belum diisi"}
        </Badge>
      </div>

      {/* Config Card */}
      <Card>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setConfigOpen(!configOpen)}
        >
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Pengaturan Qontak
            </span>
            {configOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CardTitle>
        </CardHeader>
        {configOpen && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Base URL
                </label>
                <input
                  type="text"
                  value={config.base_url}
                  onChange={(e) => setConfig({ ...config, base_url: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Channel Integration ID
                </label>
                <input
                  type="text"
                  value={config.channel_integration_id}
                  onChange={(e) =>
                    setConfig({ ...config, channel_integration_id: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Message Template ID
                </label>
                <input
                  type="text"
                  value={config.message_template_id}
                  onChange={(e) =>
                    setConfig({ ...config, message_template_id: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={handleSaveConfig} disabled={savingConfig} size="sm">
                {savingConfig ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Simpan Konfigurasi
              </Button>
              <Button
                onClick={handleRefreshToken}
                disabled={generatingToken}
                variant="secondary"
                size="sm"
              >
                {generatingToken ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Key className="w-4 h-4 mr-2" />
                )}
                Refresh Token
              </Button>
            </div>

            {tokenMsg && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  tokenMsg.type === "success"
                    ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {tokenMsg.text}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Send Message Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="w-4 h-4" />
            Kirim Notifikasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  No. WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClass}
                  placeholder="08xxxxxxxxxx atau 628xxxxxxxxxx"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nama Asesi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nama_asesi}
                  onChange={(e) => setForm({ ...form, nama_asesi: e.target.value })}
                  className={inputClass}
                  placeholder="Nama lengkap asesi"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Uji <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.tanggal_uji}
                  onChange={(e) => setForm({ ...form, tanggal_uji: e.target.value })}
                  className={inputClass}
                  placeholder="15 Mei 2026"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  TUK <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.tuk}
                  onChange={(e) => setForm({ ...form, tuk: e.target.value })}
                  className={inputClass}
                  placeholder="TUK Jakarta - Jl. Sudirman No. 123"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Skema Sertifikasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.skema}
                  onChange={(e) => setForm({ ...form, skema: e.target.value })}
                  className={inputClass}
                  placeholder="Teknisi Jaringan Madya"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Link Sistem <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  className={inputClass}
                  placeholder="https://app.example.com/asesi/praasesmen/123"
                  required
                />
              </div>
            </div>

            {sendMsg && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  sendMsg.type === "success"
                    ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {sendMsg.text}
              </div>
            )}

            <Button type="submit" disabled={sending || !qontakService.isReady()} className="w-full">
              {sending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Kirim WhatsApp
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Logs Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Riwayat Pengiriman
              {logs.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {logs.length}
                </Badge>
              )}
            </span>
            {logs.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearLogs}>
                <Trash2 className="w-3 h-3 mr-1" />
                Hapus
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
              Belum ada riwayat pengiriman
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm"
                >
                  {log.status === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {log.nama}
                      </span>
                      <span className="text-slate-500">({log.to})</span>
                    </div>
                    {log.error && (
                      <p className="text-red-500 text-xs mt-1">{log.error}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(log.timestamp).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
