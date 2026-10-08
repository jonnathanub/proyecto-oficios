import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";
import { colors, spacing, radius, font, shadow } from "../theme";
import Boton from "../components/Boton";
import Campo from "../components/Campo";

export default function Login({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  async function entrar() {
    setCargando(true);
    setMensaje("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMensaje(error.message);
      setCargando(false);
      return;
    }

    navigation.replace("Cuenta");
  }

  return (
    <View style={styles.container}>
      <View style={styles.marca}>
        <Text style={styles.logo}>Oficios</Text>
        <Text style={styles.subtitulo}>Encuentra al profesional que necesitas</Text>
      </View>

      <View style={styles.tarjeta}>
        <Text style={styles.titulo}>Iniciar sesión</Text>

        <Campo
          placeholder="Correo"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Campo
          placeholder="Contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {mensaje ? (
          <View style={styles.errorCaja}>
            <Text style={styles.errorTexto}>{mensaje}</Text>
          </View>
        ) : null}

        <Boton
          titulo={cargando ? "Entrando..." : "Entrar"}
          onPress={entrar}
          deshabilitado={cargando}
        />
      </View>

      <Text style={styles.link} onPress={() => navigation.navigate("Registro")}>
        No tengo cuenta, quiero registrarme
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  marca: { alignItems: "center", marginBottom: spacing.lg },
  logo: { fontSize: 36, fontWeight: "bold", color: colors.primary },
  subtitulo: { fontSize: font.body, color: colors.textMuted, marginTop: spacing.xs },
  tarjeta: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow,
  },
  titulo: { fontSize: font.title, fontWeight: "bold", color: colors.text },
  errorCaja: {
    backgroundColor: "#FEE2E2",
    borderRadius: radius.sm,
    padding: spacing.sm + 4,
  },
  errorTexto: { color: colors.danger, fontSize: font.small },
  link: {
    color: colors.primary,
    marginTop: spacing.lg,
    textAlign: "center",
    fontSize: font.body,
    fontWeight: "600",
  },
});