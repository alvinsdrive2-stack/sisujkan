# BUG REPORT

## Summary
- **Total Bugs Found**: 30
- **Critical**: 4
- **High**: 8
- **Medium**: 12
- **Low**: 6

---

## README.md (3 bugs)

| ID | Line | Bug | Fix |
|----|------|------|-----|
| 1 | 1 | Empty README, no project info | Add project description, installation, usage sections |
| 2 | 1 | UTF-16 encoding (unusual for MD) | Convert to UTF-8 for compatibility |
| 3 | 1 | CRLF line endings (Windows-only) | Use LF for cross-platform compat |

---

## SERVER_REQUIREMENTS.md (14 bugs)

### CRITICAL

| ID | Line | Bug | Fix |
|----|------|------|-----|
| 4 | 271 | Cron uses `sisuj_db` but DB named `sisuj` (line 181) | Align DB name: `sisuj` |
| 5 | 271 | Cron escape syntax wrong: `$(date +\%Y\%m\%d)` | Use `$(date +\%F)` for ISO date |
| 6 | 271 | `-p` flag exposes password in process list | Use `~/.my.cnf` config file |
| 7 | 135 | Cache-Control "public, immutable" dangerous for SPA index.html | Separate cache rules: index.html != static assets |

### HIGH

| ID | Line | Bug | Fix |
|----|------|------|-----|
| 8 | 48 | Nginx 1.18+ outdated | Update to 1.24+ stable |
| 9 | 160 | PM2 `instances: 4` + single `PORT: 3000` mismatch | Remove PORT var or set `NODE_APP_INSTANCE` |
| 10 | 118-124 | Upstream defines 4 ports but cluster mode uses 1 | Use single upstream or run 4 separate apps |
| 11 | 154-171 | `script: './dist/index.js'` assumes TS build | Verify TS usage, document build step |
| 12 | 298 | Node 18.x EOL April 2025 | Recommend 20.x LTS or 22.x LTS |

### MEDIUM

| ID | Line | Bug | Fix |
|----|------|------|-----|
| 13 | 198 | `query_cache_type = 0` invalid in MySQL 8.0 (removed) | Remove line entirely |
| 14 | 299 | Missing Nginx reload step | Add `sudo systemctl reload nginx` |
| 15 | 300 | Build instruction too vague | Specify: `npm run build && cp -r dist/* /var/www/sisuj/dist/` |
| 16 | 194 | Buffer pool calc mismatch: 4GB = 25% of 16GB but 50% of 8GB min | Clarify RAM assumption, provide both values |
| 17 | 277 | Rsync no auth method specified | Document SSH key setup |
| 18 | 112 | `worker_connections 2048` too low for 1500 req/sec | Increase to 4096+ |

### LOW

| ID | Line | Bug | Fix |
|----|------|------|-----|
| 19 | 21 | Calc error: "150 users × 10 req/sec = 1500" wrong logic | Fix: "150 users × 0.1 req/sec = 15 sustained" |
| 20 | 30 | Redundant calculation (same as line 21) | Consolidate or show different metrics |

---

## docs/plans/2026-03-03-detail-dokumen-direktur.md (4 bugs)

| ID | Line | Bug | Fix |
|----|------|------|-----|
| 21 | 124 | Wrong endpoint: `/dokumen/asesi/${id}` | Change to `/kegiatan/${id}/list-asesi` |
| 22 | 59 | Interface key `ba_komtek` should be `ba_pelaksanaan` | Match backend API structure |
| 23 | 163-166 | Using `Asesor` interface for asesi data | Create separate `Asesi` interface |
| 24 | 447 | Missing `navigate` import | Add `import { useNavigate } from "react-router-dom"` |

---

## docs/plans/2025-03-09-ia01-asesmen-design.md (3 bugs)

| ID | Line | Bug | Fix |
|----|------|------|-----|
| 25 | 3 | Date 2025 in past (current: 2026) | Update to 2026-03-09 |
| 26 | 13-14 | Conflicting permission statements | Clarify Asesor 2 = read-only access |
| 27 | 150-159 | POST uses `dokumen_id`, GET doesn't show source | Document `dokumen_id` from GET response |

---

## docs/plans/2026-03-05-asesmen-jenjang-low-flow-design.md (3 bugs)

| ID | Line | Bug | Fix |
|----|------|------|-----|
| 28 | 37 | Typo: `JENJAH` should be `JENJANG` | Fix spelling throughout |
| 29 | 63 | String comparison `jenjangId < "4"` wrong | Use `parseInt(jenjangId) < 4` |
| 30 | 91-92 | Redirect URLs missing `:id` parameter | Change to `/asesi/asesmen/:id/ia01` |

---

## docs/plans/2026-03-05-asesmen-jenjang-low-flow.md (11 bugs)

| ID | Line | Bug | Fix |
|----|------|------|-----|
| 31 | 103 | Co-Authored-By "Opus 4.6" outdated | Update to "Claude Opus 4.7" |
| 32 | 332 | Same Co-Authored-By version issue | Update to 4.7 |
| 33 | 332-333 | Navigate missing `:id` param | Use `` navigate(`/asesi/asesmen/${id}/ia02`) `` |
| 34 | 441 | Navigate missing `:id` param | Use `` navigate(`/asesi/asesmen/${id}/ia03`) `` |
| 35 | 645 | Navigate missing `:id` param | Use `` navigate(`/asesi/asesmen/${id}/upload-tugas`) `` |
| 36 | 825-827 | Navigate in AsesmenPage missing id | Use `kegiatan.id_izin` for path |
| 37 | 568 | Unused var `namaAsesor` with underscore | Remove or fix destructuring |
| 38 | 363 | Same unused var issue | Remove or fix |
| 39 | 567 | Same unused var issue | Remove or fix |
| 40 | 1163 | Windows path in bash command | Use forward slashes |
| 41 | 1164 | Grep may not work in PowerShell | Specify bash or use PS equivalent |

---

## Priority Fix Order

1. **Security first**: #6 (password exposure), #7 (immutable cache)
2. **Config breaks**: #4, #5, #9, #10 (DB names, ports, upstream)
3. **Data integrity**: #13, #22 (wrong API keys/fields)
4. **Version rot**: #8, #12, #25, #31, #32 (outdated versions)
5. **Navigation bugs**: #33-36, #30 (broken routes)
