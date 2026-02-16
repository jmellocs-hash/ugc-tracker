"use client";

import { useEffect, useMemo, useState } from "react";

type LinkRow = {
  id: string;
  url: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number | null;
  status: string;
  last_updated_at: string | null;
  created_at: string;
};

export default function CampaignPage({ params }: { params: { id: string } }) {
  const campaignId = params.id;

  const [text, setText] = useState("");
  const [rows, setRows] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/campaign-links?campaign_id=${campaignId}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load links");
      setRows(json.data || []);
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function addLinks() {
    const urls = text
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    if (urls.length === 0) return;

    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/campaign-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId, urls }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to add links");

      setText("");
      await load();
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setAdding(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.views += Number(r.views || 0);
        acc.likes += Number(r.likes || 0);
        acc.comments += Number(r.comments || 0);
        acc.shares += Number(r.shares || 0);
        acc.saves += Number(r.saves || 0);
        return acc;
      },
      { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 }
    );
  }, [rows]);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <a href="/" style={{ textDecoration: "none" }}>← Volver</a>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>Campaign</h1>
          <div style={{ fontSize: 12, opacity: 0.7 }}>ID: {campaignId}</div>
        </div>

        <button
          onClick={load}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "white",
            cursor: "pointer",
            height: 40,
          }}
        >
          Refresh
        </button>
      </div>

      <section
        style={{
          marginTop: 16,
          padding: 14,
          border: "1px solid #eaeaea",
          borderRadius: 12,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Agregar links de TikTok</h2>
        <p style={{ marginTop: 0, opacity: 0.7 }}>
          Pega 1 link por línea. Máximo 500 por campaña.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`https://www.tiktok.com/@user/video/123...\nhttps://vm.tiktok.com/....`}
          rows={6}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ddd",
            fontSize: 13,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          }}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button
            onClick={addLinks}
            disabled={adding || !text.trim()}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #111",
              background: adding ? "#444" : "#111",
              color: "white",
              cursor: adding ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            {adding ? "Agregando..." : "Agregar links"}
          </button>
          <button
            onClick={() => setText("")}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "white",
              cursor: "pointer",
            }}
          >
            Limpiar
          </button>
        </div>

        {error && <div style={{ marginTop: 10, color: "#b00020" }}>{error}</div>}
      </section>

      <section style={{ marginTop: 16 }}>
        <h2 style={{ marginBottom: 10 }}>Totales de la campaña</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          {[
            ["Views", totals.views],
            ["Likes", totals.likes],
            ["Comments", totals.comments],
            ["Shares", totals.shares],
            ["Saves", totals.saves],
          ].map(([label, val]) => (
            <div
              key={String(label)}
              style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{Number(val).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ marginBottom: 10 }}>Links ({rows.length})</h2>

        <div style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 14, opacity: 0.7 }}>Cargando...</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 14, opacity: 0.7 }}>No has agregado links todavía.</div>
          ) : (
            <div style={{ width: "100%", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#fafafa" }}>
                    {["URL", "Views", "Likes", "Comments", "Shares", "Status", "Updated"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: 12,
                          borderBottom: "1px solid #eee",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} style={{ borderTop: "1px solid #f2f2f2" }}>
                      <td style={{ padding: 12, maxWidth: 420 }}>
                        <a href={r.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                          {r.url}
                        </a>
                      </td>
                      <td style={{ padding: 12 }}>{Number(r.views || 0).toLocaleString()}</td>
                      <td style={{ padding: 12 }}>{Number(r.likes || 0).toLocaleString()}</td>
                      <td style={{ padding: 12 }}>{Number(r.comments || 0).toLocaleString()}</td>
                      <td style={{ padding: 12 }}>{Number(r.shares || 0).toLocaleString()}</td>
                      <td style={{ padding: 12 }}>{r.status}</td>
                      <td style={{ padding: 12, whiteSpace: "nowrap", opacity: 0.7 }}>
                        {r.last_updated_at ? new Date(r.last_updated_at).toLocaleString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <div style={{ marginTop: 18, fontSize: 12, opacity: 0.6 }}>
        Próximo: conectar Apify y refrescar métricas automáticamente cada 15 min.
      </div>
    </main>
  );
}
