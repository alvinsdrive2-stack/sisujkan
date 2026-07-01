# Performance Optimization Plan — 2026-06-04

## Problem Summary

Project suffers from: double API calls, waterfall requests, code duplication, missing memoization, sequential N+1 fetches, and bloated single-file components. Loading asesmen pages triggers 4-6 sequential API calls when 1-2 could suffice.

---

## Phase 1: Double/Multiple API Calls

### 1.1 useDataDokumenAsesmen — duplicate fetches ✅ FIXED

**Problem**: 6 files called `useDataDokumenAsesmen()` twice in same component, triggering 2 identical `GET /asesmen/{id}/data-dokumen` requests.

**Files fixed**: AsesmenPage, DashboardAsesiPage, AsesmenSelesaiPage, Ak03Page, SurveiPage, UploadTugasPage

**Fix**: Destructure all needed fields from single hook call.

### 1.2 Apl02FilePanel — 2 API calls per page mount

**Problem**: `Apl02FilePanel` rendered by `ModularAsesiLayout` on EVERY asesmen page. Makes 2 API calls:
- `GET /praasesmen/{id}/apl02/files`
- `GET /kegiatan/{id}/dokumen-asesi`

Same data refetched on every page navigation. Also re-mounts when mobile modal toggles.

**Fix**: 
- Add in-memory cache keyed by `idIzin` + `refreshKey`
- Skip fetch when data already cached for this `idIzin`

### 1.3 useAbsenCheck — redundant fetch on every page

**Problem**: `useAbsenCheck` calls `GET /dokumen/absen/{id}` on every page mount. Same absen data refetched across all IA/AK pages and pra-asesmen pages.

**Fix**: 
- Add simple request dedup within hook — cache response by `idIzin`
- Skip fresh API call if already fetched within last 30s

### 1.4 useTahapStepCheck — N sequential API calls

**Problem**: `useTahapStepCheck` iterates ALL steps sequentially, making N blocking GET requests (7 for tahap 1, 7-8 for tahap 2). Each blocks the next.

**Fix**: 
- Run checks in `Promise.all` parallel instead of `for...of` sequential
- Consider HEAD or lighter endpoint instead of full data fetch

### 1.5 DashboardAsesiPage — duplicate N+1 step check

**Problem**: `DashboardAsesiPage` has TWO identical N+1 step check loops — one in `useEffect` (line 74-149) and one in button `onClick` (line 437-554). On mount, it fires 7+ sequential requests; on click, fires them again.

**Fix**: 
- Remove the mount-time check (only check on button click)
- Cache the check result for current tahap

### 1.6 useRealtimeSync — double Ably subscription

**Problem**: Pages use both `useSigningState` (which calls `useRealtimeSync` internally) and their own `useRealtimeSync`. On Ably message, both callbacks fire → page data refetched twice.

**Fix**: Remove explicit `useRealtimeSync` from pages that already get it via `useSigningState`.

---

## Phase 2: Code Duplication & Modularity

### 2.1 Consolidate 3 data-dokumen hooks → 1

**Problem**: `useDataDokumen.ts` (simpler, old), `useDataDokumenPraAsesmen.ts`, `useDataDokumenAsesmen.ts` = 90%+ duplicated code. All follow same pattern: useState → useEffect → fetch → parse → setState. Only endpoint URL differs.

| File | Endpoint |
|------|----------|
| `useDataDokumen` | `GET /praasesmen/{id}/data-dokumen` |
| `useDataDokumenPraAsesmen` | `GET /praasesmen/{id}/data-dokumen` (same!) |
| `useDataDokumenAsesmen` | `GET /asesmen/{id}/data-dokumen` |

`useDataDokumen` is a SUBSET of `useDataDokumenPraAsesmen` — same endpoint but returns fewer fields.

**Fix**: 
- Merge into single `useDataDokumen` hook with `phase` param (`'praasesmen' | 'asesmen'`)
- Old files become thin re-exports for backward compat
- Return ALL fields from both endpoints (union type)

### 2.2 Split useKegiatan.ts — 650-line monolith

**Problem**: `useKegiatan.ts` contains: KegiatanService class + 10+ hooks + 4 interfaces. Hooks include: useAbsenData, useRekomendasiStatus, useAsesiRekomendasiStatus, useBaKomtekProgress — none of which are "kegiatan" hooks.

**Fix**:
- Extract `KegiatanService` class into `lib/kegiatan-service.ts` (already there)
- Extract unrelated hooks to own files: `useAbsenData.ts`, `useRekomendasiStatus.ts`, `useBaKomtekProgress.ts`

### 2.3 Extract reusable identity table component

