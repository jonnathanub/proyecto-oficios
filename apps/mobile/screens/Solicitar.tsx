import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";

type Servicio = {
  id: string;
  title: string;
  price_text: string | null;
  municipality: string | null;
  state: string | null;
  professional_id: string;
  professional_profiles: { users: { full_name: string | null } | null } | null;
};

export default function Solicitar({ route, navigation }: any) {
  const servicioId = route.params?.servicioId as string | undefined;

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
      if (!servicioId) {
        setMensaje("Falta indicar el servicio.");
        setCargando(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setMensaje("No hay una sesion iniciada.");
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

      if (!s) setMensaje("No encontramos ese servicio o ya no esta disponible.");
      setServicio(s as unknown as Servicio | null);
      setCargando(false);
    }
    cargar();
  }, [servicioId]);

  async function enviar() {
    setMensaje("");
    if (!servicio) return;
    if (!descripcion.trim()) {
      setMensaje("Cuentale al profesional que necesitas.");
      return;
    }
    const monto = presupuesto === "" ? null : Number(presupuesto);
    if (monto !== null && (Number.isNaN(monto) || monto < 0)) {
      setMensaje("El presupuesto debe ser un numero.");
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
      setMensaje("No se pudo enviar la solicitud. " + error.message);
      return;
    }
    setEnviado(true);
  }

  if (cargando) {
    return (
      <View style={styles.container}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  if (!esCliente) {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Solicitar servicio</Text>
        <Text>Solo las cuentas de tipo Cliente pueden solicitar servicios.</Text>
        <Text style={styles.link} onPress={() => navigation.navigate("Cuenta")}>
          Volver a mi cuenta
        </Text>
      </View>
    );
  }

  if (!servicio) {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Solicitar servicio</Text>
        <Text>{mensaje}</Text>
        <Text style={styles.link} onPress={() => navigation.navigate("Profesionales")}>
          Buscar profesionales
        </Text>
      </View>
    );
  }

  if (enviado) {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Solicitud enviada!</Text>
        <Text>El profesional la vera en su cuenta y te contactara.</Text>
        <Text style={styles.link} onPress={() => navigation.navigate("Solicitudes")}>
          Ver mis solicitudes
        </Text>
        <Text style={styles.link} onPress={() => navigation.navigate("Profesionales")}>
          Seguir buscando
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Solicitar servicio</Text>

      <View style={styles.tarjeta}>
        <Text style={styles.tituloTarjeta}>{servicio.title}</Text>
        <Text>Profesional: {servicio.professional_profiles?.users?.full_name ?? "Sin nombre"}</Text>
        {servicio.price_text ? <Text>Precio: {servicio.price_text}</Text> : null}
        <Text>Zona: {[servicio.municipality, servicio.state].filter(Boolean).join(", ") || "Sin zona"}</Text>
      </View>

      <TextInput
        style={[styles.input, { height: 90, textAlignVertical: "top" }]}
        placeholder="Describe que necesitas"
        multiline
        value={descripcion}
        onChangeText={setDescripcion}
      />
      <TextInput
        style={styles.input}
        placeholder="Fecha deseada (ej. 2026-10-15, opcional)"
        value={fecha}
        onChangeText={setFecha}
      />
      <TextInput
        style={styles.input}
        placeholder="Tu presupuesto en MXN (opcional)"
        keyboardType="numeric"
        value={presupuesto}
        onChangeText={setPresupuesto}
      />

      <Button title={enviando ? "Enviando..." : "Enviar solicitud"} onPress={enviar} disabled={enviando} />

      {mensaje ? <Text>{mensaje}</Text> : null}

      <Text style={styles.link} onPress={() => navigation.navigate("Profesionales")}>
        Volver a la busqueda
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16, gap: 10 },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#888", borderRadius: 8, padding: 10 },
  tarjeta: { borderWidth: 1, borderColor: "#666", borderRadius: 8, padding: 12, gap: 2 },
  tituloTarjeta: { fontWeight: "bold" },
  link: { color: "#0066cc", marginTop: 10 },
});