import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTareas } from '../hooks/useTareas'
import { useUsuarios } from '../hooks/useUsuarios'
import { useReparacionesClientes } from '../hooks/useReparacionesClientes'
import { useReparacionesActivas } from '../hooks/useReparacionesActivas'
import { useTareasConFecha } from '../hooks/useTareasConFecha'
import { useContadorNotas } from '../hooks/useContadorNotas'
import { useWorkshop } from '../hooks/useWorkshop'
import { useNotificacionesPush } from '../hooks/useNotificacionesPush'
import { useAbrirTareaDesdeEnlace } from '../hooks/useAbrirTareaDesdeEnlace'
import FilterPill from '../components/FilterPill'
import Buscador from '../components/Buscador'
import TaskCard from '../components/TaskCard'
import RepairCard from '../components/RepairCard'
import Calendario from '../components/Calendario'
import AvisosBell from '../components/AvisosBell'
import MiDia from '../components/MiDia'
import NecesitaAtencion from '../components/NecesitaAtencion'
import { reparacionesQueNecesitanAtencion } from '../utils/atencion'
import { fechaRelativa } from '../utils/fechas'
import { avisarAsignacion } from '../lib/avisos'
import Toast from '../components/Toast'
import { useTareasPendientes } from '../hooks/useTareasPendientes'
import { useToast } from '../hooks/useToast'
import NewTaskModal from '../components/NewTaskModal'
import ConfirmarHechaModal from '../components/ConfirmarHechaModal'
import TareaDetalle from '../components/TareaDetalle'
import BuildVersion from '../components/BuildVersion'
import { BellIcon, PlusIcon } from '../components/icons'
import Ajustes from '../components/Ajustes'
import ProfileMenu from '../components/ProfileMenu'

