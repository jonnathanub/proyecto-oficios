import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";
import { colors, spacing, radius, font, shadow } from "../theme";
import Boton from "../components/Boton";

function Fila({ texto, onPress, ultima }: { texto: string; onPress: () => void; ultima?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fila,
        !ultima && styles.filaBorde,
        pressed && { backgroundColor: colors.background },
      ]}
    >
      <Text style={styles.filaTexto}>{texto}</Text>
      <Text style={styles.flecha}>›</Text>
    </Pressable>
  );
}

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
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.textMuted }}>Cargando...</Text>
      </View>
    );
  }

  const inicial = (nombre.trim()[0] ?? "?").toUpperCase();
  const esPro = rol === "professional";

  return (
    <View style={styles.container}>
      <View style={styles.cabecera}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{inicial}</Text>
        </View>
        <Text style={styles.nombre}>{nombre}</Text>
        <View style={styles.etiqueta}>
          <Text style={styles.etiquetaTexto}>{esPro ? "Profesional" : rol === "admin" ? "Administrador" : "Cliente"}</Text>
        </View>
      </View>

      <View style={styles.menu}>
        {esPro && (
          <Fila texto="Mi perfil profesional" onPress={() => navigation.navigate("Perfil")} />
        )}
        {esPro && (
          <Fila texto="Mi suscripción" onPress={() => navigation.navigate("Suscripcion")} />
        )}
        {rol === "client" && (
          <Fila texto="Mis favoritos" onPress={() => navigation.navigate("Favoritos")} />
        )}
        <Fila texto="Mis solicitudes" onPress={() => navigation.navigate("Solicitudes")} />
        <Fila texto="Buscar profesionales" onPress={() => navigation.navigate("Profesionales")} ultima />
      </View>

      <View style={styles.pie}>
        <Boton titulo="Cerrar sesión" tipo="secundario" onPress={cerrarSesion} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  cabecera: {
    backgroundColor: colors.primary,
    alignItems: "center",
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  avatarTexto: { fontSize: font.big, fontWeight: "bold", color: colors.primary },
  nombre: { fontSize: font.title, fontWeight: "bold", color: colors.white },
  etiqueta: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  etiquetaTexto: { color: colors.text, fontSize: font.small, fontWeight: "600" },
  menu: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    borderRadius: radius.md,
    overflow: "hidden",
    ...shadow,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
  },
  filaBorde: { borderBottomWidth: 1, borderBottomColor: colors.border },
  filaTexto: { fontSize: font.body, color: colors.text },
  flecha: { fontSize: 24, color: colors.textMuted },
  pie: { padding: spacing.md, marginTop: "auto" },
});