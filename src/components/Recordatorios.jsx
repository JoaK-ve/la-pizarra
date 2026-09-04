import { useMemo } from 'react'
import { formatearFechaLocal, soloFecha } from '../utils/fechas'

// Primera version de "recordatorios" (pedido del usuario, 2026-09-04):
// aviso dentro de la app, sin notificaciones push todavia -- solo avisa
// si alguien abre La Pizarra. Usa las mismas tareas con fecha_limite que
// ya se traen para el Calendario (tareasConFecha en Tareas.jsx), sin pedir
// nada nuevo a Supabase. Se muestra arriba de todo, sin importar en que
// pestaña estes, porque es la parte que mas importa que se vea rapido.
export default function Recordatorios({ tareas, onAbrirDetalle }) {
  const hoyClave = formatearFechaLocal(new Date())

  const { vencidas, hoy } = useMemo(() => {
    const pendientes = tareas.filter((t) => t.estado === 'pendiente')
    return {
      // soloFecha() por si algun registro viejo quedo con hora/zona pegada
      // en fecha_limite -- ver la nota en utils/fechas.js.
      vencidas: pendientes.filter((t) => soloFecha(t.fecha_limite) < hoyClave),
      hoy: pendientes.filter((t) => soloFecha(t.fecha_limite) === hoyClave),
    }
  }, [tareas, hoyClave])

  if (vencidas.length === 0 && hoy.length === 0) return null

  return (
    <div className="px-4 sm:px-6 mt-4 space-y-2">
      {vencidas.length > 0 && (
        <FilaRecordatorio urgente etiqueta={etiquetaCantidad(vencidas.length, 'vencidas')} tareas={vencidas} onAbrirDetalle={onAbrirDetalle} />
      )}
      {hoy.length > 0 && (
        <FilaRecordatorio etiqueta={etiquetaCantidad(hoy.length, 'para hoy')} tareas={hoy} onAbrirDetalle={onAbrirDetalle} />
      )}
    </div>
  )
}

function etiquetaCantidad(cantidad, plural) {
  const singular = plural.endsWith('s') ? plural.slice(0, -1) : plural
  return cantidad === 1 ? `1 tarea ${singular}` : `${cantidad} tareas ${plural}`
}

// "Vencidas" se queda en la familia del rojo/urgente (es informacion de
// urgencia real, no se pasa a verde de marca) -- diseño v2, 2026-09-05.
// "Para hoy" no es un dato de prioridad, es un acento general de la app,
// asi que sigue la regla nueva: pasa de ambar a --color-brand.
function FilaRecordatorio({ urgente, etiqueta, tareas, onAbrirDetalle }) {
  return (
    <div className={'rounded-xl p-4 border ' + (urgente ? 'bg-priority-urgente/10 border-priority-urgente/40' : 'bg-brand/10 border-brand/40')}>
      <p className="font-display font-bold text-text text-sm">{etiqueta}</p>
      <ul className="mt-1.5 space-y-1">
        {tareas.map((tarea) => (
          <li key={tarea.id}>
            <button
              type="button"
              onClick={() => onAbrirDetalle(tarea)}
              className={
                'text-sm underline underline-offset-2 text-left ' +
                (urgente ? 'text-priority-urgente/90 hover:text-priority-urgente' : 'text-brand-light hover:text-brand')
              }
            >
              {tarea.titulo}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
