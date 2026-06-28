"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

interface Compra {
  _id: string;
  compradorWallet: string;
  bonoMint: string;
  stablecoinMint: string;
  cantidad: number;
  precioUnitario: number;
  signature: string;
  createdAt: string;
}

const card: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: "12px",
  padding: "24px",
};

const thStyle: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  padding: "10px 0",
  borderBottom: "1px solid #334155",
};

export default function HistoryPage() {
  const { publicKey } = useWallet();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) return;
    setLoading(true);
    fetch(`/api/compras?wallet=${publicKey.toString()}`)
      .then((r) => r.json())
      .then(setCompras)
      .finally(() => setLoading(false));
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div style={{ ...card, maxWidth: "400px", margin: "40px auto", textAlign: "center", borderColor: "#eab308" }}>
        <p style={{ color: "#fbbf24", fontWeight: 600, fontSize: "16px" }}>Conecta tu wallet primero</p>
      </div>
    );
  }

  if (loading) return <p style={{ color: "#94a3b8", textAlign: "center", marginTop: "40px" }}>Cargando...</p>;

  const explorerUrl = (sig: string) =>
    `https://explorer.solana.com/tx/${sig}?cluster=custom&customUrl=${encodeURIComponent(
      process.env.NEXT_PUBLIC_CLUSTER_URL || "http://localhost:8899"
    )}`;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#fff", marginBottom: "24px" }}>Historial de Compras</h1>
      {compras.length === 0 ? (
        <p style={{ color: "#64748b" }}>No hay compras registradas</p>
      ) : (
        <div style={{ ...card, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: "left" }}>Fecha</th>
                <th style={{ ...thStyle, textAlign: "left" }}>Bono Mint</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Cantidad</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Precio Unit.</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Total</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Tx</th>
              </tr>
            </thead>
            <tbody>
              {compras.map((c) => (
                <tr key={c._id} style={{ borderBottom: "1px solid #1e293b" }}>
                  <td style={{ padding: "12px 0", color: "#cbd5e1" }}>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "12px 0", fontFamily: "monospace", color: "#cbd5e1" }}>
                    {c.bonoMint.slice(0, 8)}...{c.bonoMint.slice(-4)}
                  </td>
                  <td style={{ textAlign: "right", color: "#fff", fontWeight: 600 }}>{c.cantidad}</td>
                  <td style={{ textAlign: "right", color: "#fff", fontWeight: 600 }}>{c.precioUnitario}</td>
                  <td style={{ textAlign: "right", color: "#34d399", fontWeight: 700 }}>{c.cantidad * c.precioUnitario}</td>
                  <td style={{ textAlign: "right" }}>
                    <a href={explorerUrl(c.signature)} target="_blank" rel="noopener noreferrer"
                      style={{ color: "#818cf8", textDecoration: "none" }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                    >
                      {c.signature.slice(0, 8)}...
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
