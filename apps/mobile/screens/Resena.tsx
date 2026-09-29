import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, TouchableOpacity, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";

export default function Resena({ route, navigation }: any) {
  const solicitudId = route.params?.solicitudId as string;

  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [permitido, setPermitido] = useState(false);
  const [professionalId, setProfessionalId] = useState("");
  const [rating, setRating] = useState(5);
  const [comentario, setComentario] = useState("");

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.replace("Login");
        return;
      }

      const { data: sr, error } = await supabase
        .from("service_requests")
        .select("id, client_id, professional_id, status")
        .eq("id", solicitudId)
        .single();

      if (error || !sr) {
        setMensaje("No se encontro la solicitud.");
        setCargando(false);
        return;
      }

      if (sr.client_id !== user.id || sr.status !== "completed") {
        setMensaje("Esta solicitud no esta disponible para calificar.");
        setCargando(false);
        return;
      }

      const { data: existente } = await supabase
        .from("reviews")
        .select("id")
        .eq("service_request_id", solicitudId)
        .maybeSingle();

      if (existente) {
        setMensaje("Ya calificaste este servicio.");
        setCargando(false);
        return;
      }

      setProfessionalId(sr.professional_id);
      setPermitido(true);
      setCargando(false);
    }
    cargar();
  }, [solicitudId]);

  async function enviar() {
    setEnviando(true);
    setMensaje("");

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("reviews").insert({
      service_request_id: solicitudId,
      client_id: user!.id,
      professional_id: professionalId,
      rating,
      comment: comentario || null,
    });

    if (error) {
      setMensaje("No se pudo guardar: " + error.message);
      setEnviando(false);
      return;
    }

    navigation.navigate("Solicitudes");
  }

  if (cargando) {
    return (
      <View style={styles.container}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  if (!permitido) {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Calificar servicio</Text>
        <Text>{mensaje}</Text>
        <Text style={styles.link} onPress={() => navigation.navigate("Solicitudes")}>
          Volver a mis solicitudes
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Calificar servicio</Text>

      <Text>Como calificarias el trabajo?</Text>
      <View style={styles.filaEstrellas}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => setRating(n)}
            style={[styles.estrella, n <= rating && styles.estrellaActiva]}
          >
            <Text style={styles.estrellaTexto}>{n <= rating ? "*" : "-"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={[styles.input, { height: 90, textAlignVertical: "top" }]}
        placeholder="Cuentanos como te fue (opcional)"
        multiline
        value={comentario}
        onChangeText={setComentario}
      />

      <Button title={enviando ? "Enviando..." : "Enviar calificacion"} onPress={enviar} disabled={enviando} />

      {mensaje ? <Text>{mensaje}</Text> : null}

      <Text style={styles.link} onPress={() => navigation.navigate("Solicitudes")}>
        Cancelar
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16, gap: 10 },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 6 },
  filaEstrellas: { flexDirection: "row", gap: 8 },
  estrella: { borderWidth: 1, borderColor: "#666", borderRadius: 6, width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  estrellaActiva: { backgroundColor: "#f5b301" },
  estrellaTexto: { fontSize: 18, fontWeight: "bold" },
  input: { borderWidth: 1, borderColor: "#888", borderRadius: 8, padding: 10 },
  link: { color: "#0066cc", marginTop: 10 },
});