"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getSubastas, getPujas } from "../../subastasProxy";
import { FaGavel, FaUser, FaCrown, FaKey, FaMoneyBillWave } from "react-icons/fa";

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

interface Puja {
  id: string;
  importePuja: string;
  ts: string;
  pk: string;
  publicKey: string;
}

const ESTADO_LABEL: Record<number, string> = { 0: "Creada", 1: "Activa", 2: "Finalizada" };

export default function SubastaDetallePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;
  const [subasta, setSubasta] = useState<Subasta | null>(null);
  const [pujas, setPujas] = useState<Puja[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function fetchData() {
      setLoading(true);
      const wallet = typeof window !== "undefined" ? window.solana : null;
      if (wallet) {
        const subastas = await getSubastas(wallet as never);
        const found = subastas.find((s: Subasta) => s.id === id);
        setSubasta(found || null);
        if (found) {
          const pujasList = await getPujas(wallet as never, id!);
          setPujas(pujasList);
        }
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (!id) return <div className="p-8">No se proporcionó ID de subasta.</div>;
  if (loading) return <div className="p-8 text-gray-500">Cargando...</div>;
  if (!subasta) return <div className="p-8">Subasta no encontrada.</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-2xl p-8 mb-8 shadow-lg flex items-center gap-6">
        <div className="text-5xl bg-white/20 rounded-full p-4"><FaGavel /></div>
        <div className="flex-1">
          <h1 className="text-3xl font-black">{subasta.nombre}</h1>
          <p className="text-lg opacity-90 mb-2">{subasta.descripcion}</p>
          <div className="flex gap-3 items-center text-sm">
            <span className={`px-3 py-1 rounded-full font-bold ${
              subasta.estado === 2 ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"
            }`}>
              {ESTADO_LABEL[subasta.estado]}
            </span>
            <span>Inicio: {new Date(Number(subasta.fechaInicio) * 1000).toLocaleString()}</span>
            <span>|</span>
            <span>Fin: {new Date(Number(subasta.fechaFin) * 1000).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-2xl shadow-md p-8 mb-8 border-l-8 border-blue-600 max-w-xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <FaMoneyBillWave className="text-blue-600 text-xl" />
          <span className="font-bold text-lg">Importe mínimo:</span>
          <span className="text-blue-600 font-extrabold text-lg">{subasta.importeMinimo}</span>
        </div>
        <div className="flex items-center gap-3">
          <FaKey className="text-gray-500 text-lg" />
          <span className="font-bold">PDA:</span>
          <span className="font-mono text-sm truncate max-w-[220px]" title={subasta.publicKey}>{subasta.publicKey}</span>
        </div>
        <div className="flex items-center gap-3">
          <FaUser className="text-blue-600 text-lg" />
          <span className="font-bold">Creador:</span>
          <span className="bg-gray-100 text-blue-600 rounded-lg px-2 py-0.5 font-mono text-sm">{subasta.creador}</span>
        </div>
        <div className="flex items-center gap-3">
          <FaCrown className="text-green-600 text-xl" />
          <span className="font-bold">Ganador:</span>
          <span className="bg-green-100 text-green-800 rounded-lg px-2 py-0.5 font-mono text-sm">{subasta.ganador}</span>
        </div>
        <div className="flex items-center gap-3">
          <FaMoneyBillWave className="text-green-600 text-xl" />
          <span className="font-bold text-lg">Importe ganador:</span>
          <span className="text-green-600 font-black text-xl">{subasta.importeGanador}</span>
        </div>
      </div>

      {/* Pujas table */}
      <h3 className="text-xl font-extrabold mb-4">Pujas realizadas</h3>
      {pujas.length === 0 ? (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg font-semibold mb-6">
          No hay pujas para esta subasta.
        </div>
      ) : (
        <div className="overflow-x-auto mb-6">
          <table className="w-full bg-white rounded-xl overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left font-bold">#</th>
                <th className="p-3 text-left font-bold">Importe</th>
                <th className="p-3 text-left font-bold">Usuario</th>
                <th className="p-3 text-left font-bold">Fecha</th>
                <th className="p-3 text-left font-bold">PDA</th>
              </tr>
            </thead>
            <tbody>
              {pujas
                .sort((a, b) => Number(b.importePuja) - Number(a.importePuja))
                .map((p, idx) => (
                  <tr key={p.publicKey} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="p-3 font-bold text-center">{idx + 1}</td>
                    <td className="p-3 text-blue-600 font-extrabold">{p.importePuja}</td>
                    <td className="p-3 font-mono text-sm flex items-center gap-2">
                      <span className="bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm">
                        {p.pk[0]?.toUpperCase() || "?"}
                      </span>
                      <span className="truncate max-w-[120px]" title={p.pk}>{p.pk}</span>
                    </td>
                    <td className="p-3">{new Date(Number(p.ts) * 1000).toLocaleString()}</td>
                    <td className="p-3 font-mono text-xs text-gray-400" title={p.publicKey}>
                      {p.publicKey.slice(0, 8)}...{p.publicKey.slice(-4)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        onClick={() => router.back()}
        className="bg-gradient-to-r from-blue-600 to-blue-400 text-white px-8 py-3 rounded-xl font-extrabold text-lg shadow-md hover:scale-105 transition"
      >
        ← Volver
      </button>
    </div>
  );
}
