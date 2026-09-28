import { supabase } from './supabase'

// Le pide al Worker que avise a la persona asignada a una tarea (push +
// correo). Devuelve { ok, texto } con una frase lista para mostrar: si no se
// pudo avisar, dice por que.
export async function avisarAsignacion(tareaId, nombrePersona) {
  try {
    const { data } = await supabase.auth.getSession()
    const respuesta = await fetch('/api/aviso-asignacion', {
      method: 'POST',
      headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tareaId }),
    })
    const resultado = await respuesta.json().catch(() => ({}))
    if (!respuesta.ok) return { ok: false, texto: `No se pudo avisar a ${nombrePersona}: ${resultado.error ?? respuesta.status}` }
    // Ya se le habia avisado o no hacia falta: no es un error ni merece ruido.
    if (resultado.omitido) return { ok: true, texto: null }

    const canales = [resultado.push?.dispositivos > 0 && 'push', resultado.email?.ok && 'correo'].filter(Boolean)
    return canales.length
      ? { ok: true, texto: `Aviso enviado a ${nombrePersona} (${canales.join(' y ')}).` }
      : { ok: false, texto: `No se pudo avisar a ${nombrePersona}: ${resultado.email?.detalle || 'sin canales disponibles'}` }
  } catch (error) {
    return { ok: false, texto: `No se pudo avisar a ${nombrePersona}: ${error.message}` }
  }
}
