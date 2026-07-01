# KAN BARU — Product Requirements

---

## PART 1: USER CAPABILITIES

---

## Role: PENYUSUN

Setelah login, redirect ke `/penyusun/dashboard`.

### Bisa ngapain?

| # | Fitur | Page | Penjelasan |
|---|-------|------|------------|
| 1 | **Dashboard** | `/penyusun/dashboard` | Lihat semua Jabatan Kerja (jabker). Tiap baris: nama jabker, jumlah skema, status |
| 2 | **Lihat Soal** | `/penyusun/lihat-soal` | Melihat + menginput + mengedit soal KAN. Filter by skema/jabker. Upload DOCX, extract otomatis, preview, simpan |
| 3 | **Daftar Skema** | `/penyusun/daftar-skema` | Lihat semua skema + progress peserta per skema (siapa udah/belum ngerjain) |
| 4 | **Data Dokumen** | `/penyusun/data-dokumen` | Lihat dokumen-dokumen terkait |
| 5 | **Nilai Asesi** | `/{idIzin}/nilai/{jenis}` | Masuk ke page penilaian like asesor, lihat jawaban asesi, kasih nilai |
| 6 | **Lihat MUK** | `/penyusun/muk/{idIzin}` | Lihat hasil MUK participant + status TTD siapa aja |
| 7 | **Tanda Tangan** | Di akhir flow | Klik "Simpan & Tanda Tangan" → QR code terisi di field `barcode_penyusun` |

### Alur Input Soal (Fitur #2 detail)

```
Pilih Jabatan Kerja → Pilih Dokumen KAN → Upload DOCX → Extract → Preview → Simpan
```

**Step by step:**

1. **Pilih Jabatan Kerja** — dropdown dari `listjabker_extracted.json`
2. **Pilih Dokumen KAN** — pilih jenis soal:
   - **IA.04B** — Lembar Periksa Kegiatan Terstruktur (lingkup + kesesuaian)
   - **IA.05** — Pertanyaan Pilihan Ganda (4 opsi + kunci jawaban)
   - **IA.06** — Pertanyaan Esai
3. **Upload DOCX** — pilih file Word, klik "Extract Soal dari Word"
   - Backend panggil `pythonextractor.py` → parse → JSON
   - Atau bisa manual: klik "+ Tambah Manual", isi sendiri
4. **Preview Table** — lihat hasil extract, edit langsung (textarea soal, dropdown unit/KUK, no urut, hapus baris)
5. **Simpan** — klik "Simpan ke Backend" → data tersimpan

**Dari daftar soal**, penyusun bisa klik asesi → masuk page penilaian (jawaban asesi kosong) → isi penilaian → TTD.

---

## Role: VALIDATOR

Setelah login, redirect ke `/validator/dashboard`.

### Bisa ngapain?

| # | Fitur | Page | Penjelasan |
|---|-------|------|------------|
| 1 | **Dashboard** | `/validator/dashboard` | Lihat semua jabker (sama kaya penyusun) |
| 2 | **Daftar Semua Skema** | `/validator/skema` | Lihat semua skema. Klik → lihat detail soal + lihat penilaian penyusun |
| 3 | **Nilai Asesi** | `/{idIzin}/nilai/{jenis}` | Sama kaya penyusun: masuk page penilaian, lihat jawaban asesi kosong, isi nilai |
| 4 | **Tanda Tangan** | Di akhir flow | Klik "Simpan & Tanda Tangan" → QR code di field `barcode_validator` |

**Catatan:** Validator **bisa melihat soal** yang sudah diinput penyusun. Validator **tidak perlu upload DOCX** — cukup nilai dan TTD.

---

## Role: MANAGER MUTU

Setelah login, redirect ke `/manager-mutu/dashboard`.

### Bisa ngapain?

| # | Fitur | Page | Penjelasan |
|---|-------|------|------------|
| 1 | **Dashboard** | `/manager-mutu/dashboard` | Lihat semua jabker |
| 2 | **Daftar Semua Skema** | `/manager-mutu/skema` | Sama kaya validator |
| 3 | **Nilai Asesi** | `/{idIzin}/nilai/{jenis}` | Sama kaya validator |
| 4 | **Tanda Tangan** | Di akhir flow | Sama kaya validator. QR code di field `barcode_manajer` |

