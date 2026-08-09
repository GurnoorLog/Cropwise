import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Bell, Bot, Loader2 } from "lucide-react";
import { supabase, SUPABASE_URL } from "../supabase";
import MobileNav from "../components/MobileNav";
import UserMenu from "../components/UserMenu";
import NewsResult, { type NewsRow } from "../components/results/NewsResult";

export default function NewsPage() {
  const [news, setNews] = useState<NewsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token ?? "";
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/news-sync`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error(`news-sync ${res.status}`);
        const json = await res.json();
        if (mounted && Array.isArray(json.news)) setNews(json.news as NewsRow[]);
      } catch {
        const { data } = await supabase.from("news").select("*").order("published_at", { ascending: false });
        if (mounted && data) setNews(data as NewsRow[]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const featured = news[0];

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
        <div className="absolute inset-0 video-overlay-news" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 backdrop-blur-lg bg-transparent">
        <div className="max-w-[1400px] mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-12">
            <Link to="/dashboard" className="font-serif text-2xl text-white tracking-tight">
              Harvest Window
            </Link>
            <Link
              to="/weather"
              className="hidden lg:inline-flex text-white/60 hover:text-white text-xs font-medium uppercase tracking-wider transition-colors"
            >
              Weather
            </Link>
            <Link
              to="/news"
              className="hidden lg:inline-flex text-white/60 hover:text-white text-xs font-medium uppercase tracking-wider transition-colors"
            >
              Markets
            </Link>
            <Link
              to="/calendar"
              className="hidden lg:inline-flex text-white/60 hover:text-white text-xs font-medium uppercase tracking-wider transition-colors"
            >
              Calendar
            </Link>
            <Link
              to="/schemes"
              className="hidden lg:inline-flex text-white/60 hover:text-white text-xs font-medium uppercase tracking-wider transition-colors"
            >
              Schemes
            </Link>
            <div className="hidden lg:flex gap-1">
              {(["All", "Markets", "Weather", "Prices", "Insights"] as const).map((f) => (
                <button
                  key={f}
                  className="filter-tab px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider cursor-pointer text-white/60 hover:text-white"
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link
              to="/app"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-white/90 hover:scale-105 active:scale-95 transition-all"
            >
              <Bot className="w-3.5 h-3.5" />
              Ask AI Agent
            </Link>
            <button
              aria-label="Search"
              className="text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              aria-label="Notifications"
              className="text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" />
            </button>
            <UserMenu size="sm" />
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-8 py-10">
        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-white/60" />
          </div>
        ) : (
          <NewsResult rows={news} featured={featured} />
        )}
        {/* Mobile bottom nav */}
        <MobileNav />
      </main>
    </div>
  );
}
