import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Lista completa de reparaciones activas del taller (status distinto de
// "entregado") -- no solo las que ya tienen una tarea en La Pizarra, sino
// TODAS, para poder crear una tarea desde aca con un clic.
//
// De SOLO LECTURA sobre WheelOS (`repairs`). RLS ya limita esto al
// workshop_id del usuario logueado (`workshop_id = auth_workshop_id()`),
// igual que useReparacionesClientes -- no hace falta filtrar a mano.
//
// `repairs` ya trae el nombre/telefono del cliente y la marca/modelo del
// patin "congelados" en la misma fila (columnas *_snapshot), asi que no
// hace falta una consulta aparte a `clients`.
export function useReparacionesActivas() {
  const { user } = useAuth()
  const [reparaciones, setReparaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data, error } = await supabase
      .from('repairs')
      .select(
        'id, client_id, order_num, status, reception_date, client_problem, client_name_snapshot, client_phone_snapshot, scooter_brand_snapshot, scooter_model_snapshot',
      )
      .neq('status', 'entregado')
      .order('reception_date', { ascending: false })

    if (error) {
      setError(error)
    } else {
      setError(null)
      setReparaciones(data ?? [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { reparaciones, loading, error, refetch }
}
