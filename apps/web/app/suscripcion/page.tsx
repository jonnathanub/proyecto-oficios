"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Plan = {
  id: string;
  name: string;
  price: number;
  active: boolean;
};

type MiSuscripcion = {
  id: string;
  plan_id: string;
  status: string;
  end_date: string | null;
};

export default function Suscripcion() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [perfilId, setPerfilId] = useState("");
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [actual, setActual] = useState<MiSuscripcion | null>(null);

  async function cargar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: p } = await supabase
      .from("professional_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!p) {
      setMensaje("Esta seccion es solo para cuentas de tipo Profesional.");
      setCargando(false);
      return;
    }
    setPerfilId(p.id);

    const { data: pl } = await supabase
      .from("subscription_plans")
      .select("id, name, price, active")
      .eq("active", true)
      .order("price");
    setPlanes((pl ?? []) as Plan[]);

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id, plan_id, status, end_date")
      .eq("professional_id", p.id)
      .eq("status", "active")
      .maybeSingle();

    setActual(sub as MiSuscripcion | null);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, [router]);

  async function contratar(planId: string) {
    setProcesando(planId);
    setMensaje("");

    const { error } = await supabase.from("subscriptions").insert({
      professional_id: perfilId,
      plan_id: planId,
      status: "active",
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      simulated: true,
    });

    if (error) {
      setMensaje(`No se pudo activar: ${error.message}`);
      setProcesando(null);
      return;
    }

    await cargar();
    setProcesando(null);
  }

  async function cancelar() {
    if (!actual) return;
    setProcesando(actual.id);

    await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("id", actual.id);

    await cargar();
    setProcesando(null);
  }

  if (cargando) return <main style={{ padding: 16 }}>Cargando...</main>;

  if (mensaje && !perfilId) {
    return (
      <main style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
        <h1>Suscripcion</h1>
        <p>{mensaje}</p>
        <a href="/cuenta">Volver a mi cuenta</a>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: "40px auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Mi suscripcion</h1>
      <p style={{ fontSize: 13, opacity: 0.8 }}>
        Los pagos son simulados por ahora, no se realiza ningun cobro real.
      </p>

      {actual ? (
        <div style={{ border: "1px solid #666", borderRadius: 8, padding: 12 }}>
          <p>Tienes un plan activo hasta {actual.end_date ? new Date(actual.end_date).toLocaleDateString("es-MX") : "-"}.</p>
          <button onClick={cancelar} disabled={procesando === actual.id}>
            {procesando === actual.id ? "Cancelando..." : "Cancelar suscripcion"}
          </button>
        </div>
      ) : (
        <p>No tienes un plan activo. Tu perfil aparece en orden normal en las busquedas.</p>
      )}

      {!actual && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h2>Planes disponibles</h2>
          {planes.length === 0 && <p>Todavia no hay planes configurados.</p>}
          {planes.map((p) => (
            <div key={p.id} style={{ border: "1px solid #666", borderRadius: 8, padding: 12 }}>
              <strong>{p.name}</strong>
              <p>${p.price} MXN / mes (simulado)</p>
              <button onClick={() => contratar(p.id)} disabled={procesando === p.id}>
                {procesando === p.id ? "Activando..." : "Contratar"}
              </button>
            </div>
          ))}
        </div>
      )}

      {mensaje && <p>{mensaje}</p>}

      <a href="/cuenta">Volver a mi cuenta</a>
    </main>
  );
}