import { AuthGuard } from '@/components/AuthGuard';
import { useToast } from '@/components/toast/ToasterProvider';
import { useConnection } from '@/hooks/useConnection';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function AppPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { setToastMessage } = useToast();
  const { connect } = useConnection();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const { code } = router.query;

        // If we have a code, exchange it for a session
        if (code && typeof code === 'string') {
          console.log('Exchanging auth code for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            throw error;
          }

          if (!data.session) {
            throw new Error('No session returned after code exchange');
          }

          // Clear the code from URL
          router.replace('/assistant', undefined, { shallow: true });
          return;
        }

        // If no code, check for existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          console.log('No active session, redirecting to home');
          router.replace('/');
          return;
        }
        
        // Redirect to assistant if we have a valid session
        router.replace('/assistant');

      } catch (error) {
        console.error('Session initialization error:', error);
        setToastMessage({
          type: 'error',
          message: 'Failed to initialize session. Please try again.'
        });
        router.replace('/');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeSession();
  }, [router, setToastMessage, supabase.auth]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return null;
} 