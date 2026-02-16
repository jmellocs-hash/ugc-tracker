export default function CampaignPage({ params }: { params: { id: string } }) {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <a href="/" style={{ textDecoration: "none" }}>← Volver</a>
      <h1 style={{ marginTop: 12 }}>Campaign</h1>
      <p style={{ opacity: 0.7 }}>ID: {params.id}</p>
      <p>En el siguiente paso: aquí vamos a agregar links y ver totales.</p>
    </main>
  );
}
