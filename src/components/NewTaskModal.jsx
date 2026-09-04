import { useState } from 'react'
import { CloseIcon } from './icons'

// "nuevo" no se ofrece aca a proposito: ese valor de prioridad es el que usa
// La Secre para marcar "llegó hoy/reciente" en tareas que ella genera. Las
// tareas manuales siguen usando normal/baja como antes (confirmado en
// decisiones-rls-tareas.md, seccion 2).
const PRIORIDADES = [
  { value: 'urgente', label: 'Urgente' },
  { value: 'seguimiento', label: 'Seguimiento' },
  { value: 'normal', label: 'Normal' },
  { value: 'baja', label: 'Baja' },
]

const CONTEXTOS = [
  { value: 'taller', label: 'Taller' },
  { value: 'personal', label: 'Personal' },
  { value: 'familia', label: 'Familia' },
]

// `prefill` (opcional) llega cuando el modal se abre desde "Crear tarea" en
// una reparacion activa (ver Tareas.jsx / RepairCard.jsx): trae el cliente
// ya vinculado y un titulo sugerido. El cliente no se puede cambiar desde
// aca a proposito -- si la tarea es sobre otro cliente, se crea sin
// prefill desde el boton normal de "Nueva tarea". `prefill.fecha` (
// "YYYY-MM-DD") llega cuando se abre desde el Calendario -- ver
// Calendario.jsx / Tareas.jsx.
export default function NewTaskModal({ usuarios, onClose, onCreate, prefill }) {
  const [titulo, setTitulo] = useState(prefill?.titulo ?? '')
  const [descripcion, setDescripcion] = useState('')
  const [contexto, setContexto] = useState('taller')
  const [asignadoA, setAsignadoA] = useState('')
  const [prioridad, setPrioridad] = useState('normal')
  const [fechaLimite, setFechaLimite] = useState(prefill?.fecha ?? '')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!titulo.trim()) return

    setEnviando(true)
    setError(null)
    const resultado = await onCreate({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      contexto,
      asignadoA,
      prioridad,
      clientId: prefill?.clientId ?? null,
      clienteRef: prefill?.clienteRef ?? null,
      fechaLimite: fechaLimite || null,
    })
    setEnviando(false)

    if (!resultado.ok) {
      setError(resultado.message)
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full sm:max-w-md bg-surface text-surface-text rounded-t-3xl sm:rounded-xl p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg">Nueva tarea</h2>
          <button type="button" onClick={onClose} className="text-surface-text/50 hover:text-surface-text">
            <CloseIcon size={20} />
          </button>
        </div>

        {prefill?.clienteNombre && (
          <p className="text-sm rounded-xl bg-brand/15 border border-brand/30 px-3 py-2 text-surface-text/80">
            Vinculada a <span className="font-semibold">{prefill.clienteNombre}</span>
          </p>
        )}

        <div>
          <label className="font-mono text-xs text-surface-text-muted uppercase tracking-wide">Título</label>
          <input
            autoFocus
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full mt-1 rounded-lg border border-surface-text/15 bg-white text-surface-text px-3 py-2 outline-none focus:border-brand"
            placeholder="ej. Llamar a Recambios Alcoy"
          />
        </div>

        <div>
          <label className="font-mono text-xs text-surface-text-muted uppercase tracking-wide">Descripción (opcional)</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={2}
            className="w-full mt-1 rounded-lg border border-surface-text/15 bg-white text-surface-text px-3 py-2 outline-none focus:border-brand resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-mono text-xs text-surface-text-muted uppercase tracking-wide">Contexto</label>
            <select
              value={contexto}
              onChange={(e) => setContexto(e.target.value)}
              className="w-full mt-1 rounded-lg border border-surface-text/15 bg-white text-surface-text px-3 py-2 outline-none focus:border-brand"
            >
              {CONTEXTOS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-mono text-xs text-surface-text-muted uppercase tracking-wide">Prioridad</label>
            <select
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value)}
              className="w-full mt-1 rounded-lg border border-surface-text/15 bg-white text-surface-text px-3 py-2 outline-none focus:border-brand"
            >
              {PRIORIDADES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="font-mono text-xs text-surface-text-muted uppercase tracking-wide">Fecha (opcional)</label>
          <input
            type="date"
            value={fechaLimite}
            onChange={(e) => setFechaLimite(e.target.value)}
            className="w-full mt-1 rounded-lg border border-surface-text/15 bg-white text-surface-text px-3 py-2 outline-none focus:border-brand"
          />
          <p className="text-xs text-surface-text-muted mt-1">Para que aparezca en el Calendario -- deadline o cita.</p>
        </div>

        <div>
          <label className="font-mono text-xs text-surface-text-muted uppercase tracking-wide">Asignar a (opcional)</label>
          <select
            value={asignadoA}
            onChange={(e) => setAsignadoA(e.target.value)}
            className="w-full mt-1 rounded-lg border border-surface-text/15 bg-white text-surface-text px-3 py-2 outline-none focus:border-brand"
          >
            <option value="">Sin asignar (visible a todos)</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-priority-urgente">{error}</p>}

        <button
          type="submit"
          disabled={enviando || !titulo.trim()}
          className="w-full rounded-xl bg-brand text-brand-contrast font-display font-semibold py-2.5 disabled:opacity-50"
        >
          {enviando ? 'Creando…' : 'Crear tarea'}
        </button>
      </form>
    </div>
  )
}
