# Field Reference: SISUJ Assessment & Pre-Assessment Pages

Semua field yang di-input frontend dan di-POST ke backend (termasuk QR signature dan absen webcam).

---

## Step Order (Urutan Alur)

### Pre-Assessment (Pra-Asesmen) — `PRASESMEN_STEPS`

```
1. Konfirmasi     → KonfirmasiDataPage (read-only)
2. APL 01         → Apl01Page
3. APL 02         → Apl02Page
4. MAPA 01        → Mapa01Page
5. MAPA 02        → Mapa02Page
6. AK.07          → FrAk07Page
7. AK.04          → FrAk04Page
8. K3             → K3AsesmenPage
```

### Perjanjian Asesmen — `PERJANJIAN_ASESMEN_STEPS`

```
1. AK.01          → FrAk01Page (Asesor fill)
2. Selesai        → Ak01SuccessPage
```

### Asesmen — `ASESMEN_STEPS_ASESI` / `ASESMEN_STEPS_ASESOR_1`

#### Portofolio (jenjang >= 4, metode = "portofolio")

| Step | Asesi | Asesor 1 | Asesor 2 |
|------|-------|----------|----------|
| 1 | IA.08 | IA.08 | IA.08 |
| 2 | IA.09 | IA.09 | IA.09 |
| 3 | IA.10 | IA.10 | IA.10 |
| 4 | AK.02 | AK.02 | AK.02 |
| 5 | AK.03 | AK.03 | AK.03 |
| 6 | Survei | AK.05 | AK.05 |
| 7 | Selesai | AK.06 | AK.06 |
| 8 | — | Selesai | AK.06 |
| 9 | — | — | Selesai |

#### Full Flow (jenjang >= 4, metode ≠ portofolio)

| Step | Asesi | Asesor 1 | Asesor 2 |
|------|-------|----------|----------|
| 1 | IA.04.A | IA.04.A | IA.04.A |
| 2 | Upload Tugas | Review Tugas | Review Tugas |
| 3 | IA.04.B | IA.04.B | IA.04.B |
| 4 | IA.05 | IA.05 | IA.05 |
| 5 | AK.02 | AK.02 | AK.02 |
| 6 | AK.03 | AK.03 | AK.03 |
| 7 | Survei | AK.05 | AK.05 |
| 8 | Selesai | AK.06 | AK.06 |
| 9 | — | Selesai | AK.06 |
| 10 | — | — | Selesai |

#### Low Jenjang (jenjang < 4)

| Step | Asesi | Asesor 1 | Asesor 2 |
|------|-------|----------|----------|
| 1 | IA.01 | IA.01 | IA.01 |
| 2 | IA.02 | IA.02 | IA.02 |
| 3 | IA.03 | IA.03 | IA.03 |
| 4 | Upload Tugas | Review Tugas | Review Tugas |
| 5 | IA.05 | IA.05 | IA.05 |
| 6 | AK.02 | AK.02 | AK.02 |
| 7 | AK.03 | AK.03 | AK.03 |
| 8 | Survei | AK.05 | AK.05 |
| 9 | Selesai | AK.06 | AK.06 |
| 10 | — | Selesai | AK.06 |
| 11 | — | — | Selesai |

---

## A. Pre-Assessment (Pra-Asesmen)

### A1. KonfirmasiDataPage

**Route:** `/asesi/praasesmen`
**Editable By:** None
**POST:** None

Read-only. No data posted.

---

### A2. Apl01Page — FR.APL.01

**Route:** `/asesi/praasesmen/:idIzin/apl01`
**Filled By:** Asesi
**POST 1:** Save data pekerjaan (asesi)
```
POST /praasesmen/:idIzin/apl01
Body: {
  perusahaan: string,
  jabatan: string,
  alamat_kantor: string | null,
  telepon_kantor: string | null,
  fax: string | null,
  email_kantor: string | null,
  kode_pos: number | null
}
```
**POST 2:** Generate QR signature (asesi, if belum ada barcode)
```
POST /qr/:idIzin/apl01
Body: { id_jadwal: string }
```

---

### A3. Apl02Page — FR.APL.02

**Route:** `/asesi/praasesmen/:idIzin/apl02`
**Filled By:** Asesi & Asesor

**POST 1:** Upload files (asesi, FormData — sebelum submit akhir)
```
POST /praasesmen/:idIzin/apl02/files
Body: FormData { "files[]": File }
```

**POST 2:** Submit checklist + QR (asesi)
```
POST /praasesmen/:idIzin/apl02
Body: {
  metode: string,              // "observasi" | "portofolio"
  is_dilanjutkan: boolean,
  answers: [
    { subunit_id: number, kompeten: boolean, file_ids: number[] }
  ]
}
```
```
POST /qr/:idIzin/apl02
Body: { id_jadwal: string }
```

**POST 3:** Submit metode + QR (asesor)
```
POST /praasesmen/:idIzin/apl02
Body: {
  metode: string,              // asesor pilih metode asesmen
  is_dilanjutkan: boolean,
  answers: [
    { subunit_id: number, kompeten: boolean, file_ids: number[] }
  ]
}
```
```
POST /qr/:idIzin/apl02
Body: { id_jadwal: string }
```

---

### A4. Mapa01Page — MAPA.01

**Route:** `/asesi/praasesmen/:idIzin/mapa01`
**Filled By:** Asesi & Asesor

**POST:** QR signature only (no form data POST)
```
POST /qr/:idIzin/mapa01
Body: { id_jadwal: string }
```

---

### A5. Mapa02Page — MAPA.02

**Route:** `/asesi/praasesmen/:idIzin/mapa02`
**Filled By:** Asesi & Asesor

**POST 1:** Save (asesi/asesor — empty body)
```
POST /praasesmen/:idIzin/mapa02
Body: (empty, no JSON body sent)
```
**POST 2:** QR signature
```
POST /qr/:idIzin/mapa02
Body: { id_jadwal: string }
```

---

### A6. FrAk07Page — FR.AK.07

**Route:** `/asesi/praasesmen/:idIzin/ak07`
**Filled By:** Asesor

**POST 1:** Save observasi answers
```
POST /praasesmen/:idIzin/ak07
Body: {
  answers: [
    { referensi_id: number, kelompok_id: number, value: string }
  ]
}
```
**POST 2:** QR signature
```
POST /qr/:idIzin/ak07
Body: { id_jadwal: string }
```

---

### A7. FrAk04Page — FR.AK.04

**Route:** `/asesi/praasesmen/:idIzin/ak04`
**Filled By:** Asesi

