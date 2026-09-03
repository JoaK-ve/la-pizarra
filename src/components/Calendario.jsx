import { useMemo, useState } from 'react'
import { useTareasConFecha } from '../hooks/useTareasConFecha'
import TaskCard from './TaskCard'

const DIAS_SEMANA_CORTO = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

// "YYYY-MM-DD" en hora LOCAL (no UTC) -- fecha_limite es tipo `date` en
// Postgres, supabase-js la devuelve tal cual ese string, sin conversion de
// zona horaria.
function formatearFechaLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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

// Insignia con el numero de tareas de un dia -- reemplaza el punto suelto
// de la version anterior. Se usa en la vista Mes (esquina del dia) y en
// la vista Semana (al lado de cada fila).
function InsigniaTareas({ cantidad, contraste }) {
  if (!cantidad) return null
  return (
    <span
      className={
        'min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm ' +
        (contraste ? 'bg-bg text-amber' : 'bg-amber text-bg')
      }
    >
      {cantidad}
    </span>
  )
}

// Calendario de tareas con fecha_limite: agendar una cita (ej.
// matriculacion de un cliente) o poner cuando debe hacerse algo. Las
// reparaciones de WheelOS NO aparecen aca a proposito -- no tienen una
// fecha de entrega real en la base (ver ROADMAP.md); se gestionan desde
// WheelOS, y la pestaña "Reparaciones" ya cubre verlas/crear tareas.
export default function Calendario({ usuariosPorId, reparacionesPorCliente, contadorNotas, onCircleClick, onAbrirDetalle }) {
  const { tareas, loading } = useTareasConFecha()
  const [vistaCal, setVistaCal] = useState('mes') // 'dia' | 'semana' | 'mes'
  const [fechaAncla, setFechaAncla] = useState(() => new Date())

  const tareasPorDia = useMemo(() => {
    const mapa = new Map()
    for (const tarea of tareas) {
      const clave = tarea.fecha_limite
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
      <div className="flex gap-1 mb-4 bg-paper/5 rounded-full p-1 w-fit">
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
              'px-3 py-1 rounded-full text-sm font-medium transition-colors ' +
              (vistaCal === v.value ? 'bg-amber text-bg' : 'text-paper/60 hover:text-paper')
            }
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => navegar(-1)} className="text-paper/60 hover:text-paper px-2 py-1 text-lg">
          ‹
        </button>
        <p className="font-display font-semibold text-paper">
          {vistaCal === 'mes' && `${capitalizar(MESES[fechaAncla.getMonth()])} ${fechaAncla.getFullYear()}`}
          {vistaCal === 'semana' && <TituloSemana fechaAncla={fechaAncla} />}
          {vistaCal === 'dia' &&
            capitalizar(fechaAncla.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }))}
        </p>
        <button type="button" onClick={() => navegar(1)} className="text-paper/60 hover:text-paper px-2 py-1 text-lg">
          ›
        </button>
      </div>

      {vistaCal === 'mes' && (
        <VistaMes fechaAncla={fechaAncla} tareasPorDia={tareasPorDia} hoyClave={hoyClave} onSeleccionarDia={irADia} />
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

function VistaMes({ fechaAncla, tareasPorDia, hoyClave, onSeleccionarDia }) {
  const dias = useMemo(() => {
    const primerDia = new Date(fechaAncla.getFullYear(), fechaAncla.getMonth(), 1)
    const ultimoDia = new Date(fechaAncla.getFullYear(), fechaAncla.getMonth() + 1, 0)
    const offsetInicio = (primerDia.getDay() + 6) % 7
    const celdas = Array(offsetInicio).fill(null)
    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      celdas.push(new Date(fechaAncla.getFullYear(), fechaAncla.getMonth(), d))
    }
    return celdas
  }, [fechaAncla])

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-paper/40 font-mono mb-1">
        {DIAS_SEMANA_CORTO.map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {dias.map((dia, i) => {
          if (!dia) return <div key={`vacio-${i}`} />
          const clave = formatearFechaLocal(dia)
          const cantidad = tareasPorDia.get(clave)?.length ?? 0
          const esHoy = clave === hoyClave
          return (
            <button
              key={clave}
              type="button"
              onClick={() => onSeleccionarDia(dia)}
              className={
                'aspect-square rounded-xl text-sm flex flex-col items-center justify-center gap-0.5 transition-colors ' +
                (esHoy ? 'bg-amber text-bg font-bold' : 'text-paper/80 hover:bg-paper/10')
              }
            >
              {dia.getDate()}
              <InsigniaTareas cantidad={cantidad} contraste={esHoy} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function VistaSemana({ fechaAncla, tareasPorDia, hoyClave, onSeleccionarDia }) {
  const dias = useMemo(() => {
    const inicio = inicioDeSemana(fechaAncla)
    return Array.from({ length: 7 }, (_, i) => sumarDias(inicio, i))
  }, [fechaAncla])

  return (
    <div className="space-y-2">
      {dias.map((dia) => {
        const clave = formatearFechaLocal(dia)
        const cantidad = tareasPorDia.get(clave)?.length ?? 0
        const esHoy = clave === hoyClave
        return (
          <button
            key={clave}
            type="button"
            onClick={() => onSeleccionarDia(dia)}
            className={
              'w-full flex items-center justify-between rounded-xl px-4 py-3 text-left transition-colors ' +
              (esHoy ? 'bg-amber text-bg' : 'bg-paper/5 text-paper hover:bg-paper/10')
            }
          >
            <span className="font-medium capitalize">
              {dia.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}
            </span>
            <InsigniaTareas cantidad={cantidad} contraste={esHoy} />
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
}) {
  return (
    <div className="space-y-2.5 pb-4">
      {loading && <p className="text-paper/40 text-sm">Cargando…</p>}
      {!loading && tareas.length === 0 && <p className="text-paper/40 text-sm">Sin tareas con esta fecha.</p>}
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
