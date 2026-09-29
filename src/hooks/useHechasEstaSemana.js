import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { inicioDeSemana } from '../utils/fechas'

// Cuenta (no trae filas, solo el numero) las tareas de TODO el taller
// marcadas hechas desde el lunes de esta semana -- para la tarjeta "Hechas
// esta semana" de Mi dia. Usa `updated_at` como aproximacion de "cuando se
// marco hecha" (toggleHecho lo pisa siempre que cambia el estado) -- si
// alguien edita una tarea ya hecha, updated_at tambien sube, pero es un
// caso raro y el numero sigue siendo razonable.
export function useHechasEstaSemana() {
  const { user } = useAuth()
  const [cantidad, setCantidad] = useState(0)
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!user) return
    let cancelado = false
    supabase
      .from('tareas')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'hecho')
      .gte('updated_at', inicioDeSemana().toISOString())
      .then(({ count, error }) => {
        if (cancelado) return
        if (error) console.error('No se pudo contar las tareas hechas esta semana:', error.message)
        setCantidad(count ?? 0)
        setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [user, version])

  return { cantidad, loading, refetch: () => setVersion((v) => v + 1) }
}
