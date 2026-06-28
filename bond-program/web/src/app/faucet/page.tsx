"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

interface Token {
  mintAddress: string;
  name: string;
  symbol: string;
  type: string;
}

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

export default function FaucetPage() {
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedMint, setSelectedMint] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/tokens")
      .then((r) => r.json())
      .then((t: Token[]) => setTokens(t.filter((tk) => tk.mintAddress !== "pending")));
  }, []);

  const handleFaucet = async () => {
    if (!publicKey || !selectedMint || !amount) return;
    setStatus("Enviando tokens...");
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mint: selectedMint, destination: publicKey.toString(), amount: Number(amount) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStatus(`Tokens enviados! ATA: ${data.ata}`);
      setAmount("");
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
      <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>Faucet</h1>
      <p style={{ color: "#94a3b8", marginBottom: "24px" }}>Recibe tokens de prueba en tu wallet (solo localnet).</p>

      <div style={card}>
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Token</label>
          <select value={selectedMint} onChange={(e) => setSelectedMint(e.target.value)} style={inputStyle}>
            <option value="">Selecciona un token</option>
            {tokens.map((t) => (
              <option key={t.mintAddress} value={t.mintAddress}>
                {t.name} ({t.symbol}) - {t.mintAddress.slice(0, 12)}...
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Cantidad</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} placeholder="1000" />
        </div>
        <button
          onClick={handleFaucet}
          disabled={!selectedMint || !amount}
          style={{
            width: "100%", padding: "12px", borderRadius: "8px", border: "none",
            background: !selectedMint || !amount ? "#475569" : "#7c3aed",
            color: "#fff", fontWeight: 700, fontSize: "16px", cursor: "pointer",
          }}
        >
          Recibir Tokens
        </button>
        {status && <p style={{ color: "#fbbf24", fontSize: "14px", marginTop: "12px" }}>{status}</p>}
      </div>
    </div>
  );
}
