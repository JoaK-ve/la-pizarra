import { useCallback, useState } from 'react'
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

// Pide permiso de notificaciones y suscribe el navegador a push, guardando
// la suscripcion en Supabase -- el cron del Worker la usa despues para
// mandar los avisos de tareas vencidas/por vencer (ver worker/index.js).
export function useNotificacionesPush() {
  const { profile } = useAuth()
  const soportado = typeof Notification !== 'undefined' && 'serviceWorker' in navigator
  const [permiso, setPermiso] = useState(soportado ? Notification.permission : 'unsupported')
  const [activando, setActivando] = useState(false)
  const [error, setError] = useState(null)

  const activar = useCallback(async () => {
    if (!soportado || !profile) return
    setActivando(true)
    setError(null)
    try {
      const resultado = await Notification.requestPermission()
      setPermiso(resultado)
      if (resultado !== 'granted') return

      const registro = await navigator.serviceWorker.ready
      let suscripcion = await registro.pushManager.getSubscription()
      if (!suscripcion) {
        suscripcion = await registro.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlAUint8Array(__VAPID_PUBLIC_KEY__),
        })
      }

      const json = suscripcion.toJSON()
      const { error: errorGuardar } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: profile.id,
          workshop_id: profile.workshop_id,
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
        { onConflict: 'user_id,endpoint' },
      )
      if (errorGuardar) setError(errorGuardar.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setActivando(false)
    }
  }, [soportado, profile])

  return { soportado, permiso, activando, error, activar }
}
