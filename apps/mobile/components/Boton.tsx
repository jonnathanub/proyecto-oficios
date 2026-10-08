import { Pressable, Text, StyleSheet } from "react-native";
import { colors, radius, spacing, font } from "../theme";

type Props = {
  titulo: string;
  onPress: () => void;
  tipo?: "primario" | "secundario" | "peligro";
  deshabilitado?: boolean;
};

export default function Boton({ titulo, onPress, tipo = "primario", deshabilitado }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      style={({ pressed }) => [
        styles.base,
        tipo === "primario" && styles.primario,
        tipo === "secundario" && styles.secundario,
        tipo === "peligro" && styles.peligro,
        pressed && { opacity: 0.8 },
        deshabilitado && { opacity: 0.5 },
      ]}
    >
      <Text style={[styles.texto, tipo === "secundario" && { color: colors.primary }]}>
        {titulo}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
  },
  primario: { backgroundColor: colors.primary },
  secundario: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.primary },
  peligro: { backgroundColor: colors.danger },
  texto: { color: colors.white, fontSize: font.body, fontWeight: "600" },
});