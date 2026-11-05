import { Link, useNavigate } from 'react-router-dom'
import { LogOut, SquarePen } from 'lucide-react'
import { db } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { publicDemo } from '../lib/demo'

export function AppShell({ children, title, action }: { children: React.ReactNode; title: string; action?: React.ReactNode }) {
  const { session } = useAuth()
  const navigate = useNavigate()
  async function logout() {
    await db().auth.signOut()
    navigate('/login')
  }
  return <div className="app-shell">
    <aside className="side-nav">
      <Link to="/dashboard" className="brand"><span className="brand-mark"><SquarePen size={21} /></span><span>Classroom<br />Survey</span></Link>
      <nav aria-label="Main navigation"><Link to="/dashboard">Surveys</Link><Link to="/surveys/new">New survey</Link></nav>
      <div className="side-footer"><span className="user-email" title={session?.user.email || undefined}>{publicDemo ? 'Demo instructor' : session?.user.email}</span><button type="button" className="plain-button" onClick={logout}><LogOut size={17} /> Sign out</button></div>
    </aside>
    <div className="main-column">
      <header className="topbar"><Link to="/dashboard" className="mobile-brand">Classroom Survey</Link><span className="topbar-title">{title}</span>{action}</header>
      <main className="page-content">{publicDemo && <div className="demo-notice" role="note"><strong>Public demo.</strong> Surveys and results are shared with other visitors. Do not enter personal information.</div>}{children}</main>
    </div>
  </div>
}
