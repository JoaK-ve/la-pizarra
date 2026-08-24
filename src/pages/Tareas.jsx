import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTareas } from '../hooks/useTareas'
import { useUsuarios } from '../hooks/useUsuarios'
import FilterPill from '../components/FilterPill'
import TaskCard from '../components/TaskCard'
import NewTaskModal from '../components/NewTaskModal'
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
  const [contexto, setContexto] = useState('todos')
  const [asignadoA, setAsignadoA] = useState('todos')
  const [mostrarHechas, setMostrarHechas] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)

  const { tareas, loading, error, toggleHecho, crearTarea } = useTareas({ contexto, asignadoA, mostrarHechas })

  const usuariosPorId = useMemo(() => new Map(usuarios.map((u) => [u.id, u])), [usuarios])

  // Solo owner/admin/technician/secretary pueden crear tareas (misma regla
  // que la politica de RLS de insert) -- viewer no ve el boton.
  const puedeCrear = profile?.role && profile.role !== 'viewer'

  return (
    // max-w-3xl + mx-auto no necesita variante sm: -- en mobile el ancho de
    // pantalla ya es menor a 3xl (48rem/768px), asi que no cambia nada ahi;
    // en tablet/desktop evita que el contenido se estire borde a borde.
    <div className="min-h-screen pb-24 sm:pb-10">
      <div className="max-w-3xl mx-auto">
        <header className="px-4 sm:px-6 pt-6 pb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-paper">La Pizarra</h1>
            {profile && <p className="text-paper/50 text-sm mt-0.5">Hola, {profile.full_name.split(' ')[0]}</p>}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Boton inline, solo tablet/desktop -- version FAB mobile va aparte, al final. */}
            {puedeCrear && (
              <button
                type="button"
                onClick={() => setModalAbierto(true)}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber text-bg font-display font-semibold text-sm px-4 py-2 hover:opacity-90"
              >
                <PlusIcon size={16} />
                Nueva tarea
              </button>
            )}
            <button type="button" onClick={signOut} className="text-paper/50 hover:text-paper p-1" aria-label="Cerrar sesión">
              <LogoutIcon size={20} />
            </button>
          </div>
        </header>

        {/* overflow-x-auto en mobile (scroll horizontal); en sm+ pasa a
            flex-wrap porque ya sobra ancho para acomodar los pills en filas. */}
        <div className="px-4 sm:px-6 flex gap-2 overflow-x-auto sm:overflow-visible sm:flex-wrap pb-1">
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

        <label className="px-4 sm:px-6 mt-3 flex items-center gap-2 text-sm text-paper/60">
          <input
            type="checkbox"
            checked={mostrarHechas}
            onChange={(e) => setMostrarHechas(e.target.checked)}
            className="accent-amber"
          />
          Mostrar hechas
        </label>

        <main className="px-4 sm:px-6 mt-4 space-y-2.5">
          {loading && <p className="text-paper/40 text-sm">Cargando…</p>}
          {error && <p className="text-sm text-[--color-prioridad-urgente]">{error.message}</p>}
          {!loading && !error && tareas.length === 0 && (
            <p className="text-paper/40 text-sm">No hay tareas para este filtro.</p>
          )}

          {tareas.map((tarea) => (
            <TaskCard key={tarea.id} tarea={tarea} usuariosPorId={usuariosPorId} onToggleHecho={toggleHecho} />
          ))}
        </main>
      </div>

      {/* FAB flotante, solo mobile -- en sm+ el boton equivalente ya esta en el header. */}
      {puedeCrear && (
        <button
          type="button"
          onClick={() => setModalAbierto(true)}
          className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-amber text-bg shadow-lg flex items-center justify-center"
          aria-label="Nueva tarea"
        >
          <PlusIcon size={24} />
        </button>
      )}

      {modalAbierto && (
        <NewTaskModal usuarios={usuarios} onClose={() => setModalAbierto(false)} onCreate={crearTarea} />
      )}
    </div>
  )
}
