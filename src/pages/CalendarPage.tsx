import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useAuth } from "../lib/auth";
import { getFarmCrops } from "../lib/profile";
import { fetchCropCalendar, type CropCalendarRow } from "../lib/schemes";
import { fetchFarmWeather, type FarmWeather } from "../lib/weather";
import CalendarResult from "../components/results/CalendarResult";
import MobileNav from "../components/MobileNav";
import AppNav from "../components/AppNav";

export default function CalendarPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<CropCalendarRow[]>([]);
  const [crops, setCrops] = useState<string[]>([]);
  const [farm, setFarm] = useState<FarmWeather | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const [r, c, f] = await Promise.all([
        fetchCropCalendar(),
        getFarmCrops(user.id),
        fetchFarmWeather(user.id),
      ]);
      if (!mounted) return;
      setRows(r);
      setCrops(c);
      setFarm(f);
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const lang = user?.user_metadata?.language === "hi" ? "hi" : "en";

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
      <AppNav />

      {/* Main */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-8 py-10">
        <header className="mb-10 fade-rise stagger-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-4xl text-white mb-1">Crop Calendar</h1>
              <p className="text-white/50 font-light">
                Sowing, growing & harvest windows with live weather alerts.
              </p>
            </div>
          </div>
        </header>

        <CalendarResult
          rows={rows}
          loading={loading}
          lang={lang}
          farm={farm}
          userCrops={crops}
        />
        <MobileNav />
      </main>
    </div>
  );
}
