import { CameraIcon, CheckIcon, SparkleIcon } from './icons'

const PRIORIDAD_LABEL = {
  urgente: 'Urgente',
  seguimiento: 'Seguimiento',
  normal: 'Normal',
  baja: 'Baja',
  nuevo: 'Nuevo',
}

const CONTEXTO_LABEL = {
  taller: 'Taller',
  personal: 'Personal',
  familia: 'Familia',
}

export default function TaskCard({ tarea, usuariosPorId, onToggleHecho }) {
  const hecha = tarea.estado === 'hecho'
  const asignado = tarea.asignado_a ? usuariosPorId.get(tarea.asignado_a) : null

  return (
    <div
      className={
        'rounded-2xl bg-paper text-ink p-4 flex gap-3 items-start shadow-sm ' +
        (hecha ? 'opacity-50' : '')
      }
    >
      <button
        type="button"
        onClick={() => onToggleHecho(tarea)}
        aria-label={hecha ? 'Marcar como pendiente' : 'Marcar como hecha'}
        className={
          'mt-0.5 w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ' +
          (hecha ? 'bg-[--color-prioridad-nuevo] border-[--color-prioridad-nuevo] text-paper' : 'border-ink/30 text-transparent hover:border-ink/60')
        }
      >
        <CheckIcon size={14} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={'font-display font-semibold leading-snug ' + (hecha ? 'line-through' : '')}>
            {tarea.titulo}
          </p>
          {tarea.tiene_foto && (
            <span title="Tiene foto adjunta" className="shrink-0 text-ink/50 mt-0.5">
              <CameraIcon size={16} />
            </span>
          )}
        </div>

        {tarea.descripcion && <p className="text-sm text-ink/70 mt-1">{tarea.descripcion}</p>}

        <div className="flex flex-wrap items-center gap-1.5 mt-2 font-mono text-[11px] uppercase tracking-wide">
          <span
            className="px-2 py-0.5 rounded-full text-paper"
            style={{ backgroundColor: `var(--color-prioridad-${tarea.prioridad})` }}
          >
            {PRIORIDAD_LABEL[tarea.prioridad] ?? tarea.prioridad}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-ink/10 text-ink/70">
            {CONTEXTO_LABEL[tarea.contexto] ?? tarea.contexto}
          </span>
          {tarea.origen === 'secre' && (
            <span className="px-2 py-0.5 rounded-full bg-amber/20 text-amber flex items-center gap-1">
              <SparkleIcon size={11} /> La Secre
            </span>
          )}
          {asignado && <span className="px-2 py-0.5 rounded-full bg-ink/10 text-ink/70">{asignado.full_name}</span>}
        </div>
      </div>
    </div>
  )
}
