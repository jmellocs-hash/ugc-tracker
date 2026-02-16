"use client";

import { useEffect, useMemo, useState } from "react";

const EVERY_15_MIN = 15 * 60 * 1000;

type LinkRow = {
  id: string;
  url: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  status: string;
  last_updated_at: string | null;
};

export default function CampaignPage({ params }: { params: { id: string } }) {
  const campaignId = params.id;

  const [text, setText] = useState("");
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [busy, setBusy] = useState(false);

  const totals = useMemo(() => {
    return links.reduce(
      (a, l) => {
        a.views += l.views || 0;
        a.likes += l.likes || 0;
        a.comments += l.comments || 0;
        a.shares += l.shares || 0;
        a.saves += l.saves || 0;
        return a;
      },
      { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 }
    );
  }, [links]);

  async function loadLinks() {
    const res = await fetch(`/api/campaign-links?campaignId=${campaignId}`, { cache: "no-store" });
    const json = await res.json();
    setLinks(json.data || []);
  }

  async function addLinks() {
    const urls = text.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 500);
    if (!urls.length) return;

    setBusy(true);
    try {
      const res = await fetch("/api/campaign-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, urls }),
      });
      const json = await res.json();
      if (!res.ok) alert(json.error || "error");
      setText("");
      await loadLinks();
    } finally {
      setBusy(false);
    }
  }

  async function refreshNow() {
    setBusy(true);
    try {
      const res = await fetch(`/api/refresh?campaignId=${campaignId}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) alert(json.error || "refresh error");
      await loadLinks();
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadLinks();
    const t = setInterval(() => refreshNow(), EVERY_15_MIN);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <a href="/">← Volver</a>
      <h1>Campaign</h1>
      <p>ID: {campaignId}</p>

      <div style={{ border: "1px solid #eee", padding: 16, borderRadius: 8 }}>
        <h2>Agregar links de TikTok</h2>
        <p>Pega 1 link por línea. Máximo 500 por campaña.</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          style={{ width: "100%", padding: 12 }}
          placeholder="https://www.tiktok.com/@user/video/...\nhttps://vt.tiktok.com/..."
        />
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button onClick={addLinks} disabled={busy}>Agregar links</button>
          <button onClick={() => setText("")} disabled={busy}>Limpiar</button>
          <div style={{ flex: 1 }} />
          <button onClick={refreshNow} disabled={busy}>Refresh (Apify)</button>
        </div>
      </div>

      <h2 style={{ marginTop: 18 }}>Totales</h2>
      <div style={{ display: "flex", gap: 18 }}>
        <div>Views: {totals.views}</div>
        <div>Likes: {totals.likes}</div>
        <div>Comments: {totals.comments}</div>
        <div>Shares: {totals.shares}</div>
        <div>Saves: {totals.saves}</div>
      </div>

      <h2 style={{ marginTop: 18 }}>Links ({links.length})</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>URL</th>
            <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Views</th>
            <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Likes</th>
            <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Comments</th>
            <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Shares</th>
            <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Saves</th>
            <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Status</th>
            <th style={{ borderBottom: "1px solid #ddd", padding: 8 }}>Updated</th>
          </tr>
        </thead>
        <tbody>
          {links.map((l) => (
            <tr key={l.id}>
              <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                <a href={l.url} target="_blank" rel="noreferrer">{l.url}</a>
              </td>
              <td style={{ padding: 8, textAlign: "center" }}>{l.views || 0}</td>
              <td style={{ padding: 8, textAlign: "center" }}>{l.likes || 0}</td>
              <td style={{ padding: 8, textAlign: "center" }}>{l.comments || 0}</td>
              <td style={{ padding: 8, textAlign: "center" }}>{l.shares || 0}</td>
              <td style={{ padding: 8, textAlign: "center" }}>{l.saves || 0}</td>
              <td style={{ padding: 8, textAlign: "center" }}>{l.status || "-"}</td>
              <td style={{ padding: 8, textAlign: "center" }}>
                {l.last_updated_at ? new Date(l.last_updated_at).toLocaleString() : "-"}
              </td>
            </tr>
          ))}
          {links.length === 0 && (
            <tr>
              <td colSpan={8} style={{ padding: 12, color: "#666" }}>No hay links todavía.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
}
