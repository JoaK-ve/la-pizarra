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

export default function TaskCard({ tarea, usuariosPorId, reparacionesPorCliente, onToggleHecho }) {
  const hecha = tarea.estado === 'hecho'
  const asignado = tarea.asignado_a ? usuariosPorId.get(tarea.asignado_a) : null
  // Contexto real del taller (cliente + reparacion activa, si tiene) --
  // viene de WheelOS via useReparacionesClientes. Solo existe cuando la
  // tarea tiene client_id (hoy, sobre todo las que crea La Secre).
  const contexto = tarea.client_id ? reparacionesPorCliente?.get(tarea.client_id) : null

  return (
    // El circulo de marcar hecha queda SIEMPRE a opacidad completa (ver
    // abajo), aunque la tarea este hecha -- si se atenuaba junto con el
    // resto de la tarjeta, se perdia visualmente y no quedaba claro que
    // seguia siendo el boton para reabrirla. Solo se atenua el contenido
    // de texto (titulo, descripcion, etiquetas), no la tarjeta entera.
    <div className="rounded-2xl bg-paper text-ink p-4 flex gap-3 items-start shadow-sm">
      <button
        type="button"
        onClick={() => onToggleHecho(tarea)}
        aria-label={hecha ? 'Marcar como pendiente' : 'Marcar como hecha'}
        // El color de fondo/borde va por estilo en linea (no por clase de
        // Tailwind) a proposito: `bg-[--variable]` no genera ninguna regla
        // en este proyecto (se confirmo mirando el color calculado real en
        // el navegador -- quedaba transparente), asi que el circulo de
        // "hecha" era invisible desde siempre. Mismo patron que ya usa la
        // etiqueta de prioridad mas abajo, que si funciona.
        style={hecha ? { backgroundColor: 'var(--color-prioridad-nuevo)', borderColor: 'var(--color-prioridad-nuevo)' } : undefined}
        className={
          'mt-0.5 w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ' +
          (hecha ? 'text-paper' : 'border-ink/30 text-transparent hover:border-ink/60')
        }
      >
        <CheckIcon size={14} />
      </button>

      <div className={'flex-1 min-w-0 ' + (hecha ? 'opacity-50' : '')}>
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

        {contexto && (
          <div className="mt-2 pt-2 border-t border-ink/10 text-xs text-ink/60 space-y-0.5">
            {contexto.cliente && (
              <p className="font-medium text-ink/80">
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
