import { useEffect, useState } from "react";
import { View, Text, Button, FlatList, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";

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

const SIGUIENTES_ESTADOS: Record<string, { status: string; label: string }[]> = {
  pending: [
    { status: "contacted", label: "Marcar como contactado" },
    { status: "accepted", label: "Aceptar solicitud" },
    { status: "cancelled", label: "Cancelar" },
  ],
  contacted: [
    { status: "accepted", label: "Aceptar solicitud" },
    { status: "cancelled", label: "Cancelar" },
  ],
  accepted: [
    { status: "in_progress", label: "Iniciar trabajo" },
    { status: "cancelled", label: "Cancelar" },
  ],
  in_progress: [
    { status: "completed", label: "Marcar como completada" },
    { status: "cancelled", label: "Cancelar" },
  ],
};

export default function Solicitudes({ navigation }: any) {
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [rol, setRol] = useState("");
  const [filas, setFilas] = useState<Solicitud[]>([]);
  const [titulos, setTitulos] = useState<Record<string, string>>({});
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [reseniadas, setReseniadas] = useState<Set<string>>(new Set());

  async function cargarSolicitudes() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      navigation.replace("Login");
      return;
    }

    const { data: u } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const miRol = u?.role ?? "";
    setRol(miRol);

    let consulta = supabase
      .from("service_requests")
      .select("id, client_id, professional_id, service_id, description, desired_date, budget, status, created_at")
      .order("created_at", { ascending: false });

    if (miRol === "professional") {
      const { data: p } = await supabase
        .from("professional_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!p) {
        setMensaje("Tu perfil profesional todavia no existe.");
        setCargando(false);
        return;
      }

      consulta = consulta.eq("professional_id", p.id);
    } else if (miRol === "client") {
      consulta = consulta.eq("client_id", user.id);
    } else {
      setMensaje("Esta seccion es para clientes y profesionales.");
      setCargando(false);
      return;
    }

    const { data, error } = await consulta;

    if (error) {
      setMensaje("Error al cargar: " + error.message);
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
        (us ?? []).forEach((x) => {
          mapa[x.id as string] = (x.full_name as string) ?? "Sin nombre";
        });
      }
    } else {
      const profIds = [...new Set(lista.map((f) => f.professional_id))];
      if (profIds.length > 0) {
        const { data: pp } = await supabase.from("professional_profiles").select("id, user_id").in("id", profIds);
        const userIds = (pp ?? []).map((x) => x.user_id as string);
        const { data: us } =
          userIds.length > 0
            ? await supabase.from("users").select("id, full_name").in("id", userIds)
            : { data: [] as { id: string; full_name: string | null }[] };
        const porUsuario = Object.fromEntries((us ?? []).map((x) => [x.id as string, (x.full_name as string) ?? "Sin nombre"]));
        (pp ?? []).forEach((x) => {
          mapa[x.id as string] = porUsuario[x.user_id as string] ?? "Sin nombre";
        });
      }
    }

    setNombres(mapa);

    if (miRol === "client") {
      const completadasIds = lista.filter((f) => f.status === "completed").map((f) => f.id);
      if (completadasIds.length > 0) {
        const { data: rs } = await supabase.from("reviews").select("service_request_id").in("service_request_id", completadasIds);
        setReseniadas(new Set((rs ?? []).map((r) => r.service_request_id as string)));
      }
    }

    setCargando(false);
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", cargarSolicitudes);
    return unsubscribe;
  }, [navigation]);

  async function cambiarEstado(id: string, nuevoEstado: string) {
    setActualizando(id);
    setMensaje("");

    const { error } = await supabase.from("service_requests").update({ status: nuevoEstado }).eq("id", id);

    if (error) {
      setMensaje("No se pudo actualizar: " + error.message);
      setActualizando(null);
      return;
    }

    await cargarSolicitudes();
    setActualizando(null);
  }

  if (cargando) {
    return (
      <View style={styles.container}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>
        {rol === "professional" ? "Solicitudes recibidas" : "Mis solicitudes"}
      </Text>

      {mensaje ? <Text>{mensaje}</Text> : null}

      <FlatList
        data={filas}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={!mensaje ? <Text>Todavia no hay solicitudes.</Text> : null}
        renderItem={({ item: f }) => {
          const acciones = SIGUIENTES_ESTADOS[f.status];
          return (
            <View style={styles.tarjeta}>
              <Text style={styles.tituloTarjeta}>
                {f.service_id ? titulos[f.service_id] ?? "Servicio" : "Servicio"}
              </Text>

              {rol === "professional" ? (
                <Text>Cliente: {nombres[f.client_id] ?? "Sin nombre"}</Text>
              ) : (
                <Text>Profesional: {nombres[f.professional_id] ?? "Sin nombre"}</Text>
              )}

              {f.description ? <Text>{f.description}</Text> : null}
              {f.desired_date ? <Text>Fecha deseada: {f.desired_date}</Text> : null}
              {f.budget != null ? <Text>Presupuesto: ${f.budget} MXN</Text> : null}

              <Text style={styles.estado}>Estado: {ESTADOS[f.status] ?? f.status}</Text>
              <Text>Enviada: {new Date(f.created_at).toLocaleDateString("es-MX")}</Text>

              {rol === "professional" && acciones && f.status !== "completed" && f.status !== "cancelled" && (
                <View style={{ gap: 6, marginTop: 6 }}>
                  {acciones.map((accion) => (
                    <Button
                      key={accion.status}
                      title={actualizando === f.id ? "Actualizando..." : accion.label}
                      onPress={() => cambiarEstado(f.id, accion.status)}
                      disabled={actualizando === f.id}
                    />
                  ))}
                </View>
              )}

              {rol === "client" && f.status === "pending" && (
                <Button
                  title={actualizando === f.id ? "Cancelando..." : "Cancelar solicitud"}
                  onPress={() => cambiarEstado(f.id, "cancelled")}
                  disabled={actualizando === f.id}
                />
              )}

              {rol === "client" && f.status === "completed" && (
                reseniadas.has(f.id) ? (
                  <Text>Ya calificaste este servicio</Text>
                ) : (
                  <Text
                    style={styles.link}
                    onPress={() => navigation.navigate("Resena", { solicitudId: f.id })}
                  >
                    Calificar este servicio
                  </Text>
                )
              )}
            </View>
          );
        }}
      />

      <Text style={styles.link} onPress={() => navigation.navigate("Profesionales")}>
        Buscar profesionales
      </Text>
      <Text style={styles.link} onPress={() => navigation.navigate("Cuenta")}>
        Volver a mi cuenta
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  tarjeta: { borderWidth: 1, borderColor: "#666", borderRadius: 8, padding: 12, marginBottom: 10, gap: 4 },
  tituloTarjeta: { fontWeight: "bold" },
  estado: { fontWeight: "bold" },
  link: { color: "#0066cc", marginTop: 10 },
});