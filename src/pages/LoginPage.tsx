import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { db } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'

export function LoginPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const result = await db().auth.signInWithPassword({ email, password })
      if (result.error) throw result.error
      await refresh()
      navigate('/dashboard')
    } catch { setError('Could not sign in. Check your email and password.') }
    finally { setBusy(false) }
  }
  return <div className="login-layout">
    <div className="login-panel"><Link className="brand" to="/"><span className="brand-mark"><ClipboardList size={22} /></span><span>Classroom Survey</span></Link><div><h1>Questions for the room. Answers in real time.</h1><p>Prepare a survey before class and give everyone a simple way to respond.</p></div></div>
    <main className="login-form-wrap"><div className="login-form"><Link className="back-link" to="/">Back to home</Link><h2>Instructor sign in</h2><p>Use the instructor account created in Supabase Auth.</p><form onSubmit={submit}>
      <label htmlFor="email">Email</label><input id="email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required />
      <label htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
      {error && <div className="alert" role="alert">{error}</div>}
      <button className="button button-primary button-wide" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form></div></main>
  </div>
}
