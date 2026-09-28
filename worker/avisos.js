import webpush from 'web-push'
import { renderResumen, enviarEmail } from './email.js'

const DIA_MS = 86400000

// Fecha "YYYY-MM-DD" en UTC. Los crons corren a las 06:00/08:00 UTC, asi que
// coincide con la fecha de España (mismo dia calendario).
export function fechaISO(desplazamientoDias = 0) {
  return new Date(Date.now() + desplazamientoDias * DIA_MS).toISOString().slice(0, 10)
}

const RANGO_PRIORIDAD = { urgente: 0, seguimiento: 1, normal: 2, baja: 3, nuevo: 2 }

function primeroPor(filas, campo) {
  const mapa = new Map()
  for (const fila of filas ?? []) if (!mapa.has(fila[campo])) mapa.set(fila[campo], fila)
  return mapa
}

const unicos = (valores) => [...new Set(valores.filter(Boolean))]

async function registrarAviso(supabase, fila) {
  const { error } = await supabase.from('avisos_enviados').insert(fila)
  if (error) console.error('No se pudo registrar el aviso:', error.message)
}

// Tareas pendientes con fecha limite hasta `hasta` y alguien asignado.
async function cargarTareas(supabase, hasta, soloUsuarioId) {
  let consulta = supabase
    .from('tareas')
    .select('id, workshop_id, titulo, descripcion, prioridad, fecha_limite, asignado_a, creado_por, client_id')
    .eq('estado', 'pendiente')
    .not('fecha_limite', 'is', null)
    .lte('fecha_limite', hasta)
    .not('asignado_a', 'is', null)
  if (soloUsuarioId) consulta = consulta.eq('asignado_a', soloUsuarioId)
  const { data, error } = await consulta
  if (error) throw new Error(`Error buscando tareas: ${error.message}`)
  return data ?? []
}

// Datos del taller y del negocio para armar las tarjetas: personas, taller,
// cliente, reparacion activa del cliente y ultima nota de cada tarea.
async function cargarContexto(supabase, tareas) {
  const usuarioIds = unicos(tareas.flatMap((t) => [t.asignado_a, t.creado_por]))
  const tallerIds = unicos(tareas.map((t) => t.workshop_id))
  const clienteIds = unicos(tareas.map((t) => t.client_id))
  const tareaIds = tareas.map((t) => t.id)

  const [usuarios, talleres, clientes, reparaciones, notas] = await Promise.all([
    supabase.from('users').select('id, workshop_id, full_name, email, active').in('id', usuarioIds),
    supabase.from('workshops').select('id, fantasy_name, contact_email, phone, address, website').in('id', tallerIds),
    clienteIds.length
      ? supabase.from('clients').select('id, first_name, last_name, phone').in('id', clienteIds)
      : { data: [] },
    clienteIds.length
      ? supabase
          .from('repairs')
          .select('client_id, scooter_brand_snapshot, scooter_model_snapshot, status, created_at')
          .in('client_id', clienteIds)
          .neq('status', 'entregado')
          .order('created_at', { ascending: false })
      : { data: [] },
    supabase
      .from('tarea_notas')
      .select('tarea_id, texto, autor_id, created_at')
      .in('tarea_id', tareaIds)
      .order('created_at', { ascending: false }),
  ])

  const errores = [usuarios, talleres, clientes, reparaciones, notas].map((r) => r.error?.message).filter(Boolean)
  if (errores.length) throw new Error(`Error cargando datos del taller: ${errores.join(' | ')}`)

  return {
    usuarios: new Map(usuarios.data.map((u) => [u.id, u])),
    talleres: new Map(talleres.data.map((t) => [t.id, t])),
    clientes: new Map(clientes.data.map((c) => [c.id, c])),
    reparacionPorCliente: primeroPor(reparaciones.data, 'client_id'),
    ultimaNotaPorTarea: primeroPor(notas.data, 'tarea_id'),
  }
}

function tarjetaDeTarea(tarea, ctx) {
  const cliente = tarea.client_id ? ctx.clientes.get(tarea.client_id) : null
  const reparacion = tarea.client_id ? ctx.reparacionPorCliente.get(tarea.client_id) : null
  const nota = ctx.ultimaNotaPorTarea.get(tarea.id)
  const creador = tarea.creado_por && tarea.creado_por !== tarea.asignado_a ? ctx.usuarios.get(tarea.creado_por) : null

  return {
    id: tarea.id,
    titulo: tarea.titulo,
    descripcion: tarea.descripcion,
    prioridad: tarea.prioridad,
    fecha_limite: tarea.fecha_limite,
    cliente: cliente
      ? { nombre: [cliente.first_name, cliente.last_name].filter(Boolean).join(' '), telefono: cliente.phone }
      : null,
    reparacion: reparacion
      ? { marca: reparacion.scooter_brand_snapshot, modelo: reparacion.scooter_model_snapshot, estado: reparacion.status }
      : null,
    ultimaNota: nota ? { texto: nota.texto, autor: ctx.usuarios.get(nota.autor_id)?.full_name?.split(' ')[0] ?? null } : null,
    creadaPor: creador?.full_name ?? null,
  }
}

