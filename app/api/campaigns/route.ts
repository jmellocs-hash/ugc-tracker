import { supabaseServer } from "@/lib/supabase";

export async function GET() {
  try {
    const sb = supabaseServer();

    const { data, error } = await sb
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data });
  } catch (e: any) {
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data });
  } catch (e: any) {
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
