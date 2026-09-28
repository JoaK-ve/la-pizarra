// Plantilla y envio del correo de avisos de vencimiento. Todo lo que se
// muestra sale del TALLER de la persona (nombre, logo, contacto): nada fijo
// de un taller concreto. HTML con tablas e estilos en linea, que es lo unico
// que Gmail/Outlook renderizan de forma fiable.

const PRIORIDAD = {
  urgente: { etiqueta: 'Urgente', color: '#b23a2e' },
  seguimiento: { etiqueta: 'Seguimiento', color: '#c98a2c' },
  normal: { etiqueta: 'Normal', color: '#8c8478' },
  baja: { etiqueta: 'Baja', color: '#8c8478' },
  nuevo: { etiqueta: 'Nuevo', color: '#4c7a5e' },
}

const ESTADO_REPARACION = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  terminado: 'Terminado',
  entregado: 'Entregado',
}

const FUENTE = "'Helvetica Neue', Helvetica, Arial, sans-serif"

// Todo texto escrito por una persona (titulos, notas, nombres...) pasa por
// aqui antes de entrar al HTML.
export function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}

function recortar(texto, max) {
  const limpio = String(texto ?? '').replace(/\s+/g, ' ').trim()
  return limpio.length > max ? limpio.slice(0, max - 1).trimEnd() + '…' : limpio
}

function telefonoParaEnlace(telefono) {
  return String(telefono ?? '').replace(/[^\d+]/g, '')
}

function fechaLarga(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', timeZone: 'UTC' })
}

function diasEntre(desdeISO, hastaISO) {
  const [ya, ma, da] = desdeISO.split('-').map(Number)
  const [yb, mb, db] = hastaISO.split('-').map(Number)
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000)
}

function textoFecha(fecha, hoy) {
  const dias = diasEntre(hoy, fecha)
  if (dias === 0) return 'Vence hoy'
  if (dias === 1) return `Vence mañana · ${fechaLarga(fecha)}`
  if (dias === -1) return `Venció ayer · ${fechaLarga(fecha)}`
  if (dias < -1) return `Venció hace ${-dias} días · ${fechaLarga(fecha)}`
  return `Vence el ${fechaLarga(fecha)}`
}

function plural(n, singular, pluralTexto) {
  return n === 1 ? `1 ${singular}` : `${n} ${pluralTexto}`
}

// Frase corta con lo que hay, para el asunto y el saludo.
function resumenCorto({ vencidas, hoy, manana }) {
  const partes = []
  if (vencidas.length) partes.push(plural(vencidas.length, 'vencida', 'vencidas'))
  if (hoy.length) partes.push(hoy.length === 1 ? '1 vence hoy' : `${hoy.length} vencen hoy`)
  if (manana.length) partes.push(manana.length === 1 ? '1 vence mañana' : `${manana.length} vencen mañana`)
  return partes.join(', ')
}