**POST 1:** Save answers + alasan banding
```
POST /praasesmen/:idIzin/ak04
Body: {
  answers: [
    { referensi_id: number, kelompok_id: number, jawaban: boolean | null }
  ],
  alasan: string
}
```
**POST 2:** QR signature
```
POST /qr/:idIzin/ak04
Body: { id_jadwal: string }
```

---

### A8. K3AsesmenPage

**Route:** `/asesi/praasesmen/:idIzin/k3`
**Filled By:** Asesi

**POST:** None (navigasi trigger only)

---

## B. Perjanjian Asesmen

### B1. FrAk01Page — FR.AK.01

**Route:** `/asesi/perjanjian/:idIzin/ak01`
**Filled By:** Asesor

**POST 1:** Save verification + waktu
```
POST /praasesmen/:idIzin/ak01
Body: {
  answers: [
    { id_referensi: number, jawaban: boolean }
  ],
  waktu: string   // "HH:MM - Selesai" format
}
```
**POST 2:** QR signature
```
POST /qr/:idIzin/ak01
Body: { id_jadwal: string }
```

---

### B2. Ak01SuccessPage

**Route:** `/asesi/perjanjian/ak01-success`
**POST:** None

---

## C. Assessment (Asesmen)

### C1. Ia01Page — IA.01

**Route:** `/asesi/asesmen/:id/ia01`
**Filled By:** Asesor (low jenjang only)

**POST 1:** Save observations
```
POST /asesmen/:id/ia01
Body: {
  dokumen_id: number,
  answers: [
    { soal_id: number, penilaian_lanjut: string | null, pencapaian: boolean }
  ],
  feedback: [
    { kelompok_id: number, umpan_balik: string }
  ],
  is_kompeten: boolean
}
```
**POST 2:** QR signature
```
POST /qr/:id/ia01
Body: { id_jadwal: string }
```

---

### C2. Ia02Page — IA.02

**Route:** `/asesi/asesmen/:id/ia02`
**Filled By:** Read-only (static HTML)

**POST:** QR signature only (asesor)
```
POST /qr/:id/ia02
Body: { id_jadwal: string }
```

---

### C3. Ia03Page — IA.03

**Route:** `/asesi/asesmen/:id/ia03`
**Filled By:** Asesor (low jenjang only)

**POST 1:** Save verbal questions
```
POST /asesmen/:id/ia03
Body: {
  dokumen_id: number,
  answers: [
    { soal_id: number, tanggapan: string, pencapaian: boolean }
  ],
  umpan_balik: string,
  is_kompeten: boolean
}
```
**POST 2:** QR signature
```
POST /qr/:id/ia03
Body: { id_jadwal: string }
```

---

### C4. Ia04aPage — IA.04A

**Route:** `/asesi/asesmen/:id/ia04a`
**Filled By:** Asesor 1 (full flow only)

**POST 1:** Save umpan balik (asesor 1 only)
```
POST /asesmen/:id/ia04a
Body: {
  soal_id: number,
  jawaban: string
}
```
**POST 2:** QR signature (asesor 1)
```
POST /qr/:id/ia04a
Body: { id_jadwal: string }
```
**POST 3:** QR signature (asesor 2 — generate only, no data POST)
```
POST /qr/:id/ia04a
Body: { id_jadwal: string }
```
**POST 4:** QR signature (asesi — generate only, no data POST)
```
POST /qr/:id/ia04a
Body: { id_jadwal: string }
```

---

### C5. UploadTugasPage

**Route:** `/asesi/asesmen/:id/upload-tugas`
**Filled By:** Asesi (upload); Asesor (view-only)

**POST 1:** Upload file (asesi)
```
POST /asesmen/:id/tugas
Body: FormData { "file": File }
```
**POST 2:** QR signature (asesi + asesor) — via separate button modal

---

### C6. Ia04bPage — IA.04B

**Route:** `/asesi/asesmen/:id/ia04b`
**Filled By:** Asesor (full flow only)

**POST 1:** Save answers + nilai
```
POST /asesmen/:id/nilai-ia04b
Body: {
  dokumen_id: number,
  evaluations: [
    {
      soal_id: number,
      pencapaian: boolean   // 'ya' = true
    }
  ],
  rekomendasi: {
    soal_id: number,
    value: boolean        // 'kompeten' = true
  }
}
```
**POST 2:** QR signature
```
POST /qr/:id/ia04b
Body: { id_jadwal: string }
```

---

### C7. Ia05Page — IA.05

**Route:** `/asesi/asesmen/:id/ia05`
**Filled By:** Asesi & Asesor (all flows)

**POST 1:** Save answers
```
POST /asesmen/:id/ia05
Body: {
  id_izin: string | number,
  dokumen_id: number,
  answers: [
    { soal_id: number, jawaban: string }
  ],
  umpan_balik?: string
}
```
**POST 2:** QR signature (via kegiatanService)
```
POST /qr/:id/ia05
Body: { id_jadwal: string }
```

---

### C8. UjianPage

**Route:** `/asesi/asesmen/:id/ujian`
**Filled By:** Asesi

**POST 1:** Save answers (auto-save per soal)
```
POST /asesmen/:id/ia05
Body: {
  id_izin: number,
  dokumen_id: number,
  answers: [
    { soal_id: number, jawaban: string }
  ]
}
```
**POST 2:** Final submit + QR (asesi)
```
POST /asesmen/:id/ia05
Body: {
  id_izin: number,
  dokumen_id: number,
  answers: [...]
}
```
```
POST /qr/:id/ia05
Body: { id_jadwal: string }
```

---

### C9. Ia08Page — IA.08

**Route:** `/asesi/asesmen/:id/ia08`
**Filled By:** Asesor (portofolio only)

**POST 1:** Save portfolio assessment
```
POST /asesmen/:id/ia08
Body: {
  dokumen_id: number,
  apl2_answers: [
    {
      soal_id: number,
      valid: boolean,
      asli: boolean,
      terkini: boolean,
      memadai: boolean
    }
  ],
  unit_answers: [
    { soal_id: number, is_checked: boolean }
  ],
  bukti_tambahan: string,
  is_kompeten: boolean,
  rekomendasi_unit: object,
  rekomendasi_elemen: object,
  rekomendasi_kuk: object
}
```
**POST 2:** QR signature
```
POST /qr/:id/ia08
Body: { id_jadwal: string }
```

---

### C10. Ia09Page — IA.09

**Route:** `/asesi/asesmen/:id/ia09`
**Filled By:** Asesor (portofolio only)

