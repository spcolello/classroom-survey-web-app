import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Archive, Copy, Play, Plus, Search, Trash2, XCircle } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { activateSurvey, archiveSurvey, closeSurvey, deleteSurvey, getSurvey, listSurveys, saveSurvey } from '../lib/survey'
import type { DraftQuestion, Status, Survey } from '../lib/types'

const labels: Record<Status, string> = { draft: 'Draft', active: 'Active', closed: 'Closed', archived: 'Archived' }
const statuses: (Status | 'all')[] = ['all', 'draft', 'active', 'closed', 'archived']

export function DashboardPage() {
  const navigate = useNavigate()
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<Status | 'all'>('all')
  const [fromDate, setFromDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    try { setSurveys(await listSurveys()); setError('') }
    catch { setError('Could not load surveys. Try refreshing the page.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  async function act(id: string, action: 'activate' | 'close' | 'archive' | 'delete' | 'duplicate') {
    const survey = surveys.find(s => s.id === id)!
    if (action === 'close' && !window.confirm(`Close "${survey.title}"? Students will no longer be able to submit.`)) return
    if (action === 'archive' && !window.confirm(`Archive "${survey.title}"? Its results will remain available.`)) return
    if (action === 'delete' && !window.confirm(`Permanently delete "${survey.title}" and all its responses? This cannot be undone.`)) return
    setBusy(id); setError('')
    try {
      if (action === 'activate') { await activateSurvey(id); navigate(`/surveys/${id}/present`); return }
      if (action === 'close') await closeSurvey(id)
      if (action === 'archive') await archiveSurvey(id)
      if (action === 'delete') await deleteSurvey(id)
      if (action === 'duplicate') {
        const detail = await getSurvey(id)
        const questions: DraftQuestion[] = detail.questions.map(q => ({
          localId: crypto.randomUUID(), question_text: q.question_text, question_type: q.question_type,
          choices: q.choices.map(c => ({ localId: crypto.randomUUID(), choice_text: c.choice_text })),
        }))
        const copyId = await saveSurvey(null, `Copy of ${survey.title}`.slice(0, 200), survey.description ?? '', questions)
        navigate(`/surveys/${copyId}/edit`); return
      }
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Action failed. Please try again.') }
    finally { setBusy(null) }
  }

  const filtered = surveys.filter(s => {
    return s.title.toLowerCase().includes(search.toLowerCase())
      && (status === 'all' || s.status === status)
      && (!fromDate || s.created_at.slice(0, 10) >= fromDate)
  })
  return <AppShell title="Surveys" action={<Link to="/surveys/new" className="button button-primary"><Plus size={17} /> New survey</Link>}>
    <div className="page-heading"><div><h1>Your surveys</h1><p>Create a survey, activate it during class, then review the responses.</p></div></div>
    <div className="filter-row">
      <label className="search-field"><Search size={18} /><span className="sr-only">Search surveys</span><input placeholder="Search surveys" value={search} onChange={e => setSearch(e.target.value)} /></label>
      <label className="filter-label">Status <select value={status} onChange={e => setStatus(e.target.value as Status | 'all')}>{statuses.map(value => <option key={value} value={value}>{value === 'all' ? 'All' : labels[value]}</option>)}</select></label>
      <label className="filter-label">Created after <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} /></label>
    </div>
    {error && <div className="alert" role="alert">{error}</div>}
    {loading ? <div className="loading-state">Loading surveys…</div> : surveys.length === 0 ? <div className="empty-state"><h2>No surveys yet</h2><p>Start with a question you want to ask your class.</p><Link className="button button-primary" to="/surveys/new">Create your first survey</Link></div> : filtered.length === 0 ? <div className="empty-state"><h2>No matching surveys</h2><p>Try another title, status, or date.</p></div> :
      <div className="survey-list">{filtered.map(s => <article className="survey-row" key={s.id}>
        <div className="survey-row-main"><div className="survey-row-title"><h2>{s.title}</h2><span className={`status status-${s.status}`}>{labels[s.status]}</span></div><p>{s.description || 'No description'}</p><span className="survey-meta">Created {new Date(s.created_at).toLocaleDateString()}</span></div>
        <div className="survey-actions">
          {s.status === 'draft' && <Link className="button button-secondary" to={`/surveys/${s.id}/edit`}>Edit</Link>}
          {(s.status === 'draft' || s.status === 'closed') && <button className="button button-primary" disabled={busy === s.id} onClick={() => void act(s.id, 'activate')}><Play size={15} /> Activate</button>}
          {s.status === 'active' && <><Link className="button button-secondary" to={`/surveys/${s.id}/present`}>Present</Link><button className="button button-secondary" disabled={busy === s.id} onClick={() => void act(s.id, 'close')}><XCircle size={15} /> Close</button></>}
          {s.status !== 'draft' && <Link className="button button-secondary" to={`/surveys/${s.id}/results`}>Results</Link>}
          <button className="icon-button" title="Duplicate survey" aria-label={`Duplicate ${s.title}`} disabled={busy === s.id} onClick={() => void act(s.id, 'duplicate')}><Copy size={18} /></button>
          {(s.status === 'draft' || s.status === 'closed') && <button className="icon-button" title="Archive survey" aria-label={`Archive ${s.title}`} disabled={busy === s.id} onClick={() => void act(s.id, 'archive')}><Archive size={18} /></button>}
          <button className="icon-button dangerous" title="Delete survey" aria-label={`Delete ${s.title}`} disabled={busy === s.id} onClick={() => void act(s.id, 'delete')}><Trash2 size={18} /></button>
        </div>
      </article>)}</div>}
  </AppShell>
}
