"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Categoria = { id: string; name: string };

export default function Perfil() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [esProfesional, setEsProfesional] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const [userId, setUserId] = useState("");
  const [perfilId, setPerfilId] = useState("");
  const [telefono, setTelefono] = useState("");
  const [estado, setEstado] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [colonia, setColonia] = useState("");
  const [bio, setBio] = useState("");
  const [anios, setAnios] = useState("");
  const [horario, setHorario] = useState("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [original, setOriginal] = useState<string[]>([]);

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const { data: u } = await supabase
        .from("users")
        .select("role, phone, state, municipality, neighborhood")
        .eq("id", user.id)
        .single();

      if (u?.role !== "professional") {
        setEsProfesional(false);
        setCargando(false);
        return;
      }
      setTelefono(u.phone ?? "");
      setEstado(u.state ?? "");
      setMunicipio(u.municipality ?? "");
      setColonia(u.neighborhood ?? "");

      const { data: p } = await supabase
        .from("professional_profiles")
        .select("id, bio, years_experience, schedule_text")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!p) {
        setMensaje("Tu perfil profesional todavía no existe. Corre el SQL del Paso 1 en Supabase.");
        setCargando(false);
        return;
      }
      setPerfilId(p.id);
      setBio(p.bio ?? "");
      setAnios(p.years_experience != null ? String(p.years_experience) : "");
      setHorario(p.schedule_text ?? "");

      const { data: cats } = await supabase
        .from("categories")
        .select("id, name")
        .eq("active", true)
        .order("name");
      setCategorias(cats ?? []);

      const { data: mias } = await supabase
        .from("professional_categories")
        .select("category_id")
        .eq("professional_id", p.id);
      const ids = (mias ?? []).map((m) => m.category_id as string);
      setSeleccion(ids);
      setOriginal(ids);

      setCargando(false);
    }
    cargar();
  }, [router]);

  function alternar(id: string) {
    setSeleccion((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function fallo(donde: string, detalle?: string) {
    setGuardando(false);
    setMensaje(`No se pudo guardar (${donde}). ${detalle ?? "Sin permiso o fila no encontrada."}`);
  }

  async function guardar() {
    setMensaje("");
    if (seleccion.length === 0) {
      setMensaje("Elige al menos un oficio.");
      return;
    }
    setGuardando(true);

    const r1 = await supabase
      .from("users")
      .update({
        phone: telefono || null,
        state: estado || null,
        municipality: municipio || null,
        neighborhood: colonia || null,
      })
      .eq("id", userId)
      .select("id");
    if (r1.error || !r1.data?.length) return fallo("contacto y ubicación", r1.error?.message);

    const r2 = await supabase
      .from("professional_profiles")
      .update({
        bio: bio || null,
        years_experience: anios === "" ? null : parseInt(anios, 10),
        schedule_text: horario || null,
      })
      .eq("id", perfilId)
      .select("id");
    if (r2.error || !r2.data?.length) return fallo("perfil", r2.error?.message);

    const aBorrar = original.filter((id) => !seleccion.includes(id));
    const aAgregar = seleccion.filter((id) => !original.includes(id));

    if (aBorrar.length > 0) {
      const r3 = await supabase
        .from("professional_categories")
        .delete()
        .eq("professional_id", perfilId)
        .in("category_id", aBorrar);
      if (r3.error) return fallo("oficios", r3.error.message);
    }

    if (aAgregar.length > 0) {
      const r4 = await supabase
        .from("professional_categories")
        .insert(aAgregar.map((category_id) => ({ professional_id: perfilId, category_id })));
      if (r4.error) return fallo("oficios", r4.error.message);
    }

    setOriginal(seleccion);
    setGuardando(false);
    setMensaje("¡Perfil guardado!");
  }

  if (cargando) return <main style={{ padding: 16 }}>Cargando...</main>;

  if (!esProfesional) {
    return (
      <main style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
        <h1>Mi perfil profesional</h1>
        <p>Esta sección es solo para cuentas de tipo Profesional.</p>
        <a href="/cuenta">Volver a mi cuenta</a>
      </main>
    );
  }

  if (!perfilId) {
    return (
      <main style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
        <h1>Mi perfil profesional</h1>
        <p>{mensaje}</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: "40px auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Mi perfil profesional</h1>

      <h2>Contacto y ubicación</h2>
      <input placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
      <input placeholder="Estado (ej. Estado de México)" value={estado} onChange={(e) => setEstado(e.target.value)} />
      <input placeholder="Municipio (ej. Toluca)" value={municipio} onChange={(e) => setMunicipio(e.target.value)} />
      <input placeholder="Colonia" value={colonia} onChange={(e) => setColonia(e.target.value)} />

      <h2>Sobre mí</h2>
      <textarea rows={4} placeholder="Describe tu experiencia y qué tipo de trabajos haces" value={bio} onChange={(e) => setBio(e.target.value)} />
      <input type="number" min={0} max={60} placeholder="Años de experiencia" value={anios} onChange={(e) => setAnios(e.target.value)} />
      <input placeholder="Horario (ej. Lunes a sábado, 8am a 6pm)" value={horario} onChange={(e) => setHorario(e.target.value)} />

      <h2>Mis oficios</h2>
      {categorias.map((c) => (
        <label key={c.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={seleccion.includes(c.id)} onChange={() => alternar(c.id)} />
          {c.name}
        </label>
      ))}

      <button onClick={guardar} disabled={guardando}>
        {guardando ? "Guardando..." : "Guardar perfil"}
      </button>

      {mensaje && <p>{mensaje}</p>}

      <a href="/cuenta">Volver a mi cuenta</a>
    </main>
  );
}
