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

---

# Implementation Plan — Harvest Window | Intelligence Weather Dashboard

Design source: SuperDesign draft `c1394c59-290e-4d7e-a350-f333cbf60529` (project `9689772b-7ec0-4c96-a92e-5935019d6cdc`)
Design fetched: `Harvest Window | Intelligence Weather Dashboard` → `C:\Users\tambe\AppData\Local\Temp\harvest-window-weather-draft.html`
Init context: `.superdesign/init/*.md` (components, layouts, routes, theme, pages, extractable-components)
Repo: `C:\Users\tambe\Downloads\CropWise-source-code`

## Requirements from user

> "For weather use this page UI. Remember no hardcoded real-time data — use the location where the user tells."

- Build a dedicated **Weather Dashboard** page implementing the design **1:1** (sticky nav, alert banner, current conditions hero, 24h trend bars, 7-day forecast grid, Farming Impact card, atmospheric grid, footer).
- **No hardcoded weather values.** Every number is fetched live from **Open-Meteo** for the **user's farm location** (read from `profiles.farm_location` in Supabase, e.g. "Agra" → geocode to `27.18, 78.01`). If the profile has no location, fall back to the browser's geolocation, then to a neutral default.
- Location pill in the nav shows the resolved farm location (not a hardcoded city).

## Deliverables

### 1. New route `/weather`
- `src/App.tsx`: add `<Route path="/weather" element={<Protected><WeatherPage /></Protected>} />`.
- Nav wiring:
  - `DashboardPage.tsx` + `NewsPage.tsx`: add a **Weather** link → `/weather` (keep Overview → `/dashboard`, Forecasts → `/news`).
  - `MobileNav.tsx`: replace `Forecasts` icon with **Weather** → `/weather` (or add a 5th item), label "Weather", icon `CloudSun`.
- `index.html` title → `Harvest Window | Weather`.

### 2. New data layer `src/lib/weather.ts`
- `geocodeLocation(location: string)` → Open-Meteo geocoding API (`https://geocoding-api.open-meteo.com/v1/search?name=<loc>&count=1&language=en&format=json`) → `{ name, latitude, longitude, admin1 }`.
- `fetchWeather(lat, lon)` → Open-Meteo forecast (`current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,weather_code,precipitation,pressure_msl,visibility,dew_point_2m&hourly=temperature_2m,weather_code,precipitation_probability,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,uv_index_max,wind_speed_10m_max&timezone=auto&forecast_days=7`).
- `weatherCodeMeta(code, lang)` → `{ desc, icon }` mapping (WMO codes → lucide icon: Sun/CloudSun/Cloud/CloudDrizzle/CloudRain/CloudSnow/CloudLightning/Fog) — bilingual hi/en, mirrors the existing `weatherCodeToDesc` helper in `AdvisorPage`.
- `fetchFarmWeather(userId)` → convenience wrapper: `getProfile(userId)` → `geocodeLocation(farm_location)` → `fetchWeather(lat, lon)` → returns `{ locationLabel, coords, weather }`.
- **No hardcoded temperatures/conditions anywhere** — only fallbacks for shape (e.g. empty array → skeleton).

### 3. New page `src/pages/WeatherPage.tsx` (design 1:1)
- Shell: video bg (`video-overlay-dashboard`) + sticky nav (brand → `/dashboard`; links Overview `/dashboard`, **Weather** active, Markets `/news`; right = location pill w/ `MapPin` + `ChevronDown`, refresh `RefreshCw` button, avatar block via `UserMenu`).
- Sections (each with `fade-rise stagger-*`):
  1. **Alert banner** (amber, `border-l-6 border-amber-500`, `AlertTriangle` icon, severity badge, description, Duration + "Deploy Countermeasures" button) — **derived from live data**: frost advisory if `daily.temperature_2m_min[0]` ≤ 4°C, heavy rain if `precipitation_probability_max[0]` ≥ 60, high wind if `wind_speed_10m_max[0]` ≥ 40. Hidden when no condition triggers.
  2. **Current Conditions hero** (`weather-card p-10`): "Current Intelligence" label, big serif temp + condition desc, Feels Like / Humidity / Wind (km/h + direction) / UV index (from `uv_index_max[0]`); right side = **24-Hour Temperature Trend** bar chart from `hourly.temperature_2m` (12 bars), labels 06:00/12:00/18:00/00:00.
  3. **7-Day Forecast** (`lg:col-span-2`): 7 day cells — day name (from `daily.time`), icon (by `weather_code`), high/low (from `temperature_2m_max/min`), hover → black.
  4. **Farming Impact** (black card): Irrigation Need (Low if `precipitation_probability_max` low, else Elevated), Pest Risk Score (Moderate when humidity high, else Low), Harvest Readiness (Peak Window Reaching when next days clear), "View Full Advisory" → `/app`.
  5. **Atmospheric grid** (4 cards): Precipitation chance (`precipitation_probability_max[0]`), Visibility (`visibility` km), Pressure (`pressure_msl` mb), Dew Point (`dew_point_2m`).
  6. Footer: `© 2024 HARVEST WINDOW INTELLIGENCE`.
