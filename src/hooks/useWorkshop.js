import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Logo real del taller (WheelOS ya lo tiene guardado en `workshops` --
// data URI en base64, no un archivo en Storage) -- de solo lectura, mismo
// patron que useReparacionesClientes/useReparacionesActivas.
export function useWorkshop() {
  const { profile } = useAuth()
  const [workshop, setWorkshop] = useState(null)

  useEffect(() => {
    if (!profile?.workshop_id) return
    supabase
      .from('workshops')
      .select('logo_icon_url')
      .eq('id', profile.workshop_id)
      .single()
      .then(({ data, error }) => {
        if (error) console.error('No se pudo cargar el logo del taller:', error.message)
        setWorkshop(data ?? null)
      })
  }, [profile?.workshop_id])

  return { workshop }
}
