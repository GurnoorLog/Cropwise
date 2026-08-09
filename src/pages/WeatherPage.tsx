import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ChevronDown, RefreshCw } from "lucide-react";
import { useAuth } from "../lib/auth";
import { fetchFarmWeather, type FarmWeather } from "../lib/weather";
import WeatherResult from "../components/results/WeatherResult";
import MobileNav from "../components/MobileNav";
import UserMenu from "../components/UserMenu";

export default function WeatherPage() {
  const { user } = useAuth();
  const [farm, setFarm] = useState<FarmWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!user) return;
      if (isRefresh) setRefreshing(true);
      const result = await fetchFarmWeather(user.id);
      if (result) setFarm(result);
      setLoading(false);
      setRefreshing(false);
    },
    [user],
  );

  useEffect(() => {
    load();
  }, [load]);

  const lang = user?.user_metadata?.language === "hi" ? "hi" : "en";

  return (
    <div className="min-h-screen relative flex flex-col isolate bg-[#0f172a]">
      {/* Background Video Layer */}
      <div className="fixed inset-0 w-full h-full -z-20 overflow-hidden">
        <video autoPlay muted loop playsInline className="w-full h-full object-cover">
          <source
            src="https://designerstephen.github.io/public-assets/videos/serene-art-hero.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 video-overlay-weather -z-10" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 backdrop-blur-md bg-transparent">
        <div className="max-w-[1400px] mx-auto px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-10">
            <Link to="/dashboard" className="font-serif text-2xl text-white tracking-tight">
              Harvest Window
            </Link>
            <div className="hidden md:flex gap-8 items-center text-white/60">
              <Link
                to="/dashboard"
                className="text-xs font-bold uppercase tracking-widest hover:text-white transition-all"
              >
                Overview
              </Link>
              <Link
                to="/weather"
                className="text-xs font-bold uppercase tracking-widest text-white"
              >
                Weather
              </Link>
              <Link
                to="/news"
                className="text-xs font-bold uppercase tracking-widest hover:text-white transition-all"
              >
                Markets
              </Link>
              <Link
                to="/calendar"
                className="text-xs font-bold uppercase tracking-widest hover:text-white transition-all"
              >
                Calendar
              </Link>
              <Link
                to="/schemes"
                className="text-xs font-bold uppercase tracking-widest hover:text-white transition-all"
              >
                Schemes
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div
              className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full cursor-pointer hover:bg-white/10 transition-all"
              title="Farm location"
            >
              <MapPin className="w-4 h-4 text-white/60" />
              <span className="text-white text-xs font-bold">
                {farm?.locationLabel ?? "Locating…"}
              </span>
              <ChevronDown className="w-4 h-4 text-white/40" />
            </div>
            <button
              aria-label="Refresh weather"
              onClick={() => load(true)}
              className="p-2 rounded-full text-white/60 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <UserMenu size="sm" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-8 py-10">
        <WeatherResult farm={farm} loading={loading} lang={lang} onRetry={() => load()} />
        {/* Mobile bottom nav */}
        <MobileNav />
      </main>

      {/* Footer */}
      <footer className="z-10 p-12 text-center border-t border-white/5">
        <p className="text-white/20 text-[10px] tracking-[0.4em] uppercase font-bold">
          © {new Date().getFullYear()} HARVEST WINDOW INTELLIGENCE
        </p>
      </footer>
    </div>
  );
}
