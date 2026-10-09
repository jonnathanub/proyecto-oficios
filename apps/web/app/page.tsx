import { supabase } from '../lib/supabase'
import AdSlot from '../lib/AdSlot'

export default async function Home() {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('active', true)
    .order('name')

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-card">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <a href="/" className="text-2xl font-bold text-primary hover:no-underline">
            Oficios
          </a>
          <div className="flex items-center gap-4 text-sm">
            <a href="/login">Iniciar sesión</a>
            <a
              href="/registro"
              className="rounded-xl bg-primary px-4 py-2 font-semibold text-white hover:no-underline"
            >
              Registrarme
            </a>
          </div>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
        <AdSlot location="home_banner" />

        <section className="rounded-2xl bg-primary px-6 py-10 text-center text-white shadow-sm">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Encuentra el profesional que necesitas
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-blue-100">
            Albañiles, electricistas, plomeros y más, cerca de ti.
          </p>
          <a
            href="/profesionales"
            className="mt-6 inline-block rounded-xl bg-accent px-6 py-3 font-semibold text-foreground hover:no-underline"
          >
            Buscar profesionales
          </a>
        </section>

        <section className="flex flex-col gap-4">
          <h2>Categorías de oficios</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories?.map((cat) => (
              <li
                key={cat.id}
                className="rounded-xl bg-card px-4 py-5 text-center font-medium shadow-sm"
              >
                {cat.name}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}