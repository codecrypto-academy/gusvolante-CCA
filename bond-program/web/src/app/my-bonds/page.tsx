"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

interface Bonista {
  tokenMint: string;
  walletAddress: string;
  amount: number;
  averagePrice: number;
}

interface Token {
  mintAddress: string;
  name: string;
  symbol: string;
}

const card: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: "12px",
  padding: "20px",
  textDecoration: "none",
  display: "block",
  cursor: "pointer",
};

export default function MyBondsPage() {
  const { publicKey } = useWallet();
  const [holdings, setHoldings] = useState<(Bonista & { token?: Token })[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) return;
    setLoading(true);
    Promise.all([
      fetch("/api/tokens").then((r) => r.json()),
      fetch(`/api/compras?wallet=${publicKey.toString()}`).then((r) => r.json()),
    ]).then(([tokens]) => {
      const bondTokens = tokens.filter((t: Token & { type: string }) => t.type === "bond");
      Promise.all(
        bondTokens.map((t: Token & { mintAddress: string }) =>
          fetch(`/api/bonistas/${t.mintAddress}`)
            .then((r) => r.json())
            .then((bonistas: Bonista[]) => {
              const mine = bonistas.find((b) => b.walletAddress === publicKey.toString());
              return mine ? { ...mine, token: t } : null;
            })
        )
      ).then((results) => {
        setHoldings(results.filter(Boolean) as any);
        setLoading(false);
      });
    });
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div style={{ ...card, maxWidth: "400px", margin: "40px auto", textAlign: "center", borderColor: "#eab308" }}>
        <p style={{ color: "#fbbf24", fontWeight: 600, fontSize: "16px" }}>Conecta tu wallet primero</p>
      </div>
    );
  }

  if (loading) return <p style={{ color: "#94a3b8", textAlign: "center", marginTop: "40px" }}>Cargando...</p>;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#fff", marginBottom: "24px" }}>Mis Bonos</h1>
      {holdings.length === 0 ? (
        <p style={{ color: "#64748b" }}>No tienes bonos aun</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {holdings.map((h) => (
            <Link key={h.tokenMint} href={`/tokens/${h.tokenMint}`} style={card}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#34d399"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#334155"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: "18px" }}>
                    {h.token?.name || h.tokenMint.slice(0, 8)}
                  </span>
                  {h.token && (
                    <span style={{ color: "#34d399", fontWeight: 600, marginLeft: "8px" }}>({h.token.symbol})</span>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: "18px" }}>{h.amount} bonos</p>
                  <p style={{ color: "#94a3b8", fontSize: "13px" }}>Precio prom: {h.averagePrice}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
