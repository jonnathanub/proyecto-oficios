import { supabase } from "../../lib/supabase";
import FavoritoButton from "../../components/FavoritoButton";
import AdSlot from "../../lib/AdSlot";

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
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-card">
        <nav className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <a href="/" className="text-2xl font-bold text-primary hover:no-underline">
            Oficios
          </a>
          <a href="/cuenta" className="text-sm">
            Mi cuenta
          </a>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8">
        <h1>Encuentra profesionales</h1>

        <form
          method="get"
          className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm sm:flex-row sm:items-center"
        >
          <select name="categoria" defaultValue={categoria} className="sm:w-56">
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
            className="flex-1"
          />

          <button type="submit">Buscar</button>
        </form>

        <AdSlot location="search_results" categoryId={categoria || undefined} />

        {error && (
          <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-danger">
            Error al cargar: {error.message}
          </p>
        )}

        {!error && servicios.length === 0 && (
          <p className="py-6 text-center text-muted">
            No encontramos servicios con esos filtros.
          </p>
        )}

        {!error && total > 0 && (
          <p className="text-sm text-muted">
            {total} resultado{total !== 1 ? "s" : ""} · página {paginaActual} de {totalPaginas}
          </p>
        )}

        {servicios.map((s, index) => {
          const p = s.professional_profiles;

          return (
            <div key={s.id} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2 rounded-2xl bg-card p-5 shadow-sm">
                <span className="self-start rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-primary-dark">
                  {nombreCategoria(s.category_id)}
                </span>

                <strong className="text-lg">{s.title}</strong>

                <span className="text-muted">
                  {p?.users?.full_name ?? "Sin nombre"}
                </span>

                {s.description && <span>{s.description}</span>}

                {s.price_text && (
                  <span className="font-bold text-primary">{s.price_text}</span>
                )}

                <span className="text-sm text-muted">
                  📍{" "}
                  {[s.neighborhood, s.municipality, s.state]
                    .filter(Boolean)
                    .join(", ") || "Sin zona"}
                </span>

                {p &&
                  (p.review_count > 0 ? (
                    <span className="text-sm font-semibold text-amber-700">
                      ★ {p.avg_rating} ({p.review_count} reseñas)
                    </span>
                  ) : (
                    <span className="text-sm text-muted">Sin calificaciones todavía</span>
                  ))}

                {p &&
                  (p.years_experience != null ? (
                    <span className="text-sm text-muted">
                      {p.years_experience} años de experiencia
                    </span>
                  ) : (
                    <span className="text-sm text-muted">Experiencia: No especificada</span>
                  ))}

                {p && (
                  <div className="mt-1">
                    <FavoritoButton professionalId={p.id} />
                  </div>
                )}

                <a
                  href={`/solicitar?servicio=${s.id}`}
                  className="mt-2 rounded-xl bg-primary px-4 py-3 text-center font-semibold text-white hover:no-underline"
                >
                  Solicitar servicio
                </a>
              </div>

              {index === 1 && (
                <AdSlot location="sponsored_card" categoryId={categoria || undefined} />
              )}
            </div>
          );
        })}

        {totalPaginas > 1 && (
          <div className="flex items-center justify-center gap-4">
            {paginaActual > 1 && <a href={urlPagina(paginaActual - 1)}>← Anterior</a>}
            <span className="text-sm text-muted">
              Página {paginaActual} de {totalPaginas}
            </span>
            {paginaActual < totalPaginas && (
              <a href={urlPagina(paginaActual + 1)}>Siguiente →</a>
            )}
          </div>
        )}
      </main>
    </div>
  );
}