import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";
import { colors, spacing, radius, font, shadow } from "../theme";
import Boton from "../components/Boton";

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
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.textMuted }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Mis favoritos</Text>

      {mensaje ? (
        <View style={styles.errorCaja}>
          <Text style={styles.errorTexto}>{mensaje}</Text>
        </View>
      ) : null}

      <FlatList
        data={favoritos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: spacing.md }}
        ListEmptyComponent={
          !mensaje ? (
            <Text style={styles.vacio}>Todavía no tienes favoritos guardados.</Text>
          ) : null
        }
        renderItem={({ item: f }) => {
          const p = f.professional_profiles;
          const nombre = p?.users?.full_name ?? "Sin nombre";
          return (
            <View style={styles.tarjeta}>
              <View style={styles.encabezado}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarTexto}>
                    {(nombre.trim()[0] ?? "?").toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nombre}>{nombre}</Text>
                  {p && p.review_count > 0 ? (
                    <Text style={styles.estrellas}>
                      ★ {p.avg_rating} ({p.review_count} reseñas)
                    </Text>
                  ) : (
                    <Text style={styles.sinCalif}>Sin calificaciones todavía</Text>
                  )}
                </View>
              </View>

              {p?.bio ? <Text style={styles.bio}>{p.bio}</Text> : null}

              <Boton
                titulo="Quitar de favoritos"
                tipo="secundario"
                onPress={() => quitar(f.id)}
              />
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
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  titulo: { fontSize: font.title, fontWeight: "bold", color: colors.text, marginBottom: spacing.md },
  errorCaja: {
    backgroundColor: "#FEE2E2",
    borderRadius: radius.sm,
    padding: spacing.sm + 4,
    marginBottom: spacing.md,
  },
  errorTexto: { color: colors.danger, fontSize: font.small },
  vacio: { color: colors.textMuted, textAlign: "center", marginTop: spacing.lg },
  tarjeta: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm + 4,
    ...shadow,
  },
  encabezado: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTexto: { fontSize: font.title, fontWeight: "bold", color: colors.primary },
  nombre: { fontSize: 18, fontWeight: "bold", color: colors.text },
  estrellas: { fontSize: font.small, color: "#B45309", fontWeight: "600", marginTop: 2 },
  sinCalif: { fontSize: font.small, color: colors.textMuted, marginTop: 2 },
  bio: { fontSize: font.body, color: colors.text },
  link: {
    color: colors.primary,
    textAlign: "center",
    fontSize: font.body,
    fontWeight: "600",
    paddingVertical: spacing.md,
  },
});