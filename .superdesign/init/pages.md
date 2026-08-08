# Pages

Each page owns its header/nav (see layouts.md). Video background layer is rendered inside each page (not a shared layout).

## `/` LandingPage — `src/components/LandingPage.tsx`
Imports: `useAuth` (src/lib/auth.tsx), `Mic`, `Loader2` (lucide)
- `useAuth()` → `session`, `signIn` (Google OAuth)
- Nav (fixed): serif logo, Sign In / Dashboard pill
- Hero: `hero-heading` serif headline "Maximize every harvest with precision market timing.", tagline, CTA pill "Sign in with Google" (Google `G` inline SVG) → `signIn()`
- 3 feature columns (grid md:grid-cols-3, fade-rise stagger-1..3): Predictive Market Analytics / Elite Buyer Network / Quality Assurance (heading + body)
- Footer: `© 2024 HARVEST WINDOW TECHNOLOGIES` + inline SVG brand icons (Twitter, Instagram, LinkedIn)
- Deps: `src/lib/auth.tsx`, `src/supabase.ts`

## `/auth/callback` AuthCallbackPage — `src/pages/AuthCallbackPage.tsx`
Imports: `useAuth`, `Loader2`
- On mount: `getSession()`; redirects `session ? /app : /` via `useEffect` + `<Navigate>`
- Renders centered `Loader2` spinner while processing
- Deps: `src/lib/auth.tsx`, `src/lib/supabase.ts`

## `/app` AdvisorPage — `src/pages/AdvisorPage.tsx`
Imports: `useAuth`, components `MicButton`, `TextInput`, `ResponseCard` + `AIResponse`, hooks `useSpeechmatics`, `useTTS`, `getApiKeys` (src/lib/apiKeys.ts), `PRICES` (src/data/prices.ts)
- Header: nav links Dashboard / **Advisor** / API Keys + LogOut
- Flow: input mode toggle (MicButton ↔ TextInput) → STT transcript → `analyze(transcript)`:
  - parse commodity/region/keywords; call Open-Meteo weather API; lookup `PRICES` for price estimate; build prompt → call user AI/ML API directly (key from `getApiKeys()`) else Supabase Edge Function `recommend-crop`
- Renders `ResponseCard` with AIResponse; `useTTS` replay (`isSpeaking`)
- Deps: `src/lib/auth.tsx`, `src/lib/apiKeys.ts`, `src/lib/supabase.ts`, `src/hooks/useSpeechmatics.ts`, `src/hooks/useTTS.ts`, `src/data/prices.ts`, `src/components/{MicButton,TextInput,ResponseCard}.tsx`

## `/dashboard` DashboardPage — `src/pages/DashboardPage.tsx`
Imports: `useAuth`, `Link`, lucide (`Bell`, `ArrowUpRight`, `TrendingUp`, `ShoppingCart`, `CloudLightning`, `Check`, `Menu`, `Leaf`, `Calendar`, `Sprout`, `KeyRound`, `Newspaper`), `useState`, `useMemo`
- Header: Overview `/dashboard` / Forecasts `/news` / Buyers `/news` (no LogOut)
- Content (`max-w-[1400px] mx-auto px-8 py-10`):
  - Title row: "Estate Dashboard" (serif, 3xl) + subtitle "Manage your estate's market position in real time." + Menu button (mobile, `lg:hidden`)
  - Grid `lg:grid-cols-3 gap-6` (left 2 cols, right 1 col):
    - Crop Status card: Variety (Bounty Gold), Planted (Apr 15), Days to Harvest (76), Ripeness 82% (progress bar w-[82%])
    - Market Prices card: bar chart `CHART_BARS = [40,45,42,55,60,75,85]` (last bar `bg-black`, others `bg-emerald-700/80`), week labels "Week 1"–"Week 4"
    - Best Selling Window (black card): "April 18 — 22", Projected Price `$4.82/kg`, Market Saturation Low (12%), "View Full Forecast" → `/news`
    - Active Buyers: 3 rows (Green Roots Ltd / Aura Markets / Sovereign Foods), "View All Buyers" → `/news`
  - Recommended Actions: 3 cards (amber `CloudLightning` Weather Alert; green `TrendingUp` Price Surge Detected; slate `ShoppingCart` Schedule Logistics)
  - Mobile fallback links: Advisor `/app`, News `/news`, API Keys `/settings`
- `user = session?.user`; displayName from `user.email`; initials = first letters of email split
- Deps: `src/lib/auth.tsx`

## `/news` NewsPage — `src/pages/NewsPage.tsx`
Imports: `useAuth`, `Link`, `useMemo`, `useState`, lucide (`Search`, `Bell`, `ArrowRight`, `TrendingUp`, `ChevronRight`, `CloudRain`)
- Header: sticky nav, brand → `/dashboard`, filter pills (`FILTERS = All/Markets/Weather/Prices/Insights`, active black pill), search + bell + initials avatar → `/settings`
- Featured Story: hero card (h-[400px] rounded-[32px], grayscale Unsplash image, `bg-gradient-to-t from-[#0f172a]`, Featured Story pill, serif headline, description, "Read Full Story" pill → `/app`)
- Story grid (`grid md:grid-cols-2 lg:grid-cols-3 gap-6`): `STORIES` + `MORE_STORIES` rendered via `StoryCard` (variant switch: impact / weather / price / insight / buyers / logistics), filtered by active pill via `categoryFilter`
- "Load More Stories" → `setStoryCount(c => c + 3)`; "You're all caught up" when exhausted
- Deps: `src/lib/auth.tsx`

## `/settings` ApiKeysPage — `src/pages/ApiKeysPage.tsx`
Imports: `useAuth`, `getApiKeys`, `getApiKeySource`, `setApiKey`, `ApiKeySource`, lucide (`Bell`, `LogOut`, `Eye`, `EyeOff`, `KeyRound`, `Mic`, `Sparkles`, `Cloud`, `Save`, `Check`)
- Header: Dashboard / Advisor / **API Keys** + LogOut
- Content (`max-w-3xl mx-auto px-8 py-10`): title "Integrations & API Keys" (serif, 3xl) + subtitle
- Two `IntegrationCard`s:
  - Speechmatics (Mic icon): description, key input (`type=password`, eye toggle), Save / Clear; badge: `Configured · env` if `VITE_SPEECHMATICS_API_KEY` set, `Configured` if browser-stored, else `Not set`
  - AI / ML API (Sparkles icon): same pattern; badge from `VITE_AI_API_KEY` / browser storage
  - Card sub-label: "Stored in your browser — only sent to the API for inference."
- Weather note card (Cloud icon): Open-Meteo, "No API key required"
- Save → `setApiKey(name, value)` → localStorage + `useState` refresh; Clear → removes stored key
- Deps: `src/lib/auth.tsx`, `src/lib/apiKeys.ts`

## Dependency tree summary

```
App.tsx
├── LandingPage.tsx ── lib/auth.tsx ── lib/supabase.ts
├── AuthCallbackPage.tsx ── lib/auth.tsx
├── AdvisorPage.tsx  (Premium Voice Agent)
│   ├── components/TextInput.tsx
│   ├── hooks/useSpeechmatics.ts
│   ├── hooks/useTTS.ts
│   ├── lib/apiKeys.ts
│   └── data/prices.ts
├── DashboardPage.tsx ── lib/auth.tsx
├── NewsPage.tsx ── lib/auth.tsx
└── ApiKeysPage.tsx ── lib/auth.tsx, lib/apiKeys.ts
```