- Loading skeleton (`Loader2` centered) while fetching; error state with "Try Again".

### 4. CSS additions (`src/index.css`)
- `.weather-card` (mirror `.card-glass`: rgba white 0.95, blur 12px, radius 24px, hover lift) + `.chart-container` / `.chart-bar` / `.line-indicator` styles from the design.

## Verification
1. `npx tsc --noEmit` + `npm run build` pass.
2. Manual: sign in → Dashboard → Weather → confirm live Agra data, location pill, alert banner only when conditions trigger, 7-day + 24h charts populated, mobile nav shows Weather.
3. Commit + push; Vercel auto-deploys.

## Out of scope
- Multi-location switcher / regional comparison (design mentions it; single farm location only for now).
- F/C unit toggle, inHg/mm toggles, monthly/seasonal selectors — keep °C/km/mb (app is India-focused).

---

# Implementation Plan — Agent Mode ("Jarvis") + Dashboard Calendar / MSP / Schemes

Repo: `C:\Users\tambe\Downloads\CropWise-source-code`

## Vision (from user)

- Add a **Dashboard ⇄ Agent** toggle in the top bar of every page.
- Default mode = **Dashboard**; toggle persists in `localStorage` (`hw.mode`).
- **Agent mode** = a voice-first "Jarvis". The user never navigates or types a full flow — the agent **executes actions** and **renders the result UI itself** (weather dashboard, news grid, prices, buyers, calendar, schemes) in a **split panel**: left = conversation/voice, right = the live rendered result.
- Voice stays **always active** (auto-re-listen after each answer), narrates summaries via TTS, then asks a follow-up.
- Nav bar must stay visible in agent mode (logo + links + user icon), unlike today's `/app` which is a bare page.
- **Dashboard mode additions**: a **Calendar** page (crop season windows + weather-alert chips) and an **MSP / Schemes** page with direct apply links so the farmer can apply easily.

## Decisions locked in (from Q&A)

1. Result rendering = **Split panel** (left conversation/voice, right rendered tool UI).
2. Toggle persists last choice in `localStorage`; default Dashboard.
3. Include: Buyer matching + connect, Crop calendar & seasonal tips, Proactive voice alerts, MSP / government schemes, Conversation memory, plus Dashboard Calendar + Schemes pages with direct apply links.

---

## Phase 0 — Shared result components (refactor)

The Agent right panel must render the SAME rich UIs that the dashboard pages show. Extract the current page bodies into reusable components so both Dashboard routes and Agent results share them:

| Extract | From | To |
|---|---|---|
| Weather dashboard body | `WeatherPage.tsx` | `src/components/results/WeatherResult.tsx` (props: `FarmWeather \| null`, `lang`, `onViewFullAdvisory?`) |
| News grid + featured | `NewsPage.tsx` | `src/components/results/NewsResult.tsx` (props: `rows`, `loading`) |
| Market prices chart + best window | `DashboardPage.tsx` | `src/components/results/PricesResult.tsx` (props: `PriceRow[]`) |
| Active buyers list | `DashboardPage.tsx` | `src/components/results/BuyersResult.tsx` (props: `BuyerRow[]`, `onConnect?`) |
| Calendar (new) | — | `src/components/results/CalendarResult.tsx` |
| Schemes / MSP (new) | — | `src/components/results/SchemesResult.tsx` |

`WeatherPage`, `NewsPage`, `DashboardPage` become thin wrappers that fetch data and render these components — no visual change for dashboard mode.

## Phase 1 — Agent orchestration (`src/lib/agent.ts`)

New module that turns a voice query into **an action + data + narration**:

```ts
type AgentAction =
  | "weather" | "news" | "prices" | "buyers"
  | "calendar" | "schemes" | "advice" | "unknown";

interface AgentResult {
  action: AgentAction;
  narration: string;        // TTS + conversation bubble
  followUp?: string;        // "Want me to check tomorrow's window?"
  data: unknown;            // payload for the right-panel renderer
}
```

- `classifyAction(query, farm, history)` — calls the AI (existing `getAIResponse` path / edge function `recommend-crop` extended, or a new `agent-action` edge function) with a prompt that returns `{ action, narration, followUp }` in JSON.
- `executeAction(action, farm)` — fetches live data per action:
  - `weather` → existing `fetchFarmWeather(userId)`
  - `news` → existing news fetch (edge `news-sync` / `news` table)
  - `prices` → `market_prices` table (same as Dashboard)
  - `buyers` → `buyers` table, filtered by user's crops
  - `calendar` → new `crop_calendar` table (sowing/harvest windows by crop)
  - `schemes` → new `schemes` + `msp_rates` tables
- **Conversation memory**: keep `history: { role, text }[]` (last ~12 turns) in state; pass to classifier so "and tomorrow?" resolves from prior context.
- **Proactive alerts**: on agent mount, compute `buildAlert` from weather; if triggered, auto-narrate + show alert banner in right panel (reuses `WeatherPage.buildAlert` logic → move to `src/lib/agent.ts` or `weather.ts`).

