# Dashboard UI/UX Design — SISUJ LSP Gatensi

> Analisis visual style, design key, dan pola UI/UX untuk seluruh dashboard.
> Tanggal: 2026-06-08

---

## 1. Design Overview

Aplikasi sertifikasi BNSP dengan 7 role berbeda. Tiap role punya dashboard sendiri, tapi semua share layout foundation yang sama. Pendekatan: **professional-institutional** — formal tanpa kaku, bersih tanpa steril.

**DNA visual:**
- Naval blue (`hsl(222, 72%, 22%)`) sebagai brand anchor — authoritative, trust-building
- White card surfaces — clarity, hierarchy
- Subtle motion — liveliness tanpa distracting
- Role-based differentiation — setiap role "merasa" dashboard itu punya mereka

---

## 2. Layout Architecture

### 2.1 DashboardLayout (6 dari 7 role)

```
┌─────────────────────────────────────────────────────┐
│  DashboardNavbar (sticky top-0, z-50, h-16)         │
│  ┌───────┬───────────────────────────────────────┐  │
│  │ Logo  │            Timer / Spacer         👤🔆│  │
│  └───────┴───────────────────────────────────────┘  │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Sidebar  │  Main Content Area                       │
│ (w-72)   │  ┌──────────────────────────────────┐    │
│ z-30     │  │  bg-white rounded-xl shadow-sm    │    │
│ h-full   │  │  border p-6                       │    │
│          │  │  min-h-[calc(100vh-120px)]         │    │
│ Nav      │  │  page-enter transition 300ms      │    │
│ items    │  │                                    │    │
│ badge    │  │  [children]                        │    │
│ counts   │  │                                    │    │
│          │  └──────────────────────────────────┘    │
│ v1.0     │                                          │
├──────────┴──────────────────────────────────────────┤
│  LoopingVideoBackground (fixed, z-[-1], opacity-10) │
└─────────────────────────────────────────────────────┘
```

**Key metrics:**
- Navbar: `h-16` (64px)
- Sidebar: `w-72` (288px) expanded, `w-20` collapsed
- Content card: `rounded-xl`, `p-6`, `shadow-sm`
- Min content height: `calc(100vh - 120px)` — full viewport minus navbar + padding

### 2.2 AsesiMainLayout (asesi-specific)

Tanpa sidebar. Navbar aja. Anak langsung di-render tanpa card wrapper — lebih sederhana, linear.

```
┌─────────────────────────────────────────────┐
│  DashboardNavbar + Timer Node               │
├─────────────────────────────────────────────┤
│  Children (full width, no card wrapper)     │
└─────────────────────────────────────────────┘
```

---

## 3. Color System

### 3.1 Core Tokens (CSS Variables — HSL)

Semua token didefinisikan di `:root` dan `.dark` dalam format HSL. Tailwind referensi via `hsl(var(--name))`.

**Light theme:**

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `216 33% 98%` | Page bg (navy-tinted white) |
| `--foreground` | `220 40% 12%` | Body text |
| `--card` | `0 0% 100%` | Card bg |
| `--primary` | `222 72% 22%` | Brand navy — buttons, badges, active states |
| `--primary-foreground` | `210 40% 98%` | Text on primary |
| `--muted` | `216 20% 95%` | Muted bg |
| `--muted-foreground` | `216 16% 48%` | Secondary text |
| `--border` | `216 20% 88%` | Borders, dividers |
| `--destructive` | `0 72% 52%` | Error/danger |
| `--radius` | `0.5rem` | Border radius |

**Dark theme:**

| Token | Light → Dark |
|-------|-------------|
| `--background` | `216 33% 98%` → `222 32% 8%` |
| `--foreground` | `220 40% 12%` → `210 40% 95%` |
| `--card` | `0 0% 100%` → `222 28% 11%` |
| `--primary` | SAME — `222 72% 22%` (navy tetap navy) |
| `--muted` | `216 20% 95%` → `220 24% 18%` |
| `--muted-foreground` | `216 16% 48%` → `215 20% 62%` |
| `--border` | `216 20% 88%` → `220 24% 18%` |

Dark mode strategy: **"inverted surface, preserved brand"** — background jadi gelap, primary tetap navy.

### 3.2 Semantic Color Palette (Used Directly in Components)

Warna-warna ini bukan CSS variable — dipakai langsung via Tailwind utility:

