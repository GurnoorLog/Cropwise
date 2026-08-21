# CropWise

A farmer advisor for India. Ask a question out loud or type it, and CropWise answers with mandi prices, weather, sowing windows, government schemes, buyer contacts, or market news. It replies in English, Hindi, or Hinglish depending on how you ask.

Live at [cropwise-chi.vercel.app](https://cropwise-chi.vercel.app).

## Features

- **Advisor** - ask by voice or text. Questions route automatically to prices, weather, calendar, schemes, buyers, or general advice. Romanized Hindi ("aaj tamatar ka bhav kya hai") gets a Hinglish reply.
- **Voice input** - real-time transcription through Speechmatics, with Hindi and other Indian languages.
- **Prices** - live Agmarknet mandi rates when the government feed is reachable; clear seasonal estimates when it is not. The app tells you which one you are looking at.
- **Weather** - 7-day forecast from Open-Meteo, tied to your district.
- **Crop calendar** - kharif and rabi sowing and harvest windows per crop.
- **MSP and schemes** - current support prices and 12 central government schemes with apply links.
- **Buyers and news** - buyer opportunities by crop, and market news that affects what you grow.

## Stack

React, Vite, TypeScript, Tailwind CSS on the front. Supabase behind it: Postgres with row level security, Google sign-in, and four Deno edge functions.

| Function | Job |
|---|---|
| `recommend-crop` | The advisor brain. Builds a prompt from your question, location, weather, and price context, calls the AI API, returns structured JSON |
| `prices-sync` | Pulls live rates from Agmarknet through data.gov.in and caches them in Postgres. Falls back to seeded estimates |
| `news-sync` | Fetches agri market news into the `news` table |
| `speechmatics-token` | Mints short-lived Speechmatics JWTs so the browser never holds the raw API key |

## Run it locally

```bash
npm install
npm run dev
```

Create `.env.local` in the project root:

```
VITE_AI_API_KEY=...          # AIML API key, used when the browser calls the AI directly
VITE_GOOGLE_MAPS_KEY=...     # Maps JS key with the Places library enabled
VITE_SPEECHMATICS_API_KEY=... # optional, skips the server token endpoint
```

The Supabase URL and anon key live in `src/supabase.ts`. Change them there if you fork onto your own project.

## Backend setup

On your Supabase project:

```bash
supabase link --project-ref <your-ref>
supabase db push                # applies everything in supabase/migrations
supabase functions deploy recommend-crop prices-sync news-sync speechmatics-token
supabase secrets set AIML_API_KEY=... SPEECHMATICS_API_KEY=...
```

Optional, for live prices instead of estimates:

```bash
supabase secrets set DATA_GOV_IN_API_KEY=<free key from data.gov.in>
```

For Google sign-in, create an OAuth client in Google Cloud Console and add these redirect URIs: your app's `/auth/callback`, and `<your-project>.supabase.co/auth/v1/callback`. Paste the client ID and secret into Supabase under Authentication, then Providers, then Google.

## Deploy

Any static host works since the build outputs plain files. On Vercel:

```bash
npm run build
vercel deploy --prebuilt --prod
```

Set the three `VITE_` variables in your hosting dashboard so builds bake them in. Note that `vercel pull` writes empty placeholders for sensitive variables, which overrides `.env.local` during local prebuilt builds. Keep real values in `.vercel/.env.production.local` if you build that way.

## Data honesty

When the live feed is down or rate limited, prices show as estimates rather than fake quotes. Spoilage risk, weather summaries, and price figures all say what they are based on.
