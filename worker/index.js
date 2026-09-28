import { createClient } from '@supabase/supabase-js'
import { enviarPushes, enviarResumenes, avisoDePrueba, avisoDeAsignacion } from './avisos.js'

// La Pizarra es un Worker hibrido: sirve la SPA (binding ASSETS) y ademas
// tiene dos crons y dos rutas propias:
//   GET  /logo/<workshop_id>   logo del taller como imagen (para los correos)
//   POST /api/aviso-prueba     boton "Enviar aviso de prueba" de la app
// Las rutas propias estan en `assets.run_worker_first` (wrangler.jsonc).

// "06:00 UTC" push, primera hora de la mañana en España. "08:00 UTC" resumen
// por correo, ~10:00 en España. Los Cron Triggers no admiten zona horaria,
// asi que hay +-1h segun horario de verano/invierno.
const CRON_PUSH = '0 6 * * *'
const CRON_EMAIL = '0 8 * * *'

const clienteAdmin = (env) => createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const json = (cuerpo, estado = 200) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'Content-Type': 'application/json' } })

// Los logos viven en `workshops` como data URI en base64. Gmail y otros
// clientes de correo bloquean las imagenes data:, asi que se sirven como
// imagen normal. Solo expone el logo (marca publica del taller).
async function servirLogo(env, tallerId) {
  const { data } = await clienteAdmin(env)
    .from('workshops')
    .select('logo_wordmark_url, logo_icon_url')
    .eq('id', tallerId)
    .maybeSingle()

  const dataUri = data?.logo_wordmark_url || data?.logo_icon_url
  const coincidencia = /^data:(image\/[a-z+.-]+);base64,(.+)$/i.exec(dataUri ?? '')
  if (!coincidencia) return new Response('Sin logo', { status: 404 })

  const binario = Uint8Array.from(atob(coincidencia[2]), (c) => c.charCodeAt(0))
  return new Response(binario, {
    headers: { 'Content-Type': coincidencia[1], 'Cache-Control': 'public, max-age=86400' },
  })
}

// Identifica a la persona por el token de su sesion de Supabase.
async function personaDelToken(env, peticion) {
  const token = (peticion.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const supabase = clienteAdmin(env)
  const { data: sesion } = await supabase.auth.getUser(token)
  if (!sesion?.user) return null
  const { data: persona } = await supabase
    .from('users')
    .select('id, workshop_id, full_name, email, active')
    .eq('auth_user_id', sesion.user.id)
    .maybeSingle()
  return persona?.active ? persona : null
}

export default {
  async fetch(peticion, env) {
    const { pathname } = new URL(peticion.url)

    const rutaLogo = /^\/logo\/([0-9a-f-]{36})$/i.exec(pathname)
    if (rutaLogo && peticion.method === 'GET') return servirLogo(env, rutaLogo[1])

    if (pathname === '/api/aviso-prueba' && peticion.method === 'POST') {
      const persona = await personaDelToken(env, peticion)
      if (!persona) return json({ error: 'No autorizado' }, 401)
      try {
        return json(await avisoDePrueba(clienteAdmin(env), env, persona))
      } catch (err) {
        console.error('Fallo el aviso de prueba:', err.message)
        return json({ error: err.message }, 500)
      }
    }

    if (pathname === '/api/aviso-asignacion' && peticion.method === 'POST') {
      const persona = await personaDelToken(env, peticion)
      if (!persona) return json({ error: 'No autorizado' }, 401)
      const { tareaId } = await peticion.json().catch(() => ({}))
      if (!/^[0-9a-f-]{36}$/i.test(tareaId ?? '')) return json({ error: 'Falta el id de la tarea' }, 400)
      try {
        return json(await avisoDeAsignacion(clienteAdmin(env), env, persona, tareaId))
      } catch (err) {
        console.error('Fallo el aviso de asignacion:', err.message)
        return json({ error: err.message }, 500)
      }
    }

    return env.ASSETS.fetch(peticion)
  },

  async scheduled(evento, env, ctx) {
    const supabase = clienteAdmin(env)
    if (evento.cron === CRON_PUSH) ctx.waitUntil(enviarPushes(supabase, env).catch((e) => console.error('Cron push:', e.message)))
    else if (evento.cron === CRON_EMAIL) ctx.waitUntil(enviarResumenes(supabase, env).catch((e) => console.error('Cron email:', e.message)))
  },
}
