import { useState } from 'react'
import { SettingsIcon, LogoutIcon } from './icons'

// Junta en un solo menu lo que antes eran dos iconos sueltos en el header
// (engranaje de Ajustes + salir) -- pedido del mockup de dashboard, v0.18.0.
export default function ProfileMenu({ nombre, taller, onAjustes, onSignOut }) {
  const [abierto, setAbierto] = useState(false)
  const iniciales = nombre
    ? nombre
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0].toUpperCase())
        .join('')
    : '?'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="w-8 h-8 rounded-full bg-brand text-brand-contrast font-display font-bold text-xs flex items-center justify-center shrink-0"
        aria-label="Menú de perfil"
      >
        {iniciales}
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} />
          <div className="absolute right-0 top-10 w-48 rounded-xl bg-surface text-surface-text shadow-lg overflow-hidden z-20">
            <div className="px-3.5 py-2.5 border-b border-surface-text/10">
              <p className="text-sm font-semibold truncate">{nombre}</p>
              {taller && <p className="text-xs text-surface-text/50 truncate">{taller}</p>}
            </div>
            <button
              type="button"
              onClick={() => {
                setAbierto(false)
                onAjustes()
              }}
              className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm hover:bg-surface-text/5"
            >
              <SettingsIcon size={16} /> Ajustes
            </button>
            <button
              type="button"
              onClick={() => {
                setAbierto(false)
                onSignOut()
              }}
              className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm hover:bg-surface-text/5"
            >
              <LogoutIcon size={16} /> Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  )
}
