import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { getPublicSurvey, submitSurvey, friendlyError } from '../lib/survey'
import { anonymousToken, hasSubmitted, markSubmitted } from '../lib/token'
import type { SurveyDetail } from '../lib/types'

export function StudentPage() {
  const { slug = '' } = useParams()
  const [survey, setSurvey] = useState<SurveyDetail | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState<'form' | 'success' | 'duplicate' | 'unavailable'>('form')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    getPublicSurvey(slug).then(data => {
      if (!data) { setState('unavailable'); return }
      setSurvey(data)
      if (hasSubmitted(data.id)) setState('duplicate')
    }).catch(() => setError('Could not load this survey. Check your connection and refresh.'))
      .finally(() => setLoading(false))
  }, [slug])
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!survey) return
    if (survey.questions.some(q => !answers[q.id])) { setError('Please answer every question.'); return }
    setBusy(true); setError('')
    try {
      await submitSurvey(survey.id, anonymousToken(),
        survey.questions.map(q => ({ question_id: q.id, choice_id: answers[q.id] })))
      markSubmitted(survey.id); setState('success')
    } catch (e) {
      const message = friendlyError(e)
      if (message.includes('already submitted')) setState('duplicate')
      else if (message.includes('no longer accepting')) setState('unavailable')
      else setError(message)
    } finally { setBusy(false) }
  }
  return <main className="student-page"><div className="student-wrap">
    <div className="student-brand">Classroom Survey</div>
    {loading ? <div className="student-state">Loading survey…</div> :
    state === 'success' ? <div className="student-state"><CheckCircle2 size={42} aria-hidden="true" /><h1>Thank you!</h1><p>Your response has been recorded.</p></div> :
    state === 'duplicate' ? <div className="student-state"><h1>Already submitted</h1><p>You have already submitted a response to this survey.</p></div> :
    state === 'unavailable' ? <div className="student-state"><h1>Survey unavailable</h1><p>This survey is closed or the link is incorrect.</p></div> :
    !survey ? <div className="student-state"><h1>Could not load survey</h1><p>{error || 'Please refresh and try again.'}</p></div> :
    <><header className="student-heading"><span>Class survey</span><h1>{survey.title}</h1>{survey.description && <p>{survey.description}</p>}</header>
      <form onSubmit={submit} noValidate>
        {survey.questions.map((q, index) => <fieldset className="student-question" key={q.id}><legend><span>{index + 1}.</span> {q.question_text}</legend><div className="student-options">{q.choices.map(c => <label className={`student-option ${answers[q.id] === c.id ? 'selected' : ''}`} key={c.id}><input type="radio" name={q.id} value={c.id} checked={answers[q.id] === c.id} onChange={() => setAnswers(current => ({ ...current, [q.id]: c.id }))} /><span className="radio-visual" aria-hidden="true" /><span>{c.choice_text}</span></label>)}</div></fieldset>)}
        {error && <div className="alert" role="alert">{error}</div>}
        <button className="button button-primary student-submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit responses'}</button>
      </form></>}
  </div></main>
}
