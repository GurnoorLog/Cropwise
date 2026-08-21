import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Leaf,
  TrendingUp,
  CloudLightning,
  Calendar,
  Loader2,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { supabase } from "../supabase";
import { getProfile, getFarmCrops, type Profile } from "../lib/profile";
import MobileNav from "../components/MobileNav";
import AppNav from "../components/AppNav";
import PricesResult, { type PriceRow } from "../components/results/PricesResult";
import BuyersResult, { type BuyerRow } from "../components/results/BuyersResult";

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

  const primaryCrop = crops[0] ?? prices[0]?.crop ?? "crops";
  const best = prices[0];
  const secondBest = prices[1];

  const saturation =
    best && best.min_price > 0
      ? Math.max(0, Math.round(((best.max_price - best.min_price) / best.max_price) * 100))
      : 12;

  const actions = [    {
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
      <AppNav subtitle={profile?.farm_name ?? undefined} />

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
                <PricesResult
                  prices={prices}
                  highlightCrop={primaryCrop}
                />
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
                        {best ? `${best.crop} · ${best.market ?? "nearest mandi"}` : "Peak Liquidity Projection"}
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
                <BuyersResult buyers={buyers} />
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
