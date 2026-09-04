import { useState } from 'react'
import { useTareaNotas } from '../hooks/useTareaNotas'
import { soloFecha } from '../utils/fechas'
import { CloseIcon } from './icons'

// Parsea "YYYY-MM-DD" a mano (no `new Date(string)`) para no depender de
// como el navegador interprete la zona horaria de un string ISO.
function formatearFechaLegible(fechaLimite) {
  const [y, m, d] = soloFecha(fechaLimite).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
}

// Se abre al tocar el CONTENIDO de una tarjeta de tarea (no el circulo).
// Muestra la bitacora completa y deja agregar una nota nueva en cualquier
// momento, este la tarea pendiente o hecha -- no hace falta cerrarla para
// dejar constancia de que "pedi la pieza" o "llame al cliente".
export default function TareaDetalle({ tarea, onClose, onNotaAgregada }) {
  const { notas, loading, agregarNota } = useTareaNotas(tarea.id)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)

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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-surface text-surface-text rounded-t-3xl sm:rounded-xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-start justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <h2 className="font-display font-bold text-lg leading-snug">{tarea.titulo}</h2>
            {tarea.descripcion && <p className="text-sm text-surface-text/60 mt-1">{tarea.descripcion}</p>}
            {tarea.fecha_limite && (
              <p className="font-mono text-xs text-surface-text-muted uppercase tracking-wide mt-1.5">
                📅 {formatearFechaLegible(tarea.fecha_limite)}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-surface-text/50 hover:text-surface-text shrink-0">
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-surface-text/10 flex-1 overflow-y-auto space-y-3">
          <p className="font-mono text-xs text-surface-text-muted uppercase tracking-wide">Bitácora</p>
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
      </div>
    </div>
  )
}
