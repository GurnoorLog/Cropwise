# Theme

Tailwind CSS **v4** (CSS-first config via `@theme` in `src/index.css`), no `tailwind.config.js`. Vite + React 18.

## Part 1 — Compact token summary

### Fonts
- `--font-sans` (body): Inter, "Noto Sans Devanagari", system stack
- `--font-serif` (display): "Instrument Serif", "Noto Serif Devanagari", Georgia
- Loaded via Google Fonts `@import` in `index.css` (Instrument Serif ital@0;1 + Inter 400/500/600/700)

### Colors (oklch tokens, via `@theme`)
| Token | Value (oklch) | Usage |
| --- | --- | --- |
| `--color-primary` | `0.52 0.13 145` (green) | buttons, accents |
| `--color-on-primary` | `1.0 0 0` (white) | text on primary |
| `--color-secondary` | `0.40 0.11 150` | hover |
| `--color-accent` | `0.74 0.16 80` (amber) | accents |
| `--color-background` | `0.98 0.02 95` | page bg |
| `--color-foreground` | `0.27 0.04 70` | text |
| `--color-muted` | `0.96 0.02 92` | subtle bg |
| `--color-border` | `0.88 0.04 85` | borders |
| `--color-destructive` | `0.52 0.18 25` (red) | errors/recording |
| `--color-ring` | `0.52 0.13 145` | focus ring |
| `--color-success` | `0.55 0.15 145` | spoilage green |
| `--color-warning` | `0.65 0.16 75` | spoilage yellow |
| `--color-card` | `1.0 0 0` (white) | cards |

### Dashboard/landing palette (Tailwind slate + hardcoded classes)
- Page/dark bg: `bg-[hsl(201,100%,13%)]` (deep navy-teal), also `bg-basis` in reference
- Glass card: `.card-glass` — `rgba(255,255,255,0.95)`, blur 12px, 1px black/10 border, `border-radius: 24px`, shadow `0 4px 20px rgba(0,0,0,0.08)`; hover translateY(-4px) + `0 12px 30px rgba(0,0,0,0.12)`
- Video scrims: `.video-overlay` (landing) = `linear-gradient(to bottom, rgba(15,23,42,0.4), rgba(15,23,42,0.7))`; `.video-overlay-dashboard` = `rgba(15,23,42,0.8) → rgba(15,23,42,0.95)`
- Chart wash: `.chart-gradient` = `linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0))`
- Serif hero: `.hero-heading` = 80px / 0.95 line-height / -2.46px tracking (48px on <768px)

### Motion
- `.fade-rise` — fade up 0.8s ease-out, from translateY(24px); stagger delays: `.stagger-1` 0s, `.stagger-2` 0.1s, `.stagger-3` 0.2s, `.stagger-4` 0.3s
- `.animate-fade-in-up` 400ms; `.animate-spin-slow` 1.5s; `.animate-mic-pulse` 2s; `.pill-button` hover scale 1.03
- Reduced-motion: disables all animations

### Borders/radius
- Cards 24px; inputs/buttons 12px (`rounded-xl`) / 8px; avatars/status pills full `rounded-full`

## Part 2 — Raw source

### `src/index.css` (full)

```css
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Inter", "Noto Sans Devanagari", ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-heading: "Inter", "Noto Sans Devanagari", ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-serif: "Instrument Serif", "Noto Serif Devanagari", ui-serif, Georgia, serif;

  /* Earthy Greens & Warm Tones */
  --color-primary: oklch(0.52 0.13 145);
  --color-on-primary: oklch(1.0 0 0);
  --color-secondary: oklch(0.40 0.11 150);
  --color-accent: oklch(0.74 0.16 80);
  --color-background: oklch(0.98 0.02 95);
  --color-foreground: oklch(0.27 0.04 70);
  --color-muted: oklch(0.96 0.02 92);
  --color-border: oklch(0.88 0.04 85);
  --color-destructive: oklch(0.52 0.18 25);
  --color-ring: oklch(0.52 0.13 145);
  --color-success: oklch(0.55 0.15 145);
  --color-warning: oklch(0.65 0.16 75);
  --color-card: oklch(1.0 0 0);
}

html { -webkit-tap-highlight-color: transparent; }

body {
  font-family: var(--font-sans);
  background-color: var(--color-background);
  color: var(--color-foreground);
  -webkit-font-smoothing: antialiased;
}

*:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
  border-radius: 4px;
}

@keyframes mic-pulse {
  0%, 100% { box-shadow: 0 0 0 0 oklch(0.52 0.13 145 / 0.4); }
  50% { box-shadow: 0 0 0 20px oklch(0.52 0.13 145 / 0); }
}
.animate-mic-pulse { animation: mic-pulse 2s ease-in-out infinite; }

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up { animation: fade-in-up 400ms ease-out forwards; }

@keyframes spin { to { transform: rotate(360deg); } }
.animate-spin-slow { animation: spin 1.5s linear infinite; }

/* Serif hero heading — matches the landing design */
.hero-heading {
  font-size: 80px;
  line-height: 0.95;
  letter-spacing: -2.46px;
}
@media (max-width: 768px) { .hero-heading { font-size: 48px; } }

.fade-rise { opacity: 0; animation: fadeRise 0.8s ease-out forwards; }
@keyframes fadeRise {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
.stagger-1 { animation-delay: 0s; }
.stagger-2 { animation-delay: 0.1s; }
.stagger-3 { animation-delay: 0.2s; }
.stagger-4 { animation-delay: 0.3s; }

.pill-button { transition: transform 0.3s ease-in-out; }
.pill-button:hover { transform: scale(1.03); }

.video-overlay { background: linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.7)); }

.video-overlay-dashboard { background: linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.95)); }

.card-glass {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.card-glass:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
}

.chart-gradient { background: linear-gradient(180deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0) 100%); }

@media (prefers-reduced-motion: reduce) {
  .animate-mic-pulse, .animate-fade-in-up, .animate-spin-slow, .fade-rise { animation: none; }
}
```

### Styling conventions
- Icons: `lucide-react` (brand icons like Twitter/Instagram/LinkedIn are NOT in lucide v1.30 — LandingPage uses inline SVG brand icons)
- Fonts: `font-serif` (Instrument Serif) for display headings; `font-sans` (Inter) for body
- Buttons: pills (`rounded-full`) on landing; `rounded-xl` on app pages
- Breakpoints used: `sm` (640), `md` (768), `lg` (1024); layout widths `max-w-[1400px]` (dashboard/settings/advisor), `max-w-[1280px]` (landing)