function ordenar(tarjetas) {
  return [...tarjetas].sort(
    (a, b) =>
      (RANGO_PRIORIDAD[a.prioridad] ?? 2) - (RANGO_PRIORIDAD[b.prioridad] ?? 2) || a.fecha_limite.localeCompare(b.fecha_limite),
  )
}

function separarPorFecha(tarjetas, hoy, manana) {
  return {
    vencidas: ordenar(tarjetas.filter((t) => t.fecha_limite < hoy)),
    hoy: ordenar(tarjetas.filter((t) => t.fecha_limite === hoy)),
    manana: ordenar(tarjetas.filter((t) => t.fecha_limite === manana)),
  }
}

const hayAlgo = (s) => s.vencidas.length + s.hoy.length + s.manana.length > 0

// Tarea de muestra para la prueba cuando la persona no tiene nada pendiente:
// permite ver el correo completo igualmente.
function seccionesDeEjemplo(hoy) {
  return {
    vencidas: [],
    hoy: [
      {
        id: 'ejemplo',
        ejemplo: true,
        titulo: 'Ejemplo: avisar al cliente de que su patinete está listo',
        descripcion: 'Así se ve una tarea en el correo, con los datos del cliente y de la reparación.',
        prioridad: 'urgente',
        fecha_limite: hoy,
        cliente: { nombre: 'Cliente de ejemplo', telefono: '+34 600 000 000' },
        reparacion: { marca: 'Xiaomi', modelo: 'Pro 2', estado: 'terminado' },
        ultimaNota: { texto: 'Se probó y funciona bien.', autor: 'Joaquín' },
        creadaPor: null,
      },
    ],
    manana: [],
  }
}

async function mandarResumen(supabase, env, { persona, taller, secciones, hoy, prueba }) {
  const { asunto, html, texto } = renderResumen({ taller, persona, secciones, hoy, appUrl: env.APP_URL, prueba })
  const envio = await enviarEmail(env, {
    nombreTaller: taller.fantasy_name,
    para: persona.email,
    responderA: taller.contact_email,
    asunto,
    html,
    texto,
  })
  const total = secciones.vencidas.length + secciones.hoy.length + secciones.manana.length
  await registrarAviso(supabase, {
    workshop_id: persona.workshop_id,
    user_id: persona.id,
    canal: 'email',
    tipo: prueba ? 'prueba' : 'resumen',
    estado: envio.ok ? 'enviado' : 'fallido',
    detalle: envio.ok ? `${total} tarea(s)` : `Resend ${envio.estado}: ${envio.detalle}`,
  })
  if (!envio.ok) console.error(`Email a ${persona.email} fallo (${envio.estado}): ${envio.detalle}`)
  return envio
}

// CRON 08:00 UTC. Un correo por persona con sus tareas vencidas, de hoy y de
// mañana, con la marca del taller de esa persona. Como maximo uno al dia.
export async function enviarResumenes(supabase, env) {
  const hoy = fechaISO(0)
  const manana = fechaISO(1)
  const tareas = await cargarTareas(supabase, manana)
  if (!tareas.length) return

  const ctx = await cargarContexto(supabase, tareas)
  const desdeHoy = `${hoy}T00:00:00Z`

  for (const personaId of unicos(tareas.map((t) => t.asignado_a))) {
    const persona = ctx.usuarios.get(personaId)
    const taller = persona && ctx.talleres.get(persona.workshop_id)
    if (!persona?.active || !persona.email || !taller) continue

    const secciones = separarPorFecha(
      tareas.filter((t) => t.asignado_a === personaId).map((t) => tarjetaDeTarea(t, ctx)),
      hoy,
      manana,
    )
    if (!hayAlgo(secciones)) continue

    const { data: yaEnviado } = await supabase
      .from('avisos_enviados')
      .select('id')
      .eq('user_id', personaId)
      .eq('canal', 'email')
      .eq('tipo', 'resumen')
      .eq('estado', 'enviado')
      .gte('created_at', desdeHoy)
      .limit(1)
    if (yaEnviado?.length) continue

    await mandarResumen(supabase, env, { persona, taller, secciones, hoy, prueba: false })
  }
}