| Color | Hex Approx | Usage |
|-------|-----------|-------|
| Emerald | `text-emerald-600`, `bg-emerald-50` | Success, completed, positive trend |
| Amber | `text-amber-600`, `bg-amber-50` | Warning, pending, medium priority |
| Red | `text-red-600`, `bg-red-50` | Error, negative trend, high priority, destructive |
| Blue | `text-blue-600`, `bg-blue-50` | Info, in-progress |
| Purple | `text-purple-600`, `bg-purple-50` | Specific tahap indicators |
| Slate | `text-slate-600`, `bg-slate-50` | Neutral UI, secondary text, dividers |

### 3.3 Status → Color Mapping

| Status | Badge Variant | Background |
|--------|--------------|------------|
| Completed / Lulus | `bg-emerald-100 text-emerald-700` / `success` | Emerald |
| In Progress | `bg-blue-100 text-blue-700` / `info` | Blue |
| Pending | `outline` (transparent) / `secondary` | Subtle |
| Warning | `bg-amber-100 text-amber-700` / `warning` | Amber |
| Error / Tidak Kompeten | `bg-red-100 text-red-700` / `error` / `destructive` | Red |
| Trend Up | `text-emerald-600` | Emerald |
| Trend Down | `text-red-600` | Red |
| Neutral | `text-slate-500 / 600` | Slate |

---

## 4. Typography

### 4.1 Font Stack

| Usage | Font | Weights Loaded |
|-------|------|---------------|
| Body | **Inter** | 400, 500, 600, 700 |
| Headings (h1-h3) | **Plus Jakarta Sans** | 600, 700, 800 |

Loaded via Google Fonts `@import` di `index.css`.

### 4.2 Text Styles (Common Patterns)

| Element | Classes | Size |
|---------|---------|------|
| Page title | `text-2xl font-bold text-slate-800` | 24px |
| Page subtitle | `text-slate-600` | 16px |
| Card title | `font-semibold leading-none tracking-tight` | 16px |
| Stat value | `text-3xl font-semibold text-slate-900 tabular-nums` | 30px |
| Stat label | `text-xs font-medium text-slate-500 uppercase tracking-wide` | 12px |
| Stat change | `text-xs mt-1` | 12px |
| Badge text | `text-xs font-semibold` | 12px |
| Body small | `text-sm text-slate-600/700` | 14px |
| Body smaller | `text-xs text-slate-500` | 12px |
| Nav item | `text-sm font-medium` → active: `font-semibold` | 14px |
| Nav section | `text-xs font-semibold text-slate-400 uppercase tracking-wider` | 12px |

### 4.3 Font Feature Settings

```
font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
```
- `tabular-nums` class pada angka statistik — number alignment penting.

---

## 5. Component Library

### 5.1 Card (shadcn/ui-based)

Base class: `rounded-xl border bg-card text-card-foreground shadow`

Anatomi:
```
Card (rounded-xl border shadow)
├── CardHeader (flex flex-col space-y-1.5 p-6)
│   ├── icon (w-5 h-5 text-primary) — optional
│   └── CardTitle (font-semibold leading-none tracking-tight)
├── CardContent (p-6 pt-0)
│   └── children
└── CardFooter (flex items-center p-6 pt-0) — optional
```

**Card variants:**
- Default: white bg, slate border
- Highlight: `border-primary/20` (untuk kartu utama/sertifikasi aktif)
- P-0 content: ketika card butuh grid/strip tanpa padding (stat cards)

### 5.2 Badge

Base: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold`

| Variant | Style |
|---------|-------|
| `default` | `bg-primary text-primary-foreground` |
| `secondary` | `bg-secondary text-secondary-foreground` |
| `destructive` | `bg-destructive text-destructive-foreground` |
| `outline` | Transparent with border |
| `success` | `bg-emerald-500 text-white` |
| `warning` | `bg-amber-500 text-white` |
| `info` | `bg-blue-500 text-white` |
| `error` | `bg-red-500 text-white` |

### 5.3 Button

Variants: `default` | `destructive` | `outline` | `secondary` | `ghost` | `link`
Sizes: `default` | `sm` | `lg` | `icon`

Pattern umum di dashboard:
- Primary action → `bg-primary text-white rounded-lg hover:bg-primary/90`
- Quick action cards → custom button-like divs with `border border-slate-200 rounded-lg hover:border-primary hover:bg-primary/5`
- Danger → `text-red-800 hover:bg-red-50 hover:text-red-600`
- Full-width CTA → `w-full py-3 bg-primary text-white rounded-lg`

### 5.4 Avatar

```
Avatar (w-10 h-10 border-2 border-slate-200)
├── AvatarImage (src from API pas_foto)
└── AvatarFallback (bg-primary/10 text-primary font-semibold)
    └── Initials (2 chars)
