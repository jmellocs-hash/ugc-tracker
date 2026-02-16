import { supabaseAdmin } from "@/lib/supabase";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function normalize(u: string) {
  return String(u || "").trim().replace(/\/+$/, "");
}

async function expandUrl(inputUrl: string): Promise<string> {
  try {
    const res = await fetch(inputUrl, { redirect: "follow" });
    return res.url || inputUrl;
  } catch {
    return inputUrl;
  }
}

export async function GET() {
  return Response.json({ ok: true, hint: "Use POST /api/refresh?campaignId=..." });
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId");
    if (!campaignId) return Response.json({ error: "campaignId required" }, { status: 400 });

    const APIFY_TOKEN = mustEnv("APIFY_TOKEN");
    const APIFY_ACTOR_ID = mustEnv("APIFY_ACTOR_ID");

    const sb = supabaseAdmin();

    const { data: links, error } = await sb
      .from("campaign_links")
      .select("id,url,canonical_url")
      .eq("campaign_id", campaignId)
      .limit(500);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!links?.length) return Response.json({ ok: true, updated: 0, reason: "no links" });

    const raw = links.map((l: any) => (l.canonical_url || l.url)).filter(Boolean);
    const expanded = await Promise.all(raw.map(expandUrl));
    const expandedNorm = expanded.map(normalize);

    // Apify run (sync) -> dataset items
    const endpoint =
      `https://api.apify.com/v2/acts/${encodeURIComponent(APIFY_ACTOR_ID)}` +
      `/run-sync-get-dataset-items?token=${encodeURIComponent(APIFY_TOKEN)}&timeout=300`;

    // input compatible con clockworks/tiktok-scraper:
    // 1) postURLs (videos)
    // 2) startUrls (fallback)
    const apifyInput = {
      postURLs: expandedNorm,
      startUrls: expandedNorm.map((url) => ({ url })),
      resultsPerPage: 1,
      proxyConfiguration: { useApifyProxy: true },
    };

    const apifyRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apifyInput),
    });

    const text = await apifyRes.text();
    let items: any[] = [];
    try { items = JSON.parse(text); } catch {}

    if (!apifyRes.ok) {
      return Response.json(
        { error: `Apify ${apifyRes.status}`, body: text.slice(0, 1200) },
        { status: 500 }
      );
    }

    // Map metrics by URL
    const metrics = new Map<string, any>();
    for (const it of items || []) {
      const u = normalize(it.webVideoUrl || it.url || it.postUrl || it.videoUrl || "");
      if (!u) continue;

      metrics.set(u, {
        views: Number(it.playCount ?? it.viewCount ?? 0),
        likes: Number(it.diggCount ?? it.likeCount ?? 0),
        comments: Number(it.commentCount ?? 0),
        shares: Number(it.shareCount ?? 0),
        saves: Number(it.collectCount ?? it.saveCount ?? 0),
      });
    }

    let updated = 0;
    let notFound = 0;

    for (let i = 0; i < links.length; i++) {
      const link = links[i] as any;
      const canonical = expandedNorm[i] || normalize(link.canonical_url || link.url);
      const m = metrics.get(canonical);

      if (!m) {
        notFound++;
        await sb.from("campaign_links").update({
          canonical_url: canonical,
          status: "error",
          last_error: "No metrics returned (private/deleted/blocked or actor mismatch)",
          last_updated_at: new Date().toISOString(),
        }).eq("id", link.id);
        continue;
      }

      const { error: upErr } = await sb.from("campaign_links").update({
        canonical_url: canonical,
        views: m.views,
        likes: m.likes,
        comments: m.comments,
        shares: m.shares,
        saves: m.saves,
        status: "ok",
        last_error: null,
        last_updated_at: new Date().toISOString(),
      }).eq("id", link.id);

      if (!upErr) updated++;
    }

    return Response.json({
      ok: true,
      updated,
      apifyItems: Array.isArray(items) ? items.length : 0,
      notFound,
      sampleExpanded: expandedNorm.slice(0, 3),
      sampleApifyUrl: items?.[0]?.webVideoUrl || items?.[0]?.url || null,
    });
  } catch (e: any) {
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
