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
    if (!confirm("¿Eliminar esta publicación de forma permanente?")) return;
    setActualizando(id);
    await supabase.from("services").delete().eq("id", id);
    await cargar();
    setActualizando(null);
  }

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  if (cargando) return <p className="py-10 text-center text-muted">Cargando...</p>;

  return (
    <main className="flex flex-col gap-5">
      <div>
        <h1>Publicaciones</h1>
        <p className="text-sm text-muted">
          {total} publicación{total !== 1 ? "es" : ""} · página {pagina} de {totalPaginas}
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th>Título</th>
              <th>Categoría</th>
              <th>Ubicación</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {servicios.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="font-medium">{s.title}</td>
                <td>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-primary-dark">
                    {categorias[s.category_id] ?? "-"}
                  </span>
                </td>
                <td className="text-muted">
                  {[s.municipality, s.state].filter(Boolean).join(", ") || "-"}
                </td>
                <td>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      s.active ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {s.active ? "Activa" : "Desactivada"}
                  </span>
                </td>
                <td>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => alternarActivo(s.id, s.active)}
                      disabled={actualizando === s.id}
                      className="border border-primary bg-white text-primary"
                    >
                      {s.active ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      onClick={() => eliminar(s.id)}
                      disabled={actualizando === s.id}
                      className="bg-danger"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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