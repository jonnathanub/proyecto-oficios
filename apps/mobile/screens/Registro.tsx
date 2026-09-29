import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Pressable } from "react-native";
import { supabase } from "../lib/supabase";

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
    setMensaje(error ? `Error: ${error.message}` : "Cuenta creada! Ya puedes iniciar sesion.");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Crear cuenta</Text>

      <Text>Soy:</Text>
      <View style={styles.filaRol}>
        <Pressable
          style={[styles.opcionRol, role === "client" && styles.opcionRolActiva]}
          onPress={() => setRole("client")}
        >
          <Text>Cliente</Text>
        </Pressable>
        <Pressable
          style={[styles.opcionRol, role === "professional" && styles.opcionRolActiva]}
          onPress={() => setRole("professional")}
        >
          <Text>Profesional</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder="Correo"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contrasena (min. 6 caracteres)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button title={cargando ? "Creando..." : "Registrarme"} onPress={handleRegistro} disabled={cargando} />

      {mensaje ? <Text>{mensaje}</Text> : null}

      <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
        Ya tengo cuenta, quiero iniciar sesion
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 24, gap: 10 },
  titulo: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#888", borderRadius: 8, padding: 12 },
  filaRol: { flexDirection: "row", gap: 10, marginBottom: 6 },
  opcionRol: { flex: 1, borderWidth: 1, borderColor: "#888", borderRadius: 8, padding: 10, alignItems: "center" },
  opcionRolActiva: { backgroundColor: "#cde" },
  link: { color: "#0066cc", marginTop: 16, textAlign: "center" },
});