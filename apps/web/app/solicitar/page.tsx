"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Servicio = {
  id: string;
  title: string;
  price_text: string | null;
  municipality: string | null;
  state: string | null;
  professional_id: string;
  professional_profiles: { users: { full_name: string | null } | null } | null;
};

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

export default function Solicitar() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [esCliente, setEsCliente] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [userId, setUserId] = useState("");
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [presupuesto, setPresupuesto] = useState("");

  useEffect(() => {
    async function cargar() {
      const servicioId = new URLSearchParams(window.location.search).get("servicio");
      if (!servicioId) {
        setMensaje("Falta indicar el servicio.");
        setCargando(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setMensaje("No hay una sesión iniciada.");
        setCargando(false);
        return;
      }

      setUserId(user.id);

      const { data: u } = await supabase.from("users").select("role").eq("id", user.id).single();
      if (u?.role !== "client") {
        setEsCliente(false);
        setCargando(false);
        return;
      }

      const { data: s } = await supabase
        .from("services")
        .select("id, title, price_text, municipality, state, professional_id, professional_profiles(users(full_name))")
        .eq("id", servicioId)
        .eq("active", true)
        .maybeSingle();

      if (!s) setMensaje("No encontramos ese servicio o ya no está disponible.");
      setServicio(s as unknown as Servicio | null);
      setCargando(false);
    }
    cargar();
  }, [router]);

  async function enviar() {
    setMensaje("");
    if (!servicio) return;
    if (!descripcion.trim()) {
      setMensaje("Cuéntale al profesional qué necesitas.");
      return;
    }
    const monto = presupuesto === "" ? null : Number(presupuesto);
    if (monto !== null && (Number.isNaN(monto) || monto < 0)) {
      setMensaje("El presupuesto debe ser un número.");
      return;
    }
    setEnviando(true);

    const { error } = await supabase.from("service_requests").insert({
      client_id: userId,
      professional_id: servicio.professional_id,
      service_id: servicio.id,
      description: descripcion.trim(),
      desired_date: fecha || null,
      budget: monto,
    });

    setEnviando(false);
    if (error) {
      setMensaje(`No se pudo enviar la solicitud. ${error.message}`);
      return;
    }
    setEnviado(true);
  }

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

  if (!esCliente) {
    return (
      <div className="flex min-h-screen flex-col">
        <Cabecera />
        <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-8">
          <h1>Solicitar servicio</h1>
          <p className="rounded-2xl bg-card p-5 shadow-sm">
            Solo las cuentas de tipo Cliente pueden solicitar servicios.
          </p>
          <a href="/cuenta">Volver a mi cuenta</a>
        </main>
      </div>
    );
  }

  if (!servicio) {
    return (
      <div className="flex min-h-screen flex-col">
        <Cabecera />
        <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-8">
          <h1>Solicitar servicio</h1>
          <p className="rounded-2xl bg-card p-5 shadow-sm">{mensaje}</p>
          <a href="/profesionales">Buscar profesionales</a>
        </main>
      </div>
    );
  }

  if (enviado) {
    return (
      <div className="flex min-h-screen flex-col">
        <Cabecera />
        <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-8">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-8 text-center shadow-sm">
            <span className="text-5xl text-emerald-700">✓</span>
            <h1>¡Solicitud enviada!</h1>
            <p className="text-muted">El profesional la verá en su cuenta y te contactará.</p>
            <a
              href="/solicitudes"
              className="mt-2 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white hover:no-underline"
            >
              Ver mis solicitudes
            </a>
            <a href="/profesionales">Seguir buscando</a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Cabecera />
      <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-8">
        <h1>Solicitar servicio</h1>

        <div className="flex flex-col gap-1 rounded-2xl bg-card p-5 shadow-sm">
          <strong className="text-lg">{servicio.title}</strong>
          <span className="text-muted">
            {servicio.professional_profiles?.users?.full_name ?? "Sin nombre"}
          </span>
          {servicio.price_text && (
            <span className="font-bold text-primary">{servicio.price_text}</span>
          )}
          <span className="text-sm text-muted">
            📍 {[servicio.municipality, servicio.state].filter(Boolean).join(", ") || "Sin zona"}
          </span>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-sm">
          <textarea
            rows={4}
            placeholder="Describe qué necesitas"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          <label className="text-sm text-muted">Fecha deseada (opcional)</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <input
            type="number"
            min={0}
            placeholder="Tu presupuesto en MXN (opcional)"
            value={presupuesto}
            onChange={(e) => setPresupuesto(e.target.value)}
          />

          {mensaje && (
            <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-danger">{mensaje}</p>
          )}

          <button onClick={enviar} disabled={enviando} className="w-full">
            {enviando ? "Enviando..." : "Enviar solicitud"}
          </button>
        </div>

        <a href="/profesionales" className="text-center">
          Volver a la búsqueda
        </a>
      </main>
    </div>
  );
}