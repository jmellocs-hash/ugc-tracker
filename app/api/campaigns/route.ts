import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("campaigns").select("*").order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data: data ?? [] });
}

export async function POST(req: Request) {
  const sb = supabaseAdmin();
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || "").trim();
  if (!name) return Response.json({ error: "name required" }, { status: 400 });

  const { data, error } = await sb.from("campaigns").insert({ name }).select("*").single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}
