// Prefijo que se asume para numeros de 9 cifras escritos sin prefijo
// (los del taller: "641352460"). WheelOS guarda los telefonos tal cual los
// escribe cada persona: unos con "+34", otros sin nada.
const PREFIJO_POR_DEFECTO = '34'

function limpiar(telefono) {
  return String(telefono ?? '').replace(/[^\d+]/g, '')
}

export function enlaceLlamada(telefono) {
  const numero = limpiar(telefono)
  return numero.length >= 6 ? `tel:${numero}` : null
}

// WhatsApp exige el numero en formato internacional sin "+" ni ceros.
export function enlaceWhatsApp(telefono) {
  let numero = limpiar(telefono)
  if (numero.startsWith('+')) numero = numero.slice(1)
  else if (numero.startsWith('00')) numero = numero.slice(2)
  else if (numero.length === 9) numero = PREFIJO_POR_DEFECTO + numero
  return /^\d{8,15}$/.test(numero) ? `https://wa.me/${numero}` : null
}
