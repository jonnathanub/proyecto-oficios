import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";
import { colors, spacing, radius, font, shadow } from "../theme";
import Boton from "../components/Boton";
import Campo from "../components/Campo";

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
  }, [servicioId]);

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
      setMensaje("No se pudo enviar la solicitud. " + error.message);
      return;
    }
    setEnviado(true);
  }

  if (cargando) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.textMuted }}>Cargando...</Text>
      </View>
    );
  }

  if (!esCliente) {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Solicitar servicio</Text>
        <View style={styles.tarjeta}>
          <Text style={styles.texto}>
            Solo las cuentas de tipo Cliente pueden solicitar servicios.
          </Text>
        </View>
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
        <View style={styles.tarjeta}>
          <Text style={styles.texto}>{mensaje}</Text>
        </View>
        <Text style={styles.link} onPress={() => navigation.navigate("Profesionales")}>
          Buscar profesionales
        </Text>
      </View>
    );
  }

  if (enviado) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <View style={styles.tarjeta}>
          <Text style={styles.exitoIcono}>✓</Text>
          <Text style={styles.exitoTitulo}>¡Solicitud enviada!</Text>
          <Text style={styles.texto}>
            El profesional la verá en su cuenta y te contactará.
          </Text>
          <Boton
            titulo="Ver mis solicitudes"
            onPress={() => navigation.navigate("Solicitudes")}
          />
          <Boton
            titulo="Seguir buscando"
            tipo="secundario"
            onPress={() => navigation.navigate("Profesionales")}
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.titulo}>Solicitar servicio</Text>

      <View style={styles.tarjeta}>
        <Text style={styles.tituloTarjeta}>{servicio.title}</Text>
        <Text style={styles.profesional}>
          {servicio.professional_profiles?.users?.full_name ?? "Sin nombre"}
        </Text>
        {servicio.price_text ? <Text style={styles.precio}>{servicio.price_text}</Text> : null}
        <Text style={styles.zona}>
          📍 {[servicio.municipality, servicio.state].filter(Boolean).join(", ") || "Sin zona"}
        </Text>
      </View>

      <View style={styles.formulario}>
        <Campo
          style={{ height: 100, textAlignVertical: "top" }}
          placeholder="Describe qué necesitas"
          multiline
          value={descripcion}
          onChangeText={setDescripcion}
        />
        <Campo
          placeholder="Fecha deseada (ej. 2026-10-15, opcional)"
          value={fecha}
          onChangeText={setFecha}
        />
        <Campo
          placeholder="Tu presupuesto en MXN (opcional)"
          keyboardType="numeric"
          value={presupuesto}
          onChangeText={setPresupuesto}
        />

        {mensaje ? (
          <View style={styles.errorCaja}>
            <Text style={styles.errorTexto}>{mensaje}</Text>
          </View>
        ) : null}

        <Boton
          titulo={enviando ? "Enviando..." : "Enviar solicitud"}
          onPress={enviar}
          deshabilitado={enviando}
        />
      </View>

      <Text style={styles.link} onPress={() => navigation.navigate("Profesionales")}>
        Volver a la búsqueda
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingTop: 60,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  titulo: { fontSize: font.title, fontWeight: "bold", color: colors.text },
  texto: { fontSize: font.body, color: colors.text },
  tarjeta: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow,
  },
  tituloTarjeta: { fontSize: 18, fontWeight: "bold", color: colors.text },
  profesional: { fontSize: font.body, color: colors.textMuted },
  precio: { fontSize: font.body, fontWeight: "700", color: colors.primary },
  zona: { fontSize: font.small, color: colors.textMuted },
  formulario: { gap: spacing.sm + 4 },
  errorCaja: { backgroundColor: "#FEE2E2", borderRadius: radius.sm, padding: spacing.sm + 4 },
  errorTexto: { color: colors.danger, fontSize: font.small },
  exitoIcono: { fontSize: 40, color: "#065F46", textAlign: "center" },
  exitoTitulo: { fontSize: font.title, fontWeight: "bold", color: colors.text, textAlign: "center" },
  link: {
    color: colors.primary,
    textAlign: "center",
    fontSize: font.body,
    fontWeight: "600",
    marginTop: spacing.sm,
  },
});