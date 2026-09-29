import { ListIcon, AlertIcon, CheckIcon } from './icons'

// Numeros REALES en vez de las 4 categorias inventadas del mockup de
// dashboard ("En progreso"/"En revision" no existen en nuestro modelo,
// que sigue siendo binario pendiente/hecho a proposito) -- ver ROADMAP.md.
// Insignia de color (v0.22.0, pedido tras el mockup de movil): mismo
// significado de color que ya usa el resto de la app -- rojo urgente para
// vencidas, verde de marca para lo positivo (hechas), neutro para el dato
// que no es ni bueno ni malo (pendientes).
export default function TarjetasResumen({ pendientes, vencidas, hechasSemana, cargandoHechas }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      <Tarjeta numero={pendientes} etiqueta="Pendientes" Icono={ListIcon} tinte="bg-surface-text/10" colorIcono="text-surface-text/70" />
      <Tarjeta
        numero={vencidas}
        etiqueta="Vencidas"
        Icono={AlertIcon}
        tinte="bg-priority-urgente/15"
        colorIcono="text-priority-urgente"
        colorNumero={vencidas > 0 ? 'var(--color-priority-urgente)' : undefined}
      />
      <Tarjeta
        numero={cargandoHechas ? null : hechasSemana}
        etiqueta="Hechas esta semana"
        Icono={CheckIcon}
        tinte="bg-brand/15"
        colorIcono="text-brand"
        colorNumero="var(--color-brand)"
      />
    </div>
  )
}

function Tarjeta({ numero, etiqueta, Icono, tinte, colorIcono, colorNumero }) {
  return (
    <div className="rounded-xl bg-surface text-surface-text px-3.5 py-3">
      <div className={'w-7 h-7 rounded-lg flex items-center justify-center mb-2 ' + tinte + ' ' + colorIcono}>
        <Icono size={14} />
      </div>
      <p className="font-display font-bold text-2xl" style={colorNumero ? { color: colorNumero } : undefined}>
        {numero === null ? '…' : numero}
      </p>
      <p className="text-xs text-surface-text/60 mt-0.5">{etiqueta}</p>
    </div>
  )
}
