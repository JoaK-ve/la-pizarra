import { useState } from 'react'

// Numero de orden de la reparacion en WheelOS (ej. "8PSVB2"). WheelOS abre
// cada reparacion en una modal, sin direccion propia, asi que no se puede
// enlazar directamente: se muestra el numero y, al tocarlo, se copia para
// buscarlo alli. Frena el clic para no abrir a la vez el detalle de la tarea.
export default function NumeroOrden({ numero }) {
  const [estado, setEstado] = useState(null)
  if (!numero) return null

  async function copiar(e) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(numero)
      setEstado('copiado')
    } catch {
      setEstado('error')
    }
    setTimeout(() => setEstado(null), 1800)
  }

  return (
    <button
      type="button"
      onClick={copiar}
      title="Copiar el número de orden para buscarlo en WheelOS"
      className="inline-flex items-center rounded-full bg-surface-text/10 px-2 py-0.5 font-mono text-[11px] text-surface-text/70 hover:bg-surface-text/15 hover:text-surface-text"
    >
      {estado === 'copiado' ? 'Copiado' : estado === 'error' ? 'No se pudo copiar' : `Orden ${numero}`}
    </button>
  )
}
