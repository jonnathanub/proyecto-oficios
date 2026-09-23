import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView } from "react-native";
import { StatusBar } from "expo-status-bar";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";

type Rol = "client" | "professional";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [iniciando, setIniciando] = useState(true);
  const [pantalla, setPantalla] = useState<"login" | "registro">("login");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIniciando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSession(nuevaSesion);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (iniciando) {
    return (
      <SafeAreaView style={s.centro}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.contenedor}>
      <StatusBar style="auto" />
      {session ? (
        <Cuenta session={session} />
      ) : pantalla === "login" ? (
        <Login irARegistro={() => setPantalla("registro")} />
      ) : (
        <Registro irALogin={() => setPantalla("login")} />
      )}
    </SafeAreaView>
  );
}

function Login({ irARegistro }: { irARegistro: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  async function entrar() {
    setMensaje("");
    if (!email || !password) {
      setMensaje("Escribe tu correo y contraseña.");
      return;
    }
    setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setCargando(false);
    if (error) setMensaje(`Error: ${error.message}`);
  }

  return (
    <View style={s.formulario}>
      <Text style={s.titulo}>Iniciar sesión</Text>
      <TextInput style={s.input} placeholder="Correo" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={s.input} placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} />
      <TouchableOpacity style={s.boton} onPress={entrar} disabled={cargando}>
        <Text style={s.botonTexto}>{cargando ? "Entrando..." : "Entrar"}</Text>
      </TouchableOpacity>
      {mensaje !== "" && <Text style={s.mensaje}>{mensaje}</Text>}
      <TouchableOpacity onPress={irARegistro}>
        <Text style={s.enlace}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </View>
  );
}

function Registro({ irALogin }: { irALogin: () => void }) {
  const [rol, setRol] = useState<Rol>("client");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  async function registrar() {
    setMensaje("");
    if (!nombre || !email || password.length < 6) {
      setMensaje("Completa nombre, correo y una contraseña de al menos 6 caracteres.");
      return;
    }
    setCargando(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: nombre, role: rol } },
    });
    setCargando(false);
    if (error) setMensaje(`Error: ${error.message}`);
  }

  return (
    <View style={s.formulario}>
      <Text style={s.titulo}>Crear cuenta</Text>

      <Text>Soy:</Text>
      <View style={s.fila}>
        <TouchableOpacity style={[s.opcion, rol === "client" && s.opcionActiva]} onPress={() => setRol("client")}>
          <Text style={rol === "client" ? s.opcionTextoActivo : undefined}>Cliente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.opcion, rol === "professional" && s.opcionActiva]} onPress={() => setRol("professional")}>
          <Text style={rol === "professional" ? s.opcionTextoActivo : undefined}>Profesional</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={s.input} placeholder="Nombre completo" value={nombre} onChangeText={setNombre} />
      <TextInput style={s.input} placeholder="Correo" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={s.input} placeholder="Contraseña (mín. 6 caracteres)" secureTextEntry value={password} onChangeText={setPassword} />

      <TouchableOpacity style={s.boton} onPress={registrar} disabled={cargando}>
        <Text style={s.botonTexto}>{cargando ? "Creando..." : "Registrarme"}</Text>
      </TouchableOpacity>
      {mensaje !== "" && <Text style={s.mensaje}>{mensaje}</Text>}
      <TouchableOpacity onPress={irALogin}>
        <Text style={s.enlace}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

function Cuenta({ session }: { session: Session }) {
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("");

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from("users")
        .select("full_name, role")
        .eq("id", session.user.id)
        .single();

      setNombre(data?.full_name ?? session.user.user_metadata?.full_name ?? session.user.email ?? "");
      setRol(data?.role ?? session.user.user_metadata?.role ?? "");
    }
    cargar();
  }, [session]);

  return (
    <View style={s.formulario}>
      <Text style={s.titulo}>Conectado como {nombre}</Text>
      <Text>Rol: {rol === "professional" ? "Profesional" : "Cliente"}</Text>
      <TouchableOpacity style={s.boton} onPress={() => supabase.auth.signOut()}>
        <Text style={s.botonTexto}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: "#fff" },
  centro: { flex: 1, justifyContent: "center", alignItems: "center" },
  formulario: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  titulo: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, fontSize: 16 },
  boton: { backgroundColor: "#111", borderRadius: 8, padding: 14, alignItems: "center" },
  botonTexto: { color: "#fff", fontSize: 16, fontWeight: "600" },
  mensaje: { color: "#c00" },
  enlace: { color: "#0a5", textAlign: "center", marginTop: 8 },
  fila: { flexDirection: "row", gap: 8 },
  opcion: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, alignItems: "center" },
  opcionActiva: { backgroundColor: "#111", borderColor: "#111" },
  opcionTextoActivo: { color: "#fff" },
});
