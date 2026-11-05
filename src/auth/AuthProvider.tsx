import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { db } from '../lib/supabase'

type AuthState = { session: Session | null; loading: boolean; instructor: boolean; refresh: () => Promise<void> }
const Context = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [instructor, setInstructor] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      const { data } = await db().auth.getSession()
      setSession(data.session)
      if (data.session) {
        const result = await db().rpc('is_instructor')
        setInstructor(result.data === true && !result.error)
      } else setInstructor(false)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    void refresh()
    // Supabase recommends deferring other auth API calls from this callback.
    const { data } = db().auth.onAuthStateChange(() => { window.setTimeout(() => { void refresh() }, 0) })
    return () => data.subscription.unsubscribe()
  }, [])
  return <Context.Provider value={{ session, loading, instructor, refresh }}>{children}</Context.Provider>
}

export function useAuth(): AuthState {
  const value = useContext(Context)
  if (!value) throw new Error('AuthProvider is missing')
  return value
}
