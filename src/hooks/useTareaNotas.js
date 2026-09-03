import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Bitacora de UNA tarea: notas ordenadas de mas vieja a mas nueva, cada
// una con quien la escribio y cuando -- automatico, nadie teclea su
// nombre ni la fecha a mano. RLS en `tarea_notas` ya limita esto al
// workshop_id del usuario logueado, igual que el resto de las tablas.
export function useTareaNotas(tareaId) {
  const { profile } = useAuth()
  const [notas, setNotas] = useState([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!tareaId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('tarea_notas')
      .select('id, texto, created_at, autor:autor_id (full_name)')
      .eq('tarea_id', tareaId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('No se pudieron cargar las notas:', error.message)
      setNotas([])
    } else {
      setNotas(data ?? [])
    }
    setLoading(false)
  }, [tareaId])

  useEffect(() => {
    refetch()
  }, [refetch])

  const agregarNota = useCallback(
    async (texto) => {
      if (!profile || !texto.trim()) return { ok: false }
      const { error } = await supabase.from('tarea_notas').insert({
        tarea_id: tareaId,
        workshop_id: profile.workshop_id,
        autor_id: profile.id,
        texto: texto.trim(),
      })
      if (error) return { ok: false, message: error.message }
      await refetch()
      return { ok: true }
    },
    [tareaId, profile, refetch],
  )

  return { notas, loading, agregarNota, refetch }
}
