"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

const card: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: "12px",
  padding: "24px",
};

const stepStyle: React.CSSProperties = {
  display: "flex",
  gap: "16px",
  alignItems: "flex-start",
  marginBottom: "20px",
};

const stepNumber: React.CSSProperties = {
  width: "32px",
  height: "32px",
  borderRadius: "8px",
  background: "#6366f1",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: "14px",
  flexShrink: 0,
};

export default function Home() {
  const { connected, publicKey } = useWallet();

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "48px", marginTop: "32px" }}>
        <h1 style={{ fontSize: "44px", fontWeight: 800, color: "#fff", marginBottom: "12px" }}>
          Bond dApp
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "17px", lineHeight: 1.6, maxWidth: "560px", margin: "0 auto" }}>
          Marketplace descentralizado de bonos de deuda en Solana.
          Crea stablecoins, emite bonos, listalos para venta y permite compras atomicas.
        </p>
      </div>

      {connected ? (
        <div style={{ ...card, textAlign: "center", marginBottom: "32px" }}>
          <p style={{ color: "#34d399", fontWeight: 700, fontSize: "16px", marginBottom: "6px" }}>
            Wallet conectada
          </p>
          <p style={{ color: "#cbd5e1", fontFamily: "monospace", fontSize: "13px", wordBreak: "break-all" }}>
            {publicKey?.toString()}
          </p>
        </div>
      ) : (
        <div style={{ background: "#1e293b", borderTop: "1px solid #eab308", borderBottom: "1px solid #eab308", borderLeft: "1px solid #eab308", borderRight: "1px solid #eab308", borderRadius: "12px", padding: "24px", textAlign: "center", marginBottom: "32px" }}>
          <p style={{ color: "#fbbf24", fontWeight: 600, fontSize: "16px" }}>
            Conecta tu wallet Phantom para empezar
          </p>
        </div>
      )}

      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", marginBottom: "20px" }}>
        Como usar la dApp
      </h2>

      <div style={card}>
        <div style={stepStyle}>
          <div style={stepNumber}>1</div>
          <div>
            <p style={{ color: "#fff", fontWeight: 600, marginBottom: "4px" }}>Conecta tu wallet</p>
            <p style={{ color: "#94a3b8", fontSize: "14px" }}>
              Usa Phantom en Solana Localnet. El boton esta arriba a la derecha.
            </p>
          </div>
        </div>

        <div style={stepStyle}>
          <div style={{ ...stepNumber, background: "#3b82f6" }}>2</div>
          <div>
            <p style={{ color: "#fff", fontWeight: 600, marginBottom: "4px" }}>Explora los tokens</p>
            <p style={{ color: "#94a3b8", fontSize: "14px" }}>
              En <Link href="/tokens" style={{ color: "#60a5fa", textDecoration: "none" }}>Tokens</Link> ves
              las stablecoins y bonos disponibles con sus datos (nominal, tasa, plazo).
            </p>
          </div>
        </div>

        <div style={stepStyle}>
          <div style={{ ...stepNumber, background: "#059669" }}>3</div>
          <div>
            <p style={{ color: "#fff", fontWeight: 600, marginBottom: "4px" }}>Compra bonos</p>
            <p style={{ color: "#94a3b8", fontSize: "14px" }}>
              Entra al detalle de un bono, indica la cantidad y compra. La transaccion es atomica:
              pagas stablecoins y recibes bonos en una sola tx.
            </p>
          </div>
        </div>

        <div style={stepStyle}>
          <div style={{ ...stepNumber, background: "#7c3aed" }}>4</div>
          <div>
            <p style={{ color: "#fff", fontWeight: 600, marginBottom: "4px" }}>Faucet y gestiona</p>
            <p style={{ color: "#94a3b8", fontSize: "14px" }}>
              Usa el <Link href="/faucet" style={{ color: "#818cf8", textDecoration: "none" }}>Faucet</Link> para
              obtener tokens de prueba. Revisa tus tenencias en{" "}
              <Link href="/my-bonds" style={{ color: "#818cf8", textDecoration: "none" }}>Mis Bonos</Link> y
              el <Link href="/history" style={{ color: "#818cf8", textDecoration: "none" }}>Historial</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
