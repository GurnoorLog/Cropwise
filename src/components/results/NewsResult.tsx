import { useMemo, useState } from "react";
import { ChevronRight, CloudRain, TrendingUp, Loader2 } from "lucide-react";

export interface NewsRow {
  id: string;
  title: string;
  summary: string | null;
  source: string | null;
  url: string | null;
  category: string | null;
  published_at: string | null;
}

const CATEGORY_CLASS: Record<string, string> = {
  Markets: "bg-teal-50 text-teal-600",
  Weather: "bg-amber-50 text-amber-600",
  Prices: "bg-green-50 text-green-600",
  Insights: "bg-slate-100 text-slate-600",
  "Buyer Activity": "bg-blue-50 text-blue-600",
};

const DEFAULT_CATEGORY = "Markets" as const;
type Category = "Markets" | "Weather" | "Prices" | "Insights" | "Buyer Activity";

const FILTERS = ["All", "Markets", "Weather", "Prices", "Insights"] as const;
type Filter = (typeof FILTERS)[number];

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function storyVariant(category: string): "impact" | "weather" | "price" | "insight" | "buyers" {
  switch (category) {
    case "Weather":
      return "weather";
    case "Prices":
      return "price";
    case "Insights":
      return "insight";
    case "Buyer Activity":
      return "buyers";
    default:
      return "impact";
  }
}

function StoryCard({ story }: { story: NewsRow }) {
  const category = (story.category ?? DEFAULT_CATEGORY) as Category;
  const variant = storyVariant(category);
  const categoryClass = CATEGORY_CLASS[category] ?? CATEGORY_CLASS[DEFAULT_CATEGORY];
  const isWeather = variant === "weather";

  const body = (
    <div
      className={`news-card p-6 fade-rise stagger-2 ${
        isWeather ? "border-l-4 border-l-amber-400" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-6">
        <span
          className={`px-3 py-1 ${categoryClass} text-[10px] font-bold rounded-full uppercase tracking-widest`}
        >
          {category}
        </span>
        <span className="text-[10px] text-slate-400 font-bold uppercase">
          {timeAgo(story.published_at)}
        </span>
      </div>

      {isWeather ? (
        <>
          <div className="flex items-center gap-3 mb-3">
            <CloudRain className="w-6 h-6 text-amber-600" />
            <h2 className="font-serif text-xl leading-snug">{story.title}</h2>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-4">{story.summary}</p>
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="text-[10px] text-slate-400 font-bold uppercase">
              {story.source ?? "Harvest Window Wire"}
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>
        </>
      ) : variant === "price" ? (
        <>
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">{story.source ?? "Market Desk"}</p>
          <h2 className="font-serif text-xl leading-snug mb-3">{story.title}</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-4">{story.summary}</p>
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-bold">Market Moving</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>
        </>
      ) : variant === "insight" ? (
        <>
          <h2 className="font-serif text-xl leading-snug mb-3">{story.title}</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-4">{story.summary}</p>
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase">
            <span>{story.source ?? "Harvest Window Wire"}</span>
            <span>•</span>
            <span>Analysis</span>
          </div>
        </>
      ) : variant === "buyers" ? (
        <>
          <h2 className="font-serif text-xl leading-snug mb-3">{story.title}</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-4">{story.summary}</p>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-200 border border-white" />
            <div className="w-6 h-6 rounded-full bg-slate-300 border border-white -ml-2" />
            <div className="w-6 h-6 rounded-full bg-slate-400 border border-white -ml-2" />
            <span className="text-[10px] text-slate-400 font-bold ml-1">
              {story.source ?? "Buyer Desk"}
            </span>
          </div>
        </>
      ) : (
        <>
          <h2 className="font-serif text-xl leading-snug mb-3">{story.title}</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-4">{story.summary}</p>
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-bold">{story.source ?? "High Impact"}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>
        </>
      )}
    </div>
  );

  return story.url ? (
    <a href={story.url} target="_blank" rel="noopener noreferrer" className="block">
      {body}
    </a>
  ) : (
    body
  );
}

interface NewsResultProps {
  rows: NewsRow[];
  loading?: boolean;
  featured?: NewsRow | null;
}

export default function NewsResult({ rows, loading = false, featured }: NewsResultProps) {
  const [filter, setFilter] = useState<Filter>("All");
  const [storyCount, setStoryCount] = useState(6);

  const visibleStories = useMemo(() => {
    return rows
      .filter((s) => {
        if (filter === "All") return true;
        if (filter === "Markets")
          return s.category === "Markets" || s.category === "Buyer Activity";
        return s.category === filter;
      })
      .slice(0, storyCount);
  }, [rows, filter, storyCount]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  const top = featured ?? rows[0];

  return (
    <>
      {/* Featured Story */}
      {top && (
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
                {top.category ?? "Featured Story"}
              </span>
              <h1 className="font-serif text-4xl md:text-5xl text-white leading-none mb-6">
                {top.title}
              </h1>
              {top.summary && (
                <p className="text-white/70 font-light text-lg mb-8 line-clamp-2">
                  {top.summary}
                </p>
              )}
              {top.url ? (
                <a
                  href={top.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full text-sm font-bold uppercase tracking-widest transition-transform hover:scale-105"
                >
                  Read Full Story <ChevronRight className="w-4 h-4" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full text-sm font-bold uppercase tracking-widest">
                  Read Full Story <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Filter pills */}
      <div className="hidden lg:flex gap-1 mb-8">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`filter-tab px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider cursor-pointer ${
              filter === f ? "active" : "text-white/60 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Story Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleStories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>

      {/* Load More */}
      <div className="mt-16 text-center pb-20">
        {storyCount < rows.length ? (
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
    </>
  );
}