// CRON 06:00 UTC. Dos avisos push por tarea y persona, cada uno una sola vez:
// 24h antes ("previo") y el dia del vencimiento. Se registran en
// avisos_enviados; asi, si la tarea se reasigna, la nueva persona recibe los
// suyos.
export async function enviarPushes(supabase, env) {
  webpush.setVapidDetails(`mailto:${env.MAIL_FROM}`, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY)
  const hoy = fechaISO(0)
  const manana = fechaISO(1)

  const candidatas = (await cargarTareas(supabase, manana)).filter((t) => t.fecha_limite === hoy || t.fecha_limite === manana)
  if (!candidatas.length) return

  const ctx = await cargarContexto(supabase, candidatas)
  const { data: previos } = await supabase
    .from('avisos_enviados')
    .select('tarea_id, user_id, tipo, fecha_limite')
    .eq('canal', 'push')
    .eq('estado', 'enviado')
    .in('tarea_id', candidatas.map((t) => t.id))
  // La fecha forma parte de la clave: si una tarea avisada se aplaza a otra
  // fecha, ese aviso es nuevo y si debe volver a mandarse.
  const yaAvisados = new Set((previos ?? []).map((a) => `${a.tarea_id}|${a.user_id}|${a.tipo}|${a.fecha_limite}`))

  for (const tarea of candidatas) {
    const tipo = tarea.fecha_limite === hoy ? 'vencimiento' : 'previo'
    if (yaAvisados.has(`${tarea.id}|${tarea.asignado_a}|${tipo}|${tarea.fecha_limite}`)) continue

    const tarjeta = tarjetaDeTarea(tarea, ctx)
    const taller = ctx.talleres.get(tarea.workshop_id)
    const etiqueta = tipo === 'vencimiento' ? 'Vence hoy' : 'Vence mañana'
    const detalleCliente = tarjeta.cliente ? ` · ${tarjeta.cliente.nombre}` : ''

    const resultado = await mandarPush(supabase, tarea.asignado_a, {
      title: `${etiqueta}: ${tarea.titulo}`,
      body: `${taller?.fantasy_name ?? 'La Pizarra'}${detalleCliente}`,
      url: `${env.APP_URL}/?tarea=${tarea.id}`,
    })

    if (resultado.enviados > 0 || resultado.errores.length) {
      await registrarAviso(supabase, {
        workshop_id: tarea.workshop_id,
        tarea_id: tarea.id,
        user_id: tarea.asignado_a,
        fecha_limite: tarea.fecha_limite,
        canal: 'push',
        tipo,
        estado: resultado.enviados > 0 ? 'enviado' : 'fallido',
        detalle: resultado.enviados > 0 ? `${resultado.enviados} dispositivo(s)` : resultado.errores.join(' | ').slice(0, 300),
      })
    } else {
      console.warn(`Sin push para "${tarea.titulo}" (${etiqueta}): la persona asignada no tiene dispositivos activados.`)
    }
  }
}

// Envia a todos los dispositivos de una persona. Las suscripciones muertas
// (404/410) se borran solas.
async function mandarPush(supabase, usuarioId, payload) {
  const { data: suscripciones, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', usuarioId)
  if (error) return { enviados: 0, errores: [`suscripciones: ${error.message}`] }

  const resultado = { enviados: 0, errores: [] }
  for (const s of suscripciones ?? []) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload))
      resultado.enviados++
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
      } else {
        resultado.errores.push(`${err.statusCode ?? ''} ${err.message}`.trim())
      }
    }
  }
  return resultado
}

// Boton "Enviar aviso de prueba": push a los dispositivos de la persona y el
// correo real (con sus tareas de verdad, o una de ejemplo si no tiene).
export async function avisoDePrueba(supabase, env, persona) {
  webpush.setVapidDetails(`mailto:${env.MAIL_FROM}`, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY)
  const hoy = fechaISO(0)
  const manana = fechaISO(1)

  const { data: taller } = await supabase
    .from('workshops')
    .select('id, fantasy_name, contact_email, phone, address, website')
    .eq('id', persona.workshop_id)
    .single()

  const push = await mandarPush(supabase, persona.id, {
    title: `Prueba de ${taller?.fantasy_name ?? 'La Pizarra'}`,
    body: 'Si ves esto, los avisos push funcionan en este dispositivo.',
    url: env.APP_URL,
  })
  if (push.enviados > 0 || push.errores.length) {
    await registrarAviso(supabase, {
      workshop_id: persona.workshop_id,
      user_id: persona.id,
      canal: 'push',
      tipo: 'prueba',
      estado: push.enviados > 0 ? 'enviado' : 'fallido',
      detalle: push.enviados > 0 ? `${push.enviados} dispositivo(s)` : push.errores.join(' | ').slice(0, 300),
    })
  }

  const tareas = await cargarTareas(supabase, manana, persona.id)
  let secciones = { vencidas: [], hoy: [], manana: [] }
  if (tareas.length) {
    const ctx = await cargarContexto(supabase, tareas)
    secciones = separarPorFecha(tareas.map((t) => tarjetaDeTarea(t, ctx)), hoy, manana)
  }
  if (!hayAlgo(secciones)) secciones = seccionesDeEjemplo(hoy)

  const email = persona.email
    ? await mandarResumen(supabase, env, { persona, taller, secciones, hoy, prueba: true })
    : { ok: false, estado: 0, detalle: 'La persona no tiene email en WheelOS' }

  return {
    push: { dispositivos: push.enviados, errores: push.errores },
    email: { ok: email.ok, para: persona.email, detalle: email.detalle },
  }
}
