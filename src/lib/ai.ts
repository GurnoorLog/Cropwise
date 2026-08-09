import type { AIResponse, ResultType } from "../components/ResponseCard";
import { supabase, SUPABASE_URL } from "../supabase";
import { fetchMarketPrices, formatPrices } from "../data/prices";
import { isSpeechLanguage, languageName, type SpeechLanguageCode } from "./languages";

export function normalizeResultType(value: unknown): ResultType {
  return value === "weather" ||
    value === "prices" ||
    value === "news" ||
    value === "buyers" ||
    value === "calendar" ||
    value === "schemes"
    ? value
    : "chat";
}

export interface FarmContext {
  farmName: string;
  location: string;
  farmType: string;
  size: string;
  irrigation: string;
  storage: string;
  crops: string;
  language: string;
}

export const AI_MODEL = "gpt-4o-mini";
export const AI_ENDPOINT = "https://api.aimlapi.com/v1/chat/completions";

export function buildPrompt(opts: {
  query: string;
  priceStr: string;
  weatherSummary: string;
  language: SpeechLanguageCode;
  farm?: FarmContext | null;
  instructions?: string;
  history?: { role: "user" | "agent"; text: string }[];
}): string {
  const { query, priceStr, weatherSummary, language, farm, instructions, history } = opts;

  const historyBlock =
    history && history.length > 0
      ? `
Conversation so far (most recent last):
${history.slice(-8).map((t) => `${t.role === "user" ? "Farmer" : "Harvest Window"}: ${t.text}`).join("\n")}
Use this to resolve follow-up references (e.g. "and tomorrow?" refers to the last topic).`
      : "";

  const farmBlock = farm
    ? `
Farm profile (farmer's real data):
- Farm name: ${farm.farmName}
- Location: ${farm.location}
- Farm type: ${farm.farmType}
- Size: ${farm.size}
- Irrigation: ${farm.irrigation}
- Storage facilities: ${farm.storage}
- Crops grown: ${farm.crops}
- Preferred language: ${farm.language}
Use this profile to personalise every recommendation. Always tie advice to the crops this farmer actually grows and the conditions at their farm.
`
    : "";

  const taskBlock = instructions ?? `Write:
1. weather_summary — a short one-line summary of the weather relevant to selling.
2. price_estimate — a short line describing the current market price picture.
3. recommendation — a 2-3 sentence plain-language recommendation on when to sell and why.
4. spoilage_risk — "green", "yellow", or "red" based on weather-driven spoilage risk.
5. language — the language the farmer wrote in, EXACTLY one of "hi", "en", "mr", "bn", "ta", "ur" (Hindi, English, Marathi, Bengali, Tamil, Urdu).
6. result_type — classify the user's intent as EXACTLY one of: "weather" (forecast/climate), "prices" (market prices), "news" (market news/insights), "buyers" (buyers/mandi opportunities), "calendar" (crop sowing/harvest calendar), "schemes" (MSP/government schemes), or "chat" (general advice or anything else).
7. follow_up — a short one-line follow-up question in the same language inviting the farmer to go deeper, or "" if nothing.`;

  return `You are Harvest Window, an AI assistant for ${farm?.location || "Indian"} farmers deciding when to sell their crop. Here is the data:

Crop query: ${query}
Live market prices per kg: ${priceStr}
Weather: ${weatherSummary || "weather data unavailable"}
${historyBlock}
${farmBlock}
Respond in ${languageName(language)}.

${taskBlock}

Respond with ONLY valid JSON in exactly this shape:
{"weather_summary":"...","price_estimate":"...","recommendation":"...","spoilage_risk":"green","language":"en","result_type":"chat","follow_up":""}`;
}

