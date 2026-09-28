import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Datos del taller de esta persona, leidos de `workshops` (WheelOS): nombre,
// logo (data URI en base64, no un archivo en Storage) y los umbrales de
// alerta que el taller configuro en WheelOS. De solo lectura, mismo patron
// que useReparacionesClientes/useReparacionesActivas.
export function useWorkshop() {
  const { profile } = useAuth()
  const [workshop, setWorkshop] = useState(null)

  useEffect(() => {
    if (!profile?.workshop_id) return
    supabase
      .from('workshops')
      .select('fantasy_name, logo_icon_url, alert_days_terminado, alert_days_stalled')
      .eq('id', profile.workshop_id)
      .single()
      .then(({ data, error }) => {
        if (error) console.error('No se pudo cargar el logo del taller:', error.message)
        setWorkshop(data ?? null)
      })
  }, [profile?.workshop_id])

  return { workshop }
}
