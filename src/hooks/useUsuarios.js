import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Trae los usuarios activos del mismo taller (JoaK, Joaco, Lili...), para
// el filtro "persona asignada" y el selector de "asignar a" al crear tarea.
// No se hardcodean nombres: RLS limita esto al workshop_id del usuario
// logueado, asi que la lista siempre refleja los usuarios reales de la base.
export function useUsuarios() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    supabase
      .from('users')
      .select('id, full_name, role')
      .eq('active', true)
      .order('full_name')
      .then(({ data, error }) => {
        if (error) console.error('No se pudo cargar la lista de usuarios:', error.message)
        setUsuarios(data ?? [])
        setLoading(false)
      })
  }, [user])

  return { usuarios, loading }
}
