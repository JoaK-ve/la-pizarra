const DIA_MS = 86400000
// Los umbrales los configura cada taller en WheelOS (workshops.
// alert_days_terminado / alert_days_stalled); si faltan, 7 dias.
const UMBRAL_POR_DEFECTO = 7

// Dias enteros desde una fecha ISO hasta ahora.
export function diasDesde(iso, ahora = Date.now()) {
  const momento = Date.parse(iso)
  return Number.isNaN(momento) ? 0 : Math.max(0, Math.floor((ahora - momento) / DIA_MS))
}

// Reparaciones activas que llevan demasiado tiempo sin moverse, con los
// umbrales del propio taller:
//   - 'terminado': lista y sin recoger (hay que avisar al cliente)
//   - 'parada': pendiente o en progreso sin cambios (hay que revisarla)
// WheelOS no guarda CUANDO cambio de estado una reparacion, solo su ultima
// modificacion (`updated_at`), asi que los dias se cuentan desde ahi: si
// alguien toca una reparacion terminada, el contador vuelve a cero
// (aproximacion aceptada por el usuario, 2026-09-28).
// Las que ya tienen una tarea abierta enlazada no se listan: alguien ya se
// esta ocupando.
export function reparacionesQueNecesitanAtencion(reparaciones, taller, tareasAbiertasPorReparacion) {
  const umbralTerminado = taller?.alert_days_terminado ?? UMBRAL_POR_DEFECTO
  const umbralParada = taller?.alert_days_stalled ?? UMBRAL_POR_DEFECTO
  const items = []

  for (const reparacion of reparaciones) {
    if (tareasAbiertasPorReparacion.get(reparacion.id)) continue
    const dias = diasDesde(reparacion.updated_at)
    if (reparacion.status === 'terminado' && dias >= umbralTerminado) {
      items.push({ tipo: 'terminado', dias, reparacion })
    } else if ((reparacion.status === 'pendiente' || reparacion.status === 'en_progreso') && dias >= umbralParada) {
      items.push({ tipo: 'parada', dias, reparacion })
    }
  }

  // Primero las terminadas sin recoger (dinero parado), y dentro de cada tipo
  // las que llevan mas tiempo.
  return items.sort((a, b) => (a.tipo === b.tipo ? b.dias - a.dias : a.tipo === 'terminado' ? -1 : 1))
}
