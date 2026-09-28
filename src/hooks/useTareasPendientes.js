import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// TODAS las tareas pendientes del taller, sin filtros -- alimenta "Mi dia".
// Va aparte de useTareas porque esa lista cambia con los filtros de la
// pestaña Tareas (persona, hechas...) y "Mi dia" no debe verse afectado.
// `refetch` sube un contador que relanza la consulta: asi el estado solo se
// actualiza dentro del callback de la consulta, nunca de forma sincrona en
// el efecto.
export function useTareasPendientes() {
  const { user } = useAuth()
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!user) return
    let cancelado = false
    supabase
      .from('tareas')
      .select('*')
      .neq('estado', 'hecho')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) console.error('No se pudieron cargar las tareas pendientes:', error.message)
        setTareas(data ?? [])
        setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [user, version])

  const refetch = useCallback(() => setVersion((v) => v + 1), [])

  return { tareas, loading, refetch }
}
