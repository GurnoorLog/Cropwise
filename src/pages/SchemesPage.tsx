import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, BadgeIndianRupee } from "lucide-react";
import { useAuth } from "../lib/auth";
import { getFarmCrops } from "../lib/profile";
import {
  fetchMspRates,
  fetchSchemes,
  type MspRateRow,
  type SchemeRow,
} from "../lib/schemes";
import SchemesResult from "../components/results/SchemesResult";
import MobileNav from "../components/MobileNav";
import UserMenu from "../components/UserMenu";
import ModeToggle from "../components/ModeToggle";

const NAV = [
  { to: "/dashboard", label: "Overview" },
  { to: "/weather", label: "Weather" },
  { to: "/news", label: "Markets" },
  { to: "/calendar", label: "Calendar" },
  { to: "/schemes", label: "Schemes", active: true },
];

export default function SchemesPage() {
  const { user } = useAuth();
  const [schemes, setSchemes] = useState<SchemeRow[]>([]);
  const [msp, setMsp] = useState<MspRateRow[]>([]);
  const [crops, setCrops] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const [s, m, c] = await Promise.all([
        fetchSchemes(),
        fetchMspRates(),
        getFarmCrops(user.id),
      ]);
      if (!mounted) return;
      setSchemes(s);
      setMsp(m);
      setCrops(c);
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
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 backdrop-blur-md bg-transparent">
        <div className="max-w-[1400px] mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="font-serif text-2xl text-white tracking-tight">
              Harvest Window
            </Link>
            <ModeToggle compact />
            <div className="hidden lg:flex items-center gap-7">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`text-xs font-bold uppercase tracking-widest transition-all ${
                    n.active ? "text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
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

      {/* Main */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-8 py-10">
        <header className="mb-10 fade-rise stagger-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
              <BadgeIndianRupee className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-4xl text-white mb-1">MSP & Schemes</h1>
              <p className="text-white/50 font-light">
                Minimum support prices and government schemes you can apply for directly.
              </p>
            </div>
          </div>
        </header>

        <SchemesResult
          schemes={schemes}
          msp={msp}
          loading={loading}
          lang={lang}
          userCrops={crops}
        />
        <MobileNav />
      </main>
    </div>
  );
}
