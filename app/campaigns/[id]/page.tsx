"use client";

import { useEffect, useMemo, useState } from "react";

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
};

const EVERY_15_MIN = 15 * 60 * 1000;

export default function CampaignPage({ params }: { params: { id: string } }) {
  const campaignId = params.id;

  const [text, setText] = useState("");
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [debug, setDebug] = useState<any>(null);

  const totals = useMemo(() => {
    return links.reduce(
      (acc, l) => {
        acc.views += Number(l.views || 0);
        acc.likes += Number(l.likes || 0);
        acc.comments += Number(l.comments || 0);
        acc.shares += Number(l.shares || 0);
        acc.saves += Number(l.saves || 0);
        return acc;
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

    if (urls.length === 0) return;

    setBusy(true);
    try {
      const res = await fetch("/api/campaign-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, urls }),
      });

      const json = await res.json().catch(() => ({}));
      setDebug(json);

      if (!res.ok) {
        alert(json?.error || "Error agregando links");
        return;
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
      setDebug(json);

      if (!res.ok) {
        alert(json?.error || "Refresh error");
        return;
      }

      await loadLinks();
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadLinks();
    const t = setInterval(() => {
      refreshNow();
    }, EVERY_15_MIN);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <a href="/" style={{ display: "inline-block", marginBottom: 12 }}>
        ← Volver
      </a>

      <h1 style={{ margin: 0 }}>Campaign</h1>
      <div style={{ color: "#666", marginTop: 6 }}>ID: {campaignId}</div>

      <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 16, marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Agregar links de TikTok</h2>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ddd" }}
          placeholder="1 link por línea (máx 500)
https://vt.tiktok.com/...
https://www.tiktok.com/@user/video/..."
        />

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
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

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 16 }}>
        <div><b>Views:</b> {totals.views}</div>
        <div><b>Likes:</b> {totals.likes}</div>
        <div><b>Comments:</b> {totals.comments}</div>
        <div><b>Shares:</b> {totals.shares}</div>
        <div><b>Saves:</b> {totals.saves}</div>
      </div>

      <div style={{ marginTop: 16, border: "1px dashed #ddd", borderRadius: 10, padding: 12, background: "#fafafa" }}>
        <b>Debug</b>
        <pre style={{ margin: 0, marginTop: 8, whiteSpace: "pre-wrap" }}>
          {debug ? JSON.stringify(debug, null, 2) : "Dale Refresh (Apify) para ver qué devuelve /api/refresh"}
        </pre>
      </div>

      <h2 style={{ marginTop: 18 }}>Links ({links.length})</h2>

      <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 90px 90px 90px 110px 160px", gap: 0, background: "#f6f6f6", padding: 10, fontWeight: 600 }}>
          <div>URL</div>
          <div style={{ textAlign: "center" }}>Views</div>
          <div style={{ textAlign: "center" }}>Likes</div>
          <div style={{ textAlign: "center" }}>Comments</div>
          <div style={{ textAlign: "center" }}>Shares</div>
          <div style={{ textAlign: "center" }}>Saves</div>
          <div style={{ textAlign: "center" }}>Status</div>
          <div style={{ textAlign: "center" }}>Updated</div>
        </div>

        {links.length === 0 ? (
          <div style={{ padding: 12, color: "#666" }}>No hay links todavía.</div>
        ) : (
          links.map((l) => (
            <div
              key={l.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 90px 90px 90px 90px 90px 110px 160px",
                padding: 10,
                borderTop: "1px solid #eee",
                alignItems: "center",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <a href={l.url} target="_blank" rel="noreferrer">
                  {l.url}
                </a>
                {l.last_error ? (
                  <div style={{ color: "#b00020", fontSize: 12, marginTop: 4 }}>
                    {l.last_error}
                  </div>
                ) : null}
              </div>

              <div style={{ textAlign: "center" }}>{l.views || 0}</div>
              <div style={{ textAlign: "center" }}>{l.likes || 0}</div>
              <div style={{ textAlign: "center" }}>{l.comments || 0}</div>
              <div style={{ textAlign: "center" }}>{l.shares || 0}</div>
              <div style={{ textAlign: "center" }}>{l.saves || 0}</div>
              <div style={{ textAlign: "center" }}>{l.status || "-"}</div>
              <div style={{ textAlign: "center", fontSize: 12, color: "#666" }}>
                {l.last_updated_at ? new Date(l.last_updated_at).toLocaleString() : "-"}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 12, color: "#666" }}>
        Auto-refresh cada 15 min (mientras la página esté abierta).
      </div>
    </div>
  );
}
}
