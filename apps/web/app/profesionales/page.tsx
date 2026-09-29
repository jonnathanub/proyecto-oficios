import { supabase } from "../../lib/supabase";
import FavoritoButton from "../../components/FavoritoButton";
import AdSlot from "../../lib/AdSlot";

export const metadata = {
  title: "Encuentra profesionales de oficio",
  description: "Busca plomeros, electricistas, carpinteros y mas profesionales cerca de ti.",
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

const POR_PAGINA = 20;

export default async function Profesionales({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; municipio?: string; pagina?: string }>;
}) {
  const { categoria = "", municipio = "", pagina = "1" } = await searchParams;
  const paginaActual = Math.max(1, parseInt(pagina, 10) || 1);
  const desde = (paginaActual - 1) * POR_PAGINA;
  const hasta = desde + POR_PAGINA - 1;

  const { data: cats } = await supabase
    .from("categories")
    .select("id, name")
    .eq("active", true)
    .order("name");

  let consulta = supabase
    .from("services")
    .select(
      "id, title, description, price_text, state, municipality, neighborhood, category_id, professional_profiles(id, bio, years_experience, avg_rating, review_count, users(full_name))",
      { count: "exact" }
    )
    .eq("active", true)
    .order("created_at", { ascending: false })
    .range(desde, hasta);

  if (categoria) {
    consulta = consulta.eq("category_id", categoria);
  }

  if (municipio.trim()) {
    consulta = consulta.ilike("municipality", `%${municipio.trim()}%`);
  }

  const { data, error, count } = await consulta;

  const servicios = (data ?? []) as unknown as Fila[];
  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  const nombreCategoria = (id: string) =>
    (cats ?? []).find((c) => c.id === id)?.name ?? "Oficio";

  function urlPagina(n: number) {
    const params = new URLSearchParams();
    if (categoria) params.set("categoria", categoria);
    if (municipio) params.set("municipio", municipio);
    params.set("pagina", String(n));
    return `/profesionales?${params.toString()}`;
  }

  return (
    <main
      style={{
        maxWidth: 640,
        margin: "40px auto",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <h1>Encuentra profesionales</h1>

      <form
        method="get"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <select name="categoria" defaultValue={categoria}>
          <option value="">Todos los oficios</option>

          {(cats ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          name="municipio"
          placeholder="Municipio (ej. Toluca)"
          defaultValue={municipio}
        />

        <button type="submit">Buscar</button>
      </form>

      <AdSlot location="search_results" categoryId={categoria || undefined} />

      {error && <p>Error al cargar: {error.message}</p>}

      {!error && servicios.length === 0 && (
        <p>No encontramos servicios con esos filtros.</p>
      )}

      {!error && total > 0 && (
        <p style={{ fontSize: 13, opacity: 0.75 }}>
          {total} resultado{total !== 1 ? "s" : ""} - pagina {paginaActual} de {totalPaginas}
        </p>
      )}

      {servicios.map((s, index) => {
        const p = s.professional_profiles;

        return (
          <div key={s.id} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                border: "1px solid #666",
                borderRadius: 8,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <strong>{s.title}</strong>

              <span>{nombreCategoria(s.category_id)}</span>

              <span>
                Profesional: {p?.users?.full_name ?? "Sin nombre"}
              </span>

              {s.description && <span>{s.description}</span>}

              {s.price_text && (
                <span>Precio: {s.price_text}</span>
              )}

              <span>
                Zona:{" "}
                {[s.neighborhood, s.municipality, s.state]
                  .filter(Boolean)
                  .join(", ") || "Sin zona"}
              </span>

              {p && (p.review_count > 0 ? (<span>Calificacion: {p.avg_rating} ({p.review_count} resenas)</span>) : (<span>Sin calificaciones todavia</span>))}

              {p && (p.years_experience != null ? (<span>{p.years_experience} anos de experiencia</span>) : (<span>Experiencia: No especificada</span>))}

              {p && (
                <FavoritoButton professionalId={p.id} />
              )}

              <a href={`/solicitar?servicio=${s.id}`}>
                Solicitar servicio
              </a>
            </div>

            {index === 1 && <AdSlot location="sponsored_card" categoryId={categoria || undefined} />}
          </div>
        );
      })}

      {totalPaginas > 1 && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
          {paginaActual > 1 && (
            <a href={urlPagina(paginaActual - 1)}>Anterior</a>
          )}
          <span>Pagina {paginaActual} de {totalPaginas}</span>
          {paginaActual < totalPaginas && (
            <a href={urlPagina(paginaActual + 1)}>Siguiente</a>
          )}
        </div>
      )}

      <a href="/cuenta">Mi cuenta</a>
    </main>
  );
}