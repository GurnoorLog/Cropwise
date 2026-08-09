import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Leaf,
  TrendingUp,
  CloudLightning,
  Calendar,
  Bot,
  Loader2,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { supabase } from "../supabase";
import { getProfile, getFarmCrops, type Profile } from "../lib/profile";
import MobileNav from "../components/MobileNav";
import UserMenu from "../components/UserMenu";

interface BuyerRow {
  id: string;
  name: string;
  location: string | null;
  crop_focus: string | null;
  bid_min: number | null;
  bid_max: number | null;
  currency: string | null;
  status: string | null;
}

interface PriceRow {
  id: string;
  crop: string;
  crop_hi: string | null;
  market: string | null;
  min_price: number;
  max_price: number;
  unit: string | null;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "HW";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatBid(bid: number | null, currency: string | null): string {
  const cur = currency || "$";
  return `${cur}${(bid ?? 0).toFixed(2)}/kg`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [crops, setCrops] = useState<string[]>([]);
  const [prices, setPrices] = useState<PriceRow[]>([]);
  const [buyers, setBuyers] = useState<BuyerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const [p, c, pr, b] = await Promise.all([
        getProfile(user.id),
        getFarmCrops(user.id),
        supabase.from("market_prices").select("*").order("max_price", { ascending: false }),
        supabase.from("buyers").select("*").order("bid_max", { ascending: false }).limit(3),
      ]);
      if (!mounted) return;
      setProfile(p);
      setCrops(c);
      setPrices((pr.data as PriceRow[]) ?? []);
      setBuyers((b.data as BuyerRow[]) ?? []);
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const displayName = user?.user_metadata?.full_name
    ? (user.user_metadata.full_name as string).split(" ")[0]
    : "Farmer";

  const primaryCrop = crops[0] ?? prices[0]?.crop ?? "Tomatoes";
  const best = prices[0];
  const secondBest = prices[1];

  const chartMax = prices.length
    ? Math.max(...prices.map((p) => p.max_price))
    : 1;
  const chartHeights = prices.length
    ? prices.map((p) => Math.max(25, 40 + (p.max_price / chartMax) * 45))
    : [40, 45, 42, 55, 60, 75, 85];

  const avgSpread =
    prices.length > 0
      ? prices.reduce(
          (sum, p) =>
            sum + (p.min_price > 0 ? ((p.max_price - p.min_price) / p.min_price) * 100 : 0),
          0,
        ) / prices.length
      : 12.4;

  const saturation =
    best && best.min_price > 0
      ? Math.max(0, Math.round(((best.max_price - best.min_price) / best.max_price) * 100))
      : 12;

  const actions = [
    {
      icon: CloudLightning,
      iconBg: "bg-amber-50 text-amber-600",
      border: "border-l-amber-400",
      title: "Price Window Opening",
      body: best
        ? `${best.crop} is peaking near ₹${best.max_price}/kg at ${best.market ?? "your nearest mandi"}. Consider timing harvest to this window.`
        : "Market prices are updating. Check back shortly.",
      tag: "High Priority",
      tagClass: "bg-amber-100 text-amber-700",
    },
    {
      icon: TrendingUp,
      iconBg: "bg-green-50 text-green-600",
      border: "border-l-green-400",
      title: "Price Surge Detected",
      body:
        secondBest && secondBest.min_price > 0
          ? `${secondBest.crop} demand is up ${Math.max(
              1,
              Math.round(((secondBest.max_price - secondBest.min_price) / secondBest.min_price) * 100),
            )}% this cycle. The selling window remains favorable.`
          : "Demand signals are stabilizing across tracked crops.",
      tag: "Insight",
      tagClass: "bg-green-100 text-green-700",
    },
    {
      icon: Calendar,
      iconBg: "bg-slate-50 text-slate-600",
      border: "border-l-slate-400",
      title: "Schedule Logistics",
      body: best
        ? `Lock in transport for your ${primaryCrop} window to guarantee current rate locks.`
        : "Plan logistics ahead of the coming harvest window.",
      tag: "Operations",
      tagClass: "bg-slate-100 text-slate-700",
    },
  ];

  const navLink = (active: boolean) =>
    `text-sm font-medium transition-colors ${active ? "text-white" : "text-white/60 hover:text-white"}`;

  return (
    <div className="min-h-screen relative flex flex-col isolate bg-[#171310]">
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
            <div className="hidden md:flex items-center gap-7">
              <Link to="/dashboard" className={navLink(true)}>
                Overview
              </Link>
              <Link to="/weather" className={navLink(false)}>
                Weather
              </Link>
              <Link to="/news" className={navLink(false)}>
                Forecasts
              </Link>
              <Link to="/news" className={navLink(false)}>
                Buyers
              </Link>
              <Link
                to="/app"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-white/90 hover:scale-105 active:scale-95 transition-all"
              >
                <Bot className="w-3.5 h-3.5" />
                Ask AI Agent
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
                <p className="text-[10px] text-white/40 uppercase tracking-tighter">
                  {profile?.farm_name ? profile.farm_name : "Premium Estate"}
                </p>
              </div>
              <UserMenu subtitle={profile?.farm_name ?? undefined} />
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-8 py-10">
        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-white/60" />
          </div>
        ) : (
          <>
            <header className="mb-10 fade-rise stagger-1">
              <h1 className="font-serif text-4xl text-white mb-2">
                {profile?.farm_name ? `${profile.farm_name} Dashboard` : "Estate Dashboard"}
              </h1>
              <p className="text-white/50 font-light">
                Real-time intelligence for your {primaryCrop} cycle
                {profile?.farm_location ? ` in ${profile.farm_location}.` : "."}
              </p>
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
                          {primaryCrop}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-widest">
                      Optimal Health
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Farm Type</p>
                      <p className="text-lg font-medium">{profile?.farm_type ?? "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Location</p>
                      <p className="text-lg font-medium">{profile?.farm_location ?? "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Farm Size</p>
                      <p className="text-lg font-medium text-black">
                        {profile?.farm_size ? `${profile.farm_size} ${profile.farm_size_unit ?? "hectares"}` : "—"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Crops Tracked</p>
                      <p className="text-lg font-bold">{crops.length > 0 ? crops.length : prices.length}</p>
                    </div>
                  </div>
                </div>

                {/* Market Prices */}
                <div className="card-glass p-8 fade-rise stagger-3">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="font-serif text-2xl">
                      Market Prices{" "}
                      <span className="text-slate-300 text-lg font-light">
                        / {prices[0]?.market ?? "Pune"}
                      </span>
                    </h2>
                    <div className="flex items-center gap-2 text-green-600 font-bold">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">+{avgSpread.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="h-48 relative overflow-hidden flex items-end justify-between px-2">
                    <div className="absolute inset-0 chart-gradient rounded-xl" />
                    {chartHeights.map((height, i) => (
                      <div
                        key={i}
                        style={{ height: `${height}%` }}
                        title={prices[i] ? `${prices[i].crop}: ₹${prices[i].max_price}/kg` : undefined}
                        className={`w-8 rounded-t-lg transition-all hover:bg-black ${
                          i === chartHeights.length - 1 || (prices[i] && prices[i].crop === primaryCrop)
                            ? "bg-black"
                            : "bg-slate-100"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex justify-between pt-4 border-t border-slate-100 mt-4 text-[10px] font-bold text-slate-400 uppercase">
                    {prices.length > 0
                      ? prices.map((p) => (
                          <span key={p.id}>{p.crop}</span>
                        ))
                      : (
                          <>
                            <span>Week 1</span>
                            <span>Week 2</span>
                            <span>Week 3</span>
                            <span>Current</span>
                          </>
                        )}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Best Selling Window */}
                <div className="card-glass p-8 !bg-black !text-white fade-rise stagger-2">
                  <div className="flex flex-col h-full">
                    <h2 className="font-serif text-2xl mb-6">Best Selling Window</h2>
                    <div className="mb-8">
                      <div className="text-4xl font-serif mb-1">
                        {best ? `₹${best.max_price}/kg` : "—"}
                      </div>
                      <p className="text-white/40 text-xs uppercase tracking-widest font-bold">
                        {best ? `${best.crop} · ${best.market ?? "Pune"}` : "Peak Liquidity Projection"}
                      </p>
                    </div>
                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/60">Projected Price</span>
                        <span className="font-bold">{best ? `₹${best.max_price}/kg` : "—"}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/60">Market Saturation</span>
                        <span className="font-bold">Low ({saturation}%)</span>
                      </div>
                    </div>
                    <Link
                      to="/news"
                      className="w-full py-4 rounded-xl border border-white/20 text-center text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                    >
                      View Full Forecast
                    </Link>
                  </div>
                </div>

                {/* Active Buyers */}
                <div className="card-glass p-8 fade-rise stagger-4">
                  <h2 className="font-serif text-2xl mb-6">Active Buyers</h2>
                  {buyers.length === 0 ? (
                    <p className="text-sm text-slate-400">No active buyers yet.</p>
                  ) : (
                    <div className="space-y-6">
                      {buyers.map((buyer) => (
                        <div key={buyer.id} className="flex justify-between items-center group cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-xs">
                              {getInitials(buyer.name)}
                            </div>
                            <div>
                              <p className="text-sm font-bold">{buyer.name}</p>
                              <p className="text-[10px] text-slate-400">
                                {buyer.location ?? ""}
                                {buyer.crop_focus ? ` · ${buyer.crop_focus}` : ""}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-600">
                              {formatBid(buyer.bid_max, buyer.currency)}
                            </p>
                            <p
                              className={`text-[9px] ${
                                buyer.status === "Active Bid" ? "text-green-600" : "text-slate-400"
                              } font-bold uppercase tracking-widest`}
                            >
                              {buyer.status ?? "Active Bid"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Link
                    to="/news"
                    className="block w-full mt-8 py-4 rounded-xl bg-slate-50 text-slate-900 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all cursor-pointer text-center"
                  >
                    View All Buyers
                  </Link>
                </div>
              </div>
            </div>

            {/* Recommended Actions */}
            <section className="mt-12 fade-rise stagger-4">
              <h2 className="font-serif text-2xl text-white mb-6">Recommended Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {actions.map((action) => (
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
          </>
        )}

        {/* Mobile bottom nav */}
        <MobileNav />
      </main>
    </div>
  );
}
