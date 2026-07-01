# Speed Audit — sisuj-lsp-gatensi

## Findings

### Critical (high impact)

| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| 1 | No route-based code splitting. All 40+ pages eager-imported in App.tsx | Initial bundle contains EVERY page | React.lazy() + Suspense |
| 2 | Duplicate route blocks in App.tsx (lines 112-222 identical to 242-352) | ~13KB dead code, maintenance burden | Remove second copy |
| 3 | FontAwesome + lucide-react dual icon libs. FA only used in UjianPage.tsx (3 icons) | FA adds ~1.3MB to bundle | Migrate 3 icons to lucide-react, remove FA |
| 4 | 2-second artificial loading delay in DashboardLayout | 2s blank screen on every page load | Remove delay (0ms) |
| 5 | console.log in AsesiOrAsesorRoute on every render | Dev noise, minor perf | Remove logs |

### Assets (medium impact)

| # | Issue | Size | Fix |
|---|-------|------|-----|
| 6 | Sequence 01.mp4 (28MB) loaded on every dashboard page | 28MB network cost, slow LCP | Replace with compressed version |
| 7 | bg.png (9.5MB) unused? Check usage | 9.5MB unused bytes | Remove if unused |
| 8 | Sequence 02.mp4 (13MB), Sequence 03.mp4 (20MB) - unused? | 33MB | Remove if unused |

### Code quality (low impact)

| # | Issue | Fix |
|---|-------|-----|
| 9 | Apl02Page.tsx (97KB) — largest file | Split into sub-components |
| 10 | DaftarHadirModal.tsx (47KB) — large modal | Split |

## Plan

1. App.tsx: React.lazy + Suspense for all pages, remove duplicate route blocks
2. vite.config.ts: remove FontAwesome chunk config
3. UjianPage.tsx: swap FontAwesome icons for lucide-react
4. RoleRoute.tsx: strip console.log
5. DashboardLayout.tsx: remove 2s delay
6. package.json: remove @fortawesome deps, reinstall
7. Remove unused large assets (bg.png, Sequence 02.mp4, Sequence 03.mp4)
8. Build + verify
