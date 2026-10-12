"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

function Enlace({ href, texto }: { href: string; texto: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-between border-b border-border px-4 py-4 text-foreground last:border-b-0 hover:bg-background hover:no-underline"
    >
      <span>{texto}</span>
      <span className="text-xl text-muted">›</span>
    </a>
  );
}

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

  if (cargando) {
    return <main className="p-10 text-center text-muted">Cargando...</main>;
  }

  const inicial = (nombre.trim()[0] ?? "?").toUpperCase();
  const etiquetaRol =
    rol === "professional" ? "Profesional" : rol === "admin" ? "Administrador" : "Cliente";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-card">
        <nav className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-3">
          <a href="/" className="text-2xl font-bold text-primary hover:no-underline">
            Oficios
          </a>
          <button onClick={cerrarSesion} className="!bg-white !text-primary border border-primary text-sm">
            Cerrar sesión
          </button>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-8">
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-primary p-6 text-center shadow-sm">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-bold text-primary">
            {inicial}
          </div>
          <p className="text-xl font-bold text-white">{nombre}</p>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-foreground">
            {etiquetaRol}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
          {rol === "professional" && (
            <>
              <Enlace href="/perfil" texto="Mi perfil profesional" />
              <Enlace href="/servicios" texto="Mis servicios" />
              <Enlace href="/suscripcion" texto="Mi suscripción" />
              <Enlace href="/solicitudes" texto="Solicitudes recibidas" />
            </>
          )}
          {rol === "client" && (
            <>
              <Enlace href="/solicitudes" texto="Mis solicitudes" />
              <Enlace href="/profesionales" texto="Buscar profesionales" />
            </>
          )}
          {rol === "admin" && <Enlace href="/admin" texto="Panel de administración" />}
        </div>

        {rol === "client" && (
          <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-sm">
            <strong className="text-primary-dark">Mi teléfono de contacto</strong>
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Teléfono (opcional)"
            />
            {msgTel && <span className="text-sm text-muted">{msgTel}</span>}
            <button onClick={guardarTelefono} disabled={guardandoTel}>
              {guardandoTel ? "Guardando..." : "Guardar teléfono"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}