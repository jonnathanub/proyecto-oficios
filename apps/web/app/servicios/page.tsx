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

function Cabecera() {
  return (
    <header className="border-b border-border bg-card">
      <nav className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-3">
        <a href="/" className="text-2xl font-bold text-primary hover:no-underline">
          Oficios
        </a>
        <a href="/cuenta" className="text-sm">
          Mi cuenta
        </a>
      </nav>
    </header>
  );
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

  const esOk = mensaje.startsWith("¡Servicio creado");

  if (cargando) {
    return (
      <div className="flex min-h-screen flex-col">
        <Cabecera />
        <main className="mx-auto w-full max-w-xl px-4 py-10 text-center text-muted">
          Cargando...
        </main>
      </div>
    );
  }

  if (!esProfesional) {
    return (
      <div className="flex min-h-screen flex-col">
        <Cabecera />
        <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-8">
          <h1>Mis servicios</h1>
          <p className="rounded-2xl bg-card p-5 shadow-sm">
            Esta sección es solo para cuentas de tipo Profesional.
          </p>
          <a href="/cuenta">Volver a mi cuenta</a>
        </main>
      </div>
    );
  }

  if (!perfilId) {
    return (
      <div className="flex min-h-screen flex-col">
        <Cabecera />
        <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-8">
          <h1>Mis servicios</h1>
          <p className="rounded-2xl bg-card p-5 shadow-sm">{mensaje}</p>
        </main>
      </div>
    );
  }

  if (misCategorias.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Cabecera />
        <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-8">
          <h1>Mis servicios</h1>
          <p className="rounded-2xl bg-card p-5 shadow-sm">
            Primero elige tus oficios en tu perfil.
          </p>
          <a href="/perfil">Ir a mi perfil profesional</a>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Cabecera />

      <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-8">
        <h1>Mis servicios</h1>

        <section className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-sm">
          <h2>Agregar servicio</h2>
          <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
            {misCategorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Título (ej. Reparación de fugas)"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
          <textarea
            rows={3}
            placeholder="Descripción del servicio"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          <input
            placeholder="Precio (ej. Desde $300 MXN)"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
          <input placeholder="Estado" value={estado} onChange={(e) => setEstado(e.target.value)} />
          <input
            placeholder="Municipio (zona donde trabajas)"
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
          />
          <input
            placeholder="Colonia (opcional)"
            value={colonia}
            onChange={(e) => setColonia(e.target.value)}
          />

          {mensaje && (
            <p
              className={
                esOk
                  ? "rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-800"
                  : "rounded-lg bg-red-100 px-3 py-2 text-sm text-danger"
              }
            >
              {mensaje}
            </p>
          )}

          <button onClick={crear} disabled={guardando} className="w-full">
            {guardando ? "Guardando..." : "Agregar servicio"}
          </button>
        </section>

        <h2>Mis servicios publicados</h2>

        {servicios.length === 0 && (
          <p className="py-4 text-center text-muted">Todavía no tienes servicios.</p>
        )}

        {servicios.map((s) => (
          <div key={s.id} className="flex flex-col gap-2 rounded-2xl bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <strong className="text-lg">{s.title}</strong>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                  s.active ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700"
                }`}
              >
                {s.active ? "Visible al público" : "Oculto"}
              </span>
            </div>

            <span className="self-start rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-primary-dark">
              {nombreCategoria(s.category_id)}
            </span>

            {s.description && <span>{s.description}</span>}
            {s.price_text && <span className="font-bold text-primary">{s.price_text}</span>}
            <span className="text-sm text-muted">
              📍 {[s.neighborhood, s.municipality, s.state].filter(Boolean).join(", ") || "Sin zona"}
            </span>

            <div className="mt-2 flex gap-3">
              <button
                onClick={() => alternarActivo(s)}
                className="flex-1 border border-primary bg-white text-primary"
              >
                {s.active ? "Ocultar" : "Publicar"}
              </button>
              <button onClick={() => borrar(s)} className="flex-1 bg-danger">
                Borrar
              </button>
            </div>
          </div>
        ))}

        <a href="/perfil" className="text-center">
          Mi perfil profesional
        </a>
        <a href="/cuenta" className="text-center">
          Volver a mi cuenta
        </a>
      </main>
    </div>
  );
}