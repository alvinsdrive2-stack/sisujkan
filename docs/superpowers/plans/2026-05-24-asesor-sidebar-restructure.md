# Asesor Sidebar Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure asesor navigation from 2-item sidebar to 4-item tahap-aware sidebar with stats dashboard and per-tahap filtered list pages.

**Architecture:** One new reusable `TahapListPage` component handles all 3 tahap list views via a `tahap` prop. Dashboard rewrites to stats overview + recent list. Backend API gains optional `tahap` query param. Existing `AsesiPage` reused unchanged as detail target.

**Tech Stack:** React, react-router-dom, lucide-react, existing UI components (Card, Badge, Button, Pagination), existing hooks pattern.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/lib/kegiatan-service.ts` | Modify | Add `tahap` param to `getKegiatanAsesor` |
| `src/hooks/useKegiatan.ts` | Modify | Add `tahap` param to `useKegiatanAsesorList` |
| `src/lib/rbac-config.ts` | Modify | Add icons + 2 new sidebar menu items |
| `src/pages/asesor/TahapListPage.tsx` | Create | Reusable tahap-filtered kegiatan list |
| `src/pages/asesor/DashboardAsesor.tsx` | Rewrite | Stats overview + recent kegiatan |
| `src/App.tsx` | Modify | Add lazy import + 3 routes |

---

### Task 1: Add tahap param to kegiatan-service

**Files:**
- Modify: `src/lib/kegiatan-service.ts:283-304`

- [ ] **Step 1: Add tahap parameter to getKegiatanAsesor**

Change the method signature and add tahap to URL params:

```typescript
// Line 283, change from:
async getKegiatanAsesor(page: number = 1, search: string = ''): Promise<KegiatanAsesorResponse> {
    const token = this.getToken()
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('search', search)

// To:
async getKegiatanAsesor(page: number = 1, search: string = '', tahap?: number): Promise<KegiatanAsesorResponse> {
    const token = this.getToken()
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('search', search)
    if (tahap !== undefined) params.set('tahap', String(tahap))
```

The rest of the method (lines 288-304) stays the same.

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: no errors

---

### Task 2: Add tahap param to useKegiatanAsesorList hook

**Files:**
- Modify: `src/hooks/useKegiatan.ts:121-157`

- [ ] **Step 1: Add tahap parameter and pass to service**

```typescript
// Line 121, change from:
export function useKegiatanAsesorList(enabled = true, page = 1, search = '') {

// To:
export function useKegiatanAsesorList(enabled = true, page = 1, search = '', tahap?: number) {
```

Then at line 140, change from:
```typescript
const response = await kegiatanService.getKegiatanAsesor(page, search)
```

To:
```typescript
const response = await kegiatanService.getKegiatanAsesor(page, search, tahap)
```

And at line 154, add tahap to the dependency array:
```typescript
// Change from:
}, [enabled, page, search])

// To:
}, [enabled, page, search, tahap])
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: no errors

---

### Task 3: Update rbac-config sidebar menu

**Files:**
- Modify: `src/lib/rbac-config.ts:1-13` (imports) and `:149-166` (Asesor menus)

- [ ] **Step 1: Add new icon imports**

Add `ClipboardList` and `Award` to the import block at lines 2-13:

```typescript
import {
  LayoutDashboard,
  FileText,
  Users,
  Calendar,
  Settings,
  UserCheck,
  Upload,
  FileCheck as FileCheckIcon,
  Activity,
  PenTool,
  ClipboardList,
  Award
} from "lucide-react"
```

- [ ] **Step 2: Replace Asesor menus section**

Replace lines 154-165 (the menus array inside "Asesor") with:

