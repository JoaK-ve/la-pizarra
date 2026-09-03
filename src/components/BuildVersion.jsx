// __BUILD_VERSION__ / __BUILD_TIME__ los inyecta vite.config.js en tiempo de
// compilacion (hash corto del commit + fecha del build) -- sirve para
// confirmar sin dudas, mirando la propia app, si el navegador esta viendo
// el build mas reciente o uno viejo en cache.
export default function BuildVersion({ className = '' }) {
  const fecha = new Date(__BUILD_TIME__).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <p className={'text-[10px] font-mono text-paper/30 ' + className}>
      v{__BUILD_VERSION__} · {fecha}
    </p>
  )
}
