"use client";

import { useEffect, useMemo, useState } from "react";

const EVERY_15_MIN = 15 * 60 * 1000;

type LinkRow = {
  id: string;
  url: string;
  canonical_url?: string | null;
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  saves?: number | null;
  status?: string | null;
  last_error?: string | null;
  last_updated_at?: string | null;
  created_at?: string | null;
};

export default function CampaignPage({ params }: { params: { id: string } }) {
  const campaignId = params.id;

  const [text, setText] = useState("");
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [lastRefreshResult, setLastRefreshResult] = useState<any>(null);

  const totals = useMemo(() => {
    return links.reduce(
      (a, l) => {
        a.views += Number(l.views || 0);
        a.likes += Number(l.likes || 0);
        a.comments += Number(l.comments || 0);
        a.shares += Number(l.shares || 0);
        a.saves += Number(l.saves || 0);
        return a;
      },
      { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 }
    );
  }, [links]);

  async function loadLinks() {
    const res = await fetch(`/api/campaign-links?campaignId=${campaignId}`, {
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    setLinks(Array.isArray(json?.data) ? json.data : []);
  }

  async function addLinks() {
    const urls = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 500);

    if (!urls.length) return;

    setBusy(true);
    try {
      const res = await fetch("/api/campaign-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, urls }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || "Error agregando links");
      }

      setText("");
      await loadLinks();
    } finally {
      setBusy(false);
    }
  }

  async function refreshNow() {
    setBusy(true);
    try {
      const res = await fetch(`/api/refresh?campaignId=${campaignId}`, {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));

      // ✅ Esto te muestra en pantalla qué pasó (updated, apifyItems, error, etc.)
      setLastRefreshResult(json);

      if (!res.ok) {
        alert(json?.error || "Refresh error (mira el cuadro de debug)");
      }

      await loadLinks();
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadLinks();

    // Auto refresh cada 15 min mientras esta página esté abierta
    const t = setInterval(() => {
      refreshNow();
    }, EVERY_15_MIN);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  return (
    <div style={{ padding: 24, maxWidth: 1150, margin: "0 auto" }}>
      <a href="/" style={{ display: "inline-block", marginBottom: 12 }}>
        ← Volver
      </a>

      <h1 style={{ margin: 0 }}>Campaign</h1>
      <p style={{ marginTop: 6, color: "#666" }}>ID: {campaignId}</p>

      <div
        style={{
          border: "1px solid #eee",
          padding: 16,
          borderRadius: 10,
          marginTop: 14,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Agregar links de TikTok</h2>
        <p style={{ marginTop: 6, color: "#666" }}>
          Pega <b>1 link por línea</b>. Máximo 500 por campaña.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          style={{ width: "100%", padding: 12 }}
          placeholder="https://www.tiktok.com/@user/video/...\nhttps://vt.tiktok.com/..."
        />

        <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
          <button onClick={addLinks} disabled={busy}>
            {busy ? "..." : "Agregar links"}
          </button>

          <button onClick={() => setText("")} disabled={busy}>
            Limpiar
          </button>

          <div style={{ flex: 1 }} />

          <button onClick={refreshNow} disabled={busy}>
            {busy ? "Actualizando..." : "Refresh (Apify)"}
          </button>
        </div>
      </div>

      {/* ✅ Debug box para saber qué está pasando realmente */}
      <div
        style={{
          marginTop: 14,
          padding: 12,
          border: "1px dashed #ddd",
          borderRadius: 10,
          background: "#fafafa",
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <b>Debug refresh</b>
          <span style={{ color: "#666" }}>
            (te muestra la respuesta real del POST /api/refresh)
          </span>
        </div>

        <pre style={{ whiteSpace: "pre-wrap", margin: 0, marginTop: 8 }}>
          {lastRefreshResult ? JSON.stringify(lastRefreshResult, null, 2) : "Aún no has dado Refresh (Apify)."}
        </pre>
      </div>

      <h2 style={{ marginTop: 18 }}>Totales</h2>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        <div>Views: {totals.views}</div>
        <div>Likes: {totals.likes}</div>
        <div>Comments: {totals.comments}</div>
        <div>Shares: {totals.shares}</div>
        <div>Saves: {totals.saves}</div>
      </div>

      <h2 style={{ marginTop: 18 }}>Links ({links.length})</h2>

      <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 10 }}>
                URL
              </th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 10 }}>Views</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 10 }}>Likes</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 10 }}>Comments</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 10 }}>Shares</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 10 }}>Saves</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 10 }}>Status</th>
              <th style={{ borderBottom: "1px solid #ddd", padding: 10 }}>Updated</th>
            </tr>
          </thead>

          <tbody>
            {links.map((l) => (
              <tr key={l.id}>
                <td style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}>
                  <a href={l.url} target="_blank" rel="noreferrer">
                    {l.url}
                  </a>
                  {l.canonical_url ? (
                    <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                      canonical: {l.canonical_url}
                    </div>
                  ) : null}
                  {l.last_error ? (
                    <div style={{ color: "#b00020", fontSize: 12, marginTop: 4 }}>
                      error: {l.last_error}
                    </div>
                  ) : null}
                </td>

                <td style={{ padding: 10, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                  {l.views || 0}
                </td>
                <td style={{ padding: 10, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                  {l.likes || 0}
                </td>
                <td style={{ padding: 10, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                  {l.comments || 0}
                </td>
                <td style={{ padding: 10, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                  {l.shares || 0}
                </td>
                <td style={{ padding: 10, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                  {l.saves || 0}
                </td>

                <td style={{ padding: 10, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                  {l.status || "-"}
                </td>

                <td style={{ padding: 10, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                  {l.last_updated_at ? new Date(l.last_updated_at).toLocaleString() : "-"}
                </td>
              </tr>
            ))}

            {links.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 14, color: "#666" }}>
                  No hay links todavía. Pega links arriba y presiona “Agregar links”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 14, color: "#666" }}>
        Auto-refresh: cada 15 minutos mientras esta página esté abierta.
      </p>
    </div>
  );
}
