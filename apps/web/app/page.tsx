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
    <main style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdSlot location="home_banner" />

      <div>
        <h1>Encuentra el profesional que necesitas</h1>
        <a href="/profesionales">Buscar profesionales</a>
      </div>

      <div>
        <h2>Categorias de oficios</h2>
        <ul>
          {categories?.map((cat) => (
            <li key={cat.id}>{cat.name}</li>
          ))}
        </ul>
      </div>
    </main>
  )
}