import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Los correos y los avisos push enlazan a `/?tarea=<id>`: al abrir la app se
// busca esa tarea (aunque este hecha o fuera de los filtros activos) y se
// abre su detalle. El parametro se quita de la URL para que recargar la
// pagina no la vuelva a abrir.
export function useAbrirTareaDesdeEnlace(alEncontrar) {
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('tarea')
    if (!id) return
    window.history.replaceState(null, '', window.location.pathname)
    supabase
      .from('tareas')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) alEncontrar(data)
      })
  }, [alEncontrar])
}
