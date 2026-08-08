# Extractable Components

The following JSX blocks are repeated across pages and are candidates for extraction into shared components. They are currently inlined.

## NavBar (auth header)
- Seen in: `DashboardPage.tsx`, `AdvisorPage.tsx`, `ApiKeysPage.tsx`
- Structure: sticky nav `border-b border-white/10 backdrop-blur-md bg-transparent` → `max-w-[1400px] mx-auto px-8 py-5 flex justify-between items-center` → left (serif logo + link list `hidden md:flex gap-6`) + right (Bell + user block `pl-4 border-l border-white/10`).
- Varies by page: `active` link, and presence of LogOut button.
- Proposed props: `{ active: string; links: {label, to}[]; showLogout?: boolean }` → uses `useAuth` internally for name/initials + `signOut`.

## LandingNav
- Seen in: `LandingPage.tsx`
- Fixed top nav, serif logo, Sign In / Dashboard pill.

## VideoBackground
- Seen in: all 4 pages (`LandingPage`, `DashboardPage`, `AdvisorPage`, `ApiKeysPage`)
- `<div className="fixed inset-0 w-full h-full -z-20 overflow-hidden">` + `<video>` (src `https://designerstephen.github.io/public-assets/videos/serene-art-hero.mp4`, autoPlay muted loop playsInline) + overlay div.
- Varies by overlay class: `video-overlay` (landing) vs `video-overlay-dashboard` (auth pages).
- Proposed props: `{ variant: "landing" | "dashboard" }`.

## UserAvatarBlock
- Seen in: auth headers
- Name + subtitle (`text-[10px] text-white/40 uppercase tracking-tighter`) + `w-10 h-10 rounded-full bg-slate-800 border border-white/20` initials avatar.
- Derived from `session.user.email` (initials = first letters of `email.split("@")[0]` parts).

## BrandIcon (X/Twitter, Instagram, LinkedIn)
- Seen in: `LandingPage.tsx` footer
- Inline SVG paths (lucide-react v1.30 has no brand icons), 20px, `text-white/40 hover:text-white transition-colors`.
- Proposed: `src/components/icons/BrandIcons.tsx` exporting `XIcon`, `InstagramIcon`, `LinkedInIcon`.

## MarketPriceChart
- Seen in: `DashboardPage.tsx`
- 7 vertical bars (`CHART_BARS = [40,45,42,55,60,75,85]`), heights `h-[40%]…h-[85%]`, last bar `bg-black` else `bg-emerald-700/80`, hover grow, + Week 1–4 labels row.
- Proposed props: `{ bars?: number[]; labels?: string[] }`.

## NewsFilterTabs
- Seen in: `NewsPage.tsx`
- Pill row (`FILTERS = All/Markets/Weather/Prices/Insights`) driving `useState<Filter>`; active pill gets `.filter-tab.active` (black bg).

## StoryCard
- Seen in: `NewsPage.tsx`
- `news-card` (16px radius) with category badge + time row and 6 variants (impact / weather / price / insight / buyers / logistics).

## VoiceMicButton
- Seen in: `AdvisorPage.tsx` (Premium Voice Agent)
- 200px round button with `.state-listening/processing/speaking/idle` colors, `mic-pulse` glow, icon swap (Mic / RefreshCw spin / Volume2), flanked by `.waveform-bar` sets.

## AgentStatusPill
- Seen in: `AdvisorPage.tsx`
- Floating pill: colored `.dot-pulse` dot + uppercase status label (Listening… / Processing… / Speaking… / Ready).

