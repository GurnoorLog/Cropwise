import { Volume2, RefreshCw } from "lucide-react";

export interface AIResponse {
  weather_summary: string;
  price_estimate: string;
  recommendation: string;
  spoilage_risk: "green" | "yellow" | "red";
  language: "hi" | "en";
}

interface ResponseCardProps {
  data: AIResponse;
  isSpeaking: boolean;
  onReplay: () => void;
  onReset: () => void;
}

function SpoilageBadge({ risk, lang }: { risk: string; lang: "hi" | "en" }) {
  const labels: Record<string, { hi: string; en: string }> = {
    green: { hi: "कम जोखिम", en: "Low Risk" },
    yellow: { hi: "मध्यम जोखिम", en: "Moderate Risk" },
    red: { hi: "उच्च जोखिम", en: "High Risk" },
  };

  const colors: Record<string, string> = {
    green: "bg-success/10 text-success border-success/30",
    yellow: "bg-warning/10 text-warning border-warning/30",
    red: "bg-destructive/10 text-destructive border-destructive/30",
  };

  const label = labels[risk]?.[lang] ?? labels.yellow[lang];

  return (
    <span
      className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${colors[risk]}`}
    >
      {label}
    </span>
  );
}

export default function ResponseCard({
  data,
  isSpeaking,
  onReplay,
  onReset,
}: ResponseCardProps) {
  const lang = data.language || "hi";

  const labels = {
    spoilageTitle: lang === "hi" ? "खराब होने का जोखिम" : "Spoilage Risk",
    weatherTitle: lang === "hi" ? "मौसम" : "Weather",
    priceTitle: lang === "hi" ? "अनुमानित कीमत" : "Price Estimate",
    adviceTitle: lang === "hi" ? "सलाह" : "Recommendation",
    replayLabel: lang === "hi" ? "दोबारा सुनें" : "Replay",
    newQuestion: lang === "hi" ? "नया सवाल पूछें" : "Ask Another Question",
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in-up">
      <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
        {/* Header with spoilage badge */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-foreground/60 uppercase tracking-wide">
            {labels.spoilageTitle}
          </h3>
          <SpoilageBadge risk={data.spoilage_risk} lang={lang} />
        </div>

        {/* Weather Summary */}
        {data.weather_summary && (
          <div className="px-5 py-3 border-b border-border/50">
            <h4 className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1">
              {labels.weatherTitle}
            </h4>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {data.weather_summary}
            </p>
          </div>
        )}

        {/* Price Estimate */}
        {data.price_estimate && (
          <div className="px-5 py-3 border-b border-border/50">
            <h4 className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1">
              {labels.priceTitle}
            </h4>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {data.price_estimate}
            </p>
          </div>
        )}

        {/* Recommendation */}
        <div className="px-5 py-4">
          <h4 className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-2">
            {labels.adviceTitle}
          </h4>
          <p className="text-[15px] text-foreground leading-relaxed whitespace-pre-line">
            {data.recommendation}
          </p>
        </div>

        {/* Actions */}
        <div className="px-5 py-3 bg-muted flex items-center gap-3">
          <button
            onClick={onReplay}
            aria-label={labels.replayLabel}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
              transition-all duration-200 ease-out cursor-pointer
              ${isSpeaking
                ? "bg-primary text-on-primary"
                : "bg-card border border-border text-foreground hover:bg-primary/5"
              }
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring
            `}
          >
            <Volume2 className={`w-4 h-4 ${isSpeaking ? "animate-pulse" : ""}`} />
            {labels.replayLabel}
          </button>
          <button
            onClick={onReset}
            aria-label={labels.newQuestion}
            className="
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
              bg-primary text-on-primary
              transition-all duration-200 ease-out
              hover:bg-secondary active:scale-95
              cursor-pointer
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring
            "
          >
            <RefreshCw className="w-4 h-4" />
            {labels.newQuestion}
          </button>
        </div>
      </div>
    </div>
  );
}
