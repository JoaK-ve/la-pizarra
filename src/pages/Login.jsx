import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import BuildVersion from '../components/BuildVersion'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    const { error } = await signIn(email, password)
    setEnviando(false)
    if (error) setError('Email o contraseña incorrectos.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <div>
          <h1 className="font-display text-3xl font-bold text-text">La Pizarra</h1>
          <p className="text-text/60 text-sm mt-1">Entra con tu cuenta de WheelOS.</p>
        </div>

        <div>
          <label className="text-xs font-mono uppercase tracking-wide text-text/50">Email</label>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1 rounded-xl border border-text/20 bg-text/5 px-3 py-2.5 text-text outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="text-xs font-mono uppercase tracking-wide text-text/50">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 rounded-xl border border-text/20 bg-text/5 px-3 py-2.5 text-text outline-none focus:border-brand"
          />
        </div>

        {error && <p className="text-sm text-priority-urgente">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-xl bg-brand text-brand-contrast font-display font-semibold py-2.5 disabled:opacity-50"
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>

        <BuildVersion className="text-center" />
      </form>
    </div>
  )
}
