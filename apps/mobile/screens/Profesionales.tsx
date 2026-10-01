import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { supabase } from "../lib/supabase";
import FavoritoButton from "../components/FavoritoButton";

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

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Encuentra profesionales</Text>

      <Picker selectedValue={categoria} onValueChange={setCategoria} style={styles.picker}>
        <Picker.Item label="Todos los oficios" value="" />
        {categorias.map((c) => (
          <Picker.Item key={c.id} label={c.name} value={c.id} />
        ))}
      </Picker>

      <TextInput
        style={styles.input}
        placeholder="Municipio (ej. Toluca)"
        value={municipio}
        onChangeText={setMunicipio}
      />

      <Button title="Buscar" onPress={() => buscar(1, true)} />

      {total > 0 && (
        <Text style={styles.contador}>
          {total} resultados
        </Text>
      )}

      <FlatList
        data={servicios}
        keyExtractor={(item) => item.id}
        style={{ marginTop: 10 }}
        ListEmptyComponent={!cargando ? <Text>No encontramos servicios con esos filtros.</Text> : null}
        renderItem={({ item: s }) => {
          const p = s.professional_profiles;
          const zona = [s.neighborhood, s.municipality, s.state].filter(Boolean).join(", ") || "Sin zona";
          return (
            <View style={styles.tarjeta}>
              <Text style={styles.tituloTarjeta}>{s.title}</Text>
              <Text>{nombreCategoria(s.category_id)}</Text>
              <Text>Profesional: {p?.users?.full_name ?? "Sin nombre"}</Text>
              {s.description ? <Text>{s.description}</Text> : null}
              {s.price_text ? <Text>Precio: {s.price_text}</Text> : null}
              <Text>Zona: {zona}</Text>
              {p ? <FavoritoButton professionalId={p.id} /> : null}
              {p && p.review_count > 0 ? (
                <Text>Calificacion: {p.avg_rating} ({p.review_count} resenas)</Text>
              ) : null}
              {p && p.review_count === 0 ? (
                <Text>Sin calificaciones todavia</Text>
              ) : null}
              <Text
                style={styles.link}
                onPress={() => navigation.navigate("Solicitar", { servicioId: s.id })}
              >
                Solicitar servicio
              </Text>
            </View>
          );
        }}
        ListFooterComponent={
          hayMas ? (
            <Button
              title={cargando ? "Cargando..." : "Cargar mas"}
              onPress={() => buscar(pagina + 1, false)}
              disabled={cargando}
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#888", borderRadius: 8, padding: 10, marginTop: 8 },
  picker: { borderWidth: 1, borderColor: "#888", borderRadius: 8 },
  contador: { fontSize: 12, opacity: 0.75, marginTop: 6 },
  tarjeta: { borderWidth: 1, borderColor: "#666", borderRadius: 8, padding: 12, marginBottom: 10, gap: 2 },
  tituloTarjeta: { fontWeight: "bold" },
  link: { color: "#0066cc", marginTop: 6 },
});
