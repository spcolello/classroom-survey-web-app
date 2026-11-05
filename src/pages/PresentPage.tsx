import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { Download, ExternalLink, Maximize2 } from 'lucide-react'
import { closeSurvey, countResponses, getSurvey } from '../lib/survey'
import type { SurveyDetail } from '../lib/types'

export function PresentPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [survey, setSurvey] = useState<SurveyDetail | null>(null)
  const [count, setCount] = useState(0)
  const [qr, setQr] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const url = survey?.public_slug ? `${window.location.origin}/s/${survey.public_slug}` : ''

  useEffect(() => {
    getSurvey(id).then(setSurvey).catch(() => setError('Could not load the survey.'))
  }, [id])
  useEffect(() => {
    if (!survey?.public_slug) return
    QRCode.toDataURL(`${window.location.origin}/s/${survey.public_slug}`, { width: 640, margin: 2, errorCorrectionLevel: 'M' })
      .then(setQr).catch(() => setError('Could not generate the QR code.'))
  }, [survey?.public_slug])
  useEffect(() => {
    if (!survey) return
    const refresh = () => { void countResponses(survey.id).then(setCount).catch(() => setError('Could not refresh the response count.')) }
    refresh()
    const timer = window.setInterval(refresh, 5000)
    return () => window.clearInterval(timer)
  }, [survey])
  async function close() {
    if (!survey || !window.confirm('Close this survey? Students will no longer be able to submit.')) return
    setBusy(true); setError('')
    try { await closeSurvey(survey.id); navigate(`/surveys/${survey.id}/results`) }
    catch { setError('Could not close the survey. Try again.') }
    finally { setBusy(false) }
  }
  function download() {
    if (!qr) return
    const a = document.createElement('a'); a.href = qr; a.download = 'classroom-survey-qr.png'; a.click()
  }
  return <main className="presentation">
    <div className="presentation-top"><Link to="/dashboard" className="back-link">Back to surveys</Link><button className="icon-button" title="Full screen" aria-label="Full screen" onClick={() => void document.documentElement.requestFullscreen?.()}><Maximize2 size={20} /></button></div>
    {error && <div className="alert" role="alert">{error}</div>}
    {!survey ? <div className="loading-state">Loading presentation…</div> : survey.status !== 'active' ? <div className="center-state"><h1>Survey is not active</h1><p>Activate it from the dashboard to show the QR code.</p></div> :
      <div className="presentation-body"><span className="presentation-label">Join this survey</span><h1>{survey.title}</h1>{survey.description && <p>{survey.description}</p>}
        {qr ? <img className="qr-image" src={qr} alt={`QR code linking to ${url}`} /> : <div className="qr-placeholder">Generating QR code…</div>}
        <a className="presentation-url" href={url} target="_blank" rel="noreferrer">{url} <ExternalLink size={19} /></a>
        <div className="response-counter"><strong>{count}</strong><span>{count === 1 ? 'response' : 'responses'} submitted</span></div>
        <div className="presentation-actions"><button className="button button-secondary" onClick={download} disabled={!qr}><Download size={17} /> Download QR</button><Link className="button button-secondary" to={`/surveys/${survey.id}/results`}>View results</Link><button className="button button-primary" disabled={busy} onClick={() => void close()}>{busy ? 'Closing…' : 'Close survey'}</button></div>
      </div>}
  </main>
}
