import { ChatIcon, PhoneIcon } from './icons'
import { enlaceLlamada, enlaceWhatsApp } from '../utils/telefono'

const BOTON =
  'inline-flex items-center gap-1 rounded-full border border-surface-text/20 px-2.5 py-1 text-xs font-semibold text-surface-text hover:bg-surface-text/5'

// Llamar y escribir por WhatsApp con un toque. Se usa dentro de tarjetas
// que se abren al tocarlas, asi que los enlaces frenan el clic para no abrir
// tambien el detalle.
export default function BotonesContacto({ telefono, className = '' }) {
  const llamar = enlaceLlamada(telefono)
  if (!llamar) return null
  const whatsapp = enlaceWhatsApp(telefono)
  const frenar = (e) => e.stopPropagation()

  return (
    <span className={'inline-flex flex-wrap items-center gap-1.5 ' + className}>
      <a href={llamar} onClick={frenar} className={BOTON}>
        <PhoneIcon size={13} /> Llamar
      </a>
      {whatsapp && (
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" onClick={frenar} className={BOTON}>
          <ChatIcon size={13} /> WhatsApp
        </a>
      )}
    </span>
  )
}
