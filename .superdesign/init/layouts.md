# Layouts

There is **no shared app-shell layout component**. Each page renders its own header/nav and background. The repeating shell pattern across all authenticated pages:

1. Root div: `min-h-screen relative flex flex-col isolate bg-[hsl(201,100%,13%)]`
2. Fixed background video layer (`-z-20`) with dark overlay (`video-overlay` on landing, `video-overlay-dashboard` on dashboard/settings/advisor)
3. Sticky top nav (`sticky top-0 z-50 border-b border-white/10 backdrop-blur-md bg-transparent`)
4. Main content
5. Optional footer

## Landing page nav + footer (from `src/components/LandingPage.tsx`)

- Fixed top, full-width, `max-w-[1280px] mx-auto px-8 py-6 grid grid-cols-2 md:grid-cols-3 items-center`
- Logo: `font-serif text-[30px] text-white tracking-tight` "Harvest Window" + `®` superscript
- Right: pill sign-in button (black bg, white text, rounded-full, `pill-button`)

```tsx
<nav className="fixed top-0 left-0 right-0 z-50 w-full bg-transparent">
  <div className="max-w-[1280px] mx-auto px-8 py-6 grid grid-cols-2 md:grid-cols-3 items-center">
    <a href="#" onClick={(e) => e.preventDefault()} className="font-serif text-[30px] text-white tracking-tight">
      Harvest Window
      <sup className="text-[14px] ml-0.5">®</sup>
    </a>
    <div className="flex justify-end md:col-start-3">
      <button
        onClick={handleEnter}
        className="pill-button inline-flex bg-black text-white px-6 py-2.5 rounded-full text-[14px] font-medium cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        {session ? "Dashboard" : "Sign In"}
      </button>
    </div>
  </div>
</nav>
```

Footer (bottom bar, page end): `© 2024 HARVEST WINDOW TECHNOLOGIES` left; brand icon links (Twitter/Instagram/LinkedIn SVGs, `text-white/40 hover:text-white`) right.

## Authenticated pages header (Dashboard / Advisor / Settings)

Repeated header on `DashboardPage.tsx`, `AdvisorPage.tsx`, `ApiKeysPage.tsx` (identical structure; differs only in active link and logout presence):

- Container: `sticky top-0 z-50 w-full border-b border-white/10 backdrop-blur-md bg-transparent`
- Inner: `max-w-[1400px] mx-auto px-8 py-5 flex justify-between items-center`
- Left group (`flex items-center gap-8`): serif logo Link `font-serif text-2xl text-white tracking-tight` "Harvest Window"; nav links `hidden md:flex gap-6`, each `text-sm font-medium ${active ? "text-white" : "text-white/60 hover:text-white"}`
- Right group (`flex items-center gap-6`): Bell button (`text-white/60 hover:text-white`); user block `flex items-center gap-3 pl-4 border-l border-white/10` = name (`text-xs font-semibold text-white`) + subtitle ("Premium Estate", `text-[10px] text-white/40 uppercase tracking-tighter`) + 40px initials avatar (`w-10 h-10 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-white font-bold text-sm`). Advisor & Settings pages add a LogOut button (`text-white/40 hover:text-white`) after the avatar.

```tsx
<nav className="sticky top-0 z-50 w-full border-b border-white/10 backdrop-blur-md bg-transparent">
  <div className="max-w-[1400px] mx-auto px-8 py-5 flex justify-between items-center">
    <div className="flex items-center gap-8">
      <Link to="/dashboard" className="font-serif text-2xl text-white tracking-tight">
        Harvest Window
      </Link>
      <div className="hidden md:flex gap-6">
        {/* Overview/Forecasts/Buyers on Dashboard; Dashboard/Advisor/API Keys on Advisor & Settings */}
      </div>
    </div>
    <div className="flex items-center gap-6">
      <button aria-label="Notifications" className="text-white/60 hover:text-white transition-colors cursor-pointer">
        <Bell className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-3 pl-4 border-l border-white/10">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-white">{displayName}</p>
          <p className="text-[10px] text-white/40 uppercase tracking-tighter">Premium Estate</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-white font-bold text-sm">
          {initials}
        </div>
        {/* Advisor & Settings only: */}
        {/* <button onClick={signOut} ...><LogOut className="w-4 h-4" /></button> */}
      </div>
    </div>
  </div>
</nav>
```

## Background video layer (all pages)

```tsx
<div className="fixed inset-0 w-full h-full -z-20 overflow-hidden">
  <video autoPlay muted loop playsInline className="w-full h-full object-cover">
    <source src="https://designerstephen.github.io/public-assets/videos/serene-art-hero.mp4" type="video/mp4" />
  </video>
  <div className="absolute inset-0 video-overlay" />           {/* landing */}
  <div className="absolute inset-0 video-overlay-dashboard" /> {/* dashboard/settings/advisor */}
</div>
```

Page root wrapper: `min-h-screen relative flex flex-col isolate bg-[hsl(201,100%,13%)]`.
