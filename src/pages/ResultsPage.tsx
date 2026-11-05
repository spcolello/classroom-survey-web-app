import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Download, RefreshCw } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AppShell } from '../components/AppShell'
import { downloadCsv } from '../lib/export'
import { allResponses, getSurvey } from '../lib/survey'
import type { ResponseRow, SurveyDetail } from '../lib/types'

export function ResultsPage() {
  const { id = '' } = useParams()
  const [survey, setSurvey] = useState<SurveyDetail | null>(null)
  const [responses, setResponses] = useState<ResponseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setBusy(true)
    try {
      const [detail, rows] = await Promise.all([getSurvey(id), allResponses(id)])
      setSurvey(detail); setResponses(rows); setError('')
    } catch { setError('Could not load results. Try again.') }
    finally { setLoading(false); setBusy(false) }
  }, [id])
  useEffect(() => { void load() }, [load])
  return <AppShell title="Results"><div className="results-page">
    <div className="page-heading"><div><Link className="back-link" to="/dashboard">Back to surveys</Link><h1>{survey?.title ?? 'Survey results'}</h1><p>{survey ? `${responses.length} ${responses.length === 1 ? 'response' : 'responses'} · ${survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}` : 'Loading results…'}</p></div><div className="heading-actions"><button className="button button-secondary" disabled={busy} onClick={() => void load()}><RefreshCw size={17} /> Refresh</button><button className="button button-primary" disabled={!survey || busy} onClick={() => { if (survey) downloadCsv(survey, responses) }}><Download size={17} /> Export CSV</button></div></div>
    {error && <div className="alert" role="alert">{error}</div>}
    {loading ? <div className="loading-state">Loading results…</div> : survey && responses.length === 0 ? <div className="empty-state"><h2>No responses yet</h2><p>Display the QR code so students can join.</p>{survey.status === 'active' && <Link className="button button-primary" to={`/surveys/${survey.id}/present`}>Present QR code</Link>}</div> : survey && <div className="result-list">
      {survey.questions.map((q, index) => {
        const counts = new Map(q.choices.map(c => [c.id, 0]))
        let answered = 0
        for (const response of responses) {
          const answer = response.answers.find(a => a.question_id === q.id)
          if (answer && counts.has(answer.choice_id)) { counts.set(answer.choice_id, (counts.get(answer.choice_id) ?? 0) + 1); answered++ }
        }
        const data = q.choices.map(c => ({ name: c.choice_text, count: counts.get(c.id) ?? 0 }))
        return <section className="result-card" key={q.id}><div className="result-title"><div><span>Question {index + 1}</span><h2>{q.question_text}</h2></div><span>{answered} answered</span></div>
          <div className="result-grid"><div className="result-values">{q.choices.map(c => {
            const count = counts.get(c.id) ?? 0; const percentage = answered ? count / answered * 100 : 0
            return <div className="result-choice" key={c.id}><div className="result-choice-top"><span>{c.choice_text}</span><strong>{count} <small>{percentage.toFixed(1)}%</small></strong></div><div className="result-track"><span style={{ width: `${percentage}%` }} /></div></div>
          })}</div><div className="chart-wrap" aria-hidden="true"><ResponsiveContainer width="100%" height={Math.max(180, q.choices.length * 46)}><BarChart data={data} layout="vertical" margin={{ top: 8, right: 18, left: 8, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e9e2" /><XAxis type="number" allowDecimals={false} /><YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="count" fill="#2d6a56" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></div>
          {responses.length > answered && <p className="unanswered">{responses.length - answered} unanswered</p>}
        </section>
      })}
    </div>}
  </div></AppShell>
}
