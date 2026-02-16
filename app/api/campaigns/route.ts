import { X } from "@/lib/supabase";

export async function GET() {
  const sb = supabaseServer();

  const { data, error } = await sb
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ data });
}

export async function POST(req: Request) {
  const body = await req.json();

  if (!body?.name) {
    return Response.json({ error: "name required" }, { status: 400 });
  }

  const sb = supabaseServer();

  const { data, error } = await sb
    .from("campaigns")
    .insert({ name: body.name })
    .select("*")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ data });
}
