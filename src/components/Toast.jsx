export default function Toast({ toast, onCerrar }) {
  if (!toast) return null
  const esError = toast.tipo === 'error'
  return (
    <div
      role={esError ? 'alert' : 'status'}
      className={
        'fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-md rounded-xl px-4 py-3 text-sm shadow-lg flex items-start justify-between gap-3 border ' +
        (esError
          ? 'bg-bg text-text border-priority-urgente'
          : 'bg-bg text-text border-brand')
      }
    >
      <p>{toast.mensaje}</p>
      <button type="button" onClick={onCerrar} className="text-text/50 hover:text-text shrink-0" aria-label="Cerrar aviso">
        ✕
      </button>
    </div>
  )
}