+ Online indicator: absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full
```

---

## 6. Spacing & Sizing

### 6.1 Dashboard Layout Spacing

| Region | Specification |
|--------|--------------|
| Content top padding | `p-6` (24px) |
| Card padding | `p-6` (24px) |
| Card inner gap | `space-y-4` (16px) atau `space-y-6` (24px) |
| Section gap | `space-y-6` (24px) |
| Grid gap | `gap-6` (24px) |
| Stats cell padding | `px-6 py-5` |
| Nav item padding | `px-3 py-2.5` |
| Nav icon box | `w-9 h-9 rounded-lg` |
| List item padding | `p-3` (12px) or `p-4` (16px) |

### 6.2 Stat Strip (Consistent Across All Dashboards)

```
grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100
```

| Property | Mobile | Desktop |
|----------|--------|---------|
| Columns | 2 | 4 |
| Dividers | X + Y | X only |
| Per cell | `px-6 py-5` | same |

Setiap cell:
- Label: `text-xs font-medium text-slate-500 uppercase tracking-wide`
- Value: `text-3xl font-semibold text-slate-900 mt-1 tabular-nums`
- Change: `text-xs mt-1` (emerald for up, red for down)

### 6.3 Content Grid

| Grid | Breakpoint | Columns |
|------|-----------|---------|
| Main sections | default / lg | 1 / 2-3 |
| Quick actions | default / md | 1 / 3 |
| Stats | default / lg | 2 / 4 |
| Insight cards | default / md | 1 / 3 |

---

## 7. Animation & Transitions

### 7.1 Page Transitions

Content wrapper di DashboardLayout:
```
transition-all duration-300
${showContent ? 'page-enter opacity-100' : 'opacity-0'}
```

Trigger via useEffect on `location.pathname` change — CSS-only, no extra renders.

PageTransition component (optional wrapper):
```
page-enter → opacity-100 (300ms delay)
```

### 7.2 Keyframe Animations (tailwind.config)

| Name | From → To | Duration | Use Case |
|------|----------|----------|----------|
| `fade-in` | opacity 0, translateY(10px) → opacity 1, Y(0) | 0.5s | General entrance |
| `fade-in-left` | opacity 0, X(-20px) → opacity 1, X(0) | 0.5s | Side entrance |
| `fade-in-right` | opacity 0, X(20px) → opacity 1, X(0) | 0.5s | Side entrance |
| `scale-in` | opacity 0, scale(0.9) → opacity 1, scale(1) | 0.3s | Modal/popup |
| `slide-up` | opacity 0, Y(30px) → opacity 1, Y(0) | 0.6s | Section entrance |
| `pulse-glow` | box-shadow 20px navy → 40px navy → loop | 2s | Countdown banners |
| `float` | Y(0) → Y(-10px) → Y(0) | ~3s | Background decorations |
| `shimmer` | bg-position -200% → 200% | ~1.5s | Skeleton loading |

Animation delay utilities: `animate-delay-100` through `animate-delay-500` (100ms-500ms steps).

### 7.3 Loading Animations

| Component | Type | Detail |
|-----------|------|--------|
| `LoadingSpinner` | Branded | Logo + ping ring + pulse ring + bouncing dots (3, staggered 150ms) |
| `FullPageLoader` | Overlay | Dual spinning rings (primary+secondary, opposite directions) + logo fallback |
| `SimpleSpinner` | Inline SVG | Animated SVG circle, `currentColor` |
| `SkeletonCard` | Pulse | Shimmer placeholder: title bar 1/3 width + content bars |
| `SkeletonStatsCard` | Pulse | Icon box + value + text shimmer |
| `SkeletonTableRow` | Pulse | Circle avatar + text bars + action button |

### 7.4 Micro-interactions

| Element | Interaction | Duration |
|---------|------------|----------|
| Nav item hover | `bg-slate-100` | 200ms |
| Nav item active | `bg-primary/10 text-primary` | 200ms |
| Sidebar toggle | `transition-all duration-300` | 300ms |
| Card hover (clickable) | `hover:bg-slate-50` | transition-colors |
| Border card hover | `hover:border-primary` | transition-colors |
| Logo hover | `hover:scale-105` | ~200ms |
| Backdrop blur (sidebar) | `backdrop-blur-sm` | Static |

---

## 8. Iconography

- **Library**: Lucide React (primary), some FontAwesome imports
- **Size conventions**:
  - Card header icons: `w-5 h-5 text-primary`
  - Nav icons: `w-4 h-4`
  - Quick action icons: `w-6 h-6 text-primary mb-2`
  - Inline with text: `w-3 h-3`
  - Badge dot indicator: `w-2 h-2 rounded-full`

### Common Icons by Context

| Context | Icon |
|---------|------|
| Dashboard | `LayoutDashboard` |
| Aktivitas | `Activity` |
| Kalender/Jadwal | `Calendar` |
| Trending/Chart | `TrendingUp`, `ArrowUpRight`, `ArrowDownRight` |
| User | `User` |
| Dokumen | `FileCheck`, `Upload` |
| Checklist | `CheckCircle2`, `Clock` |
| Alert | `AlertCircle` |
| Play action | `Play` |
| Logout | `LogOut` |
| Nav chevron | `ChevronRight` |

---

## 9. Responsive Behavior

### 9.1 Breakpoint Strategy

| Breakpoint | Width | Layout Changes |
|-----------|-------|----------------|
| Default (mobile) | < 768px | Single column, hamburger menu, stacked cards |
| `md` | ≥ 768px | Desktop navbar appears, horizontal layout |
| `lg` | ≥ 1024px | Sidebar permanent, multi-column grids active |

### 9.2 Sidebar Responsive

| State | Mobile | Desktop |
|-------|--------|---------|
| Default | Hidden (`-translate-x-full`) | Visible (`translate-x-0`) |
| Toggle | Slide overlay + backdrop (`bg-black/50`) | N/A |
| Width | `w-72` | `w-72` (can collapse to `w-20`) |
| Trigger | Fixed hamburger button (`top-20 left-4 z-50`) | Collapse button (if implemented) |

### 9.3 Grid Adaptation

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Stats strip | 2 cols | 2 cols | 4 cols |
| Main grid sections | 1 col | 1-2 cols | 2-3 cols |
| Quick actions | 1 col | 2 cols | 3 cols |
| Insight cards | 1 col | 2 cols | 3 cols |

### 9.4 Mobile Menu (Navbar)

Dropdown di bawah navbar (`animate-fade-in`) dengan:
- Avatar + nama + role
- ThemeToggle
- Notification button (with red dot)
- Logout button
- `border-t border-slate-200` sebagai pemisah

---

## 10. Dashboard-Specific Patterns

### 10.1 Stats Strip (All Roles)

Pola paling konsisten — setiap dashboard buka dengan 4 metrik kunci.

```
Card → CardContent p-0 → grid cols-2 lg:cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100
  → cell: label (uppercase tracking-wide) + value (text-3xl tabular-nums) + change (emerald/red)
