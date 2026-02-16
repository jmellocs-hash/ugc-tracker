"use client";

import { useEffect, useState } from "react";

type Campaign = { id: string; name: string; created_at: string };

export default function Home() {
  const [name, setName] = useState("");
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/campaigns", { cache: "no-store" });
    const json = await res.json();
    setItems(json.data || []);
  }

  async function create() {
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (res.ok) {
        setName("");
        await load();
        location.href = `/campaigns/${json.data.id}`;
      } else {
        alert(json.error || "error");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>UGC Tracker</h1>
      <p>Crea campañas y agrega links de TikTok.</p>

      <div style={{ display: "flex", gap: 12 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de campaña (ej: Ryan Castro - UGC Feb)"
          style={{ flex: 1, padding: 10 }}
        />
        <button onClick={create} disabled={loading || !name.trim()}>
          {loading ? "Creando..." : "Crear"}
        </button>
      </div>

      <h2 style={{ marginTop: 24 }}>Campaigns</h2>
      {items.length === 0 ? (
        <div style={{ padding: 12, border: "1px solid #eee" }}>
          No hay campañas todavía. Crea la primera arriba 👆
        </div>
      ) : (
        <ul>
          {items.map((c) => (
            <li key={c.id}>
              <a href={`/campaigns/${c.id}`}>{c.name}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
