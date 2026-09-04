import { useMemo, useState } from 'react'
import TaskCard from './TaskCard'
import { PlusIcon } from './icons'
import { formatearFechaLocal, soloFecha } from '../utils/fechas'

const DIAS_SEMANA_CORTO = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

// Clases estaticas (no `bg-priority-${x}`) a proposito: Tailwind escanea el
// texto fuente buscando nombres de clase literales -- una armada en tiempo
// de ejecucion con un template string no se detecta y no genera CSS real
// (la misma causa raiz que dejo invisible el circulo de "hecha" hace un
// tiempo). "baja" y "nuevo" comparten color con "normal" fuera de la tabla
// de prioridades principal.
const CLASE_BG_PRIORIDAD = {
  urgente: 'bg-priority-urgente',
  seguimiento: 'bg-priority-seguimiento',
  normal: 'bg-priority-normal',
  baja: 'bg-priority-normal',
  nuevo: 'bg-priority-normal',
}

// Para el circulo de conteo en Vista Semana: que tan urgente es lo mas
// urgente que hay ese dia (numero mas bajo = mas urgente).
const RANGO_PRIORIDAD = { urgente: 0, seguimiento: 1, normal: 2, baja: 2, nuevo: 2 }

function prioridadMasAlta(tareasDelDia) {
  let mejor = null
  let mejorRango = Infinity
  for (const tarea of tareasDelDia) {
    const rango = RANGO_PRIORIDAD[tarea.prioridad] ?? 2
    if (rango < mejorRango) {
      mejorRango = rango
      mejor = tarea.prioridad
    }
  }
  return mejor
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function inicioDeSemana(date) {
  const offset = (date.getDay() + 6) % 7 // Lunes=0 ... Domingo=6
  const inicio = new Date(date)
  inicio.setDate(date.getDate() - offset)
  return inicio
}

function sumarDias(date, cantidad) {
  const nueva = new Date(date)
  nueva.setDate(date.getDate() + cantidad)
  return nueva
}

// Calendario de tareas con fecha_limite: agendar una cita (ej.
// matriculacion de un cliente) o poner cuando debe hacerse algo. Las
// reparaciones de WheelOS NO aparecen aca a proposito -- no tienen una
// fecha de entrega real en la base (ver ROADMAP.md); se gestionan desde
// WheelOS, y la pestaña "Reparaciones" ya cubre verlas/crear tareas. No hay
// campo de hora ni distincion tarea/cita en los datos -- todo el calendario
// usa exclusivamente los 3 colores de prioridad (diseño v2, 2026-09-05).
//
// `tareas`/`loading` vienen de Tareas.jsx (useTareasConFecha vive alla,
// igual que el resto de los datos) para que al crear una tarea desde
// cualquier lado se pueda refrescar esto tambien -- si el hook viviera
// aca adentro, no se enteraba de tareas nuevas creadas por el boton
// generico de "Nueva tarea" sin salir y volver a entrar a esta pestaña.
export default function Calendario({
  tareas,
  loading,
  usuariosPorId,
  reparacionesPorCliente,
  contadorNotas,
  onCircleClick,
  onAbrirDetalle,
  onCrearTareaEnFecha,
}) {
  const [vistaCal, setVistaCal] = useState('mes') // 'dia' | 'semana' | 'mes'
  const [fechaAncla, setFechaAncla] = useState(() => new Date())

  const tareasPorDia = useMemo(() => {
    const mapa = new Map()
    for (const tarea of tareas) {
      const clave = soloFecha(tarea.fecha_limite)
      if (!mapa.has(clave)) mapa.set(clave, [])
      mapa.get(clave).push(tarea)
    }
    return mapa
  }, [tareas])

  const hoyClave = formatearFechaLocal(new Date())

  function irADia(date) {
    setFechaAncla(date)
    setVistaCal('dia')
  }

  function navegar(delta) {
    if (vistaCal === 'mes') {
      setFechaAncla((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
    } else if (vistaCal === 'semana') {
      setFechaAncla((prev) => sumarDias(prev, delta * 7))
    } else {
      setFechaAncla((prev) => sumarDias(prev, delta))
    }
  }

  return (
    <div className="px-4 sm:px-6 mt-4">
      {/* Dia / Semana / Mes -- selector propio del calendario, distinto de
          las pestañas Tareas/Reparaciones/Calendario de mas arriba. */}
      <div className="flex gap-1 mb-4 bg-text/5 rounded-full p-1 w-fit">
        {[
          { value: 'dia', label: 'Día' },
          { value: 'semana', label: 'Semana' },
          { value: 'mes', label: 'Mes' },
        ].map((v) => (
          <button
            key={v.value}
            type="button"
            onClick={() => setVistaCal(v.value)}
            className={
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors ' +
              (vistaCal === v.value ? 'bg-brand text-brand-contrast' : 'text-text/60 hover:text-text')
            }
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => navegar(-1)} className="text-text/60 hover:text-text px-2 py-1 text-lg">
          ‹
        </button>
        <p className="font-display font-semibold text-text">
          {vistaCal === 'mes' && `${capitalizar(MESES[fechaAncla.getMonth()])} ${fechaAncla.getFullYear()}`}
          {vistaCal === 'semana' && <TituloSemana fechaAncla={fechaAncla} />}
          {vistaCal === 'dia' &&
            capitalizar(fechaAncla.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }))}
        </p>
        <button type="button" onClick={() => navegar(1)} className="text-text/60 hover:text-text px-2 py-1 text-lg">
          ›
        </button>
      </div>

      {vistaCal === 'mes' && (
        <VistaMes
          fechaAncla={fechaAncla}
          tareasPorDia={tareasPorDia}
          hoyClave={hoyClave}
          loading={loading}
          usuariosPorId={usuariosPorId}
          reparacionesPorCliente={reparacionesPorCliente}
          contadorNotas={contadorNotas}
          onCircleClick={onCircleClick}
          onAbrirDetalle={onAbrirDetalle}
          onCrearTareaEnFecha={onCrearTareaEnFecha}
        />
      )}

      {vistaCal === 'semana' && (
        <VistaSemana fechaAncla={fechaAncla} tareasPorDia={tareasPorDia} hoyClave={hoyClave} onSeleccionarDia={irADia} />
      )}

      {vistaCal === 'dia' && (
        <ListaTareasDelDia
          tareas={tareasPorDia.get(formatearFechaLocal(fechaAncla)) ?? []}
          loading={loading}
          usuariosPorId={usuariosPorId}
          reparacionesPorCliente={reparacionesPorCliente}
          contadorNotas={contadorNotas}
          onCircleClick={onCircleClick}
          onAbrirDetalle={onAbrirDetalle}
          onCrear={() => onCrearTareaEnFecha(formatearFechaLocal(fechaAncla))}
        />
      )}
    </div>
  )
}

function TituloSemana({ fechaAncla }) {
  const inicio = inicioDeSemana(fechaAncla)
  const fin = sumarDias(inicio, 6)
  const mismoMes = inicio.getMonth() === fin.getMonth()
  return mismoMes
    ? `${inicio.getDate()} – ${fin.getDate()} de ${MESES[inicio.getMonth()]}`
    : `${inicio.getDate()} ${MESES[inicio.getMonth()].slice(0, 3)} – ${fin.getDate()} ${MESES[fin.getMonth()].slice(0, 3)}`
}

// Incluye dias del mes anterior/siguiente para completar la primera y
// ultima semana (antes quedaban casillas vacias) -- se marcan con
// `delMes: false` para pintarlos atenuados, no se sacan del todo.
function construirGrillaMes(fechaAncla) {
  const primerDia = new Date(fechaAncla.getFullYear(), fechaAncla.getMonth(), 1)
  const ultimoDia = new Date(fechaAncla.getFullYear(), fechaAncla.getMonth() + 1, 0)
  const offsetInicio = (primerDia.getDay() + 6) % 7
  const celdas = []

  for (let i = offsetInicio; i > 0; i--) {
    celdas.push({ fecha: sumarDias(primerDia, -i), delMes: false })
  }
  for (let d = 1; d <= ultimoDia.getDate(); d++) {
    celdas.push({ fecha: new Date(fechaAncla.getFullYear(), fechaAncla.getMonth(), d), delMes: true })
  }
  // Completa hasta el proximo multiplo de 7 con dias del mes siguiente.
  let extra = 1
  while (celdas.length % 7 !== 0) {
    celdas.push({ fecha: sumarDias(ultimoDia, extra), delMes: false })
    extra++
  }
  return celdas
}

function VistaMes({
  fechaAncla,
  tareasPorDia,
  hoyClave,
  loading,
  usuariosPorId,
  reparacionesPorCliente,
  contadorNotas,
  onCircleClick,
  onAbrirDetalle,
  onCrearTareaEnFecha,
}) {
  const celdas = useMemo(() => construirGrillaMes(fechaAncla), [fechaAncla])
  // Dia elegido dentro de Mes -- muestra su lista debajo de la cuadricula
  // SIN cambiar de pestaña (antes tocar un dia saltaba directo a Dia).
  // Arranca en hoy para no mostrar la seccion vacia sin que el usuario
  // toque nada.
  const [diaSeleccionado, setDiaSeleccionado] = useState(() => new Date())
  const claveSeleccionada = formatearFechaLocal(diaSeleccionado)

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-text/50 font-mono font-bold mb-1.5">
        {DIAS_SEMANA_CORTO.map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {celdas.map(({ fecha, delMes }) => {
          const clave = formatearFechaLocal(fecha)
          const tareasDelDia = tareasPorDia.get(clave) ?? []
          const esHoy = clave === hoyClave
          const esSeleccionado = clave === claveSeleccionada
          return (
            <button
              key={clave}
              type="button"
              onClick={() => setDiaSeleccionado(fecha)}
              className={
                'bg-bg aspect-square rounded-lg border flex flex-col items-center justify-center gap-1 p-1.5 transition-colors hover:border-text/30 ' +
                (esHoy ? 'ring-2 ring-brand ring-inset border-transparent' : 'border-text/10') +
                (delMes ? ' opacity-30' : '') +
                (esSeleccionado && !esHoy ? ' border-text/40' : '')
              }
            >
              <span className={'text-sm ' + (esHoy ? 'font-bold text-brand' : 'text-text/80')}>{fecha.getDate()}</span>
              <PuntosPrioridad tareas={tareasDelDia} />
            </button>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-text/10">
        <p className="font-display font-semibold text-text text-sm mb-2.5">
          {capitalizar(diaSeleccionado.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }))}
        </p>
        <ListaTareasDelDia
          tareas={tareasPorDia.get(claveSeleccionada) ?? []}
          loading={loading}
          usuariosPorId={usuariosPorId}
          reparacionesPorCliente={reparacionesPorCliente}
          contadorNotas={contadorNotas}
          onCircleClick={onCircleClick}
          onAbrirDetalle={onAbrirDetalle}
          onCrear={() => onCrearTareaEnFecha(claveSeleccionada)}
        />
      </div>
    </div>
  )
}

// Un punto de color por tarea, segun su prioridad real -- dice QUE tipo de
// dia es (hay algo urgente ese dia?), no solo cuantas tareas hay.
function PuntosPrioridad({ tareas }) {
  if (tareas.length === 0) return null
  const MAX_PUNTOS = 4
  const visibles = tareas.slice(0, MAX_PUNTOS)
  const restantes = tareas.length - visibles.length
  return (
    <span className="flex items-center gap-1 flex-wrap justify-center">
      {visibles.map((tarea) => (
        <span
          key={tarea.id}
          // inline-block es obligatorio aca: un <span> es inline por
          // defecto, y sin contenido de texto un elemento inline IGNORA
          // width/height del todo -- por eso los puntos no se veian antes.
          className={'inline-block w-2.5 h-2.5 rounded-full shrink-0 ' + (CLASE_BG_PRIORIDAD[tarea.prioridad] ?? CLASE_BG_PRIORIDAD.normal)}
        />
      ))}
      {restantes > 0 && <span className="text-[9px] leading-none text-text/50">+{restantes}</span>}
    </span>
  )
}

function VistaSemana({ fechaAncla, tareasPorDia, hoyClave, onSeleccionarDia }) {
  const dias = useMemo(() => {
    const inicio = inicioDeSemana(fechaAncla)
    return Array.from({ length: 7 }, (_, i) => sumarDias(inicio, i))
  }, [fechaAncla])

  return (
    <div className="grid grid-flow-col overflow-x-auto gap-2 [grid-auto-columns:minmax(90px,1fr)] pb-1">
      {dias.map((dia) => {
        const clave = formatearFechaLocal(dia)
        const tareasDelDia = tareasPorDia.get(clave) ?? []
        const esHoy = clave === hoyClave
        const mejorPrioridad = prioridadMasAlta(tareasDelDia)
        return (
          <button
            key={clave}
            type="button"
            onClick={() => onSeleccionarDia(dia)}
            className={
              'bg-bg border rounded-lg p-2.5 flex flex-col items-center gap-2 min-h-[76px] transition-colors hover:border-text/30 ' +
              (esHoy ? 'border-brand' : 'border-text/10')
            }
          >
            <span className="text-xs font-medium text-text/80 capitalize text-center">
              {dia.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
            </span>
            {tareasDelDia.length > 0 && (
              <span
                className={
                  'w-5.5 h-5.5 rounded-full flex items-center justify-center text-white text-xs font-bold ' +
                  (CLASE_BG_PRIORIDAD[mejorPrioridad] ?? CLASE_BG_PRIORIDAD.normal)
                }
              >
                {tareasDelDia.length}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function ListaTareasDelDia({
  tareas,
  loading,
  usuariosPorId,
  reparacionesPorCliente,
  contadorNotas,
  onCircleClick,
  onAbrirDetalle,
  onCrear,
}) {
  return (
    <div className="space-y-2.5 pb-4">
      <button
        type="button"
        onClick={onCrear}
        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-text/20 text-text/60 hover:text-text hover:border-text/40 text-sm py-2.5 transition-colors"
      >
        <PlusIcon size={14} />
        Nueva tarea para este día
      </button>

      {loading && <p className="text-text/40 text-sm">Cargando…</p>}
      {!loading && tareas.length === 0 && <p className="text-text/40 text-sm">No hay tareas con vencimiento hoy.</p>}
      {tareas.map((tarea) => (
        <TaskCard
          key={tarea.id}
          tarea={tarea}
          usuariosPorId={usuariosPorId}
          reparacionesPorCliente={reparacionesPorCliente}
          notaCount={contadorNotas.get(tarea.id) ?? 0}
          onCircleClick={onCircleClick}
          onAbrirDetalle={onAbrirDetalle}
        />
      ))}
    </div>
  )
}
