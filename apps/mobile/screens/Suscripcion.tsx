import { useEffect, useState } from "react";
import { View, Text, Button, FlatList, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";

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
  }, [navigation]);

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

    await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("id", actual.id);

    await cargar();
    setProcesando(null);
  }

  if (cargando) {
    return (
      <View style={styles.container}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  if (mensaje && !perfilId) {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Suscripcion</Text>
        <Text>{mensaje}</Text>
        <Text style={styles.link} onPress={() => navigation.navigate("Cuenta")}>
          Volver a mi cuenta
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Mi suscripcion</Text>
      <Text style={styles.nota}>
        Los pagos son simulados por ahora, no se realiza ningun cobro real.
      </Text>

      {actual ? (
        <View style={styles.tarjeta}>
          <Text>
            Tienes un plan activo hasta{" "}
            {actual.end_date ? new Date(actual.end_date).toLocaleDateString("es-MX") : "-"}.
          </Text>
          <Button
            title={procesando === actual.id ? "Cancelando..." : "Cancelar suscripcion"}
            onPress={cancelar}
            disabled={procesando === actual.id}
          />
        </View>
      ) : (
        <Text>No tienes un plan activo. Tu perfil aparece en orden normal en las busquedas.</Text>
      )}

      {!actual && (
        <View>
          <Text style={styles.seccion}>Planes disponibles</Text>
          {planes.length === 0 && <Text>Todavia no hay planes configurados.</Text>}
          <FlatList
            data={planes}
            keyExtractor={(item) => item.id}
            renderItem={({ item: p }) => (
              <View style={styles.tarjeta}>
                <Text style={styles.tituloTarjeta}>{p.name}</Text>
                <Text>${p.price} MXN / mes (simulado)</Text>
                <Button
                  title={procesando === p.id ? "Activando..." : "Contratar"}
                  onPress={() => contratar(p.id)}
                  disabled={procesando === p.id}
                />
              </View>
            )}
          />
        </View>
      )}

      {mensaje ? <Text>{mensaje}</Text> : null}

      <Text style={styles.link} onPress={() => navigation.navigate("Cuenta")}>
        Volver a mi cuenta
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16, gap: 10 },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 6 },
  nota: { fontSize: 13, opacity: 0.75 },
  seccion: { fontSize: 16, fontWeight: "bold", marginTop: 10, marginBottom: 6 },
  tarjeta: { borderWidth: 1, borderColor: "#666", borderRadius: 8, padding: 12, marginBottom: 10, gap: 6 },
  tituloTarjeta: { fontWeight: "bold" },
  link: { color: "#0066cc", marginTop: 10 },
});
