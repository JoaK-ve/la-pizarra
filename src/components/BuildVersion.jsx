// __APP_VERSION__ lo inyecta vite.config.js en tiempo de compilacion, leido
// directo de package.json ("0.1.0" estilo semver, sin nada tecnico).
export default function BuildVersion({ className = '' }) {
  return <p className={'text-[10px] font-mono text-paper/30 ' + className}>v{__APP_VERSION__}</p>
}
