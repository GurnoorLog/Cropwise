import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const DATA_GOV_IN_KEY = Deno.env.get("DATA_GOV_IN_API_KEY") ?? "";

// Commodity → data.gov.in commodity name
const COMMODITY_MAP: Record<string, string> = {
  Tomatoes: "Tomato",
  Onions: "Onion",
  Potatoes: "Potato",
  Chilies: "Chilli",
  Brinjal: "Brinjal",
  Spinach: "Palak",
  Lettuce: "Lettuce",
  "Heirloom Peppers": "Capsicum",
};

const HINDI: Record<string, string> = {
  Tomatoes: "टमाटर",
  Onions: "प्याज",
  Potatoes: "आलू",
  Chilies: "मिर्च",
  Brinjal: "बैंगन",
  Spinach: "पालक",
  Lettuce: "सलाद पत्ता",
  "Heirloom Peppers": "हीरलूम शिमला मिर्च",
};

interface PriceRow {
  crop: string;
  crop_hi: string;
  market: string;
  min_price: number;
  max_price: number;
  unit: string;
}

// If DATA_GOV_IN_API_KEY is set, fetch live Agmarknet mandi prices for Pune/Maharashtra.
// Otherwise return the seeded baseline table (always functional).
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function corsResponse(body: unknown, status = 200): Response {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "GET") {
    return corsResponse({ error: "Method not allowed" }, 405);
  }

  if (!supabaseUrl || !serviceKey) {
    return corsResponse({ error: "Server not configured" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  if (DATA_GOV_IN_KEY) {
    const rows: PriceRow[] = [];

    for (const [crop, commodity] of Object.entries(COMMODITY_MAP)) {
      try {
        const url =
          `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070` +
          `?api-key=${DATA_GOV_IN_KEY}&format=json` +
          `&filters%5Bstate%5D=Maharashtra&filters%5Bcommodity%5D=${encodeURIComponent(commodity)}` +
          `&limit=10`;

        const res = await fetch(url, { headers: { "Accept": "application/json" } });
        if (!res.ok) continue;
        const json = await res.json();
        const records = (json?.records ?? []) as Array<{
          market?: string;
          modal_price?: string;
          min_price?: string;
          max_price?: string;
        }>;

        if (records.length > 0) {
          const prices = records
            .map((r) => [
              Number(r.modal_price ?? r.max_price ?? r.min_price ?? 0),
              Number(r.min_price ?? 0),
              Number(r.max_price ?? 0),
            ])
            .filter((p) => p[0] > 0);

          if (prices.length > 0) {
            const vals = prices.map((p) => p[0]);
            const minAll = prices.map((p) => p[1]).filter((v) => v > 0);
            const maxAll = prices.map((p) => p[2]).filter((v) => v > 0);
            rows.push({
              crop,
              crop_hi: HINDI[crop] ?? crop,
              market: records[0].market ?? "Pune",
              min_price: Math.round((minAll.length ? Math.min(...minAll) : Math.min(...vals)) / 50) * 50,
              max_price: Math.round((maxAll.length ? Math.max(...maxAll) : Math.max(...vals)) / 50) * 50,
              unit: "₹/kg",
            });
          }
        }
      } catch {
        // skip commodity on failure
      }
    }

    if (rows.length > 0) {
      const { error } = await supabase.from("market_prices").upsert(rows, {
        onConflict: "crop,market",
      });
      if (error) console.error("prices upsert error", error.message);
    }
  }

  const { data: prices } = await supabase
    .from("market_prices")
    .select("*")
    .order("crop", { ascending: true });

  return corsResponse({
    source: DATA_GOV_IN_KEY ? "agmarknet-live" : "baseline",
    prices: prices ?? [],
  });
});
