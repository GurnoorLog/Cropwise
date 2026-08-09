import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const SYNC_MINUTES = 30;

const FEEDS: Array<{ url: string; source: string }> = [
  {
    url: "https://www.thehindu.com/sci-tech/agriculture/feeder/default.rss",
    source: "The Hindu",
  },
  {
    url: "https://www.livemint.com/rss/companies",
    source: "Mint",
  },
  {
    url: "https://www.farmprogress.com/rss.xml",
    source: "Farm Progress",
  },
  {
    url: "https://www.agdaily.com/feed/",
    source: "AGDAILY",
  },
  {
    url: "http://feeds.bbci.co.uk/news/business/rss.xml",
    source: "BBC News",
  },
];

function categorize(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("price") || t.includes("market") || t.includes("demand") || t.includes("trade") || t.includes("export") || t.includes("commodity"))
    return "Markets";
  if (t.includes("weather") || t.includes("rain") || t.includes("frost") || t.includes("heat") || t.includes("drought") || t.includes("monsoon"))
    return "Weather";
  if (t.includes("harvest") || t.includes("yield") || t.includes("crop") || t.includes("soil") || t.includes("farmer") || t.includes("sugarcane") || t.includes("wheat") || t.includes("rice"))
    return "Insights";
  if (t.includes("buyer") || t.includes("retail") || t.includes("import") || t.includes("supply"))
    return "Buyer Activity";
  return "Markets";
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unescapeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function cdata(s: string | undefined): string {
  if (!s) return "";
  const m = s.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return m ? m[1] : s;
}

function parseRss(xml: string): Array<{ title: string; summary: string; link: string; pubDate: string }> {
  const items: Array<{ title: string; summary: string; link: string; pubDate: string }> = [];
  const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const body = m[1];
    const title = cdata(body.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? "");
    const link = cdata(body.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1] ?? "");
    const summary = cdata(body.match(/<description[^>]*>([\s\S]*?)<\/description>/)?.[1] ?? "");
    const pubDate = cdata(body.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)?.[1] ?? "");
    if (!title || !link) continue;
    items.push({
      title: unescapeEntities(stripHtml(title)).slice(0, 300),
      summary: unescapeEntities(stripHtml(summary)).slice(0, 600),
      link: unescapeEntities(link).split("?")[0],
      pubDate,
    });
  }
  return items;
}

function parseRssDate(s: string): string {
  const d = new Date(s);
  if (isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
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

  if (req.method !== "GET") {
    return corsResponse({ error: "Method not allowed" }, 405);
  }

  if (!supabaseUrl || !serviceKey) {
    return corsResponse({ error: "Server not configured" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // 1. Throttle: if we synced recently, serve cached rows without refetching
  const { data: meta } = await supabase
    .from("sync_meta")
    .select("last_sync_at")
    .eq("key", "news")
    .maybeSingle();

  const lastSync = meta?.last_sync_at ? new Date(meta.last_sync_at).getTime() : 0;
  const fresh = Date.now() - lastSync < SYNC_MINUTES * 60 * 1000;

  let inserted = 0;
  if (!fresh) {
    // 2. Fetch all feeds and dedupe by URL
    const seen = new Set<string>();
    const rows: Array<{
      title: string;
      summary: string;
      source: string;
      url: string;
      category: string;
      published_at: string;
      is_placeholder: boolean;
    }> = [];

    for (const feed of FEEDS) {
      try {
        const res = await fetch(feed.url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; HarvestWindowBot/1.0)",
            Accept: "application/rss+xml, application/xml, text/xml, */*",
          },
        });
        if (!res.ok) continue;
        const xml = await res.text();
        const items = parseRss(xml);
        for (const it of items) {
          if (seen.has(it.link)) continue;
          seen.add(it.link);
          rows.push({
            title: it.title,
            summary: it.summary,
            source: feed.source,
            url: it.link,
            category: categorize(it.title),
            published_at: parseRssDate(it.pubDate),
            is_placeholder: false,
          });
        }
      } catch {
        // skip feed on failure
      }
    }

    if (rows.length > 0) {
      const { error } = await supabase.from("news").upsert(rows, {
        onConflict: "url",
        ignoreDuplicates: true,
      });
      if (error) {
        console.error("news upsert error", error.message);
      } else {
        inserted = rows.length;
      }
    }

    const { error: metaErr } = await supabase.from("sync_meta").upsert(
      { key: "news", last_sync_at: new Date().toISOString() },
      { onConflict: "key" },
    );
    if (metaErr) console.error("sync_meta upsert error", metaErr.message);
  }

  // 3. Drop placeholder rows once we have real articles
  if (inserted > 0) {
    await supabase.from("news").delete().eq("is_placeholder", true);
  }

  // 4. Serve the freshest real stories (fall back to placeholders if none yet)
  const { data: news } = await supabase
    .from("news")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(30);

  const { count: realCount } = await supabase
    .from("news")
    .select("id", { count: "exact", head: true })
    .eq("is_placeholder", false);

  return corsResponse({
    fresh,
    inserted,
    real: (realCount ?? 0) > 0,
    news: news ?? [],
  });
});
