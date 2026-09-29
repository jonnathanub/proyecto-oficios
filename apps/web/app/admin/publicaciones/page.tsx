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

const POR_PAGINA = 20;

export default function AdminPublicaciones() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [categorias, setCategorias] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);

  async function cargar() {
    setCargando(true);
    const desde = (pagina - 1) * POR_PAGINA;
    const hasta = desde + POR_PAGINA - 1;

    const { data, count } = await supabase
      .from("services")
      .select("id, title, category_id, active, state, municipality, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(desde, hasta);

    const lista = (data ?? []) as Servicio[];
    setServicios(lista);
    setTotal(count ?? 0);

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
  }, [pagina]);

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

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  if (cargando) return <p>Cargando...</p>;

  return (
    <main>
      <h1>Publicaciones</h1>
      <p style={{ fontSize: 13, opacity: 0.75 }}>
        {total} publicacion{total !== 1 ? "es" : ""} - pagina {pagina} de {totalPaginas}
      </p>
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

      {totalPaginas > 1 && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", marginTop: 16 }}>
          {pagina > 1 && (
            <button onClick={() => setPagina((p) => p - 1)}>Anterior</button>
          )}
          <span>Pagina {pagina} de {totalPaginas}</span>
          {pagina < totalPaginas && (
            <button onClick={() => setPagina((p) => p + 1)}>Siguiente</button>
          )}
        </div>
      )}
    </main>
  );
}