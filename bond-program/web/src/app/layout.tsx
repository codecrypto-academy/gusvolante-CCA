import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WalletProvider from "../components/WalletProvider";
import Header from "../components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bond dApp - Solana",
  description: "dApp de bonos de deuda en Solana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body style={{ background: "#0f172a", color: "#e2e8f0", minHeight: "100vh" }}>
        <WalletProvider>
          <Header />
          <main style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 24px" }}>{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
