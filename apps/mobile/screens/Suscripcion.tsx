import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";
import { colors, spacing, radius, font, shadow } from "../theme";
import Boton from "../components/Boton";

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

export default function Suscripcion({ navigation }: any) {
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [perfilId, setPerfilId] = useState("");
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [actual, setActual] = useState<MiSuscripcion | null>(null);

  async function cargar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigation.replace("Login");
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
  }, [navigation]);

  async function contratar(planId: string) {
    setProcesando(planId);
    setMensaje("");

    const { error } = await supabase.rpc("contratar_plan", { p_plan_id: planId });

    if (error) {
      setMensaje("No se pudo activar: " + error.message);
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
      setMensaje("No se pudo cancelar: " + error.message);
    }

    await cargar();
    setProcesando(null);
  }

  if (cargando) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.textMuted }}>Cargando...</Text>
      </View>
    );
  }

  if (mensaje && !perfilId) {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Suscripción</Text>
        <View style={styles.tarjeta}>
          <Text style={styles.texto}>{mensaje}</Text>
        </View>
        <Text style={styles.link} onPress={() => navigation.navigate("Cuenta")}>
          Volver a mi cuenta
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Mi suscripción</Text>

      <View style={styles.aviso}>
        <Text style={styles.avisoTexto}>
          Los pagos son simulados por ahora, no se realiza ningún cobro real.
        </Text>
      </View>

      {actual ? (
        <View style={[styles.tarjeta, styles.tarjetaActiva]}>
          <Text style={styles.activaTitulo}>✓ Plan activo</Text>
          <Text style={styles.texto}>
            Tienes un plan activo hasta{" "}
            {actual.end_date ? new Date(actual.end_date).toLocaleDateString("es-MX") : "-"}.
          </Text>
          <Boton
            titulo={procesando === actual.id ? "Cancelando..." : "Cancelar suscripción"}
            tipo="peligro"
            onPress={cancelar}
            deshabilitado={procesando === actual.id}
          />
        </View>
      ) : (
        <Text style={styles.textoSuave}>
          No tienes un plan activo. Tu perfil aparece en orden normal en las búsquedas.
        </Text>
      )}

      {!actual && (
        <View style={{ flex: 1 }}>
          <Text style={styles.seccion}>Planes disponibles</Text>
          {planes.length === 0 && (
            <Text style={styles.textoSuave}>Todavía no hay planes configurados.</Text>
          )}
          <FlatList
            data={planes}
            keyExtractor={(item) => item.id}
            renderItem={({ item: p }) => (
              <View style={styles.tarjeta}>
                <Text style={styles.tituloTarjeta}>{p.name}</Text>
                <Text style={styles.precio}>
                  ${p.price} <Text style={styles.precioUnidad}>MXN / mes</Text>
                </Text>
                <Text style={styles.simulado}>(simulado)</Text>
                <Boton
                  titulo={procesando === p.id ? "Activando..." : "Contratar"}
                  onPress={() => contratar(p.id)}
                  deshabilitado={procesando === p.id}
                />
              </View>
            )}
          />
        </View>
      )}

      {mensaje ? (
        <View style={styles.errorCaja}>
          <Text style={styles.errorTexto}>{mensaje}</Text>
        </View>
      ) : null}

      <Text style={styles.link} onPress={() => navigation.navigate("Cuenta")}>
        Volver a mi cuenta
      </Text>
    </View>
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
  titulo: { fontSize: font.title, fontWeight: "bold", color: colors.text },
  texto: { fontSize: font.body, color: colors.text },
  textoSuave: { fontSize: font.body, color: colors.textMuted },
  aviso: {
    backgroundColor: "#FEF3C7",
    borderRadius: radius.sm,
    padding: spacing.sm + 4,
  },
  avisoTexto: { fontSize: font.small, color: "#92400E" },
  seccion: {
    fontSize: font.body,
    fontWeight: "bold",
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },
  tarjeta: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm + 2,
    ...shadow,
  },
  tarjetaActiva: { borderWidth: 1.5, borderColor: "#10B981" },
  activaTitulo: { fontSize: 18, fontWeight: "bold", color: "#065F46" },
  tituloTarjeta: { fontSize: 18, fontWeight: "bold", color: colors.text },
  precio: { fontSize: font.big, fontWeight: "bold", color: colors.primary },
  precioUnidad: { fontSize: font.small, fontWeight: "600", color: colors.textMuted },
  simulado: { fontSize: font.small, color: colors.textMuted },
  errorCaja: { backgroundColor: "#FEE2E2", borderRadius: radius.sm, padding: spacing.sm + 4 },
  errorTexto: { color: colors.danger, fontSize: font.small },
  link: {
    color: colors.primary,
    textAlign: "center",
    fontSize: font.body,
    fontWeight: "600",
    paddingVertical: spacing.sm,
  },
});