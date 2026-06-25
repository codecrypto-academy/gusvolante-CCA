"use client";
import React, { useEffect, useState } from "react";
import { getSubastas, createSubasta, crearPuja, iniciarSubasta, finalizarSubasta } from "../subastasProxy";
import { useGlobalContext } from "../GlobalContext";
import Link from "next/link";

interface Subasta {
  id: string;
  nombre: string;
  descripcion: string;
  importeMinimo: string;
  fechaInicio: string;
  fechaFin: string;
  estado: number;
  publicKey: string;
  creador: string;
  ganador: string;
  importeGanador: string;
}

const ESTADO_LABEL: Record<number, string> = { 0: "Creada", 1: "Activa", 2: "Finalizada" };
const ESTADO_COLOR: Record<number, string> = {
  0: "bg-yellow-100 text-yellow-800",
  1: "bg-green-100 text-green-800",
  2: "bg-red-100 text-red-800",
};

export default function DashboardPage() {
  const { walletAddress } = useGlobalContext();
  const [subastas, setSubastas] = useState<Subasta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ nombre: "", descripcion: "", importeMinimo: "", fechaInicio: "", fechaFin: "" });
  const [pujaOpen, setPujaOpen] = useState<Record<string, boolean>>({});
  const [pujaValues, setPujaValues] = useState<Record<string, string>>({});
  const [pujando, setPujando] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, [walletAddress]);

  async function fetchData() {
    setLoading(true);
    try {
      const wallet = typeof window !== "undefined" ? window.solana : null;
      if (wallet) {
        const data = await getSubastas(wallet as never);
        setSubastas(data);
      }
    } catch (err) {
      console.error("Error fetching subastas:", err);
    }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const wallet = window.solana as never;
      await createSubasta(wallet, {
        ...form,
        fechaInicio: Math.floor(new Date(form.fechaInicio).getTime() / 1000).toString(),
        fechaFin: Math.floor(new Date(form.fechaFin).getTime() / 1000).toString(),
      });
      setForm({ nombre: "", descripcion: "", importeMinimo: "", fechaInicio: "", fechaFin: "" });
      setShowForm(false);
      await fetchData();
    } catch (err: unknown) {
      alert("Error al crear: " + (err instanceof Error ? err.message : err));
    }
    setCreating(false);
  }

  async function handleIniciar(id: string) {
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await iniciarSubasta(window.solana as never, id);
      await fetchData();
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : err));
    }
    setActionLoading((p) => ({ ...p, [id]: false }));
  }

  async function handleFinalizar(id: string) {
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await finalizarSubasta(window.solana as never, id);
      await fetchData();
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : err));
    }
    setActionLoading((p) => ({ ...p, [id]: false }));
  }

  async function handlePujar(e: React.FormEvent, id: string) {
    e.preventDefault();
    setPujando((p) => ({ ...p, [id]: true }));
    try {
      await crearPuja(window.solana as never, { id, importePuja: pujaValues[id] });
      setPujaOpen((f) => ({ ...f, [id]: false }));
      setPujaValues((v) => ({ ...v, [id]: "" }));
      await fetchData();
    } catch (err: unknown) {
      alert("Error al pujar: " + (err instanceof Error ? err.message : err));
    }
    setPujando((p) => ({ ...p, [id]: false }));
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h2 className="text-center text-2xl font-bold mb-6">🔨 Subastas Activas</h2>

      <button
        onClick={() => setShowForm((v) => !v)}
        className={`mb-6 px-6 py-2 rounded-lg font-semibold transition ${
          showForm ? "bg-gray-200 text-blue-600" : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {showForm ? "Cancelar" : "Crear Subasta"}
      </button>

      {showForm && (
        <form onSubmit={handleCreate} className="flex flex-col gap-3 mb-8 border border-gray-200 p-6 rounded-xl bg-white shadow-sm">
          <input required placeholder="Nombre" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md" />
          <input required placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md" />
          <input required type="number" placeholder="Importe mínimo" value={form.importeMinimo} onChange={(e) => setForm((f) => ({ ...f, importeMinimo: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md" />
          <input required type="datetime-local" value={form.fechaInicio} onChange={(e) => setForm((f) => ({ ...f, fechaInicio: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md" />
          <input required type="datetime-local" value={form.fechaFin} onChange={(e) => setForm((f) => ({ ...f, fechaFin: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md" />
          <button type="submit" disabled={creating}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50 transition">
            {creating ? "Creando..." : "Crear"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : subastas.length === 0 ? (
        <p className="text-gray-500">No hay subastas.</p>
      ) : (
        <ul className="space-y-4">
          {subastas.map((s) => (
            <li key={s.id} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold">{s.nombre} <span className="text-gray-400 text-sm">(ID: {s.id})</span></span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${ESTADO_COLOR[s.estado] || ""}`}>
                  {ESTADO_LABEL[s.estado] || s.estado}
                </span>
              </div>
              <p className="text-gray-600 mb-2">{s.descripcion}</p>
              <div className="text-sm text-gray-500 space-y-1">
                <div><b>Creador:</b> <span className="font-mono">{s.creador}</span></div>
                <div><b>Importe mínimo:</b> <span className="text-blue-600 font-bold">{s.importeMinimo}</span></div>
                <div>
                  <b>Inicio:</b> {new Date(Number(s.fechaInicio) * 1000).toLocaleString()} |{" "}
                  <b>Fin:</b> {new Date(Number(s.fechaFin) * 1000).toLocaleString()}
                </div>
                {s.importeGanador !== "0" && (
                  <div><b>Ganador actual:</b> <span className="font-mono">{s.ganador.slice(0, 8)}...</span> — <b>{s.importeGanador}</b></div>
                )}
                <div className="text-xs text-gray-400"><b>PDA:</b> {s.publicKey}</div>
              </div>

              <div className="flex gap-2 mt-3 flex-wrap">
                {s.estado === 0 && walletAddress === s.creador && (
                  <button onClick={() => handleIniciar(s.id)} disabled={actionLoading[s.id]}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition">
                    {actionLoading[s.id] ? "..." : "Iniciar"}
                  </button>
                )}
                {s.estado === 1 && (
                  <button onClick={() => setPujaOpen((f) => ({ ...f, [s.id]: !pujaOpen[s.id] }))}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition">
                    {pujaOpen[s.id] ? "Cancelar" : "Pujar"}
                  </button>
                )}
                {s.estado !== 2 && walletAddress === s.creador && (
                  <button onClick={() => handleFinalizar(s.id)} disabled={actionLoading[s.id]}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition">
                    {actionLoading[s.id] ? "..." : "Finalizar"}
                  </button>
                )}
                <Link href={`/dashboard/${s.id}`} className="text-blue-600 hover:underline text-sm font-medium self-center">
                  Ver detalle y pujas
                </Link>
              </div>

              {pujaOpen[s.id] && (
                <form onSubmit={(e) => handlePujar(e, s.id)} className="mt-3 flex gap-2 items-center">
                  <input required type="number" min={Number(s.importeMinimo)} placeholder="Importe"
                    value={pujaValues[s.id] || ""} onChange={(e) => setPujaValues((v) => ({ ...v, [s.id]: e.target.value }))}
                    className="px-3 py-1.5 border border-gray-300 rounded-md w-32" />
                  <button type="submit" disabled={pujando[s.id]}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition">
                    {pujando[s.id] ? "Pujando..." : "Confirmar Puja"}
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
