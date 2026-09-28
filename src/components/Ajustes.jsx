import { useState } from 'react'
import { HORAS_RESUMEN, usePreferencias } from '../hooks/usePreferencias'
import { useAvisoPrueba } from '../hooks/useAvisoPrueba'
import { BellIcon, CloseIcon, SendIcon } from './icons'

const ETIQUETA = 'font-mono text-xs text-surface-text-muted uppercase tracking-wide'

function Interruptor({ activo, deshabilitado, onCambiar, etiqueta }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      disabled={deshabilitado}
      onClick={() => onCambiar(!activo)}
      className={
        'relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 ' +
        (activo ? 'bg-brand' : 'bg-surface-text/25')
      }
    >
      <span
        className={
          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ' +
          (activo ? 'translate-x-5' : '')
        }
      />
    </button>
  )
}

function Fila({ titulo, descripcion, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-surface-text/10 last:border-b-0">
      <div className="min-w-0">
        <p className="font-semibold text-sm">{titulo}</p>
        {descripcion && <p className="text-xs text-surface-text/60 mt-0.5">{descripcion}</p>}
      </div>
      {children}
    </div>
  )
}

// Estado de las notificaciones push EN ESTE DISPOSITIVO (cada navegador o
// movil se activa por separado) y boton para activarlas.
function EstadoPush({ push }) {
  if (!push.soportado) {
    return (
      <p className="text-sm text-surface-text/70">
        Este navegador no admite notificaciones. En iPhone, primero añade La Pizarra a la pantalla de inicio
        (Compartir → Añadir a pantalla de inicio).
      </p>
    )
  }
  if (push.permiso === 'denied') {
    return (
      <p className="text-sm text-surface-text/70">
        Las notificaciones están bloqueadas en este navegador. Para activarlas, cambia el permiso del sitio en los
        ajustes del navegador.
      </p>
    )
  }
  if (push.permiso === 'granted' && !push.error) {
    return <p className="text-sm text-surface-text/70">Activadas en este dispositivo.</p>
  }
  return (
    <div className="space-y-2">
      {push.error && <p className="text-sm text-priority-urgente">No se pudieron activar: {push.error}</p>}
      <button
        type="button"
        onClick={push.activar}
        disabled={push.activando}
        className="inline-flex items-center gap-1.5 rounded-full bg-brand text-brand-contrast font-display font-semibold text-sm px-4 py-2 disabled:opacity-50"
      >
        <BellIcon size={16} />
        {push.error ? 'Reintentar' : 'Activar notificaciones en este dispositivo'}
      </button>
    </div>
  )
}

// Ajustes de avisos de cada persona: que recibe, a que hora, y una prueba
// para comprobar que le llegan.
export default function Ajustes({ push, onClose }) {
  const { preferencias, loading, error, guardar } = usePreferencias()
  const prueba = useAvisoPrueba()
  const [errorGuardado, setErrorGuardado] = useState(null)

  async function cambiar(cambios) {
    const resultado = await guardar(cambios)
    setErrorGuardado(resultado.ok ? null : `No se pudo guardar el cambio: ${resultado.message}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-surface text-surface-text rounded-t-3xl sm:rounded-xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg">Ajustes de avisos</h2>
          <button type="button" onClick={onClose} className="text-surface-text/50 hover:text-surface-text" aria-label="Cerrar">
            <CloseIcon size={20} />
          </button>
        </div>

        <section className="mt-5">
          <p className={ETIQUETA}>Notificaciones en este dispositivo</p>
          <div className="mt-2">
            <EstadoPush push={push} />
          </div>
        </section>

        <section className="mt-6">
          <p className={ETIQUETA}>Qué quiero recibir</p>
          {loading ? (
            <p className="mt-3 text-sm text-surface-text/50">Cargando…</p>
          ) : (
            <div className="mt-1">
              <Fila titulo="Resumen diario por correo" descripcion="Tus tareas vencidas, de hoy y de mañana, en un solo correo.">
                <Interruptor
                  activo={preferencias.resumen_email}
                  onCambiar={(v) => cambiar({ resumen_email: v })}
                  etiqueta="Resumen diario por correo"
                />
              </Fila>

              <Fila titulo="Hora del resumen" descripcion="Hora de España peninsular.">
                <select
                  value={preferencias.resumen_hora}
                  disabled={!preferencias.resumen_email}
                  onChange={(e) => cambiar({ resumen_hora: Number(e.target.value) })}
                  className="shrink-0 rounded-lg border border-surface-text/15 bg-white text-surface-text px-2 py-1.5 text-sm outline-none focus:border-brand disabled:opacity-50"
                  aria-label="Hora del resumen"
                >
                  {HORAS_RESUMEN.map((hora) => (
                    <option key={hora} value={hora}>
                      {String(hora).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </Fila>

              <Fila titulo="Aviso push de vencimientos" descripcion="24 horas antes y el mismo día en que vence una tarea tuya.">
                <Interruptor
                  activo={preferencias.push_vencimiento}
                  onCambiar={(v) => cambiar({ push_vencimiento: v })}
                  etiqueta="Aviso push de vencimientos"
                />
              </Fila>

              <Fila titulo="Cuando me asignan una tarea" descripcion="Aviso al momento, por push y por correo.">
                <Interruptor
                  activo={preferencias.aviso_asignacion}
                  onCambiar={(v) => cambiar({ aviso_asignacion: v })}
                  etiqueta="Aviso cuando me asignan una tarea"
                />
              </Fila>
            </div>
          )}
          {(errorGuardado || error) && (
            <p className="mt-2 text-sm text-priority-urgente">{errorGuardado ?? `No se pudieron cargar tus ajustes: ${error}`}</p>
          )}
        </section>

        <section className="mt-6">
          <p className={ETIQUETA}>Comprobar que funciona</p>
          <button
            type="button"
            onClick={prueba.enviar}
            disabled={prueba.enviando}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-surface-text/25 font-display font-semibold text-sm px-4 py-2 hover:bg-surface-text/5 disabled:opacity-50"
          >
            <SendIcon size={16} />
            {prueba.enviando ? 'Enviando…' : 'Enviarme un aviso de prueba'}
          </button>
          {prueba.lineas && (
            <div className="mt-3 rounded-xl bg-surface-text/5 px-3 py-2.5 text-sm space-y-0.5">
              {prueba.lineas.map((linea) => (
                <p key={linea}>{linea}</p>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