**POST 1:** Save discussion conclusions
```
POST /asesmen/:id/ia09
Body: {
  dokumen_id: number,
  answers: [
    { soal_id: number, kesimpulan: boolean, is_kompeten: boolean }
  ]
}
```
**POST 2:** QR signature
```
POST /qr/:id/ia09
Body: { id_jadwal: string }
```

---

### C11. Ia10Page — IA.10

**Route:** `/asesi/asesmen/:id/ia10`
**Filled By:** Asesor (portofolio only)

**POST 1:** Save evidence checklist + form data
```
POST /asesmen/:id/ia10
Body: {
  dokumen_id: number,
  answers: [
    { referensi_id: number, answer: boolean }
  ],
  essay_answers: [
    { referensi_id: number, essay_answer: string }
  ]
}
```
**POST 2:** QR signature
```
POST /qr/:id/ia10
Body: { id_jadwal: string }
```

---

### C12. Ak02Page — FR.AK.02

**Route:** `/asesi/asesmen/:id/ak02`
**Filled By:** Asesor (all flows)

**POST 1:** Save recommendation
```
POST /asesmen/:id/ak02
Body: {
  answers: [
    {
      id_unit_kompetensi: number,
      observasi: boolean,
      portofolio: boolean,
      pertanyaan_wawancara: boolean,
      pertanyaan_lisan: boolean,
      pertanyaan_tertulis: boolean,
      proyek_kerja: boolean,
      lainnya: boolean
    }
  ],
  is_kompeten: boolean,
  tindak_lanjut: string,
  komentar: string
}
```
**POST 2:** QR signature
```
POST /qr/:id/ak02
Body: { id_jadwal: string }
```

---

### C13. Ak03Page — FR.AK.03

**Route:** `/asesi/asesmen/:id/ak03`
**Filled By:** Asesi (all flows)

**POST 1:** Save feedback
```
POST /asesmen/:id/ak03
Body: {
  answers: [
    { soal_id: number, is_kompeten: boolean | null, catatan: string }
  ],
  catatan: string
}
```
**POST 2:** QR signature
```
POST /qr/:id/ak03
Body: { id_jadwal: string }
```

---

### C14. Ak05Page — FR.AK.05

**Route:** `/asesi/asesmen/:id_izin/ak05`
**Filled By:** Asesor (all flows)

Multi-asesi. Loop POST per asesi.

**POST 1:** Save report per asesi
```
POST /asesmen/:asesiId_izin/ak05
Body: {
  kompeten: boolean,
  keterangan: string,
  aspek: string,                      // aspek_positif_negatif
  pencatatan_penolakan: string,
  saran: string,
  catatan: string
}
```
**POST 2:** QR signature per asesi
```
POST /qr/:asesiId_izin/ak05
Body: { id_jadwal: string }
```

---

### C15. Ak06Page — FR.AK.06

**Route:** `/asesi/asesmen/:id/ak06`
**Filled By:** Asesor (all flows)

**POST 1:** Save process review
```
POST /asesmen/:id/ak06
Body: {
  answers: [
    {
      aspek_id: number,
      validitas: boolean | null,
      reliabel: boolean | null,
      fleksibel: boolean | null,
      adil: boolean | null
    }
  ],
  rekomendasi1: string,
  rekomendasi2: string,
  catatan_asesor1: string,
  catatan_asesor2: string,
  dimensi_kompetensi: {
    task_skills: string,
    task_management_skills: string,
    contingency_management_skills: string,
    job_role_environment_skills: string,
    transfer_skills: string
  }
}
```
**POST 2:** QR signature (asesor only)
```
POST /qr/:id/ak06
Body: { id_jadwal: string }
```

---

### C16. SurveiPage — Survei Kepuasan

**Route:** `/asesi/asesmen/:id/survei`
**Filled By:** Asesi (all flows)

**POST:** Save satisfaction survey
```
POST /survey/:id
Body: {
  LSP: [
    { pertanyaan_id: number, skor: number }
  ],
  TUK: [
    { pertanyaan_id: number, skor: number }
  ],
  saran: string,
  pernyataan: boolean
}
```

---

### C17. AsesmenSelesaiPage

**Route:** `/asesi/asesmen/:id/selesai`
**POST:** None

---

## D. Absen Webcam

| Fase | Endpoint | Payload |
|------|----------|---------|
| Absen Awal Praasesmen | `POST /absen/:idIzin/awal` | webcam blob (multipart) |
| Absen Awal Asesmen | `POST /absen/:id}/awal` | webcam blob (multipart) |
| Absen Akhir Asesmen | `POST /absen/:id}/akhir` | webcam blob (multipart) |

Trigger: `useAbsenCheck` hook — `checkOnMount: true`, phase = `praasesmen` | `asesmen`.

---

## E. Signature Summary

QR signature endpoint pattern: `POST /qr/:idIzin/:pageKey`
Body: `{ id_jadwal: string }`

| Role | Syarat |
|------|--------|
| Asesi | `!isAsesor && !asesiHasSigned` |
| Asesor 1 | `isAsesor && asesorRole === 'asesor_1' && !asesorHasSigned` |
| Asesor 2 | `isAsesor && asesorRole === 'asesor_2' && !asesorHasSigned` |

Pages tanpa data POST (QR only): Mapa01Page, Mapa02Page, Ia02Page, Ia04aPage (asesor2/asesi)

---

## F. Display-Only Fields

Header identity dari `useDataDokumenAsesmen` — **not editable**:

| Field | Source |
|-------|--------|
| Skema Sertifikasi / Jabatan Kerja | `useDataDokumenAsesmen.jabatanKerja` |
| Nomor Skema | `useDataDokumenAsesmen.nomorSkema` |
| Nama TUK | `useDataDokumenAsesmen.tuk` |
| Nama Asesi | `useDataDokumenAsesmen.namaAsesi` |
| Tanggal Uji | `useDataDokumenAsesmen.tanggalUji` |

---

## G. Field Types Summary

| Tipe | Pages |
|------|-------|
| `radio (Ya/Tidak)` | Ia01, Ia03, Ia10, Ak02, Ak06, Ia09 |
| `radio (K/S/B)` | Ia01, Ia03, FrAk01, FrAk04 |
| `radio (1-5)` | SurveiPage |
| `checkbox` | Ia08, Ak03, K3Asesmen |
| `textarea` | Ia03, Ia04a, Ia04b, Ia05, Ia08, Ak03, Ak05, Ak06, Survei, FrAk07, FrAk04 |
| `select` | Ia04b, Ia08, Ak02, Ak05 |
| `datetime-local` | FrAk01 |
| `file upload` | Apl02Page, UploadTugasPage |
| `number (0-100)` | Ia04b |