```

**Perbedaan per role:**
- **Admin LSP**: Total Asesi, Sertifikasi Aktif, Asesmen Hari Ini, Tingkat Kelulusan
- **Direktur**: Total Sertifikasi, Tingkat Kelulusan, Asesi Aktif, Pendapatan (with trend icons!)
- **Manajer**: Monitoring stats
- **Asesor**: Tahap-based stats (Persiapan, Praasesmen, Asesmen)
- **Asesi**: Profil Lengkap, Sertifikasi Aktif, Jadwal Asesmen, Dokumen (dengan ikon warna)
- **Admin TUK**: Schedule counts

Catatan: Direktur dashboard punya `ArrowUpRight`/`ArrowDownRight` icon di stat — pola unik, hanya di role ini.

### 10.2 Card Title + Icon Pattern

Konsisten di semua dashboard:
```jsx
<CardTitle className="flex items-center gap-2">
  <Icon className="w-5 h-5 text-primary" />
  Nama Section
</CardTitle>
```

### 10.3 Activity Feed Pattern

```
Card → CardHeader + CardContent
  → space-y-4 → item: flex items-start gap-3 p-3 bg-slate-50 rounded-lg
    → Status dot: w-2 h-2 rounded-full mt-2 (emerald/blue)
    → Text: text-sm text-slate-800
    → Time: text-xs text-slate-500 mt-1
