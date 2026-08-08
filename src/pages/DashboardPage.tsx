import { Link } from "react-router-dom";
import {
  Bell,
  Leaf,
  TrendingUp,
  CloudLightning,
  Calendar,
  LogOut,
  Sprout,
  KeyRound,
} from "lucide-react";
import { useAuth } from "../lib/auth";

const CHART_BARS = [40, 45, 42, 55, 60, 75, 85];

const BUYERS = [
  { initials: "GR", name: "Green Roots Ltd.", location: "Milan, Italy", bid: "$4.95", status: "Active Bid", statusColor: "text-green-600" },
  { initials: "AM", name: "Aura Markets", location: "Lyon, FR", bid: "$4.75", status: "Interested", statusColor: "text-slate-400" },
  { initials: "SF", name: "Sovereign Foods", location: "Geneva, CH", bid: "$4.90", status: "Watching", statusColor: "text-slate-400" },
];

const ACTIONS = [
  {
    icon: CloudLightning,
    iconBg: "bg-amber-50 text-amber-600",
    border: "border-l-amber-400",
    title: "Weather Alert",
    body: "Heavy precipitation forecast in 48h. Consider advance harvest for lower yields.",
    tag: "High Priority",
    tagClass: "bg-amber-100 text-amber-700",
  },
  {
    icon: TrendingUp,
    iconBg: "bg-green-50 text-green-600",
    border: "border-l-green-400",
    title: "Price Surge Detected",
    body: "French market demand increased by 18%. Optimal selling window remains stable.",
    tag: "Insight",
    tagClass: "bg-green-100 text-green-700",
  },
  {
    icon: Calendar,
    iconBg: "bg-slate-50 text-slate-600",
    border: "border-l-slate-400",
    title: "Schedule Logistics",
    body: "Lock in transport for the April 18 window to guarantee current rate locks.",
    tag: "Operations",
    tagClass: "bg-slate-100 text-slate-700",
  },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "HW";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const fullName = (user?.user_metadata?.full_name as string) ?? user?.email ?? "Farmer";
  const displayName = user?.user_metadata?.full_name
    ? (user.user_metadata.full_name as string).split(" ")[0]
    : "Farmer";
  const initials = getInitials(fullName);

  const navLink = (active: boolean) =>
    `text-sm font-medium transition-colors ${active ? "text-white" : "text-white/60 hover:text-white"}`;

  return (
    <div className="min-h-screen relative flex flex-col isolate bg-[hsl(201,100%,13%)]">
      {/* Background Video Layer */}
      <div className="fixed inset-0 w-full h-full -z-20 overflow-hidden">
        <video autoPlay muted loop playsInline className="w-full h-full object-cover">
          <source
            src="https://designerstephen.github.io/public-assets/videos/serene-art-hero.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 video-overlay-dashboard" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 backdrop-blur-md bg-transparent">
        <div className="max-w-[1400px] mx-auto px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="font-serif text-2xl text-white tracking-tight">
              Harvest Window
            </Link>
            <div className="hidden md:flex gap-6">
              <Link to="/dashboard" className={navLink(true)}>
                Dashboard
              </Link>
              <Link to="/app" className={navLink(false)}>
                Advisor
              </Link>
              <Link to="/settings" className={navLink(false)}>
                API Keys
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              aria-label="Notifications"
              className="text-white/60 hover:text-white transition-colors cursor-pointer"
            >
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
              <button
                onClick={signOut}
                aria-label="Sign out"
                className="text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-8 py-10">
        <header className="mb-10 fade-rise stagger-1">
          <h1 className="font-serif text-4xl text-white mb-2">Estate Dashboard</h1>
          <p className="text-white/50 font-light">Real-time intelligence for your current harvest cycle.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Crop Status */}
            <div className="card-glass p-8 fade-rise stagger-1">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                    <Leaf className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl">Your Crop Status</h2>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                      Organic San Marzano Tomatoes
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-widest">
                  Optimal Health
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Variety</p>
                  <p className="text-lg font-medium">Heirloom Premium</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Planted</p>
                  <p className="text-lg font-medium">Mar 12, 2024</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Days to Harvest</p>
                  <p className="text-lg font-medium text-black">14 Days</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Ripeness</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold">82%</p>
                    <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 w-[82%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Prices */}
            <div className="card-glass p-8 fade-rise stagger-3">
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-serif text-2xl">
                  Market Prices <span className="text-slate-300 text-lg font-light">/ 30 Days</span>
                </h2>
                <div className="flex items-center gap-2 text-green-600 font-bold">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">+12.4%</span>
                </div>
              </div>

              <div className="h-48 relative overflow-hidden flex items-end justify-between px-2">
                <div className="absolute inset-0 chart-gradient rounded-xl" />
                {CHART_BARS.map((height, i) => (
                  <div
                    key={i}
                    style={{ height: `${height}%` }}
                    className={`w-8 rounded-t-lg transition-all hover:bg-black ${
                      i === CHART_BARS.length - 1 ? "bg-black" : "bg-slate-100"
                    }`}
                  />
                ))}
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100 mt-4 text-[10px] font-bold text-slate-400 uppercase">
                <span>Week 1</span>
                <span>Week 2</span>
                <span>Week 3</span>
                <span>Current</span>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Best Selling Window */}
            <div className="card-glass p-8 bg-black !text-white fade-rise stagger-2">
              <div className="flex flex-col h-full">
                <h2 className="font-serif text-2xl mb-6">Best Selling Window</h2>
                <div className="mb-8">
                  <div className="text-4xl font-serif mb-1">April 18 — 22</div>
                  <p className="text-white/40 text-xs uppercase tracking-widest font-bold">
                    Peak Liquidity Projection
                  </p>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/60">Projected Price</span>
                    <span className="font-bold">$4.82/kg</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/60">Market Saturation</span>
                    <span className="font-bold">Low (12%)</span>
                  </div>
                </div>
                <Link
                  to="/app"
                  className="w-full py-4 rounded-xl border border-white/20 text-center text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                >
                  View Full Forecast
                </Link>
              </div>
            </div>

            {/* Active Buyers */}
            <div className="card-glass p-8 fade-rise stagger-4">
              <h2 className="font-serif text-2xl mb-6">Active Buyers</h2>
              <div className="space-y-6">
                {BUYERS.map((buyer) => (
                  <div key={buyer.name} className="flex justify-between items-center group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-xs">
                        {buyer.initials}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{buyer.name}</p>
                        <p className="text-[10px] text-slate-400">{buyer.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{buyer.bid}</p>
                      <p className={`text-[9px] ${buyer.statusColor} font-bold uppercase tracking-widest`}>
                        {buyer.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 py-4 rounded-xl bg-slate-50 text-slate-900 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all cursor-pointer">
                View All Buyers
              </button>
            </div>
          </div>
        </div>

        {/* Recommended Actions */}
        <section className="mt-12 fade-rise stagger-4">
          <h2 className="font-serif text-2xl text-white mb-6">Recommended Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ACTIONS.map((action) => (
              <div key={action.title} className={`card-glass p-6 border-l-4 ${action.border}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.iconBg}`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-1">{action.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{action.body}</p>
                    <span
                      className={`inline-block mt-3 px-2 py-0.5 text-[9px] font-bold rounded uppercase ${action.tagClass}`}
                    >
                      {action.tag}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Mobile nav fallback */}
        <div className="mt-10 flex md:hidden items-center gap-4 text-white/60">
          <Sprout className="w-4 h-4" />
          <Link to="/app" className="text-sm hover:text-white transition-colors">
            Advisor
          </Link>
          <KeyRound className="w-4 h-4" />
          <Link to="/settings" className="text-sm hover:text-white transition-colors">
            API Keys
          </Link>
        </div>
      </main>
    </div>
  );
}