---

## G. Hardcoded / Derived Fields (Set by Frontend)

Field ini **tidak di-input user** langsung, tapi di-derive atau di-hardcoded oleh frontend sebelum POST.

### is_kompeten (derived from answers)

| Page | Logic | Notes |
|------|-------|-------|
| Ia01Page | `answers.every(a => a.pencapaian === true)` | true if ALL pertanyaan K |
| Ia03Page | `answers.every(a => a.pencapaian === true)` | true if ALL pertanyaan K |
| Ia04bPage | `rekomendasi === 'kompeten'` | from select |
| Ia08Page | `rekomendasiKompeten` state | from select |
| Ia09Page | `pertanyaanList[i].k` | from checkbox K |
| Ak02Page | `isKompeten` state | from radio Ya/Tidak |
| Ak05Page | `kompeten` per-asesi | from checkbox |

### is_dilanjutkan (hardcoded)

| Page | Value | Notes |
|------|-------|-------|
| Apl02Page | `true` | Hardcoded, selalu true |

### is_kompeten dalam payload (Apl02Page)

| Role | Value | Logic |
|------|-------|-------|
| Asesi | `statuses.every(s => s === 'K')` | Jika semua KUK checklist = K |
| Asesor | `subunit.kompeten ?? true` | Dari API, default true |

### dimensi_kompetensi (Ak06Page — hardcoded label)

Derived from `jenjang` + `metode`:

| Condition | Value |
|---------|-------|
| jenjang < 4 | `"L/CL<br/> T/DPT"` |
| jenjang >= 4 + portofolio | `"TL/VP<br/> T/PW<br/> T/VPK"` |
| jenjang >= 4 + observasi | `"L/DIT<br/> T/DPT"` |

Semua 5 key (`task_skills`, `task_management_skills`, `contingency_management_skills`, `job_role_environment_skills`, `transfer_skills`) pakai **label yang sama**.

### Ia08Page portfolio items (derived from API)

Portfolio items (`valid`, `asli`, `terkini`, `memadai`) disimpan sebagai `boolean` per item. Setiap item punya pasangan `_ya` dan `_tidak` untuk toggle UI.

```
{ valid: item.valid_ya, asli: item.asli_ya, terkini: item.terkini_ya, memadai: item.memadai_ya }
```

### Ia08Page rekomendasiUnit/Elemen/Kuk

Text input fields (`string`, default empty `""`). Tidak ada validasi khusus.

### Ia09Page kesimpulan/is_kompeten

- `kesimpulan`: dari radio Ya/Tidak (`boolean`)
- `is_kompeten`: dari checkbox K (`pertanyaanList[i].k` = `boolean`)

### Ak03Page skor (derived)

```
is_kompeten: item.ya ? true : (item.tidak ? false : null)
```

Checkbox Ya → `true`, Checkbox Tidak → `false`, keduanya unchecked → `null`.

### FrAk01Page waktu

Default: `"HH:MM - Selesai"` (current time + " - Selesai"). User bisa override dengan datetime-local picker.

### waktu (FrAk01Page)

`waktu` dalam payload: `waktuAk01 || `${jam}:${menit} - Selesai``

---

## H. GET Endpoints (Context for LLM Auto-Fill)

Setiap page punya GET endpoint yang return data assessment. Data ini bisa jadi context untuk LLM generate string fields.

### Pra-Asesmen GET

| Page | GET Endpoint | Response Key Fields |
|------|-------------|---------------------|
| KonfirmasiData | `/praasesmen/:idIzin` | personal data, skema info |
| Apl01 | `/praasesmen/:idIzin/apl01` | `data_pribadi`, `data_pekerjaan` |
| Apl02 | `/praasesmen/:idIzin/apl02` | `units[].subunits[].kuk_list`, `files`, `metode` |
| Mapa01 | `/praasesmen/:idIzin/mapa01` | `kelompok_kerja` (units, kode, nama_dokumen), `referensi_form` (kategoris/subkategoris/referensis), `skkni` |
| Mapa02 | `/praasesmen/:idIzin/mapa02` | pertanyaan list |
| FrAk07 | `/praasesmen/:idIzin/ak07` | 4 kelompok: potensi, modifikasi, rencana, hasil_penyesuaian — masing-masing punya `referensis[]` dengan `jawaban` |
| FrAk04 | `/praasesmen/:idIzin/ak04` | `kelompoks[].referensi[]` dengan `id`, `nama`, `value` |
| FrAk01 | `/praasesmen/:idIzin/ak01` | bukti/evidence list |

### Asesmen GET

| Page | GET Endpoint | Response Key Fields |
|------|-------------|---------------------|
| Ia01 | `/asesmen/:id/ia01` | `soal[]` → `{id, soal (question text), jawaban, pencapaian}`, `kelompok_kerja[]` |
| Ia02 | `/asesmen/:id/ia02` | `dokumen` (HTML content), `soal[]` |
| Ia03 | `/asesmen/:id/ia03` | `kelompok_kerja[].soal[]` → `{id, soal, tanggapan, pencapaian, umpan_balik}` |
| Ia04a | `/asesmen/:id/ia04a` | `soal[]` → `{id, soal (question), jawaban (existing answer), is_komentar}` |
| Ia04b | `/asesmen/:id/ia04b` | `dokumen`, `soal[]` → `{id, soal, pertanyaan_lain[]}`, `rekomendasi` |
| Ia05 | `/asesmen/:id/ia05` | `soal[]` → `{id, soal, jawaban}`, `umpan_balik` |
| Ia08 | `/asesmen/:id/ia08` | `soal.1` (portfolio items), `soal.2` (wawancara items), `soal.3` (bukti_tambahan), `apl2_answers`, `recommendation` |
| Ia09 | `/asesmen/:id/ia09` | `soal.1` (bukti list), `soal.2` (pertanyaan), `answers` → `{kesimpulan, is_kompeten}` |
| Ia10 | `/asesmen/:id/ia10` | `soal.1` (ya/tidak questions), `soal.2` (essay questions), `soal.3` (additional) |
| Ak02 | `/asesmen/:id/ak02` | `data_unit_kompetensi[]` → `{id, nama, observasi, portofolio, ...}`, `is_kompeten`, `tindak_lanjut`, `komentar` |
| Ak03 | `/asesmen/:id/ak03` | `soal[]` → `{id, soal, is_kompeten, catatan}`, `catatan` (catatanUmum) |
| Ak05 | `/asesmen/:id/ak05` | `kompeten`, `keterangan`, `aspek`, `pencatatan_penolakan`, `saran`, `catatan` |
| Ak06 | `/asesmen/:id/ak06` | `aspek_items[]` → `{id, validitas, reliabel, fleksibel, adil}`, `rekomendasi_prinsip`, `rekomendasi_dimensi`, `catatan_asesor1`, `catatan_asesor2`, `dimensi_kompetensi` |
| Survei | `/survey/:id` | `items[]` → `{id, skor}`, `saran` |