```

### 10.4 Checklist / List Item Pattern

```
flex items-start gap-3 p-3 bg-slate-50 rounded-lg
  → Icon container: w-6 h-6 rounded-full flex items-center justify-center (emerald/blue/slate-200)
    → CheckCircle2 (completed), Clock (in-progress), none (pending)
  → Text + Badge side-by-side
  → Description: text-xs text-slate-600
```

### 10.5 Border Card (Hoverable)

```
p-3 border border-slate-200 rounded-lg hover:border-primary transition-colors
```

### 10.6 Insight Cards (Direktur)

```
grid cols-1 md:cols-3 gap-4
  → Card: p-4 bg-[color]-50 rounded-lg
    → Title: font-semibold text-[color]-900
    → Body: text-sm text-[color]-700
```

Warna bervariasi: `blue-50`, `emerald-50`, `amber-50` — memberi kategorisasi visual tanpa teks tambahan.

### 10.7 Quick Action Buttons

```
grid cols-1 md:cols-3 gap-4
  → button: p-4 border border-slate-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left
    → Icon: w-6 h-6 text-primary mb-2
    → Title: font-semibold text-slate-800
    → Description: text-sm text-slate-600
```

### 10.8 Sidebar Badge Counts

Untuk role Asesor: badge merah di nav item (pending count):
- `/asesor/persiapan` → badge dari `useAsesorPersiapanPending`
- `/asesor/praasesmen` → badge dari `useAsesorAbsenPending` (tahap1)
- `/asesor/asesmen` → badge dari `useAsesorAbsenPending` (tahap2)

Positioning: `absolute -top-1 -right-1` (icon box) atau `ml-auto` (inline).

### 10.9 Active Certification Card (Asesi)

Highlight card dengan `border-primary/20` — beda dari card biasa. Di dalemnya:
- Scheme name (large)
- Blue info box: `bg-blue-50 p-4 rounded-lg` untuk jadwal
- Full-width CTA button

### 10.10 Countdown Timer (Legacy & AsesiPage)

Pola `pulse-glow` animation untuk banner countdown — bikin urgency tanpa panik.

---

## 11. Background & Atmosphere

### 11.1 Video Background

```
LoopingVideoBackground
  → MP4 (Sequence 01.mp4) — fixed, fullscreen
  → Opacity overlay: 0.1 (sangat subtle)
  → z-index: -1 (di bawah semua konten)
```

Strategi: background video hampir transparan — fungsinya bukan visual statement, tapi mengisi "empty space" background supaya tidak flat.

### 11.2 BackgroundPattern (Floating Shapes)

```
fixed inset-0 pointer-events-none z-[-1]
  → Gradient: bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100
  → 9 floating decorative elements:
    - Large blur circles (w-80 h-80, primary/5, blur-3xl)
    - Small shapes: rotated squares, circles (border-2 border-primary/10)
    - animate-float with staggered delays (0.3s - 2s)
```

Pure CSS decorations — no image requests. Semua element punya `opacity-35` hingga `opacity-65`.

### 11.3 Sidebar Styling

```
bg-white/90 border-r border-slate-200/50 backdrop-blur-sm
```

Glassmorphism subtle — backdrop-blur biar sidebar "naik" sedikit dari background.

---

## 12. Loading & Empty States

### 12.1 Full Page Load

```
FullPageLoader
  → Dual spinning rings (primary clockwise, secondary counter-clockwise)
  → Logo di tengah (atau fallback "LSP" text)
  → Text: "Memuat..."
  → Fade-out transition 300ms
```

### 12.2 Section Loading

| Level | Component | Behavior |
|-------|-----------|----------|
| Inline | `SimpleSpinner` | SVG spinner, `text-primary` |
| Card | `SkeletonCard` | Pulse animation, matches card dimensions |
| Stats | `SkeletonStatsCard` | Pulse animation, icon + value + text |
| Table | `SkeletonTableRow` | Pulse animation, row-shaped |

### 12.3 Empty States

Pola langsung di halaman (belum ada komponen `EmptyState` terpusat):
```jsx
<div className="text-center py-8 text-slate-500">
  Tidak ada sertifikasi aktif
