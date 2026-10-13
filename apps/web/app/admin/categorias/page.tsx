"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Categoria = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  active: boolean;
};

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState("");

  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [icono, setIcono] = useState("");

  async function cargar() {
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug, icon, active")
      .order("name");
    setCategorias((data ?? []) as Categoria[]);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear() {
    if (!nombre || !slug) {
      setMensaje("Nombre y slug son obligatorios.");
      return;
    }
    setGuardando(true);
    setMensaje("");

    const { error } = await supabase.from("categories").insert({
      name: nombre,
      slug,
      icon: icono || null,
    });

    if (error) {
      setMensaje(`No se pudo crear: ${error.message}`);
      setGuardando(false);
      return;
    }

    setNombre("");
    setSlug("");
    setIcono("");
    setGuardando(false);
    await cargar();
  }

  async function alternarActivo(id: string, actual: boolean) {
    setActualizando(id);
    await supabase.from("categories").update({ active: !actual }).eq("id", id);
    await cargar();
    setActualizando(null);
  }

  if (cargando) return <p className="py-10 text-center text-muted">Cargando...</p>;

  return (
    <main className="flex flex-col gap-6">
      <h1>Categorías</h1>

      <section className="flex max-w-md flex-col gap-3 rounded-2xl bg-card p-5 shadow-sm">
        <h2>Nueva categoría</h2>
        <input
          placeholder="Nombre (ej. Plomería)"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <input
          placeholder="Slug (ej. plomeria)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <input
          placeholder="Ícono (opcional)"
          value={icono}
          onChange={(e) => setIcono(e.target.value)}
        />

        {mensaje && (
          <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-danger">{mensaje}</p>
        )}

        <button onClick={crear} disabled={guardando} className="w-full">
          {guardando ? "Guardando..." : "Crear categoría"}
        </button>
      </section>

      <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Slug</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categorias.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-muted">
                  Todavía no hay categorías.
                </td>
              </tr>
            )}
            {categorias.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="font-medium">{c.name}</td>
                <td>
                  <code className="rounded bg-background px-2 py-1 text-sm text-muted">
                    {c.slug}
                  </code>
                </td>
                <td>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      c.active ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {c.active ? "Activa" : "Desactivada"}
                  </span>
                </td>
                <td className="text-right">
                  <button
                    onClick={() => alternarActivo(c.id, c.active)}
                    disabled={actualizando === c.id}
                    className={c.active ? "border border-primary bg-white text-primary" : ""}
                  >
                    {c.active ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}