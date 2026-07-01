# Asesor Sidebar & Page Restructure

## Context

Asesor sidebar currently has 2 items: Dashboard + Daftar Asesi. Dashboard shows all kegiatan in a flat card list. User wants tahap-aware navigation: separate pages for each assessment phase (Persiapan Asesmen = tahap 0, Praasesmen = tahap 1, Asesmen = tahap 2), each showing filtered kegiatan list with search, pagination, and links to detail.

## Sidebar Structure (4 items)

```
Dashboard          /asesor/dashboard     icon: LayoutDashboard
Persiapan Asesmen  /asesor/persiapan     icon: ClipboardList
Praasesmen         /asesor/praasesmen    icon: FileCheck
Asesmen            /asesor/asesmen       icon: Award
```

## Dashboard (/asesor/dashboard)

- 3 stat cards showing count of kegiatan per tahap (computed client-side from all kegiatan)
- Each card clickable, navigates to the corresponding tahap list page
- Below stats: recent kegiatan list (all tahap, max 10)
- Card design reused from existing DashboardAsesor

## Tahap List Pages

One reusable component `TahapListPage` with `tahap` prop (0, 1, or 2).

Routes:
- `/asesor/persiapan` tahap=0
- `/asesor/praasesmen` tahap=1
- `/asesor/asesmen` tahap=2

Features per page:
- Card list of kegiatan filtered by tahap (API `GET /kegiatan/asesor?tahap=X`)
- Search bar shown when >2 kegiatan
- Pagination
- Each card: nama_kegiatan, TUK, date/time, kelas, tahap badge
- Action buttons per card (reuse tahap-aware logic from DashboardAsesor):
  - tahap 0: "Mulai Pra-Asesmen" button
  - tahap 1: "Mulai Asesmen" button
  - tahap 2: "Lihat Detail" button
- Click card navigates to `/asesor/asesi/:jadwalId` (reuse AsesiPage)

## Backend API Changes

Only one change needed:
- `GET /kegiatan/asesor` accepts optional `tahap` query param (0, 1, or 2). If omitted, returns all.
- No new endpoints. Frontend counts tahap from unfiltered response.

## Files to Modify/Create

| File | Action | Description |
|---|---|---|
| `src/lib/rbac-config.ts` | Modify | Add 2 menu items (Persiapan Asesmen, Praasesmen, rename Asesmen) |
| `src/pages/asesor/DashboardAsesor.tsx` | Rewrite | Stats overview cards + recent kegiatan list |
| `src/pages/asesor/TahapListPage.tsx` | Create | Reusable tahap-filtered kegiatan list |
| `src/App.tsx` | Modify | Add 3 routes for tahap pages |
| `src/lib/kegiatan-service.ts` | Modify | Add tahap param to getKegiatanAsesor |
| `src/hooks/useKegiatan.ts` | Modify | Update useKegiatanAsesorList to accept tahap param |

## Reuse

- AsesiPage: unchanged, navigated to from tahap list cards
- Card design: reuse from DashboardAsesor
- Tahap-aware action buttons: extract from DashboardAsesor into shared helper or inline in TahapListPage
- kegiatan-service: extend existing, no new service

## Verification

1. Sidebar shows 4 items for asesor role
2. Dashboard shows 3 stat cards with correct counts, clickable
3. Each tahap page shows only kegiatan in that tahap
4. Search works when >2 kegiatan
5. Pagination works
6. Click kegiatan card navigates to AsesiPage
7. Action buttons work (start pra-asesmen, start asesmen, lihat detail)
8. Non-asesor roles unaffected
