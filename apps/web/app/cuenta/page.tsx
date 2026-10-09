"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Cuenta() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("");
  const [cargando, setCargando] = useState(true);
  const [telefono, setTelefono] = useState("");
  const [guardandoTel, setGuardandoTel] = useState(false);
  const [msgTel, setMsgTel] = useState("");

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      setNombre(data?.full_name ?? user.user_metadata?.full_name ?? user.email ?? "");
      setRol(data?.role ?? user.user_metadata?.role ?? "");
      if ((data?.role ?? user.user_metadata?.role) === "client") {
        const { data: contacto } = await supabase.rpc("mi_contacto");
        setTelefono(contacto?.[0]?.telefono ?? "");
      }
      setCargando(false);
    }
    cargar();
  }, [router]);

  async function guardarTelefono() {
    setMsgTel("");
    setGuardandoTel(true);
    const { data: { user } } = await supabase.auth.getUser();
    const r = await supabase
      .from("users")
      .update({ phone: telefono.trim() || null })
      .eq("id", user!.id)
      .select("id");
    setGuardandoTel(false);
    setMsgTel(r.error || !r.data?.length ? "No se pudo guardar el teléfono." : "Teléfono guardado.");
  }
  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (cargando) return <main style={{ padding: 16 }}>Cargando...</main>;

  return (
    <main style={{ maxWidth: 400, margin: "40px auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Conectado como {nombre}</h1>
      <p>Rol: {rol === "professional" ? "Profesional" : rol === "admin" ? "Administrador" : "Cliente"}</p>
      {rol === "client" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, border: "1px dashed #666", borderRadius: 8, padding: 10 }}>
          <strong>Mi teléfono de contacto</strong>
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Teléfono (opcional)"
            style={{ padding: 8 }}
          />
          <button onClick={guardarTelefono} disabled={guardandoTel} style={{ padding: "8px 10px" }}>
            {guardandoTel ? "Guardando..." : "Guardar teléfono"}
          </button>
          {msgTel && <span>{msgTel}</span>}
        </div>
      )}
      {rol === "professional" && (
        <>
          <a href="/perfil">Mi perfil profesional</a>
          <a href="/servicios">Mis servicios</a>
          <a href="/suscripcion">Mi suscripción</a>
          <a href="/solicitudes">Solicitudes recibidas</a>
        </>
      )}
      {rol === "client" && (
        <>
          <a href="/solicitudes">Mis solicitudes</a>
          <a href="/profesionales">Buscar profesionales</a>
        </>
      )}
      {rol === "admin" && <a href="/admin">Panel de administración</a>}
      <button onClick={cerrarSesion}>Cerrar sesión</button>
    </main>
  );
}

