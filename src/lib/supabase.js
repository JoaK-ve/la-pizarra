import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Faltan las variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
    'Crea un archivo .env basado en .env.example.'
  )
}

// Mismo proyecto Supabase que WheelOS -- no se crea uno nuevo.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- Auth helpers ---
// Solo login, sin signUp: las cuentas de WheelOS las crea un admin desde el
// panel de WheelOS (Edge Function invite-user), no se auto-registra nadie
// desde La Pizarra.
export async function signInWithEmail(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}
