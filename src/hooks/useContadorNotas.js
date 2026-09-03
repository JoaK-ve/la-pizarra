import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Cuenta de notas por tarea, para el indicador "💬 3" en la lista de
// tareas -- una sola consulta batch para todas las tarjetas visibles, no
// una consulta por tarjeta.
export function useContadorNotas(tareaIds) {
  const { user } = useAuth()
  const [contador, setContador] = useState(new Map())

  // Clave estable: solo se vuelve a consultar si cambia el CONJUNTO de
  // tareas visibles, no en cada render.
  const idsKey = tareaIds.slice().sort().join(',')

  const refetch = useCallback(async () => {
    if (!user || tareaIds.length === 0) {
      setContador(new Map())
      return
    }
    const { data, error } = await supabase.from('tarea_notas').select('tarea_id').in('tarea_id', tareaIds)

    if (error) {
      console.error('No se pudo cargar el contador de notas:', error.message)
      return
    }
    const mapa = new Map()
    for (const fila of data ?? []) {
      mapa.set(fila.tarea_id, (mapa.get(fila.tarea_id) ?? 0) + 1)
    }
    setContador(mapa)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- idsKey representa tareaIds
  }, [user, idsKey])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { contador, refetch }
}