export default function Tareas() {
  const { profile, signOut } = useAuth()
  const { usuarios } = useUsuarios()
  const { workshop } = useWorkshop()
  // Pestaña del navegador con el nombre del taller de esta persona.
  useEffect(() => {
    document.title = workshop?.fantasy_name ? `La Pizarra · ${workshop.fantasy_name}` : 'La Pizarra'
  }, [workshop?.fantasy_name])
  const {
    soportado: pushSoportado,
    permiso: pushPermiso,
    activando: activandoPush,
    error: pushError,
    activar: activarPush,
  } = useNotificacionesPush()
  const [vista, setVista] = useState('midia') // 'midia' | 'tareas' | 'reparaciones' | 'calendario'
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
  const [ajustesAbiertos, setAjustesAbiertos] = useState(false)
  // Enlaces de correos/push: /?tarea=<id> abre directamente esa tarea.
  useAbrirTareaDesdeEnlace(setTareaDetalle)

  const { toast, mostrar: mostrarToast, cerrar: cerrarToast } = useToast()
  const { tareas, loading, error, toggleHecho, crearTarea, editarTarea, borrarTarea } = useTareas({
    // El filtro por contexto (taller/personal/familia) se quito de la
    // pantalla: el 100% de las tareas reales son "taller". La columna y la
    // regla de RLS de tareas personales siguen intactas.
    contexto: 'todos',
    asignadoA,
    mostrarHechas,
  })
  // Todas las pendientes sin filtrar, para "Mi dia" (la lista de arriba
  // cambia con los filtros de la pestaña Tareas).
  const { tareas: pendientes, loading: loadingPendientes, refetch: recargarPendientes } = useTareasPendientes()
  // Tareas visibles en CUALQUIERA de las dos listas (sin repetir), para pedir
  // una sola vez el contexto de cliente y el contador de notas de todas.
  const tareasVisibles = useMemo(() => [...new Map([...tareas, ...pendientes].map((t) => [t.id, t])).values()], [tareas, pendientes])
  // Contexto real del taller (cliente + reparacion activa) para las tareas
  // que tienen client_id -- solo lectura de WheelOS, ver el hook.
  const reparacionesPorCliente = useReparacionesClientes(tareasVisibles)
  // Lista completa de reparaciones activas del taller, para la vista nueva.
  const { reparaciones, loading: loadingReparaciones, error: errorReparaciones } = useReparacionesActivas()
  // Cuantas notas tiene cada tarea visible, para el indicador "💬 N".
  const { contador: contadorNotas, refetch: recargarContadorNotas } = useContadorNotas(tareasVisibles.map((t) => t.id))
  // Tareas con fecha_limite, para el Calendario -- se pide aca (no adentro
  // de Calendario.jsx) para poder refrescarlo despues de crear una tarea
  // desde cualquier lado, no solo desde el propio calendario.
  const { tareas: tareasConFecha, loading: loadingCalendario, refetch: recargarCalendario } = useTareasConFecha()

  const usuariosPorId = useMemo(() => new Map(usuarios.map((u) => [u.id, u])), [usuarios])

  // Cuantas tareas pendientes tiene cada reparacion (por `repair_id`), para
  // avisar en la tarjeta de la reparacion y no duplicar tareas sin querer.
  const tareasAbiertasPorReparacion = useMemo(() => {
    const cuenta = new Map()
    for (const t of pendientes) if (t.repair_id) cuenta.set(t.repair_id, (cuenta.get(t.repair_id) ?? 0) + 1)
    return cuenta
  }, [pendientes])

  // Reparaciones quietas mas dias de los que el taller tiene configurados en
  // WheelOS (alert_days_*), sin tarea abierta -- ver utils/atencion.js.
  const necesitanAtencion = useMemo(
    () => reparacionesQueNecesitanAtencion(reparaciones, workshop, tareasAbiertasPorReparacion),
    [reparaciones, workshop, tareasAbiertasPorReparacion],
  )

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

  // El Calendario y "Mi dia" traen sus datos por su cuenta: hay que
  // refrescarlos a mano despues de cualquier cambio en una tarea.
  function recargarListas() {
    recargarCalendario()
    recargarPendientes()
  }

  // crearTarea (de useTareas) ya refresca su propia lista -- esto ademas
  // refresca el Calendario, que trae sus datos por separado (ver arriba),
  // asi una tarea con fecha creada desde CUALQUIER lado aparece ahi sin
  // tener que salir y volver a entrar a esa pestaña.
  async function crearTareaYRefrescar(datos) {
    const resultado = await crearTarea(datos)
    if (resultado.ok) {
      recargarListas()
      avisarSiCorresponde(resultado.id, datos.asignadoA, resultado.creadaPor)
    }
    return resultado
  }

  // Avisa (push + correo) a la persona a la que se le asigna una tarea, salvo
  // que se la asigne a si misma. No se espera: el formulario no debe quedarse
  // esperando el envio; el resultado sale despues como aviso emergente.
  async function avisarSiCorresponde(tareaId, asignadoA, quienLaAsigna) {
    if (!asignadoA || asignadoA === quienLaAsigna) return
    const nombre = usuariosPorId.get(asignadoA)?.full_name.split(' ')[0] ?? 'la persona'
    const resultado = await avisarAsignacion(tareaId, nombre)
    if (resultado.texto) mostrarToast(resultado.texto, resultado.ok ? 'ok' : 'error')
  }

  function abrirTareaDesdeReparacion(reparacion) {
    const patin = [reparacion.scooter_brand_snapshot, reparacion.scooter_model_snapshot].filter(Boolean).join(' ')
    setPrefillModal({
      clientId: reparacion.client_id,
      repairId: reparacion.id,
      clienteRef: reparacion.client_phone_snapshot,
      clienteNombre: reparacion.client_name_snapshot,
      titulo: [patin, reparacion.client_problem].filter(Boolean).join(' — '),
    })
    setModalAbierto(true)
  }

  // Desde "Necesitan atencion": la tarea sale ya preparada -- titulo segun el
  // caso, para hoy, y con la prioridad que corresponde (una reparacion
  // parada pide seguimiento; una terminada sin recoger, un aviso normal).
  function abrirTareaDesdeAtencion({ tipo, reparacion }) {
    const patin = [reparacion.scooter_brand_snapshot, reparacion.scooter_model_snapshot].filter(Boolean).join(' ')
    const cliente = reparacion.client_name_snapshot || 'el cliente'
    setPrefillModal({
      clientId: reparacion.client_id,
      repairId: reparacion.id,
      clienteRef: reparacion.client_phone_snapshot,
      clienteNombre: reparacion.client_name_snapshot,
      titulo:
        tipo === 'terminado'
          ? `Avisar a ${cliente}: su ${patin || 'patinete'} está listo para recoger`
          : `Revisar reparación parada: ${patin || 'patinete'} de ${cliente}`,
      prioridad: tipo === 'terminado' ? 'normal' : 'seguimiento',
      fecha: fechaRelativa(0),
    })
    setModalAbierto(true)
  }

  function cerrarModal() {
    setModalAbierto(false)
    setPrefillModal(null)
  }

  // Igual que crearTareaYRefrescar arriba: ademas de marcar/reabrir la
  // tarea, refresca el Calendario -- si no, una tarea marcada hecha desde
  // la campanita de avisos (o reabierta) seguiria apareciendo ahi hasta
  // salir y volver a entrar a esa pestaña.
  async function toggleHechoYRefrescar(tarea) {
    const resultado = await toggleHecho(tarea)
    recargarListas()
    // Antes el resultado se ignoraba: si RLS bloqueaba el cambio, no se
    // veia nada y la tarea parecia no responder.
    if (!resultado.ok) mostrarToast(resultado.message)
    return resultado
  }

  async function editarTareaYRefrescar(id, campos) {
    const asignadaAntes = tareaDetalle?.asignado_a ?? null
    const resultado = await editarTarea(id, campos)
    if (resultado.ok) {
      setTareaDetalle(resultado.tarea)
      recargarListas()
      mostrarToast('Tarea actualizada', 'ok')
      // Solo si cambio la persona asignada: editar el titulo o la fecha de
      // una tarea ya asignada no vuelve a avisar.
      if (campos.asignadoA && campos.asignadoA !== asignadaAntes) avisarSiCorresponde(id, campos.asignadoA, profile?.id)
    }
    return resultado
  }

  async function borrarTareaYRefrescar(id) {
    const resultado = await borrarTarea(id)
    if (resultado.ok) {
      recargarListas()
      recargarContadorNotas()
      mostrarToast('Tarea borrada', 'ok')
    }
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
            {workshop?.logo_icon_url ? (
              <img
                src={workshop.logo_icon_url}
                alt="Logo del taller"
                className="w-11 h-11 rounded-full object-cover shrink-0"
              />
            ) : (
              // Placeholder punteado mientras carga o si el taller no tiene
              // logo cargado -- mismo tratamiento que se acordo en el mockup.
              <div className="w-11 h-11 rounded-full border-2 border-dashed border-text/30 flex items-center justify-center shrink-0 font-mono text-[9px] text-text/50 text-center leading-tight">
                LOGO
                <br />
                TALLER
              </div>
            )}
            <div>
              <h1 className="flex items-center gap-2 font-display text-3xl font-bold text-text">
                <img src="/la-pizarra-favicon-64x64.png" alt="" className="w-6 h-6 rounded-md" />
                La Pizarra
              </h1>
              {profile && (
                <p className="text-text/50 text-sm mt-0.5">
                  {workshop?.fantasy_name && <span className="text-text/70">{workshop.fantasy_name} · </span>}
                  Hola, {profile.full_name.split(' ')[0]}
                </p>
              )}
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
            {/* Se esconde sola si ya esta activado y guardado, o si el
                navegador la bloqueo (permiso "denied") -- ahi no hay nada
                que este boton pueda hacer. Si el permiso esta concedido pero
                fallo el guardado, reaparece en rojo con el motivo, para no
                dar por activado algo que no lo esta. */}
            {pushSoportado && pushPermiso !== 'denied' && (pushPermiso !== 'granted' || pushError) && (
              <button
                type="button"
                onClick={activarPush}
                disabled={activandoPush}
                className={
                  'p-1 disabled:opacity-50 ' +
                  (pushError ? 'text-priority-urgente' : 'text-text/50 hover:text-text')
                }
                aria-label="Activar notificaciones"
                title={
                  pushError
                    ? `No se pudieron activar las notificaciones (${pushError}). Toca para reintentar.`
                    : 'Activar notificaciones de tareas vencidas'
                }
              >
                <BellIcon size={20} />
              </button>
            )}
            <AvisosBell tareas={tareasConFecha} onAbrirDetalle={setTareaDetalle} />
            <ProfileMenu
              nombre={profile?.full_name}
              taller={workshop?.fantasy_name}
              onAjustes={() => setAjustesAbiertos(true)}
              onSignOut={signOut}
            />
          </div>
        </header>

        <Buscador tareas={tareasVisibles} reparacionesPorCliente={reparacionesPorCliente} onAbrirDetalle={setTareaDetalle} />

        {/* Cambia entre Mi dia, la lista completa de tareas, las reparaciones
            activas del taller (leidas de WheelOS, de solo lectura) y el
            calendario. Con scroll horizontal por si no caben en pantallas
            angostas. */}
        <div className="px-4 sm:px-6 mt-4 flex gap-2 overflow-x-auto pb-1">
          <FilterPill label="Mi día" active={vista === 'midia'} onClick={() => setVista('midia')} />
          <FilterPill label="Tareas" active={vista === 'tareas'} onClick={() => setVista('tareas')} />
          <FilterPill label="Reparaciones" active={vista === 'reparaciones'} onClick={() => setVista('reparaciones')} />
          <FilterPill label="Calendario" active={vista === 'calendario'} onClick={() => setVista('calendario')} />
        </div>

        {vista === 'midia' && (
          <MiDia
            tareas={pendientes}
            miId={profile?.id}
            loading={loadingPendientes}
            usuariosPorId={usuariosPorId}
            reparacionesPorCliente={reparacionesPorCliente}
            contadorNotas={contadorNotas}
            onCircleClick={manejarClickCirculo}
            onAbrirDetalle={setTareaDetalle}
            onCrear={puedeCrear ? abrirNuevaTarea : undefined}
            reparacionesAtencion={necesitanAtencion.length}
            onVerReparaciones={() => setVista('reparaciones')}
          />
        )}

        {vista === 'tareas' && (
          <>
            {/* overflow-x-auto en mobile (scroll horizontal); en sm+ pasa a
                flex-wrap porque ya sobra ancho para acomodar los pills en filas. */}
            <div className="px-4 sm:px-6 mt-3 flex gap-2 overflow-x-auto sm:overflow-visible sm:flex-wrap pb-1">
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
            <NecesitaAtencion items={necesitanAtencion} puedeCrear={puedeCrear} onCrearTarea={abrirTareaDesdeAtencion} />
            {necesitanAtencion.length > 0 && (
              <h2 className="pt-3 font-mono text-xs uppercase tracking-wide font-semibold text-text/60">
                Todas las reparaciones activas ({reparaciones.length})
              </h2>
            )}
            {loadingReparaciones && <p className="text-text/40 text-sm">Cargando…</p>}
            {errorReparaciones && <p className="text-sm text-priority-urgente">{errorReparaciones.message}</p>}
            {!loadingReparaciones && !errorReparaciones && reparaciones.length === 0 && (
              <p className="text-text/40 text-sm">No hay reparaciones activas ahora mismo.</p>
            )}

            {reparaciones.map((reparacion) => (
              <RepairCard
                key={reparacion.id}
                reparacion={reparacion}
                tareasAbiertas={tareasAbiertasPorReparacion.get(reparacion.id) ?? 0}
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
        <NewTaskModal
          usuarios={usuarios}
          miId={profile?.id}
          onClose={cerrarModal}
          onCreate={crearTareaYRefrescar}
          prefill={prefillModal}
        />
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
          usuarios={usuarios}
          contextoCliente={tareaDetalle.client_id ? reparacionesPorCliente.get(tareaDetalle.client_id) : null}
          puedeEditar={puedeCrear}
          onClose={() => setTareaDetalle(null)}
          onNotaAgregada={recargarContadorNotas}
          onGuardar={editarTareaYRefrescar}
          onBorrar={borrarTareaYRefrescar}
        />
      )}

      {ajustesAbiertos && (
        <Ajustes
          push={{
            soportado: pushSoportado,
            permiso: pushPermiso,
            activando: activandoPush,
            error: pushError,
            activar: activarPush,
          }}
          onClose={() => setAjustesAbiertos(false)}
        />
      )}

      <Toast toast={toast} onCerrar={cerrarToast} />
    </div>
  )
}
