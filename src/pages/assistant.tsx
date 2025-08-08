// import { AuthGuard } from '@/components/AuthGuard'; // Disabled auth for testing
import Playground from '@/components/playground/Playground';
import { LiveKitRoom, RoomAudioRenderer, StartAudio } from '@livekit/components-react';
import { useConnection } from '@/hooks/useConnection';
import { useToast } from '@/components/toast/ToasterProvider';
import { useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/router';

const themeColors = [
  "cyan",
  "green",
  "amber",
  "blue",
  "violet",
  "rose",
  "pink",
  "teal",
];

export default function AssistantPage() {
  const { shouldConnect, wsUrl, token, mode, connect, disconnect } = useConnection();
  const { setToastMessage } = useToast();
  const supabase = createClientComponentClient();
  const router = useRouter();

  // Auth disabled for testing
  // useEffect(() => {
  //   const handleSession = async () => {
  //     try {
  //       // Verify the session
  //       const { data: { session }, error } = await supabase.auth.getSession();
  //       if (error || !session) {
  //         console.log('No valid session found, redirecting to home');
  //         router.replace('/', {
  //           query: {
  //             message: 'Please sign in to access Mygentic\'s AI Assistant'
  //           }
  //         });
  //         return;
  //       }
  //     } catch (error) {
  //       console.error('Session handling error:', error);
  //       setToastMessage({
  //         type: 'error',
  //         message: 'Failed to initialize session. Please try again.'
  //       });
  //       router.push('/');
  //     }
  //   };
  //
  //   handleSession();
  // }, [router, setToastMessage, supabase.auth]);

  return (
    <main className="relative flex flex-col justify-center px-4 items-center h-full w-full bg-black repeating-square-background">
        <LiveKitRoom
          className="flex flex-col h-full w-full"
          serverUrl={wsUrl}
          token={token}
          connect={shouldConnect}
          onError={(e) => {
            setToastMessage({ message: e.message, type: "error" });
            console.error('LiveKit connection error:', e);
          }}
          onConnected={() => {
            console.log('LiveKit room connected successfully');
          }}
          onDisconnected={(reason) => {
            console.log('LiveKit room disconnected:', reason);
          }}
          // Add a small delay to ensure proper connection initialization
          connectOptions={{
            autoSubscribe: true,
            rtcConfig: {
              iceTransportPolicy: 'all',
              bundlePolicy: 'balanced'
            }
          }}
        >
          <Playground
            themeColors={themeColors}
            onConnect={(c) => {
              const m = process.env.NEXT_PUBLIC_LIVEKIT_URL ? "env" : mode;
              c ? connect(m) : disconnect();
            }}
          />
          <RoomAudioRenderer />
          <StartAudio label="Click to enable audio playback" />
        </LiveKitRoom>
      </main>
  );
} 