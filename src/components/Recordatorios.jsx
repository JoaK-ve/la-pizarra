import { useMemo } from 'react'
import { formatearFechaLocal } from '../utils/fechas'

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
      vencidas: pendientes.filter((t) => t.fecha_limite < hoyClave),
      hoy: pendientes.filter((t) => t.fecha_limite === hoyClave),
    }
  }, [tareas, hoyClave])

  if (vencidas.length === 0 && hoy.length === 0) return null

  return (
    <div className="px-4 sm:px-6 mt-4 space-y-2">
      {vencidas.length > 0 && (
        <FilaRecordatorio urgente etiqueta={etiquetaCantidad(vencidas.length, 'vencida')} tareas={vencidas} onAbrirDetalle={onAbrirDetalle} />
      )}
      {hoy.length > 0 && (
        <FilaRecordatorio etiqueta={etiquetaCantidad(hoy.length, 'para hoy')} tareas={hoy} onAbrirDetalle={onAbrirDetalle} />
      )}
    </div>
  )
}

function etiquetaCantidad(cantidad, sufijo) {
  return cantidad === 1 ? `1 tarea ${sufijo}` : `${cantidad} tareas ${sufijo}`
}

// El color va por estilo en linea cuando es "urgente" (rojo), no por clase
// de Tailwind -- ver la nota en TaskCard.jsx: las clases que referencian
// una variable CSS de prioridad no generan estilo real en este proyecto.
// El tono "hoy" usa ambar, que si es un color propio de Tailwind (definido
// en @theme) y ya se usa asi en el resto de la app sin problema.
function FilaRecordatorio({ urgente, etiqueta, tareas, onAbrirDetalle }) {
  return (
    <div
      className={'rounded-xl px-4 py-3 border ' + (urgente ? '' : 'bg-amber/15 border-amber/30')}
      style={urgente ? { backgroundColor: 'rgba(178, 58, 46, 0.15)', borderColor: 'rgba(178, 58, 46, 0.4)' } : undefined}
    >
      <p className={'text-xs font-mono uppercase tracking-wide font-semibold ' + (urgente ? 'text-[--color-prioridad-urgente]' : 'text-amber')}>
        {etiqueta}
      </p>
      <ul className="mt-1.5 space-y-1">
        {tareas.map((tarea) => (
          <li key={tarea.id}>
            <button
              type="button"
              onClick={() => onAbrirDetalle(tarea)}
              className="text-sm text-paper/90 hover:text-paper text-left underline decoration-paper/20 underline-offset-2"
            >
              {tarea.titulo}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
