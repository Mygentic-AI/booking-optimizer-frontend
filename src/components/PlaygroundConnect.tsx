import { useConfig } from "@/hooks/useConfig";
import { Button } from "./button/Button";
import { useState, useEffect } from "react";
import { ConnectionMode } from "@/hooks/useConnection";
import { useToast } from "@/components/toast/ToasterProvider";
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import Image from 'next/image';
import { useSupabase } from "@/providers/SupabaseProvider";
import { useRouter } from 'next/router';

type PlaygroundConnectProps = {
  accentColor: string;
  onConnectClicked: (mode: ConnectionMode) => void;
};

export const PlaygroundConnect = ({
  accentColor,
  onConnectClicked,
}: PlaygroundConnectProps) => {
  const { setToastMessage } = useToast();
  const { supabase } = useSupabase();
  const router = useRouter();
  const redirectUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/auth/callback`
    : '/api/auth/callback';

  // Handle any error messages passed in the URL
  useEffect(() => {
    const { error, message } = router.query;
    if (error && message) {
      setToastMessage({
        type: 'error',
        message: Array.isArray(message) ? message[0] : message
      });
      // Clear the error from the URL
      router.replace('/', undefined, { shallow: true });
    }
  }, [router, setToastMessage]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full">
      <div className="w-full max-w-md">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg shadow-lg p-8">
          <div className="flex flex-col items-center space-y-6">
            <div className="w-64 h-64 relative">
              <Image
                src="/logo.svg"
                alt="Logo"
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
            
            <div className="w-full">
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  extend: true,
                  className: {
                    container: 'auth-container',
                    button: 'auth-button hover:shadow-md transition-shadow !bg-white !text-gray-700 border border-gray-200',
                    input: 'auth-input',
                    divider: 'auth-divider',
                    label: 'auth-label',
                  },
                  style: {
                    button: {
                      background: 'white',
                      color: '#3c4043',
                      border: '1px solid #dadce0',
                      backgroundImage: 'none',
                    },
                  },
                }}
                localization={{
                  variables: {
                    sign_in: {
                      social_provider_text: "Sign in / Sign up with {{provider}}",
                    },
                  },
                }}
                theme="default"
                providers={['google']}
                onlyThirdPartyProviders
                redirectTo={redirectUrl}
                queryParams={{
                  access_type: 'offline',
                  prompt: 'consent'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);