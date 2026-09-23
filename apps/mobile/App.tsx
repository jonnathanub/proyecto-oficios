import { useEffect, useState } from 'react'
import { StyleSheet, Text, View, FlatList } from 'react-native'
import { supabase } from './lib/supabase'

export default function App() {
  const [categories, setCategories] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setCategories(data || [])
      })
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Categorías de oficios</Text>
      {error && <Text>Error: {error}</Text>}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.name}</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
})