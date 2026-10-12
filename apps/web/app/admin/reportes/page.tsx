"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Reporte = {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
};

const TIPOS: Record<string, string> = {
  service: "Publicación",
  review: "Reseña",
  user: "Usuario",
};

const ESTADOS: Record<string, { texto: string; clase: string }> = {
  open: { texto: "Abierto", clase: "bg-amber-100 text-amber-800" },
  reviewed: { texto: "Revisado", clase: "bg-emerald-100 text-emerald-800" },
  dismissed: { texto: "Descartado", clase: "bg-gray-200 text-gray-700" },
};

const POR_PAGINA = 20;

export default function AdminReportes() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);

  async function cargar() {
    setCargando(true);
    const desde = (pagina - 1) * POR_PAGINA;
    const hasta = desde + POR_PAGINA - 1;

    const { data, count } = await supabase
      .from("reports")
      .select("id, reporter_id, target_type, target_id, reason, description, status, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(desde, hasta);

    const lista = (data ?? []) as Reporte[];
    setReportes(lista);
    setTotal(count ?? 0);

    const ids = [...new Set(lista.map((r) => r.reporter_id))];
    if (ids.length > 0) {
      const { data: us } = await supabase
        .from("users")
        .select("id, full_name")
        .in("id", ids);
      setNombres(
        Object.fromEntries((us ?? []).map((u) => [u.id, u.full_name ?? "Sin nombre"]))
      );
    }

    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, [pagina]);

  async function actualizarEstado(id: string, nuevoEstado: string) {
    setActualizando(id);
    await supabase.from("reports").update({ status: nuevoEstado }).eq("id", id);
    await cargar();
    setActualizando(null);
  }

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  if (cargando) return <p className="py-10 text-center text-muted">Cargando...</p>;

  return (
    <main className="flex flex-col gap-5">
      <div>
        <h1>Reportes</h1>
        <p className="text-sm text-muted">
          {total} reporte{total !== 1 ? "s" : ""} · página {pagina} de {totalPaginas}
        </p>
      </div>

      {reportes.length === 0 && (
        <p className="py-6 text-center text-muted">No hay reportes.</p>
      )}

      <div className="flex max-w-3xl flex-col gap-4">
        {reportes.map((r) => {
          const estado = ESTADOS[r.status] ?? {
            texto: r.status,
            clase: "bg-gray-100 text-gray-700",
          };
          return (
            <div key={r.id} className="flex flex-col gap-2 rounded-2xl bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-primary-dark">
                  {TIPOS[r.target_type] ?? r.target_type}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${estado.clase}`}>
                  {estado.texto}
                </span>
              </div>

              <p>
                <span className="text-muted">Motivo: </span>
                <strong>{r.reason}</strong>
              </p>
              {r.description && <p>{r.description}</p>}
              <p className="text-sm text-muted">
                Reportado por: {nombres[r.reporter_id] ?? "Sin nombre"}
              </p>

              {r.status === "open" && (
                <div className="mt-2 flex gap-3">
                  <button
                    onClick={() => actualizarEstado(r.id, "reviewed")}
                    disabled={actualizando === r.id}
                  >
                    Marcar revisado
                  </button>
                  <button
                    onClick={() => actualizarEstado(r.id, "dismissed")}
                    disabled={actualizando === r.id}
                    className="border border-primary bg-white text-primary"
                  >
                    Descartar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-4">
          {pagina > 1 && (
            <button
              onClick={() => setPagina((p) => p - 1)}
              className="border border-primary bg-white text-primary"
            >
              ← Anterior
            </button>
          )}
          <span className="text-sm text-muted">
            Página {pagina} de {totalPaginas}
          </span>
          {pagina < totalPaginas && (
            <button
              onClick={() => setPagina((p) => p + 1)}
              className="border border-primary bg-white text-primary"
            >
              Siguiente →
            </button>
          )}
        </div>
      )}
    </main>
  );
}