**Catatan:** Flow Manager Mutu **IDENTIK** dengan Validator. Bedanya cuma:
- Nama role di system
- Field TTD: `barcode_manajer` (bukan `barcode_validator`)
- Endpoint QR: `/api/qr/{idIzin}/manager-mutu`

---

## Role: PRAKTISI

Setelah login, redirect ke `/praktisi/dashboard`.

### Bisa ngapain?

| # | Fitur | Page | Penjelasan |
|---|-------|------|------------|
| 1 | **Dashboard** | `/praktisi/dashboard` | Lihat jabker yang diassign ke dirinya. Klik → jawab soal |
| 2 | **Jawab Soal** | Ikut flow asesi | APL.01 → APL.02 → MUK steps → Asesmen steps → TTD |

**Alur jawab soal (mirip Asesi):**
```
APL.01 (isi data diri) → APL.02 (pilih metode, jawab) 
→ MUK steps (MAPA.01, MAPA.02, AK.07, AK.04, K3) 
→ Asesmen steps (IA.01–IA.10, AK.02–AK.06) 
→ TTD
```

**Catatan:** Praktisi flow mirip Asesi, tapi data di-scope per assign (bukan per jadwal asesmen). Praktisi cuma bisa liat & jawab jabker yang diassign ke dia.

---

## Perbandingan Fitur Antar Role

| Fitur | Penyusun | Validator | Manager Mutu | Praktisi |
|-------|:--------:|:---------:|:------------:|:--------:|
| Dashboard jabker | ✅ | ✅ | ✅ | ✅ (assigned only) |
| Input soal (upload DOCX) | ✅ | ❌ | ❌ | ❌ |
| Lihat soal | ✅ | ✅ | ✅ | ❌ |
| Daftar skema + progress peserta | ✅ | ✅ | ✅ | ❌ |
| Data dokumen | ✅ | ❌ | ❌ | ❌ |
| Penilaian (jawaban kosong) | ✅ | ✅ | ✅ | ❌ |
| Jawab soal (like asesi) | ❌ | ❌ | ❌ | ✅ |
| Lihat hasil MUK | ✅ | ❌ | ❌ | ❌ |
| TTD digital (QR) | ✅ `barcode_penyusun` | ✅ `barcode_validator` | ✅ `barcode_manajer` | ✅ `barcode_praktisi` |

---

## PART 2: TECHNICAL SPECIFICATION

---

## Tipe Soal KAN — Struktur Data

### IA.04B (id_dokumen=5, tipe=8)
```json
{
  "id_dokumen": 5, "tipe": 8, "no": 1,
  "soal": "Pertanyaan...",
  "soal1": "Lingkup penilaian",
  "soal2": "Kesesuaian (kode unit)",
  "id_unitkompetensi": null, "id_kuk": null
}
```
Ciri: `tipe=8` + `soal1` TERISI.

### IA.05 (id_dokumen=6, tipe=1)
```json
{
  "id_dokumen": 6, "tipe": 1, "no": 1,
  "soal": "Pertanyaan...",
  "jawab_a": "Opsi A", "jawab_b": "Opsi B",
  "jawab_c": "Opsi C", "jawab_d": "Opsi D",
  "jawaban": "A",
  "id_unitkompetensi": null, "id_kuk": null
}
```
Ciri: `tipe=1`.

### IA.06 (id_dokumen=7, tipe=8)
```json
{
  "id_dokumen": 7, "tipe": 8, "no": 1,
  "soal": "Pertanyaan...",
  "id_unitkompetensi": null, "id_kuk": null
}
```
Ciri: `tipe=8` + `soal1` KOSONG/null.

---

## API Endpoints

### Auth
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| POST | `/api/auth/login` | Udah ada. Harus support role_id baru |
| GET | `/api/auth/me` | Udah ada. Perlu return role_id 14/15/16 |

