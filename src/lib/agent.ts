import type { FarmWeather } from "./weather";
import { buildAlert } from "./weather";
import type { ResultType } from "../components/ResponseCard";
import {
  fetchCropCalendar,
  fetchMspRates,
  fetchSchemes,
  type CropCalendarRow,
  type MspRateRow,
  type SchemeRow,
} from "./schemes";
import type { PriceRow } from "../components/results/PricesResult";
import type { BuyerRow } from "../components/results/BuyersResult";
import type { NewsRow } from "../components/results/NewsResult";

export type AgentAction =
  | "weather"
  | "news"
  | "prices"
  | "buyers"
  | "calendar"
  | "schemes"
  | "advice";

export interface ConversationTurn {
  role: "user" | "agent";
  text: string;
}

export interface AgentContext {
  profile?: {
    crops: string[];
  } | null;
  farmWeather?: FarmWeather | null;
}

export interface AgentResultData {
  weather?: FarmWeather | null;
  news?: NewsRow[];
  prices?: PriceRow[];
  buyers?: BuyerRow[];
  calendar?: CropCalendarRow[];
  schemes?: { schemes: SchemeRow[]; msp: MspRateRow[] };
}

/** Map an AI result_type (or chat) to a renderable agent action. */
export function actionFromResultType(type: ResultType | undefined): AgentAction {
  switch (type) {
    case "weather":
    case "news":
    case "prices":
    case "buyers":
    case "calendar":
    case "schemes":
      return type;
    default:
      return "advice";
  }
}

/** Fetch the live data payload for a given agent action. */
export async function executeAction(
  action: Exclude<AgentAction, "advice">,
  ctx: AgentContext,
  userId: string,
): Promise<AgentResultData> {
  switch (action) {
    case "weather": {
      const farm = await import("./weather").then((m) => m.fetchFarmWeather(userId));
      return { weather: farm ?? ctx.farmWeather ?? null };
    }
    case "news": {
      const rows = await fetchNewsRows();
      return { news: rows };
    }
    case "prices": {
      const { supabase } = await import("../supabase");
      const { data } = await supabase.from("market_prices").select("*");
      return { prices: (data as PriceRow[]) ?? [] };
    }
    case "buyers": {
      const { supabase } = await import("../supabase");
      const { data } = await supabase
        .from("buyers")
        .select("*")
        .order("bid_max", { ascending: false });
      return { buyers: (data as BuyerRow[]) ?? [] };
    }
    case "calendar": {
      const rows = await fetchCropCalendar();
      return { calendar: rows };
    }
    case "schemes": {
      const [s, m] = await Promise.all([fetchSchemes(), fetchMspRates()]);
      return { schemes: { schemes: s, msp: m } };
    }
  }
}

/** Load news via the sync edge function with a table fallback. */
export async function fetchNewsRows(): Promise<NewsRow[]> {
  try {
    const { supabase, SUPABASE_URL } = await import("../supabase");
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token ?? "";
    const res = await fetch(`${SUPABASE_URL}/functions/v1/news-sync`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`news-sync ${res.status}`);
    const json = await res.json();
    if (Array.isArray(json.news)) return json.news as NewsRow[];
  } catch {
    // fall through to table
  }
  const { supabase } = await import("../supabase");
  const { data } = await supabase.from("news").select("*");
  return (data as NewsRow[]) ?? [];
}

/** Proactive weather alert (frost/heavy rain/high wind) for the farm. */
export function proactiveAlert(farm: FarmWeather | null) {
  if (!farm) return null;
  const alert = buildAlert(farm);
  if (!alert) return null;
  return alert;
}
