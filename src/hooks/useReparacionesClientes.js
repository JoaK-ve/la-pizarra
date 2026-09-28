import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const CAMPOS_REPARACION =
  'id, client_id, status, order_num, scooter_brand_snapshot, scooter_model_snapshot, reception_date, client_problem'

// Enriquece las tareas que tienen `client_id` con el contexto real del
// taller: datos del cliente (WheelOS: tabla `clients`) y sus reparaciones
// (WheelOS: tabla `repairs`).
//
// Es de SOLO LECTURA -- nunca inserta ni actualiza nada en `clients` ni
// `repairs`. Ambas tablas ya tienen RLS que limita todo al workshop_id del
// usuario logueado (`workshop_id = auth_workshop_id()`), asi que este hook
// no necesita filtrar eso a mano, igual que useTareas/useUsuarios.
//
// Devuelve un Map: client_id -> { cliente, reparacion, reparaciones }:
//   - reparacion: la reparacion ACTIVA mas reciente del cliente (status
//     distinto de "entregado"), o null. Es lo que se muestra en las tareas
//     que no estan enlazadas a una reparacion concreta.
//   - reparaciones: las activas + las que estan enlazadas a alguna tarea
//     por `repair_id` (aunque ya esten entregadas). Para elegir la correcta
//     de cada tarea usar reparacionDeTarea (utils/contexto.js).
export function useReparacionesClientes(tareas) {
  const [porCliente, setPorCliente] = useState(new Map())

  const clientIds = [...new Set(tareas.map((t) => t.client_id).filter(Boolean))]
  const repairIds = [...new Set(tareas.map((t) => t.repair_id).filter(Boolean))]
  // Claves estables: solo se vuelve a consultar si el CONJUNTO de clientes o
  // de reparaciones enlazadas cambio, no en cada refetch por un simple toggle.
  const clientIdsKey = clientIds.slice().sort().join(',')
  const repairIdsKey = repairIds.slice().sort().join(',')

  useEffect(() => {
    if (clientIds.length === 0) {
      setPorCliente(new Map())
      return
    }

    let cancelado = false

    async function cargar() {
      const [clientes, activas, enlazadas] = await Promise.all([
        supabase.from('clients').select('id, first_name, last_name, phone').in('id', clientIds),
        supabase
          .from('repairs')
          .select(CAMPOS_REPARACION)
          .in('client_id', clientIds)
          .neq('status', 'entregado')
          .order('reception_date', { ascending: false }),
        repairIds.length
          ? supabase.from('repairs').select(CAMPOS_REPARACION).in('id', repairIds)
          : { data: [] },
      ])

      if (cancelado) return
      if (clientes.error) console.error('No se pudo cargar el contexto de clientes:', clientes.error.message)
      if (activas.error) console.error('No se pudo cargar reparaciones activas:', activas.error.message)
      if (enlazadas.error) console.error('No se pudo cargar las reparaciones enlazadas:', enlazadas.error.message)

      const mapa = new Map()
      for (const cliente of clientes.data ?? []) {
        mapa.set(cliente.id, { cliente, reparacion: null, reparaciones: [] })
      }
      for (const reparacion of activas.data ?? []) {
        const entrada = mapa.get(reparacion.client_id)
        if (!entrada) continue
        entrada.reparaciones.push(reparacion)
        // Ya vienen ordenadas por reception_date desc: la primera es la mas reciente.
        if (!entrada.reparacion) entrada.reparacion = reparacion
      }
      for (const reparacion of enlazadas.data ?? []) {
        const entrada = mapa.get(reparacion.client_id)
        if (entrada && !entrada.reparaciones.some((r) => r.id === reparacion.id)) entrada.reparaciones.push(reparacion)
      }
      setPorCliente(mapa)
    }

    cargar()
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- las claves representan los arrays
  }, [clientIdsKey, repairIdsKey])

  return porCliente
}
