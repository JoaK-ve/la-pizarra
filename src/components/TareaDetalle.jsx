import { useState } from 'react'
import { useTareaNotas } from '../hooks/useTareaNotas'
import { errorDeFecha, FECHA_MAXIMA, FECHA_MINIMA, soloFecha } from '../utils/fechas'
import { CloseIcon, PencilIcon, TrashIcon } from './icons'
import BotonesContacto from './BotonesContacto'

const ESTADO_REPARACION = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  terminado: 'Terminado',
  entregado: 'Entregado',
}

const PRIORIDADES = [
  { value: 'urgente', label: 'Urgente' },
  { value: 'seguimiento', label: 'Seguimiento' },
  { value: 'normal', label: 'Normal' },
  { value: 'baja', label: 'Baja' },
]

const CAMPO =
  'w-full mt-1 rounded-lg border border-surface-text/15 bg-white text-surface-text px-3 py-2 outline-none focus:border-brand'
const ETIQUETA = 'font-mono text-xs text-surface-text-muted uppercase tracking-wide'

// Parsea "YYYY-MM-DD" a mano (no `new Date(string)`) para no depender de
// como el navegador interprete la zona horaria de un string ISO.
function formatearFechaLegible(fechaLimite) {
  const [y, m, d] = soloFecha(fechaLimite).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
}

