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

      console.log("USUARIO ACTUAL:", user.id, user.email);

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

  if (cargando) return <main style={{ padding: 16 }}>Cargando...</main>;

  if (!esCliente) {
    return (
      <main style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
        <h1>Solicitar servicio</h1>
        <p>Solo las cuentas de tipo Cliente pueden solicitar servicios.</p>
        <a href="/cuenta">Volver a mi cuenta</a>
      </main>
    );
  }

  if (!servicio) {
    return (
      <main style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
        <h1>Solicitar servicio</h1>
        <p>{mensaje}</p>
        <a href="/profesionales">Buscar profesionales</a>
      </main>
    );
  }

  if (enviado) {
    return (
      <main style={{ maxWidth: 480, margin: "40px auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <h1>¡Solicitud enviada!</h1>
        <p>El profesional la verá en su cuenta y te contactará.</p>
        <a href="/solicitudes">Ver mis solicitudes</a>
        <a href="/profesionales">Seguir buscando</a>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: "40px auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Solicitar servicio</h1>

      <div style={{ border: "1px solid #666", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
        <strong>{servicio.title}</strong>
        <span>Profesional: {servicio.professional_profiles?.users?.full_name ?? "Sin nombre"}</span>
        {servicio.price_text && <span>Precio: {servicio.price_text}</span>}
        <span>Zona: {[servicio.municipality, servicio.state].filter(Boolean).join(", ") || "Sin zona"}</span>
      </div>

      <textarea rows={4} placeholder="Describe qué necesitas" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      <label>Fecha deseada (opcional)</label>
      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      <input type="number" min={0} placeholder="Tu presupuesto en MXN (opcional)" value={presupuesto} onChange={(e) => setPresupuesto(e.target.value)} />

      <button onClick={enviar} disabled={enviando}>
        {enviando ? "Enviando..." : "Enviar solicitud"}
      </button>

      {mensaje && <p>{mensaje}</p>}

      <a href="/profesionales">Volver a la búsqueda</a>
    </main>
  );
}

