"use client";
import Link from "next/link";
import { FaGavel } from "react-icons/fa";

export default function Home() {
  return (
    <div className="max-w-lg mx-auto mt-24 text-center px-4">
      <div className="text-6xl text-blue-600 mb-6 flex justify-center">
        <FaGavel />
      </div>
      <h1 className="text-3xl font-bold mb-4">Bienvenido a Solana Subastas</h1>
      <p className="text-lg text-gray-600 mb-8">
        Aplicación descentralizada para crear y participar en subastas sobre la blockchain de Solana.
        <br />
        Conéctate con tu wallet Phantom para comenzar.
      </p>
      <Link
        href="/dashboard"
        className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition shadow-md"
      >
        Ir al Dashboard
      </Link>
    </div>
  );
}
