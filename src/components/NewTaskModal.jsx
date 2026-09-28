import { useRef, useState } from 'react'
import { CloseIcon } from './icons'
import { errorDeFecha, fechaRelativa, FECHA_MAXIMA, FECHA_MINIMA } from '../utils/fechas'

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

const CAMPO =
  'w-full mt-1 rounded-lg border border-surface-text/15 bg-white text-surface-text px-3 py-2 outline-none focus:border-brand'
const ETIQUETA = 'font-mono text-xs text-surface-text-muted uppercase tracking-wide'

// Plantillas: las tareas que mas se repiten en un taller de reparacion. Rellenan
// el titulo (con el nombre del cliente si la tarea viene de una reparacion) y
// dejan el cursor al final para completar el detalle.
const PLANTILLAS = [
  {
    etiqueta: 'Avisar que está listo',
    titulo: (cliente) => (cliente ? `Avisar a ${cliente}: su patinete está listo` : 'Avisar al cliente: su patinete está listo'),
  },
  { etiqueta: 'Pedir repuesto', titulo: () => 'Pedir repuesto: ' },
  { etiqueta: 'Llamar al cliente', titulo: (cliente) => (cliente ? `Llamar a ${cliente}` : 'Llamar al cliente: ') },
  { etiqueta: 'Enviar presupuesto', titulo: (cliente) => (cliente ? `Enviar presupuesto a ${cliente}` : 'Enviar presupuesto: ') },
]

// Atajos de fecha: lo normal en un taller es "hoy", "mañana" o sin fecha;
// solo "Otra" abre el selector de fecha.
const ATAJOS = [
  { modo: 'ninguna', etiqueta: 'Sin fecha' },
  { modo: 'hoy', etiqueta: 'Hoy' },
  { modo: 'manana', etiqueta: 'Mañana' },
  { modo: 'otra', etiqueta: 'Otra…' },
]

function modoInicial(fecha) {
  if (!fecha) return 'ninguna'
  if (fecha === fechaRelativa(0)) return 'hoy'
  if (fecha === fechaRelativa(1)) return 'manana'
  return 'otra'
}

