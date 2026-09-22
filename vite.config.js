import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'

// Version tipo "0.1.0", tomada directo de package.json -- se sube a mano
// en cada cambio que valga la pena marcar (ver README para el criterio).
// Se muestra chico en la app (BuildVersion.jsx) para saber de un vistazo
// que version se esta viendo, sin nada tecnico de por medio.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    // Clave publica VAPID -- no es secreta (viaja al navegador de
    // cualquier forma para poder suscribirse a push), pareja de la
    // privada configurada como secret del Worker (ver worker/index.js).
    __VAPID_PUBLIC_KEY__: JSON.stringify('BNloHmI2v6RQofJq3sQiKU2tGhnyEIsORRLOiXQOjIZEVZNBnVqtgPw2zv3u-kyu26St37aNWZP94-N647dsxlo'),
  },
})
