import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaignId");
  if (!campaignId) return Response.json({ error: "campaignId required" }, { status: 400 });

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("campaign_links")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data: data ?? [] });
}

export async function POST(req: Request) {
  const sb = supabaseAdmin();
  const body = await req.json().catch(() => ({}));

  const campaignId = String(body?.campaignId || "").trim();
  const urls: string[] = Array.isArray(body?.urls) ? body.urls : [];

  if (!campaignId) return Response.json({ error: "campaignId required" }, { status: 400 });
  if (!urls.length) return Response.json({ error: "urls required" }, { status: 400 });

  const cleaned = urls
    .map((u) => String(u || "").trim())
    .filter(Boolean)
    .slice(0, 500);

  const rows = cleaned.map((url) => ({
    campaign_id: campaignId,
    url,
    canonical_url: null,
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    status: "ok",
    last_error: null,
    last_updated_at: null,
  }));

  const { data, error } = await sb.from("campaign_links").insert(rows).select("*");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data: data ?? [] });
}
