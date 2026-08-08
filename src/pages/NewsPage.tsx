import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Bell,
  ArrowRight,
  TrendingUp,
  ChevronRight,
  CloudRain,
} from "lucide-react";
import { useAuth } from "../lib/auth";

type Category = "Markets" | "Weather" | "Prices" | "Insights" | "Buyer Activity";

const FILTERS = ["All", "Markets", "Weather", "Prices", "Insights"] as const;
type Filter = (typeof FILTERS)[number];

interface NewsStory {
  id: string;
  category: Category;
  categoryClass: string;
  time: string;
  variant: "impact" | "weather" | "price" | "insight" | "buyers" | "logistics";
}

const STORIES: NewsStory[] = [
  {
    id: "milan-vine",
    category: "Markets",
    categoryClass: "bg-teal-50 text-teal-600",
    time: "2h ago",
    variant: "impact",
  },
  {
    id: "late-frost",
    category: "Weather",
    categoryClass: "bg-amber-50 text-amber-600",
    time: "4h ago",
    variant: "weather",
  },
  {
    id: "price-analysis",
    category: "Prices",
    categoryClass: "bg-green-50 text-green-600",
    time: "6h ago",
    variant: "price",
  },
  {
    id: "soil-health",
    category: "Insights",
    categoryClass: "bg-slate-100 text-slate-600",
    time: "1d ago",
    variant: "insight",
  },
  {
    id: "retail-partners",
    category: "Buyer Activity",
    categoryClass: "bg-blue-50 text-blue-600",
    time: "1d ago",
    variant: "buyers",
  },
  {
    id: "lyon-strike",
    category: "Markets",
    categoryClass: "bg-teal-50 text-teal-600",
    time: "2d ago",
    variant: "logistics",
  },
];

const MORE_STORIES: NewsStory[] = [
  {
    id: "q3-window",
    category: "Insights",
    categoryClass: "bg-slate-100 text-slate-600",
    time: "3d ago",
    variant: "insight",
  },
  {
    id: "france-demand",
    category: "Prices",
    categoryClass: "bg-green-50 text-green-600",
    time: "4d ago",
    variant: "price",
  },
  {
    id: "pune-monsoon",
    category: "Weather",
    categoryClass: "bg-amber-50 text-amber-600",
    time: "5d ago",
    variant: "weather",
  },
];

function categoryFilter(story: NewsStory, filter: Filter): boolean {
  if (filter === "All") return true;
  if (filter === "Markets") return story.category === "Markets" || story.category === "Buyer Activity";
  return story.category === filter;
}