**Problem**: Every IA/AK page renders identical identity table (Skema Sertifikasi, TUK, Asesor, Nama Asesi, Tanggal). ~120 lines of inline `<table>` HTML repeated across 16+ files.

**Fix**: Create `AsesmenIdentityTable` component, pass data as props. Single source of truth.

### 2.4 Extract reusable breadcrumb component

**Problem**: Same breadcrumb `<div>` repeated across all pages.

**Fix**: Create `AsesmenBreadcrumb` component.

---

## Phase 3: Re-render Optimization

### 3.1 Memoize step array

**Problem**: `getAsesmenSteps()` returns new array+objects every render. Passed as prop to `ModularAsesiLayout` and `ModularStepIndicator`.

**Fix**: Wrap with `useMemo` in each page. OR compare only `step.number` for equality in `ModularStepIndicator`.

### 3.2 Add React.memo to key components

**Components missing memo**:
- `ActionButton` — used on every page, receives event handlers
- `CustomCheckbox` — used in loops
- `ModularStepIndicator` — receives `steps` array
- `ModularAsesiLayout` — wraps all page content
- `Apl02FilePanel` — receives `idIzin` and `onCollapse`

**Fix**: Wrap each with `React.memo` with custom comparator where needed.

### 3.3 Stabilize inline style objects

**Problem**: Hundreds of `style={{...}}` create new object references each render. When passed to children, causes re-render even if values haven't changed.

**Fix**: Extract static style objects to module-level constants or `useMemo`. Most critical for frequently-rendered children (table cells, checkbox wrappers).

### 3.4 Stabilize callback references

**Problem**: `handleAspekChange`, `handleSave`, etc. defined as arrow functions in render body. New references each render → child components re-render.

**Fix**: Already using `useCallback` in most places. Audit for missed cases.

---

## Phase 4: Request Waterfall Optimization

### 4.1 Parallel data fetching in asesmen pages

**Problem**: Each asesmen page loads: data-dokumen → kegiatan-by-role → absen-check sequentially via React component lifecycle. These are independent.

**Fix**: 
- Merge into single `useAsesmenPageData` hook that fires all 3 in parallel via `Promise.all`
- Return combined loading state

### 4.2 Prefetch next page data

**Problem**: Navigating from IA01 to IA02 refetches ALL data even though only the form content changes.

**Fix**: 
- Share data-dokumen response via context/cache across pages
- Skip refetch if same `idIzin` already loaded within TTL

### 4.3 Remove artificial loading delay

**Problem**: `DashboardAsesiPage` has `setTimeout(..., 2000)` for page entrance animation — delays render by 2 seconds for EVERY visit.

**Fix**: Remove artificial delay. Use CSS animation with `animation-delay` instead — UI shows instantly, animation plays after mount.

---

## Phase 5: Specific Performance Issues

### 5.1 Inline `<style>` tags in render body

**Problem**: `AsesmenSelesaiPage` injects `<style>{...}</style>` inside render — re-inserted on every render.

**Fix**: Move all `<style>` tags into component files as constants or global CSS.

### 5.2 Countdown interval explosion

**Problem**: `DashboardAsesiPage` `useEffect` for countdown depends on `isButtonLocked` state — re-creates interval every time lock state changes.

**Fix**: Use ref for dependencies that shouldn't restart the interval.

### 5.3 Big list rendering in Apl02FilePanel

**Problem**: File list renders all files with inline iframe previews (600px height each). No virtualization.

**Fix**: Only render preview for the ONE expanded file. Already doing this for expanded state — but still renders all file list items. Add windowing for 20+ files.

---

## Execution Order

1. Phase 1 (double API calls) — highest impact, lowest risk
2. Phase 3.1-3.2 (memoization) — drops re-renders significantly
3. Phase 4 (waterfall) — reduces perceived load time
4. Phase 2 (modularity) — improves maintainability
5. Phase 3.3-3.4, 5 (polish) — minor perf gains

---

## Files to Touch

| Phase | Files | Risk | Impact |
|-------|-------|------|--------|
| 1.1 | 6 page files | Low | High — eliminates 6 duplicate API calls |
| 1.2-1.6 | Apl02FilePanel, useAbsenCheck, useTahapStepCheck, DashboardAsesiPage, useRealtimeSync | Low-Med | Medium — reduces page load API calls |
| 2.1 | 3 hook files + 30 imports | High | Medium — reduces technical debt |
| 2.2 | useKegiatan.ts + 5 new files | Medium | Medium — improves maintainability |
| 3.1 | 6 component files | Low | Medium — reduces re-renders |
| 3.2-3.4 | ~20 page files | Low | Low-Med — marginal gains each |
| 4.1-4.2 | useDataDokumen + page files | Medium | Medium — waterfall fix |

---
