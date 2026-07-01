# Asesmen Jenjang Low Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add IA01-IA03 asesmen flow for jenjang_id < 4, replacing IA04A and IA04B.

**Architecture:** Centralized step selection in `asesmen-steps.ts` with jenjang_id parameter. New placeholder pages for IA01-IA03. Existing pages updated to pass jenjang_id.

**Tech Stack:** React, TypeScript, React Router, existing asesmen flow infrastructure.

---

## Task 1: Modify asesmen-steps.ts - Add LOW_JENJAH Step Arrays

**Files:**
- Modify: `src/lib/asesmen-steps.ts`

**Step 1: Add LOW_JENJAH step arrays**

Add after line 32 (after `ASESMEN_STEPS_ASESI`):

```typescript
// Asesmen Steps for Asesi (jenjang < 4) - IA01, IA02, IA03 instead of IA04A, IA04B
export const ASESMEN_STEPS_LOW_JENJAH_ASESI: StepConfig[] = [
  { number: 1, label: 'IA.01', href: '/asesi/asesmen/ia01' },
  { number: 2, label: 'IA.02', href: '/asesi/asesmen/ia02' },
  { number: 3, label: 'IA.03', href: '/asesi/asesmen/ia03' },
  { number: 4, label: 'Upload Tugas', href: '/asesi/asesmen/upload-tugas' },
  { number: 5, label: 'Ujian', href: '/asesi/asesmen/uji' },
  { number: 6, label: 'AK.02', href: '/asesi/asesmen/ak02' },
  { number: 7, label: 'AK.03', href: '/asesi/asesmen/ak03' },
  { number: 8, label: 'Selesai', href: '/asesi/asesmen/selesai' },
]

// Asesmen Steps for Asesor 1 (jenjang < 4)
export const ASESMEN_STEPS_LOW_JENJAH_ASESOR_1: StepConfig[] = [
  { number: 1, label: 'IA.01', href: '/asesi/asesmen/ia01' },
  { number: 2, label: 'IA.02', href: '/asesi/asesmen/ia02' },
  { number: 3, label: 'IA.03', href: '/asesi/asesmen/ia03' },
  { number: 4, label: 'Review Tugas', href: '/asesi/asesmen/upload-tugas' },
  { number: 5, label: 'IA.05', href: '/asesi/asesmen/ia05' },
  { number: 6, label: 'AK.02', href: '/asesi/asesmen/ak02' },
  { number: 7, label: 'AK.03', href: '/asesi/asesmen/ak03' },
  { number: 8, label: 'AK.05', href: '/asesi/asesmen/ak05' },
  { number: 9, label: 'AK.06', href: '/asesi/asesmen/ak06' },
  { number: 10, label: 'Selesai', href: '/asesi/asesmen/selesai' },
]

// Asesmen Steps for Asesor 2 (jenjang < 4)
export const ASESMEN_STEPS_LOW_JENJAH_ASESOR_2: StepConfig[] = [
  { number: 1, label: 'IA.01', href: '/asesi/asesmen/ia01' },
  { number: 2, label: 'IA.02', href: '/asesi/asesmen/ia02' },
  { number: 3, label: 'IA.03', href: '/asesi/asesmen/ia03' },
  { number: 4, label: 'Review Tugas', href: '/asesi/asesmen/upload-tugas' },
  { number: 5, label: 'IA.05', href: '/asesi/asesmen/ia05' },
  { number: 6, label: 'AK.02', href: '/asesi/asesmen/ak02' },
  { number: 7, label: 'AK.05', href: '/asesi/asesmen/ak05' },
  { number: 8, label: 'AK.06', href: '/asesi/asesmen/ak06' },
  { number: 9, label: 'Selesai', href: '/asesi/asesmen/selesai' },
]
```

**Step 2: Update getAsesmenSteps function signature and logic**

Replace the existing `getAsesmenSteps` function (lines 63-78) with:

