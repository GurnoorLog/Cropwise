import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

export interface BuyerRow {
  id: string;
  name: string;
  location: string | null;
  crop_focus: string | null;
  bid_min: number | null;
  bid_max: number | null;
  currency: string | null;
  status: string | null;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "HW";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatBid(bid: number | null, currency: string | null): string {
  const cur = currency || "$";
  return `${cur}${(bid ?? 0).toFixed(2)}/kg`;
}

interface BuyersResultProps {
  buyers: BuyerRow[];
  loading?: boolean;
  limit?: number;
  showFooterLink?: boolean;
}

export default function BuyersResult({
  buyers,
  loading = false,
  limit,
  showFooterLink = true,
}: BuyersResultProps) {
  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  const visible = limit ? buyers.slice(0, limit) : buyers;

  return (
    <div className="card-glass p-8 fade-rise stagger-4">
      <h2 className="font-serif text-2xl mb-6">Active Buyers</h2>
      {visible.length === 0 ? (
        <p className="text-sm text-slate-400">No active buyers yet.</p>
      ) : (
        <div className="space-y-6">
          {visible.map((buyer) => (
            <div key={buyer.id} className="flex justify-between items-center group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-xs">
                  {getInitials(buyer.name)}
                </div>
                <div>
                  <p className="text-sm font-bold">{buyer.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {buyer.location ?? ""}
                    {buyer.crop_focus ? ` · ${buyer.crop_focus}` : ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-600">
                  {formatBid(buyer.bid_max, buyer.currency)}
                </p>
                <p
                  className={`text-[9px] ${
                    buyer.status === "Active Bid" ? "text-green-600" : "text-slate-400"
                  } font-bold uppercase tracking-widest`}
                >
                  {buyer.status ?? "Active Bid"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      {showFooterLink && (
        <Link
          to="/news"
          className="block w-full mt-8 py-4 rounded-xl bg-slate-50 text-slate-900 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all cursor-pointer text-center"
        >
          View All Buyers
        </Link>
      )}
    </div>
  );
}