### Data Master (Input Soal)
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/kan/ref/skema/{id_jabker}` | Ambil ref unit kompetensi + KUK buat dropdown |
| GET | `/api/jabatan-kerja?search={nama}` | Search jabatan kerja |
| GET | `/api/kan/ref/dokumen/{id_jabatan}` | Dokumen KAN by jabatan |
| GET | `/api/kan/soal?dokumen_id={id}` | Get existing soal per dokumen |
| POST | `/api/kan/soal/bulk` | Bulk save soal (body: `{ soals: [...] }`) |

### Penyusun
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/penyusun/jabker` | List jabker di dashboard |
| GET | `/api/penyusun/skema` | List skema yg bisa diakses |
| GET | `/api/penyusun/skema/{id}/peserta` | Peserta per skema + status ngerjain |
| GET | `/api/penyusun/{idIzin}/ia04b` | Get IA.04B (soal + jawaban asesi kosong) |
| POST | `/api/penyusun/{idIzin}/ia04b` | Save IA.04B + penilaian |
| GET | `/api/penyusun/{idIzin}/ia05` | Get IA.05 |
| POST | `/api/penyusun/{idIzin}/ia05` | Save IA.05 + penilaian |
| GET | `/api/penyusun/{idIzin}/ia06` | Get IA.06 |
| POST | `/api/penyusun/{idIzin}/ia06` | Save IA.06 + penilaian |
| GET | `/api/penyusun/{idIzin}/muk` | Hasil MUK participant |
| POST | `/api/qr/{idIzin}/penyusun` | Generate QR TTD → `barcode_penyusun` |

### Validator
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/validator/jabker` | List jabker dashboard |
| GET | `/api/validator/skema` | List skema |
| GET | `/api/validator/{idIzin}/ia04b` | Get IA.04B |
| POST | `/api/validator/{idIzin}/ia04b` | Save IA.04B + penilaian |
| GET | `/api/validator/{idIzin}/ia05` | Get IA.05 |
| POST | `/api/validator/{idIzin}/ia05` | Save IA.05 + penilaian |
| GET | `/api/validator/{idIzin}/ia06` | Get IA.06 |
| POST | `/api/validator/{idIzin}/ia06` | Save IA.06 + penilaian |
| POST | `/api/qr/{idIzin}/validator` | Generate QR TTD → `barcode_validator` |

### Manager Mutu
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/manager-mutu/jabker` | List jabker dashboard |
| GET | `/api/manager-mutu/skema` | List skema |
| GET | `/api/manager-mutu/{idIzin}/ia04b` | Get IA.04B |
| POST | `/api/manager-mutu/{idIzin}/ia04b` | Save IA.04B + penilaian |
| GET | `/api/manager-mutu/{idIzin}/ia05` | Get IA.05 |
| POST | `/api/manager-mutu/{idIzin}/ia05` | Save IA.05 + penilaian |
| GET | `/api/manager-mutu/{idIzin}/ia06` | Get IA.06 |
| POST | `/api/manager-mutu/{idIzin}/ia06` | Save IA.06 + penilaian |
| POST | `/api/qr/{idIzin}/manager-mutu` | Generate QR TTD → `barcode_manajer` |

