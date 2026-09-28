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

  if (cargando) return <p>Cargando...</p>;

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1>Planes de suscripcion</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320, marginBottom: 16 }}>
          <input placeholder="Nombre del plan (ej. Destacado)" value={nombrePlan} onChange={(e) => setNombrePlan(e.target.value)} />
          <input placeholder="Precio (ej. 199)" value={precioPlan} onChange={(e) => setPrecioPlan(e.target.value)} />
          <button onClick={crearPlan} disabled={guardando}>
            {guardando ? "Guardando..." : "Crear plan"}
          </button>
          {mensaje && <p>{mensaje}</p>}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Nombre</th>
              <th style={{ textAlign: "left" }}>Precio</th>
              <th style={{ textAlign: "left" }}>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {planes.map((p) => (
              <tr key={p.id} style={{ borderTop: "1px solid #444" }}>
                <td>{p.name}</td>
                <td>${p.price} MXN</td>
                <td>{p.active ? "Activo" : "Desactivado"}</td>
                <td>
                  <button onClick={() => alternarPlanActivo(p.id, p.active)} disabled={actualizando === p.id}>
                    {p.active ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h1>Suscripciones de profesionales</h1>
        {suscripciones.length === 0 && <p>No hay suscripciones todavia.</p>}

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Profesional</th>
              <th style={{ textAlign: "left" }}>Plan</th>
              <th style={{ textAlign: "left" }}>Estado</th>
              <th style={{ textAlign: "left" }}>Simulada</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {suscripciones.map((s) => (
              <tr key={s.id} style={{ borderTop: "1px solid #444" }}>
                <td>{nombresProfesional[s.professional_id] ?? "Sin nombre"}</td>
                <td>{nombresPlan[s.plan_id] ?? "-"}</td>
                <td>{s.status}</td>
                <td>{s.simulated ? "Si" : "No"}</td>
                <td style={{ display: "flex", gap: 6 }}>
                  {s.status !== "active" && (
                    <button onClick={() => cambiarEstadoSuscripcion(s.id, "active")} disabled={actualizando === s.id}>
                      Activar
                    </button>
                  )}
                  {s.status !== "cancelled" && (
                    <button onClick={() => cambiarEstadoSuscripcion(s.id, "cancelled")} disabled={actualizando === s.id}>
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}