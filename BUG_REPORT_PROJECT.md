# BUG REPORT - PROJECT CODE
**Real code bugs found, not markdown docs**

---

## CRITICAL BUGS (Security + Auth Bypass)

| File | Line | Bug | Fix |
|------|------|------|-----|
| App.tsx | 100-101 | **PUBLIC ROUTE BYPASS** - `/capture` & `/attendance` no auth check | Wrap in ProtectedRoute |
| App.tsx | 112-367 | **DUPLICATE ROUTES** - All admin/asesor/direktur routes defined 2× | Delete lines 241-367 |
| ProtectedRoute.tsx | 33 | **NULL POINTER** - `user?.role?.name` no null check before `.name` access | Add: `if (!user?.role) return <ForbiddenPage />` |
| ProtectedRoute.tsx | 55 | **INVERTED LOGIC** - `!requiredRoles.includes(user.role.name)` denies access when user HAS role | Change to `if (!requiredRoles.includes(userRoleName))` |
| AsesorSignatureGuard.tsx | 14 | **GUARD BYPASS** - `isAsesor OR allAsesorSigned` returns null (no guard) | Change to `if (allAsesorSigned) return null` |
| RoleRoute.tsx | 75-81 | **WRONG ROLE** - SuperAdminRoute checks "Admin LSP" not "superadmin" | Change to `allowedRoles={["superadmin"]}` |

---

## HIGH PRIORITY (Broken Navigation + Crashes)

| File | Line | Bug | Fix |
|------|------|------|-----|
| **AsesmenPage.tsx** | 29 | **MISSING ID PARAM** - `navigate("/asesi/asesmen/ia01")` → 404 | Use `kegiatan.id_izin ?? kegiatan.jadwal_id` |
| **AsesmenPage.tsx** | 31 | **MISSING ID PARAM** - `navigate("/asesi/asesmen/ia04a")` → 404 | Use `kegiatan.id_izin ?? kegiatan.jadwal_id` |
| DashboardAsesi.tsx | 42-48 | **STATE BEFORE LOAD** - Uses `jenjang` before API loads | Add `if (!asesiId \|\| !jenjang) return null` |
| DashboardAsesi.tsx | 86-89 | **NULL POINTER** - `kegiatan.tuk.nama` no null check | Use `kegiatan.tuk?.nama` |
| DashboardAsesiPage.tsx | 366-385 | **UNDEF NAVIGATION** - Button navs without validation | Add `if (!idIizin \|\| !jenjang) { toast(...); return }` |
| ListAsesiAdminTUK.tsx | 82 | **WRONG ROUTING** - `useListAsesi(jadwalId \|\| "")` passes "" → API fail | Add `if (!jadwalId) { navigate("/admin-tuk"); return }` |
| ListAsesiAdminTUK.tsx | 354 | **UNDEF KEY** - `asesi.id_izin` as React key, can be undefined | Use `key={asesi.id_izin \|\| index}` |

---

## MEDIUM PRIORITY (Data Issues + Fragile Logic)

| File | Line | Bug | Fix |
|------|------|------|-----|
| DashboardAsesiPage.tsx | 43-69 | **NO ERROR HANDLING** - API fail → silent | Add `else { toast("Gagal memuat", "error") }` |
| DashboardAdminLSP.tsx | 6-39 | **HARDCODED DATA** - All stats fake | Replace with API calls |
| DashboardAdminTUK.tsx | 15 | **UNDEF LENGTH** - `kegiatans.length.toString()` crashes if undef | Add `?.length?.toString() \|\| "..."` |
| ListAsesiAdminTUK.tsx | 31-39 | **EMPTY DATE STATE** - countdown shows zeros when empty | Add `if (!targetDate) return null` |
| ListAsesiAdminTUK.tsx | 218-280 | **NESTED HELL** - 4+ level condition nesting | Extract to `isButtonDisabled()` helper |
| ListAsesiAdminTUK.tsx | 129 | **FULL PAGE RELOAD** - `window.location.reload()` loses state | Use `queryClient.invalidateQueries(['kegiatan'])` |
| RoleRoute.tsx | 37 | **UNSAFE CAST** - `as UserRole` without validation | Validate role before casting |
| RoleRoute.tsx | 40 | **TRUTHY CHECK BUG** - Invalid roles pass first check | Explicit `userRoleName !== undefined` check |
| RoleRoute.tsx | 192-227 | **EMPTY STRING PASS** - `user.noreg` check allows "" | Change to `user.noreg && user.noreg.length > 0` |
| ProtectedRoute.tsx | 64 | **CASE INCONSISTENCY** - `.toLowerCase()` only for 'asesor' | Remove or apply everywhere |

---

## BUG COUNT
- **Critical**: 9 (auth bypass + crashes)
- **High**: 7 (404s + null pointers)
- **Medium**: 10 (fragile + data issues)

**Total: 26 bugs**

---

## FIX PRIORITY ORDER
1. **Immediate**: App.tsx duplicates, ProtectedRoute logic, AsesorSignatureGuard bypass
2. **Today**: AsesmenPage.tsx navigation (404s), DashboardAsesi null pointers
3. **This week**: Dashboard error handling, ListAsesiAdminTUK refactoring
