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
  service: "Publicacion",
  review: "Resena",
  user: "Usuario",
};

export default function AdminReportes() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState<string | null>(null);

  async function cargar() {
    const { data } = await supabase
      .from("reports")
      .select("id, reporter_id, target_type, target_id, reason, description, status, created_at")
      .order("created_at", { ascending: false });

    const lista = (data ?? []) as Reporte[];
    setReportes(lista);

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
  }, []);

  async function actualizarEstado(id: string, nuevoEstado: string) {
    setActualizando(id);
    await supabase.from("reports").update({ status: nuevoEstado }).eq("id", id);
    await cargar();
    setActualizando(null);
  }

  if (cargando) return <p>Cargando...</p>;

  return (
    <main>
      <h1>Reportes</h1>
      {reportes.length === 0 && <p>No hay reportes.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {reportes.map((r) => (
          <div key={r.id} style={{ border: "1px solid #666", borderRadius: 8, padding: 12 }}>
            <strong>{TIPOS[r.target_type] ?? r.target_type}</strong>
            <p>Motivo: {r.reason}</p>
            {r.description && <p>{r.description}</p>}
            <p>Reportado por: {nombres[r.reporter_id] ?? "Sin nombre"}</p>
            <p>Estado: {r.status}</p>
            {r.status === "open" && (
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => actualizarEstado(r.id, "reviewed")}
                  disabled={actualizando === r.id}
                >
                  Marcar revisado
                </button>
                <button
                  onClick={() => actualizarEstado(r.id, "dismissed")}
                  disabled={actualizando === r.id}
                >
                  Descartar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}