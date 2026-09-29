import { useMemo, useState } from 'react'
import { SearchIcon, CloseIcon } from './icons'

const PRIORIDAD_LABEL = {
  urgente: 'Urgente',
  seguimiento: 'Seguimiento',
  normal: 'Normal',
  baja: 'Baja',
  nuevo: 'Nuevo',
}

// Buscador por titulo/cliente sobre datos ya cargados (Tareas.jsx ya trae
// tareasVisibles + reparacionesPorCliente para las tarjetas) -- no pide
// nada nuevo a Supabase, a proposito, ver ROADMAP.md.
export default function Buscador({ tareas, reparacionesPorCliente, onAbrirDetalle }) {
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto] = useState(false)

  const resultados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (q.length < 2) return []
    return tareas
      .filter((tarea) => {
        const cliente = tarea.client_id ? reparacionesPorCliente?.get(tarea.client_id)?.cliente : null
        const nombreCliente = cliente ? [cliente.first_name, cliente.last_name].filter(Boolean).join(' ') : ''
        return (
          tarea.titulo?.toLowerCase().includes(q) ||
          tarea.descripcion?.toLowerCase().includes(q) ||
          nombreCliente.toLowerCase().includes(q)
        )
      })
      .slice(0, 8)
  }, [busqueda, tareas, reparacionesPorCliente])

  function elegir(tarea) {
    onAbrirDetalle(tarea)
    setBusqueda('')
    setAbierto(false)
  }

  return (
    <div className="px-4 sm:px-6 mt-4 relative">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text/40">
          <SearchIcon size={16} />
        </span>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            setAbierto(true)
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 120)}
          placeholder="Buscar tarea o cliente…"
          className="w-full rounded-full bg-text/10 border border-text/15 pl-9 pr-9 py-2 text-sm text-text placeholder:text-text/40 outline-none focus:border-brand/60"
        />
        {busqueda && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setBusqueda('')}
            aria-label="Borrar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text/40 hover:text-text"
          >
            <CloseIcon size={14} />
          </button>
        )}
      </div>

      {abierto && busqueda.trim().length >= 2 && (
        <div className="absolute left-4 right-4 sm:left-6 sm:right-6 mt-1.5 rounded-xl bg-surface text-surface-text shadow-lg overflow-hidden z-20">
          {resultados.length === 0 ? (
            <p className="px-4 py-3 text-sm text-surface-text/50">No se encontraron tareas.</p>
          ) : (
            resultados.map((tarea) => {
              const cliente = tarea.client_id ? reparacionesPorCliente?.get(tarea.client_id)?.cliente : null
              const nombreCliente = cliente ? [cliente.first_name, cliente.last_name].filter(Boolean).join(' ') : null
              return (
                <button
                  key={tarea.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => elegir(tarea)}
                  className="w-full text-left px-4 py-2.5 border-t border-surface-text/10 first:border-t-0 hover:bg-surface-text/5 flex items-center gap-2"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: `var(--color-priority-${tarea.prioridad})` }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className={'block text-sm font-medium truncate ' + (tarea.estado === 'hecho' ? 'line-through text-surface-text/50' : '')}>
                      {tarea.titulo}
                    </span>
                    {nombreCliente && <span className="block text-xs text-surface-text/50 truncate">{nombreCliente}</span>}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-surface-text/40">
                    {PRIORIDAD_LABEL[tarea.prioridad] ?? tarea.prioridad}
                  </span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
