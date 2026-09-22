import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// La Pizarra pasa de ser un Worker 100% estatico a uno hibrido: sigue
// sirviendo la SPA igual que siempre (via el binding ASSETS), pero ahora
// tambien corre dos crons -- ver `scheduled()` mas abajo. Handoff original:
// la-pizarra-recordatorios-handoff.md (2026-09-22).

// "06:00 UTC" -- aviso push, primera hora de la mañana en España (con el
// desfase normal de +-1h segun horario de verano/invierno, sin ajuste
// automatico -- Cloudflare Cron Triggers no soportan zona horaria).
const CRON_PUSH = '0 6 * * *'
// "08:00 UTC" -- resumen por email, apunta a las ~10:00 hora España.
const CRON_EMAIL = '0 8 * * *'

export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request)
  },

  async scheduled(event, env, ctx) {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

    if (event.cron === CRON_PUSH) {
      webpush.setVapidDetails('mailto:contacto@wheelos.es', env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY)
      ctx.waitUntil(enviarAvisosPush(supabase))
    } else if (event.cron === CRON_EMAIL) {
      ctx.waitUntil(enviarResumenEmail(supabase, env))
    }
  },
}

function hoyISO(offsetDias = 0) {
  const fecha = new Date(Date.now() + offsetDias * 86400000)
  return fecha.toISOString().slice(0, 10)
}

// Dos avisos por tarea, cada uno una sola vez (decision del usuario,
// 2026-09-22): 24h antes de vencer, y el dia del vencimiento. Solo tareas
// PENDIENTES con alguien asignado -- las "sin asignar" no notifican a
// nadie por ahora (no estaba definido a quien avisarle en ese caso).
async function enviarAvisosPush(supabase) {
  await avisarPorFecha(supabase, hoyISO(1), 'notificado_previo_at', 'Vence mañana')
  await avisarPorFecha(supabase, hoyISO(0), 'notificado_vencimiento_at', 'Vence hoy')
}

async function avisarPorFecha(supabase, fecha, campoNotificado, etiqueta) {
  const { data: tareas, error } = await supabase
    .from('tareas')
    .select('id, titulo, asignado_a')
    .eq('fecha_limite', fecha)
    .eq('estado', 'pendiente')
    .is(campoNotificado, null)
    .not('asignado_a', 'is', null)

  if (error) {
    console.error('Error buscando tareas para avisar:', error.message)
    return
  }

  for (const tarea of tareas ?? []) {
    await notificarTarea(supabase, tarea, etiqueta)
    await supabase
      .from('tareas')
      .update({ [campoNotificado]: new Date().toISOString() })
      .eq('id', tarea.id)
  }
}

async function notificarTarea(supabase, tarea, etiqueta) {
  const { data: suscripciones, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', tarea.asignado_a)

  if (error) {
    console.error('Error buscando suscripciones:', error.message)
    return
  }

  const payload = JSON.stringify({
    title: `${etiqueta}: ${tarea.titulo}`,
    body: 'Toca para abrir La Pizarra',
    url: 'https://lapizarra.wheelos.es',
  })

  for (const suscripcion of suscripciones ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: suscripcion.endpoint, keys: { p256dh: suscripcion.p256dh, auth: suscripcion.auth } },
        payload,
      )
    } catch (err) {
      // 404/410 = la suscripcion ya no existe del lado del navegador
      // (desinstalo la PWA, borro datos, etc.) -- se borra para no
      // reintentar en vano cada dia.
      if (err.statusCode === 404 || err.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', suscripcion.endpoint)
      } else {
        console.error('Error enviando push:', err.message)
      }
    }
  }
}

// Resumen diario por email: tareas vencidas + para hoy, agrupadas por
// persona asignada. Sin ruido -- quien no tiene nada pendiente no recibe
// email. El email de cada usuario vive en auth.users (Supabase Auth), no
// en public.users, por eso hace falta el Admin API (getUserById).
async function enviarResumenEmail(supabase, env) {
  const hoy = hoyISO(0)

  const { data: tareas, error } = await supabase
    .from('tareas')
    .select('titulo, fecha_limite, asignado_a')
    .eq('estado', 'pendiente')
    .lte('fecha_limite', hoy)
    .not('fecha_limite', 'is', null)
    .not('asignado_a', 'is', null)

  if (error) {
    console.error('Error buscando tareas para el resumen:', error.message)
    return
  }

  const tareasPorUsuario = new Map()
  for (const tarea of tareas ?? []) {
    if (!tareasPorUsuario.has(tarea.asignado_a)) tareasPorUsuario.set(tarea.asignado_a, [])
    tareasPorUsuario.get(tarea.asignado_a).push(tarea)
  }

  for (const [usuarioId, tareasUsuario] of tareasPorUsuario) {
    const { data: perfil } = await supabase.from('users').select('auth_user_id').eq('id', usuarioId).single()
    if (!perfil?.auth_user_id) continue

    const { data: authData } = await supabase.auth.admin.getUserById(perfil.auth_user_id)
    const email = authData?.user?.email
    if (!email) continue

    await mandarEmailResumen(env, email, tareasUsuario, hoy)
  }
}

async function mandarEmailResumen(env, email, tareas, hoy) {
  const filas = tareas
    .map((t) => `<li>${t.titulo}${t.fecha_limite === hoy ? ' — vence hoy' : ' — vencida'}</li>`)
    .join('')

  const respuesta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // "onboarding@resend.dev" hasta que se verifique un dominio propio
      // (ej. recordatorios@wheelos.es) en el panel de Resend.
      from: 'La Pizarra <onboarding@resend.dev>',
      to: email,
      subject: `${tareas.length} tarea${tareas.length === 1 ? '' : 's'} pendiente${tareas.length === 1 ? '' : 's'} en La Pizarra`,
      html: `<p>Tienes estas tareas vencidas o para hoy:</p><ul>${filas}</ul><p><a href="https://lapizarra.wheelos.es">Abrir La Pizarra</a></p>`,
    }),
  })

  if (!respuesta.ok) {
    console.error('Error enviando email de resumen:', respuesta.status, await respuesta.text())
  }
}
