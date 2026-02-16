"use client";

import { useEffect, useState } from "react";

type Campaign = {
  id: string;
  name: string;
  created_at: string;
};

export default function Home() {
  const [name, setName] = useState("");
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load campaigns");
      setItems(json.data || []);
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function createCampaign() {
    const n = name.trim();
    if (!n) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to create");
      setName("");
      await load();
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 6 }}>UGC Tracker</h1>
      <p style={{ marginTop: 0, opacity: 0.7 }}>
        Crea campañas y agrega links de TikTok (como Cobrand).
      </p>

      <section
        style={{
          display: "flex",
          gap: 10,
          marginTop: 16,
          padding: 14,
          border: "1px solid #e5e5e5",
          borderRadius: 12,
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de campaña (ej: Ryan Castro - UGC Feb)"
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ddd",
            fontSize: 14,
          }}
        />
        <button
          onClick={createCampaign}
          disabled={creating || !name.trim()}
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #111",
            background: creating ? "#444" : "#111",
            color: "white",
            cursor: creating ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {creating ? "Creando..." : "Crear"}
        </button>
      </section>

      {error && (
        <div style={{ marginTop: 12, color: "#b00020" }}>
          {error}
        </div>
      )}

      <section style={{ marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Campaigns</h2>
          <button
            onClick={load}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "white",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>

        <div
          style={{
            marginTop: 10,
            border: "1px solid #eee",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: 14, opacity: 0.7 }}>Cargando...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 14, opacity: 0.7 }}>
              No hay campañas todavía. Crea la primera arriba 👆
            </div>
          ) : (
            items.map((c) => (
              <a
                key={c.id}
                href={`/campaigns/${c.id}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: 14,
                  borderTop: "1px solid #f1f1f1",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{c.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{new Date(c.created_at).toLocaleString()}</div>
                </div>
                <div style={{ opacity: 0.7 }}>Abrir →</div>
              </a>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
