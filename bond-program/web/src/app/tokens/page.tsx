"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Token {
  _id: string;
  mintAddress: string;
  name: string;
  symbol: string;
  type: "stablecoin" | "bond";
  nominal?: number;
  tasaInteres?: number;
  years?: number;
}

const cardStyle: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: "12px",
  padding: "20px",
  textDecoration: "none",
  display: "block",
  transition: "border-color 0.2s, background 0.2s",
  cursor: "pointer",
};

const badgeStyle = (color: string): React.CSSProperties => ({
  display: "inline-block",
  background: color,
  color: "#fff",
  padding: "2px 10px",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
});

export default function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tokens")
      .then((r) => r.json())
      .then(setTokens)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: "#94a3b8", textAlign: "center", marginTop: "40px" }}>Cargando tokens...</p>;

  const stablecoins = tokens.filter((t) => t.type === "stablecoin");
  const bonds = tokens.filter((t) => t.type === "bond");

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#fff", marginBottom: "32px" }}>
        Tokens
      </h1>

      {/* Stablecoins */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#60a5fa" }}>Stablecoins</h2>
          <span style={badgeStyle("#3b82f6")}>{stablecoins.length}</span>
        </div>
        {stablecoins.length === 0 ? (
          <p style={{ color: "#64748b" }}>No hay stablecoins registradas</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {stablecoins.map((t) => (
              <Link key={t.mintAddress} href={`/tokens/${t.mintAddress}`} style={cardStyle}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#60a5fa"; e.currentTarget.style.background = "#253348"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.background = "#1e293b"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 700, color: "#fff" }}>
                    $
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: "18px" }}>{t.name}</span>
                      <span style={{ color: "#60a5fa", fontWeight: 600, fontSize: "14px" }}>{t.symbol}</span>
                    </div>
                    <p style={{ color: "#64748b", fontFamily: "monospace", fontSize: "13px", marginTop: "4px" }}>
                      {t.mintAddress}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bonos */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#34d399" }}>Bonos</h2>
          <span style={badgeStyle("#059669")}>{bonds.length}</span>
        </div>
        {bonds.length === 0 ? (
          <p style={{ color: "#64748b" }}>No hay bonos registrados</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {bonds.map((t) => (
              <Link key={t.mintAddress} href={`/tokens/${t.mintAddress}`} style={cardStyle}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#34d399"; e.currentTarget.style.background = "#253348"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.background = "#1e293b"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#065f46", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                      📄
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                        <span style={{ color: "#fff", fontWeight: 700, fontSize: "18px" }}>{t.name}</span>
                        <span style={{ color: "#34d399", fontWeight: 600, fontSize: "14px" }}>{t.symbol}</span>
                      </div>
                      <p style={{ color: "#64748b", fontFamily: "monospace", fontSize: "13px", marginTop: "4px" }}>
                        {t.mintAddress}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: "13px" }}>
                    {t.nominal != null && (
                      <p style={{ color: "#cbd5e1" }}>
                        Nominal: <span style={{ color: "#fff", fontWeight: 600 }}>{t.nominal}</span>
                      </p>
                    )}
                    {t.tasaInteres != null && (
                      <p style={{ color: "#cbd5e1" }}>
                        Tasa: <span style={{ color: "#34d399", fontWeight: 700 }}>{t.tasaInteres}%</span>
                      </p>
                    )}
                    {t.years != null && (
                      <p style={{ color: "#cbd5e1" }}>
                        Plazo: <span style={{ color: "#fff", fontWeight: 600 }}>{t.years} años</span>
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
