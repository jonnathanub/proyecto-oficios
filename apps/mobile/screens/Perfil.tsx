import { useEffect, useState } from "react";
import { View, Text, ScrollView, Switch, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";
import { colors, spacing, radius, font, shadow } from "../theme";
import Boton from "../components/Boton";
import Campo from "../components/Campo";

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
        setMensaje("Tu perfil profesional todavía no existe.");
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
    if (r1.error || !r1.data?.length) return fallo("contacto y ubicación", r1.error?.message);

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
    setMensaje("¡Perfil guardado!");
  }

  const esOk = mensaje.startsWith("¡Perfil guardado");

  if (cargando) {
    return (
      <View style={[styles.contenedorFijo, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.textMuted }}>Cargando...</Text>
      </View>
    );
  }

  if (!esProfesional) {
    return (
      <View style={styles.contenedorFijo}>
        <Text style={styles.titulo}>Mi perfil profesional</Text>
        <View style={styles.tarjeta}>
          <Text style={styles.texto}>
            Esta sección es solo para cuentas de tipo Profesional.
          </Text>
        </View>
        <Text style={styles.link} onPress={() => navigation.navigate("Cuenta")}>
          Volver a mi cuenta
        </Text>
      </View>
    );
  }

  if (!perfilId) {
    return (
      <View style={styles.contenedorFijo}>
        <Text style={styles.titulo}>Mi perfil profesional</Text>
        <View style={styles.tarjeta}>
          <Text style={styles.texto}>{mensaje}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.titulo}>Mi perfil profesional</Text>

      <View style={styles.tarjeta}>
        <Text style={styles.seccion}>Contacto y ubicación</Text>
        <Campo placeholder="Teléfono" keyboardType="phone-pad" value={telefono} onChangeText={setTelefono} />
        <Campo placeholder="Estado" value={estado} onChangeText={setEstado} />
        <Campo placeholder="Municipio" value={municipio} onChangeText={setMunicipio} />
        <Campo placeholder="Colonia" value={colonia} onChangeText={setColonia} />
      </View>

      <View style={styles.tarjeta}>
        <Text style={styles.seccion}>Sobre mí</Text>
        <Campo
          style={{ height: 100, textAlignVertical: "top" }}
          placeholder="Describe tu experiencia"
          multiline
          value={bio}
          onChangeText={setBio}
        />
        <Campo
          placeholder="Años de experiencia"
          keyboardType="numeric"
          value={anios}
          onChangeText={setAnios}
        />
        <Campo
          placeholder="Horario de atención"
          value={horario}
          onChangeText={setHorario}
        />
      </View>

      <View style={styles.tarjeta}>
        <Text style={styles.seccion}>Mis oficios</Text>
        {categorias.map((c, i) => (
          <View
            key={c.id}
            style={[styles.filaOficio, i < categorias.length - 1 && styles.filaBorde]}
          >
            <Text style={styles.oficioTexto}>{c.name}</Text>
            <Switch
              value={seleccion.includes(c.id)}
              onValueChange={() => alternar(c.id)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        ))}
      </View>

      {mensaje ? (
        <View style={[styles.mensajeCaja, esOk && styles.mensajeOk]}>
          <Text style={[styles.mensajeTexto, esOk && { color: "#065F46" }]}>{mensaje}</Text>
        </View>
      ) : null}

      <Boton
        titulo={guardando ? "Guardando..." : "Guardar perfil"}
        onPress={guardar}
        deshabilitado={guardando}
      />

      <Text style={styles.link} onPress={() => navigation.navigate("Cuenta")}>
        Volver a mi cuenta
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedorFijo: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  container: {
    paddingTop: 60,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl + 8,
    gap: spacing.md,
  },
  titulo: { fontSize: font.title, fontWeight: "bold", color: colors.text },
  texto: { fontSize: font.body, color: colors.text },
  tarjeta: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm + 4,
    ...shadow,
  },
  seccion: { fontSize: font.body, fontWeight: "bold", color: colors.primaryDark },
  filaOficio: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  filaBorde: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.sm },
  oficioTexto: { fontSize: font.body, color: colors.text },
  mensajeCaja: { backgroundColor: "#FEE2E2", borderRadius: radius.sm, padding: spacing.sm + 4 },
  mensajeOk: { backgroundColor: "#D1FAE5" },
  mensajeTexto: { color: colors.danger, fontSize: font.small },
  link: {
    color: colors.primary,
    textAlign: "center",
    fontSize: font.body,
    fontWeight: "600",
    marginTop: spacing.sm,
  },
});