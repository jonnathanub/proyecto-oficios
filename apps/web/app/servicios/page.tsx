"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Categoria = { id: string; name: string };
type Servicio = {
  id: string;
  title: string;
  description: string | null;
  price_text: string | null;
  state: string | null;
  municipality: string | null;
  neighborhood: string | null;
  active: boolean;
  category_id: string;
};

async function traerServicios(perfilId: string) {
  const { data } = await supabase
    .from("services")
    .select("id, title, description, price_text, state, municipality, neighborhood, active, category_id")
    .eq("professional_id", perfilId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Servicio[];
}

export default function Servicios() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [esProfesional, setEsProfesional] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const [perfilId, setPerfilId] = useState("");
  const [todas, setTodas] = useState<Categoria[]>([]);
  const [misIds, setMisIds] = useState<string[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  const [categoriaId, setCategoriaId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [estado, setEstado] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [colonia, setColonia] = useState("");

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: u } = await supabase
        .from("users")
        .select("role, state, municipality, neighborhood")
        .eq("id", user.id)
        .single();

      if (u?.role !== "professional") {
        setEsProfesional(false);
        setCargando(false);
        return;
      }
      setEstado(u.state ?? "");
      setMunicipio(u.municipality ?? "");
      setColonia(u.neighborhood ?? "");

      const { data: p } = await supabase
        .from("professional_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!p) {
        setMensaje("Tu perfil profesional todavía no existe.");
        setCargando(false);
        return;
      }
      setPerfilId(p.id);

      const { data: cats } = await supabase
        .from("categories")
        .select("id, name")
        .eq("active", true)
        .order("name");
      setTodas(cats ?? []);

      const { data: mias } = await supabase
        .from("professional_categories")
        .select("category_id")
        .eq("professional_id", p.id);
      const ids = (mias ?? []).map((m) => m.category_id as string);
      setMisIds(ids);
      if (ids.length > 0) setCategoriaId(ids[0]);

      setServicios(await traerServicios(p.id));
      setCargando(false);
    }
    cargar();
  }, [router]);

  const misCategorias = todas.filter((c) => misIds.includes(c.id));
  const nombreCategoria = (id: string) => todas.find((c) => c.id === id)?.name ?? "Oficio";

  async function crear() {
    setMensaje("");
    if (!categoriaId || !titulo.trim()) {
      setMensaje("Elige un oficio y escribe un título.");
      return;
    }
    setGuardando(true);

    const { error } = await supabase.from("services").insert({
      professional_id: perfilId,
      category_id: categoriaId,
      title: titulo.trim(),
      description: descripcion.trim() || null,
      price_text: precio.trim() || null,
      state: estado.trim() || null,
      municipality: municipio.trim() || null,
      neighborhood: colonia.trim() || null,
      active: true,
    });

    if (error) {
      setGuardando(false);
      setMensaje(`No se pudo crear el servicio. ${error.message}`);
      return;
    }

    setTitulo("");
    setDescripcion("");
    setPrecio("");
    setServicios(await traerServicios(perfilId));
    setGuardando(false);
    setMensaje("¡Servicio creado!");
  }

  async function alternarActivo(s: Servicio) {
    setMensaje("");
    const { error } = await supabase.from("services").update({ active: !s.active }).eq("id", s.id);
    if (error) {
      setMensaje(`No se pudo actualizar. ${error.message}`);
      return;
    }
    setServicios(await traerServicios(perfilId));
  }

  async function borrar(s: Servicio) {
    setMensaje("");
    if (!window.confirm(`¿Borrar "${s.title}"?`)) return;
    const { error } = await supabase.from("services").delete().eq("id", s.id);
    if (error) {
      setMensaje(`No se pudo borrar (si ya tiene solicitudes, mejor desactívalo). ${error.message}`);
      return;
    }
    setServicios(await traerServicios(perfilId));
  }

  if (cargando) return <main style={{ padding: 16 }}>Cargando...</main>;

  if (!esProfesional) {
    return (
      <main style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
        <h1>Mis servicios</h1>
        <p>Esta sección es solo para cuentas de tipo Profesional.</p>
        <a href="/cuenta">Volver a mi cuenta</a>
      </main>
    );
  }

  if (!perfilId) {
    return (
      <main style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
        <h1>Mis servicios</h1>
        <p>{mensaje}</p>
      </main>
    );
  }

  if (misCategorias.length === 0) {
    return (
      <main style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
        <h1>Mis servicios</h1>
        <p>Primero elige tus oficios en tu perfil.</p>
        <a href="/perfil">Ir a mi perfil profesional</a>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: "40px auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Mis servicios</h1>

      <h2>Agregar servicio</h2>
      <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
        {misCategorias.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input placeholder="Título (ej. Reparación de fugas)" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      <textarea rows={3} placeholder="Descripción del servicio" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      <input placeholder="Precio (ej. Desde $300 MXN)" value={precio} onChange={(e) => setPrecio(e.target.value)} />
      <input placeholder="Estado" value={estado} onChange={(e) => setEstado(e.target.value)} />
      <input placeholder="Municipio (zona donde trabajas)" value={municipio} onChange={(e) => setMunicipio(e.target.value)} />
      <input placeholder="Colonia (opcional)" value={colonia} onChange={(e) => setColonia(e.target.value)} />
      <button onClick={crear} disabled={guardando}>
        {guardando ? "Guardando..." : "Agregar servicio"}
      </button>

      {mensaje && <p>{mensaje}</p>}

      <h2>Mis servicios publicados</h2>
      {servicios.length === 0 && <p>Todavía no tienes servicios.</p>}
      {servicios.map((s) => (
        <div key={s.id} style={{ border: "1px solid #666", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
          <strong>{s.title}</strong>
          <span>{nombreCategoria(s.category_id)}</span>
          {s.description && <span>{s.description}</span>}
          {s.price_text && <span>Precio: {s.price_text}</span>}
          <span>Zona: {[s.neighborhood, s.municipality, s.state].filter(Boolean).join(", ") || "Sin zona"}</span>
          <span>Estado: {s.active ? "Visible al público" : "Oculto"}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => alternarActivo(s)}>{s.active ? "Ocultar" : "Publicar"}</button>
            <button onClick={() => borrar(s)}>Borrar</button>
          </div>
        </div>
      ))}

      <a href="/perfil">Mi perfil profesional</a>
      <a href="/cuenta">Volver a mi cuenta</a>
    </main>
  );
}