### Context tambahan (shared hooks)

| Hook | Data |
|------|------|
| `useDataDokumenAsesmen` | `jabatanKerja`, `nomorSkema`, `tuk`, `namaAsesi`, `tanggalUji`, `jenjang`, `metode` |
| `useDataDokumenPraAsesmen` | Same + `asesorList`, `tahap` |

---

## I. String Fields — LLM Auto-Fill Candidates

Field bertipe `string`/`textarea` yang bisa di-generate LLM. Checkbox/radio/file **tidak masuk**.

### HIGH Priority (asesor fills, panjang, kritis)

| Page | POST Field | GET Context Needed | Min Validation |
|------|-----------|-------------------|----------------|
| Ia04a | `jawaban` (umpanBalik) | `soal[].soal` (question), `soal[].jawaban` (asesi answer) | 10 chars, 3 kata |
| Ia03 | `tanggapan` per soal | `kelompok_kerja[].soal[].soal` (question text) | — |
| Ia03 | `umpan_balik` overall | All `kelompok_kerja` answers + pencapaian | — |
| Ia05 | `umpan_balik` | `soal[].soal` (questions), `soal[].jawaban` (answers) | — |
| Ia01 | `umpan_balik` per kelompok | `soal[].soal`, `pencapaian`, `penilaian_lanjut` | — |
| Ak05 | `keterangan` | per-asesi `kompeten` status | — |
| Ak05 | `aspek` (aspek_positif_negatif) | asesiList + kompeten results | — |
| Ak05 | `pencatatan_penolakan` | asesiList BK status | — |
| Ak05 | `saran` | asesiList results | — |
| Ak05 | `catatan` | overall assessment context | — |
| Ak06 | `rekomendasi1` (rekomendasi_prinsip) | `aspek_items[]` (validitas/reliabel/fleksibel/adil) | — |
| Ak06 | `rekomendasi2` (rekomendasi_dimensi) | `dimensi_kompetensi`, `jenjang`, `metode` | — |
| Ak06 | `catatan_asesor1` | aspek results | — |
| Ak06 | `catatan_asesor2` | aspek results | — |

### MEDIUM Priority

| Page | POST Field | GET Context Needed |
|------|-----------|-------------------|
| Ak02 | `komentar` | `data_unit_kompetensi[]`, `is_kompeten`, `tindak_lanjut` |
| Ia08 | `bukti_tambahan` | `soal.1` (portfolio items), `recommendation` |
| Ia10 | `essay_answers[].essay_answer` | `soal.2` (essay question text) |
| FrAk07 | `answers[].value` (text) | 4 kelompok `referensis[]` structure |
| Ak03 | `answers[].catatan` per item | `soal[]` (pertanyaan text) |
| Ak03 | `catatan` (catatanUmum) | `soal[]` + existing answers |

### LOW Priority

| Page | POST Field | GET Context Needed |
|------|-----------|-------------------|
| FrAk04 | `alasan` (alasanBanding) | `kelompoks[].referensi[]` answers |
| Survei | `saran` | `items[]` with skor |

### LLM Context Assembly

Untuk generate satu field, LLM butuh:
1. **Header**: `jabatanKerja`, `nomorSkema`, `namaAsesi`, `jenjang`, `metode`
2. **Questions**: soal/pertanyaan text dari GET
3. **Existing answers**: jawaban asesi dari GET (untuk context)
4. **Field type**: apa yang harus di-generate (feedback/notes/recommendation)

Contoh prompt assembly untuk Ia04a `umpanBalik`:
```
Context:
- Jabatan: {jabatanKerja}
- Skema: {nomorSkema}
- Soal: {soal.soal}
- Jawaban Asesi: {soal.jawaban}

Task: Tulis umpan balik profesional untuk asesi.
Requirements: min 10 karakter, min 3 kata.
```

---

## J. LLM Auto-Fill Integration Guide

### API Config

```
Endpoint: https://api.z.ai/api/anthropic
Token:    ae31297673a948fb9eab3ce20d929678.kDBLuxyedvzmP1lN
Format:   Anthropic Messages API (compatible)
```

### Basic Fetch Call

```typescript
const response = await fetch('https://api.z.ai/api/anthropic/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'ae31297673a948fb9eab3ce20d929678.kDBLuxyedvzmP1lN',
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    temperature: 0.8,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  }),
})

const data = await response.json()
const generatedText = data.content[0].text
```

### System Prompt (shared untuk semua field)

```
Kamu adalah asesor profesional LSP (Lembaga Sertifikasi Profesi) Indonesia yang berpengalaman.
Tulis dalam bahasa Indonesia profesional.
Jangan mengulang frasa atau kalimat yang sama.
Spesifik terhadap konteks asesmen yang diberikan.
Jawab HANYA teks yang diminta, tanpa penjelasan tambahan.
```

### Prompt Templates — Asesor

#### Ia04a — umpanBalik (min 10 chars, 3 kata)

```
Context:
- Jabatan Kerja: {jabatanKerja}
- Nomor Skema: {nomorSkema}
- Nama Asesi: {namaAsesi}

Soal yang dijawab asesi:
{soal.map(s => `- ${s.soal}\n  Jawaban: ${s.jawaban}`).join('\n')}

Beri umpan balik profesional untuk asesi di atas.
Tuliskan kekuatan dan area yang perlu diperbaiki.
Minimal 50 kata. Gunakan gaya {randomStyle}.
```

#### Ia03 — tanggapan per soal

```
Context:
- Jabatan: {jabatanKerja}
- Skema: {nomorSkema}
- Soal: {soal.soal}
- Kode KUK: {soal.kode_kuk}

Tulis tanggapan asesor (2-4 kalimat) tentang jawaban asesi pada soal di atas.
Gunakan gaya {randomStyle}.
```

#### Ia03 — umpan_balik overall

```
Context:
- Jabatan: {jabatanKerja}
- Skema: {nomorSkema}

Rangkuman jawaban asesi:
{kelompok_kerja.map(k => k.soal.map(s => `- ${s.soal}: ${s.tanggapan || '(belum dijawab)'}`).join('\n')).join('\n')}

Tulis umpan balik keseluruhan (3-5 kalimat).
Sebutkan kekuatan utama dan saran perbaikan.
Gunakan gaya {randomStyle}.
```

