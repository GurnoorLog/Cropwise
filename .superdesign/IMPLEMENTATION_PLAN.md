# Implementation Plan — Harvest Window | Premium Dashboard

Design source: SuperDesign draft `e02f4d3d-74ea-453f-b41c-775f129f4410` (project `9689772b-7ec0-4c96-a92e-5935019d6cdc`)
Design fetched: `Harvest Window | Premium Dashboard` → `C:\Users\tambe\AppData\Local\Temp\harvest-window-draft.html`
Init context: `.superdesign/init/*.md` (components, layouts, routes, theme, pages, extractable-components)
Repo: `C:\Users\tambe\Downloads\CropWise-source-code`

## Additional implemented designs
- **News & Insights** (draft `19144b24-2ad3-437e-a97d-8193877b3d3c`) → `src/pages/NewsPage.tsx`, route `/news` (added to `App.tsx`). Nav: brand + All/Markets/Weather/Prices/Insights filter tabs + search/bell/avatar; Featured Story hero; 6-story grid with variant cards; "Load More Stories" (3 more). `index.css`: `.news-card`, `.filter-tab.active`, `.video-overlay-news`.
- **Voice Agent** (draft `edb454c7-1a56-421d-b40c-4ea2b0fba817`) → redesigned `src/pages/AdvisorPage.tsx` at `/app`. Full-screen centered: serif headline, status pill (Listening/Processing/Speaking/Ready), 200px state-colored mic, waveform bars, transcription line, agent card (recommendation + weather + price + Replay/New Question), suggestion pills, type-fallback. Kept live pipeline (STT → Open-Meteo → AI/ML or `recommend-crop` → TTS). `index.css`: `.video-overlay-voice`, `.waveform-bar`, `.mic-pulse`, `.state-*`, `.dot-pulse`.
- Dashboard nav updated: Forecasts + Buyers → `/news`; "View Full Forecast" + "View All Buyers" → `/news`; mobile fallback gains News link. `index.html` title → `Harvest Window | Dashboard`; `body { overflow-x: hidden }` + thin scrollbar added.

## Verification result

The target page is `src/pages/DashboardPage.tsx`. The fetched design is **already implemented near-1:1** — the previous pixel-exact pass covered it. Line-by-line diff (see chat log):

| Design element (draft HTML) | Current implementation | Status |
| --- | --- | --- |
| Sticky nav: serif logo, Overview/Forecasts/Buyers, bell, user block w/ avatar | `DashboardPage.tsx:83–120` | ✅ match |
| Serif header "Estate Dashboard" + subtitle | `:124–127` | ✅ match |
| Crop Status card (leaf icon, subtitle, Optimal Health badge, 4 stat cells, Ripeness 82% w/ red bar) | `:132–173` | ✅ match |
| Market Prices card (`/ 30 Days`, `+12.4%`, 7 bars 40→85 last black, chart-gradient, Week 1–3 + Current) | `:176–206` | ✅ match |
| Best Selling Window (black card, "April 18 — 22", Peak Liquidity Projection, $4.82/kg, Low (12%), View Full Forecast) | `:211–237` | ✅ match |
| Active Buyers (GR/AM/SF rows, bid + status, View All Buyers) | `:240–266` | ✅ match |
| Recommended Actions (3× border-l-4 cards, icon chip, tag) | `:271–293` | ✅ match |
| `fade-rise stagger-1..4` animation timing | CSS + card classes | ✅ match |
| `video-overlay` gradient (0.8→0.95) | `video-overlay-dashboard` in `index.css` | ✅ same values |

### Intentional deviations (keep as-is)
- Nav user block shows the **live signed-in user** (name + initials from `user.email` / `full_name`) instead of the design's static "James Miller / JM".
- Nav links use `react-router` `<Link>` (real routing) instead of `href="#"`.
- Lucide `Bell`/`Leaf`/`TrendingUp`/`CloudLightning`/`Calendar` replace iconify `<iconify-icon>` (same visual family).
- "View Full Forecast" / "View All Buyers" / "Forecasts" / "Buyers" route to `/news` (News & Insights). "Read Full Story" / suggestion pills route to `/app` (Voice Agent).

## Remaining work (small) — DONE
1. **Page title** — `index.html:7` now `Harvest Window | Dashboard`. ✅
2. **Scrollbar + overflow polish** — `src/index.css`: `body { overflow-x: hidden }` + thin 6px scrollbar (white/0.2 thumb). ✅

## Out of scope (not in this design; already real in app)
- `/app` Voice Agent flow (mic → Speechmatics STT → Open-Meteo weather → AI/ML direct or `recommend-crop` edge function → TTS replay)
- `/news` page (draft `19144b24`) and `/app` Voice Agent (draft `edb454c7`) — implemented as separate designs (see above).
- `/settings` Integrations & API Keys (Speechmatics + AI/ML key entry, env vs browser source badges)
- Google OAuth, Supabase edge functions (`speechmatics-token`, `recommend-crop`), Vercel deploy

## Suggested execution order — DONE
1. Updated `index.html` title. ✅
2. Added scrollbar/`overflow-x` CSS to `src/index.css`. ✅
3. Added NewsPage (`/news`) + Voice Agent redesign (`/app`), wired dashboard nav; `tsc` + `vite build` pass. ✅
4. Commit + push; Vercel auto-deploys. (pending commit)
