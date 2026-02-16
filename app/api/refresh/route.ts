import { supabaseServer } from "@/lib/supabase";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function expandUrl(inputUrl: string): Promise<string> {
  // Para links cortos vt.tiktok.com / vm.tiktok.com
  try {
    const res = await fetch(inputUrl, { redirect: "follow" });
    return res.url || inputUrl;
  } catch {
    return inputUrl;
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return Response.json({ error: "campaignId required" }, { status: 400 });
    }

    const APIFY_TOKEN = requireEnv("APIFY_TOKEN");
    const APIFY_ACTOR_ID = requireEnv("APIFY_ACTOR_ID");

    const sb = supabaseServer();

    // 1) Traer links de la campaña
    const { data: links, error } = await sb
      .from("campaign_links")
      .select("id,url,canonical_url")
      .eq("campaign_id", campaignId)
      .limit(500);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!links || links.length === 0) return Response.json({ ok: true, updated: 0 });

    const urls = links.map((l: any) => (l.canonical_url || l.url).trim()).filter(Boolean);

    // Expandir links cortos
    const expanded = await Promise.all(urls.map(expandUrl));

    // 2) Llamar Apify (actor run sync)
    const endpoint =
      `https://api.apify.com/v2/acts/${encodeURIComponent(APIFY_ACTOR_ID)}` +
      `/run-sync-get-dataset-items?token=${encodeURIComponent(APIFY_TOKEN)}&timeout=300`;

    const apifyRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // ✅ Para este actor (Clockworks TikTok Scraper): Video URLs
        videoUrls: expanded,
      }),
    });

    if (!apifyRes.ok) {
      const txt = await apifyRes.text();
      return Response.json({ error: `Apify error ${apifyRes.status}: ${txt}` }, { status: 500 });
    }

    const items = await apifyRes.json();

    // 3) Mapear métricas por URL
    const metrics = new Map<
      string,
      { views: number; likes: number; comments: number; shares: number; saves: number }
    >();

    for (const it of items || []) {
      const u = (it.webVideoUrl || it.url || "").trim();
      if (!u) continue;

      metrics.set(u, {
        views: Number(it.playCount ?? 0),
        likes: Number(it.diggCount ?? 0),
        comments: Number(it.commentCount ?? 0),
        shares: Number(it.shareCount ?? 0),
        saves: Number(it.collectCount ?? 0),
      });
    }

    // 4) Actualizar Supabase
    let updated = 0;

    for (let i = 0; i < links.length; i++) {
      const link = links[i] as any;
      const canonical = expanded[i] || (link.canonical_url || link.url);
      const m = metrics.get(canonical);

      if (!m) {
        await sb
          .from("campaign_links")
          .update({
            canonical_url: canonical,
            status: "error",
            last_error: "No metrics returned (private/deleted/blocked?)",
          })
          .eq("id", link.id);
        continue;
      }

      const { error: upErr } = await sb
        .from("campaign_links")
        .update({
          canonical_url: canonical,
          views: m.views,
          likes: m.likes,
          comments: m.comments,
          shares: m.shares,
          saves: m.saves,
          status: "ok",
          last_error: null,
          last_updated_at: new Date().toISOString(),
        })
        .eq("id", link.id);

      if (!upErr) updated++;
    }

    return Response.json({ ok: true, updated });
  } catch (e: any) {
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ ok: true, hint: "Use POST /api/refresh?campaignId=..." });
}
