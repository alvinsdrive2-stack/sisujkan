# Asesmen Flow for Jenjang < 4 - Design Document

**Date:** 2026-03-05
**Status:** Approved

## Overview

Modify the asesmen flow to use different steps (IA01, IA02, IA03) for jenjang_id < 4, replacing IA04A and IA04B.

## Requirements

1. **Jenjang 1, 2, 3** (`jenjang_id < 4`) use new flow with IA01-IA03
2. **Jenjang 4+** continues using existing flow with IA04A-IA04B
3. Pra-asesmen flow remains unchanged
4. IA01-IA03 pages are placeholders (empty structure for now)

## Flow Comparison

### Current Flow (jenjang_id >= 4)
```
IA.04.A → Upload Tugas → IA.04.B → Ujian → AK.02 → AK.03 → Selesai
```

### New Flow (jenjang_id < 4)
```
IA.01 → IA.02 → IA.03 → Upload Tugas → Ujian → AK.02 → AK.03 → Selesai
```

## Architecture

### Modified: `asesmen-steps.ts`

Add new step arrays for low jenjang:

```typescript
// For Asesi (jenjang < 4)
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

// Similar arrays for Asesor 1 and Asesor 2
```

Updated function signature:
```typescript
export function getAsesmenSteps(
  jenjangId: string,
  isAsesor: boolean,
  asesorRole: 'asesor_1' | 'asesor_2' | 'asesor_other' | 'none',
  asesorCount: number
): StepConfig[]
```

Logic:
- If `jenjangId < "4"`: return LOW_JENJAH steps
- Else: return existing steps

### New Files: Placeholder Pages

| File | Description |
|------|-------------|
| `src/pages/asesi/asesmen/Ia01Page.tsx` | Placeholder for IA.01 |
| `src/pages/asesi/asesmen/Ia02Page.tsx` | Placeholder for IA.02 |
| `src/pages/asesi/asesmen/Ia03Page.tsx` | Placeholder for IA.03 |

Each placeholder page:
- Calls API: `/api/asesmen/{id}/ia01`, `/api/asesmen/{id}/ia02`, `/api/asesmen/{id}/ia03`
- Uses `ModularAsesiLayout` with dynamic steps
- Shows "Halaman ini sedang dalam pengembangan" message
- Has functional Lanjut button to next step

### Modified: `App.tsx`

Add routes:
```tsx
<Route path="/asesi/asesmen/:id/ia01" element={<ProtectedRoute><Ia01Page /></ProtectedRoute>} />
<Route path="/asesi/asesmen/:id/ia02" element={<ProtectedRoute><Ia02Page /></ProtectedRoute>} />
<Route path="/asesi/asesmen/:id/ia03" element={<ProtectedRoute><Ia03Page /></ProtectedRoute>} />
```

### Modified: `AsesmenPage.tsx`

Check jenjang_id and redirect:
- If `jenjang_id < "4"`: navigate to `/asesi/asesmen/ia01`
- Else: navigate to `/asesi/asesmen/ia04a`

### Modified Files: Pass jenjang_id

All pages calling `getAsesmenSteps()` must pass `jenjang_id`:
- `Ia04aPage.tsx`
- `Ia04bPage.tsx`
- `Ia05Page.tsx`
- `UploadTugasPage.tsx`
- `UjianPage.tsx`
- `Ak02Page.tsx`
- `Ak03Page.tsx`
- `Ak05Page.tsx`
- `Ak06Page.tsx`
- `AsesmenSelesaiPage.tsx`

## Error Handling

| Scenario | Handling |
|----------|----------|
| jenjang_id is null/undefined | Default to existing flow (IA04A) |
| API 404 for IA01-IA03 | Show error message + return to dashboard button |
| Direct URL access to IA01-IA04A | Check jenjang_id, redirect to correct step |

## Implementation Checklist

- [ ] Modify `asesmen-steps.ts` - add LOW_JENJAH step arrays
- [ ] Modify `asesmen-steps.ts` - update `getAsesmenSteps()` signature
- [ ] Modify `AsesmenPage.tsx` - add jenjang_id check
- [ ] Modify `App.tsx` - add routes for IA01-IA03
- [ ] Create `Ia01Page.tsx` placeholder
- [ ] Create `Ia02Page.tsx` placeholder
- [ ] Create `Ia03Page.tsx` placeholder
- [ ] Update all pages to pass `jenjang_id` to `getAsesmenSteps()`
- [ ] Test flow for jenjang < 4
- [ ] Test flow for jenjang >= 4 (regression)
