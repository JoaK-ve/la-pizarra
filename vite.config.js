import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'node:child_process'

// Hash corto del commit + fecha del build, inyectados en tiempo de compilacion
// (no en runtime -- Cloudflare Workers en modo static assets no ejecuta
// nada del lado del servidor). Se muestran en la app (ver App.jsx) para
// poder confirmar sin dudas si el navegador esta viendo el build nuevo o
// uno viejo en cache, en vez de adivinar.
function commitHash() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'sin-git'
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __BUILD_VERSION__: JSON.stringify(commitHash()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})
