"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/tokens", label: "Tokens" },
  { href: "/create-token", label: "Crear Token" },
  { href: "/my-bonds", label: "Mis Bonos" },
  { href: "/history", label: "Historial" },
  { href: "/faucet", label: "Faucet" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header style={{
      background: "#1e293b",
      borderBottom: "1px solid #334155",
      padding: "12px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <nav style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <span style={{ fontSize: "20px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
          Bond dApp
        </span>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: isActive ? "#818cf8" : "#94a3b8",
                fontWeight: isActive ? 600 : 500,
                fontSize: "14px",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e2e8f0")}
              onMouseLeave={(e) => (e.currentTarget.style.color = isActive ? "#818cf8" : "#94a3b8")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <WalletMultiButton />
    </header>
  );
}
