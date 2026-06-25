"use client";
import "./globals.css";
import { GlobalProvider, useGlobalContext } from "./GlobalContext";
import React from "react";
import { FaGavel } from "react-icons/fa";

function Header() {
  const { walletAddress, login, logout } = useGlobalContext();
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 text-xl font-bold text-blue-600">
        <FaGavel /> Solana Subastas
      </div>
      <div className="flex items-center gap-3">
        {walletAddress ? (
          <>
            <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded-lg">
              {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
            </span>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={login}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            Login with Phantom
          </button>
        )}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="text-center py-4 border-t border-gray-200 text-gray-400 text-sm mt-auto">
      © 2025 Solana Subastas — Powered by Solana Blockchain
    </footer>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-50">
        <GlobalProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </GlobalProvider>
      </body>
    </html>
  );
}
