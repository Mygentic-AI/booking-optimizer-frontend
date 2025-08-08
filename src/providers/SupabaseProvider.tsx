'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/router'
import { type Session, type SupabaseClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'
import { useToast } from '@/components/toast/ToasterProvider'

type SupabaseContext = {
  supabase: SupabaseClient<Database>
  session: Session | null
  isLoading: boolean
  fullLogout: () => Promise<void>
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode
  initialSession?: Session | null
}) {
  const [supabase] = useState(() => createPagesBrowserClient())
  const [session, setSession] = useState<Session | null>(initialSession ?? null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { setToastMessage } = useToast()
  const hasInitialized = useRef(false)

  // Add the comprehensive logout function
  const fullLogout = async () => {
    try {
      // 1. Sign out from Supabase (this clears the session)
      await supabase.auth.signOut()
      
      // 2. Clear localStorage
      localStorage.clear()
      
      // 3. Clear sessionStorage
      sessionStorage.clear()
      
      // 4. Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })
      
      // 5. Clear the session state
      setSession(null)
      
      // 6. Redirect to home page
      router.push('/')
      
      // 7. Show success message
      setToastMessage({
        type: "info",
        message: "You have been completely signed out"
      })
      
      // 8. Force reload the page to clear any remaining state
      window.location.reload()
    } catch (error) {
      console.error('Logout error:', error)
      setToastMessage({
        type: "error",
        message: "Error during logout. Please try again."
      })
    }
  }

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    const initializeAuth = async () => {
      try {
        // Get the current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw sessionError;
        }

        setSession(currentSession)
        
        if (currentSession) {
          // If we have a session and we're on the home page, redirect to Mygentic's AI Assistant
          if (router.pathname === '/') {
            try {
              await router.replace('/assistant');
            } catch (error) {
              console.error('Navigation error:', error);
              // Continue with the session even if navigation fails
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setToastMessage({
          type: 'error',
          message: 'Failed to initialize session. Please try again.'
        })
      } finally {
        setIsLoading(false)
      }
    }

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state change:', { event, hasSession: !!newSession })
      
      if (event === 'SIGNED_IN') {
        setSession(newSession)
        // Only redirect if we're on the home page
        if (router.pathname === '/') {
          try {
            await router.replace('/assistant');
          } catch (error) {
            console.error('Navigation error:', error);
            // Continue with the session even if navigation fails
          }
        }
        setToastMessage({
          type: "success",
          message: "Successfully signed in"
        })
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        try {
          await router.replace('/');
        } catch (error) {
          console.error('Navigation error:', error);
          // Force a hard refresh if soft navigation fails
          window.location.href = '/';
        }
        setToastMessage({
          type: "info",
          message: "You have been signed out"
        })
      } else if (event === 'TOKEN_REFRESHED') {
        setSession(newSession)
      }
    })

    initializeAuth()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, setToastMessage])

  return (
    <Context.Provider value={{ supabase, session, isLoading, fullLogout }}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}