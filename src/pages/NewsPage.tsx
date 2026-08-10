import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase, SUPABASE_URL } from "../supabase";
import MobileNav from "../components/MobileNav";
import AppNav from "../components/AppNav";
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
      <AppNav />

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