// Se abre al tocar el CONTENIDO de una tarjeta de tarea (no el circulo).
// Muestra la bitacora completa y deja agregar una nota nueva en cualquier
// momento, este la tarea pendiente o hecha -- no hace falta cerrarla para
// dejar constancia de que "pedi la pieza" o "llame al cliente". Desde aqui
// tambien se edita y se borra la tarea (RLS decide quien puede: creador,
// asignado o admin/owner para editar; creador o admin/owner para borrar).
export default function TareaDetalle({
  tarea,
  usuarios,
  contextoCliente,
  puedeEditar,
  onClose,
  onNotaAgregada,
  onGuardar,
  onBorrar,
}) {
  const { notas, loading, agregarNota } = useTareaNotas(tarea.id)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const [errorBorrado, setErrorBorrado] = useState(null)

  async function handleAgregar(e) {
    e.preventDefault()
    if (!texto.trim()) return
    setEnviando(true)
    const resultado = await agregarNota(texto)
    setEnviando(false)
    if (resultado.ok) {
      setTexto('')
      onNotaAgregada?.()
    }
  }

  async function guardar(campos) {
    const resultado = await onGuardar(tarea.id, campos)
    if (resultado.ok) setEditando(false)
    return resultado
  }

  async function borrar() {
    const resultado = await onBorrar(tarea.id)
    if (resultado.ok) onClose()
    return resultado
  }

  // Borrado directo desde el detalle (icono de papelera), sin pasar por el
  // modo edicion.
  async function confirmarBorrado() {
    setBorrando(true)
    setErrorBorrado(null)
    const resultado = await borrar()
    setBorrando(false)
    if (!resultado.ok) {
      setErrorBorrado(resultado.message)
      setConfirmandoBorrado(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-surface text-surface-text rounded-t-3xl sm:rounded-xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {editando ? (
          <FormularioEdicion
            tarea={tarea}
            usuarios={usuarios}
            onCancelar={() => setEditando(false)}
            onGuardar={guardar}
            onBorrar={borrar}
          />
        ) : (
          <>
            <div className="flex items-start justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <h2 className="font-display font-bold text-lg leading-snug">{tarea.titulo}</h2>
                {tarea.descripcion && <p className="text-sm text-surface-text/60 mt-1">{tarea.descripcion}</p>}
                {tarea.fecha_limite && (
                  <p className={ETIQUETA + ' mt-1.5'}>📅 {formatearFechaLegible(tarea.fecha_limite)}</p>
                )}
                {contextoCliente?.cliente && (
                  <div className="mt-3 rounded-xl bg-surface-text/5 px-3 py-2.5 text-sm space-y-1.5">
                    <p className="font-semibold">
                      {[contextoCliente.cliente.first_name, contextoCliente.cliente.last_name].filter(Boolean).join(' ')}
                      {contextoCliente.cliente.phone && (
                        <span className="font-normal text-surface-text/70"> · {contextoCliente.cliente.phone}</span>
                      )}
                    </p>
                    <BotonesContacto telefono={contextoCliente.cliente.phone} />
                    {contextoCliente.reparacion && (
                      <p className="text-surface-text/70">
                        {[contextoCliente.reparacion.scooter_brand_snapshot, contextoCliente.reparacion.scooter_model_snapshot]
                          .filter(Boolean)
                          .join(' ') || 'Patinete sin marca/modelo'}
                        {' · '}
                        {ESTADO_REPARACION[contextoCliente.reparacion.status] ?? contextoCliente.reparacion.status}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {puedeEditar && (
                  <button
                    type="button"
                    onClick={() => setConfirmandoBorrado(true)}
                    className="text-surface-text/50 hover:text-priority-urgente"
                    aria-label="Borrar tarea"
                    title="Borrar tarea"
                  >
                    <TrashIcon size={19} />
                  </button>
                )}
                {puedeEditar && (
                  <button
                    type="button"
                    onClick={() => setEditando(true)}
                    className="text-surface-text/50 hover:text-surface-text"
                    aria-label="Editar tarea"
                    title="Editar tarea"
                  >
                    <PencilIcon size={19} />
                  </button>
                )}
                <button type="button" onClick={onClose} className="text-surface-text/50 hover:text-surface-text" aria-label="Cerrar">
                  <CloseIcon size={20} />
                </button>
              </div>
            </div>

            {confirmandoBorrado && (
              <div className="mt-3 shrink-0 rounded-xl border border-priority-urgente/40 bg-priority-urgente/10 px-3 py-2.5 text-sm">
                <p className="text-surface-text">¿Borrar esta tarea con todas sus notas? No se puede deshacer.</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmandoBorrado(false)}
                    disabled={borrando}
                    className="flex-1 rounded-lg border border-surface-text/20 py-1.5 font-semibold"
                  >
                    No, conservar
                  </button>
                  <button
                    type="button"
                    onClick={confirmarBorrado}
                    disabled={borrando}
                    className="flex-1 rounded-lg bg-priority-urgente text-text py-1.5 font-semibold disabled:opacity-50"
                  >
                    {borrando ? 'Borrando…' : 'Sí, borrar'}
                  </button>
                </div>
              </div>
            )}
            {errorBorrado && <p className="mt-3 shrink-0 text-sm text-priority-urgente">{errorBorrado}</p>}

            <div className="mt-4 pt-3 border-t border-surface-text/10 flex-1 overflow-y-auto space-y-3">
              <p className={ETIQUETA}>Bitácora</p>
              {loading && <p className="text-sm text-surface-text/40">Cargando…</p>}
              {!loading && notas.length === 0 && <p className="text-sm text-surface-text/40">Sin notas todavía.</p>}
              {notas.map((nota) => (
                <div key={nota.id} className="text-sm">
                  <p className="text-surface-text/40 text-xs font-mono">
                    {new Date(nota.created_at).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' · '}
                    {nota.autor?.full_name?.split(' ')[0] ?? 'Alguien'}
                  </p>
                  <p className="text-surface-text/90 mt-0.5">{nota.texto}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAgregar} className="mt-4 pt-3 border-t border-surface-text/10 flex gap-2 shrink-0">
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Agregar una nota…"
                className="flex-1 min-w-0 rounded-lg border border-surface-text/15 bg-white text-surface-text px-3 py-2 outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={enviando || !texto.trim()}
                className="shrink-0 rounded-xl bg-brand text-brand-contrast font-display font-semibold px-4 py-2 disabled:opacity-50"
              >
                {enviando ? '…' : 'Agregar'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function FormularioEdicion({ tarea, usuarios, onCancelar, onGuardar, onBorrar }) {
  const [titulo, setTitulo] = useState(tarea.titulo)
  const [descripcion, setDescripcion] = useState(tarea.descripcion ?? '')
  const [prioridad, setPrioridad] = useState(tarea.prioridad)
  const [fechaLimite, setFechaLimite] = useState(soloFecha(tarea.fecha_limite) ?? '')
  const [asignadoA, setAsignadoA] = useState(tarea.asignado_a ?? '')
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState(null)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)

  // "nuevo" lo pone La Secre y no se ofrece al crear a mano, pero si la
  // tarea ya lo tiene hay que poder verlo en el selector, o editarla lo
  // cambiaria sin querer.
  const prioridades = tarea.prioridad === 'nuevo' ? [...PRIORIDADES, { value: 'nuevo', label: 'Nuevo' }] : PRIORIDADES

  async function guardar(e) {
    e.preventDefault()
    if (!titulo.trim()) return
    const problemaFecha = errorDeFecha(fechaLimite)
    if (problemaFecha) {
      setError(problemaFecha)
      return
    }
    setTrabajando(true)
    setError(null)
    const resultado = await onGuardar({ titulo: titulo.trim(), descripcion: descripcion.trim(), prioridad, fechaLimite, asignadoA })
    setTrabajando(false)
    if (!resultado.ok) setError(resultado.message)
  }

  async function borrar() {
    setTrabajando(true)
    setError(null)
    const resultado = await onBorrar()
    setTrabajando(false)
    if (!resultado.ok) {
      setError(resultado.message)
      setConfirmandoBorrado(false)
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col min-h-0">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="font-display font-bold text-lg">Editar tarea</h2>
        <button type="button" onClick={onCancelar} className="text-surface-text/50 hover:text-surface-text" aria-label="Cancelar edición">
          <CloseIcon size={20} />
        </button>
      </div>

      <div className="mt-4 space-y-4 overflow-y-auto">
        <div>
          <label className={ETIQUETA}>Título</label>
          <input autoFocus required value={titulo} onChange={(e) => setTitulo(e.target.value)} className={CAMPO} />
        </div>

        <div>
          <label className={ETIQUETA}>Descripción (opcional)</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            className={CAMPO + ' resize-none'}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={ETIQUETA}>Prioridad</label>
            <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)} className={CAMPO}>
              {prioridades.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={ETIQUETA}>Fecha límite</label>
            <input
              type="date"
              min={FECHA_MINIMA}
              max={FECHA_MAXIMA}
              value={fechaLimite}
              onChange={(e) => setFechaLimite(e.target.value)}
              className={CAMPO}
            />
          </div>
        </div>

        <div>
          <label className={ETIQUETA}>Asignada a</label>
          <select value={asignadoA} onChange={(e) => setAsignadoA(e.target.value)} className={CAMPO}>
            <option value="">Sin asignar (no recibe avisos nadie)</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-priority-urgente">{error}</p>}
      </div>

      <div className="mt-5 shrink-0 space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancelar}
            disabled={trabajando}
            className="flex-1 rounded-xl border border-surface-text/20 text-surface-text font-display font-semibold py-2.5 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={trabajando || !titulo.trim()}
            className="flex-1 rounded-xl bg-brand text-brand-contrast font-display font-semibold py-2.5 disabled:opacity-50"
          >
            {trabajando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>

        {confirmandoBorrado ? (
          <div className="rounded-xl border border-priority-urgente/40 bg-priority-urgente/10 px-3 py-2.5 text-sm">
            <p className="text-surface-text">¿Borrar esta tarea con todas sus notas? No se puede deshacer.</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmandoBorrado(false)}
                disabled={trabajando}
                className="flex-1 rounded-lg border border-surface-text/20 py-1.5 font-semibold"
              >
                No, conservar
              </button>
              <button
                type="button"
                onClick={borrar}
                disabled={trabajando}
                className="flex-1 rounded-lg bg-priority-urgente text-text py-1.5 font-semibold disabled:opacity-50"
              >
                {trabajando ? 'Borrando…' : 'Sí, borrar'}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmandoBorrado(true)}
            className="w-full text-center text-sm text-priority-urgente hover:underline"
          >
            Borrar tarea
          </button>
        )}
      </div>
    </form>
  )
}
