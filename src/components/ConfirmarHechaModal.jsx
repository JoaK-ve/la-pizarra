import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CloseIcon } from './icons'

// Se abre al tocar el circulo de una tarea PENDIENTE (pendiente -> hecha).
// Reabrir (hecha -> pendiente) sigue siendo instantaneo, sin este paso --
// ver Tareas.jsx.
export default function ConfirmarHechaModal({ tarea, onClose, onToggleHecho, onNotaAgregada }) {
  const { profile } = useAuth()
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  async function handleConfirmar() {
    setEnviando(true)
    setError(null)

    if (texto.trim() && profile) {
      const { error: errorNota } = await supabase.from('tarea_notas').insert({
        tarea_id: tarea.id,
        workshop_id: profile.workshop_id,
        autor_id: profile.id,
        texto: texto.trim(),
      })
      if (errorNota) {
        setEnviando(false)
        setError('No se pudo guardar la nota: ' + errorNota.message)
        return
      }
      onNotaAgregada?.()
    }

    await onToggleHecho(tarea)
    setEnviando(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="w-full sm:max-w-sm bg-paper text-ink rounded-t-3xl sm:rounded-3xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">¿Marcar esta tarea como hecha?</h2>
          <button type="button" onClick={onClose} className="text-ink/50 hover:text-ink shrink-0">
            <CloseIcon size={20} />
          </button>
        </div>

        <div>
          <label className="text-xs font-mono uppercase tracking-wide text-ink/50">¿Qué hiciste? (opcional)</label>
          <input
            autoFocus
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="w-full mt-1 rounded-xl border border-ink/15 bg-white/60 px-3 py-2 outline-none focus:border-amber"
          />
        </div>

        {error && <p className="text-sm text-[--color-prioridad-urgente]">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-ink/20 font-display font-semibold py-2.5"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={enviando}
            className="flex-1 rounded-xl bg-amber text-bg font-display font-semibold py-2.5 disabled:opacity-50"
          >
            {enviando ? 'Guardando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
