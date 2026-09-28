import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// El navegador necesita la clave publica en Uint8Array, no en base64 --
// conversion estandar para VAPID (no hay helper nativo para esto).
function base64UrlAUint8Array(base64) {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4)
  const normal = (base64 + relleno).replace(/-/g, '+').replace(/_/g, '/')
  const binario = atob(normal)
  return Uint8Array.from([...binario].map((c) => c.charCodeAt(0)))
}

// INSERT y no upsert a proposito: un upsert (ON CONFLICT DO UPDATE) exige
// permiso de UPDATE sobre la tabla, que esta tabla no da -- la primera
// version usaba upsert y fallaba en silencio (0 suscripciones guardadas).
// 23505 = esa suscripcion ya estaba guardada (unique user_id+endpoint),
// no es un error.
async function guardarSuscripcion(usuarioId, tallerId, suscripcion) {
  const json = suscripcion.toJSON()
  const { error } = await supabase.from('push_subscriptions').insert({
    user_id: usuarioId,
    workshop_id: tallerId,
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  })
  return error && error.code !== '23505' ? error.message : null
}

// Pide permiso de notificaciones y suscribe el navegador a push, guardando
// la suscripcion en Supabase -- el cron del Worker la usa despues para
// mandar los avisos de tareas vencidas/por vencer (ver worker/index.js).
//
// Con el permiso ya concedido, cada vez que se abre la app se re-sincroniza
// la suscripcion con la base (idempotente): asi se repara sola si el
// guardado fallo una vez, o si el navegador rota el endpoint.
export function useNotificacionesPush() {
  const { profile } = useAuth()
  const usuarioId = profile?.id
  const tallerId = profile?.workshop_id
  const soportado = typeof Notification !== 'undefined' && 'serviceWorker' in navigator
  const [permiso, setPermiso] = useState(soportado ? Notification.permission : 'unsupported')
  const [activando, setActivando] = useState(false)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    if (!soportado || !usuarioId || permiso !== 'granted') return
    let cancelado = false
    async function sincronizar() {
      try {
        const registro = await navigator.serviceWorker.ready
        let suscripcion = await registro.pushManager.getSubscription()
        if (!suscripcion) {
          suscripcion = await registro.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: base64UrlAUint8Array(__VAPID_PUBLIC_KEY__),
          })
        }
        const mensaje = await guardarSuscripcion(usuarioId, tallerId, suscripcion)
        if (!cancelado) setError(mensaje)
      } catch (err) {
        if (!cancelado) setError(err.message)
      }
    }
    sincronizar()
    return () => {
      cancelado = true
    }
  }, [soportado, usuarioId, tallerId, permiso, intento])

  const activar = useCallback(async () => {
    if (!soportado) return
    setActivando(true)
    try {
      setPermiso(await Notification.requestPermission())
      setIntento((n) => n + 1)
    } finally {
      setActivando(false)
    }
  }, [soportado])

  return { soportado, permiso, activando, error, activar }
}
