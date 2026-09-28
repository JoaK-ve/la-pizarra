// Que reparacion mostrar en una tarea. Si la tarea esta enlazada a una
// reparacion concreta (`repair_id`) es esa, este activa o ya entregada; si
// no (tareas creadas a mano, o antes de que existiera el enlace), la
// reparacion activa mas reciente del cliente, como siempre.
// `entrada` es el valor del Map de useReparacionesClientes.
export function reparacionDeTarea(entrada, tarea) {
  if (!entrada) return null
  if (tarea.repair_id) return entrada.reparaciones.find((r) => r.id === tarea.repair_id) ?? entrada.reparacion
  return entrada.reparacion
}
