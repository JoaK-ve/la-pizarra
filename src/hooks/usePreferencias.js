import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Lo que pasa cuando una persona no ha tocado sus ajustes: todo activado y el
// resumen a las 10:00 (hora de Madrid). El Worker usa los mismos valores
// (worker/avisos.js) -- mantener los dos iguales.
export const PREFERENCIAS_POR_DEFECTO = {
  resumen_email: true,
  resumen_hora: 10,
  push_vencimiento: true,
  aviso_asignacion: true,
}

// Horas que se pueden elegir para el resumen (tambien las limita la base).
export const HORAS_RESUMEN = Array.from({ length: 15 }, (_, i) => i + 6)

// Ajustes de avisos de la persona logueada (tabla `pizarra_preferencias`, de
// La Pizarra: no toca ninguna tabla de WheelOS). Sin fila = valores por
// defecto; la fila se crea al cambiar algo por primera vez.
export function usePreferencias() {
  const { profile } = useAuth()
  const [preferencias, setPreferencias] = useState(PREFERENCIAS_POR_DEFECTO)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!profile?.id) return
    let cancelado = false
    supabase
      .from('pizarra_preferencias')
      .select('resumen_email, resumen_hora, push_vencimiento, aviso_asignacion')
      .eq('user_id', profile.id)
      .maybeSingle()
      .then(({ data, error: errorCarga }) => {
        if (cancelado) return
        if (errorCarga) setError(errorCarga.message)
        else setPreferencias({ ...PREFERENCIAS_POR_DEFECTO, ...data })
        setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [profile?.id])

  // Guarda un cambio al instante: se ve ya y, si la base lo rechaza, se
  // revierte y se devuelve el motivo.
  const guardar = useCallback(
    async (cambios) => {
      if (!profile) return { ok: false, message: 'No hay sesión activa.' }
      const anterior = preferencias
      const nuevas = { ...preferencias, ...cambios }
      setPreferencias(nuevas)
      setError(null)

      const { error: errorGuardar } = await supabase
        .from('pizarra_preferencias')
        .upsert({ user_id: profile.id, workshop_id: profile.workshop_id, ...nuevas, updated_at: new Date().toISOString() })

      if (errorGuardar) {
        setPreferencias(anterior)
        return { ok: false, message: errorGuardar.message }
      }
      return { ok: true }
    },
    [profile, preferencias],
  )

  return { preferencias, loading, error, guardar }
}
