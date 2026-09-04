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

const ESTADO_REPARACION_LABEL = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  terminado: 'Terminado',
}

// Tratamiento del contenedor por prioridad -- jerarquia por intensidad
// (v2 del diseño, 2026-09-05): lo urgente salta a la vista con sombra dura,
// lo demas se calma. "nuevo" (La Secre) no esta en la especificacion --
// usa el mismo tratamiento neutro que "normal".
const TRATAMIENTO_PRIORIDAD = {
  urgente: 'border-2 border-priority-urgente shadow-[4px_4px_0_var(--color-priority-urgente)]',
  seguimiento: 'border border-surface-text/10 border-l-4 border-l-priority-seguimiento',
  normal: 'border border-surface-text/10',
  baja: 'border border-surface-text/10 border-dashed opacity-75',
  nuevo: 'border border-surface-text/10',
}

export default function TaskCard({ tarea, usuariosPorId, reparacionesPorCliente, notaCount, onCircleClick, onAbrirDetalle }) {
  const hecha = tarea.estado === 'hecho'
  const asignado = tarea.asignado_a ? usuariosPorId.get(tarea.asignado_a) : null
  // Contexto real del taller (cliente + reparacion activa, si tiene) --
  // viene de WheelOS via useReparacionesClientes. Solo existe cuando la
  // tarea tiene client_id (hoy, sobre todo las que crea La Secre).
  const contexto = tarea.client_id ? reparacionesPorCliente?.get(tarea.client_id) : null
  const conPunto = tarea.prioridad === 'normal' || tarea.prioridad === 'baja'

  return (
    <div
      className={
        'rounded-2xl bg-surface text-surface-text p-4 flex gap-3 items-start shadow-sm transition-colors hover:border-surface-text/30 ' +
        (TRATAMIENTO_PRIORIDAD[tarea.prioridad] ?? TRATAMIENTO_PRIORIDAD.normal) +
        (hecha ? ' opacity-45' : '')
      }
    >
      <button
        type="button"
        onClick={() => onCircleClick(tarea)}
        aria-label={hecha ? 'Marcar como pendiente' : 'Marcar como hecha'}
        // El color de fondo/borde va por estilo en linea (no por clase de
        // Tailwind) a proposito: `bg-[--variable]` no genera ninguna regla
        // en este proyecto (se confirmo mirando el color calculado real en
        // el navegador -- quedaba transparente). Verde de marca, no el de
        // prioridad "nuevo" -- marcar hecha es una accion, no un dato.
        style={hecha ? { backgroundColor: 'var(--color-brand)', borderColor: 'var(--color-brand)' } : undefined}
        className={
          'mt-0.5 w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ' +
          (hecha ? 'text-brand-contrast' : 'border-surface-text/30 text-transparent hover:border-surface-text/60')
        }
      >
        <CheckIcon size={14} />
      </button>

      {/* Tocar el contenido (no el circulo) abre el detalle con la
          bitacora completa -- el circulo queda dedicado solo a
          marcar/reabrir, sin ambiguedad de que hace cada toque. */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onAbrirDetalle(tarea)}>
        <div className="flex items-start justify-between gap-2">
          <p className={'flex items-center gap-1.5 font-display font-semibold leading-snug ' + (hecha ? 'line-through' : '')}>
            {conPunto && (
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: `var(--color-priority-${tarea.prioridad})` }}
              />
            )}
            {tarea.titulo}
          </p>
          {tarea.tiene_foto && (
            <span title="Tiene foto adjunta" className="shrink-0 text-surface-text/50 mt-0.5">
              <CameraIcon size={16} />
            </span>
          )}
        </div>

        {tarea.descripcion && <p className="text-sm text-surface-text/70 mt-1">{tarea.descripcion}</p>}

        <div className="flex flex-wrap items-center gap-1.5 mt-2 font-mono text-[11px] uppercase tracking-wide">
          <span
            className="px-2 py-0.5 rounded-full text-text"
            style={{ backgroundColor: `var(--color-priority-${tarea.prioridad})` }}
          >
            {PRIORIDAD_LABEL[tarea.prioridad] ?? tarea.prioridad}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-surface-text/10 text-surface-text/70">
            {CONTEXTO_LABEL[tarea.contexto] ?? tarea.contexto}
          </span>
          {tarea.origen === 'secre' && (
            <span className="px-2 py-0.5 rounded-full bg-brand/20 text-brand flex items-center gap-1">
              <SparkleIcon size={11} /> La Secre
            </span>
          )}
          {asignado && <span className="px-2 py-0.5 rounded-full bg-surface-text/10 text-surface-text/70">{asignado.full_name}</span>}
          {notaCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-surface-text/10 text-surface-text/70">💬 {notaCount}</span>
          )}
        </div>

        {contexto && (
          <div className="mt-2 pt-2 border-t border-surface-text/10 text-xs text-surface-text/60 space-y-0.5">
            {contexto.cliente && (
              <p className="font-medium text-surface-text/80">
                {[contexto.cliente.first_name, contexto.cliente.last_name].filter(Boolean).join(' ')}
                {contexto.cliente.phone && ` · 📱 ${contexto.cliente.phone}`}
              </p>
            )}
            {contexto.reparacion && (
              <p>
                {[contexto.reparacion.scooter_brand_snapshot, contexto.reparacion.scooter_model_snapshot]
                  .filter(Boolean)
                  .join(' ') || 'Patín sin marca/modelo registrado'}
                {' · '}
                {ESTADO_REPARACION_LABEL[contexto.reparacion.status] ?? contexto.reparacion.status}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