/** Call the AI/ML API directly from the browser using a user-provided key */
export async function callAIMLDirect(opts: {
  query: string;
  priceStr: string;
  weatherSummary: string;
  language: SpeechLanguageCode;
  apiKey: string;
  farm?: FarmContext | null;
  instructions?: string;
  history?: { role: "user" | "agent"; text: string }[];
}): Promise<AIResponse> {
  const { query, priceStr, weatherSummary, language, apiKey, farm, instructions, history } = opts;

  const res = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [{ role: "user", content: buildPrompt({ query, priceStr, weatherSummary, language, farm, instructions, history }) }],
      temperature: 0.6,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI request failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const content: string = json?.choices?.[0]?.message?.content ?? "";
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI returned an unreadable response");

  const parsed = JSON.parse(match[0]) as Partial<AIResponse>;
  if (!parsed.recommendation) throw new Error("AI returned an incomplete response");

  const risk = parsed.spoilage_risk === "red" ? "red" : parsed.spoilage_risk === "green" ? "green" : "yellow";
  return {
    weather_summary: parsed.weather_summary ?? weatherSummary,
    price_estimate: parsed.price_estimate ?? priceStr,
    recommendation: parsed.recommendation,
    spoilage_risk: risk,
    language: isSpeechLanguage(parsed.language) ? parsed.language : language,
    result_type: normalizeResultType(parsed.result_type),
    follow_up: parsed.follow_up ?? "",
  };
}

/** Resolve an AI response: direct API call when a key is set, else the edge function (which has a built-in fallback). */
export async function getAIResponse(opts: {
  query: string;
  weatherSummary: string;
  language: SpeechLanguageCode;
  apiKey: string;
  farm?: FarmContext | null;
  lat?: number;
  lon?: number;
  district?: string;
  instructions?: string;
  history?: { role: "user" | "agent"; text: string }[];
}): Promise<AIResponse> {
  const { query, weatherSummary, language, apiKey, farm, lat, lon, district, instructions, history } = opts;
  const prices = await fetchMarketPrices();
  const priceStr = formatPrices(prices);

  if (apiKey) {
    return callAIMLDirect({
      query,
      priceStr,
      weatherSummary,
      language,
      apiKey,
      farm,
      instructions,
      history,
    });
  }

  const { data, error } = await supabase.functions.invoke("recommend-crop", {
    body: {
      query,
      language,
      location: {
        lat: lat ?? 27.1767,
        lon: lon ?? 78.0081,
        district: district ?? farm?.location ?? "India",
      },
      weather: weatherSummary ? { summary: weatherSummary } : null,
      prices: { summary: priceStr },
      farm,
      history: history ?? [],
    },
  });
  if (error) throw new Error(error.message || "AI request failed");
  const raw = data as Partial<AIResponse> | null;
  return {
    weather_summary: raw?.weather_summary ?? weatherSummary,
    price_estimate: raw?.price_estimate ?? priceStr,
    recommendation: raw?.recommendation ?? "",
    spoilage_risk:
      raw?.spoilage_risk === "red"
        ? "red"
        : raw?.spoilage_risk === "green"
          ? "green"
          : "yellow",
    language: isSpeechLanguage(raw?.language) ? raw.language : language,
    result_type: normalizeResultType(raw?.result_type),
    follow_up: raw?.follow_up ?? "",
  };
}

/** Fetch a compact weather summary from Open-Meteo for the farm region. */
export async function fetchWeatherSummary(
  language: SpeechLanguageCode,
  location?: string | null,
): Promise<{ summary: string; lat: number; lon: number }> {
  const coords = location && /agra|uttar pradesh/i.test(location)
    ? { lat: 27.1767, lon: 78.0081 }
    : { lat: 18.52, lon: 73.85 };

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&forecast_days=7`;
    const res = await fetch(url);
    const data = await res.json();
    const d = data?.daily;
    if (!d) return { summary: "", ...coords };

    const day0 = d.time?.[0] || "today";
    const tMax = d.temperature_2m_max?.[0];
    const tMin = d.temperature_2m_min?.[0];
    const precip = d.precipitation_sum?.[0];
    const code = d.weathercode?.[0];
    const desc =
      code <= 3
        ? language === "hi" ? "साफ" : "Clear"
        : code <= 48
          ? language === "hi" ? "धुंध" : "Fog"
          : code <= 57
            ? language === "hi" ? "बूंदाबांदी" : "Drizzle"
            : code <= 67
              ? language === "hi" ? "बारिश" : "Rain"
              : code <= 82
                ? language === "hi" ? "तेज़ बारिश" : "Heavy Rain"
                : language === "hi" ? "आंधी" : "Storm";

    let summary = `${day0}: ${tMin ?? "?"}-${tMax ?? "?"}°C, ${desc}`;
    if (precip > 0) summary += `, ${language === "hi" ? "बारिश" : "rain"} ${precip}mm`;
    return { summary, ...coords };
  } catch {
    return { summary: "", ...coords };
  }
}

export { SUPABASE_URL };
export { fetchMarketPrices, formatPrices } from "../data/prices";
