import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SPEECHMATICS_API_KEY = Deno.env.get("SPEECHMATICS_API_KEY");

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

  if (!SPEECHMATICS_API_KEY) {
    return corsResponse(
      {
        error:
          "Server Speechmatics key is not configured. Add SPEECHMATICS_API_KEY to the Supabase Edge Function secrets.",
      },
      500,
    );
  }

  try {
    const res = await fetch("https://mp.speechmatics.com/v1/api_keys?type=rt", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${SPEECHMATICS_API_KEY}:`)}`,
      },
    });

    if (!res.ok) {
      return corsResponse(
        {
          error: `Speechmatics token request failed (${res.status})`,
        },
        502,
      );
    }

    const json = await res.json();
    if (!json?.key) {
      return corsResponse({ error: "No token returned from Speechmatics" }, 502);
    }

    return corsResponse({ token: json.key });
  } catch (err) {
    return corsResponse(
      {
        error: err instanceof Error ? err.message : "Unexpected error",
      },
      500,
    );
  }
});
