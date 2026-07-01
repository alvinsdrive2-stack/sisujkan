# SISUJ Design System

## Color Strategy: Restrained + Brand Tint

Primary is deep navy. Backgrounds are white, tinted faintly toward the navy hue (chroma ~0.005). One red accent for destructive actions and brand highlights — used sparingly.

### CSS Variables (current — HSL format via shadcn)

```
--primary: 222 80% 25%          /* LSP Gatensi navy */
--primary-foreground: 210 40% 98%
--background: 0 0% 100%
--foreground: 222 84% 4.9%
--border: 214 32% 91%
--muted: 210 40% 96%
--radius: 0.5rem
```

**Target migration (OKLCH):**
```
--primary: oklch(0.27 0.09 261)          /* navy — same hue, OKLCH space */
--background: oklch(0.995 0.003 261)     /* faint navy tint, not pure white */
--foreground: oklch(0.18 0.03 261)       /* dark navy-tinted text */
--muted: oklch(0.96 0.005 261)
--border: oklch(0.90 0.007 261)
--accent-red: oklch(0.50 0.18 22)        /* brand red, used ≤10% */
```

## Typography

**Not yet defined** — currently falls back to system-ui.

**Recommended stack:**
- Body/UI: `Inter` — neutral, highly legible, good at small sizes for form labels
- Heading/Display: `Plus Jakarta Sans` — slightly more personality than Inter, still professional
- Monospace (form codes, document IDs): `JetBrains Mono` or `IBM Plex Mono`

Font size scale:
- xs: 11px (form codes, legal labels)
- sm: 13px (table data, secondary info)
- base: 14px (body, form inputs)  
- lg: 16px (section headings)
- xl: 20px (page titles)
- 2xl–3xl: display use only

## Spacing Rhythm

Avoid identical padding everywhere. Use a stepped scale:
- Tight (form rows): 12px vertical, 14px horizontal
- Default (cards): 20px
- Loose (section gaps): 32–48px

## Elevation

Use shadow sparingly. Three levels maximum:
- `shadow-sm` — inputs, subtle card borders
- `shadow-md` — floating cards, dropdowns
- `shadow-xl` — modals only

Do not stack shadows (shadow-lg on a card inside a shadow-2xl container).

## Component Patterns

### Stat/Metric Display

**Banned:** Icon + big number + small label + colored bg box (hero-metric template).

**Use instead:**
- Horizontal data rows with label left, value right, subtle separator
- Or: label group + value with inline trend indicator, no background colors
- Color only the trend indicator (green/red), not the entire cell

### Cards

Flat white. 1px border (`border-slate-200`). `rounded-xl` for content cards, `rounded-lg` for compact items.

No gradient fills on CardHeader.
No nested cards.
No identical-layout card grids.

### Sidebar Navigation

Active item: `bg-primary/10 text-primary font-medium` — background tint only.
**No side-stripe borders.** No `border-left` accent.
No icon background boxes on active items.

### Buttons

Primary: solid navy. No gradient.
Secondary: outline `border-slate-200` with hover fill.
Destructive: solid red.

### Form Inputs

Height 36px (compact). Focus ring 2px primary at 40% opacity.
Label: 12px semibold, `text-slate-600`, 4px gap above input.

## Motion

Page transitions: `pageFadeIn` 300ms ease-out — keep as-is.
Hover: 150ms ease-out for background/shadow changes.
**Remove:** shimmer on gradient backgrounds, `animate-float`, bounce effects on UI elements.
Keeps: spinner for loading states, subtle scale on buttons.

## Known AI-Pattern Violations to Fix

1. Hero-metric stat grid in `DashboardAdminLSP.tsx`
2. `bg-gradient-to-r from-primary/5 to-transparent` on CardHeader in `DashboardPage.tsx`
3. `animate-shimmer` on countdown banner
4. Left side-stripe in `DashboardSidebar.tsx` active state (`w-1 h-6 bg-white absolute left-0`)
5. Gradient button in `LoginPage.tsx` (`from-primary to-primary/90`)
6. Glassmorphism default: `backdrop-blur-md` on footer, `bg-white/90` sidebar
7. Video background + glass cards on every page (performance + aesthetic overuse)
