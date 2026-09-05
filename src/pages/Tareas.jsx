import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTareas } from '../hooks/useTareas'
import { useUsuarios } from '../hooks/useUsuarios'
import { useReparacionesClientes } from '../hooks/useReparacionesClientes'
import { useReparacionesActivas } from '../hooks/useReparacionesActivas'
import { useTareasConFecha } from '../hooks/useTareasConFecha'
import { useContadorNotas } from '../hooks/useContadorNotas'
import FilterPill from '../components/FilterPill'
import TaskCard from '../components/TaskCard'
import RepairCard from '../components/RepairCard'
import Calendario from '../components/Calendario'
import Recordatorios from '../components/Recordatorios'
import NewTaskModal from '../components/NewTaskModal'
import ConfirmarHechaModal from '../components/ConfirmarHechaModal'
import TareaDetalle from '../components/TareaDetalle'
import BuildVersion from '../components/BuildVersion'
import { LogoutIcon, PlusIcon } from '../components/icons'

const CONTEXTOS = [
  { value: 'todos', label: 'Todo' },
  { value: 'taller', label: 'Taller' },
  { value: 'personal', label: 'Personal' },
  { value: 'familia', label: 'Familia' },
]

export default function Tareas() {
  const { profile, signOut } = useAuth()
  const { usuarios } = useUsuarios()
  const [vista, setVista] = useState('tareas') // 'tareas' | 'reparaciones' | 'calendario'
  const [contexto, setContexto] = useState('todos')
  const [asignadoA, setAsignadoA] = useState('todos')
  const [mostrarHechas, setMostrarHechas] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  // Datos precargados para el modal cuando se crea una tarea desde una
  // reparacion (ver RepairCard) -- null cuando es "Nueva tarea" normal.
  const [prefillModal, setPrefillModal] = useState(null)
  // Tarea pendiente que se esta por marcar como hecha (abre el modal de
  // confirmacion) y tarea cuyo detalle/bitacora esta abierto -- null
  // cuando ninguno de los dos esta abierto.
  const [tareaConfirmarHecha, setTareaConfirmarHecha] = useState(null)
  const [tareaDetalle, setTareaDetalle] = useState(null)

  const { tareas, loading, error, toggleHecho, crearTarea } = useTareas({ contexto, asignadoA, mostrarHechas })
  // Contexto real del taller (cliente + reparacion activa) para las tareas
  // que tienen client_id -- solo lectura de WheelOS, ver el hook.
  const reparacionesPorCliente = useReparacionesClientes(tareas)
  // Lista completa de reparaciones activas del taller, para la vista nueva.
  const { reparaciones, loading: loadingReparaciones, error: errorReparaciones } = useReparacionesActivas()
  // Cuantas notas tiene cada tarea visible, para el indicador "💬 N".
  const { contador: contadorNotas, refetch: recargarContadorNotas } = useContadorNotas(tareas.map((t) => t.id))
  // Tareas con fecha_limite, para el Calendario -- se pide aca (no adentro
  // de Calendario.jsx) para poder refrescarlo despues de crear una tarea
  // desde cualquier lado, no solo desde el propio calendario.
  const { tareas: tareasConFecha, loading: loadingCalendario, refetch: recargarCalendario } = useTareasConFecha()

  const usuariosPorId = useMemo(() => new Map(usuarios.map((u) => [u.id, u])), [usuarios])

  // Solo owner/admin/technician/secretary pueden crear tareas (misma regla
  // que la politica de RLS de insert) -- viewer no ve el boton.
  const puedeCrear = profile?.role && profile.role !== 'viewer'

  function abrirNuevaTarea() {
    setPrefillModal(null)
    setModalAbierto(true)
  }

  // Desde el boton "Nueva tarea para este dia" del Calendario -- precarga
  // la fecha que se estaba mirando.
  function abrirNuevaTareaEnFecha(fecha) {
    setPrefillModal({ fecha })
    setModalAbierto(true)
  }

  // crearTarea (de useTareas) ya refresca su propia lista -- esto ademas
  // refresca el Calendario, que trae sus datos por separado (ver arriba),
  // asi una tarea con fecha creada desde CUALQUIER lado aparece ahi sin
  // tener que salir y volver a entrar a esa pestaña.
  async function crearTareaYRefrescar(datos) {
    const resultado = await crearTarea(datos)
    if (resultado.ok) recargarCalendario()
    return resultado
  }

  function abrirTareaDesdeReparacion(reparacion) {
    const patin = [reparacion.scooter_brand_snapshot, reparacion.scooter_model_snapshot].filter(Boolean).join(' ')
    setPrefillModal({
      clientId: reparacion.client_id,
      clienteRef: reparacion.client_phone_snapshot,
      clienteNombre: reparacion.client_name_snapshot,
      titulo: [patin, reparacion.client_problem].filter(Boolean).join(' — '),
    })
    setModalAbierto(true)
  }

  function cerrarModal() {
    setModalAbierto(false)
    setPrefillModal(null)
  }

  // Igual que crearTareaYRefrescar arriba: ademas de marcar/reabrir la
  // tarea, refresca el Calendario -- si no, una tarea marcada hecha desde
  // el banner de Recordatorios (o reabierta) seguiria apareciendo ahi
  // hasta salir y volver a entrar a esa pestaña.
  async function toggleHechoYRefrescar(tarea) {
    const resultado = await toggleHecho(tarea)
    recargarCalendario()
    return resultado
  }

  // Tocar el circulo: si la tarea ya esta hecha, reabrirla es instantaneo
  // (sin preguntar nada). Si esta pendiente, se pide confirmar (y de paso
  // se puede dejar una nota) antes de cerrarla -- ver ConfirmarHechaModal.
  function manejarClickCirculo(tarea) {
    if (tarea.estado === 'hecho') {
      toggleHechoYRefrescar(tarea)
    } else {
      setTareaConfirmarHecha(tarea)
    }
  }

  return (
    // max-w-3xl + mx-auto no necesita variante sm: -- en mobile el ancho de
    // pantalla ya es menor a 3xl (48rem/768px), asi que no cambia nada ahi;
    // en tablet/desktop evita que el contenido se estire borde a borde.
    <div className="min-h-screen pb-24 sm:pb-10">
      <div className="max-w-3xl mx-auto">
        <header className="px-4 sm:px-6 pt-6 pb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Placeholder punteado hasta tener el logo real del taller --
                mismo tratamiento que se acordo en el mockup. */}
            <div className="w-11 h-11 rounded-full border-2 border-dashed border-text/30 flex items-center justify-center shrink-0 font-mono text-[9px] text-text/50 text-center leading-tight">
              LOGO
              <br />
              TALLER
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-text">La Pizarra</h1>
              {profile && <p className="text-text/50 text-sm mt-0.5">Hola, {profile.full_name.split(' ')[0]}</p>}
              <BuildVersion className="mt-0.5" />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Boton inline, solo tablet/desktop -- version FAB mobile va aparte, al final. */}
            {puedeCrear && (
              <button
                type="button"
                onClick={abrirNuevaTarea}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-brand text-brand-contrast font-display font-semibold text-sm px-4 py-2 hover:opacity-90"
              >
                <PlusIcon size={16} />
                Nueva tarea
              </button>
            )}
            <button type="button" onClick={signOut} className="text-text/50 hover:text-text p-1" aria-label="Cerrar sesión">
              <LogoutIcon size={20} />
            </button>
          </div>
        </header>

        {/* Avisa de tareas vencidas o para hoy, sin importar en que
            pestaña estes -- ver Recordatorios.jsx. */}
        <Recordatorios tareas={tareasConFecha} onAbrirDetalle={setTareaDetalle} />

        {/* Cambia entre la lista de tareas de siempre y las reparaciones
            activas del taller (leidas de WheelOS, de solo lectura). */}
        <div className="px-4 sm:px-6 flex gap-2">
          <FilterPill label="Tareas" active={vista === 'tareas'} onClick={() => setVista('tareas')} />
          <FilterPill label="Reparaciones" active={vista === 'reparaciones'} onClick={() => setVista('reparaciones')} />
          <FilterPill label="Calendario" active={vista === 'calendario'} onClick={() => setVista('calendario')} />
        </div>

        {vista === 'tareas' && (
          <>
            {/* overflow-x-auto en mobile (scroll horizontal); en sm+ pasa a
                flex-wrap porque ya sobra ancho para acomodar los pills en filas. */}
            <div className="px-4 sm:px-6 mt-3 flex gap-2 overflow-x-auto sm:overflow-visible sm:flex-wrap pb-1">
              {CONTEXTOS.map((c) => (
                <FilterPill key={c.value} label={c.label} active={contexto === c.value} onClick={() => setContexto(c.value)} />
              ))}
            </div>

            <div className="px-4 sm:px-6 mt-2 flex gap-2 overflow-x-auto sm:overflow-visible sm:flex-wrap pb-1">
              <FilterPill label="Todos" active={asignadoA === 'todos'} onClick={() => setAsignadoA('todos')} />
              {usuarios.map((u) => (
                <FilterPill
                  key={u.id}
                  label={u.full_name.split(' ')[0]}
                  active={asignadoA === u.id}
                  onClick={() => setAsignadoA(u.id)}
                />
              ))}
            </div>

            <label className="px-4 sm:px-6 mt-3 flex items-center gap-2 text-sm text-text/60">
              <input
                type="checkbox"
                checked={mostrarHechas}
                onChange={(e) => setMostrarHechas(e.target.checked)}
                className="accent-brand"
              />
              Mostrar hechas
            </label>

            <main className="px-4 sm:px-6 mt-4 space-y-2.5">
              {loading && <p className="text-text/40 text-sm">Cargando…</p>}
              {error && <p className="text-sm text-priority-urgente">{error.message}</p>}
              {!loading && !error && tareas.length === 0 && (
                <p className="text-text/40 text-sm">No hay tareas para este filtro.</p>
              )}

              {tareas.map((tarea) => (
                <TaskCard
                  key={tarea.id}
                  tarea={tarea}
                  usuariosPorId={usuariosPorId}
                  reparacionesPorCliente={reparacionesPorCliente}
                  notaCount={contadorNotas.get(tarea.id) ?? 0}
                  onCircleClick={manejarClickCirculo}
                  onAbrirDetalle={setTareaDetalle}
                />
              ))}
            </main>
          </>
        )}

        {vista === 'reparaciones' && (
          <main className="px-4 sm:px-6 mt-4 space-y-2.5">
            {loadingReparaciones && <p className="text-text/40 text-sm">Cargando…</p>}
            {errorReparaciones && <p className="text-sm text-priority-urgente">{errorReparaciones.message}</p>}
            {!loadingReparaciones && !errorReparaciones && reparaciones.length === 0 && (
              <p className="text-text/40 text-sm">No hay reparaciones activas ahora mismo.</p>
            )}

            {reparaciones.map((reparacion) => (
              <RepairCard
                key={reparacion.id}
                reparacion={reparacion}
                puedeCrear={puedeCrear}
                onCrearTarea={abrirTareaDesdeReparacion}
              />
            ))}
          </main>
        )}

        {vista === 'calendario' && (
          <Calendario
            tareas={tareasConFecha}
            loading={loadingCalendario}
            usuariosPorId={usuariosPorId}
            reparacionesPorCliente={reparacionesPorCliente}
            contadorNotas={contadorNotas}
            onCircleClick={manejarClickCirculo}
            onAbrirDetalle={setTareaDetalle}
            onCrearTareaEnFecha={abrirNuevaTareaEnFecha}
          />
        )}
      </div>

      {/* FAB flotante, solo mobile -- en sm+ el boton equivalente ya esta en el header. */}
      {puedeCrear && (
        <button
          type="button"
          onClick={abrirNuevaTarea}
          className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-brand text-brand-contrast shadow-lg flex items-center justify-center"
          aria-label="Nueva tarea"
        >
          <PlusIcon size={24} />
        </button>
      )}

      {modalAbierto && (
        <NewTaskModal usuarios={usuarios} onClose={cerrarModal} onCreate={crearTareaYRefrescar} prefill={prefillModal} />
      )}

      {tareaConfirmarHecha && (
        <ConfirmarHechaModal
          tarea={tareaConfirmarHecha}
          onClose={() => setTareaConfirmarHecha(null)}
          onToggleHecho={toggleHechoYRefrescar}
          onNotaAgregada={recargarContadorNotas}
        />
      )}

      {tareaDetalle && (
        <TareaDetalle
          tarea={tareaDetalle}
          onClose={() => setTareaDetalle(null)}
          onNotaAgregada={recargarContadorNotas}
        />
      )}
    </div>
  )
}
