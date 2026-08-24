import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, signInWithEmail, signOut as signOutHelper } from '../lib/supabase'

const AuthContext = createContext(null)

// `profile` es la fila de `users` vinculada a este auth.uid() -- trae
// workshop_id, role y full_name, que la app necesita para armar inserts en
// `tareas` (workshop_id es NOT NULL) y para mostrar/ocultar acciones segun
// el rol (RLS ya lo hace cumplir del lado del servidor, esto es solo UX).
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const cargarPerfil = useCallback(async (authUser) => {
    if (!authUser) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase
      .from('users')
      .select('id, workshop_id, role, full_name, active')
      .eq('auth_user_id', authUser.id)
      .single()

    if (error) {
      console.error('No se pudo cargar el perfil de usuario:', error.message)
      setProfile(null)
    } else {
      setProfile(data)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const authUser = data.session?.user ?? null
      setUser(authUser)
      await cargarPerfil(authUser)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authUser = session?.user ?? null
      setUser(authUser)
      await cargarPerfil(authUser)
    })

    return () => listener.subscription.unsubscribe()
  }, [cargarPerfil])

  const value = {
    user,
    profile,
    loading,
    signIn: signInWithEmail,
    signOut: signOutHelper,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