### Praktisi
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/praktisi/jabker` | List jabker yg diassign |
| GET | `/api/praktisi/{idIzin}/status` | Status pengerjaan |
| POST | `/api/praktisi/{idIzin}/jawab` | Submit jawaban |
| GET | `/api/praktisi/{idIzin}/apl01` | Get APL.01 |
| POST | `/api/praktisi/{idIzin}/apl01` | Save APL.01 |
| ... | Ikut flow asesi | APL.02, MUK, Asesmen |
| POST | `/api/qr/{idIzin}/praktisi` | Generate QR TTD praktisi |

### Existing — Update
| Method | Endpoint | Perubahan |
|--------|----------|-----------|
| GET | `/api/asesmen/{id}/data-dokumen` | Udah return `penyusun_*`, `validator_*`, `manajer_*` — OK |
| GET | `/api/dokumen/{idIzin}/muk` | Perlu return status TTD: penyusun, validator, manajer |

---

## Python Extractor

**File:** `pythonextractor.py` (udah ada di root project)

| Function | Input | Output |
|----------|-------|--------|
| `extract_ia04b(docx)` | File DOCX IA.04B | `[{no, lingkup, soal, kode_unit}]` |
| `extract_ia05(docx)` | File DOCX IA.05 | `[{no, soal, kode_kuk, jawab_a..d}]` |
| `extract_ia05b(docx)` | File DOCX kunci jawaban | `{no: jawaban}` |
| `extract_ia06(docx)` | File DOCX IA.06 | `[{no, soal, kode_kuk}]` |

Mapping field: `lingkup` → `soal1`, `kode_unit` → `soal2`, `a/b/c/d` → `jawab_a..d`, `kunci` → `jawaban`.

---

## Frontend Files

### Baru
| File | Role | Fungsi |
|------|------|--------|
| `src/pages/penyusun/DashboardPenyusun.tsx` | Penyusun | Dashboard + list jabker |
| `src/pages/penyusun/DaftarSkema.tsx` | Penyusun | List skema + progress peserta |
| `src/pages/penyusun/LihatSoal.tsx` | Penyusun | Input/scan soal KAN + preview |
| `src/pages/penyusun/MukResult.tsx` | Penyusun | Lihat hasil MUK |
| `src/pages/penyusun/Penilaian.tsx` | Penyusun | Halaman nilai asesi |
| `src/pages/validator/DashboardValidator.tsx` | Validator | Dashboard |
| `src/pages/validator/DaftarSkema.tsx` | Validator | List skema |
| `src/pages/validator/Penilaian.tsx` | Validator | Halaman nilai (reusable) |
| `src/pages/manager-mutu/DashboardManagerMutu.tsx` | Manager Mutu | Dashboard |
| `src/pages/manager-mutu/DaftarSkema.tsx` | Manager Mutu | List skema |
| `src/pages/manager-mutu/Penilaian.tsx` | Manager Mutu | Halaman nilai (reusable) |
| `src/pages/praktisi/DashboardPraktisi.tsx` | Praktisi | Dashboard + assigned jabker |
| `src/pages/praktisi/JawabSoal.tsx` | Praktisi | Flow jawab soal (mirip asesi) |

### Diubah
| File | Perubahan |
|------|-----------|
| `src/lib/rbac-config.ts` | Tambah `PENYUSUN=14`, `VALIDATOR=15`, `PRAKTISI=16`. Tambah `UserRole` type. Tambah `roleConfig` entries (sidebar, default route, layout) |
| `src/components/RoleRoute.tsx` | Tambah route wrappers buat 4 role |
| `src/App.tsx` | Tambah route blocks: `/penyusun/*`, `/validator/*`, `/manager-mutu/*`, `/praktisi/*` |
| `src/lib/kegiatan-service.ts` | Tambah method fetch buat tiap role |
| `src/lib/signing-config.ts` | Tambah signing config jenis baru: `penyusun`, `validator`, `manager_mutu` |
| `src/hooks/useSigningState.ts` | Extend signing state handle 3 role baru (barcode state, role detection, Ably channel) |

---

## Implementasi Order

### Phase 1 — Foundation (Frontend)
1. `rbac-config.ts` — role IDs, type, roleConfig
2. `RoleRoute.tsx` — wrappers
3. `App.tsx` — routes
4. `signing-config.ts` + `useSigningState.ts` — extend signing

### Phase 2 — Penyusun
5. Dashboard
6. Lihat Soal (input DOCX + preview + simpan)
7. Daftar Skema + progress peserta
8. Penilaian + TTD

### Phase 3 — Validator & Manager Mutu
9. Dashboard (reuse pola)
10. Daftar Skema (reuse)
11. Penilaian + TTD (beda endpoint)

### Phase 4 — Praktisi
12. Dashboard assigned jabker
13. Flow jawab soal

### Phase 5 — Backend
14. Semua endpoint per role table
15. Integration test

---

## Catatan Teknis

- **DOCX upload**: Via Vite middleware `/extract-upload` (dev only). Production pake backend sendiri kalo perlu extract Word.
- **File jabker**: `public/listjabker_extracted.json` harus ada buat dropdown.
- **TTD**: Reuse `useSigningState` + tambah role baru di barcode state machine.
- **Ably channel**: Perlu bedain signing channel biar ga overlap asesi/asesor. Format: `signing:{idIzin}:{role}`.
- **Praktisi**: Bisa reuse komponen asesi flow, endpoint prefix `/praktisi/` instead of `/asesi/`.
- **Python script**: `pythonextractor.py` dipanggil via backend/middleware setelah upload file.
