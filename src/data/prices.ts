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
