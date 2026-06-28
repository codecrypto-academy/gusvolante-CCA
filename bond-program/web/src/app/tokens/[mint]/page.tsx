"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useAnchorProgram } from "../../../hooks/useAnchorProgram";
import {
  getListingPda,
  getEscrowPda,
  fetchListing,
  purchaseBonds,
  initializeBondListing,
  updatePrice,
  addBondsToListing,
  cancelListing,
} from "../../../lib/anchor-bond-client";
import { PublicKey } from "@solana/web3.js";
import { getAccount } from "@solana/spl-token";
import Link from "next/link";

interface Token {
  mintAddress: string;
  name: string;
  symbol: string;
  type: string;
  nominal?: number;
  tasaInteres?: number;
  years?: number;
  issuerWallet?: string;
  stablecoinMint?: string;
  pricePerBond?: number;
}

interface Bonista {
  walletAddress: string;
  amount: number;
  averagePrice: number;
}

const card: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: "12px",
  padding: "20px",
};

const statBox: React.CSSProperties = {
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: "10px",
  padding: "16px",
};

const labelSt: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "12px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: "4px",
};

const valueSt: React.CSSProperties = {
  color: "#fff",
  fontSize: "22px",
  fontWeight: 700,
};

const inputSt: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  background: "#0f172a",
  border: "1px solid #475569",
  color: "#fff",
  fontSize: "15px",
  outline: "none",
};

const btnPrimary = (disabled: boolean, color = "#059669"): React.CSSProperties => ({
  padding: "10px 24px",
  borderRadius: "8px",
  border: "none",
  background: disabled ? "#475569" : color,
  color: "#fff",
  fontWeight: 700,
  fontSize: "15px",
  cursor: disabled ? "not-allowed" : "pointer",
});

