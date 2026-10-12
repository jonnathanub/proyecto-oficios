"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Anuncio = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  target_url: string | null;
  location: string;
  status: string;
  impressions: number;
  clicks: number;
  start_date: string;
  end_date: string | null;
};

const UBICACIONES = [
  { value: "home_banner", label: "Banner de inicio" },
  { value: "search_results", label: "Dentro de resultados de búsqueda" },
  { value: "category_page", label: "Página de categoría" },
  { value: "sponsored_card", label: "Tarjeta patrocinada" },
];

const ESTADOS: Record<string, { texto: string; clase: string }> = {
  active: { texto: "Activo", clase: "bg-emerald-100 text-emerald-800" },
  paused: { texto: "Pausado", clase: "bg-amber-100 text-amber-800" },
};

export default function AdminPublicidad() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState("");

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [ubicacion, setUbicacion] = useState("home_banner");
  const [fechaFin, setFechaFin] = useState("");

  async function cargar() {
    const { data } = await supabase
      .from("advertisements")
      .select("id, title, description, image_url, target_url, location, status, impressions, clicks, start_date, end_date")
      .order("created_at", { ascending: false });
    setAnuncios((data ?? []) as Anuncio[]);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear() {
    if (!titulo) {
      setMensaje("El título es obligatorio.");
      return;
    }
    setGuardando(true);
    setMensaje("");

    const { error } = await supabase.from("advertisements").insert({
      title: titulo,
      description: descripcion || null,
      image_url: imagenUrl || null,
      target_url: targetUrl || null,
      location: ubicacion,
      start_date: new Date().toISOString(),
      end_date: fechaFin ? new Date(fechaFin).toISOString() : null,
      status: "active",
    });

    if (error) {
      setMensaje(`No se pudo crear: ${error.message}`);
      setGuardando(false);
      return;
    }

    setTitulo("");
    setDescripcion("");
    setImagenUrl("");
    setTargetUrl("");
    setFechaFin("");
    setGuardando(false);
    await cargar();
  }

  async function cambiarEstado(id: string, nuevoEstado: string) {
    setActualizando(id);
    await supabase.from("advertisements").update({ status: nuevoEstado }).eq("id", id);
    await cargar();
    setActualizando(null);
  }

  if (cargando) return <p className="py-10 text-center text-muted">Cargando...</p>;

  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1>Publicidad</h1>
        <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800">
          Anuncios simulados por ahora, sin integración de pago real.
        </p>
      </div>

      <section className="flex max-w-xl flex-col gap-3 rounded-2xl bg-card p-5 shadow-sm">
        <h2>Nuevo anuncio</h2>
        <input placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        <input
          placeholder="Descripción (opcional)"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
        <input
          placeholder="URL de imagen (opcional)"
          value={imagenUrl}
          onChange={(e) => setImagenUrl(e.target.value)}
        />
        <input
          placeholder="URL de destino (opcional)"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
        />
        <select value={ubicacion} onChange={(e) => setUbicacion(e.target.value)}>
          {UBICACIONES.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
        <label className="text-sm text-muted">Fecha de fin (opcional)</label>
        <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />

        {mensaje && (
          <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-danger">{mensaje}</p>
        )}

        <button onClick={crear} disabled={guardando} className="w-full">
          {guardando ? "Guardando..." : "Crear anuncio"}
        </button>
      </section>

      <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th>Título</th>
              <th>Ubicación</th>
              <th>Estado</th>
              <th>Impresiones</th>
              <th>Clics</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {anuncios.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-muted">
                  Todavía no hay anuncios.
                </td>
              </tr>
            )}
            {anuncios.map((a) => {
              const estado = ESTADOS[a.status] ?? {
                texto: a.status,
                clase: "bg-gray-100 text-gray-700",
              };
              return (
                <tr key={a.id} className="border-t border-border">
                  <td className="font-medium">{a.title}</td>
                  <td className="text-muted">
                    {UBICACIONES.find((u) => u.value === a.location)?.label ?? a.location}
                  </td>
                  <td>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${estado.clase}`}>
                      {estado.texto}
                    </span>
                  </td>
                  <td>{a.impressions}</td>
                  <td>{a.clicks}</td>
                  <td className="text-right">
                    {a.status === "active" ? (
                      <button
                        onClick={() => cambiarEstado(a.id, "paused")}
                        disabled={actualizando === a.id}
                        className="border border-primary bg-white text-primary"
                      >
                        Pausar
                      </button>
                    ) : (
                      <button
                        onClick={() => cambiarEstado(a.id, "active")}
                        disabled={actualizando === a.id}
                      >
                        Activar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}