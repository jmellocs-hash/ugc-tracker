"use client";

import { useEffect, useRef, useState } from "react";

const REFRESH_EVERY_MS = 15 * 60 * 1000;

export default function CampaignPage({ params }: any) {
  const campaignId = params.id;

  const [links, setLinks] = useState<any[]>([]);
  const [totals, setTotals] = useState({
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const inFlight = useRef(false);

  // ===============================
  // CARGAR LINKS DESDE TU API
  // ===============================
  async function loadLinks() {
    const res = await fetch(`/api/campaign-links?campaignId=${campaignId}`);
    const json = await res.json();

    const data = json?.data || [];
    setLinks(data);

    // Calcular totales
    const totals = data.reduce(
      (acc: any, l: any) => {
        acc.views += l.views || 0;
        acc.likes += l.likes || 0;
        acc.comments += l.comments || 0;
        acc.shares += l.shares || 0;
        acc.saves += l.saves || 0;
        return acc;
      },
      { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 }
    );

    setTotals(totals);
  }

  // ===============================
  // EJECUTAR REFRESH (APIFY + SUPABASE)
  // ===============================
  async function runRefresh() {
    if (!campaignId) return;
    if (inFlight.current) return;

    inFlight.current = true;
    setRefreshing(true);

    try {
      const res = await fetch(
        `/api/refresh?campaignId=${campaignId}`,
        { method: "POST" }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Refresh error:", json);
      }

      await loadLinks();
      setLastUpdated(new Date().toISOString());
    } catch (e) {
      console.error("Refresh failed:", e);
    } finally {
      setRefreshing(false);
      inFlight.current = false;
    }
  }

  // ===============================
  // AUTO REFRESH CADA 15 MIN
  // ===============================
  useEffect(() => {
    loadLinks();

    // Opcional: actualizar apenas entras
    runRefresh();

    const interval = setInterval(() => {
      runRefresh();
    }, REFRESH_EVERY_MS);

    return () => clearInterval(interval);
  }, [campaignId]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Campaign</h1>

      <div style={{ marginBottom: 20 }}>
        <button onClick={runRefresh} disabled={refreshing}>
          {refreshing ? "Actualizando..." : "Refresh"}
        </button>

        {lastUpdated && (
          <p>
            Última actualización:{" "}
            {new Date(lastUpdated).toLocaleString()}
          </p>
        )}
      </div>

      <h2>Totales</h2>
      <div style={{ display: "flex", gap: 20 }}>
        <div>Views: {totals.views}</div>
        <div>Likes: {totals.likes}</div>
        <div>Comments: {totals.comments}</div>
        <div>Shares: {totals.shares}</div>
        <div>Saves: {totals.saves}</div>
      </div>

      <h2 style={{ marginTop: 30 }}>Links</h2>
      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>URL</th>
            <th>Views</th>
            <th>Likes</th>
            <th>Comments</th>
            <th>Shares</th>
            <th>Saves</th>
          </tr>
        </thead>
        <tbody>
          {links.map((l) => (
            <tr key={l.id}>
              <td>{l.url}</td>
              <td>{l.views}</td>
              <td>{l.likes}</td>
              <td>{l.comments}</td>
              <td>{l.shares}</td>
              <td>{l.saves}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
}