</div>
```

### 12.4 Error States

Pola inline:
```jsx
<div className="text-center py-8 text-red-500">
  Gagal memuat data: {error}
</div>
```

ErrorBoundary component menangani error tidak terduga.

---

## 13. State Visual Language

### 13.1 Interactive States

| State | Style |
|-------|-------|
| Default | Normal color |
| Hover | Background change (`bg-slate-50`, `hover:border-primary`) |
| Active | `bg-primary/10 text-primary` |
| Disabled | `opacity-50 cursor-not-allowed` |
| Transition | `transition-colors duration-200` (nav), `duration-300` (layout) |

### 13.2 Loading Transition

Route change di DashboardLayout menggunakan `requestAnimationFrame` — flash prevention:
```
location change → setShowContent(false) → rAF → setShowContent(true)
```
Ini menghindari race condition render karena state update terjadi di frame berikutnya.

---

## 14. Design Principles (Unwritten but Observed)

1. **Role-first layout** — Setiap role dapet dashboard yang relevan, bukan satu dashboard untuk semua
2. **Stat strip first** — Always open with 4 key metrics
3. **Card-based hierarchy** — Semua konten dalam card, konten luar card hanya page title
4. **Status color coding** — Warna adalah bahasa: emerald = good, amber = warning, red = bad, blue = active
5. **Hover as affordance** — Hover effect menunjukkan interaktivitas (atau ketiadaannya)
6. **Consistent over clever** — Pola diulang daripada bikin variasi baru tiap halaman
7. **Subtle atmosphere** — Background video, floating shapes, blur — hadir tapi tidak teriak

---

## 15. File Map (Dashboard-Related)

```
src/
├── index.css                          Global styles, CSS vars, animations
├── tailwind.config.js                 Theme config, keyframes, colors
│
├── components/
│   ├── DashboardLayout.tsx            Main layout wrapper (6 roles)
│   ├── DashboardSidebar.tsx           Role-based sidebar
│   ├── DashboardNavbar.tsx            Top navbar + mobile menu
│   ├── AsesiMainLayout.tsx            Asesi layout (no sidebar)
│   ├── BackgroundPattern.tsx          Floating decorative shapes
│   ├── PageTransition.tsx             Entrance animation wrapper
│   ├── ThemeToggle.tsx                Light/dark toggle
│   ├── ProtectedRoute.tsx             Auth guard
│   ├── RoleRoute.tsx                  Role gate
│   │
│   └── ui/
│       ├── card.tsx                   Card system
│       ├── badge.tsx                  Badge with semantic variants
│       ├── button.tsx                 Button with CVA variants
│       ├── avatar.tsx                 User avatar component
│       ├── loading-spinner.tsx        6 loader variants
│       └── ...                        Other primitives
│
├── pages/
│   ├── admin-lsp/DashboardAdminLSP.tsx
│   ├── manajer/DashboardManajer.tsx
│   ├── direktur/DashboardDirektur.tsx
│   ├── asesor/DashboardAsesor.tsx
│   ├── admin-tuk/DashboardAdminTUK.tsx
│   ├── asesi/DashboardAsesi.tsx
│   ├── asesi/DashboardAsesiPage.tsx
│   └── DashboardPage.tsx             Legacy fallback
│
├── contexts/
│   ├── auth-context.tsx                Auth state
│   ├── theme-context.tsx              next-themes wrapper
│   └── ToastContext.tsx               Toast system
│
├── lib/
│   ├── rbac-config.ts                 Role definitions, menus, permissions
│   └── utils.ts                       cn() helper
│
└── assets/
    ├── logo.png                       LSP Gatensi logo
    ├── favicon.png                    Favicon (also used in loaders)
    └── Sequence 01.mp4                Background video
```

---

## 16. Dark Mode Strategy

- `class` strategy via `next-themes`
- Dark values: background jadi gelap `222 28% 11%`, text jadi terang `210 40% 95%`
- Primary color **tidak berubah** — brand navy tetap navy di kedua mode
- Border dan muted surface jadi tone-down (dark slate, bukan light gray)
- Theme toggle: `Sun` (dark) ↔ `Moon` (light)
- Loading skeleton: hydration-safe dengan `animate-pulse` placeholder
- Transisi antar tema: handled by `next-themes`, CSS inheritance
