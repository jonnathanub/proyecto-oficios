import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { supabase } from "../lib/supabase";
import FavoritoButton from "../components/FavoritoButton";
import { colors, spacing, radius, font, shadow } from "../theme";
import Boton from "../components/Boton";
import Campo from "../components/Campo";

type Categoria = { id: string; name: string };

type Fila = {
  id: string;
  title: string;
  description: string | null;
  price_text: string | null;
  state: string | null;
  municipality: string | null;
  neighborhood: string | null;
  category_id: string;
  professional_profiles: {
    id: string;
    years_experience: number | null;
    avg_rating: number;
    review_count: number;
    users: { full_name: string | null } | null;
  } | null;
};

const POR_PAGINA = 20;

export default function Profesionales({ navigation }: any) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoria, setCategoria] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [servicios, setServicios] = useState<Fila[]>([]);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name")
      .eq("active", true)
      .order("name")
      .then(({ data }) => setCategorias((data ?? []) as Categoria[]));
  }, []);

  async function buscar(nuevaPagina: number, reemplazar: boolean) {
    setCargando(true);
    const desde = (nuevaPagina - 1) * POR_PAGINA;
    const hasta = desde + POR_PAGINA - 1;

    let consulta = supabase
      .from("services")
      .select(
        "id, title, description, price_text, state, municipality, neighborhood, category_id, professional_profiles(id, years_experience, avg_rating, review_count, users(full_name))",
        { count: "exact" }
      )
      .eq("active", true)
      .order("created_at", { ascending: false })
      .range(desde, hasta);

    if (categoria) consulta = consulta.eq("category_id", categoria);
    if (municipio.trim()) consulta = consulta.ilike("municipality", "%" + municipio.trim() + "%");

    const { data, count } = await consulta;
    const nuevos = (data ?? []) as unknown as Fila[];

    setServicios(reemplazar ? nuevos : [...servicios, ...nuevos]);
    setTotal(count ?? 0);
    setPagina(nuevaPagina);
    setCargando(false);
  }

  useEffect(() => {
    buscar(1, true);
  }, []);

  const nombreCategoria = (id: string) =>
    categorias.find((c) => c.id === id)?.name ?? "Oficio";

  const hayMas = servicios.length < total;

  const encabezado = (
    <View>
      <Text style={styles.titulo}>Encuentra profesionales</Text>

      <View style={styles.filtros}>
        <View style={styles.pickerCaja}>
          <Picker selectedValue={categoria} onValueChange={setCategoria} style={styles.picker}>
            <Picker.Item label="Todos los oficios" value="" />
            {categorias.map((c) => (
              <Picker.Item key={c.id} label={c.name} value={c.id} />
            ))}
          </Picker>
        </View>

        <Campo
          placeholder="Municipio (ej. Toluca)"
          value={municipio}
          onChangeText={setMunicipio}
        />

        <Boton titulo="Buscar" onPress={() => buscar(1, true)} />
      </View>

      {total > 0 && <Text style={styles.contador}>{total} resultados</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={servicios}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={encabezado}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={
          !cargando ? (
            <Text style={styles.vacio}>No encontramos servicios con esos filtros.</Text>
          ) : null
        }
        renderItem={({ item: s }) => {
          const p = s.professional_profiles;
          const zona = [s.neighborhood, s.municipality, s.state].filter(Boolean).join(", ") || "Sin zona";
          return (
            <View style={styles.tarjeta}>
              <View style={styles.etiqueta}>
                <Text style={styles.etiquetaTexto}>{nombreCategoria(s.category_id)}</Text>
              </View>

              <Text style={styles.tituloTarjeta}>{s.title}</Text>
              <Text style={styles.profesional}>{p?.users?.full_name ?? "Sin nombre"}</Text>

              {s.description ? <Text style={styles.descripcion}>{s.description}</Text> : null}

              <View style={styles.datos}>
                {s.price_text ? <Text style={styles.precio}>{s.price_text}</Text> : null}
                <Text style={styles.zona}>📍 {zona}</Text>
              </View>

              {p && p.review_count > 0 ? (
                <Text style={styles.estrellas}>
                  ★ {p.avg_rating} ({p.review_count} reseñas)
                </Text>
              ) : null}
              {p && p.review_count === 0 ? (
                <Text style={styles.sinCalif}>Sin calificaciones todavía</Text>
              ) : null}

              {p ? <FavoritoButton professionalId={p.id} /> : null}

              <Boton
                titulo="Solicitar servicio"
                onPress={() => navigation.navigate("Solicitar", { servicioId: s.id })}
              />
            </View>
          );
        }}
        ListFooterComponent={
          hayMas ? (
            <Boton
              titulo={cargando ? "Cargando..." : "Cargar más"}
              tipo="secundario"
              onPress={() => buscar(pagina + 1, false)}
              deshabilitado={cargando}
            />
          ) : null
        }
      />
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
  filtros: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm + 4,
    ...shadow,
  },
  pickerCaja: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  picker: { color: colors.text },
  contador: { fontSize: font.small, color: colors.textMuted, marginVertical: spacing.sm + 4 },
  vacio: { color: colors.textMuted, textAlign: "center", marginTop: spacing.lg },
  tarjeta: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...shadow,
  },
  etiqueta: {
    alignSelf: "flex-start",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  etiquetaTexto: { color: colors.primaryDark, fontSize: font.small, fontWeight: "600" },
  tituloTarjeta: { fontSize: 18, fontWeight: "bold", color: colors.text },
  profesional: { fontSize: font.body, color: colors.textMuted },
  descripcion: { fontSize: font.body, color: colors.text },
  datos: { gap: spacing.xs },
  precio: { fontSize: font.body, fontWeight: "700", color: colors.primary },
  zona: { fontSize: font.small, color: colors.textMuted },
  estrellas: { fontSize: font.small, color: "#B45309", fontWeight: "600" },
  sinCalif: { fontSize: font.small, color: colors.textMuted },
});