function tarjeta(t, hoy, appUrl) {
  const prioridad = PRIORIDAD[t.prioridad] ?? PRIORIDAD.normal
  const lineas = []

  if (t.descripcion) {
    lineas.push(`<div style="margin-top:8px;font-size:14px;line-height:1.45;color:#3b3f3d;">${esc(recortar(t.descripcion, 240))}</div>`)
  }

  if (t.cliente) {
    const tel = t.cliente.telefono
      ? ` · <a href="tel:${esc(telefonoParaEnlace(t.cliente.telefono))}" style="color:#1c1f1e;font-weight:600;">${esc(t.cliente.telefono)}</a>`
      : ''
    lineas.push(`<div style="margin-top:8px;font-size:13px;color:#3b3f3d;"><strong>Cliente:</strong> ${esc(t.cliente.nombre)}${tel}</div>`)
  }

  if (t.reparacion) {
    const patin = [t.reparacion.marca, t.reparacion.modelo].filter(Boolean).join(' ') || 'Patinete sin marca/modelo'
    lineas.push(
      `<div style="margin-top:4px;font-size:13px;color:#3b3f3d;"><strong>Reparación:</strong> ${esc(patin)} · ${esc(ESTADO_REPARACION[t.reparacion.estado] ?? t.reparacion.estado)}</div>`,
    )
  }

  if (t.ultimaNota) {
    lineas.push(
      `<div style="margin-top:8px;padding:8px 10px;background:#f6f3ea;border-radius:6px;font-size:13px;line-height:1.4;color:#3b3f3d;"><span style="color:#6b6558;">Última nota${t.ultimaNota.autor ? ` (${esc(t.ultimaNota.autor)})` : ''}:</span> ${esc(recortar(t.ultimaNota.texto, 180))}</div>`,
    )
  }

  if (t.creadaPor) {
    lineas.push(`<div style="margin-top:8px;font-size:12px;color:#6b6558;">Asignada por ${esc(t.creadaPor)}</div>`)
  }

  const enlace = t.ejemplo ? appUrl : `${appUrl}/?tarea=${encodeURIComponent(t.id)}`

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;background:#ffffff;border:1px solid #e4dfd0;border-left:5px solid ${prioridad.color};border-radius:8px;">
  <tr><td style="padding:14px 16px;font-family:${FUENTE};">
    <div style="font-size:16px;font-weight:700;line-height:1.3;color:#1c1f1e;">${esc(t.titulo)}</div>
    <div style="margin-top:8px;font-size:12px;">
      <span style="display:inline-block;padding:2px 9px;border-radius:999px;background:${prioridad.color};color:#ffffff;font-weight:600;">${esc(prioridad.etiqueta)}</span>
      <span style="margin-left:6px;color:#3b3f3d;font-weight:600;">${esc(textoFecha(t.fecha_limite, hoy))}</span>
    </div>
    ${lineas.join('')}
    <div style="margin-top:12px;">
      <a href="${esc(enlace)}" style="display:inline-block;padding:9px 16px;background:#5c9e3a;color:#12210b;font-size:13px;font-weight:700;text-decoration:none;border-radius:8px;">Abrir tarea</a>
    </div>
  </td></tr>
</table>`
}

function seccion(titulo, color, tareas, hoy, appUrl) {
  if (!tareas.length) return ''
  return `
<div style="margin:22px 0 10px;font-family:${FUENTE};font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${color};">${esc(titulo)} (${tareas.length})</div>
${tareas.map((t) => tarjeta(t, hoy, appUrl)).join('')}`
}

// Devuelve { asunto, html, texto } para UNA persona de UN taller.
export function renderResumen({ taller, persona, secciones, hoy, appUrl, prueba = false }) {
  const { vencidas, hoy: paraHoy, manana } = secciones
  const nombre = taller.fantasy_name || 'Tu taller'
  const primerNombre = (persona.full_name || '').split(' ')[0] || 'hola'
  const corto = resumenCorto(secciones)
  const asunto = `${prueba ? '[Prueba] ' : ''}${corto} · ${nombre}`
  const logo = `${appUrl}/logo/${encodeURIComponent(taller.id)}`

  const contacto = [taller.address, taller.phone, taller.website].filter(Boolean)
  const pie = contacto.length
    ? `<div style="margin-top:4px;">${contacto.map(esc).join(' · ')}</div>`
    : ''

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(asunto)}</title></head>
<body style="margin:0;padding:0;background:#efece2;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(corto)} — ${esc(nombre)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efece2;">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
    <tr><td style="background:#ffffff;border-radius:12px 12px 0 0;padding:20px 24px 16px;border-bottom:4px solid #5c9e3a;font-family:${FUENTE};">
      <img src="${esc(logo)}" alt="${esc(nombre)}" height="44" style="display:block;height:44px;max-width:260px;border:0;">
    </td></tr>
    <tr><td style="background:#f2efe4;padding:22px 24px 26px;border-radius:0 0 12px 12px;font-family:${FUENTE};color:#1c1f1e;">
      ${prueba ? `<div style="margin-bottom:14px;padding:8px 12px;background:#fff3cd;border-radius:6px;font-size:12px;color:#5c4a00;">Aviso de prueba: así se verá tu resumen diario.</div>` : ''}
      <div style="font-size:20px;font-weight:700;">Hola, ${esc(primerNombre)}</div>
      <div style="margin-top:6px;font-size:14px;line-height:1.45;color:#3b3f3d;">Estas son tus tareas de La Pizarra que requieren atención: <strong>${esc(corto)}</strong>.</div>
      ${seccion('Vencidas', '#b23a2e', vencidas, hoy, appUrl)}
      ${seccion('Vencen hoy', '#1c1f1e', paraHoy, hoy, appUrl)}
      ${seccion('Vencen mañana', '#6b6558', manana, hoy, appUrl)}
      <div style="margin-top:26px;padding-top:14px;border-top:1px solid #dcd6c5;font-size:12px;line-height:1.5;color:#6b6558;">
        <strong style="color:#3b3f3d;">${esc(nombre)}</strong>
        ${pie}
        <div style="margin-top:8px;">Recibes este aviso porque tienes tareas asignadas en La Pizarra de ${esc(nombre)}. Si respondes a este correo, le llega al taller.</div>
      </div>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`

  const bloqueTexto = (titulo, tareas) =>
    tareas.length
      ? `\n${titulo.toUpperCase()} (${tareas.length})\n` +
        tareas.map((t) => `- ${t.titulo} [${(PRIORIDAD[t.prioridad] ?? PRIORIDAD.normal).etiqueta}] ${textoFecha(t.fecha_limite, hoy)}${t.cliente ? ` | Cliente: ${t.cliente.nombre}${t.cliente.telefono ? ` ${t.cliente.telefono}` : ''}` : ''}`).join('\n') +
        '\n'
      : ''

  const texto =
    `Hola, ${primerNombre}. Tareas de La Pizarra que requieren atención: ${corto}.\n` +
    bloqueTexto('Vencidas', vencidas) +
    bloqueTexto('Vencen hoy', paraHoy) +
    bloqueTexto('Vencen mañana', manana) +
    `\nAbrir La Pizarra: ${appUrl}\n\n${nombre}${contacto.length ? ' · ' + contacto.join(' · ') : ''}\n`

  return { asunto, html, texto }
}

// El nombre visible del remitente no puede llevar comillas ni <>.
function nombreRemitente(nombre) {
  return String(nombre || 'La Pizarra').replace(/["<>\r\n]/g, '').trim() || 'La Pizarra'
}

export async function enviarEmail(env, { nombreTaller, para, responderA, asunto, html, texto }) {
  const respuesta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${nombreRemitente(nombreTaller)} <${env.MAIL_FROM}>`,
      to: [para],
      reply_to: responderA || undefined,
      subject: asunto,
      html,
      text: texto,
    }),
  })
  const cuerpo = await respuesta.text()
  return { ok: respuesta.ok, estado: respuesta.status, detalle: respuesta.ok ? '' : cuerpo.slice(0, 300) }
}
