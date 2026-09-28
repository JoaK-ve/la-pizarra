import { useState } from 'react'
import BotonesContacto from './BotonesContacto'
import { PlusIcon } from './icons'

const VISIBLES_AL_INICIO = 5

const TEXTO_TIPO = {
  terminado: (dias) => `Terminada hace ${dias} ${dias === 1 ? 'día' : 'días'} y sin recoger`,
  parada: (dias) => `Sin movimiento hace ${dias} ${dias === 1 ? 'día' : 'días'}`,
}

// Reparaciones que llevan demasiado tiempo sin moverse (umbrales del propio
// taller, ver utils/atencion.js), con un toque para avisar al cliente o
// crear la tarea ya preparada.
export default function NecesitaAtencion({ items, puedeCrear, onCrearTarea }) {
  const [verTodas, setVerTodas] = useState(false)
  if (items.length === 0) return null

  const visibles = verTodas ? items : items.slice(0, VISIBLES_AL_INICIO)

  return (
    <section className="rounded-xl border border-text/15 bg-text/5 p-4">
      <h2 className="font-display font-bold text-text text-sm">
        Necesitan atención ({items.length})
      </h2>
      <p className="text-xs text-text/60 mt-0.5">
        Reparaciones que llevan más días quietas de lo que tu taller tiene configurado en WheelOS.
      </p>

      <div className="mt-3 space-y-2">
        {visibles.map(({ tipo, dias, reparacion }) => {
          const patin = [reparacion.scooter_brand_snapshot, reparacion.scooter_model_snapshot].filter(Boolean).join(' ')
          return (
            <div key={reparacion.id} className="rounded-xl bg-surface text-surface-text p-3 flex gap-3 items-start">
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold leading-snug">
                  {reparacion.client_name_snapshot || 'Cliente sin nombre'}
                  {patin && <span className="font-normal text-surface-text/70"> · {patin}</span>}
                </p>
                <p
                  className={
                    'text-xs font-semibold mt-0.5 ' +
                    (tipo === 'terminado' ? 'text-priority-urgente' : 'text-surface-text/60')
                  }
                >
                  {TEXTO_TIPO[tipo](dias)}
                </p>
                <BotonesContacto telefono={reparacion.client_phone_snapshot} className="mt-2" />
              </div>
              {puedeCrear && (
                <button
                  type="button"
                  onClick={() => onCrearTarea({ tipo, dias, reparacion })}
                  className="shrink-0 flex items-center gap-1 rounded-lg bg-brand text-brand-contrast text-sm font-semibold px-3 py-1.5 hover:opacity-90"
                >
                  <PlusIcon size={14} />
                  Crear tarea
                </button>
              )}
            </div>
          )
        })}
      </div>

      {items.length > VISIBLES_AL_INICIO && (
        <button
          type="button"
          onClick={() => setVerTodas(!verTodas)}
          className="mt-3 text-sm text-text/70 hover:text-text underline underline-offset-2"
        >
          {verTodas ? 'Ver menos' : `Ver las ${items.length - VISIBLES_AL_INICIO} restantes`}
        </button>
      )}
    </section>
  )
}