export default function TokenDetailPage() {
  const { mint } = useParams<{ mint: string }>();
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useAnchorProgram();

  const [token, setToken] = useState<Token | null>(null);
  const [bonistas, setBonistas] = useState<Bonista[]>([]);
  const [listing, setListing] = useState<any>(null);
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Form states
  const [buyAmount, setBuyAmount] = useState("");
  const [listingAmount, setListingAmount] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/tokens")
      .then((r) => r.json())
      .then((tokens: Token[]) => setToken(tokens.find((t) => t.mintAddress === mint) || null))
      .finally(() => setLoading(false));

    fetch(`/api/bonistas/${mint}`)
      .then((r) => r.json())
      .then(setBonistas);
  }, [mint]);

  const loadListing = useCallback(async () => {
    if (!program || !token?.issuerWallet) return;
    try {
      const issuer = new PublicKey(token.issuerWallet);
      const bondMint = new PublicKey(mint);
      const listingPda = getListingPda(issuer, bondMint);
      const data = await fetchListing(program, listingPda);
      setListing(data);
      if (data) {
        const escrowPda = getEscrowPda(listingPda);
        const escrowAccount = await getAccount(connection, escrowPda);
        setEscrowBalance(Number(escrowAccount.amount));
      } else {
        setEscrowBalance(0);
      }
    } catch {
      setListing(null);
      setEscrowBalance(0);
    }
  }, [program, token, mint, connection]);

  useEffect(() => {
    loadListing();
  }, [loadListing]);

  const isIssuer = publicKey && token?.issuerWallet && publicKey.toString() === token.issuerWallet;

  const handleCreateListing = async () => {
    if (!program || !publicKey || !token?.stablecoinMint) return;
    setStatus("Creando listing on-chain...");
    try {
      const sig = await initializeBondListing(
        program,
        publicKey,
        new PublicKey(mint),
        new PublicKey(token.stablecoinMint),
        Number(listingAmount),
        Number(listingPrice)
      );
      setStatus(`Listing creado! Tx: ${sig.slice(0, 20)}...`);
      setListingAmount("");
      setListingPrice("");
      setTimeout(loadListing, 2000);
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const handleUpdatePrice = async () => {
    if (!program || !publicKey) return;
    setStatus("Actualizando precio...");
    try {
      const sig = await updatePrice(program, publicKey, new PublicKey(mint), Number(newPrice));
      setStatus(`Precio actualizado! Tx: ${sig.slice(0, 20)}...`);
      setNewPrice("");
      setTimeout(loadListing, 2000);
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const handleAddBonds = async () => {
    if (!program || !publicKey) return;
    setStatus("Agregando bonos al listing...");
    try {
      const sig = await addBondsToListing(program, publicKey, new PublicKey(mint), Number(addAmount));
      setStatus(`Bonos agregados! Tx: ${sig.slice(0, 20)}...`);
      setAddAmount("");
      setTimeout(loadListing, 2000);
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const handleCancelListing = async () => {
    if (!program || !publicKey) return;
    setStatus("Cancelando listing...");
    try {
      const sig = await cancelListing(program, publicKey, new PublicKey(mint));
      setStatus(`Listing cancelado! Bonos devueltos. Tx: ${sig.slice(0, 20)}...`);
      setTimeout(loadListing, 2000);
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const handleBuy = async () => {
    if (!program || !publicKey || !token?.issuerWallet || !token?.stablecoinMint) return;
    setStatus("Procesando compra...");
    try {
      const sig = await purchaseBonds(
        program, publicKey,
        new PublicKey(token.issuerWallet),
        new PublicKey(mint),
        new PublicKey(token.stablecoinMint),
        Number(buyAmount)
      );
      await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compradorWallet: publicKey.toString(),
          bonoMint: mint,
          stablecoinMint: token.stablecoinMint,
          cantidad: Number(buyAmount),
          precioUnitario: listing?.pricePerBond?.toNumber?.() || 0,
          signature: sig,
        }),
      });
      setStatus(`Compra exitosa! Tx: ${sig.slice(0, 20)}...`);
      setBuyAmount("");
      setTimeout(loadListing, 2000);
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  if (loading) return <p style={{ color: "#94a3b8", textAlign: "center", marginTop: "40px" }}>Cargando...</p>;
  if (!token) return <p style={{ color: "#ef4444", textAlign: "center", marginTop: "40px" }}>Token no encontrado</p>;

  const isBond = token.type === "bond";
  const accent = isBond ? "#34d399" : "#60a5fa";
  const hasActiveListing = listing && listing.isActive;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      {/* Back */}
      <Link href="/tokens" style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        color: "#94a3b8", textDecoration: "none", fontSize: "14px", fontWeight: 500,
        marginBottom: "20px",
      }}>
        ← Volver a Tokens
      </Link>

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "12px",
            background: isBond ? "#065f46" : "#1e40af",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px", fontWeight: 700, color: "#fff",
          }}>
            {isBond ? "📄" : "$"}
          </div>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", margin: 0 }}>
              {token.name} <span style={{ color: accent }}>({token.symbol})</span>
            </h1>
          </div>
        </div>
        <p style={{ color: "#64748b", fontFamily: "monospace", fontSize: "13px" }}>{token.mintAddress}</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "24px" }}>
        <div style={statBox}>
          <p style={labelSt}>Tipo</p>
          <p style={{ ...valueSt, fontSize: "18px", textTransform: "capitalize" }}>{token.type}</p>
        </div>
        {token.nominal != null && (
          <div style={statBox}>
            <p style={labelSt}>Nominal</p>
            <p style={valueSt}>{token.nominal}</p>
          </div>
        )}
        {token.tasaInteres != null && (
          <div style={statBox}>
            <p style={labelSt}>Tasa de interes</p>
            <p style={{ ...valueSt, color: "#34d399" }}>{token.tasaInteres}%</p>
          </div>
        )}
        {token.years != null && (
          <div style={statBox}>
            <p style={labelSt}>Plazo</p>
            <p style={valueSt}>{token.years} años</p>
          </div>
        )}
      </div>

      {/* Status message */}
      {status && (
        <div style={{ ...card, borderColor: "#eab308", marginBottom: "20px", padding: "14px 20px" }}>
          <p style={{ color: "#fbbf24", fontSize: "14px", margin: 0 }}>{status}</p>
        </div>
      )}

      {/* ISSUER: Crear Listing (solo si no hay listing activo) */}
      {isIssuer && !hasActiveListing && isBond && (
        <div style={{ ...card, borderColor: "#6366f1", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#818cf8", marginBottom: "16px" }}>
            Crear Listing
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "16px" }}>
            Sos el emisor de este bono. Crea un listing para ponerlo a la venta.
            Los bonos se transfieren a un escrow on-chain.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div>
              <p style={{ ...labelSt, marginBottom: "6px" }}>Cantidad de bonos</p>
              <input
                type="number" value={listingAmount}
                onChange={(e) => setListingAmount(e.target.value)}
                placeholder="1000" style={inputSt}
              />
            </div>
            <div>
              <p style={{ ...labelSt, marginBottom: "6px" }}>Precio por bono (stablecoins)</p>
              <input
                type="number" value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
                placeholder={String(token.pricePerBond || 100)} style={inputSt}
              />
            </div>
          </div>
          <button
            onClick={handleCreateListing}
            disabled={!listingAmount || !listingPrice}
            style={btnPrimary(!listingAmount || !listingPrice, "#6366f1")}
          >
            Crear Listing
          </button>
        </div>
      )}

      {/* Listing activo */}
      {hasActiveListing && (
        <div style={{ ...card, borderColor: "#065f46", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#34d399", marginBottom: "16px" }}>
            Listing activo
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
            <div style={statBox}>
              <p style={labelSt}>Precio/bono</p>
              <p style={valueSt}>{listing.pricePerBond?.toNumber?.() ?? listing.pricePerBond}</p>
            </div>
            <div style={statBox}>
              <p style={labelSt}>Disponibles</p>
              <p style={valueSt}>{listing.bondAmount?.toNumber?.() ?? listing.bondAmount}</p>
            </div>
            <div style={statBox}>
              <p style={labelSt}>En escrow</p>
              <p style={valueSt}>{escrowBalance}</p>
            </div>
          </div>

          {/* Buyer: Comprar */}
          {publicKey && !isIssuer && (
            <div>
              <p style={{ ...labelSt, marginBottom: "6px" }}>Cantidad a comprar</p>
              <div style={{ display: "flex", gap: "12px" }}>
                <input
                  type="number" value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  placeholder="0" style={{ ...inputSt, flex: 1 }}
                />
                <button
                  onClick={handleBuy}
                  disabled={!buyAmount || Number(buyAmount) <= 0}
                  style={btnPrimary(!buyAmount || Number(buyAmount) <= 0)}
                >
                  Comprar
                </button>
              </div>
              {buyAmount && Number(buyAmount) > 0 && (
                <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "8px" }}>
                  Total: <span style={{ color: "#fff", fontWeight: 700 }}>
                    {Number(buyAmount) * (listing.pricePerBond?.toNumber?.() ?? listing.pricePerBond)} stablecoins
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Issuer: Admin controls */}
          {isIssuer && (
            <div style={{ borderTop: "1px solid #334155", paddingTop: "20px", marginTop: "4px" }}>
              <p style={{ color: "#818cf8", fontWeight: 700, fontSize: "14px", marginBottom: "16px" }}>
                Panel del emisor
              </p>

              {/* Update price */}
              <div style={{ marginBottom: "16px" }}>
                <p style={{ ...labelSt, marginBottom: "6px" }}>Actualizar precio</p>
                <div style={{ display: "flex", gap: "12px" }}>
                  <input
                    type="number" value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Nuevo precio" style={{ ...inputSt, flex: 1 }}
                  />
                  <button
                    onClick={handleUpdatePrice}
                    disabled={!newPrice}
                    style={btnPrimary(!newPrice, "#3b82f6")}
                  >
                    Actualizar
                  </button>
                </div>
              </div>

              {/* Add bonds */}
              <div style={{ marginBottom: "16px" }}>
                <p style={{ ...labelSt, marginBottom: "6px" }}>Agregar bonos al listing</p>
                <div style={{ display: "flex", gap: "12px" }}>
                  <input
                    type="number" value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    placeholder="Cantidad" style={{ ...inputSt, flex: 1 }}
                  />
                  <button
                    onClick={handleAddBonds}
                    disabled={!addAmount}
                    style={btnPrimary(!addAmount, "#059669")}
                  >
                    Agregar
                  </button>
                </div>
              </div>

              {/* Cancel listing */}
              <button
                onClick={handleCancelListing}
                style={{
                  padding: "10px 24px", borderRadius: "8px",
                  border: "1px solid #dc2626", background: "transparent",
                  color: "#ef4444", fontWeight: 700, fontSize: "14px", cursor: "pointer",
                }}
              >
                Cancelar Listing (devolver bonos)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bonistas (solo para bonos) */}
      {isBond && (
      <div style={card}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>
          Bonistas
        </h2>
        {bonistas.length === 0 ? (
          <p style={{ color: "#64748b" }}>Ningun bonista aun</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #334155" }}>
                <th style={{ ...labelSt, textAlign: "left", padding: "8px 0" }}>Wallet</th>
                <th style={{ ...labelSt, textAlign: "right", padding: "8px 0" }}>Cantidad</th>
                <th style={{ ...labelSt, textAlign: "right", padding: "8px 0" }}>Precio prom.</th>
              </tr>
            </thead>
            <tbody>
              {bonistas.map((b) => (
                <tr key={b.walletAddress} style={{ borderBottom: "1px solid #1e293b" }}>
                  <td style={{ padding: "10px 0", fontFamily: "monospace", color: "#cbd5e1" }}>
                    {b.walletAddress.slice(0, 8)}...{b.walletAddress.slice(-6)}
                  </td>
                  <td style={{ textAlign: "right", color: "#fff", fontWeight: 600 }}>{b.amount}</td>
                  <td style={{ textAlign: "right", color: "#fff", fontWeight: 600 }}>{b.averagePrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      )}
    </div>
  );
}
