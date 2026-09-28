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

  if (cargando) return <p>Cargando...</p>;

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1>Categorias</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}>
        <h2>Nueva categoria</h2>
        <input placeholder="Nombre (ej. Plomeria)" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <input placeholder="Slug (ej. plomeria)" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input placeholder="Icono (opcional)" value={icono} onChange={(e) => setIcono(e.target.value)} />
        <button onClick={crear} disabled={guardando}>
          {guardando ? "Guardando..." : "Crear categoria"}
        </button>
        {mensaje && <p>{mensaje}</p>}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Nombre</th>
            <th style={{ textAlign: "left" }}>Slug</th>
            <th style={{ textAlign: "left" }}>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {categorias.map((c) => (
            <tr key={c.id} style={{ borderTop: "1px solid #444" }}>
              <td>{c.name}</td>
              <td>{c.slug}</td>
              <td>{c.active ? "Activa" : "Desactivada"}</td>
              <td>
                <button
                  onClick={() => alternarActivo(c.id, c.active)}
                  disabled={actualizando === c.id}
                >
                  {c.active ? "Desactivar" : "Activar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}