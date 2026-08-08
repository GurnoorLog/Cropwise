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
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "No server AI key configured. Add your own AI/ML key in Settings and try again.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: RecommendCropBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const query = body.query?.trim() ?? "";
  if (!query) {
    return new Response(JSON.stringify({ error: "Missing query" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const district = body.location?.district ?? "Pune";
  const weatherSummary = body.weather?.summary ?? "";
  const priceStr = body.prices?.summary ?? "";

  const prompt = `You are Harvest Window, helping a farmer decide when to sell their crop. Here is the data:

Crop query: ${query}
Location: ${district}
Live market prices per kg: ${priceStr || "unavailable"}
Weather: ${weatherSummary || "weather data unavailable"}

Write:
1. weather_summary — a short one-line summary of the weather relevant to selling.
2. price_estimate — a short line describing the current market price picture.
3. recommendation — a 2-3 sentence plain-language recommendation on when to sell and why.
4. spoilage_risk — "green", "yellow", or "red" based on weather-driven spoilage risk.
5. language — "hi" or "en" based on whether the user asked in Hindi.

Respond with ONLY valid JSON in exactly this shape:
{"weather_summary":"...","price_estimate":"...","recommendation":"...","spoilage_risk":"green","language":"en"}`;

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
        temperature: 0.6,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(
        JSON.stringify({
          error: `AI request failed (${res.status}): ${text.slice(0, 200)}`,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      return new Response(
        JSON.stringify({ error: "AI returned an unreadable response" }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    const risk =
      parsed.spoilage_risk === "red"
        ? "red"
        : parsed.spoilage_risk === "green"
          ? "green"
          : "yellow";

    return new Response(
      JSON.stringify({
        weather_summary: (parsed.weather_summary as string) ?? weatherSummary,
        price_estimate: (parsed.price_estimate as string) ?? priceStr,
        recommendation: (parsed.recommendation as string) ?? "",
        spoilage_risk: risk,
        language: parsed.language === "hi" ? "hi" : "en",
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unexpected error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