```typescript
// Get asesmen steps based on jenjang_id and asesor role
export function getAsesmenSteps(
  jenjangId: string,
  isAsesor: boolean,
  asesorRole: 'asesor_1' | 'asesor_2' | 'asesor_other' | 'none',
  asesorCount: number
): StepConfig[] {
  const isLowJenjang = jenjangId && parseInt(jenjangId) < 4

  if (!isAsesor) {
    return isLowJenjang ? ASESMEN_STEPS_LOW_JENJAH_ASESI : ASESMEN_STEPS_ASESI
  }

  if (asesorRole === 'asesor_1') {
    return isLowJenjang ? ASESMEN_STEPS_LOW_JENJAH_ASESOR_1 : ASESMEN_STEPS_ASESOR_1
  }

  if (asesorRole === 'asesor_2') {
    return isLowJenjang ? ASESMEN_STEPS_LOW_JENJAH_ASESOR_2 : ASESMEN_STEPS_ASESOR_2
  }

  // For asesor_other (asesor 3+), use same steps as asesor_2 for now
  return isLowJenjang ? ASESMEN_STEPS_LOW_JENJAH_ASESOR_2 : ASESMEN_STEPS_ASESOR_2
}
```

**Step 3: Commit changes**

```bash
git add src/lib/asesmen-steps.ts
git commit -m "feat: add low jenjang step arrays (IA01-IA03) and update getAsesmenSteps

- Add ASESMEN_STEPS_LOW_JENJAH_ASESI, ASESMEN_STEPS_LOW_JENJAH_ASESOR_1, ASESMEN_STEPS_LOW_JENJAH_ASESOR_2
- Update getAsesmenSteps to accept jenjangId parameter and return appropriate steps

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Create Ia01Page.tsx Placeholder

**Files:**
- Create: `src/pages/asesi/asesmen/Ia01Page.tsx`

**Step 1: Create the placeholder page**

```typescript
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import DashboardNavbar from "@/components/DashboardNavbar"
import ModularAsesiLayout from "@/components/ModularAsesiLayout"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/ToastContext"
import { useDataDokumenAsesmen } from "@/hooks/useDataDokumenAsesmen"
import { useAsesorRole } from "@/hooks/useAsesorRole"
import { useKegiatanByRole } from "@/hooks/useKegiatanByRole"
import { useAbsenCheck } from "@/hooks/useAbsenCheck"
import { FullPageLoader } from "@/components/ui/loading-spinner"
import { getAsesmenSteps } from "@/lib/asesmen-steps"
import { CustomCheckbox } from "@/components/ui/Checkbox"
import { ActionButton } from "@/components/ui/ActionButton"
import { WebcamModal } from "@/components/ui/WebcamModal"