#### Ia05 — umpan_balik

```
Context:
- Jabatan: {jabatanKerja}
- Skema: {nomorSkema}

Pertanyaan dan jawaban asesi:
{soal.map(s => `- ${s.soal}\n  Jawaban: ${s.jawaban}`).join('\n')}

Beri umpan balik tentang performa asesi (3-5 kalimat).
Gunakan gaya {randomStyle}.
```

#### Ia01 — umpan_balik per kelompok

```
Context:
- Jabatan: {jabatanKerja}
- Skema: {nomorSkema}
- Kelompok Kerja: {kelompok.nama}

Soal dan penilaian:
{kelompok.soal.map(s => `- ${s.soal}: ${s.pencapaian === true ? 'K' : s.pencapaian === false ? 'BK' : '-'}`).join('\n')}

Tulis umpan balik untuk kelompok kerja ini (2-3 kalimat).
Gunakan gaya {randomStyle}.
```

#### Ak05 — keterangan (per asesi BK)

```
Context:
- Jabatan: {jabatanKerja}
- Nama Asesi: {asesi.nama}
- Status: Belum Kompeten

Tulis keterangan mengapa asesi dinyatakan Belum Kompeten (2-3 kalimat).
Gunakan gaya {randomStyle}.
```

#### Ak05 — aspek_positif_negatif

```
Context:
- Jabatan: {jabatanKerja}
- Skema: {nomorSkema}

Hasil asesmen:
{asesiList.map(a => `- ${a.nama}: ${a.kompeten ? 'Kompeten' : 'Belum Kompeten'}`).join('\n')}

Tulis aspek positif dan negatif pelaksanaan asesmen ini (3-5 kalimat).
Gunakan gaya {randomStyle}.
```

#### Ak05 — saran

```
Context:
- Jabatan: {jabatanKerja}
- Hasil: {asesiList.map(a => `${a.nama}: ${a.kompeten ? 'K' : 'BK'}`).join(', ')}

Tulis saran perbaikan untuk asesor dan personil terkait (3-5 kalimat).
Gunakan gaya {randomStyle}.
```

#### Ak06 — rekomendasi_prinsip

```
Context:
- Jabatan: {jabatanKerja}
- Skema: {nomorSkema}

Hasil checklist prinsip asesmen:
{aspek_items.map(a => `- Validitas: ${a.validitas ? 'Ya' : 'Tidak'}, Reliabel: ${a.reliabel ? 'Ya' : 'Tidak'}, Fleksibel: ${a.fleksibel ? 'Ya' : 'Tidak'}, Adil: ${a.adil ? 'Ya' : 'Tidak'}`).join('\n')}

Tulis rekomendasi untuk peningkatan prinsip asesmen (3-5 kalimat).
Gunakan gaya {randomStyle}.
```

#### Ak06 — rekomendasi_dimensi

```
Context:
- Jabatan: {jabatanKerja}
- Jenjang: {jenjang}
- Metode: {metode}
- Dimensi: {dimensi_kompetensi}

Tulis rekomendasi untuk peningkatan dimensi kompetensi (3-5 kalimat).
Gunakan gaya {randomStyle}.
```

#### Ak02 — komentar

```
Context:
- Jabatan: {jabatanKerja}
- Unit Kompetensi: {unit_kompetensi.map(u => u.nama).join(', ')}
- Status: {is_kompeten ? 'Kompeten' : 'Belum Kompeten'}

Tulis komentar/observasi asesor (2-4 kalimat).
Gunakan gaya {randomStyle}.
```

#### Ia08 — bukti_tambahan

```
Context:
- Jabatan: {jabatanKerja}
- Portofolio: {portfolio_items.map(p => p.dokumen).join(', ')}
- Wawancara: {wawancara_items.map(w => w.unit_kompetensi).join(', ')}

Tulis keterangan bukti tambahan yang diperlukan (2-3 kalimat).
Gunakan gaya {randomStyle}.
```

#### Ia10 — essay_answer

```
Context:
- Jabatan: {jabatanKerja}
- Pertanyaan: {essay.soal}

Tulis jawaban essay untuk pertanyaan di atas (3-5 kalimat).
Gunakan gaya {randomStyle}.
```

#### Ak03 — catatan per item

```
Context:
- Pertanyaan: {soal.soal}
- Status: {is_kompeten === true ? 'Puas' : is_kompeten === false ? 'Tidak Puas' : '-'}

Tulis catatan untuk item ini (1-2 kalimat).
Gunakan gaya {randomStyle}.
```

#### FrAk04 — alasan banding

```
Context:
- Jabatan: {jabatanKerja}
- Item yang dibanding: {referensi.filter(r => r.value).map(r => r.nama).join(', ')}

Tulis alasan pengajuan banding (2-3 kalimat).
Gunakan gaya {randomStyle}.
```

#### Survei — saran

```
Context:
- Jabatan: {jabatanKerja}
- Skor survei: {items.map(i => `${i.pertanyaan}: ${i.skor}/5`).join(', ')}

Tulis saran dan masukan untuk LSP/TUK (2-3 kalimat).
Gunakan gaya {randomStyle}.
```

### Prompt Templates — Asesi

> Prompt asesi ditulis dari sudut pandang asesi (orang yang diasesmen).
> System prompt: ganti "asesor profesional" → "asesi yang sedang menjalani asesmen kompetensi".

#### Ak03 — catatan per item (asesi)

```
Context:
- Pertanyaan: {soal.soal}
- Status: {is_kompeten === true ? 'Puas' : is_kompeten === false ? 'Tidak Puas' : '-'}

Tulis catatan atau komentar Anda sebagai asesi tentang item ini (1-2 kalimat).
Jelaskan pengalaman Anda terkait pertanyaan tersebut.
Gunakan gaya {randomStyle}.
```

#### Ak03 — catatanUmum (asesi)

```
Context:
- Jabatan: {jabatanKerja}
- Skema: {nomorSkema}

Hasil kepuasan asesmen:
{soal.map(s => `- ${s.soal}: ${s.is_kompeten === true ? 'Puas' : s.is_kompeten === false ? 'Tidak Puas' : '-'}`).join('\n')}

Tulis catatan umum Anda sebagai asesi tentang keseluruhan proses asesmen (3-5 kalimat).
Mencakup pengalaman, saran perbaikan, dan kesan selama asesmen.
Gunakan gaya {randomStyle}.
```

#### FrAk04 — alasan banding (asesi)

