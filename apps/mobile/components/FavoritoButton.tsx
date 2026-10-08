import { useEffect, useState } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { colors, spacing, radius, font } from "../theme";

export default function FavoritoButton({ professionalId }: { professionalId: string }) {
  const navigation = useNavigation<any>();

  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [esFavorito, setEsFavorito] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    async function cargarFavorito() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setCargando(false);
        return;
      }

      setUsuarioId(user.id);

      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("client_id", user.id)
        .eq("professional_id", professionalId)
        .maybeSingle();

      if (!error) {
        setEsFavorito(!!data);
      }

      setCargando(false);
    }

    cargarFavorito();
  }, [professionalId]);

  async function alternarFavorito() {
    if (!usuarioId) {
      navigation.navigate("Login");
      return;
    }

    setActualizando(true);

    if (esFavorito) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("client_id", usuarioId)
        .eq("professional_id", professionalId);

      if (!error) setEsFavorito(false);
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ client_id: usuarioId, professional_id: professionalId });

      if (!error) setEsFavorito(true);
    }

    setActualizando(false);
  }

  if (cargando) {
    return <Text style={styles.cargando}>Cargando favorito...</Text>;
  }

  return (
    <TouchableOpacity
      onPress={alternarFavorito}
      disabled={actualizando}
      activeOpacity={0.7}
      style={[styles.boton, esFavorito && styles.botonActivo, actualizando && { opacity: 0.6 }]}
    >
      <Text style={[styles.texto, esFavorito && styles.textoActivo]}>
        {actualizando
          ? "Guardando..."
          : esFavorito
          ? "♥ Quitar de favoritos"
          : "♡ Agregar a favoritos"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cargando: { fontSize: font.small, color: colors.textMuted },
  boton: {
    alignSelf: "flex-start",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  botonActivo: { borderColor: colors.danger, backgroundColor: "#FEE2E2" },
  texto: { fontSize: font.small, fontWeight: "600", color: colors.primary },
  textoActivo: { color: colors.danger },
});