```typescript
    menus: [
      {
        title: "Dashboard",
        path: "/asesor/dashboard",
        icon: LayoutDashboard
      },
      {
        title: "Persiapan Asesmen",
        path: "/asesor/persiapan",
        icon: ClipboardList
      },
      {
        title: "Praasesmen",
        path: "/asesor/praasesmen",
        icon: FileCheckIcon
      },
      {
        title: "Asesmen",
        path: "/asesor/asesmen",
        icon: Award
      }
    ]
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: no errors

---

### Task 4: Create TahapListPage component

**Files:**
- Create: `src/pages/asesor/TahapListPage.tsx`

- [ ] **Step 1: Create the reusable tahap list page**

This component renders a filtered kegiatan list for a specific tahap. It reuses the card design and action button logic from DashboardAsesor.

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Clock, ChevronRight, Play, Search } from "lucide-react"
import { useKegiatanAsesorList } from "@/hooks/useKegiatan"
import { SimpleSpinner } from "@/components/ui/loading-spinner"
import { Pagination } from "@/components/ui/Pagination"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { kegiatanService } from "@/lib/kegiatan-service"

const TAHAP_CONFIG: Record<number, { title: string; badge: string; badgeClass: string }> = {
  0: { title: "Persiapan Asesmen", badge: "Belum Mulai", badgeClass: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
  1: { title: "Praasesmen", badge: "Pra-Asesmen", badgeClass: "bg-purple-100 text-purple-700 hover:bg-purple-200" },
  2: { title: "Asesmen", badge: "Asesmen", badgeClass: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
}

interface TahapListPageProps {
  tahap: 0 | 1 | 2
}

export default function TahapListPage({ tahap }: TahapListPageProps) {
  const navigate = useNavigate()
  const config = TAHAP_CONFIG[tahap]
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { kegiatans, isLoading, error, pagination } = useKegiatanAsesorList(true, page, search, tahap)
  const [startingKegiatanId, setStartingKegiatanId] = useState<string | null>(null)

  const handleStartPraAsesmen = async (jadwalId: string) => {
    setStartingKegiatanId(jadwalId)
    try {
      await kegiatanService.startPraAsesmen(jadwalId)
      window.location.reload()
    } catch (err) {
      console.error('Failed to start pra-asesmen:', err)
      alert('Gagal memulai pra-asesmen')
    } finally {
      setStartingKegiatanId(null)
    }
  }

  const handleStartAsesmen = async (jadwalId: string) => {
    setStartingKegiatanId(jadwalId)
    try {
      await kegiatanService.startAssessment(jadwalId)
      window.location.reload()
    } catch (err) {
      console.error('Failed to start asesmen:', err)
      alert('Gagal memulai asesmen')
    } finally {
      setStartingKegiatanId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{config.title}</h2>
        <p className="text-slate-600">Kegiatan di tahap {config.title.toLowerCase()}</p>
      </div>

      {pagination.total > 2 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kegiatan..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Daftar Kegiatan
            {isLoading && <SimpleSpinner size="sm" className="ml-2 text-primary" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-center py-8 text-red-500">
              Gagal memuat kegiatan: {error}
            </div>
          )}
          {!isLoading && !error && kegiatans.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              Tidak ada kegiatan di tahap {config.title.toLowerCase()}
            </div>
          )}
          {kegiatans.length > 0 && (
            <>
              <div className="space-y-3">
                {kegiatans.map((kegiatan) => (
                  <div
                    key={kegiatan.jadwal_id}
                    className="p-4 border border-slate-200 rounded-lg hover:shadow-md bg-white cursor-pointer"
                    onClick={() => navigate(`/asesor/asesi/${kegiatan.jadwal_id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800">{kegiatan.nama_kegiatan}</h4>
                        <p className="text-sm text-slate-600 mt-1">{kegiatan.tuk?.nama}</p>
                        <p className="text-xs text-slate-500">{kegiatan.tuk?.alamat}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={config.badgeClass}>
                          {config.badge}
                        </Badge>
                        {tahap === 0 && (
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartPraAsesmen(kegiatan.jadwal_id)
                            }}
                            disabled={startingKegiatanId === kegiatan.jadwal_id}
                          >
                            {startingKegiatanId === kegiatan.jadwal_id ? (
                              <SimpleSpinner size="sm" className="text-white" />
                            ) : (
                              <><Play className="w-3 h-3 mr-1" />Mulai Pra-Asesmen</>
                            )}
                          </Button>
                        )}
                        {tahap === 1 && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartAsesmen(kegiatan.jadwal_id)
                            }}
                            disabled={startingKegiatanId === kegiatan.jadwal_id}
                          >
                            {startingKegiatanId === kegiatan.jadwal_id ? (
                              <SimpleSpinner size="sm" className="text-white" />
                            ) : (
                              <><Play className="w-3 h-3 mr-1" />Mulai Asesmen</>
                            )}
                          </Button>
                        )}
                        {tahap === 2 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/asesor/asesi/${kegiatan.jadwal_id}`)
                            }}
                          >
                            Lihat Detail
                          </Button>
                        )}
                        <ChevronRight />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(kegiatan.tanggal_uji || '').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(kegiatan.tanggal_uji || '').toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {kegiatan.jenis_kelas === 'luring' ? 'Luring' : 'Daring'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination
                page={page}
                lastPage={pagination.lastPage}
                total={pagination.total}
                perPage={pagination.perPage}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: no errors

---

### Task 5: Rewrite DashboardAsesor as stats overview

**Files:**
- Modify: `src/pages/asesor/DashboardAsesor.tsx` (full rewrite)

- [ ] **Step 1: Rewrite to stats overview + recent list**

The dashboard fetches all kegiatan (no tahap filter), counts per tahap client-side, shows 3 clickable stat cards, and lists the 10 most recent kegiatan below.

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Clock, ChevronRight, Play, ClipboardList, FileCheck, Award } from "lucide-react"
import { useKegiatanAsesorList } from "@/hooks/useKegiatan"
import { SimpleSpinner } from "@/components/ui/loading-spinner"
import { useNavigate } from "react-router-dom"
import { useState, useMemo } from "react"
import { kegiatanService } from "@/lib/kegiatan-service"

const TAHAP_CARDS = [
  { tahap: 0, title: "Persiapan Asesmen", icon: ClipboardList, color: "bg-slate-100 text-slate-700", hoverColor: "hover:bg-slate-200", path: "/asesor/persiapan" },
  { tahap: 1, title: "Praasesmen", icon: FileCheck, color: "bg-purple-100 text-purple-700", hoverColor: "hover:bg-purple-200", path: "/asesor/praasesmen" },
  { tahap: 2, title: "Asesmen", icon: Award, color: "bg-emerald-100 text-emerald-700", hoverColor: "hover:bg-emerald-200", path: "/asesor/asesmen" },
] as const

export default function DashboardAsesor() {
  const navigate = useNavigate()
  const { kegiatans, isLoading } = useKegiatanAsesorList(true)
  const [startingKegiatanId, setStartingKegiatanId] = useState<string | null>(null)

  const counts = useMemo(() => ({
    0: kegiatans.filter(k => k.is_started_praasesmen === '0' && k.tahap === 0).length,
    1: kegiatans.filter(k => k.is_started_praasesmen === "1" && k.tahap === 1).length,
    2: kegiatans.filter(k => k.is_started === "1" && k.tahap === 2).length,
  }), [kegiatans])

  const recentKegiatan = useMemo(() => kegiatans.slice(0, 10), [kegiatans])

  const handleStartPraAsesmen = async (jadwalId: string) => {
    setStartingKegiatanId(jadwalId)
    try {
      await kegiatanService.startPraAsesmen(jadwalId)
      window.location.reload()
    } catch (err) {
      console.error('Failed to start pra-asesmen:', err)
      alert('Gagal memulai pra-asesmen')
    } finally {
      setStartingKegiatanId(null)
    }
  }

  const handleStartAsesmen = async (jadwalId: string) => {
    setStartingKegiatanId(jadwalId)
    try {
      await kegiatanService.startAssessment(jadwalId)
      window.location.reload()
    } catch (err) {
      console.error('Failed to start asesmen:', err)
      alert('Gagal memulai asesmen')
    } finally {
      setStartingKegiatanId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Asesor</h2>
        <p className="text-slate-600">Ringkasan kegiatan asesmen Anda</p>
      </div>

      {isLoading && <div className="flex justify-center py-8"><SimpleSpinner /></div>}

      {!isLoading && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TAHAP_CARDS.map(({ tahap, title, icon: Icon, color, hoverColor, path }) => (
              <div
                key={tahap}
                className={`p-6 rounded-lg border border-slate-200 cursor-pointer transition-colors ${hoverColor}`}
                onClick={() => navigate(path)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">{title}</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{counts[tahap as 0|1|2]}</p>
                  </div>
                  <div className={`p-3 rounded-full ${color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Kegiatan */}
          {recentKegiatan.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Kegiatan Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentKegiatan.map((kegiatan) => (
                    <div
                      key={kegiatan.jadwal_id}
                      className="p-4 border border-slate-200 rounded-lg hover:shadow-md bg-white cursor-pointer"
                      onClick={() => navigate(`/asesor/asesi/${kegiatan.jadwal_id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800">{kegiatan.nama_kegiatan}</h4>
                          <p className="text-sm text-slate-600 mt-1">{kegiatan.tuk?.nama}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {kegiatan.is_started_praasesmen === '0' && kegiatan.tahap === 0 && (
                            <>
                              <Badge className="bg-slate-100 text-slate-700">Belum Mulai</Badge>
                              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={(e) => { e.stopPropagation(); handleStartPraAsesmen(kegiatan.jadwal_id) }}
                                disabled={startingKegiatanId === kegiatan.jadwal_id}
                              >
                                {startingKegiatanId === kegiatan.jadwal_id ? <SimpleSpinner size="sm" className="text-white" /> : <><Play className="w-3 h-3 mr-1" />Mulai Pra-Asesmen</>}
                              </Button>
                            </>
                          )}
                          {kegiatan.is_started_praasesmen === "1" && kegiatan.tahap === 1 && (
                            <>
                              <Badge className="bg-purple-100 text-purple-700">Pra-Asesmen</Badge>
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={(e) => { e.stopPropagation(); handleStartAsesmen(kegiatan.jadwal_id) }}
                                disabled={startingKegiatanId === kegiatan.jadwal_id}
                              >
                                {startingKegiatanId === kegiatan.jadwal_id ? <SimpleSpinner size="sm" className="text-white" /> : <><Play className="w-3 h-3 mr-1" />Mulai Asesmen</>}
                              </Button>
                            </>
                          )}
                          {kegiatan.is_started === "1" && kegiatan.tahap === 2 && (
                            <>
                              <Badge className="bg-emerald-100 text-emerald-700">Asesmen</Badge>
                              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/asesor/asesi/${kegiatan.jadwal_id}`) }}>Lihat Detail</Button>
                            </>
                          )}
                          <ChevronRight />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(kegiatan.tanggal_uji || '').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{new Date(kegiatan.tanggal_uji || '').toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="flex items-center gap-1"><Users className="w-4 h-4" />{kegiatan.jenis_kelas === 'luring' ? 'Luring' : 'Daring'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: no errors

---

### Task 6: Add routes in App.tsx

**Files:**
- Modify: `src/App.tsx:62-64` (lazy imports) and `:242-247` (asesor routes)

- [ ] **Step 1: Add lazy import for TahapListPage**

At line 64, after `AsesiPage` import, add:

```typescript
const AsesiPage = lazy(() => import('./pages/asesor/AsesiPage'))
const TahapListPage = lazy(() => import('./pages/asesor/TahapListPage'))
```

- [ ] **Step 2: Add 3 new routes in asesor routes section**

Replace lines 242-247 with:

```tsx
                    <Route path="dashboard" element={<DashboardAsesor />} />
                    <Route path="persiapan" element={<TahapListPage tahap={0} />} />
                    <Route path="praasesmen" element={<TahapListPage tahap={1} />} />
                    <Route path="asesmen" element={<TahapListPage tahap={2} />} />
                    <Route path="list-asesi/:jadwalId" element={<ListAsesiAsesor />} />
                    <Route path="asesi/:jadwalId" element={<AsesiPage />} />
                    <Route path="" element={<Navigate to="dashboard" replace />} />
```

This removes the "schedule" and "assessment" stub routes (no longer needed) and adds the 3 tahap routes.

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: no errors

---

### Task 7: Final verification

- [ ] **Step 1: Build the project**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 2: Manual verification checklist**

1. Login as asesor
2. Sidebar shows 4 items: Dashboard, Persiapan Asesmen, Praasesmen, Asesmen
3. Dashboard shows 3 stat cards with counts, clicking navigates to correct tahap page
4. Each tahap page shows only kegiatan in that tahap
5. Search bar appears when >2 kegiatan
6. Pagination works on each tahap page
7. Click kegiatan card navigates to AsesiPage
8. Action buttons work (start pra-asesmen, start asesmen, lihat detail)
9. Other roles (admin, asesi, etc.) unaffected
