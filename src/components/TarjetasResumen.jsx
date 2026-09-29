// Numeros REALES en vez de las 4 categorias inventadas del mockup de
// dashboard ("En progreso"/"En revision" no existen en nuestro modelo,
// que sigue siendo binario pendiente/hecho a proposito) -- ver ROADMAP.md.
export default function TarjetasResumen({ pendientes, vencidas, hechasSemana, cargandoHechas }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      <Tarjeta numero={pendientes} etiqueta="Pendientes" />
      <Tarjeta numero={vencidas} etiqueta="Vencidas" color={vencidas > 0 ? 'var(--color-priority-urgente)' : undefined} />
      <Tarjeta numero={cargandoHechas ? null : hechasSemana} etiqueta="Hechas esta semana" color="var(--color-brand)" />
    </div>
  )
}

function Tarjeta({ numero, etiqueta, color }) {
  return (
    <div className="rounded-xl bg-surface text-surface-text px-3.5 py-3">
      <p className="font-display font-bold text-2xl" style={color ? { color } : undefined}>
        {numero === null ? '…' : numero}
      </p>
      <p className="text-xs text-surface-text/60 mt-0.5">{etiqueta}</p>
    </div>
  )
}
