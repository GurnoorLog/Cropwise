import { SUPABASE_URL } from "../supabase";

export interface CropPrice {
  crop: string;
  nameHi: string;
  minPrice: number;
  maxPrice: number;
  unit: string;
}

export const CROP_PRICES: CropPrice[] = [
  { crop: "Tomatoes", nameHi: "टमाटर", minPrice: 15, maxPrice: 30, unit: "₹/kg" },
  { crop: "Onions", nameHi: "प्याज", minPrice: 20, maxPrice: 40, unit: "₹/kg" },
  { crop: "Potatoes", nameHi: "आलू", minPrice: 12, maxPrice: 25, unit: "₹/kg" },
  { crop: "Chilies", nameHi: "मिर्च", minPrice: 30, maxPrice: 60, unit: "₹/kg" },
  { crop: "Brinjal", nameHi: "बैंगन", minPrice: 18, maxPrice: 35, unit: "₹/kg" },
];

/**
 * Get price ranges adjusted for seasonal factors.
 * Monsoon (Jun-Sep): +10%
 * Peak harvest (Feb-Mar): -5%
 */
export function getAdjustedPrices(): CropPrice[] {
  const month = new Date().getMonth(); // 0 = Jan
  let multiplier = 1.0;

  if (month >= 5 && month <= 8) {
    // Monsoon: Jun-Sep
    multiplier = 1.1;
  } else if (month >= 1 && month <= 2) {
    // Peak harvest: Feb-Mar
    multiplier = 0.95;
  }

  return CROP_PRICES.map((c) => ({
    ...c,
    minPrice: Math.round(c.minPrice * multiplier),
    maxPrice: Math.round(c.maxPrice * multiplier),
  }));
}

/** Format prices as a human-readable string */
export function formatPrices(prices: CropPrice[]): string {
  return prices
    .map((p) => `${p.crop} (${p.nameHi}): ${p.minPrice}-${p.maxPrice}${p.unit}`)
    .join("; ");
}

interface MarketPriceRow {
  crop: string;
  crop_hi: string | null;
  market: string | null;
  min_price: number;
  max_price: number;
  unit: string | null;
}

export interface MarketPricesResult {
  prices: CropPrice[];
  /** True when prices came from a live sync; false when they are seasonal estimates. */
  isLive: boolean;
}

/**
 * Fetch live prices from the `prices-sync` edge function (Agmarknet if a
 * server key is configured, otherwise the baseline table). Falls back to
 * seasonal local data if the network request fails.
 */
export async function fetchMarketPrices(): Promise<MarketPricesResult> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/prices-sync`);
    if (!res.ok) throw new Error(`prices-sync ${res.status}`);
    const json = await res.json();
    const rows = (json?.prices ?? []) as MarketPriceRow[];
    if (rows.length === 0) throw new Error("no prices");
    return {
      isLive: json?.source === "agmarknet-live",
      prices: rows.map((r) => ({
        crop: r.crop,
        nameHi: r.crop_hi ?? r.crop,
        minPrice: Number(r.min_price),
        maxPrice: Number(r.max_price),
        unit: r.unit ?? "₹/kg",
      })),
    };
  } catch {
    return { isLive: false, prices: getAdjustedPrices() };
  }
}