```
Context:
- Jabatan: {jabatanKerja}
- Item yang dibanding: {referensi.filter(r => r.value).map(r => r.nama).join(', ')}

Tulis alasan pengajuan banding Anda sebagai asesi (2-3 kalimat).
Jelaskan mengapa Anda merasa perlu mengajukan banding untuk item tersebut.
Gunakan gaya {randomStyle}.
```

#### Survei — saran (asesi)

```
Context:
- Jabatan: {jabatanKerja}
- Skor survei: {items.map(i => `${i.pertanyaan}: ${i.skor}/5`).join(', ')}

Tulis saran dan masukan Anda sebagai asesi untuk LSP dan TUK (2-3 kalimat).
Berikan feedback konstruktif berdasarkan pengalaman Anda.
Gunakan gaya {randomStyle}.
```

#### Ia05 — umpan_balik (asesi self-reflection)

```
Context:
- Jabatan: {jabatanKerja}
- Skema: {nomorSkema}

Pertanyaan dan jawaban Anda:
{soal.map(s => `- ${s.soal}\n  Jawaban: ${s.jawaban}`).join('\n')}

Tulis refleksi diri Anda sebagai asesi tentang jawaban yang Anda berikan (3-5 kalimat).
Apa yang sudah baik dan apa yang perlu ditingkatkan.
Gunakan gaya {randomStyle}.
```

### Variation: randomStyle

Setiap panggilan LLM, pilih random salah satu:
```
const STYLES = [
  'gaya bahasa formal akademik',
  'gaya semi-formal profesional',
  'pendekatan naratif deskriptif',
  'pendekatan analitis dengan poin spesifik',
]
const randomStyle = STYLES[Math.floor(Math.random() * STYLES.length)]
```

### Integration Flow per Page

```
1. User klik "Isi Otomatis" di samping textarea
2. Fetch GET endpoint untuk context (sudah ada di page, reuse existing state)
3. Assembly prompt pakai template di atas + context
4. POST ke API z.ai
5. Set result ke state textarea
6. User bisa edit sebelum save
```

### Error Handling

| Error | Action |
|-------|--------|
| 401 Unauthorized | Tampilkan "API key tidak valid" |
| 429 Rate Limit | Tampilkan "Terlalu banyak request, tunggu sebentar" |
| Network error | Tampilkan "Gagal terhubung ke server LLM" |
| Response kosong | Retry 1x, jika masih kosong tampilkan error |

---

## K. QR Signing — Realistic Timing Simulation

> **Workflow:** Asesi submits → signs QR → **ASESOR SIGNS WITHIN 5 SECONDS** → next page
> **Asesor Count:** 1 OR 2 asesor (dynamic, based on asesmen config)
> **Page Timing:** Ia05 = 20-56 min, Others = 2-9 min per page
> **Asesor Gap:** MAX 5 SECONDS after previous sign

### Timing Function (pseudocode)

```javascript
// Random delay between pages (minutes)
function pageDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Random delay for asesor sign after asesi (seconds)
function asesorGap() {
  return Math.floor(Math.random() * 5) + 1  // 1-5 seconds
}

// Per-page timing (minutes) — time between asesi submits
const TIMING = {
  // Pra-Asesmen (gap between pages)
  apl01_to_apl02: () => pageDelay(5, 9),
  apl02_to_mapa01: () => pageDelay(4, 8),
  mapa01_to_mapa02: () => pageDelay(2, 5),
  mapa02_to_ak07: () => pageDelay(3, 6),
  ak07_to_ak04: () => pageDelay(3, 6),
  ak04_to_k3: () => pageDelay(2, 4),
  k3_to_apl02_asesor: () => pageDelay(3, 7),  // gap before asesor APL02
  apl02_asesor_to_ak01: () => pageDelay(2, 5),

  // Asesmen (FULL FLOW) — gap between asesi submits
  start_to_ia04a: () => pageDelay(3, 6),
  ia04a_to_upload: () => pageDelay(8, 15),
  upload_to_ia04b: () => pageDelay(5, 10),
  ia04b_to_ia05: () => pageDelay(5, 9),
  ia05_to_ak02: () => pageDelay(20, 56),   // TERPANJANG — essay + self-reflection
  ak02_to_ak03: () => pageDelay(4, 8),
  ak03_to_survei: () => pageDelay(3, 6),
  survei_to_asesor_start: () => pageDelay(2, 4),  // brief pause before asesor
}

// Asesor submits SAME PAGE within 1-5 seconds after asesi (asesor 1)
// If asesor 2 exists: asesor 2 submits 1-5 seconds after asesor 1
```

### Flow Example — 1 Asesor (Jenjang >= 4, Full Flow)

```
Timestamp              | Role    | Step             | Submit Time
------------------------|---------|------------------|-------------
2026-05-30 08:00:00     | Asesi   | Start Pra-Asesmen |
08:05:23               | Asesi   | APL01            | ttd: 08:05:23
08:05:25               | Asesor1 | APL01            | ttd: 08:05:25 (+2s)
08:12:17               | Asesi   | APL02            | ttd: 08:12:17
08:12:21               | Asesor1 | APL02            | ttd: 08:12:21 (+4s)
08:16:44               | Asesi   | MAPA01           | ttd: 08:16:44
08:16:46               | Asesor1 | MAPA01           | ttd: 08:16:46 (+2s)
08:19:33               | Asesi   | MAPA02           | ttd: 08:19:33
08:19:37               | Asesor1 | MAPA02           | ttd: 08:19:37 (+4s)
08:24:51               | Asesi   | AK07             | ttd: 08:24:51
08:24:55               | Asesor1 | AK07             | ttd: 08:24:55 (+4s)
08:29:12               | Asesi   | AK04             | ttd: 08:29:12
08:29:15               | Asesor1 | AK04             | ttd: 08:29:15 (+3s)
08:32:08               | Asesi   | K3               | ttd: 08:32:08
08:32:12               | Asesor1 | K3               | ttd: 08:32:12 (+4s)
                       |         |                  | (Perjanjian asesmen)
08:37:45               | Asesi   | AK01             | ttd: 08:37:45
08:37:48               | Asesor1 | AK01             | ttd: 08:37:48 (+3s)
                       |         |                  | (Asesmen starts)
08:42:19               | Asesi   | IA.04.A          | ttd: 08:42:19
08:42:23               | Asesor1 | IA.04.A          | ttd: 08:42:23 (+4s)
08:54:36               | Asesi   | Upload Tugas     | ttd: 08:54:36
08:59:14               | Asesi   | IA.04.B          | ttd: 08:59:14
08:59:18               | Asesor1 | IA.04.B          | ttd: 08:59:18 (+4s)
09:35:42               | Asesi   | IA.05            | ttd: 09:35:42 (panjang!)
09:35:46               | Asesor1 | IA.05            | ttd: 09:35:46 (+4s)
09:53:27               | Asesi   | AK.02            | ttd: 09:53:27
09:53:31               | Asesor1 | AK.02            | ttd: 09:53:31 (+4s)
09:58:44               | Asesi   | AK.03            | ttd: 09:58:44
09:58:48               | Asesor1 | AK.03            | ttd: 09:58:48 (+4s)
10:03:21               | Asesi   | Survei           | ttd: 10:03:21
10:03:25               | Asesor1 | Survei           | ttd: 10:03:25 (+4s)
10:03:25               |         | DONE             |
```

