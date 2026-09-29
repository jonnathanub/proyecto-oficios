import { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";

export default function Cuenta({ navigation }: any) {
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigation.replace("Login");
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      setNombre(data?.full_name ?? user.user_metadata?.full_name ?? user.email ?? "");
      setRol(data?.role ?? user.user_metadata?.role ?? "");
      setCargando(false);
    }
    cargar();
  }, [navigation]);

  async function cerrarSesion() {
    await supabase.auth.signOut();
    navigation.replace("Login");
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
      <Text style={styles.titulo}>Conectado como {nombre}</Text>
      <Text>Rol: {rol === "professional" ? "Profesional" : "Cliente"}</Text>

      <Text style={styles.link} onPress={() => navigation.navigate("Solicitudes")}>
        Mis solicitudes
      </Text>
      <Text style={styles.link} onPress={() => navigation.navigate("Profesionales")}>
        Buscar profesionales
      </Text>

      <Button title="Cerrar sesion" onPress={cerrarSesion} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 24, gap: 12 },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  link: { color: "#0066cc", fontSize: 16 },
});