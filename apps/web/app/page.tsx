import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Categorías de oficios</h1>
      <ul>
        {categories?.map((cat) => (
          <li key={cat.id}>{cat.name}</li>
        ))}
      </ul>
    </main>
  )
}