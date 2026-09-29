// "YYYY-MM-DD" en hora LOCAL (no UTC) -- fecha_limite es tipo `date` en
// Postgres, supabase-js la devuelve tal cual ese string, sin conversion de
// zona horaria. Compartido entre Calendario.jsx y AvisosBell.jsx.
export function formatearFechaLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Se queda solo con "YYYY-MM-DD" de un fecha_limite -- por si algun
// registro viejo (cargado antes de que el formulario tuviera el campo de
// fecha) quedo con hora/zona pegada. Sin esto, la comparacion exacta de
// claves en el Map de Calendario.jsx fallaba en silencio: la tarea existia
// y el banner de Recordatorios (que compara con < / ===) la mostraba bien,
// pero el dia del calendario quedaba vacio porque "2026-09-03T00:00:00" no
// es === "2026-09-03" (mismo caso que valida la campanita de avisos).
export function soloFecha(valor) {
  return typeof valor === 'string' ? valor.slice(0, 10) : valor
}

// Limites razonables para una fecha limite. El selector de fecha del
// navegador deja escribir años de 6 cifras (paso: "20206-03-06" en una
// tarea real) -- se usan como min/max del input y se comprueban al guardar.
export const FECHA_MINIMA = '2020-01-01'
export const FECHA_MAXIMA = '2100-12-31'

// Devuelve un mensaje de error, o null si la fecha ("" = sin fecha) es valida.
export function errorDeFecha(iso) {
  if (!iso) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || Number.isNaN(Date.parse(iso))) return 'La fecha no es válida.'
  if (iso < FECHA_MINIMA || iso > FECHA_MAXIMA) return 'La fecha debe estar entre 2020 y 2100.'
  return null
}

// "Hoy" y "Mañana" para los atajos del formulario, en hora local.
export function fechaRelativa(desplazamientoDias) {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + desplazamientoDias)
  return formatearFechaLocal(fecha)
}

// Compartido entre AvisosBell.jsx y TarjetasResumen.jsx -- mismo calculo de
// "vencidas" y "para hoy" en un solo lugar, para que el numero de la
// campanita y el de la tarjeta nunca se puedan desincronizar.
export function tareasVencidasYHoy(tareas) {
  const hoyClave = formatearFechaLocal(new Date())
  const pendientes = tareas.filter((t) => t.estado === 'pendiente')
  return {
    vencidas: pendientes.filter((t) => soloFecha(t.fecha_limite) < hoyClave),
    hoy: pendientes.filter((t) => soloFecha(t.fecha_limite) === hoyClave),
  }
}

// Lunes 00:00 de esta semana, en hora local -- para "hechas esta semana".
export function inicioDeSemana() {
  const ahora = new Date()
  const diaSemana = ahora.getDay() // 0 = domingo ... 6 = sabado
  const diasDesdeElLunes = diaSemana === 0 ? 6 : diaSemana - 1
  const lunes = new Date(ahora)
  lunes.setDate(ahora.getDate() - diasDesdeElLunes)
  lunes.setHours(0, 0, 0, 0)
  return lunes
}
