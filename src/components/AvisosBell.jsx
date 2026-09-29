import { useMemo, useState } from 'react'
import { BellIcon } from './icons'
import { formatearFechaLocal, soloFecha } from '../utils/fechas'

// Reemplaza al banner fijo de Recordatorios (v0.16.0): mismo calculo de
// vencidas/hoy, pero como campanita con contador en el header -- visible en
// cualquier pestaña, no solo empuja el contenido hacia abajo. En "Mi dia"
// esta misma informacion ya sale en la lista, asi que la campanita ahi es
// redundante pero no molesta (mismo dato, forma distinta de llegar a el).
export default function AvisosBell({ tareas, onAbrirDetalle }) {
  const [abierto, setAbierto] = useState(false)
  const hoyClave = formatearFechaLocal(new Date())

  const { vencidas, hoy } = useMemo(() => {
    const pendientes = tareas.filter((t) => t.estado === 'pendiente')
    return {
      vencidas: pendientes.filter((t) => soloFecha(t.fecha_limite) < hoyClave),
      hoy: pendientes.filter((t) => soloFecha(t.fecha_limite) === hoyClave),
    }
  }, [tareas, hoyClave])

  const total = vencidas.length + hoy.length

  function elegir(tarea) {
    onAbrirDetalle(tarea)
    setAbierto(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="relative text-text/50 hover:text-text p-1"
        aria-label={total > 0 ? `${total} avisos: vencidas y para hoy` : 'Avisos'}
        title="Tareas vencidas y para hoy"
      >
        <BellIcon size={20} />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-priority-urgente text-text text-[10px] font-mono font-semibold flex items-center justify-center">
            {total}
          </span>
        )}
      </button>

      {abierto && (
        <>
          {/* Capa invisible para cerrar al tocar fuera -- mas simple que un
              listener de click global con ref, y no hay nada mas en la
              pagina que necesite recibir ese click. */}
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} />
          <div className="absolute right-0 top-9 w-72 max-h-80 overflow-y-auto rounded-xl bg-surface text-surface-text shadow-lg z-20">
            {total === 0 ? (
              <p className="px-4 py-3 text-sm text-surface-text/50">No hay tareas vencidas ni para hoy.</p>
            ) : (
              <>
                {vencidas.length > 0 && (
                  <GrupoAviso etiqueta={etiquetaCantidad(vencidas.length, 'vencidas')} tareas={vencidas} urgente onElegir={elegir} />
                )}
                {hoy.length > 0 && (
                  <GrupoAviso etiqueta={etiquetaCantidad(hoy.length, 'para hoy')} tareas={hoy} onElegir={elegir} />
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function etiquetaCantidad(cantidad, plural) {
  const singular = plural.endsWith('s') ? plural.slice(0, -1) : plural
  return cantidad === 1 ? `1 tarea ${singular}` : `${cantidad} tareas ${plural}`
}

function GrupoAviso({ etiqueta, tareas, urgente, onElegir }) {
  return (
    <div className="border-t border-surface-text/10 first:border-t-0 py-2">
      <p className={'px-4 pb-1 font-mono text-[11px] uppercase tracking-wide font-semibold ' + (urgente ? 'text-priority-urgente' : 'text-brand')}>
        {etiqueta}
      </p>
      {tareas.map((tarea) => (
        <button
          key={tarea.id}
          type="button"
          onClick={() => onElegir(tarea)}
          className="w-full text-left px-4 py-1.5 text-sm truncate block hover:bg-surface-text/5"
        >
          {tarea.titulo}
        </button>
      ))}
    </div>
  )
}
