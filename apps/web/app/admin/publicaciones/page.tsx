"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Servicio = {
  id: string;
  title: string;
  category_id: string;
  active: boolean;
  state: string | null;
  municipality: string | null;
  created_at: string;
};

export default function AdminPublicaciones() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [categorias, setCategorias] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState<string | null>(null);

  async function cargar() {
    const { data } = await supabase
      .from("services")
      .select("id, title, category_id, active, state, municipality, created_at")
      .order("created_at", { ascending: false });

    const lista = (data ?? []) as Servicio[];
    setServicios(lista);

    const catIds = [...new Set(lista.map((s) => s.category_id))];
    if (catIds.length > 0) {
      const { data: cats } = await supabase
        .from("categories")
        .select("id, name")
        .in("id", catIds);
      setCategorias(
        Object.fromEntries((cats ?? []).map((c) => [c.id, c.name]))
      );
    }

    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function alternarActivo(id: string, actual: boolean) {
    setActualizando(id);
    await supabase.from("services").update({ active: !actual }).eq("id", id);
    await cargar();
    setActualizando(null);
  }

  async function eliminar(id: string) {
    if (!confirm("Eliminar esta publicacion de forma permanente?")) return;
    setActualizando(id);
    await supabase.from("services").delete().eq("id", id);
    await cargar();
    setActualizando(null);
  }

  if (cargando) return <p>Cargando...</p>;

  return (
    <main>
      <h1>Publicaciones</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Titulo</th>
            <th style={{ textAlign: "left" }}>Categoria</th>
            <th style={{ textAlign: "left" }}>Ubicacion</th>
            <th style={{ textAlign: "left" }}>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {servicios.map((s) => (
            <tr key={s.id} style={{ borderTop: "1px solid #444" }}>
              <td>{s.title}</td>
              <td>{categorias[s.category_id] ?? "-"}</td>
              <td>{[s.municipality, s.state].filter(Boolean).join(", ") || "-"}</td>
              <td>{s.active ? "Activa" : "Desactivada"}</td>
              <td style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => alternarActivo(s.id, s.active)}
                  disabled={actualizando === s.id}
                >
                  {s.active ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => eliminar(s.id)}
                  disabled={actualizando === s.id}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}