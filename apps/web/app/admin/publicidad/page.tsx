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
  { value: "search_results", label: "Dentro de resultados de busqueda" },
  { value: "category_page", label: "Pagina de categoria" },
  { value: "sponsored_card", label: "Tarjeta patrocinada" },
];

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
      setMensaje("El titulo es obligatorio.");
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

  if (cargando) return <p>Cargando...</p>;

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1>Publicidad</h1>
      <p style={{ fontSize: 13, opacity: 0.8 }}>
        Anuncios simulados por ahora, sin integracion de pago real.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 360 }}>
        <h2>Nuevo anuncio</h2>
        <input placeholder="Titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        <input placeholder="Descripcion (opcional)" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        <input placeholder="URL de imagen (opcional)" value={imagenUrl} onChange={(e) => setImagenUrl(e.target.value)} />
        <input placeholder="URL de destino (opcional)" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} />
        <select value={ubicacion} onChange={(e) => setUbicacion(e.target.value)}>
          {UBICACIONES.map((u) => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </select>
        <label style={{ fontSize: 13 }}>Fecha de fin (opcional)</label>
        <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
        <button onClick={crear} disabled={guardando}>
          {guardando ? "Guardando..." : "Crear anuncio"}
        </button>
        {mensaje && <p>{mensaje}</p>}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Titulo</th>
            <th style={{ textAlign: "left" }}>Ubicacion</th>
            <th style={{ textAlign: "left" }}>Estado</th>
            <th style={{ textAlign: "left" }}>Impresiones</th>
            <th style={{ textAlign: "left" }}>Clics</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {anuncios.map((a) => (
            <tr key={a.id} style={{ borderTop: "1px solid #444" }}>
              <td>{a.title}</td>
              <td>{UBICACIONES.find((u) => u.value === a.location)?.label ?? a.location}</td>
              <td>{a.status}</td>
              <td>{a.impressions}</td>
              <td>{a.clicks}</td>
              <td>
                {a.status === "active" ? (
                  <button onClick={() => cambiarEstado(a.id, "paused")} disabled={actualizando === a.id}>
                    Pausar
                  </button>
                ) : (
                  <button onClick={() => cambiarEstado(a.id, "active")} disabled={actualizando === a.id}>
                    Activar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}