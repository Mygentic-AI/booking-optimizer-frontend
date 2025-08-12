import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
} from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import { Inter } from "next/font/google";
import Head from "next/head";
import { useCallback, useState, useEffect, useMemo } from "react";

import { PlaygroundConnect } from "@/components/PlaygroundConnect";
import Playground from "@/components/playground/Playground";
import { PlaygroundToast } from "@/components/toast/PlaygroundToast";
import { useConfig } from "@/hooks/useConfig";
import { ConnectionMode, useConnection } from "@/hooks/useConnection";
import { useToast } from "@/components/toast/ToasterProvider";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useRouter } from "next/router";

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

const inter = Inter({ subsets: ["latin"] });

export default function HomeInner() {
  const { shouldConnect, wsUrl, token, mode, connect, disconnect } = useConnection();
  const { config } = useConfig();
  const { toastMessage } = useToast();
  const { session, supabase } = useSupabase();
  const [isLoading, setIsLoading] = useState(false); // Skip auth check for testing
  const router = useRouter();

  // Auto-connect only if coming from booking
  useEffect(() => {
    const autoConnect = async () => {
      // Check if we have booking context
      const bookingContext = sessionStorage.getItem('bookingContext');
      const bookingRoomName = sessionStorage.getItem('bookingRoomName');
      
      if (bookingContext && bookingRoomName) {
        // We're launching from a booking, auto-connect
        console.log('Launching from booking, auto-connecting...');
        // Store context for the agent to use
        (window as any).bookingContext = JSON.parse(bookingContext);
        (window as any).bookingRoomName = bookingRoomName;
        
        // Clear sessionStorage
        sessionStorage.removeItem('bookingContext');
        sessionStorage.removeItem('bookingRoomName');
        
        // Connect immediately
        handleConnect(true, 'env');
      }
      // Removed the else block that was auto-connecting for testing
    };
    
    autoConnect();
  }, []); // Only run once on mount

  const handleConnect = useCallback(
    async (c: boolean, mode: ConnectionMode) => {
      c ? connect(mode) : disconnect();
    },
    [connect, disconnect]
  );

  const showPG = useMemo(() => {
    if (process.env.NEXT_PUBLIC_LIVEKIT_URL) {
      return true;
    }
    if(wsUrl) {
      return true;
    }
    return false;
  }, [wsUrl]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--light-gray)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'var(--booking-primary)' }}></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{config.title}</title>
        <meta name="description" content={config.description} />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta
          property="og:description" 
          content="We're building the infrastructure to give every human being their own deeply personal AI powered agent, their digital AI twin."
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="relative flex flex-col h-full w-full" style={{ backgroundColor: 'var(--light-gray)' }}>
        {/* Navigation */}
        <nav className="booking-nav">
          <div className="booking-container">
            <div className="flex items-center justify-between">
              <a href="/dashboard" className="booking-nav-brand flex items-center gap-2">
                <span>🤖</span> Mygentic Clinic
              </a>
              <div className="flex gap-4">
                <a href="/dashboard" className="booking-nav-link">
                  Dashboard
                </a>
                <a href="/calendar" className="booking-nav-link">
                  Calendar
                </a>
                <a href="/clients" className="booking-nav-link">
                  Clients
                </a>
                <a href="/staff" className="booking-nav-link">
                  Staff
                </a>
                <a href="/" className="booking-nav-link active">
                  Confirm Appointment
                </a>
              </div>
            </div>
          </div>
        </nav>
        
        <div className="relative flex flex-col items-center flex-1 w-full overflow-hidden">
          <AnimatePresence>
          {toastMessage && (
            <motion.div
              className="left-0 right-0 top-0 absolute z-10"
              initial={{ opacity: 0, translateY: -50 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -50 }}
            >
              <PlaygroundToast />
            </motion.div>
          )}
        </AnimatePresence>
        {false ? ( // Skip PlaygroundConnect for testing
          <PlaygroundConnect
            accentColor={themeColors[0]}
            onConnectClicked={(mode) => {
              handleConnect(true, mode);
            }}
          />
        ) : true ? ( // Always show playground
          <LiveKitRoom
            className="flex flex-col h-full w-full"
            serverUrl={wsUrl}
            token={token}
            connect={shouldConnect}
            onError={(e) => {
              console.error(e);
            }}
          >
            <Playground
              themeColors={themeColors}
              onConnect={(c) => {
                const m = process.env.NEXT_PUBLIC_LIVEKIT_URL ? "env" : mode;
                handleConnect(c, m);
              }}
            />
            <RoomAudioRenderer />
            <StartAudio label="Click to enable audio playback" />
          </LiveKitRoom>
        ) : null}
        </div>
      </main>
    </>
  );
}