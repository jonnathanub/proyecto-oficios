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
      setMensaje("Esta sección es solo para cuentas de tipo Profesional.");
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

    const { error } = await supabase.rpc("contratar_plan", { p_plan_id: planId });

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

    const { error } = await supabase.rpc("cancelar_suscripcion");
    if (error) {
      setMensaje(`No se pudo cancelar: ${error.message}`);
    }

    await cargar();
    setProcesando(null);
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

  if (mensaje && !perfilId) {
    return (
      <div className="flex min-h-screen flex-col">
        <Cabecera />
        <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-8">
          <h1>Suscripción</h1>
          <p className="rounded-2xl bg-card p-5 shadow-sm">{mensaje}</p>
          <a href="/cuenta">Volver a mi cuenta</a>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Cabecera />

      <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-8">
        <h1>Mi suscripción</h1>

        <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800">
          Los pagos son simulados por ahora, no se realiza ningún cobro real.
        </p>

        {actual ? (
          <div className="flex flex-col gap-3 rounded-2xl border-2 border-emerald-500 bg-card p-5 shadow-sm">
            <strong className="text-lg text-emerald-800">✓ Plan activo</strong>
            <p>
              Tienes un plan activo hasta{" "}
              {actual.end_date ? new Date(actual.end_date).toLocaleDateString("es-MX") : "-"}.
            </p>
            <button onClick={cancelar} disabled={procesando === actual.id} className="bg-danger">
              {procesando === actual.id ? "Cancelando..." : "Cancelar suscripción"}
            </button>
          </div>
        ) : (
          <p className="text-muted">
            No tienes un plan activo. Tu perfil aparece en orden normal en las búsquedas.
          </p>
        )}

        {!actual && (
          <div className="flex flex-col gap-4">
            <h2>Planes disponibles</h2>
            {planes.length === 0 && (
              <p className="text-muted">Todavía no hay planes configurados.</p>
            )}
            {planes.map((p) => (
              <div key={p.id} className="flex flex-col gap-2 rounded-2xl bg-card p-5 shadow-sm">
                <strong className="text-lg">{p.name}</strong>
                <p className="text-3xl font-bold text-primary">
                  ${p.price}{" "}
                  <span className="text-sm font-semibold text-muted">MXN / mes</span>
                </p>
                <p className="text-sm text-muted">(simulado)</p>
                <button onClick={() => contratar(p.id)} disabled={procesando === p.id}>
                  {procesando === p.id ? "Activando..." : "Contratar"}
                </button>
              </div>
            ))}
          </div>
        )}

        {mensaje && (
          <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-danger">{mensaje}</p>
        )}

        <a href="/cuenta" className="text-center">
          Volver a mi cuenta
        </a>
      </main>
    </div>
  );
}