function StoryCard({ story }: { story: NewsStory }) {
  return (
    <div
      className={`news-card p-6 fade-rise stagger-2 ${
        story.variant === "weather" ? "border-l-4 border-l-amber-400" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-6">
        <span
          className={`px-3 py-1 ${story.categoryClass} text-[10px] font-bold rounded-full uppercase tracking-widest`}
        >
          {story.category}
        </span>
        <span className="text-[10px] text-slate-400 font-bold uppercase">{story.time}</span>
      </div>

      {story.variant === "impact" && (
        <>
          <h2 className="font-serif text-2xl mb-3">
            Milan Exchange Reports Shortage in Vine Varieties
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Secondary markets in Northern Italy are seeing a significant volume drop, leading to
            immediate price corrections for early-season picks.
          </p>
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-bold">High Impact</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>
        </>
      )}

      {story.variant === "weather" && (
        <>
          <div className="flex items-center gap-3 mb-3">
            <CloudRain className="w-6 h-6 text-amber-600" />
            <h2 className="font-serif text-2xl">Late Frost Warning: Central Plains</h2>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Temperatures expected to dip below 2°C between 02:00 and 05:00. Protective measures
            highly recommended for exposed crop cycles.
          </p>
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="text-[10px] text-slate-400 font-bold uppercase">
              Affected: 12 Regions
            </div>
            <span className="text-xs font-bold text-amber-600">Severe</span>
          </div>
        </>
      )}

      {story.variant === "price" && (
        <>
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                San Marzano Heirloom
              </p>
              <p className="text-3xl font-serif">
                $4.82<span className="text-sm text-slate-400">/kg</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-green-600 font-bold text-sm">+4.2%</p>
              <div className="flex gap-0.5 mt-1">
                <div className="w-1 h-3 bg-slate-200 rounded-full" />
                <div className="w-1 h-4 bg-slate-200 rounded-full" />
                <div className="w-1 h-2 bg-slate-200 rounded-full" />
                <div className="w-1 h-5 bg-green-500 rounded-full" />
                <div className="w-1 h-6 bg-green-500 rounded-full" />
              </div>
            </div>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">
            Consolidation at $4.70 support level has broken. New resistance forming near $5.00.
          </p>
        </>
      )}

      {story.variant === "insight" && (
        <>
          <h2 className="font-serif text-2xl mb-3">Soil Health & Yield Longevity Patterns</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            New data confirms that nitrogen-fixing cover crops correlate with an 8% increase in
            market-ready fruit weight in year three.
          </p>
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase">
            <span>Dr. Elena V.</span>
            <span>•</span>
            <span>5 min read</span>
          </div>
        </>
      )}

      {story.variant === "buyers" && (
        <>
          <h2 className="font-serif text-2xl mb-3">Premium Retail Group Seeks Heirloom Partners</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Three major European high-end retailers have opened direct sourcing tenders for 2024-25
            winter cycles.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-200 border border-white" />
            <div className="w-6 h-6 rounded-full bg-slate-300 border border-white -ml-2" />
            <div className="w-6 h-6 rounded-full bg-slate-400 border border-white -ml-2" />
            <span className="text-[10px] text-slate-400 font-bold ml-1">+5 Active Buyers</span>
          </div>
        </>
      )}

      {story.variant === "logistics" && (
        <>
          <h2 className="font-serif text-2xl mb-3">Global Logistics Strike: Port of Lyon Affected</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Export windows may be delayed by 72-96 hours. Perishable shipments are being rerouted
            to rail hubs immediately.
          </p>
          <div className="mt-4 flex gap-2">
            <span className="px-2 py-1 bg-red-50 text-red-600 text-[9px] font-bold rounded uppercase">
              Critical Path
            </span>
            <span className="px-2 py-1 bg-slate-50 text-slate-500 text-[9px] font-bold rounded uppercase">
              Logistics
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "HW";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function NewsPage() {
  const [filter, setFilter] = useState<Filter>("All");
  const [storyCount, setStoryCount] = useState(STORIES.length);
  const { user } = useAuth();

  const fullName = (user?.user_metadata?.full_name as string) ?? user?.email ?? "Farmer";
  const initials = getInitials(fullName);

  const visibleStories = useMemo(() => {
    const all = [...STORIES, ...MORE_STORIES];
    return all.filter((s) => categoryFilter(s, filter)).slice(0, storyCount);
  }, [filter, storyCount]);

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
        <div className="absolute inset-0 video-overlay-news" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 backdrop-blur-lg bg-transparent">
        <div className="max-w-[1400px] mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-12">
            <Link to="/dashboard" className="font-serif text-2xl text-white tracking-tight">
              Harvest Window
            </Link>
            <div className="hidden lg:flex gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`filter-tab px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider cursor-pointer ${
                    filter === f
                      ? "active"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
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
            <Link
              to="/settings"
              className="w-8 h-8 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-[10px] text-white font-bold hover:border-white/40 transition-colors"
            >
              {initials}
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-8 py-10">
        {/* Featured Story */}
        <section className="fade-rise stagger-1 mb-10">
          <div className="relative w-full h-[400px] rounded-[32px] overflow-hidden group border border-white/10">
            <img
              src="https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?auto=format&fit=crop&q=80&w=1600"
              className="absolute inset-0 w-full h-full object-cover grayscale transition-transform duration-700 group-hover:scale-105"
              alt="Featured Story"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent" />
            <div className="absolute bottom-0 left-0 p-12 w-full md:w-2/3">
              <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold rounded-full uppercase tracking-widest mb-4">
                Featured Story
              </span>
              <h1 className="font-serif text-4xl md:text-5xl text-white leading-none mb-6">
                Global Demand for Premium Organics Reaches Historic Highs
              </h1>
              <p className="text-white/70 font-light text-lg mb-8 line-clamp-2">
                A comprehensive analysis of European and North American markets indicates a 22%
                surge in demand for sustainably grown heirloom varieties, creating a prime selling
                window for Q3 harvests.
              </p>
              <Link
                to="/app"
                className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full text-sm font-bold uppercase tracking-widest transition-transform hover:scale-105"
              >
                Read Full Story <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Story Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>

        {/* Load More */}
        <div className="mt-16 text-center pb-20">
          {storyCount < STORIES.length + MORE_STORIES.length ? (
            <button
              onClick={() => setStoryCount((c) => c + 3)}
              className="px-10 py-4 bg-white/5 border border-white/10 text-white/60 text-xs font-bold uppercase tracking-[0.2em] rounded-full hover:bg-white hover:text-black transition-all cursor-pointer"
            >
              Load More Stories
            </button>
          ) : (
            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em]">
              You're all caught up
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
