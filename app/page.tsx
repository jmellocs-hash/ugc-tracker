"use client";

import { useEffect, useRef, useState } from "react";

const REFRESH_EVERY_MS = 15 * 60 * 1000;

type LinkRow = {
  id: string;
  url: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  status?: string;
  last_updated_at?: string;
};

export default function CampaignPage({ params }: { params: { id: string } }) {
  const campaignId = params.id;

  const [links, setLinks] = useState<LinkRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const inFlight = useRef(false);

  const totals = links.reduce(
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

  async function loadLinks() {
    try {
      const res = await fetch(`/api/campaign-links?campaignId=${campaignId}`, {
        cache: "no-store",
      });
      const json = await res.json();
      setLinks(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      console.error("loadLinks error:", e);
      setLinks([]);
    }
  }

  async function runRefresh() {
    if (!campaignId) return;
    if (inFlight.current) return;

    inFlight.current = true;
    setRefreshing(true);

    try {
      const res = await fetch(`/api/refresh?campaignId=${campaignId}`, {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("refresh error:", json);
      }

      await loadLinks();
      setLastUpdated(new Date().toISOString());
    } catch (e) {
      console.error("runRefresh error:", e);
    } finally {
      setRefreshing(false);
      inFlight.current = false;
    }
  }

  useEffect(() => {
    loadLinks();
    // opcional: refrescar de una al entrar
    // runRefresh();

    const t = setInterval(() => {
      runRefresh();
    }, REFRESH_EVERY_MS);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  return (
    <div style={{ padding: 24 }}>
      <a href="/" style={{ display: "inline-block", marginBottom: 12 }}>
        ← Volver
      </a>

      <h1 style={{ margin: 0 }}>Campaign</h1>
      <p style={{ marginTop: 6, color: "#666" }}>ID: {campaignId}</p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 16 }}>
        <button onClick={runRefresh} disabled={refreshing}>
          {refreshing ? "Actualizando..." : "Refresh (Apify)"}
        </button>

        <button onClick={loadLinks} disabled={refreshing}>
          Recargar tabla
        </button>

        {lastUpdated && (
          <small style={{ color: "#666" }}>
            Última actualización: {new Date(lastUpdated).toLocaleString()}
          </small>
        )}
      </div>

      <h2 style={{ marginTop: 28 }}>Totales</h2>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div>Views: {totals.views}</div>
        <div>Likes: {totals.likes}</div>
        <div>Comments: {totals.comments}</div>
        <div>Shares: {totals.shares}</div>
        <div>Saves: {totals.saves}</div>
      </div>

      <h2 style={{ marginTop: 28 }}>Links ({links.length})</h2>

      <div style={{ overflowX: "auto" }}>
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
                  <a href={l.url} target="_blank" rel="noreferrer">
                    {l.url}
                  </a>
                </td>
                <td style={{ padding: 8, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                  {l.views || 0}
                </td>
                <td style={{ padding: 8, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                  {l.likes || 0}
                </td>
                <td style={{ padding: 8, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                  {l.comments || 0}
                </td>
                <td style={{ padding: 8, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                  {l.shares || 0}
                </td>
                <td style={{ padding: 8, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                  {l.saves || 0}
                </td>
                <td style={{ padding: 8, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                  {l.status || "-"}
                </td>
                <td style={{ padding: 8, textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
                  {l.last_updated_at ? new Date(l.last_updated_at).toLocaleString() : "-"}
                </td>
              </tr>
            ))}

            {links.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 12, color: "#666" }}>
                  No hay links todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
