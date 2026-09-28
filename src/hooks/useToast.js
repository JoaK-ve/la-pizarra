import { useCallback, useEffect, useRef, useState } from 'react'

// Aviso emergente para cosas que antes fallaban en silencio (ej. marcar
// "hecha" sin permiso). tipo: 'error' | 'ok'.
export function useToast() {
  const [toast, setToast] = useState(null)
  const temporizador = useRef(null)

  const mostrar = useCallback((mensaje, tipo = 'error') => {
    clearTimeout(temporizador.current)
    setToast({ mensaje, tipo })
    temporizador.current = setTimeout(() => setToast(null), tipo === 'error' ? 7000 : 3500)
  }, [])

  useEffect(() => () => clearTimeout(temporizador.current), [])

  return { toast, mostrar, cerrar: () => setToast(null) }
}
