import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";

type Favorito = {
  id: string;
  professional_id: string;
  professional_profiles: {
    id: string;
    bio: string | null;
    avg_rating: number;
    review_count: number;
    users: { full_name: string | null } | null;
  } | null;
};

export default function Favoritos({ navigation }: any) {
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  async function cargar() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      navigation.replace("Login");
      return;
    }

    const { data, error } = await supabase
      .from("favorites")
      .select("id, professional_id, professional_profiles(id, bio, avg_rating, review_count, users(full_name))")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMensaje("No se pudieron cargar tus favoritos.");
      setCargando(false);
      return;
    }

    setFavoritos((data ?? []) as unknown as Favorito[]);
    setCargando(false);
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", cargar);
    return unsubscribe;
  }, [navigation]);

  async function quitar(favoritoId: string) {
    await supabase.from("favorites").delete().eq("id", favoritoId);
    cargar();
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
      <Text style={styles.titulo}>Mis favoritos</Text>

      {mensaje ? <Text>{mensaje}</Text> : null}

      <FlatList
        data={favoritos}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={!mensaje ? <Text>Todavia no tienes favoritos guardados.</Text> : null}
        renderItem={({ item: f }) => {
          const p = f.professional_profiles;
          return (
            <View style={styles.tarjeta}>
              <Text style={styles.tituloTarjeta}>{p?.users?.full_name ?? "Sin nombre"}</Text>
              {p?.bio ? <Text>{p.bio}</Text> : null}
              {p && p.review_count > 0 ? (
                <Text>Calificacion: {p.avg_rating} ({p.review_count} resenas)</Text>
              ) : (
                <Text>Sin calificaciones todavia</Text>
              )}
              <Text style={styles.link} onPress={() => quitar(f.id)}>
                Quitar de favoritos
              </Text>
            </View>
          );
        }}
      />

      <Text style={styles.link} onPress={() => navigation.navigate("Cuenta")}>
        Volver a mi cuenta
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  tarjeta: { borderWidth: 1, borderColor: "#666", borderRadius: 8, padding: 12, marginBottom: 10, gap: 2 },
  tituloTarjeta: { fontWeight: "bold" },
  link: { color: "#0066cc", marginTop: 6 },
});
