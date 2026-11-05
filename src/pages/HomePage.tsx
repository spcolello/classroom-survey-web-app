import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardList, QrCode, ChartNoAxesColumn } from 'lucide-react'
import { ResetPasswordPage } from './ResetPasswordPage'
import { demoUrl, publicDemo } from '../lib/demo'

export function HomePage() {
  if (window.location.hash.includes('type=recovery')) return <ResetPasswordPage />
  return <div className="landing">
    <header className="landing-header"><span className="brand brand-dark"><span className="brand-mark"><ClipboardList size={21} /></span><span>Classroom Survey</span></span><Link className="text-link" to="/login">{publicDemo ? 'Enter public demo' : 'Instructor sign in'} <ArrowRight size={17} /></Link></header>
    <main className="landing-main">
      <div className="landing-copy"><h1>Check understanding in the moment.</h1><p>Create a quick survey, share it by QR code, and see how your class responds.</p><Link className="button button-primary" to="/login">{publicDemo ? 'Enter public demo' : 'Instructor sign in'} <ArrowRight size={18} /></Link>{!publicDemo && <p className="demo-link">No instructor account? <a href={demoUrl}>Try the public instructor demo</a>.</p>}</div>
      <div className="landing-steps" aria-label="How it works">
        <div><span className="step-icon"><ClipboardList size={24} /></span><h2>Prepare</h2><p>Write multiple choice or true and false questions.</p></div>
        <div><span className="step-icon"><QrCode size={24} /></span><h2>Share</h2><p>Show the QR code on a classroom screen.</p></div>
        <div><span className="step-icon"><ChartNoAxesColumn size={24} /></span><h2>Review</h2><p>See counts, percentages, and a CSV export.</p></div>
      </div>
    </main>
  </div>
}
