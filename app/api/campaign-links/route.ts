import { supabaseServer } from "@/lib/supabase";

function normalizeTikTokUrl(url: string) {
  const u = url.trim();
  if (!u) return null;

  // Acepta tiktok.com, vm.tiktok.com, m.tiktok.com, etc.
  if (!u.includes("tiktok.com")) return null;

  // Quita parámetros raros
  try {
    const parsed = new URL(u);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return u;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const campaign_id = searchParams.get("campaign_id");
  if (!campaign_id) return Response.json({ error: "campaign_id required" }, { status: 400 });

  const sb = supabaseServer();
  const { data, error } = await sb
    .from("campaign_links")
    .select("*")
    .eq("campaign_id", campaign_id)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}

export async function POST(req: Request) {
  const body = await req.json();
  const campaign_id = body?.campaign_id;
  const rawUrls: string[] = body?.urls || [];

  if (!campaign_id) return Response.json({ error: "campaign_id required" }, { status: 400 });
  if (!Array.isArray(rawUrls) || rawUrls.length === 0)
    return Response.json({ error: "urls required" }, { status: 400 });

  const normalized = rawUrls
    .map((x) => normalizeTikTokUrl(String(x)))
    .filter(Boolean) as string[];

  if (normalized.length === 0) return Response.json({ error: "no valid tiktok urls" }, { status: 400 });

  // Dedup dentro del request
  const unique = Array.from(new Set(normalized)).slice(0, 500);

  const rows = unique.map((url) => ({
    campaign_id,
    url,
    canonical_url: url,
    status: "ok",
  }));

  const sb = supabaseServer();

  // Evita duplicados: si ya existe misma url en la campaña, la ignoramos
  // (lo hacemos consultando rápido antes)
  const { data: existing, error: exErr } = await sb
    .from("campaign_links")
    .select("url")
    .eq("campaign_id", campaign_id)
    .in("url", unique);

  if (exErr) return Response.json({ error: exErr.message }, { status: 500 });

  const existingSet = new Set((existing || []).map((e: any) => e.url));
  const toInsert = rows.filter((r) => !existingSet.has(r.url));

  if (toInsert.length === 0) {
    return Response.json({ inserted: 0, skipped: unique.length }, { status: 200 });
  }

  const { error } = await sb.from("campaign_links").insert(toInsert);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ inserted: toInsert.length, skipped: unique.length - toInsert.length });
}
