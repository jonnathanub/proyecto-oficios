import { supabase } from "../../lib/supabase";

export const metadata = {
  title: "Encuentra profesionales de oficio",
  description: "Busca plomeros, electricistas, carpinteros y más profesionales cerca de ti.",
};

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
    bio: string | null;
    years_experience: number | null;
    avg_rating: number;
    review_count: number;
    users: { full_name: string | null } | null;
  } | null;
};

export default async function Profesionales({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; municipio?: string }>;
}) {
  const { categoria = "", municipio = "" } = await searchParams;

  const { data: cats } = await supabase
    .from("categories")
    .select("id, name")
    .eq("active", true)
    .order("name");

  let consulta = supabase
    .from("services")
    .select(
      "id, title, description, price_text, state, municipality, neighborhood, category_id, professional_profiles(id, bio, years_experience, avg_rating, review_count, users(full_name))"
    )
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (categoria) consulta = consulta.eq("category_id", categoria);
  if (municipio.trim()) consulta = consulta.ilike("municipality", `%${municipio.trim()}%`);

  const { data, error } = await consulta;
  const servicios = (data ?? []) as unknown as Fila[];
  const nombreCategoria = (id: string) => (cats ?? []).find((c) => c.id === id)?.name ?? "Oficio";

  return (
    <main style={{ maxWidth: 640, margin: "40px auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Encuentra profesionales</h1>

      <form method="get" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <select name="categoria" defaultValue={categoria}>
          <option value="">Todos los oficios</option>
          {(cats ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input name="municipio" placeholder="Municipio (ej. Toluca)" defaultValue={municipio} />
        <button type="submit">Buscar</button>
      </form>

      {error && <p>Error al cargar: {error.message}</p>}
      {!error && servicios.length === 0 && <p>No encontramos servicios con esos filtros.</p>}

      {servicios.map((s) => {
        const p = s.professional_profiles;
        return (
          <div key={s.id} style={{ border: "1px solid #666", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
            <strong>{s.title}</strong>
            <span>{nombreCategoria(s.category_id)}</span>
            <span>Profesional: {p?.users?.full_name ?? "Sin nombre"}</span>
            {s.description && <span>{s.description}</span>}
            {s.price_text && <span>Precio: {s.price_text}</span>}
            <span>Zona: {[s.neighborhood, s.municipality, s.state].filter(Boolean).join(", ") || "Sin zona"}</span>
            {p && p.review_count > 0 && <span>Calificación: {p.avg_rating} ({p.review_count} reseñas)</span>}
            {p?.years_experience != null && <span>{p.years_experience} años de experiencia</span>}
          </div>
        );
      })}

      <a href="/cuenta">Mi cuenta</a>
    </main>
  );
}