## Phase 2 — Agent split-panel UI (`AdvisorPage.tsx` rework)

Layout inside `min-h-screen` with the video bg + **sticky nav that now shows the Dashboard/Agent toggle** and the usual links (Overview / Weather / Markets / Calendar / Schemes) + UserMenu:

```
┌─────────────────────────── sticky top nav ───────────────────────────┐
│ logo · [Dashboard|Agent] toggle · Overview Weather Markets Calendar  │
│ Schemes  · lang  · user                                              │
├─────────────── LEFT (w-[420px]) ───────────────┬─────────────────────┤
│ · state pill (Listening/Processing/Speaking)   │  RIGHT = rendered   │
│ · mic orb + waveform                           │  tool UI:           │
│ · live transcript bubbles (user/agent)         │  WeatherResult /    │
│ · suggestion chips                             │  NewsResult /       │
│ · typed-input fallback                         │  PricesResult /     │
│ · "voice always active" indicator              │  CalendarResult /   │
│                                               │  SchemesResult      │
└───────────────────────────────────────────────┴─────────────────────┘
```

- **Always-on loop**: after TTS narration finishes → auto `startRecording()` → on final transcript → classify → execute → render right panel → narrate → follow-up question → repeat. Mic tap = barge-in/interrupt.
- Reuse `useSpeechmatics` + `useTTS` + `STATE_*` pills already in `AdvisorPage.tsx`.
- `MobileNav` remains (5 items) — in agent mode the split becomes stacked (left collapses to a floating orb).

## Phase 3 — Dashboard-mode additions

### 3a. `CalendarPage.tsx` (`/calendar`)
- Month grid (current month, prev/next arrows). Marks **sowing / growing / harvest windows** per crop from new `crop_calendar` table (seeded for common crops: tomato, onion, potato, wheat, rice, sugarcane…).
- **Weather-alert chips**: day cells get an amber ring + ⚠ if that day falls in a frost/heavy-rain advisory range (computed from live forecast + `buildAlert`).
- Season tip strip: "Best window to sow onion this region: now–mid Feb".
- Route `/calendar` + nav link (Dashboard + MobileNav). Wrapper page uses `CalendarResult`.

### 3b. `SchemesPage.tsx` (`/schemes`) — MSP + government schemes
- **MSP card**: crop-wise minimum support price (₹/quintal) from new `msp_rates` table (2025-26 reference data, seeded).
- **Schemes grid**: `schemes` table rows — name, ministry, summary, eligibility (hi/en), and a **"Apply / Learn more"** button linking directly to the official portal (e.g. PM-Kisan, KCC, PMFBY, e-NAM, crop insurance) — the farmer applies with one tap. Where possible pre-fill a URL with `?state=`/`language=hi`.
- Route `/schemes` + nav link (Dashboard + MobileNav). Wrapper page uses `SchemesResult`.

## Phase 4 — Data layer (Supabase)

New tables (migration `agent_dashboard.sql`), all with RLS `select` for authenticated users:
- `crop_calendar(id, crop, crop_hi, sowing_start, sowing_end, harvest_start, harvest_end, region)`
- `msp_rates(id, crop, crop_hi, price_per_quintal, year, unit)`
- `schemes(id, name, name_hi, ministry, summary, summary_hi, eligibility, eligibility_hi, apply_url, icon, category)`

Seed inserts for ~10 crops, ~8 MSP crops, ~6 flagship schemes (PM-Kisan, KCC, PMFBY, e-NAM, PMKSY, NABARD). Serve via `supabase.from(...)` reads (no new edge function needed; data is static and small).

## Phase 5 — Wiring

- **Toggle**: new `src/components/ModeToggle.tsx` (segmented control). Persists `hw.mode` in `localStorage`. Mounted in: `LandingPage` (hidden when signed out), `DashboardPage`, `WeatherPage`, `NewsPage`, `SettingsPage`, reworked `AdvisorPage` navs. App routes read mode: if `mode==="agent"`, `AdvisorPage` replaces the routed page when user navigates to `/app`; Dashboard nav links still work for the other pages.
- `App.tsx`: add `/calendar` + `/schemes` routes (Protected).
- `MobileNav.tsx`: swap "Ask AI" → keep; add Calendar + Schemes (→ 7 items, use smaller labels or horizontal scroll).
- Nav links on Dashboard/Weather/News/Settings gain Calendar + Schemes entries (match `navLink` styling).

## Verification
1. `npx tsc --noEmit` + `npm run build` pass.
2. Manual: toggle Dashboard→Agent → persists after reload → ask "weather forecast" → right panel shows full weather UI + narration + auto-relisten → "news" → news grid renders → "and tomorrow?" uses memory.
3. Dashboard: `/calendar` + `/schemes` render seeded data, apply links open.
4. Supabase: migration applied, RLS select works.
5. Commit + push; Vercel auto-deploys; deploy edge functions if changed.

## Out of scope (v1)
- Real buyer chat/call handoff (v1 = show buyer + "contact" copy action).
- Multi-location agent context.
- Persisted agent conversation across sessions (memory is per-session for v1).
