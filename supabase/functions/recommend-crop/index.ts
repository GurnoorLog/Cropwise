import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const AI_MODEL = Deno.env.get("AI_MODEL") ?? "gpt-4o-mini";
const AI_ENDPOINT =
  Deno.env.get("AI_ENDPOINT") ?? "https://api.aimlapi.com/v1/chat/completions";
const API_KEY = Deno.env.get("AIML_API_KEY") ?? Deno.env.get("OPENAI_API_KEY");

interface RecommendCropBody {
  query?: string;
  location?: { lat?: number; lon?: number; district?: string };
  weather?: { summary?: string } | null;
  prices?: { summary?: string };
  history?: { role: "user" | "agent"; text: string }[];
}

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

  if (req.method !== "POST") {
    return corsResponse({ error: "Method not allowed" }, 405);
  }

  if (!API_KEY) {
    return corsResponse(
      {
        error:
          "No server AI key configured. Add AIML_API_KEY to the Supabase Edge Function secrets.",
      },
      500,
    );
  }

  let body: RecommendCropBody;
  try {
    body = await req.json();
  } catch {
    return corsResponse({ error: "Invalid JSON body" }, 400);
  }

  const query = body.query?.trim() ?? "";
  if (!query) {
    return corsResponse({ error: "Missing query" }, 400);
  }

  const district = body.location?.district ?? "Pune";
  const weatherSummary = body.weather?.summary ?? "";
  const priceStr = body.prices?.summary ?? "";
  const history = Array.isArray(body.history) ? body.history.slice(-8) : [];

  const historyBlock =
    history.length > 0
      ? `\nConversation so far (most recent last):\n${history
          .map((t) => `${t.role === "user" ? "Farmer" : "Harvest Window"}: ${t.text}`)
          .join("\n")}\nUse this to resolve follow-up references (e.g. "and tomorrow?" refers to the last topic).`
      : "";

  const prompt = `You are Harvest Window, helping a farmer decide when to sell their crop. Here is the data:

Crop query: ${query}
Location: ${district}
Live market prices per kg: ${priceStr || "unavailable"}
Weather: ${weatherSummary || "weather data unavailable"}${historyBlock}

Return ONLY a JSON object with EXACTLY these 7 keys:
1. weather_summary — one short line on the weather relevant to selling.
2. price_estimate — one short line on the current market price picture.
3. recommendation — 2-3 sentences in plain language answering the user's question and advising when to sell and why.
4. spoilage_risk — EXACTLY one of "green", "yellow", "red" (weather-driven spoilage risk).
5. language — EXACTLY "hi" if the user wrote in Hindi or Hinglish, otherwise "en".
6. result_type — pick the SINGLE best category for the user's request:
   - "weather" for forecasts, rain, climate, temperature questions
   - "prices" for market/mandi prices or the price of any crop
   - "news" for market news, trends, or insights
   - "buyers" for buyers, mandi buyers, or selling opportunities
   - "calendar" for sowing, planting, harvesting, or crop-season timing
   - "schemes" for MSP, subsidies, government schemes, or loans
   - "chat" ONLY for general advice or anything not matching above
   Examples: "when should I sow wheat" -> calendar; "wheat price in Agra" -> prices; "what MSP schemes" -> schemes; "will it rain tomorrow" -> weather; "who buys onions" -> buyers.
7. follow_up — a short follow-up question (5-10 words) in the same language as the user to continue the conversation. ALWAYS provide one; never empty.

Respond with ONLY valid JSON in EXACTLY this shape:
{"weather_summary":"...","price_estimate":"...","recommendation":"...","spoilage_risk":"green","language":"en","result_type":"calendar","follow_up":"..."}`;

  try {
    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return corsResponse(
        {
          error: `AI request failed (${res.status}): ${text.slice(0, 200)}`,
        },
        502,
      );
    }

    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      return corsResponse(
        { error: "AI returned an unreadable response" },
        502,
      );
    }

    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    const risk =
      parsed.spoilage_risk === "red"
        ? "red"
        : parsed.spoilage_risk === "green"
          ? "green"
          : "yellow";

    const modelType =
      parsed.result_type === "weather" ||
      parsed.result_type === "prices" ||
      parsed.result_type === "news" ||
      parsed.result_type === "buyers" ||
      parsed.result_type === "calendar" ||
      parsed.result_type === "schemes"
        ? parsed.result_type
        : "chat";

    const lower = query.toLowerCase();
    const keywordType =
      /scheme|msp|subsid|yojna|योजना|grant|loan|किसान क्रेडिट/.test(lower)
        ? "schemes"
        : /price|rate|mandi|bhaav|भाव|दर|कीमत|cost/.test(lower)
          ? "prices"
          : /sow|sowing|plant|harvest|season|calendar|बुवाई|कटाई|कैलेंडर/.test(lower)
            ? "calendar"
            : /rain|weather|temp|forecast|मौसम|बारिश|तापमान/.test(lower)
              ? "weather"
              : /buyer|who buys|mandi buyer|क्रेता|खरीदार/.test(lower)
                ? "buyers"
                : /news|insight|trend|market news/.test(lower)
                  ? "news"
                  : /advice|what should i do|how do i|help me/.test(lower)
                    ? "chat"
                    : null;

    const resultType = keywordType ?? modelType;
    const language = /[\u0900-\u097F]/.test(query)
      ? "hi"
      : parsed.language === "hi"
        ? "hi"
        : "en";

    return corsResponse({
      weather_summary: (parsed.weather_summary as string) ?? weatherSummary,
      price_estimate: (parsed.price_estimate as string) ?? priceStr,
      recommendation: (parsed.recommendation as string) ?? "",
      spoilage_risk: risk,
      language,
      result_type: resultType,
      follow_up: (parsed.follow_up as string) ?? "",
    });
  } catch (err) {
    return corsResponse(
      {
        error: err instanceof Error ? err.message : "Unexpected error",
      },
      500,
    );
  }
});
