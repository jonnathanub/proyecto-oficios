"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Plan = {
  id: string;
  name: string;
  price: number;
  active: boolean;
};

type Suscripcion = {
  id: string;
  professional_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  simulated: boolean;
};

const ESTADOS: Record<string, { texto: string; clase: string }> = {
  active: { texto: "Activa", clase: "bg-emerald-100 text-emerald-800" },
  cancelled: { texto: "Cancelada", clase: "bg-red-100 text-red-800" },
  expired: { texto: "Vencida", clase: "bg-gray-200 text-gray-700" },
};

export default function AdminSuscripciones() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [nombresPlan, setNombresPlan] = useState<Record<string, string>>({});
  const [nombresProfesional, setNombresProfesional] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState<string | null>(null);

  const [nombrePlan, setNombrePlan] = useState("");
  const [precioPlan, setPrecioPlan] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function cargar() {
    const { data: pl } = await supabase
      .from("subscription_plans")
      .select("id, name, price, active")
      .order("price");
    const listaPlanes = (pl ?? []) as Plan[];
    setPlanes(listaPlanes);
    setNombresPlan(Object.fromEntries(listaPlanes.map((p) => [p.id, p.name])));

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id, professional_id, plan_id, status, start_date, end_date, simulated")
      .order("start_date", { ascending: false });
    const listaSubs = (sub ?? []) as Suscripcion[];
    setSuscripciones(listaSubs);

    const profIds = [...new Set(listaSubs.map((s) => s.professional_id))];
    if (profIds.length > 0) {
      const { data: pp } = await supabase
        .from("professional_profiles")
        .select("id, user_id")
        .in("id", profIds);

      const userIds = (pp ?? []).map((p) => p.user_id);
      const { data: us } =
        userIds.length > 0
          ? await supabase.from("users").select("id, full_name").in("id", userIds)
          : { data: [] as { id: string; full_name: string | null }[] };

      const porUsuario = Object.fromEntries(
        (us ?? []).map((u) => [u.id, u.full_name ?? "Sin nombre"])
      );

      setNombresProfesional(
        Object.fromEntries(
          (pp ?? []).map((p) => [p.id, porUsuario[p.user_id] ?? "Sin nombre"])
        )
      );
    }

    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crearPlan() {
    if (!nombrePlan) {
      setMensaje("El nombre del plan es obligatorio.");
      return;
    }
    setGuardando(true);
    setMensaje("");

    const { error } = await supabase.from("subscription_plans").insert({
      name: nombrePlan,
      price: precioPlan === "" ? 0 : parseFloat(precioPlan),
    });

    if (error) {
      setMensaje(`No se pudo crear: ${error.message}`);
      setGuardando(false);
      return;
    }

    setNombrePlan("");
    setPrecioPlan("");
    setGuardando(false);
    await cargar();
  }

  async function alternarPlanActivo(id: string, actual: boolean) {
    setActualizando(id);
    await supabase.from("subscription_plans").update({ active: !actual }).eq("id", id);
    await cargar();
    setActualizando(null);
  }

  async function cambiarEstadoSuscripcion(id: string, nuevoEstado: string) {
    setActualizando(id);
    await supabase.from("subscriptions").update({ status: nuevoEstado }).eq("id", id);
    await cargar();
    setActualizando(null);
  }

  if (cargando) return <p className="py-10 text-center text-muted">Cargando...</p>;

  return (
    <main className="flex flex-col gap-10">
      <section className="flex flex-col gap-5">
        <h1>Planes de suscripción</h1>

        <div className="flex max-w-md flex-col gap-3 rounded-2xl bg-card p-5 shadow-sm">
          <h2>Nuevo plan</h2>
          <input
            placeholder="Nombre del plan (ej. Destacado)"
            value={nombrePlan}
            onChange={(e) => setNombrePlan(e.target.value)}
          />
          <input
            placeholder="Precio (ej. 199)"
            value={precioPlan}
            onChange={(e) => setPrecioPlan(e.target.value)}
          />

          {mensaje && (
            <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-danger">{mensaje}</p>
          )}

          <button onClick={crearPlan} disabled={guardando} className="w-full">
            {guardando ? "Guardando..." : "Crear plan"}
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {planes.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted">
                    Todavía no hay planes.
                  </td>
                </tr>
              )}
              {planes.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="font-medium">{p.name}</td>
                  <td className="font-bold text-primary">${p.price} MXN</td>
                  <td>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        p.active ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {p.active ? "Activo" : "Desactivado"}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => alternarPlanActivo(p.id, p.active)}
                      disabled={actualizando === p.id}
                      className={p.active ? "border border-primary bg-white text-primary" : ""}
                    >
                      {p.active ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <h1>Suscripciones de profesionales</h1>

        <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th>Profesional</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>Simulada</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {suscripciones.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted">
                    No hay suscripciones todavía.
                  </td>
                </tr>
              )}
              {suscripciones.map((s) => {
                const estado = ESTADOS[s.status] ?? {
                  texto: s.status,
                  clase: "bg-gray-100 text-gray-700",
                };
                return (
                  <tr key={s.id} className="border-t border-border">
                    <td className="font-medium">
                      {nombresProfesional[s.professional_id] ?? "Sin nombre"}
                    </td>
                    <td>{nombresPlan[s.plan_id] ?? "-"}</td>
                    <td>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${estado.clase}`}>
                        {estado.texto}
                      </span>
                    </td>
                    <td className="text-muted">{s.simulated ? "Sí" : "No"}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        {s.status !== "active" && (
                          <button
                            onClick={() => cambiarEstadoSuscripcion(s.id, "active")}
                            disabled={actualizando === s.id}
                          >
                            Activar
                          </button>
                        )}
                        {s.status !== "cancelled" && (
                          <button
                            onClick={() => cambiarEstadoSuscripcion(s.id, "cancelled")}
                            disabled={actualizando === s.id}
                            className="bg-danger"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}