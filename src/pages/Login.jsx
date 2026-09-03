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
          <h1 className="font-display text-2xl font-bold text-paper">La Pizarra</h1>
          <p className="text-paper/60 text-sm mt-1">Entrá con tu cuenta de WheelOS.</p>
        </div>

        <div>
          <label className="text-xs font-mono uppercase tracking-wide text-paper/50">Email</label>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1 rounded-xl border border-paper/20 bg-paper/5 px-3 py-2.5 text-paper outline-none focus:border-amber"
          />
        </div>

        <div>
          <label className="text-xs font-mono uppercase tracking-wide text-paper/50">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 rounded-xl border border-paper/20 bg-paper/5 px-3 py-2.5 text-paper outline-none focus:border-amber"
          />
        </div>

        {error && <p className="text-sm text-[--color-prioridad-urgente]">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-xl bg-amber text-bg font-display font-semibold py-2.5 disabled:opacity-50"
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>

        <BuildVersion className="text-center" />
      </form>
    </div>
  )
}
