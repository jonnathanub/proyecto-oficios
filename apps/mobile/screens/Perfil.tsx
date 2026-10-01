import { useEffect, useState } from "react";
import { View, Text, TextInput, Button, ScrollView, Switch, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";

type Categoria = { id: string; name: string };

export default function Perfil({ navigation }: any) {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [esProfesional, setEsProfesional] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const [userId, setUserId] = useState("");
  const [perfilId, setPerfilId] = useState("");
  const [telefono, setTelefono] = useState("");
  const [estado, setEstado] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [colonia, setColonia] = useState("");
  const [bio, setBio] = useState("");
  const [anios, setAnios] = useState("");
  const [horario, setHorario] = useState("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [original, setOriginal] = useState<string[]>([]);

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.replace("Login");
        return;
      }
      setUserId(user.id);

      const { data: u } = await supabase
        .from("users")
        .select("role, phone, state, municipality, neighborhood")
        .eq("id", user.id)
        .single();

      if (u?.role !== "professional") {
        setEsProfesional(false);
        setCargando(false);
        return;
      }
      setTelefono(u.phone ?? "");
      setEstado(u.state ?? "");
      setMunicipio(u.municipality ?? "");
      setColonia(u.neighborhood ?? "");

      const { data: p } = await supabase
        .from("professional_profiles")
        .select("id, bio, years_experience, schedule_text")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!p) {
        setMensaje("Tu perfil profesional todavia no existe.");
        setCargando(false);
        return;
      }
      setPerfilId(p.id);
      setBio(p.bio ?? "");
      setAnios(p.years_experience != null ? String(p.years_experience) : "");
      setHorario(p.schedule_text ?? "");

      const { data: cats } = await supabase
        .from("categories")
        .select("id, name")
        .eq("active", true)
        .order("name");
      setCategorias(cats ?? []);

      const { data: mias } = await supabase
        .from("professional_categories")
        .select("category_id")
        .eq("professional_id", p.id);
      const ids = (mias ?? []).map((m) => m.category_id as string);
      setSeleccion(ids);
      setOriginal(ids);

      setCargando(false);
    }
    cargar();
  }, [navigation]);

  function alternar(id: string) {
    setSeleccion((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function fallo(donde: string, detalle?: string) {
    setGuardando(false);
    setMensaje("No se pudo guardar (" + donde + "). " + (detalle ?? "Sin permiso o fila no encontrada."));
  }

  async function guardar() {
    setMensaje("");
    if (seleccion.length === 0) {
      setMensaje("Elige al menos un oficio.");
      return;
    }
    setGuardando(true);

    const r1 = await supabase
      .from("users")
      .update({
        phone: telefono || null,
        state: estado || null,
        municipality: municipio || null,
        neighborhood: colonia || null,
      })
      .eq("id", userId)
      .select("id");
    if (r1.error || !r1.data?.length) return fallo("contacto y ubicacion", r1.error?.message);

    const r2 = await supabase
      .from("professional_profiles")
      .update({
        bio: bio || null,
        years_experience: anios === "" ? null : parseInt(anios, 10),
        schedule_text: horario || null,
      })
      .eq("id", perfilId)
      .select("id");
    if (r2.error || !r2.data?.length) return fallo("perfil", r2.error?.message);

    const aBorrar = original.filter((id) => !seleccion.includes(id));
    const aAgregar = seleccion.filter((id) => !original.includes(id));

    if (aBorrar.length > 0) {
      const r3 = await supabase
        .from("professional_categories")
        .delete()
        .eq("professional_id", perfilId)
        .in("category_id", aBorrar);
      if (r3.error) return fallo("oficios", r3.error.message);
    }

    if (aAgregar.length > 0) {
      const r4 = await supabase
        .from("professional_categories")
        .insert(aAgregar.map((category_id) => ({ professional_id: perfilId, category_id })));
      if (r4.error) return fallo("oficios", r4.error.message);
    }

    setOriginal(seleccion);
    setGuardando(false);
    setMensaje("Perfil guardado!");
  }

  if (cargando) {
    return (
      <View style={styles.container}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  if (!esProfesional) {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Mi perfil profesional</Text>
        <Text>Esta seccion es solo para cuentas de tipo Profesional.</Text>
        <Text style={styles.link} onPress={() => navigation.navigate("Cuenta")}>
          Volver a mi cuenta
        </Text>
      </View>
    );
  }

  if (!perfilId) {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Mi perfil profesional</Text>
        <Text>{mensaje}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Mi perfil profesional</Text>

      <Text style={styles.seccion}>Contacto y ubicacion</Text>
      <TextInput style={styles.input} placeholder="Telefono" value={telefono} onChangeText={setTelefono} />
      <TextInput style={styles.input} placeholder="Estado" value={estado} onChangeText={setEstado} />
      <TextInput style={styles.input} placeholder="Municipio" value={municipio} onChangeText={setMunicipio} />
      <TextInput style={styles.input} placeholder="Colonia" value={colonia} onChangeText={setColonia} />

      <Text style={styles.seccion}>Sobre mi</Text>
      <TextInput
        style={[styles.input, { height: 90, textAlignVertical: "top" }]}
        placeholder="Describe tu experiencia"
        multiline
        value={bio}
        onChangeText={setBio}
      />
      <TextInput
        style={styles.input}
        placeholder="Anos de experiencia"
        keyboardType="numeric"
        value={anios}
        onChangeText={setAnios}
      />
      <TextInput
        style={styles.input}
        placeholder="Horario de atencion"
        value={horario}
        onChangeText={setHorario}
      />

      <Text style={styles.seccion}>Mis oficios</Text>
      {categorias.map((c) => (
        <View key={c.id} style={styles.filaOficio}>
          <Switch value={seleccion.includes(c.id)} onValueChange={() => alternar(c.id)} />
          <Text>{c.name}</Text>
        </View>
      ))}

      <Button title={guardando ? "Guardando..." : "Guardar perfil"} onPress={guardar} disabled={guardando} />

      {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}

      <Text style={styles.link} onPress={() => navigation.navigate("Cuenta")}>
        Volver a mi cuenta
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  titulo: { fontSize: 22, fontWeight: "bold", marginBottom: 6 },
  seccion: { fontSize: 16, fontWeight: "bold", marginTop: 10 },
  input: { borderWidth: 1, borderColor: "#888", borderRadius: 8, padding: 10 },
  filaOficio: { flexDirection: "row", alignItems: "center", gap: 10 },
  mensaje: { marginTop: 6 },
  link: { color: "#0066cc", marginTop: 14 },
});
