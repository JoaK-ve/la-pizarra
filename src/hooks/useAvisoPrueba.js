import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'

// Pide al Worker un aviso de prueba para la persona logueada (push a sus
// dispositivos + el correo real con sus tareas). Devuelve lineas de texto
// legibles con el resultado de cada canal, incluyendo POR QUE fallo si falla.
export function useAvisoPrueba() {
  const [enviando, setEnviando] = useState(false)
  const [lineas, setLineas] = useState(null)

  const enviar = useCallback(async () => {
    setEnviando(true)
    setLineas(null)
    try {
      const { data } = await supabase.auth.getSession()
      const respuesta = await fetch('/api/aviso-prueba', {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` },
      })
      const resultado = await respuesta.json()
      if (!respuesta.ok) {
        setLineas([`No se pudo enviar la prueba: ${resultado.error ?? respuesta.status}`])
        return
      }

      const { push, email } = resultado
      setLineas([
        push.dispositivos > 0
          ? `Push enviado a ${push.dispositivos} dispositivo(s).`
          : push.errores.length
            ? `Push falló: ${push.errores.join(' | ')}`
            : 'Push: no tienes ningún dispositivo activado (toca la campana).',
        email.ok ? `Correo enviado a ${email.para}.` : `Correo falló: ${email.detalle || 'sin detalle'}`,
      ])
    } catch (error) {
      setLineas([`No se pudo enviar la prueba: ${error.message}`])
    } finally {
      setEnviando(false)
    }
  }, [])

  return { enviando, lineas, enviar, cerrar: () => setLineas(null) }
}
