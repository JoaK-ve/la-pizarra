import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Tareas from './pages/Tareas'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  )
}

function AppShell() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-display text-sm font-bold text-text/40">Cargando…</p>
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <Routes>
      <Route path="/" element={<Tareas />} />
    </Routes>
  )
}
