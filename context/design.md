# MessMate — Design System

## Overview

MessMate is built for students and bachelor groups in Bangladesh, mostly on
phones. The look is **calm, flat and dense with numbers**: layered navy
surfaces, one blue accent, a warm yellow-amber call to action, and tight,
heavy headings. Dark is the primary theme; light and system themes are
supported.

Source of truth: `apps/web/app/globals.css` (Tailwind v4 `@theme`). When this
file and `globals.css` disagree, `globals.css` is right and this file must be
updated.

### Principles

- **Flat surfaces.** Solid colours only. No gradients, glows or glassy
  backgrounds on cards, heroes or buttons. (The only gradient is the
  skeleton shimmer.)
- **Depth from layers, not shadows:** `surface-sunken` → `surface` →
  `surface-raised` → `surface-overlay`, separated by 1px borders.
  `shadow-panel` is only for floating sheets and bars.
- **Numbers first.** Money is always `৳` with `formatMoney` (whole taka) or
  `formatMoneyExact` (৳1,000 / ৳333.30). Never `BDT 1,000.00`.
- **Touch first.** Targets are at least 44px (`h-11`) on phones; denser
  `sm:`/`md:` variants on larger screens.

---

## Color System

Use the Tailwind names (`bg-surface`, `text-foreground-muted`,
`border-border-strong`, …), never raw hex.

| Token                 | Dark                  | Light     | Usage                                                  |
| --------------------- | --------------------- | --------- | ------------------------------------------------------ |
| `background`          | `#020013`             | `#fcfcfd` | Page background                                        |
| `surface-sunken`      | `#090b1d`             | `#f3f4f7` | Inputs, sidebar, wells                                 |
| `surface`             | `#11142b`             | `#ffffff` | Cards                                                  |
| `surface-raised`      | `#171a34`             | `#f9f9fb` | Hover, nested blocks, toggles                          |
| `surface-overlay`     | `#22274a`             | `#e8e8ec` | Popovers, menus                                        |
| `border`              | `#1a1d38`             | `#e0e1e6` | Card borders, dividers                                 |
| `border-strong`       | `#23274a`             | `#cdced6` | Inputs, secondary buttons                              |
| `primary`             | `#3291ff`             | `#0070f3` | Links, primary buttons, active nav                     |
| `primary-hover`       | `#51baff`             | `#3291ff` | Hover                                                  |
| `accent-warm`         | `#ffa929`             |           | Pending states, warnings, highlights                   |
| `gold`                | `#d4af37`             |           | Small decorative accents                               |
| `cta-from` / `cta-to` | `#ffe61c` / `#ffa929` |           | `bg-cta`: solid yellow, amber on hover (landing, auth) |
| `foreground`          | `#ffffff`             | `#11142b` | Headings, key numbers                                  |
| `foreground-body`     | `#d9dff2`             | `#2e3135` | Body text                                              |
| `foreground-muted`    | `#858fad`             | `#5a6169` | Labels, secondary text                                 |
| `destructive`         | `#ef4444`             |           | Errors, deletes, negative balance                      |
| `success`             | `#22c55e`             |           | Saved, approved, positive balance                      |

Status tints use the colour at low opacity on a border and background, e.g.
`border-success/25 bg-success/10 text-success`.

### Themes

`store/theme.ts` keeps `light | dark | system` and sets `data-theme` on
`<html>`. The toggle is in the More sheet on phones and next to Logout in the
desktop sidebar.

---

## Typography

| Role    | Font              | Token          | Usage                                        |
| ------- | ----------------- | -------------- | -------------------------------------------- |
| Heading | Inter             | `font-heading` | Headings, numbers                            |
| Body    | Inter             | `font-body`    | Everything else                              |
| Mono    | JetBrains Mono    | `font-mono`    | `label-mono` labels, emails, ids             |
| Bangla  | Noto Sans Bengali | `font-bengali` | Bangla UI (also the fallback in every stack) |

