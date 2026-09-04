// "YYYY-MM-DD" en hora LOCAL (no UTC) -- fecha_limite es tipo `date` en
// Postgres, supabase-js la devuelve tal cual ese string, sin conversion de
// zona horaria. Compartido entre Calendario.jsx y Recordatorios.jsx.
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
// es === "2026-09-03".
export function soloFecha(valor) {
  return typeof valor === 'string' ? valor.slice(0, 10) : valor
}
