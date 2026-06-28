"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

const card: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: "12px",
  padding: "24px",
};

const labelStyle: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "13px",
  fontWeight: 600,
  marginBottom: "6px",
  display: "block",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  background: "#0f172a",
  border: "1px solid #475569",
  color: "#fff",
  fontSize: "15px",
  outline: "none",
};

const fieldWrap: React.CSSProperties = { marginBottom: "16px" };

export default function CreateTokenPage() {
  const { publicKey } = useWallet();

  const [tokenType, setTokenType] = useState<"stablecoin" | "bond">("stablecoin");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState("0");
  const [supply, setSupply] = useState("");
  const [nominal, setNominal] = useState("");
  const [tasaInteres, setTasaInteres] = useState("");
  const [years, setYears] = useState("");
  const [stablecoinMint, setStablecoinMint] = useState("");
  const [pricePerBond, setPricePerBond] = useState("");
  const [status, setStatus] = useState("");

  const handleCreate = async () => {
    if (!publicKey) return;
    setStatus("Registrando token...");
    try {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mintAddress: "pending",
          name, symbol,
          type: tokenType,
          decimals: Number(decimals),
          supply: Number(supply),
          creatorWallet: publicKey.toString(),
          ...(tokenType === "bond" && {
            nominal: Number(nominal), tasaInteres: Number(tasaInteres),
            years: Number(years), stablecoinMint,
            pricePerBond: Number(pricePerBond),
            issuerWallet: publicKey.toString(),
          }),
        }),
      });
      if (!res.ok) throw new Error("Error guardando en MongoDB");
      setStatus("Token registrado en MongoDB. Usa el Faucet para crear el mint SPL on-chain.");
      setName(""); setSymbol(""); setSupply("");
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  if (!publicKey) {
    return (
      <div style={{ ...card, maxWidth: "400px", margin: "40px auto", textAlign: "center", borderColor: "#eab308" }}>
        <p style={{ color: "#fbbf24", fontWeight: 600, fontSize: "16px" }}>Conecta tu wallet primero</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "520px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#fff", marginBottom: "24px" }}>Crear Token</h1>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        {(["stablecoin", "bond"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTokenType(t)}
            style={{
              padding: "10px 20px", borderRadius: "8px", border: "1px solid",
              borderColor: tokenType === t ? (t === "stablecoin" ? "#3b82f6" : "#059669") : "#475569",
              background: tokenType === t ? (t === "stablecoin" ? "#3b82f6" : "#059669") : "#1e293b",
              color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "14px",
            }}
          >
            {t === "stablecoin" ? "Stablecoin" : "Bono"}
          </button>
        ))}
      </div>

      <div style={card}>
        <div style={fieldWrap}>
          <label style={labelStyle}>Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="USD Coin" />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Simbolo</label>
          <input value={symbol} onChange={(e) => setSymbol(e.target.value)} style={inputStyle} placeholder="USDC" />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Decimales</label>
          <input type="number" value={decimals} onChange={(e) => setDecimals(e.target.value)} style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Supply inicial</label>
          <input type="number" value={supply} onChange={(e) => setSupply(e.target.value)} style={inputStyle} placeholder="1000000" />
        </div>

        {tokenType === "bond" && (
          <>
            <div style={{ borderTop: "1px solid #334155", margin: "20px 0", paddingTop: "20px" }}>
              <p style={{ color: "#34d399", fontWeight: 700, fontSize: "14px", marginBottom: "16px" }}>Datos del bono</p>
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Valor nominal</label>
              <input type="number" value={nominal} onChange={(e) => setNominal(e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Tasa de interes (%)</label>
              <input type="number" value={tasaInteres} onChange={(e) => setTasaInteres(e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Plazo (años)</label>
              <input type="number" value={years} onChange={(e) => setYears(e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Stablecoin Mint (para listing)</label>
              <input value={stablecoinMint} onChange={(e) => setStablecoinMint(e.target.value)} style={{ ...inputStyle, fontFamily: "monospace", fontSize: "13px" }} placeholder="Mint address" />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Precio por bono (en stablecoins)</label>
              <input type="number" value={pricePerBond} onChange={(e) => setPricePerBond(e.target.value)} style={inputStyle} />
            </div>
          </>
        )}

        <button
          onClick={handleCreate}
          disabled={!name || !symbol}
          style={{
            width: "100%", padding: "12px", borderRadius: "8px", border: "none",
            background: !name || !symbol ? "#475569" : "#6366f1",
            color: "#fff", fontWeight: 700, fontSize: "16px", cursor: "pointer",
            marginTop: "8px",
          }}
        >
          Registrar Token
        </button>

        {status && <p style={{ color: "#fbbf24", fontSize: "14px", marginTop: "12px" }}>{status}</p>}
      </div>
    </div>
  );
}