Fonts load through `next/font/google` (`app/fonts.ts`), as variable fonts.

Utilities:

- `heading-tight`: weight 800, letter-spacing −0.035em, line-height 1.08.
- `label-mono`: 11px uppercase mono, letter-spacing 0.12em, for small section
  labels above headings.

---

## Radius

| Token | Value  | Typical use                 |
| ----- | ------ | --------------------------- |
| sm    | 5px    | Small chips                 |
| md    | 8px    | Inputs, toggles             |
| lg    | 10px   | Buttons, nav items          |
| xl    | 12px   | Cards, buttons on phones    |
| 2xl   | 14px   | Large cards, sheets         |
| full  | 9999px | Avatars, pills, status dots |

---

## Motion

| Token           | Value                             |
| --------------- | --------------------------------- |
| Duration fast   | 150ms                             |
| Duration normal | 250ms                             |
| Duration slow   | 400ms                             |
| Ease default    | cubic-bezier(0.4, 0, 0.2, 1)      |
| Ease spring     | cubic-bezier(0.34, 1.56, 0.64, 1) |

Utilities: `animate-sheet-up` (bottom sheets), `animate-fade-in`,
`animate-pop-in`, `.page-enter` (soft fade-up on every dashboard navigation),
`.skeleton` (loading shimmer), the navigation progress bar and the splash
screen. Respect `prefers-reduced-motion`.

---

## Breakpoints

| Name    | Min width | Prefix |
| ------- | --------- | ------ |
| Phone   | 0         |        |
| Small   | 640px     | `sm:`  |
| Tablet  | 768px     | `md:`  |
| Desktop | 1024px    | `lg:`  |

Below `lg` the app uses a bottom navigation bar plus a More sheet; from `lg`
up, a fixed 288px sidebar. `pb-safe`, `pt-safe`, `pb-bottom-nav` and
`bottom-above-nav` handle notches and the bottom bar.

---

## Components

Reuse what exists before adding anything:

- `app/components/ui/`: small Radix + CVA primitives (`button`, `badge`,
  `popover`, `calendar`, `date-picker`, `select`, `sheet`, `skeleton`,
  `field-error`, `password-checklist`, `offline-hint`, …). No shadcn
  dependency, and no generated shadcn components.
- `components/feedback/`: `SuccessDialog`, `Toaster`, `QueryErrorState` /
  `QueriesErrorState`, `OfflineBanner`, `AppSplash`, `NavigationProgress`.
- `components/help/PageTips`: the per-page tips button.

### Buttons

- **Primary:** `bg-primary text-white`, hover `bg-primary-hover`.
- **CTA (marketing, auth):** `bg-cta`, solid yellow, amber on hover.
- **Secondary:** `border border-border-strong bg-surface`, hover
  `bg-surface-raised`.
- **Destructive:** `border-destructive/30 bg-destructive/10 text-destructive`.
- Height `h-11` on phones (`h-10`/`h-9` on desktop where dense).

### Cards

`rounded-xl border border-border bg-surface`, 16px+ padding. No shadow, no
gradient. Hover only changes the border or background.

### Feedback

- After adding, editing or deleting a deposit, expense, bazaar or meals: the
  success dialog (summary rows, then Go to dashboard / Stay here).
- Other successes: a toast. Failures: always a toast, never inline (except
  form field validation and auth forms).
- Failed loads: `QueryErrorState` with Retry, never an empty state.

---

## Bangla

The whole UI is translated (`apps/web/messages/{en,bn}`), switched in place
with `LanguageToggle`. Every new string needs both an `en` and a `bn` entry.
Bangla renders in Noto Sans Bengali through the font stacks.

---

## Icons

Lucide React only (no emoji, no icon fonts). 16–20px in UI, 24px in empty
states. `text-foreground-muted` by default, `text-primary` when active.
Decorative icons get `aria-hidden="true"`.
