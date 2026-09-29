import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";

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
      <Text style={styles.titulo}>Iniciar sesion</Text>

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
        placeholder="Contrasena"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button title={cargando ? "Entrando..." : "Entrar"} onPress={entrar} disabled={cargando} />

      {mensaje ? <Text style={styles.error}>{mensaje}</Text> : null}

      <Text style={styles.link} onPress={() => navigation.navigate("Registro")}>
        No tengo cuenta, quiero registrarme
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 24, gap: 12 },
  titulo: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#888", borderRadius: 8, padding: 12 },
  error: { color: "red" },
  link: { color: "#0066cc", marginTop: 16, textAlign: "center" },
});