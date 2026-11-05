import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { activateSurvey, getSurvey, saveSurvey } from '../lib/survey'
import type { DraftQuestion, QuestionType } from '../lib/types'

const makeChoice = (text = '') => ({ localId: crypto.randomUUID(), choice_text: text })
const makeQuestion = (): DraftQuestion => ({
  localId: crypto.randomUUID(), question_text: '', question_type: 'multiple_choice',
  choices: [makeChoice(), makeChoice()],
})

export function EditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<DraftQuestion[]>([makeQuestion()])
  const [loading, setLoading] = useState(Boolean(id))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [editable, setEditable] = useState(true)

  useEffect(() => {
    if (!id) return
    getSurvey(id).then(survey => {
      setTitle(survey.title); setDescription(survey.description ?? '')
      setEditable(survey.status === 'draft')
      setQuestions(survey.questions.map(q => ({
        localId: crypto.randomUUID(), question_text: q.question_text, question_type: q.question_type,
        choices: q.choices.map(c => makeChoice(c.choice_text)),
      })))
    }).catch(() => setError('Could not load this survey.')).finally(() => setLoading(false))
  }, [id])

  function changeQuestion(index: number, update: Partial<DraftQuestion>) {
    setQuestions(current => current.map((q, i) => i === index ? { ...q, ...update } : q)); setSaved(false)
  }
  function moveQuestion(index: number, delta: number) {
    const copy = [...questions]; const other = index + delta
    if (other < 0 || other >= copy.length) return
    ;[copy[index], copy[other]] = [copy[other], copy[index]]; setQuestions(copy); setSaved(false)
  }
  function moveChoice(questionIndex: number, choiceIndex: number, delta: number) {
    const copy = [...questions]; const choices = [...copy[questionIndex].choices]; const other = choiceIndex + delta
    if (other < 0 || other >= choices.length) return
    ;[choices[choiceIndex], choices[other]] = [choices[other], choices[choiceIndex]]
    copy[questionIndex] = { ...copy[questionIndex], choices }; setQuestions(copy); setSaved(false)
  }
  function setType(index: number, type: QuestionType) {
    changeQuestion(index, { question_type: type, choices: type === 'true_false' ? [makeChoice('True'), makeChoice('False')] : [makeChoice(), makeChoice()] })
  }
  function validate(): string {
    if (!title.trim()) return 'Enter a survey title.'
    if (title.trim().length > 200) return 'The title must be 200 characters or fewer.'
    if (questions.length === 0) return 'Add at least one question.'
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question_text.trim()) return `Enter text for question ${i + 1}.`
      if (q.choices.length < 2) return `Question ${i + 1} needs at least two choices.`
      if (q.choices.some(c => !c.choice_text.trim())) return `Fill in every choice for question ${i + 1}.`
      if (new Set(q.choices.map(c => c.choice_text.trim().toLowerCase())).size !== q.choices.length) return `Choices for question ${i + 1} must be different.`
    }
    return ''
  }
  async function save(activate: boolean) {
    const problem = validate(); if (problem) { setError(problem); return }
    setBusy(true); setError(''); setSaved(false)
    try {
      const savedId = await saveSurvey(id ?? null, title, description, questions)
      if (activate) { await activateSurvey(savedId); navigate(`/surveys/${savedId}/present`) }
      else { setSaved(true); if (!id) navigate(`/surveys/${savedId}/edit`, { replace: true }) }
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save the survey.') }
    finally { setBusy(false) }
  }
  return <AppShell title={id ? 'Edit survey' : 'New survey'}>
    {loading ? <div className="loading-state">Loading survey…</div> : !editable ? <div className="empty-state"><h1>This survey cannot be edited</h1><p>Duplicate it to make a new draft. Existing results are preserved.</p><Link className="button button-secondary" to="/dashboard">Back to surveys</Link></div> :
    <div className="editor"><div className="page-heading"><div><Link to="/dashboard" className="back-link">Back to surveys</Link><h1>{id ? 'Edit survey' : 'Create survey'}</h1><p>All questions require one answer. You can edit a survey while it is a draft.</p></div></div>
      <section className="form-card"><h2>Survey details</h2><div className="field"><label htmlFor="survey-title">Title <span aria-hidden="true">*</span></label><input id="survey-title" maxLength={200} value={title} onChange={e => { setTitle(e.target.value); setSaved(false) }} placeholder="e.g. Recursion concept check" /></div><div className="field"><label htmlFor="survey-description">Description <span className="optional">Optional</span></label><textarea id="survey-description" rows={2} value={description} onChange={e => { setDescription(e.target.value); setSaved(false) }} placeholder="A short note for students" /></div></section>
      <div className="section-heading"><h2>Questions</h2><span>{questions.length} of 50</span></div>
      {questions.map((q, qi) => <section className="form-card question-card" key={q.localId}>
        <div className="question-top"><h3>Question {qi + 1}</h3><div className="inline-actions"><button className="icon-button" title="Move question up" aria-label={`Move question ${qi + 1} up`} disabled={qi === 0} onClick={() => moveQuestion(qi, -1)}><ArrowUp size={18} /></button><button className="icon-button" title="Move question down" aria-label={`Move question ${qi + 1} down`} disabled={qi === questions.length - 1} onClick={() => moveQuestion(qi, 1)}><ArrowDown size={18} /></button><button className="icon-button dangerous" title="Delete question" aria-label={`Delete question ${qi + 1}`} onClick={() => { if (window.confirm(`Delete question ${qi + 1}?`)) setQuestions(current => current.filter((_, i) => i !== qi)) }}><Trash2 size={18} /></button></div></div>
        <div className="field"><label htmlFor={`question-${q.localId}`}>Question text</label><input id={`question-${q.localId}`} maxLength={500} value={q.question_text} onChange={e => changeQuestion(qi, { question_text: e.target.value })} placeholder="What would you like to ask?" /></div>
        <div className="field"><label htmlFor={`type-${q.localId}`}>Answer type</label><select id={`type-${q.localId}`} value={q.question_type} onChange={e => setType(qi, e.target.value as QuestionType)}><option value="multiple_choice">Multiple choice</option><option value="true_false">True / False</option></select></div>
        <div className="choice-heading">Choices</div>
        {q.choices.map((choice, ci) => <div className="choice-editor" key={choice.localId}><label className="sr-only" htmlFor={`choice-${choice.localId}`}>Question {qi + 1}, choice {ci + 1}</label><span className="choice-letter">{String.fromCharCode(65 + ci)}</span><input id={`choice-${choice.localId}`} maxLength={300} value={choice.choice_text} disabled={q.question_type === 'true_false'} onChange={e => changeQuestion(qi, { choices: q.choices.map((c, i) => i === ci ? { ...c, choice_text: e.target.value } : c) })} placeholder={`Choice ${ci + 1}`} /><button className="icon-button" title="Move choice up" aria-label={`Move choice ${ci + 1} up`} disabled={ci === 0 || q.question_type === 'true_false'} onClick={() => moveChoice(qi, ci, -1)}><ArrowUp size={16} /></button><button className="icon-button" title="Move choice down" aria-label={`Move choice ${ci + 1} down`} disabled={ci === q.choices.length - 1 || q.question_type === 'true_false'} onClick={() => moveChoice(qi, ci, 1)}><ArrowDown size={16} /></button><button className="icon-button dangerous" title="Remove choice" aria-label={`Remove choice ${ci + 1}`} disabled={q.choices.length <= 2 || q.question_type === 'true_false'} onClick={() => changeQuestion(qi, { choices: q.choices.filter((_, i) => i !== ci) })}><Trash2 size={16} /></button></div>)}
        {q.question_type === 'multiple_choice' && <button className="text-button" disabled={q.choices.length >= 10} onClick={() => changeQuestion(qi, { choices: [...q.choices, makeChoice()] })}><Plus size={17} /> Add choice</button>}
      </section>)}
      <button className="button button-secondary add-question" disabled={questions.length >= 50} onClick={() => { setQuestions(current => [...current, makeQuestion()]); setSaved(false) }}><Plus size={17} /> Add question</button>
      {error && <div className="alert" role="alert">{error}</div>}
      {saved && <p className="success-text" role="status">Draft saved.</p>}
      <div className="editor-footer"><button className="button button-secondary" disabled={busy} onClick={() => void save(false)}>{busy ? 'Saving…' : 'Save draft'}</button><button className="button button-primary" disabled={busy} onClick={() => void save(true)}>{busy ? 'Working…' : 'Save and activate'}</button></div>
    </div>}
  </AppShell>
}
