import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { supabase } from "../lib/supabase";
import { colors, spacing, radius, font, shadow } from "../theme";
import Boton from "../components/Boton";
import Campo from "../components/Campo";

export default function Registro({ navigation }: any) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"client" | "professional">("client");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleRegistro() {
    setCargando(true);
    setMensaje("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });

    setCargando(false);
    setMensaje(error ? `Error: ${error.message}` : "¡Cuenta creada! Ya puedes iniciar sesión.");
  }

  const esError = mensaje.startsWith("Error");

  return (
    <View style={styles.container}>
      <View style={styles.marca}>
        <Text style={styles.logo}>Oficios</Text>
        <Text style={styles.subtitulo}>Crea tu cuenta</Text>
      </View>

      <View style={styles.tarjeta}>
        <Text style={styles.titulo}>Crear cuenta</Text>

        <Text style={styles.etiqueta}>Soy:</Text>
        <View style={styles.filaRol}>
          <Pressable
            style={[styles.opcionRol, role === "client" && styles.opcionRolActiva]}
            onPress={() => setRole("client")}
          >
            <Text style={[styles.rolTexto, role === "client" && styles.rolTextoActivo]}>
              Cliente
            </Text>
          </Pressable>
          <Pressable
            style={[styles.opcionRol, role === "professional" && styles.opcionRolActiva]}
            onPress={() => setRole("professional")}
          >
            <Text style={[styles.rolTexto, role === "professional" && styles.rolTextoActivo]}>
              Profesional
            </Text>
          </Pressable>
        </View>

        <Campo
          placeholder="Nombre completo"
          value={fullName}
          onChangeText={setFullName}
        />
        <Campo
          placeholder="Correo"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Campo
          placeholder="Contraseña (mín. 6 caracteres)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {mensaje ? (
          <View style={[styles.mensajeCaja, !esError && styles.mensajeOk]}>
            <Text style={[styles.mensajeTexto, !esError && { color: "#065F46" }]}>{mensaje}</Text>
          </View>
        ) : null}

        <Boton
          titulo={cargando ? "Creando..." : "Registrarme"}
          onPress={handleRegistro}
          deshabilitado={cargando}
        />
      </View>

      <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
        Ya tengo cuenta, quiero iniciar sesión
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
  etiqueta: { fontSize: font.small, color: colors.textMuted },
  filaRol: { flexDirection: "row", gap: spacing.sm + 4 },
  opcionRol: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  opcionRolActiva: { borderColor: colors.primary, backgroundColor: "#DBEAFE" },
  rolTexto: { fontSize: font.body, color: colors.textMuted, fontWeight: "600" },
  rolTextoActivo: { color: colors.primaryDark },
  mensajeCaja: { backgroundColor: "#FEE2E2", borderRadius: radius.sm, padding: spacing.sm + 4 },
  mensajeOk: { backgroundColor: "#D1FAE5" },
  mensajeTexto: { color: colors.danger, fontSize: font.small },
  link: {
    color: colors.primary,
    marginTop: spacing.lg,
    textAlign: "center",
    fontSize: font.body,
    fontWeight: "600",
  },
});