import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { db } from '../lib/supabase'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { session, loading } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (password.length < 12) { setError('Use at least 12 characters.'); return }
    if (password !== confirm) { setError('The passwords do not match.'); return }
    setBusy(true); setError('')
    const { error: updateError } = await db().auth.updateUser({ password })
    if (updateError) { setError(updateError.message); setBusy(false); return }
    await db().auth.signOut()
    navigate('/login', { replace: true, state: { passwordChanged: true } })
  }

  return <div className="login-layout">
    <div className="login-panel"><Link className="brand" to="/"><span className="brand-mark"><ClipboardList size={22} /></span><span>Classroom Survey</span></Link><div><h1>Set a new instructor password.</h1><p>Use the private recovery link sent to your email.</p></div></div>
    <main className="login-form-wrap"><div className="login-form"><Link className="back-link" to="/login">Back to sign in</Link><h2>Reset password</h2>
      {loading ? <p>Checking recovery link…</p> : !session ? <div className="alert" role="alert">This recovery link is invalid or expired. Request a new link from the sign-in page.</div> :
        <form onSubmit={submit}>
          <label htmlFor="new-password">New password</label><input id="new-password" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} minLength={12} required />
          <label htmlFor="confirm-password">Confirm password</label><input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} minLength={12} required />
          {error && <div className="alert" role="alert">{error}</div>}
          <button className="button button-primary button-wide" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</button>
        </form>}
    </div></main>
  </div>
}
