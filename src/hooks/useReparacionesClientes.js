import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Enriquece las tareas que tienen `client_id` con el contexto real del
// taller: datos del cliente (WheelOS: tabla `clients`) y su reparacion
// activa mas reciente, si tiene una (WheelOS: tabla `repairs`).
//
// Es de SOLO LECTURA -- nunca inserta ni actualiza nada en `clients` ni
// `repairs`. Ambas tablas ya tienen RLS que limita todo al workshop_id del
// usuario logueado (`workshop_id = auth_workshop_id()`), asi que este hook
// no necesita filtrar eso a mano, igual que useTareas/useUsuarios.
//
// Devuelve un Map: client_id -> { cliente, reparacion } donde `reparacion`
// es null si ese cliente no tiene ninguna reparacion activa (status
// distinto de "entregado") en este momento.
export function useReparacionesClientes(tareas) {
  const [porCliente, setPorCliente] = useState(new Map())

  const clientIds = [...new Set(tareas.map((t) => t.client_id).filter(Boolean))]
  // Clave estable: solo se vuelve a consultar si el CONJUNTO de clientes
  // cambio (p.ej. nuevas tareas), no en cada refetch por un simple toggle.
  const clientIdsKey = clientIds.slice().sort().join(',')

  useEffect(() => {
    if (clientIds.length === 0) {
      setPorCliente(new Map())
      return
    }

    let cancelado = false

    async function cargar() {
      const [{ data: clientes, error: errorClientes }, { data: reparaciones, error: errorReparaciones }] =
        await Promise.all([
          supabase.from('clients').select('id, first_name, last_name, phone').in('id', clientIds),
          supabase
            .from('repairs')
            .select('client_id, status, order_num, scooter_brand_snapshot, scooter_model_snapshot, reception_date, client_problem')
            .in('client_id', clientIds)
            .neq('status', 'entregado')
            .order('reception_date', { ascending: false }),
        ])

      if (cancelado) return
      if (errorClientes) console.error('No se pudo cargar el contexto de clientes:', errorClientes.message)
      if (errorReparaciones) console.error('No se pudo cargar reparaciones activas:', errorReparaciones.message)

      const mapa = new Map()
      for (const cliente of clientes ?? []) {
        mapa.set(cliente.id, { cliente, reparacion: null })
      }
      for (const reparacion of reparaciones ?? []) {
        const entrada = mapa.get(reparacion.client_id)
        // Si un cliente tiene mas de una reparacion activa, se queda con la
        // primera que aparezca -- ya vienen ordenadas por reception_date
        // desc, asi que es la mas reciente.
        if (entrada && !entrada.reparacion) entrada.reparacion = reparacion
      }
      setPorCliente(mapa)
    }

    cargar()
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clientIdsKey representa el array clientIds
  }, [clientIdsKey])

  return porCliente
}
