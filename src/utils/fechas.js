// "YYYY-MM-DD" en hora LOCAL (no UTC) -- fecha_limite es tipo `date` en
// Postgres, supabase-js la devuelve tal cual ese string, sin conversion de
// zona horaria. Compartido entre Calendario.jsx y Recordatorios.jsx.
export function formatearFechaLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
