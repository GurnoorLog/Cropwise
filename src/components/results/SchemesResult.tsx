import { Link } from "react-router-dom";
import {
  Loader2,
  ExternalLink,
  HandCoins,
  BadgeIndianRupee,
  Shield,
  Droplet,
  Network,
  CreditCard,
  Coins,
  CircleCheck,
} from "lucide-react";
import type { MspRateRow, SchemeRow } from "../../lib/schemes";
import type { SpeechLanguageCode } from "../../lib/languages";

const ICONS: Record<string, typeof HandCoins> = {
  hand: HandCoins,
  credit: CreditCard,
  shield: Shield,
  network: Network,
  droplet: Droplet,
  coins: Coins,
  badge: BadgeIndianRupee,
};

interface SchemesResultProps {
  schemes: SchemeRow[];
  msp: MspRateRow[];
  loading?: boolean;
  lang?: SpeechLanguageCode;
  userCrops?: string[];
}

export default function SchemesResult({
  schemes,
  msp,
  loading = false,
  lang = "en",
  userCrops = [],
}: SchemesResultProps) {
  const t = lang === "hi";

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  const priorityMsp = userCrops.length
    ? msp.filter((m) => userCrops.some((c) => c.toLowerCase() === m.crop.toLowerCase()))
    : [];
  const mspList = priorityMsp.length > 0 ? priorityMsp : msp;
  const year = msp[0]?.year ?? 2025;

  return (
    <div className="space-y-8">
      {/* MSP card */}
      <div className="card-glass p-8 fade-rise stagger-1">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="font-serif text-2xl">{t ? "न्यूनतम समर्थन मूल्य" : "Minimum Support Price"}</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              {t ? "सत्र" : "Season"} · {year}
            </p>
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
            <BadgeIndianRupee className="w-6 h-6" />
          </div>
        </div>

        {mspList.length === 0 ? (
          <p className="text-sm text-slate-400">
            {t ? "अभी कोई MSP डेटा उपलब्ध नहीं है।" : "No MSP data available yet."}
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mspList.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl bg-slate-50 p-4 flex flex-col justify-between min-h-[110px] hover:bg-black hover:text-white transition-all group"
              >
                <div>
                  <p className="text-sm font-bold">{m.crop}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 group-hover:text-white/50">
                    {m.crop_hi ?? m.crop} · {m.unit ?? "₹/quintal"}
                  </p>
                </div>
                <p className="text-xl font-serif mt-3">
                  ₹{Number(m.price_per_quintal).toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schemes grid */}
      <div className="fade-rise stagger-2 pb-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif text-2xl">{t ? "सरकारी योजनाएं" : "Government Schemes"}</h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {t ? "सीधे आवेदन करें" : "Direct apply"}
          </span>
        </div>

        {schemes.length === 0 ? (
          <p className="text-sm text-slate-400">
            {t
              ? "अभी कोई योजना उपलब्ध नहीं है। कुछ देर बाद फिर देखें।"
              : "No schemes available yet. Please check back soon."}
          </p>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemes.map((s) => {
            const Icon = ICONS[s.icon ?? ""] ?? HandCoins;
            return (
              <div
                key={s.id}
                className="news-card p-6 fade-rise flex flex-col hover:-translate-y-1 transition-transform"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                    <Icon className="w-6 h-6" />
                  </div>
                  {s.category && (
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[9px] font-bold rounded-full uppercase tracking-widest">
                      {s.category}
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-lg leading-snug mb-1">
                  {t ? (s.name_hi ?? s.name) : s.name}
                </h3>
                {s.ministry && (
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">
                    {s.ministry}
                  </p>
                )}

                <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1">
                  {t ? (s.summary_hi ?? s.summary) : s.summary}
                </p>

                {s.eligibility && (
                  <div className="flex items-start gap-2 mb-5">
                    <CircleCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {t ? (s.eligibility_hi ?? s.eligibility) : s.eligibility}
                    </p>
                  </div>
                )}

                {s.apply_url ? (
                  <a
                    href={s.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all"
                  >
                    {t ? "आवेदन करें / अधिक जानें" : "Apply / Learn more"}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <Link
                    to="/app"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-50 text-slate-700 text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                  >
                    {t ? "सहायता के लिए पूछें" : "Ask the agent"}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}
