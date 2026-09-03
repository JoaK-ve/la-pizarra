import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Todas las tareas del taller que tienen fecha_limite puesta -- para el
// calendario. No aplica los filtros de contexto/asignado/mostrar-hechas de
// la lista normal (useTareas): el calendario necesita ver todo lo que
// tiene fecha, sea cual sea su estado o a quien pertenezca (RLS ya limita
// esto al taller del usuario logueado y a sus tareas personales).
export function useTareasConFecha() {
  const { user } = useAuth()
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('tareas')
      .select('*')
      .not('fecha_limite', 'is', null)
      .order('fecha_limite', { ascending: true })

    if (error) {
      console.error('No se pudieron cargar las tareas con fecha:', error.message)
      setTareas([])
    } else {
      setTareas(data ?? [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { tareas, loading, refetch }
}