### Flow Example — 2 Asesor (Jenjang >= 4, Full Flow)

```
Timestamp              | Role    | Step             | Submit Time
------------------------|---------|------------------|-------------
2026-05-30 08:00:00     | Asesi   | Start Pra-Asesmen |
08:05:23               | Asesi   | APL01            | ttd: 08:05:23
08:05:25               | Asesor1 | APL01            | ttd: 08:05:25 (+2s)
08:05:28               | Asesor2 | APL01            | ttd: 08:05:28 (+3s)
08:12:17               | Asesi   | APL02            | ttd: 08:12:17
08:12:21               | Asesor1 | APL02            | ttd: 08:12:21 (+4s)
08:12:25               | Asesor2 | APL02            | ttd: 08:12:25 (+4s)
08:16:44               | Asesi   | MAPA01           | ttd: 08:16:44
08:16:46               | Asesor1 | MAPA01           | ttd: 08:16:46 (+2s)
08:16:49               | Asesor2 | MAPA01           | ttd: 08:16:49 (+3s)
08:19:33               | Asesi   | MAPA02           | ttd: 08:19:33
08:19:37               | Asesor1 | MAPA02           | ttd: 08:19:37 (+4s)
08:19:41               | Asesor2 | MAPA02           | ttd: 08:19:41 (+4s)
08:24:51               | Asesi   | AK07             | ttd: 08:24:51
08:24:55               | Asesor1 | AK07             | ttd: 08:24:55 (+4s)
08:24:59               | Asesor2 | AK07             | ttd: 08:24:59 (+4s)
08:29:12               | Asesi   | AK04             | ttd: 08:29:12
08:29:15               | Asesor1 | AK04             | ttd: 08:29:15 (+3s)
08:29:18               | Asesor2 | AK04             | ttd: 08:29:18 (+3s)
08:32:08               | Asesi   | K3               | ttd: 08:32:08
08:32:12               | Asesor1 | K3               | ttd: 08:32:12 (+4s)
08:32:16               | Asesor2 | K3               | ttd: 08:32:16 (+4s)
                       |         |                  | (Perjanjian asesmen)
08:37:45               | Asesi   | AK01             | ttd: 08:37:45
08:37:48               | Asesor1 | AK01             | ttd: 08:37:48 (+3s)
08:37:51               | Asesor2 | AK01             | ttd: 08:37:51 (+3s)
                       |         |                  | (Asesmen starts)
08:42:19               | Asesi   | IA.04.A          | ttd: 08:42:19
08:42:23               | Asesor1 | IA.04.A          | ttd: 08:42:23 (+4s)
08:42:26               | Asesor2 | IA.04.A          | ttd: 08:42:26 (+3s)
08:54:36               | Asesi   | Upload Tugas     | ttd: 08:54:36
08:59:14               | Asesi   | IA.04.B          | ttd: 08:59:14
08:59:18               | Asesor1 | IA.04.B          | ttd: 08:59:18 (+4s)
08:59:22               | Asesor2 | IA.04.B          | ttd: 08:59:22 (+4s)
09:35:42               | Asesi   | IA.05            | ttd: 09:35:42 (panjang!)
09:35:46               | Asesor1 | IA.05            | ttd: 09:35:46 (+4s)
09:35:50               | Asesor2 | IA.05            | ttd: 09:35:50 (+4s)
09:53:27               | Asesi   | AK.02            | ttd: 09:53:27
09:53:31               | Asesor1 | AK.02            | ttd: 09:53:31 (+4s)
09:53:35               | Asesor2 | AK.02            | ttd: 09:53:35 (+4s)
09:58:44               | Asesi   | AK.03            | ttd: 09:58:44
09:58:48               | Asesor1 | AK.03            | ttd: 09:58:48 (+4s)
09:58:52               | Asesor2 | AK.03            | ttd: 09:58:52 (+4s)
10:03:21               | Asesi   | Survei           | ttd: 10:03:21
10:03:25               | Asesor1 | Survei           | ttd: 10:03:25 (+4s)
10:03:29               | Asesor2 | Survei           | ttd: 10:03:29 (+4s)
10:03:29               |         | DONE             |
```

### Key Points

1. **Asesor count** — 1 OR 2 asesor (based on asesmen config from GET)
2. **Asesi submits first** → asesor 1 signs within 1-5 seconds
3. **If 2 asesor** → asesor 2 signs within 1-5 seconds after asesor 1
4. **Ia05 longest** — 20-56 min gap between IA.04.B → IA.05 (asesi)
5. **Each page has timestamp** — `ttd: HH:mm:ss` per sign
6. **Gap between pages** — 2-56 min depends on page complexity
7. **Asesor max gap** — 5 seconds ONLY after previous sign on same page

### Simulation Logic

```javascript
// Get asesor count from asesmen data
const asesorCount = asesmenData.asesor?.length || 1

// For each page in order:
currentTime = startTime

// Add gap between previous page and this page
currentTime += TIMING[`${prevPage}_to_${currentPage}`]() * 60

// Asesi submits and signs
asesiTimestamp = currentTime
page.asesi_ttd = new Date(asesiTimestamp * 1000).toISOString()

// Asesor 1 submits 1-5 seconds later
asesor1Timestamp = asesiTimestamp + asesorGap()
page.asesor1_ttd = new Date(asesor1Timestamp * 1000).toISOString()

// Asesor 2 (if exists) submits 1-5 seconds after asesor 1
if (asesorCount >= 2) {
  asesor2Timestamp = asesor1Timestamp + asesorGap()
  page.asesor2_ttd = new Date(asesor2Timestamp * 1000).toISOString()
}
```

---

*Generated from codebase analysis — May 2026*
*Source: `src/lib/asesmen-steps.ts`, `src/pages/asesi/**/*.tsx`*