// `prefill` (opcional) llega cuando el modal se abre desde "Generar tarea" en
// una reparacion activa (ver Tareas.jsx / RepairCard.jsx): trae el cliente
// ya vinculado y un titulo sugerido. El cliente no se puede cambiar desde
// aca a proposito -- si la tarea es sobre otro cliente, se crea sin
// prefill desde el boton normal de "Nueva tarea". `prefill.fecha` (
// "YYYY-MM-DD") llega cuando se abre desde el Calendario.
//
// Alta rapida: titulo + fecha + persona (por defecto, quien la crea) y un
// interruptor de "Urgente". Descripcion y las demas prioridades van
// plegadas en "Mas opciones". El contexto (taller/personal/familia) ya no se
// pregunta: el 100% de las tareas reales eran "taller".
export default function NewTaskModal({ usuarios, miId, onClose, onCreate, prefill }) {
  const [titulo, setTitulo] = useState(prefill?.titulo ?? '')
  const [descripcion, setDescripcion] = useState('')
  const [asignadoA, setAsignadoA] = useState(usuarios.some((u) => u.id === miId) ? miId : '')
  const [prioridad, setPrioridad] = useState(prefill?.prioridad ?? 'normal')
  const tituloRef = useRef(null)
  const [modoFecha, setModoFecha] = useState(modoInicial(prefill?.fecha))
  const [fechaOtra, setFechaOtra] = useState(modoInicial(prefill?.fecha) === 'otra' ? prefill.fecha : '')
  const [masOpciones, setMasOpciones] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  const fechaLimite = { ninguna: '', hoy: fechaRelativa(0), manana: fechaRelativa(1), otra: fechaOtra }[modoFecha]
  // Yo primero en la lista, para que lo comun sea un toque.
  const personas = [...usuarios].sort((a, b) => (b.id === miId) - (a.id === miId))

  function aplicarPlantilla(plantilla) {
    const texto = plantilla.titulo(prefill?.clienteNombre)
    setTitulo(texto)
    requestAnimationFrame(() => {
      tituloRef.current?.focus()
      tituloRef.current?.setSelectionRange(texto.length, texto.length)
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!titulo.trim()) return

    if (modoFecha === 'otra' && !fechaOtra) {
      setError('Elige una fecha o cambia a "Sin fecha".')
      return
    }
    const problemaFecha = errorDeFecha(fechaLimite)
    if (problemaFecha) {
      setError(problemaFecha)
      return
    }

    setEnviando(true)
    setError(null)
    const resultado = await onCreate({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      contexto: 'taller',
      asignadoA,
      prioridad,
      clientId: prefill?.clientId ?? null,
      clienteRef: prefill?.clienteRef ?? null,
      repairId: prefill?.repairId ?? null,
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
        className="w-full sm:max-w-md bg-surface text-surface-text rounded-t-3xl sm:rounded-xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg">Nueva tarea</h2>
          <button type="button" onClick={onClose} className="text-surface-text/50 hover:text-surface-text" aria-label="Cerrar">
            <CloseIcon size={20} />
          </button>
        </div>

        {prefill?.clienteNombre && (
          <p className="text-sm rounded-xl bg-brand/15 border border-brand/30 px-3 py-2 text-surface-text/80">
            Vinculada a <span className="font-semibold">{prefill.clienteNombre}</span>
          </p>
        )}

        <div>
          <label className={ETIQUETA}>¿Qué hay que hacer?</label>
          <input
            ref={tituloRef}
            autoFocus
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className={CAMPO}
            placeholder="ej. Llamar a Recambios Alcoy"
          />
          {/* Solo con el titulo vacio: al elegir una plantilla se rellena y
              las opciones desaparecen; borrar el titulo las devuelve. */}
          {!titulo.trim() && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PLANTILLAS.map((p) => (
                <button
                  key={p.etiqueta}
                  type="button"
                  onClick={() => aplicarPlantilla(p)}
                  className="px-3 py-1 rounded-full text-xs font-medium border border-surface-text/20 text-surface-text/70 hover:border-surface-text/40 hover:text-surface-text"
                >
                  {p.etiqueta}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className={ETIQUETA}>¿Para cuándo?</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {ATAJOS.map((a) => (
              <button
                key={a.modo}
                type="button"
                onClick={() => setModoFecha(a.modo)}
                className={
                  'px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ' +
                  (modoFecha === a.modo
                    ? 'bg-brand text-brand-contrast border-brand'
                    : 'border-surface-text/20 text-surface-text/70 hover:border-surface-text/40')
                }
              >
                {a.etiqueta}
              </button>
            ))}
          </div>
          {modoFecha === 'otra' && (
            <input
              type="date"
              min={FECHA_MINIMA}
              max={FECHA_MAXIMA}
              value={fechaOtra}
              onChange={(e) => setFechaOtra(e.target.value)}
              className={CAMPO}
              aria-label="Fecha límite"
            />
          )}
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1 min-w-0">
            <label className={ETIQUETA}>Asignar a</label>
            <select value={asignadoA} onChange={(e) => setAsignadoA(e.target.value)} className={CAMPO}>
              <option value="">Sin asignar (nadie recibe avisos)</option>
              {personas.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                  {u.id === miId ? ' (yo)' : ''}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setPrioridad(prioridad === 'urgente' ? 'normal' : 'urgente')}
            aria-pressed={prioridad === 'urgente'}
            className={
              'shrink-0 mb-px px-3.5 py-2 rounded-full text-sm font-semibold border transition-colors ' +
              (prioridad === 'urgente'
                ? 'bg-priority-urgente text-text border-priority-urgente'
                : 'border-surface-text/20 text-surface-text/70 hover:border-surface-text/40')
            }
          >
            Urgente
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMasOpciones(!masOpciones)}
          className="text-sm text-surface-text/60 hover:text-surface-text underline underline-offset-2"
        >
          {masOpciones ? 'Menos opciones' : 'Más opciones (descripción, otras prioridades)'}
        </button>

        {masOpciones && (
          <div className="space-y-4">
            <div>
              <label className={ETIQUETA}>Descripción (opcional)</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                className={CAMPO + ' resize-none'}
              />
            </div>
            <div>
              <label className={ETIQUETA}>Prioridad</label>
              <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)} className={CAMPO}>
                {PRIORIDADES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

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
