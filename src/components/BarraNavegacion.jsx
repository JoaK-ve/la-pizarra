import { ListIcon, CheckSquareIcon, WrenchIcon, CalendarIcon } from './icons'

const PESTANAS = [
  { clave: 'midia', label: 'Mi día', Icono: ListIcon },
  { clave: 'tareas', label: 'Tareas', Icono: CheckSquareIcon },
  { clave: 'reparaciones', label: 'Reparaciones', Icono: WrenchIcon },
  { clave: 'calendario', label: 'Calendario', Icono: CalendarIcon },
]

// Navegacion fija de abajo, solo movil (mejora visual del mockup, v0.20.0) --
// en tablet/desktop se sigue usando la fila de pestañas de scroll horizontal
// de siempre, que ahi cabe comoda sin necesidad de esto.
export default function BarraNavegacion({ vista, onCambiar }) {
  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-bg border-t border-text/10 flex"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {PESTANAS.map(({ clave, label, Icono }) => {
        const activa = vista === clave
        return (
          <button
            key={clave}
            type="button"
            onClick={() => onCambiar(clave)}
            className={'flex-1 flex flex-col items-center gap-0.5 py-2 ' + (activa ? 'text-brand-light' : 'text-text/50')}
            aria-current={activa ? 'page' : undefined}
          >
            <Icono size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
