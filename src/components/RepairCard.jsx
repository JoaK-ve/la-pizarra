import { PlusIcon } from './icons'

const ESTADO_LABEL = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  terminado: 'Terminado',
}

export default function RepairCard({ reparacion, puedeCrear, onCrearTarea }) {
  const patin = [reparacion.scooter_brand_snapshot, reparacion.scooter_model_snapshot].filter(Boolean).join(' ')

  return (
    <div className="rounded-2xl bg-paper text-ink p-4 flex gap-3 items-start shadow-sm">
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold leading-snug">
          {reparacion.client_name_snapshot || 'Cliente sin nombre'}
        </p>
        {reparacion.client_phone_snapshot && (
          <p className="text-sm text-ink/60 mt-0.5">📱 {reparacion.client_phone_snapshot}</p>
        )}
        {reparacion.client_problem && <p className="text-sm text-ink/70 mt-1">{reparacion.client_problem}</p>}

        <div className="flex flex-wrap items-center gap-1.5 mt-2 font-mono text-[11px] uppercase tracking-wide">
          {patin && <span className="px-2 py-0.5 rounded-full bg-ink/10 text-ink/70">{patin}</span>}
          <span className="px-2 py-0.5 rounded-full bg-ink/10 text-ink/70">
            {ESTADO_LABEL[reparacion.status] ?? reparacion.status}
          </span>
          {reparacion.reception_date && (
            <span className="px-2 py-0.5 rounded-full bg-ink/10 text-ink/70">
              Recibido {new Date(reparacion.reception_date).toLocaleDateString('es-ES')}
            </span>
          )}
        </div>
      </div>

      {puedeCrear && (
        <button
          type="button"
          onClick={() => onCrearTarea(reparacion)}
          className="shrink-0 flex items-center gap-1 rounded-full bg-amber text-bg text-xs font-display font-semibold px-3 py-1.5 hover:opacity-90"
        >
          <PlusIcon size={14} />
          Tarea
        </button>
      )}
    </div>
  )
}
