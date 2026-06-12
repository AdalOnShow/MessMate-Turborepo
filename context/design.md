# MessMate — Design System

## Overview

MessMate's visual identity is **warm, approachable, and modern** — designed for students
and bachelor groups in Bangladesh / South Asia. The aesthetic balances a **dark, immersive
background** with **vibrant teal-cyan accents** and friendly typography to feel both
trustworthy and energetic.

---

## Color System

All colors are defined as CSS custom properties and Tailwind theme tokens.

### Dark Theme (Primary)

| Role            | Hex / Value              | CSS Variable           | Usage                             |
| --------------- | ------------------------ | ---------------------- | --------------------------------- |
| Background      | `#0B1120`                | `--color-background`   | Page background                   |
| Surface         | `#111827`                | `--color-surface`      | Cards, sections                   |
| Surface Raised  | `#1E293B`                | `--color-surface-raised` | Elevated cards, hover states    |
| Primary         | `#06B6D4`                | `--color-primary`      | CTAs, links, highlights           |
| Primary Hover   | `#22D3EE`                | `--color-primary-hover`| Button hover, link hover          |
| Accent Warm     | `#F59E0B`                | `--color-accent-warm`  | Bengali accents, badges, warmth   |
| Accent Warm Hover | `#FBBF24`             | `--color-accent-warm-hover` | Warm accent hover            |
| Foreground      | `#F1F5F9`               | `--color-foreground`   | Primary text                      |
| Foreground Muted | `#94A3B8`              | `--color-foreground-muted` | Secondary text, descriptions  |
| Border          | `rgba(148,163,184,0.15)` | `--color-border`       | Subtle borders, dividers          |
| Border Hover    | `rgba(148,163,184,0.25)` | `--color-border-hover` | Hovered borders                   |
| Destructive     | `#EF4444`                | `--color-destructive`  | Errors, destructive actions       |
| Success         | `#10B981`                | `--color-success`      | Success states, positive balance  |
| Ring            | `rgba(6,182,212,0.4)`    | `--color-ring`         | Focus rings                       |

### Gradient Tokens

| Name              | Value                                        | Usage                        |
| ----------------- | -------------------------------------------- | ---------------------------- |
| Hero Gradient     | `linear-gradient(135deg, #0B1120, #111827, #0F172A)` | Hero background       |
| Glow Primary      | `radial-gradient(circle, rgba(6,182,212,0.15), transparent 70%)` | Ambient glow effects |
| Glow Warm         | `radial-gradient(circle, rgba(245,158,11,0.1), transparent 70%)` | Warm accent glow     |
| Card Gradient     | `linear-gradient(180deg, #1E293B, #111827)`  | Card backgrounds             |

---

## Typography

### Font Pairing: Friendly SaaS

| Role     | Font              | Weights          | Usage                          |
| -------- | ----------------- | ---------------- | ------------------------------ |
| Heading  | Plus Jakarta Sans | 500, 600, 700    | Headings, hero text, nav       |
| Body     | Plus Jakarta Sans | 300, 400, 500    | Body text, descriptions        |
| Bengali  | Noto Sans Bengali | 400, 500, 600    | Bengali accent text            |

### Google Fonts Import
```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
```

### Type Scale (Desktop → Mobile)

| Token    | Desktop   | Mobile    | Weight | Line Height |
| -------- | --------- | --------- | ------ | ----------- |
| Display  | 64px      | 36px      | 700    | 1.1         |
| H1       | 48px      | 32px      | 700    | 1.2         |
| H2       | 36px      | 28px      | 600    | 1.25        |
| H3       | 24px      | 20px      | 600    | 1.3         |
| Body LG  | 20px      | 18px      | 400    | 1.6         |
| Body     | 16px      | 16px      | 400    | 1.6         |
| Body SM  | 14px      | 14px      | 400    | 1.5         |
| Caption  | 12px      | 12px      | 500    | 1.4         |

---

## Spacing

Using an 8px base grid (4px for fine adjustments):

| Token | Value  | Usage                        |
| ----- | ------ | ---------------------------- |
| xs    | 4px    | Icon padding, fine gaps      |
| sm    | 8px    | Tight element spacing        |
| md    | 16px   | Component internal padding   |
| lg    | 24px   | Section internal padding     |
| xl    | 32px   | Between components           |
| 2xl   | 48px   | Between sections (mobile)    |
| 3xl   | 64px   | Between sections (tablet)    |
| 4xl   | 96px   | Between sections (desktop)   |

---

## Border Radius

| Token    | Value  | Usage                     |
| -------- | ------ | ------------------------- |
| sm       | 6px    | Badges, chips             |
| md       | 8px    | Inputs, small cards       |
| lg       | 12px   | Cards, buttons            |
| xl       | 16px   | Feature cards             |
| 2xl      | 24px   | Hero elements, large CTAs |
| full     | 9999px | Avatars, pills            |

---

## Shadows & Effects

| Token       | Value                                     | Usage              |
| ----------- | ----------------------------------------- | ------------------ |
| Card        | `0 4px 24px rgba(0,0,0,0.3)`             | Default card       |
| Card Hover  | `0 8px 32px rgba(0,0,0,0.4)`             | Hovered card       |
| Glow Cyan   | `0 0 40px rgba(6,182,212,0.2)`           | CTA glow           |
| Glow Amber  | `0 0 40px rgba(245,158,11,0.15)`         | Warm accent glow   |

---

## Animation Tokens

| Token            | Value                    | Usage                      |
| ---------------- | ------------------------ | -------------------------- |
| Duration Fast    | 150ms                    | Hover, focus               |
| Duration Normal  | 250ms                    | Transitions, state changes |
| Duration Slow    | 400ms                    | Page reveals, stagger      |
| Easing Default   | cubic-bezier(0.4, 0, 0.2, 1) | General transitions   |
| Easing Spring    | cubic-bezier(0.34, 1.56, 0.64, 1) | Bouncy interactions |

---

## Breakpoints

| Name    | Min Width | Usage        |
| ------- | --------- | ------------ |
| Mobile  | 0px       | Default      |
| Tablet  | 768px     | md:          |
| Desktop | 1024px    | lg:          |
| Wide    | 1440px    | xl:          |

---

## Component Patterns

### Buttons
- **Primary**: Cyan background, white text, rounded-lg, glow on hover
- **Secondary**: Transparent with cyan border, cyan text, fill on hover
- **Ghost**: No border, muted text, subtle background on hover
- Min height: 44px for touch targets

### Cards
- Surface background with subtle border
- 16px padding minimum
- Hover: raise shadow + lighten border
- Transition: 250ms ease

### Section Headers
- Centered, with a small accent label above (Bengali or English)
- H2 heading with gradient or colored accent word
- Muted description below, max-width 640px

---

## Bengali Accent Usage

Bengali text (`Noto Sans Bengali`) is used for:
- Subtle taglines / accent phrases
- Section pre-headers (e.g., "বৈশিষ্ট্যসমূহ" for Features)
- Cultural touches that resonate with the target audience

Bengali text should always be paired with English equivalents for clarity.

---

## Icons

- Use inline SVGs only — no emojis, no icon fonts
- Consistent 24px stroke icons (Lucide style)
- Match `--color-foreground-muted` for default, `--color-primary` for active
