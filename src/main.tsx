import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { configured } from './lib/supabase'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import './styles.css'

const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const EditorPage = lazy(() => import('./pages/EditorPage').then(m => ({ default: m.EditorPage })))
const PresentPage = lazy(() => import('./pages/PresentPage').then(m => ({ default: m.PresentPage })))
const ResultsPage = lazy(() => import('./pages/ResultsPage').then(m => ({ default: m.ResultsPage })))
const StudentPage = lazy(() => import('./pages/StudentPage').then(m => ({ default: m.StudentPage })))

function Protected({ children }: { children: React.ReactNode }) {
  const { session, loading, instructor } = useAuth()
  if (loading) return <div className="center-state">Checking sign in…</div>
  if (!session) return <Navigate to="/login" replace />
  if (!instructor) return <div className="center-state"><h1>Instructor access needed</h1><p>This account has not been added to the instructor allowlist.</p></div>
  return children
}

function App() {
  if (!configured) return <div className="center-state"><h1>Setup needed</h1><p>Add your Supabase project URL and publishable key to a <code>.env</code> file, then restart the app. See README.md.</p></div>
  return <BrowserRouter><AuthProvider><Suspense fallback={<div className="center-state">Loading…</div>}><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
    <Route path="/surveys/new" element={<Protected><EditorPage /></Protected>} />
    <Route path="/surveys/:id/edit" element={<Protected><EditorPage /></Protected>} />
    <Route path="/surveys/:id/present" element={<Protected><PresentPage /></Protected>} />
    <Route path="/surveys/:id/results" element={<Protected><ResultsPage /></Protected>} />
    <Route path="/s/:slug" element={<StudentPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense></AuthProvider></BrowserRouter>
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
