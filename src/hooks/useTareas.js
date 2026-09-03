import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Filtros: contexto ('todos' | 'taller' | 'personal' | 'familia'),
// asignadoA ('todos' | uuid de users.id), mostrarHechas (boolean).
// RLS ya limita todo al workshop_id del usuario logueado y a las tareas
// personales ajenas -- este hook no necesita filtrar eso a mano.
export function useTareas({ contexto, asignadoA, mostrarHechas }) {
  const { user } = useAuth()
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!user) return
    setLoading(true)

    let query = supabase.from('tareas').select('*').order('created_at', { ascending: false })

    if (contexto !== 'todos') query = query.eq('contexto', contexto)
    if (asignadoA !== 'todos') query = query.eq('asignado_a', asignadoA)
    if (!mostrarHechas) query = query.neq('estado', 'hecho')

    const { data, error } = await query

    if (error) {
      setError(error)
    } else {
      setError(null)
      setTareas(data ?? [])
    }
    setLoading(false)
  }, [user, contexto, asignadoA, mostrarHechas])

  useEffect(() => {
    refetch()
  }, [refetch])

  // Toggle rapido pendiente <-> hecho. Si RLS bloquea el update (no es el
  // creador, ni el asignado, ni admin/owner) Supabase/PostgREST no tira un
  // error -- devuelve 0 filas afectadas. Se detecta eso explicitamente para
  // avisar en vez de mostrar un check que en realidad no se guardo.
  const toggleHecho = useCallback(
    async (tarea) => {
      const nuevoEstado = tarea.estado === 'hecho' ? 'pendiente' : 'hecho'
      const { data, error } = await supabase
        .from('tareas')
        .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
        .eq('id', tarea.id)
        .select()

      if (error) return { ok: false, message: error.message }
      if (!data || data.length === 0) {
        return { ok: false, message: 'No tenés permiso para modificar esta tarea.' }
      }
      await refetch()
      return { ok: true }
    },
    [refetch],
  )

  const crearTarea = useCallback(
    async ({ titulo, descripcion, contexto: ctx, asignadoA: asignado, prioridad, clientId, clienteRef, fechaLimite }) => {
      if (!user) return { ok: false, message: 'No hay sesion activa.' }

      // creado_por/workshop_id se resuelven del perfil del usuario logueado,
      // no vienen del formulario.
      const { data: perfil, error: perfilError } = await supabase
        .from('users')
        .select('id, workshop_id')
        .eq('auth_user_id', user.id)
        .single()

      if (perfilError || !perfil) {
        return { ok: false, message: 'No se pudo resolver tu perfil de usuario.' }
      }

      // clientId/clienteRef solo vienen cuando la tarea se crea desde la
      // vista de Reparaciones (ver RepairCard) -- en el formulario manual
      // normal quedan undefined y se guardan como null, igual que antes.
      const { error } = await supabase.from('tareas').insert({
        workshop_id: perfil.workshop_id,
        titulo,
        descripcion: descripcion || null,
        contexto: ctx,
        origen: 'manual',
        prioridad,
        creado_por: perfil.id,
        asignado_a: asignado || null,
        client_id: clientId || null,
        cliente_ref: clienteRef || null,
        fecha_limite: fechaLimite || null,
      })

      if (error) return { ok: false, message: error.message }
      await refetch()
      return { ok: true }
    },
    [user, refetch],
  )

  return { tareas, loading, error, refetch, toggleHecho, crearTarea }
}
