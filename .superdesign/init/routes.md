# Routes

Config-based routing via `react-router-dom` v7, defined in `src/App.tsx` (`BrowserRouter`). All routes except `/` and `/auth/callback` are wrapped in a `Protected` gate (redirects to `/` when no Supabase session; shows a centered `Loader2` spinner while loading).

## Router config (src/App.tsx)

```tsx
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/auth/callback" element={<AuthCallbackPage />} />
  <Route path="/app" element={<Protected><AdvisorPage /></Protected>} />
  <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
  <Route path="/settings" element={<Protected><ApiKeysPage /></Protected>} />
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

## Route map

| URL | Component | Layout/Shell |
| --- | --- | --- |
| `/` | `src/components/LandingPage.tsx` | Own fixed nav + hero + footer, video bg |
| `/auth/callback` | `src/pages/AuthCallbackPage.tsx` | Redirects into app after Google OAuth |
| `/app` | `src/pages/AdvisorPage.tsx` | Voice Agent: fixed top nav (lang/settings/logout/close), radial video overlay, centered mic |
| `/dashboard` | `src/pages/DashboardPage.tsx` | Header (Overview/Forecasts/Buyers, no logout), video bg |
| `/news` | `src/pages/NewsPage.tsx` | Sticky nav (brand + All/Markets/Weather/Prices/Insights filter tabs + search/bell/avatar), video bg |
| `/settings` | `src/pages/ApiKeysPage.tsx` | Header (Dashboard/Advisor/API Keys + logout), video bg |
| `*` | `Navigate to /` | — |

## Key pages summary

- **`/` Landing**: serif hero ("Maximize every harvest with precision market timing."), tagline, 3 feature columns (Predictive Market Analytics / Elite Buyer Network / Quality Assurance), CTA "Sign in with Google" pill, brand icon footer.
- **`/dashboard` Estate Dashboard**: header "Estate Dashboard" + subtitle; 3-col grid (2/1): Crop Status card (Variety/Planted/Days to Harvest/Ripeness 82%), Market Prices bar chart (`CHART_BARS = [40,45,42,55,60,75,85]`, last bar black) + "Week 1–4" labels; right column: Best Selling Window (black card, "April 18 — 22", Projected Price $4.82/kg, Market Saturation Low (12%), "View Full Forecast" → `/news`), Active Buyers (Green Roots Ltd / Aura Markets / Sovereign Foods rows, "View All Buyers" → `/news`); Recommended Actions section (3 cards: amber Weather Alert, green Price Surge Detected, slate Schedule Logistics). Nav: Overview `/dashboard`, Forecasts & Buyers `/news`. Mobile fallback links: Advisor `/app`, News `/news`, API Keys `/settings`.
- **`/news` News & Insights**: sticky nav with brand → `/dashboard`, filter pills (All/Markets/Weather/Prices/Insights, active = black pill), search + bell + initials avatar → `/settings`; Featured Story hero (Unsplash grayscale image, gradient, "Featured Story" pill, serif headline, "Read Full Story" → `/app`); grid of `.news-card` stories (variants: impact, weather w/ amber left border, price w/ sparkline bars, insight w/ author, buyers w/ avatar stack, logistics w/ tags); "Load More Stories" button appends `MORE_STORIES` until exhausted.
- **`/app` Voice Agent**: full-screen centered; fixed top nav (serif logo → `/dashboard`, language toggle hi/en, settings → `/settings`, sign out, close → `/dashboard`); serif headline + subtitle; status pill (dot + Listening/Processing/Speaking/Ready, colors green/amber/blue/gray); 200px round mic button with state colors (`.state-*`), waveform bars flanking (visible while recording/thinking), transcription `"..."` line, agent card (white, "Agent Response" label, recommendation + weather + price, Replay + New Question pills), suggestion pills (Market Prices / Weather Forecast / Buyer Opportunities), keyboard "Type your question" fallback (`TextInput`). Same live pipeline as before: Speechmatics STT → Open-Meteo weather → AI/ML direct or `recommend-crop` edge function → TTS.
- **`/settings` Integrations & API Keys**: two IntegrationCards (Speechmatics `mic`, AI/ML `sparkles`) with password input + save/clear, env vs browser key-source badge; Weather note card (Open-Meteo, no key).
