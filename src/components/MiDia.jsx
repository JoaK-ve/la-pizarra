import { useMemo } from 'react'
import TaskCard from './TaskCard'
import { fechaRelativa, soloFecha } from '../utils/fechas'

const RANGO_PRIORIDAD = { urgente: 0, seguimiento: 1, normal: 2, nuevo: 2, baja: 3 }

function comparar(a, b) {
  return (
    (RANGO_PRIORIDAD[a.prioridad] ?? 2) - (RANGO_PRIORIDAD[b.prioridad] ?? 2) ||
    (soloFecha(a.fecha_limite) ?? '9999').localeCompare(soloFecha(b.fecha_limite) ?? '9999') ||
    b.created_at.localeCompare(a.created_at)
  )
}

// Pantalla de entrada: lo que tiene que hacer YO, ordenado por urgencia de
// fecha (vencidas -> hoy -> proximos 7 dias -> mas adelante -> sin fecha) y,
// dentro de cada grupo, por prioridad. Incluye las tareas sin asignar,
// porque nadie las tiene y cualquiera puede cogerlas.
export default function MiDia({
  tareas,
  miId,
  loading,
  usuariosPorId,
  reparacionesPorCliente,
  contadorNotas,
  onCircleClick,
  onAbrirDetalle,
  onCrear,
  reparacionesAtencion = 0,
  onVerReparaciones,
}) {
  const grupos = useMemo(() => {
    const hoy = fechaRelativa(0)
    const limiteSemana = fechaRelativa(7)
    const mias = tareas.filter((t) => !t.asignado_a || t.asignado_a === miId)
    const fecha = (t) => soloFecha(t.fecha_limite)
    const con = (criterio) => mias.filter(criterio).sort(comparar)

    return [
      { clave: 'vencidas', titulo: 'Vencidas', urgente: true, tareas: con((t) => t.fecha_limite && fecha(t) < hoy) },
      { clave: 'hoy', titulo: 'Hoy', tareas: con((t) => fecha(t) === hoy) },
      { clave: 'semana', titulo: 'Próximos 7 días', tareas: con((t) => fecha(t) > hoy && fecha(t) <= limiteSemana) },
      { clave: 'despues', titulo: 'Más adelante', tareas: con((t) => fecha(t) > limiteSemana) },
      { clave: 'sin', titulo: 'Sin fecha', tareas: con((t) => !t.fecha_limite) },
    ].filter((g) => g.tareas.length > 0)
  }, [tareas, miId])

  const total = grupos.reduce((suma, g) => suma + g.tareas.length, 0)

  return (
    <main className="px-4 sm:px-6 mt-4 pb-4">
      <p className="text-sm text-text/60">
        Tus tareas pendientes y las que no tienen a nadie asignado.
      </p>

      {reparacionesAtencion > 0 && onVerReparaciones && (
        <button
          type="button"
          onClick={onVerReparaciones}
          className="mt-3 w-full flex items-center justify-between gap-3 rounded-xl border border-text/15 bg-text/5 px-4 py-3 text-left hover:border-text/30 transition-colors"
        >
          <span className="text-sm text-text">
            <strong className="font-display">
              {reparacionesAtencion === 1
                ? '1 reparación necesita atención'
                : `${reparacionesAtencion} reparaciones necesitan atención`}
            </strong>
            <span className="text-text/60"> · llevan días quietas sin nadie ocupándose</span>
          </span>
          <span className="text-brand-light text-sm font-semibold shrink-0">Ver</span>
        </button>
      )}

      {loading && <p className="text-text/40 text-sm mt-4">Cargando…</p>}

      {!loading && total === 0 && (
        <div className="mt-6 rounded-xl border border-text/10 px-5 py-8 text-center">
          <p className="font-display font-bold text-text text-lg">Todo al día</p>
          <p className="text-text/60 text-sm mt-1">No tienes ninguna tarea pendiente.</p>
          {onCrear && (
            <button
              type="button"
              onClick={onCrear}
              className="mt-4 rounded-full bg-brand text-brand-contrast font-display font-semibold text-sm px-4 py-2 hover:opacity-90"
            >
              Crear una tarea
            </button>
          )}
        </div>
      )}

      {grupos.map((grupo) => (
        <section key={grupo.clave} className="mt-5">
          <h2
            className={
              'font-mono text-xs uppercase tracking-wide font-semibold mb-2 ' +
              (grupo.urgente ? 'text-priority-urgente' : 'text-text/60')
            }
          >
            {grupo.titulo} ({grupo.tareas.length})
          </h2>
          <div className="space-y-2.5">
            {grupo.tareas.map((tarea) => (
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
        </section>
      ))}
    </main>
  )
}
