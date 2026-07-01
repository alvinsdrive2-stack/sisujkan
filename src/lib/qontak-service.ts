const QONTAK_BASE_URL = "/api/qontak"

export interface QontakConfig {
  base_url: string
  access_token: string
  refresh_token: string
  channel_integration_id: string
  message_template_id: string
}

export interface QontakTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  created_at: number
}

export interface QontakSendMessageResponse {
  data: {
    id: string
    status: string
    to: string
    created_at: string
  }
}

export interface QontakLogEntry {
  id: string
  timestamp: string
  to: string
  nama: string
  status: "success" | "error"
  response?: unknown
  error?: string
}

export interface TemplateParams {
  nama_asesi: string
  tanggal_uji: string
  tuk: string
  skema: string
  link: string
}

const STORAGE_KEY = "qontak_config"
const LOGS_KEY = "qontak_logs"

export class QontakService {
  private config: QontakConfig

  constructor() {
    this.config = this.loadConfig()
  }

  private loadConfig(): QontakConfig {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return this.defaultConfig()
      }
    }
    return this.defaultConfig()
  }

  private defaultConfig(): QontakConfig {
    return {
      base_url: QONTAK_BASE_URL,
      access_token: "Cy3t1cy6JQ7yH7Vk5d58Y-htoBs0-k8WIrfT8LLoAUo",
      refresh_token: "txVZIlbGeyeEZJMAxX_Y0RlCpiLOKqbILUTQ0CyPxxw",
      channel_integration_id: "b1fc9860-aed8-4b9f-a6f4-11d1e757eb88",
      message_template_id: "70d0d28c-d5fb-4076-99ee-86b2f366f1a2",
    }
  }

  saveConfig(config: QontakConfig): void {
    this.config = config
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }

  getConfig(): QontakConfig {
    return { ...this.config }
  }

  hasToken(): boolean {
    return !!this.config.access_token
  }

  isReady(): boolean {
    return !!(
      this.config.access_token &&
      this.config.channel_integration_id &&
      this.config.message_template_id
    )
  }

  async refreshToken(): Promise<QontakTokenResponse> {
    if (!this.config.refresh_token) {
      throw new Error("refresh_token tidak tersedia")
    }

    const response = await fetch("/api/qontak-auth/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refresh_token: this.config.refresh_token,
        grant_type: "refresh_token",
        client_id: "RRrn6uIxalR_QaHFlcKOqbjHMG63elEdPTair9B9YdY",
        client_secret: "Sa8IGIh_HpVK1ZLAF0iFf7jU760osaUNV659pBIZR00",
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(err.message || `HTTP ${response.status}`)
    }

    const data: QontakTokenResponse = await response.json()

    this.config.access_token = data.access_token
    this.config.refresh_token = data.refresh_token
    this.saveConfig(this.config)

    return data
  }

  async sendMessage(to: string, params: TemplateParams, toName?: string): Promise<QontakSendMessageResponse> {
    if (!this.isReady()) {
      throw new Error("Konfigurasi belum lengkap. Isi semua field di Pengaturan.")
    }

    // Normalize phone: strip +, ensure starts with 62
    let phone = to.replace(/[^0-9]/g, "")
    if (phone.startsWith("0")) phone = "62" + phone.slice(1)
    if (!phone.startsWith("62")) phone = "62" + phone

    const payload = {
      to_name: toName || params.nama_asesi,
      to_number: phone,
      message_template_id: this.config.message_template_id,
      channel_integration_id: this.config.channel_integration_id,
      language: { code: "id" },
      parameters: {
        body: [
          { key: "1", value_text: params.nama_asesi, value: "nama_asesi" },
          { key: "2", value_text: params.tanggal_uji, value: "tanggal_uji" },
          { key: "3", value_text: params.tuk, value: "tuk" },
          { key: "4", value_text: params.skema, value: "skema" },
          { key: "5", value_text: params.link, value: "link" },
        ],
      },
    }

    const response = await fetch(`${this.config.base_url}/broadcasts/whatsapp/direct`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(err.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // --- Log management ---

  static getLogs(): QontakLogEntry[] {
    const stored = localStorage.getItem(LOGS_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return []
      }
    }
    return []
  }

  static addLog(entry: QontakLogEntry): void {
    const logs = QontakService.getLogs()
    logs.unshift(entry)
    if (logs.length > 100) logs.pop()
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs))
  }

  static clearLogs(): void {
    localStorage.removeItem(LOGS_KEY)
  }
}

export const qontakService = new QontakService()
