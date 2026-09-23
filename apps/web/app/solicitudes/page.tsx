"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Solicitud = {
  id: string;
  client_id: string;
  professional_id: string;
  service_id: string | null;
  description: string | null;
  desired_date: string | null;
  budget: number | null;
  status: string;
  created_at: string;
};

const ESTADOS: Record<string, string> = {
  pending: "Pendiente",
  contacted: "Contactado",
  accepted: "Aceptada",
  in_progress: "En proceso",
  completed: "Completada",
  cancelled: "Cancelada",
};

export default function Solicitudes() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [rol, setRol] = useState("");
  const [filas, setFilas] = useState<Solicitud[]>([]);
  const [titulos, setTitulos] = useState<Record<string, string>>({});
  const [nombres, setNombres] = useState<Record<string, string>>({});

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: u } = await supabase.from("users").select("role").eq("id", user.id).single();
      const miRol = u?.role ?? "";
      setRol(miRol);

      let consulta = supabase
        .from("service_requests")
        .select("id, client_id, professional_id, service_id, description, desired_date, budget, status, created_at")
        .order("created_at", { ascending: false });

      if (miRol === "professional") {
        const { data: p } = await supabase.from("professional_profiles").select("id").eq("user_id", user.id).maybeSingle();
        if (!p) {
          setMensaje("Tu perfil profesional todavía no existe.");
          setCargando(false);
          return;
        }
        consulta = consulta.eq("professional_id", p.id);
      } else if (miRol === "client") {
        consulta = consulta.eq("client_id", user.id);
      } else {
        setMensaje("Esta sección es para clientes y profesionales.");
        setCargando(false);
        return;
      }

      const { data, error } = await consulta;
      if (error) {
        setMensaje(`Error al cargar: ${error.message}`);
        setCargando(false);
        return;
      }
      const lista = (data ?? []) as Solicitud[];
      setFilas(lista);

      const servIds = [...new Set(lista.map((f) => f.service_id).filter(Boolean))] as string[];
      if (servIds.length > 0) {
        const { data: sv } = await supabase.from("services").select("id, title").in("id", servIds);
        setTitulos(Object.fromEntries((sv ?? []).map((x) => [x.id as string, x.title as string])));
      }

      const mapa: Record<string, string> = {};
      if (miRol === "professional") {
        const ids = [...new Set(lista.map((f) => f.client_id))];
        if (ids.length > 0) {
          const { data: us } = await supabase.from("users").select("id, full_name").in("id", ids);
          (us ?? []).forEach((x) => { mapa[x.id as string] = (x.full_name as string) ?? "Sin nombre"; });
        }
      } else {
        const profIds = [...new Set(lista.map((f) => f.professional_id))];
        if (profIds.length > 0) {
          const { data: pp } = await supabase.from("professional_profiles").select("id, user_id").in("id", profIds);
          const userIds = (pp ?? []).map((x) => x.user_id as string);
          const { data: us } = userIds.length > 0
            ? await supabase.from("users").select("id, full_name").in("id", userIds)
            : { data: [] as { id: string; full_name: string | null }[] };
          const porUsuario = Object.fromEntries((us ?? []).map((x) => [x.id as string, (x.full_name as string) ?? "Sin nombre"]));
          (pp ?? []).forEach((x) => { mapa[x.id as string] = porUsuario[x.user_id as string] ?? "Sin nombre"; });
        }
      }
      setNombres(mapa);
      setCargando(false);
    }
    cargar();
  }, [router]);

  if (cargando) return <main style={{ padding: 16 }}>Cargando...</main>;

  return (
    <main style={{ maxWidth: 560, margin: "40px auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>{rol === "professional" ? "Solicitudes recibidas" : "Mis solicitudes"}</h1>

      {mensaje && <p>{mensaje}</p>}
      {!mensaje && filas.length === 0 && <p>Todavía no hay solicitudes.</p>}

      {filas.map((f) => (
        <div key={f.id} style={{ border: "1px solid #666", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
          <strong>{f.service_id ? titulos[f.service_id] ?? "Servicio" : "Servicio"}</strong>
          {rol === "professional"
            ? <span>Cliente: {nombres[f.client_id] ?? "Sin nombre"}</span>
            : <span>Profesional: {nombres[f.professional_id] ?? "Sin nombre"}</span>}
          {f.description && <span>{f.description}</span>}
          {f.desired_date && <span>Fecha deseada: {f.desired_date}</span>}
          {f.budget != null && <span>Presupuesto: ${f.budget} MXN</span>}
          <span>Estado: {ESTADOS[f.status] ?? f.status}</span>
          <span>Enviada: {new Date(f.created_at).toLocaleDateString("es-MX")}</span>
        </div>
      ))}

      <a href="/profesionales">Buscar profesionales</a>
      <a href="/cuenta">Volver a mi cuenta</a>
    </main>
  );
}
