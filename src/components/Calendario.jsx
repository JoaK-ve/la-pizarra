import { useMemo, useState } from 'react'
import { useTareasConFecha } from '../hooks/useTareasConFecha'
import TaskCard from './TaskCard'

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

// "YYYY-MM-DD" en hora LOCAL (no UTC) -- la columna fecha_limite es tipo
// `date` en Postgres, y supabase-js la devuelve tal cual como ese mismo
// string, sin conversion de zona horaria. Usar toISOString() aca hubiera
// desfasado el dia en usuarios al oeste de UTC.
function formatearFechaLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Calendario mensual de tareas con fecha_limite: agendar una cita
// (ej. matriculacion de un cliente) o poner cuando debe hacerse algo.
// Las reparaciones de WheelOS NO aparecen aca a proposito -- no tienen
// una fecha de entrega real en la base (ver ROADMAP.md), y se gestionan
// desde WheelOS; la pestaña "Reparaciones" ya cubre verlas/crear tareas.
export default function Calendario({ usuariosPorId, reparacionesPorCliente, contadorNotas, onCircleClick, onAbrirDetalle }) {
  const { tareas, loading } = useTareasConFecha()
  const [mesActual, setMesActual] = useState(() => {
    const hoy = new Date()
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  })
  const [diaSeleccionado, setDiaSeleccionado] = useState(() => formatearFechaLocal(new Date()))

  const tareasPorDia = useMemo(() => {
    const mapa = new Map()
    for (const tarea of tareas) {
      const clave = tarea.fecha_limite
      if (!mapa.has(clave)) mapa.set(clave, [])
      mapa.get(clave).push(tarea)
    }
    return mapa
  }, [tareas])

  const dias = useMemo(() => {
    const ultimoDia = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0)
    // getDay(): Domingo=0 ... Sabado=6. La semana arranca en Lunes aca.
    const offsetInicio = (mesActual.getDay() + 6) % 7
    const celdas = Array(offsetInicio).fill(null)
    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      celdas.push(new Date(mesActual.getFullYear(), mesActual.getMonth(), d))
    }
    return celdas
  }, [mesActual])

  const tareasDelDia = tareasPorDia.get(diaSeleccionado) ?? []
  const hoyClave = formatearFechaLocal(new Date())

  function cambiarMes(delta) {
    setMesActual((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  return (
    <div className="px-4 sm:px-6 mt-4">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => cambiarMes(-1)} className="text-paper/60 hover:text-paper px-2 py-1 text-lg">
          ‹
        </button>
        <p className="font-display font-semibold text-paper capitalize">
          {mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </p>
        <button type="button" onClick={() => cambiarMes(1)} className="text-paper/60 hover:text-paper px-2 py-1 text-lg">
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-paper/40 font-mono mb-1">
        {DIAS_SEMANA.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dias.map((dia, i) => {
          if (!dia) return <div key={`vacio-${i}`} />
          const clave = formatearFechaLocal(dia)
          const tieneTareas = tareasPorDia.has(clave)
          const esSeleccionado = clave === diaSeleccionado
          const esHoy = clave === hoyClave
          return (
            <button
              key={clave}
              type="button"
              onClick={() => setDiaSeleccionado(clave)}
              className={
                'aspect-square rounded-lg text-sm flex flex-col items-center justify-center gap-0.5 relative ' +
                (esSeleccionado
                  ? 'bg-amber text-bg font-semibold'
                  : tieneTareas
                    ? 'bg-amber/20 text-paper font-semibold' + (esHoy ? ' border border-amber' : '')
                    : esHoy
                      ? 'border border-amber text-paper'
                      : 'text-paper/70 hover:bg-paper/5')
              }
            >
              {dia.getDate()}
              {/* Punto extra dentro del dia seleccionado (fondo ambar) para
                  no perder la senal de "tiene tareas" cuando ademas esta
                  activo -- en los demas casos ya lo dice el fondo. */}
              {tieneTareas && esSeleccionado && <span className="w-1.5 h-1.5 rounded-full bg-bg" />}
            </button>
          )
        })}
      </div>

      <div className="mt-5 space-y-2.5 pb-4">
        <p className="text-xs font-mono uppercase tracking-wide text-paper/40">
          {new Date(diaSeleccionado + 'T00:00:00').toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
        {loading && <p className="text-paper/40 text-sm">Cargando…</p>}
        {!loading && tareasDelDia.length === 0 && <p className="text-paper/40 text-sm">Sin tareas con esta fecha.</p>}
        {tareasDelDia.map((tarea) => (
          <TaskCard
            key={tarea.id}
            tarea={tarea}
            usuariosPorId={usuariosPorId}
            reparacionesPorCliente={reparacionesPorCliente}
            notaCount={contadorNotas.get(tarea.id) ?? 0}
            onCircleClick={onCircleClick}
            onAbrirDetalle={onAbrirDetalle}
          />
        ))}
      </div>
    </div>
  )
}