export default function Ia01Page() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { id } = useParams<{ id?: string }>()
  const { jabatanKerja, nomorSkema, namaAsesor: _namaAsesor, tuk, asesorList, namaAsesi } = useDataDokumenAsesmen(id)
  const { role: asesorRole, isAsesor1 } = useAsesorRole(id)
  const { showSuccess, showWarning } = useToast()
  const { kegiatan, isAsesor } = useKegiatanByRole()

  const [isLoading, setIsLoading] = useState(true)
  const [agreedChecklist, setAgreedChecklist] = useState(false)
  const jenjangId = kegiatan?.jenjang_id || "0"

  // Absen check - auto-detect role
  const { showAwalModal, submitAbsenAwal, handleAwalModalClose } = useAbsenCheck({
    phase: 'asesmen',
    role: 'auto',
    checkOnMount: true,
    idIzin: id,
    asesorList
  })

  // Get dynamic steps based on jenjang and asesor role
  const asesmenSteps = getAsesmenSteps(jenjangId, isAsesor, asesorRole, asesorList.length)

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return

      if (!id) {
        console.error("No id_izin found in user data")
        setIsLoading(false)
        return
      }

      try {
        const token = localStorage.getItem("access_token")
        const response = await fetch(`https://backend.devgatensi.site/api/asesmen/${id}/ia01`, {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const result = await response.json()
          console.log("IA01 data:", result)
        }
      } catch (error) {
        console.error("Error fetching IA01:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, authLoading, user, asesorList])

  const handleNext = async () => {
    if (!agreedChecklist) {
      showWarning('Silakan centang pernyataan terlebih dahulu')
      return
    }

    // Generate QR if needed
    const jadwalId = kegiatan?.jadwal_id
    const token = localStorage.getItem("access_token")

    if (jadwalId) {
      try {
        const qrResponse = await fetch(`https://backend.devgatensi.site/api/qr/${id}/ia01`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            id_jadwal: jadwalId
          })
        })

        if (qrResponse.ok) {
          console.log("QR IA01 generated")
        }
      } catch (qrError) {
        console.error('Error generating QR:', qrError)
      }
    }

    showSuccess('IA.01 berhasil disimpan!')
    setTimeout(() => {
      navigate(`/asesi/asesmen/${id}/ia02`)
    }, 500)
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <DashboardNavbar userName={user?.name} />
        <FullPageLoader text="Memuat data IA.01..." />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Header */}
      <DashboardNavbar userName={user?.name} />

      {/* Breadcrumb */}
      <div style={{ borderBottom: '1px solid #999', background: '#fff' }}>
        <div style={{ padding: '12px 16px', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#666' }}>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate("/asesi/dashboard")}>Dashboard</span>
            <span>/</span>
            <span>Asesmen</span>
            <span>/</span>
            <span>IA.01</span>
          </div>
        </div>
      </div>

      <ModularAsesiLayout currentStep={1} steps={asesmenSteps} id={id}>
        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', letterSpacing: '1px' }}>
            FR.IA.01. FORMULIR ASESMEN MANDIRI
          </h1>
        </div>

        {/* Placeholder Content */}
        <div style={{
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
            Halaman ini sedang dalam pengembangan
          </p>
          <p style={{ fontSize: '14px', color: '#999' }}>
            Formulir IA.01 akan ditampilkan di sini
          </p>
        </div>

        {/* Actions */}
        <div style={{ marginTop: '20px' }}>
          {/* Pernyataan Checkbox */}
          <div style={{ background: '#fff', border: '1px solid #999', borderRadius: '4px', padding: '16px', marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <CustomCheckbox
                checked={agreedChecklist}
                onChange={() => setAgreedChecklist(!agreedChecklist)}
                style={{ marginTop: '2px' }}
              />
              <span style={{ fontSize: '13px', color: '#333' }}>
                Saya menyatakan dengan sebenar-benarnya bahwa saya telah memahami instruksi tugas terstruktur dan akan menyelesaikan tugas tersebut sesuai dengan ketentuan yang berlaku.
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <ActionButton variant="secondary" onClick={() => navigate("/asesi/dashboard")}>
              Kembali
            </ActionButton>
            <ActionButton variant="primary" disabled={!agreedChecklist} onClick={handleNext}>
              Lanjut
            </ActionButton>
          </div>
        </div>
      </ModularAsesiLayout>

      {/* Absen Awal Modal */}
      <WebcamModal
        isOpen={showAwalModal}
        onClose={handleAwalModalClose}
        onSubmit={submitAbsenAwal}
        title="Absen Masuk Asesmen"
        description="Silakan ambil foto wajah Anda untuk absen masuk"
        canClose={false}
      />
    </div>
  )
}
```

**Step 2: Commit changes**

```bash
git add src/pages/asesi/asesmen/Ia01Page.tsx
git commit -m "feat: add IA01 placeholder page

- Create Ia01Page with empty placeholder content
- Include absen check and QR generation
- Navigate to IA02 on submit

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Create Ia02Page.tsx Placeholder

**Files:**
- Create: `src/pages/asesi/asesmen/Ia02Page.tsx`

**Step 1: Create the placeholder page**

```typescript
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import DashboardNavbar from "@/components/DashboardNavbar"
import ModularAsesiLayout from "@/components/ModularAsesiLayout"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/ToastContext"
import { useDataDokumenAsesmen } from "@/hooks/useDataDokumenAsesmen"
import { useAsesorRole } from "@/hooks/useAsesorRole"
import { useKegiatanByRole } from "@/hooks/useKegiatanByRole"
import { FullPageLoader } from "@/components/ui/loading-spinner"
import { getAsesmenSteps } from "@/lib/asesmen-steps"
import { CustomCheckbox } from "@/components/ui/Checkbox"
import { ActionButton } from "@/components/ui/ActionButton"

export default function Ia02Page() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { id } = useParams<{ id?: string }>()
  const { jabatanKerja, nomorSkema, namaAsesor: _namaAsesor, tuk, asesorList, namaAsesi } = useDataDokumenAsesmen(id)
  const { role: asesorRole } = useAsesorRole(id)
  const { showSuccess, showWarning } = useToast()
  const { kegiatan, isAsesor } = useKegiatanByRole()

  const [isLoading, setIsLoading] = useState(true)
  const [agreedChecklist, setAgreedChecklist] = useState(false)
  const jenjangId = kegiatan?.jenjang_id || "0"

  // Get dynamic steps based on jenjang and asesor role
  const asesmenSteps = getAsesmenSteps(jenjangId, isAsesor, asesorRole, asesorList.length)

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return

      if (!id) {
        console.error("No id_izin found in user data")
        setIsLoading(false)
        return
      }

      try {
        const token = localStorage.getItem("access_token")
        const response = await fetch(`https://backend.devgatensi.site/api/asesmen/${id}/ia02`, {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const result = await response.json()
          console.log("IA02 data:", result)
        }
      } catch (error) {
        console.error("Error fetching IA02:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, authLoading, user, asesorList])

  const handleNext = async () => {
    if (!agreedChecklist) {
      showWarning('Silakan centang pernyataan terlebih dahulu')
      return
    }

    const jadwalId = kegiatan?.jadwal_id
    const token = localStorage.getItem("access_token")

    if (jadwalId) {
      try {
        const qrResponse = await fetch(`https://backend.devgatensi.site/api/qr/${id}/ia02`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            id_jadwal: jadwalId
          })
        })

        if (qrResponse.ok) {
          console.log("QR IA02 generated")
        }
      } catch (qrError) {
        console.error('Error generating QR:', qrError)
      }
    }

    showSuccess('IA.02 berhasil disimpan!')
    setTimeout(() => {
      navigate(`/asesi/asesmen/${id}/ia03`)
    }, 500)
  }

  const handleBack = () => {
    navigate(`/asesi/asesmen/${id}/ia01`)
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <DashboardNavbar userName={user?.name} />
        <FullPageLoader text="Memuat data IA.02..." />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <DashboardNavbar userName={user?.name} />

      <div style={{ borderBottom: '1px solid #999', background: '#fff' }}>
        <div style={{ padding: '12px 16px', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#666' }}>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate("/asesi/dashboard")}>Dashboard</span>
            <span>/</span>
            <span>Asesmen</span>
            <span>/</span>
            <span>IA.02</span>
          </div>
        </div>
      </div>

      <ModularAsesiLayout currentStep={2} steps={asesmenSteps} id={id}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', letterSpacing: '1px' }}>
            FR.IA.02. LEMBAR KERJA ASESMEN
          </h1>
        </div>

        <div style={{
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
            Halaman ini sedang dalam pengembangan
          </p>
          <p style={{ fontSize: '14px', color: '#999' }}>
            Formulir IA.02 akan ditampilkan di sini
          </p>
        </div>

        <div style={{ marginTop: '20px' }}>
          <div style={{ background: '#fff', border: '1px solid #999', borderRadius: '4px', padding: '16px', marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <CustomCheckbox
                checked={agreedChecklist}
                onChange={() => setAgreedChecklist(!agreedChecklist)}
                style={{ marginTop: '2px' }}
              />
              <span style={{ fontSize: '13px', color: '#333' }}>
                Saya menyatakan dengan sebenar-benarnya bahwa saya telah memahami instruksi tugas terstruktur dan akan menyelesaikan tugas tersebut sesuai dengan ketentuan yang berlaku.
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <ActionButton variant="secondary" onClick={handleBack}>
              Kembali
            </ActionButton>
            <ActionButton variant="primary" disabled={!agreedChecklist} onClick={handleNext}>
              Lanjut
            </ActionButton>
          </div>
        </div>
      </ModularAsesiLayout>
    </div>
  )
}
```

**Step 2: Commit changes**

```bash
git add src/pages/asesi/asesmen/Ia02Page.tsx
git commit -m "feat: add IA02 placeholder page

- Create Ia02Page with empty placeholder content
- Include QR generation
- Navigate to IA03 on submit

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Create Ia03Page.tsx Placeholder

**Files:**
- Create: `src/pages/asesi/asesmen/Ia03Page.tsx`

**Step 1: Create the placeholder page**

```typescript
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import DashboardNavbar from "@/components/DashboardNavbar"
import ModularAsesiLayout from "@/components/ModularAsesiLayout"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/ToastContext"
import { useDataDokumenAsesmen } from "@/hooks/useDataDokumenAsesmen"
import { useAsesorRole } from "@/hooks/useAsesorRole"
import { useKegiatanByRole } from "@/hooks/useKegiatanByRole"
import { FullPageLoader } from "@/components/ui/loading-spinner"
import { getAsesmenSteps } from "@/lib/asesmen-steps"
import { CustomCheckbox } from "@/components/ui/Checkbox"
import { ActionButton } from "@/components/ui/ActionButton"

export default function Ia03Page() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { id } = useParams<{ id?: string }>()
  const { jabatanKerja, nomorSkema, namaAsesor: _namaAsesor, tuk, asesorList, namaAsesi } = useDataDokumenAsesmen(id)
  const { role: asesorRole } = useAsesorRole(id)
  const { showSuccess, showWarning } = useToast()
  const { kegiatan, isAsesor } = useKegiatanByRole()

  const [isLoading, setIsLoading] = useState(true)
  const [agreedChecklist, setAgreedChecklist] = useState(false)
  const jenjangId = kegiatan?.jenjang_id || "0"

  // Get dynamic steps based on jenjang and asesor role
  const asesmenSteps = getAsesmenSteps(jenjangId, isAsesor, asesorRole, asesorList.length)

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return

      if (!id) {
        console.error("No id_izin found in user data")
        setIsLoading(false)
        return
      }

      try {
        const token = localStorage.getItem("access_token")
        const response = await fetch(`https://backend.devgatensi.site/api/asesmen/${id}/ia03`, {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const result = await response.json()
          console.log("IA03 data:", result)
        }
      } catch (error) {
        console.error("Error fetching IA03:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, authLoading, user, asesorList])

  const handleNext = async () => {
    if (!agreedChecklist) {
      showWarning('Silakan centang pernyataan terlebih dahulu')
      return
    }

    const jadwalId = kegiatan?.jadwal_id
    const token = localStorage.getItem("access_token")

    if (jadwalId) {
      try {
        const qrResponse = await fetch(`https://backend.devgatensi.site/api/qr/${id}/ia03`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            id_jadwal: jadwalId
          })
        })

        if (qrResponse.ok) {
          console.log("QR IA03 generated")
        }
      } catch (qrError) {
        console.error('Error generating QR:', qrError)
      }
    }

    showSuccess('IA.03 berhasil disimpan!')
    setTimeout(() => {
      navigate(`/asesi/asesmen/${id}/upload-tugas`)
    }, 500)
  }

  const handleBack = () => {
    navigate(`/asesi/asesmen/${id}/ia02`)
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <DashboardNavbar userName={user?.name} />
        <FullPageLoader text="Memuat data IA.03..." />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <DashboardNavbar userName={user?.name} />

      <div style={{ borderBottom: '1px solid #999', background: '#fff' }}>
        <div style={{ padding: '12px 16px', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#666' }}>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate("/asesi/dashboard")}>Dashboard</span>
            <span>/</span>
            <span>Asesmen</span>
            <span>/</span>
            <span>IA.03</span>
          </div>
        </div>
      </div>

      <ModularAsesiLayout currentStep={3} steps={asesmenSteps} id={id}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', letterSpacing: '1px' }}>
            FR.IA.03. PANDUAN PEMBUKTIAN KOMPETENSI
          </h1>
        </div>

        <div style={{
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
            Halaman ini sedang dalam pengembangan
          </p>
          <p style={{ fontSize: '14px', color: '#999' }}>
            Formulir IA.03 akan ditampilkan di sini
          </p>
        </div>

        <div style={{ marginTop: '20px' }}>
          <div style={{ background: '#fff', border: '1px solid #999', borderRadius: '4px', padding: '16px', marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <CustomCheckbox
                checked={agreedChecklist}
                onChange={() => setAgreedChecklist(!agreedChecklist)}
                style={{ marginTop: '2px' }}
              />
              <span style={{ fontSize: '13px', color: '#333' }}>
                Saya menyatakan dengan sebenar-benarnya bahwa saya telah memahami instruksi tugas terstruktur dan akan menyelesaikan tugas tersebut sesuai dengan ketentuan yang berlaku.
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <ActionButton variant="secondary" onClick={handleBack}>
              Kembali
            </ActionButton>
            <ActionButton variant="primary" disabled={!agreedChecklist} onClick={handleNext}>
              Lanjut
            </ActionButton>
          </div>
        </div>
      </ModularAsesiLayout>
    </div>
  )
}
```

**Step 2: Commit changes**

```bash
git add src/pages/asesi/asesmen/Ia03Page.tsx
git commit -m "feat: add IA03 placeholder page

- Create Ia03Page with empty placeholder content
- Include QR generation
- Navigate to Upload Tugas on submit

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Add Routes to App.tsx

**Files:**
- Modify: `src/App.tsx`

**Step 1: Find the asesmen route section**

Look for existing asesmen routes around line with `/asesi/asesmen/ia04a` or similar patterns.

**Step 2: Add new routes**

Add these routes with other asesmen routes:

```tsx
import Ia01Page from "@/pages/asesi/asesmen/Ia01Page"
import Ia02Page from "@/pages/asesi/asesmen/Ia02Page"
import Ia03Page from "@/pages/asesi/asesmen/Ia03Page"
```

Then add the route definitions:

```tsx
<Route path="/asesi/asesmen/:id/ia01" element={<ProtectedRoute><Ia01Page /></ProtectedRoute>} />
<Route path="/asesi/asesmen/:id/ia02" element={<ProtectedRoute><Ia02Page /></ProtectedRoute>} />
<Route path="/asesi/asesmen/:id/ia03" element={<ProtectedRoute><Ia03Page /></ProtectedRoute>} />
```

**Step 3: Commit changes**

```bash
git add src/App.tsx
git commit -m "feat: add routes for IA01-IA03 pages

- Import Ia01Page, Ia02Page, Ia03Page components
- Add protected routes for /asesi/asesmen/:id/ia01, ia02, ia03

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Update AsesmenPage.tsx Entry Point

**Files:**
- Modify: `src/pages/asesi/AsesmenPage.tsx`

**Step 1: Modify to check jenjang_id**

Replace the entire file content with:

```typescript
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { useKegiatanByRole } from "@/hooks/useKegiatanByRole"
import { FullPageLoader } from "@/components/ui/loading-spinner"

export default function AsesmenPage() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { kegiatan, isLoading: kegiatanLoading } = useKegiatanByRole()

  useEffect(() => {
    // Wait for auth and kegiatan data to load
    if (authLoading || kegiatanLoading) {
      return
    }

    if (!user || !kegiatan) {
      console.error("No user or kegiatan data")
      return
    }

    // Check jenjang_id to determine which flow to use
    const jenjangId = parseInt(kegiatan.jenjang_id || "0")
    const isFirstStep = kegiatan.is_started === "0"

    // For jenjang < 4, start at IA01
    // For jenjang >= 4, start at IA04A
    if (jenjangId < 4) {
      navigate("/asesi/asesmen/ia01", { replace: true })
    } else {
      navigate("/asesi/asesmen/ia04a", { replace: true })
    }
  }, [navigate, user, kegiatan, authLoading, kegiatanLoading])

  // Show loader while checking jenjang_id
  if (authLoading || kegiatanLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <FullPageLoader text="Memuat asesmen..." />
      </div>
    )
  }

  return null // This page just redirects
}
```

**Step 2: Commit changes**

```bash
git add src/pages/asesi/AsesmenPage.tsx
git commit -m "feat: update AsesmenPage to check jenjang_id

- Check jenjang_id to determine entry point (IA01 for jenjang < 4, IA04A otherwise)
- Show loader while checking kegiatan data

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Update Ia04aPage.tsx to Pass jenjang_id

**Files:**
- Modify: `src/pages/asesi/asesmen/Ia04aPage.tsx`

**Step 1: Find getAsesmenSteps call (around line 190)**

Change:
```typescript
const asesmenSteps = getAsesmenSteps(isAsesor, asesorRole, asesorList.length)
```

To:
```typescript
const jenjangId = kegiatan?.jenjang_id || "0"
const asesmenSteps = getAsesmenSteps(jenjangId, isAsesor, asesorRole, asesorList.length)
```

**Step 2: Commit changes**

```bash
git add src/pages/asesi/asesmen/Ia04aPage.tsx
git commit -m "refactor: pass jenjang_id to getAsesmenSteps in Ia04aPage

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Update Ia04bPage.tsx to Pass jenjang_id

**Files:**
- Modify: `src/pages/asesi/asesmen/Ia04bPage.tsx`

**Step 1: Find getAsesmenSteps call**

Change:
```typescript
const asesmenSteps = getAsesmenSteps(isAsesor, asesorRole, asesorList.length)
```

To:
```typescript
const jenjangId = kegiatan?.jenjang_id || "0"
const asesmenSteps = getAsesmenSteps(jenjangId, isAsesor, asesorRole, asesorList.length)
```

**Step 2: Commit changes**

```bash
git add src/pages/asesi/asesmen/Ia04bPage.tsx
git commit -m "refactor: pass jenjang_id to getAsesmenSteps in Ia04bPage

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Update Ia05Page.tsx to Pass jenjang_id

**Files:**
- Modify: `src/pages/asesi/asesmen/Ia05Page.tsx`

**Step 1: Find getAsesmenSteps call**

Change:
```typescript
const asesmenSteps = getAsesmenSteps(isAsesor, asesorRole, asesorList.length)
```

To:
```typescript
const jenjangId = kegiatan?.jenjang_id || "0"
const asesmenSteps = getAsesmenSteps(jenjangId, isAsesor, asesorRole, asesorList.length)
```

**Step 2: Commit changes**

```bash
git add src/pages/asesi/asesmen/Ia05Page.tsx
git commit -m "refactor: pass jenjang_id to getAsesmenSteps in Ia05Page

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Update UploadTugasPage.tsx to Pass jenjang_id

**Files:**
- Modify: `src/pages/asesi/asesmen/UploadTugasPage.tsx`

**Step 1: Find getAsesmenSteps call**

Change:
```typescript
const asesmenSteps = getAsesmenSteps(isAsesor, asesorRole, asesorList.length)
```

To:
```typescript
const jenjangId = kegiatan?.jenjang_id || "0"
const asesmenSteps = getAsesmenSteps(jenjangId, isAsesor, asesorRole, asesorList.length)
```

**Step 2: Commit changes**

```bash
git add src/pages/asesi/asesmen/UploadTugasPage.tsx
git commit -m "refactor: pass jenjang_id to getAsesmenSteps in UploadTugasPage

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 11: Update UjianPage.tsx to Pass jenjang_id

**Files:**
- Modify: `src/pages/asesi/asesmen/UjianPage.tsx`

**Step 1: Find getAsesmenSteps call**

Change:
```typescript
const asesmenSteps = getAsesmenSteps(isAsesor, asesorRole, asesorList.length)
```

To:
```typescript
const jenjangId = kegiatan?.jenjang_id || "0"
const asesmenSteps = getAsesmenSteps(jenjangId, isAsesor, asesorRole, asesorList.length)
```

**Step 2: Commit changes**

```bash
git add src/pages/asesi/asesmen/UjianPage.tsx
git commit -m "refactor: pass jenjang_id to getAsesmenSteps in UjianPage

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 12: Update Ak02Page.tsx to Pass jenjang_id

**Files:**
- Modify: `src/pages/asesi/asesmen/Ak02Page.tsx`

**Step 1: Find getAsesmenSteps call**

Change:
```typescript
const asesmenSteps = getAsesmenSteps(isAsesor, asesorRole, asesorList.length)
```

To:
```typescript
const jenjangId = kegiatan?.jenjang_id || "0"
const asesmenSteps = getAsesmenSteps(jenjangId, isAsesor, asesorRole, asesorList.length)
```

**Step 2: Commit changes**

```bash
git add src/pages/asesi/asesmen/Ak02Page.tsx
git commit -m "refactor: pass jenjang_id to getAsesmenSteps in Ak02Page

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 13: Update Ak03Page.tsx to Pass jenjang_id

**Files:**
- Modify: `src/pages/asesi/asesmen/Ak03Page.tsx`

**Step 1: Find getAsesmenSteps call**

Change:
```typescript
const asesmenSteps = getAsesmenSteps(isAsesor, asesorRole, asesorList.length)
```

To:
```typescript
const jenjangId = kegiatan?.jenjang_id || "0"
const asesmenSteps = getAsesmenSteps(jenjangId, isAsesor, asesorRole, asesorList.length)
```

**Step 2: Commit changes**

```bash
git add src/pages/asesi/asesmen/Ak03Page.tsx
git commit -m "refactor: pass jenjang_id to getAsesmenSteps in Ak03Page

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 14: Update Ak05Page.tsx to Pass jenjang_id

**Files:**
- Modify: `src/pages/asesi/asesmen/Ak05Page.tsx`

**Step 1: Find getAsesmenSteps call**

Change:
```typescript
const asesmenSteps = getAsesmenSteps(isAsesor, asesorRole, asesorList.length)
```

To:
```typescript
const jenjangId = kegiatan?.jenjang_id || "0"
const asesmenSteps = getAsesmenSteps(jenjangId, isAsesor, asesorRole, asesorList.length)
```

**Step 2: Commit changes**

```bash
git add src/pages/asesi/asesmen/Ak05Page.tsx
git commit -m "refactor: pass jenjang_id to getAsesmenSteps in Ak05Page

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 15: Update Ak06Page.tsx to Pass jenjang_id

**Files:**
- Modify: `src/pages/asesi/asesmen/Ak06Page.tsx`

**Step 1: Find getAsesmenSteps call**

Change:
```typescript
const asesmenSteps = getAsesmenSteps(isAsesor, asesorRole, asesorList.length)
```

To:
```typescript
const jenjangId = kegiatan?.jenjang_id || "0"
const asesmenSteps = getAsesmenSteps(jenjangId, isAsesor, asesorRole, asesorList.length)
```

**Step 2: Commit changes**

```bash
git add src/pages/asesi/asesmen/Ak06Page.tsx
git commit -m "refactor: pass jenjang_id to getAsesmenSteps in Ak06Page

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 16: Update AsesmenSelesaiPage.tsx to Pass jenjang_id

**Files:**
- Modify: `src/pages/asesi/asesmen/AsesmenSelesaiPage.tsx`

**Step 1: Find getAsesmenSteps call**

Change:
```typescript
const asesmenSteps = getAsesmenSteps(isAsesor, asesorRole, asesorList.length)
```

To:
```typescript
const jenjangId = kegiatan?.jenjang_id || "0"
const asesmenSteps = getAsesmenSteps(jenjangId, isAsesor, asesorRole, asesorList.length)
```

**Step 2: Commit changes**

```bash
git add src/pages/asesi/asesmen/AsesmenSelesaiPage.tsx
git commit -m "refactor: pass jenjang_id to getAsesmenSteps in AsesmenSelesaiPage

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 17: Build and Verify

**Step 1: Build the project**

```bash
cd "C:\LSP\penyatuan\sisuj"
npm run build
```

Expected: Build succeeds with no TypeScript errors

**Step 2: Check for any remaining files using old getAsesmenSteps signature**

```bash
cd "C:\LSP\penyatuan\sisuj"
grep -r "getAsesmenSteps(isAsesor" src/
```

Expected: Only results should be in files we've already updated

**Step 3: Final commit if needed**

If any issues found and fixed:

```bash
git add .
git commit -m "fix: resolve remaining getAsesmenSteps calls

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Testing Notes

After implementation:

1. **Test jenjang < 4 flow:**
   - Login as asesi with jenjang_id 1, 2, or 3
   - Navigate to `/asesi/asesmen`
   - Should redirect to IA01
   - Steps should show: IA.01 → IA.02 → IA.03 → Upload Tugas → Ujian → AK.02 → AK.03 → Selesai

2. **Test jenjang >= 4 flow (regression):**
   - Login as asesi with jenjang_id 4 or higher
   - Navigate to `/asesi/asesmen`
   - Should redirect to IA04A
   - Steps should show: IA.04.A → Upload Tugas → IA.04.B → Ujian → AK.02 → AK.03 → Selesai

3. **Test asesor flows:**
   - Verify asesor 1 and asesor 2 steps for both jenjang ranges
