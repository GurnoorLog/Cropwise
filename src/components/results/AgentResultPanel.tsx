import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase, SUPABASE_URL } from "../../supabase";
import type { ResultType } from "../ResponseCard";
import { fetchFarmWeather, type FarmWeather } from "../../lib/weather";
import {
  fetchCropCalendar,
  fetchMspRates,
  fetchSchemes,
  type CropCalendarRow,
  type MspRateRow,
  type SchemeRow,
} from "../../lib/schemes";
import WeatherResult from "./WeatherResult";
import PricesResult, { type PriceRow } from "./PricesResult";
import BuyersResult, { type BuyerRow } from "./BuyersResult";
import NewsResult, { type NewsRow } from "./NewsResult";
import CalendarResult from "./CalendarResult";
import SchemesResult from "./SchemesResult";

type DataType = Exclude<ResultType, "chat">;

interface AgentResultPanelProps {
  type: DataType;
  userId: string;
  lang?: "hi" | "en";
}

async function fetchNews(): Promise<NewsRow[]> {
  try {
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token ?? "";
    const res = await fetch(`${SUPABASE_URL}/functions/v1/news-sync`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`news-sync ${res.status}`);
    const json = await res.json();
    if (Array.isArray(json.news)) return json.news as NewsRow[];
  } catch {
    const { data } = await supabase
      .from("news")
      .select("*")
      .order("published_at", { ascending: false });
    if (data) return data as NewsRow[];
  }
  return [];
}

export default function AgentResultPanel({ type, userId, lang = "en" }: AgentResultPanelProps) {
  const [loading, setLoading] = useState(true);

  const [farm, setFarm] = useState<FarmWeather | null>(null);
  const [prices, setPrices] = useState<PriceRow[]>([]);
  const [buyers, setBuyers] = useState<BuyerRow[]>([]);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [calendar, setCalendar] = useState<CropCalendarRow[]>([]);
  const [schemes, setSchemes] = useState<SchemeRow[]>([]);
  const [msp, setMsp] = useState<MspRateRow[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setFarm(null);
    setPrices([]);
    setBuyers([]);
    setNews([]);
    setCalendar([]);
    setSchemes([]);
    setMsp([]);

    const load = async () => {
      try {
        switch (type) {
          case "weather": {
            const f = await fetchFarmWeather(userId);
            if (mounted) setFarm(f);
            break;
          }
          case "prices": {
            const { data } = await supabase
              .from("market_prices")
              .select("*")
              .order("max_price", { ascending: false });
            if (mounted && data) setPrices(data as PriceRow[]);
            break;
          }
          case "buyers": {
            const { data } = await supabase
              .from("buyers")
              .select("*")
              .order("bid_max", { ascending: false });
            if (mounted && data) setBuyers(data as BuyerRow[]);
            break;
          }
          case "news": {
            const rows = await fetchNews();
            if (mounted) setNews(rows);
            break;
          }
          case "calendar": {
            const rows = await fetchCropCalendar();
            if (mounted) setCalendar(rows);
            break;
          }
          case "schemes": {
            const [s, m] = await Promise.all([fetchSchemes(), fetchMspRates()]);
            if (mounted) {
              setSchemes(s);
              setMsp(m);
            }
            break;
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();

    return () => {
      mounted = false;
    };
  }, [type, userId]);

  if (loading) {
    return (
      <div className="min-h-[30vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  switch (type) {
    case "weather":
      return <WeatherResult farm={farm} lang={lang} compact />;
    case "prices":
      return <PricesResult prices={prices} />;
    case "buyers":
      return <BuyersResult buyers={buyers} limit={3} />;
    case "news":
      return <NewsResult rows={news.slice(0, 6)} />;
    case "calendar":
      return <CalendarResult rows={calendar} lang={lang} farm={farm} />;
    case "schemes":
      return <SchemesResult schemes={schemes} msp={msp} lang={lang} />;
  }
}
