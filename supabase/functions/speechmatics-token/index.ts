import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SPEECHMATICS_API_KEY = Deno.env.get("SPEECHMATICS_API_KEY");

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!SPEECHMATICS_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "Server Speechmatics key is not configured. Enter your own Speechmatics key in Settings to record.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
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
      return new Response(
        JSON.stringify({
          error: `Speechmatics token request failed (${res.status})`,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const json = await res.json();
    if (!json?.key) {
      return new Response(
        JSON.stringify({ error: "No token returned from Speechmatics" }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ token: json.key }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unexpected error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
