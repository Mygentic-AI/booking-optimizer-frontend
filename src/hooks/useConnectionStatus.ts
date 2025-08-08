import { useEffect, useState } from 'react';
import { useToast } from '@/components/toast/ToasterProvider';
import { useSupabase } from '@/providers/SupabaseProvider';

export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [sessionValid, setSessionValid] = useState(true);
  const { supabase } = useSupabase();
  const { setToastMessage } = useToast();

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setToastMessage({ type: 'success', message: 'Back online' });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setToastMessage({ type: 'error', message: 'Network connection lost' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setToastMessage]);

  // Session monitoring
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        console.log('Session check:', { 
          hasSession: !!currentSession, 
          error: error?.message,
          expiresAt: currentSession?.expires_at 
        });

        if (error) {
          console.error('Session check error:', error);
          setSessionValid(false);
          setToastMessage({ 
            type: 'error', 
            message: 'Session error: ' + error.message
          });
          return;
        }

        if (!currentSession) {
          console.log('No current session found');
          setSessionValid(false);
          return;
        }

        // Check if session is expired or about to expire
        const expiresAt = currentSession.expires_at;
        if (expiresAt) {
          const expiresAtDate = new Date(expiresAt * 1000);
          const now = new Date();
          const timeUntilExpiry = expiresAtDate.getTime() - now.getTime();
          console.log('Time until session expiry:', Math.floor(timeUntilExpiry / 1000), 'seconds');
          
          if (timeUntilExpiry < 0) {
            console.log('Session is expired, attempting refresh');
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              console.error('Session refresh failed:', refreshError);
              setSessionValid(false);
              return;
            }
            console.log('Session refreshed successfully');
            setSessionValid(true);
            return;
          }
          
          // If session expires in less than 5 minutes, try to refresh it
          const fiveMinutes = 5 * 60 * 1000;
          if (timeUntilExpiry < fiveMinutes) {
            console.log('Session expires soon, attempting refresh');
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              console.error('Session refresh failed:', refreshError);
              // Don't invalidate session yet, as it's still valid for a few minutes
              return;
            }
            console.log('Session refreshed successfully');
          }
        }

        setSessionValid(true);
      } catch (error) {
        console.error('Unexpected error in session check:', error);
        setSessionValid(false);
      }
    };

    // Check immediately on mount
    checkSession();
    
    // Then check periodically (every 30 seconds)
    const interval = setInterval(checkSession, 30000);
    
    // Also check when window regains focus
    const handleFocus = () => {
      console.log('Window focused, checking session');
      checkSession();
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [supabase.auth, setToastMessage]);

  return {
    isOnline,
    isReconnecting,
    sessionValid,
    setIsReconnecting
  };
}; 