# IA01 Asesmen Page Design

**Date:** 2025-03-09
**Status:** Approved
**File:** `src/pages/asesi/asesmen/Ia01Page.tsx`

## Overview

Create the IA01 (FR.IA.01 - CEKLIS OBSERVASI AKTIVITAS DI TEMPAT KERJA ATAU TEMPAT KERJA SIMULASI) page where asesor evaluates asesi's competence across multiple kelompok kerja.

## User Access

- **Editable by:** Asesor 1 only (asesor_2 read-only)
- **Read-only for:** Asesi, Asesor 2

## Page Layout

### 1. Header Section
- Title: "FR.IA.01. CEKLIS OBSERVASI AKTIVITAS DITEMPAT KERJA ATAU TEMPAT KERJA SIMULASI"
- Identity table (same pattern as Ak02Page):
  - Skema Sertifikasi (Judul, Nomor)
  - TUK
  - Nama Asesor 1 & 2 (dynamic based on asesorList)
  - Nama Asesi
  - Tanggal Asesmen

### 2. Panduan Bagi Asesor
- Read-only instruction box with bullet points
- Styled with red header bar

### 3. Kelompok Kerja Sections
- All kelompok_kerja displayed in scrollable view
- Each kelompok shows:
  - Units with kode_unit and nama_unit
  - Subunits within units
  - Soal rows with:
    - No (question number)
    - Elemen (subunit name)
    - Kriteria Unjuk Kerja (KUK name)
    - Standar Industri / Tempat Kerja
    - Pencapaian: Ya/Tidak checkboxes (CustomCheckbox, mutually exclusive)
    - Penilaian Lanjut: text input (optional)

### 4. Umpan Balik Section
- Per kelompok kerja at the bottom
- Textarea for "Umpan Balik untuk asesi"

### 5. Signature/QR Section
- Asesi name + QR
- Asesor 1 name + QR
- Asesor 2 name + QR (if exists)

## Data Structure

### TypeScript Interfaces

```typescript
interface SoalAnswer {
  soal_id: number
  pencapaian: boolean | null  // Ya=true, Tidak=false, null=unanswered
  penilaian_lanjut: string | null
}

interface KelompokFeedback {
  kelompok_id: number
  umpan_balik: string
}

interface BarcodeData {
  url: string
  tanggal: string
  nama: string
}

interface Ia01Response {
  message: string
  data: {
    barcodes?: {
      asesi?: BarcodeData | null
      asesor1?: BarcodeData | null
      asesor2?: BarcodeData | null
    }
    kelompok_kerja: {
      id: number
      kode: string
      nama_dokumen: string
      kelompok_kerja: KelompokKerjaItem[]
    }
    referensi_form: { id: number, nama: string }[]
  }
}

interface KelompokKerjaItem {
  id: number
  nama: string
  urut: string
  umpan_balik: string | null
  units: Unit[]
}

interface Unit {
  id_unit: number
  nama_unit: string
  kode_unit: string
  subunits: Subunit[]
}

interface Subunit {
  id: number
  nama: string
  soal: Soal[]
}

interface Soal {
  id: number
  no: string
  jenis: string
  id_kelompok: number
  penilaian_lanjut: string | null
  pencapaian: boolean | null
  kuk: { id: number, nama: string }
}
```

## State Management

```typescript
const [soalAnswers, setSoalAnswers] = useState<Record<number, SoalAnswer>>({})
const [kelompokFeedback, setKelompokFeedback] = useState<Record<number, string>>({})
const [barcodes, setBarcodes] = useState<{
  asesi?: BarcodeData
  asesor1?: BarcodeData | null
  asesor2?: BarcodeData | null
} | null>(null)
const [agreedChecklist, setAgreedChecklist] = useState(false)
```

## API Endpoints

### GET `/asesmen/{id}/ia01`
Fetches initial data including:
- Barcodes (existing signatures)
- Kelompok kerja with nested units, subunits, soal
- Existing answers (pencapaian, penilaian_lanjut)
- Existing umpan_balik per kelompok

### POST `/asesmen/{id}/ia01`
Saves assessment answers:
```json
{
  "dokumen_id": 5895,
  "answers": [
    { "soal_id": 79867, "penilaian_lanjut": null, "pencapaian": true }
  ],
  "feedback": [
    { "kelompok_id": 420, "umpan_balik": "..." }
  ]
}
```

### POST `/qr/{id}/ia01`
Generates QR code for signature:
```json
{
  "id_jadwal": jadwalId
}
```

## UI Components

### 1. Collapsible Kelompok Section
- Header with kelompok name and expand/collapse toggle
- Shows units within when expanded

### 2. Soal Row with CustomCheckbox
- Table row with:
  - No (centered)
  - Elemen (subunit name)
  - Kriteria Unjuk Kerja (KUK description)
  - Standar Industri / Tempat Kerja
  - Pencapaian: Two CustomCheckbox components (Ya | Tidak)
  - Penilaian Lanjut: text input

### 3. Mutually Exclusive Checkboxes
```typescript
const handlePencapaianChange = (soalId: number, value: boolean) => {
  setSoalAnswers(prev => ({
    ...prev,
    [soalId]: {
      ...prev[soalId],
      pencapaian: value
    }
  }))
}
```

### 4. Form Disabled State
```typescript
const isFormDisabled = !isAsesor1
```

## Styling

- Follow existing inline styles pattern
- Red header bars for section titles (#c40000)
- Border styles:
  - Main borders: 2px solid #000
  - Cell borders: 1px solid #000
- Font: Arial, Helvetica, sans-serif
- Font sizes: 11-14px range

## Validation

- Require agreedChecklist before save
- Show warning if not all soal have pencapaian selected
- Navigate to IA02 after successful save

## Navigation

- **Kembali button**: Navigate to previous step
- **Lanjut button**: Save and navigate to IA02
