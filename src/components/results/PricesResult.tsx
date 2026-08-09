import { TrendingUp, Loader2 } from "lucide-react";

export interface PriceRow {
  id: string;
  crop: string;
  crop_hi: string | null;
  market: string | null;
  min_price: number;
  max_price: number;
  unit: string | null;
}

interface PricesResultProps {
  prices: PriceRow[];
  loading?: boolean;
  highlightCrop?: string;
}

export default function PricesResult({
  prices,
  loading = false,
  highlightCrop,
}: PricesResultProps) {
  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  const chartMax = prices.length
    ? Math.max(...prices.map((p) => p.max_price))
    : 1;
  const chartHeights = prices.length
    ? prices.map((p) => Math.max(25, 40 + (p.max_price / chartMax) * 45))
    : [40, 45, 42, 55, 60, 75, 85];

  const avgSpread =
    prices.length > 0
      ? prices.reduce(
          (sum, p) =>
            sum + (p.min_price > 0 ? ((p.max_price - p.min_price) / p.min_price) * 100 : 0),
          0,
        ) / prices.length
      : 12.4;

  return (
    <div className="card-glass p-8 fade-rise stagger-3">
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-serif text-2xl">
          Market Prices{" "}
          <span className="text-slate-300 text-lg font-light">
            / {prices[0]?.market ?? "Pune"}
          </span>
        </h2>
        <div className="flex items-center gap-2 text-green-600 font-bold">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm">+{avgSpread.toFixed(1)}%</span>
        </div>
      </div>

      <div className="h-48 relative overflow-hidden flex items-end justify-between px-2">
        <div className="absolute inset-0 chart-gradient rounded-xl" />
        {chartHeights.map((height, i) => (
          <div
            key={i}
            style={{ height: `${height}%` }}
            title={prices[i] ? `${prices[i].crop}: ₹${prices[i].max_price}/kg` : undefined}
            className={`w-8 rounded-t-lg transition-all hover:bg-black ${
              i === chartHeights.length - 1 ||
              (prices[i] && highlightCrop && prices[i].crop === highlightCrop)
                ? "bg-black"
                : "bg-slate-100"
            }`}
          />
        ))}
      </div>

      <div className="flex justify-between pt-4 border-t border-slate-100 mt-4 text-[10px] font-bold text-slate-400 uppercase">
        {prices.length > 0 ? (
          prices.map((p) => <span key={p.id}>{p.crop}</span>)
        ) : (
          <>
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Current</span>
          </>
        )}
      </div>
    </div>
  );
}
