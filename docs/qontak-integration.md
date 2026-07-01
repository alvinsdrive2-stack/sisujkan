# Qontak WhatsApp Integration

## Overview

Integrasi WhatsApp Business API via Mekari Qontak untuk mengirim notifikasi uji kompetensi ke asesi secara otomatis.

**Endpoint:** `POST /api/open/v1/broadcasts/whatsapp/direct`

---

## Setup

### 1. Dapatkan Credentials

| Credential | Lokasi |
|---|---|
| **Access Token** | Qontak Dashboard → Settings → API |
| **Refresh Token** | Response dari OAuth endpoint |
| **Channel Integration ID** | Qontak Dashboard → Channels → WhatsApp Business |
| **Message Template ID** | Qontak Dashboard → WhatsApp → Template (setelah approve) |

### 2. Template WhatsApp

Template harus disubmit dan di-approve di Qontak Dashboard sebelum bisa dipakai via API.

**Template Name:** `pemberitahuan_uji_kompetensi`
**Category:** UTILITY
**Language:** id

**Body:**

```
Yth. *{{1}}*,
Dengan hormat,

Bersama pesan ini, kami dari *Lembaga Sertifikasi Profesi Gatensi Karya Konstruksi* memberitahukan bahwa Bapak/Ibu telah terdaftar sebagai peserta *Uji Kompetensi* dengan rincian sebagai berikut:

- Tanggal Uji : *{{2}}*
- Tempat/TUK : *{{3}}*
- Skema         : *{{4}}*

Sehubungan dengan hal tersebut, Bapak/Ibu *diwajibkan* untuk menyelesaikan tahapan Validasi data melalui tautan berikut:

🔗 *{{5}}*

Hormat kami,
*Tim Administrasi*
*LSP Gatensi*
```

**Placeholder Mapping:**

| Placeholder | Deskripsi | Contoh |
|---|---|---|
| `{{1}}` | Nama Asesi | Budi Santoso |
| `{{2}}` | Tanggal Pelaksanaan | 15 Mei 2026 |
| `{{3}}` | Nama dan Lokasi TUK | TUK Jakarta - Jl. Sudirman No. 123 |
| `{{4}}` | Nama Skema Sertifikasi | Teknisi Jaringan Madya |
| `{{5}}` | Link Sistem | https://app.example.com/asesi/praasesmen/123 |

---

## API Reference

### Authentication

**Token Refresh**

```
POST https://service-chat.qontak.com/oauth/token
Content-Type: application/json

{
  "refresh_token": "<refresh_token>",
  "grant_type": "refresh_token",
  "client_id": "RRrn6uIxalR_QaHFlcKOqbjHMG63elEdPTair9B9YdY",
  "client_secret": "Sa8IGIh_HpVK1ZLAF0iFf7jU760osaUNV659pBIZR00"
}
```

> **Note:** `client_id` dan `client_secret` adalah tetap untuk semua user. Jangan ubah.

**Response:**

```json
{
  "access_token": "xxx",
  "token_type": "Bearer",
  "expires_in": 29823918,
  "refresh_token": "xxx",
  "created_at": 1594354514
}
```

### Send WhatsApp Template Message

**Endpoint:** `POST /api/open/v1/broadcasts/whatsapp/direct`

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "to_name": "Budi Santoso",
  "to_number": "6281234567890",
  "message_template_id": "70d0d28c-d5fb-4076-99ee-86b2f366f1a2",
  "channel_integration_id": "b1fc9860-aed8-4b9f-a6f4-11d1e757eb88",
  "language": {
    "code": "id"
  },
  "parameters": {
    "body": [
      { "key": "1", "value_text": "Budi Santoso", "value": "nama_asesi" },
      { "key": "2", "value_text": "15 Mei 2026", "value": "tanggal_uji" },
      { "key": "3", "value_text": "TUK Jakarta - Jl. Sudirman No. 123", "value": "tuk" },
      { "key": "4", "value_text": "Teknisi Jaringan Madya", "value": "skema" },
      { "key": "5", "value_text": "https://app.example.com/asesi/praasesmen/123", "value": "link" }
    ]
  }
}
```

**Response (201):**

```json
{
  "data": {
    "id": "xxx",
    "status": "sent",
    "to": "6281234567890",
    "created_at": "2026-05-12T10:00:00Z"
  }
}
```

**Rate Limit:** 60 requests/minute

---

## Project Integration

### File Structure

```
src/
├── lib/
│   └── qontak-service.ts        # Service layer (API calls, config, logs)
├── pages/
│   └── qontak/
│       └── QontakWhatsAppPage.tsx # UI page (config, send form, logs)
└── vite.config.ts                # Proxy config for CORS
```

### Proxy Configuration

Vite proxy dibutuhkan untuk menghindari CORS error saat development.

**`vite.config.ts`:**

```typescript
server: {
  proxy: {
    '/api/qontak': {
      target: 'https://service-chat.qontak.com/api/open/v1',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/qontak/, ''),
    },
    '/api/qontak-auth': {
      target: 'https://service-chat.qontak.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/qontak-auth/, ''),
    },
  },
},
```

| Local Path | Target |
|---|---|
| `/api/qontak/*` | `https://service-chat.qontak.com/api/open/v1/*` |
| `/api/qontak-auth/*` | `https://service-chat.qontak.com/*` |

### Route

```
/qontak/whatsapp
```

Accessible by any logged-in user (no role restriction).

---

## Usage

### Via UI

1. Buka `/qontak/whatsapp`
2. (Opsional) Edit konfigurasi di Pengaturan Qontak
3. Klik **Refresh Token** jika token expired
4. Isi form: nomor, nama, tanggal, TUK, skema, link
5. Klik **Kirim WhatsApp**
6. Cek Riwayat Pengiriman untuk status

### Via Service (programmatic)

```typescript
import { qontakService } from "@/lib/qontak-service"

// Kirim pesan
await qontakService.sendMessage("081234567890", {
  nama_asesi: "Budi Santoso",
  tanggal_uji: "15 Mei 2026",
  tuk: "TUK Jakarta - Jl. Sudirman No. 123",
  skema: "Teknisi Jaringan Madya",
  link: "https://app.example.com/asesi/praasesmen/123",
})

// Refresh token
await qontakService.refreshToken()

// Check status
qontakService.hasToken()  // boolean
qontakService.isReady()   // boolean
qontakService.getConfig() // QontakConfig
```

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `Failed to fetch` | CORS blocked | Pastikan Vite proxy aktif, restart dev server |
| `401 Unauthorized` | Token expired | Klik Refresh Token di page |
| `422 Unprocessable` | Parameter salah / template belum approve | Cek template status di Qontak Dashboard |
| `400 Bad Request` | Refresh token expired | Generate token baru dari Qontak Dashboard |
| `429 Too Many Requests` | Rate limit exceeded | Tunggu 1 menit, retry |

---

## Security Notes

- `client_id` dan `client_secret` bersifat tetap dan sudah di-hardcode di service
- `access_token` dan `refresh_token` disimpan di `localStorage`
- Token bersifat sensitif — jangan commit ke version control
- Untuk production, pindahkan credentials ke environment variables
