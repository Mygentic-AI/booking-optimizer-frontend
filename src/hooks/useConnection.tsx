"use client"

import { useCloud } from "@/cloud/useCloud";
import React, { createContext, useEffect, useState, useRef } from "react";
import { useCallback } from "react";
import { useConfig } from "./useConfig";
import { useToast } from "@/components/toast/ToasterProvider";
import { useConnectionStatus } from './useConnectionStatus';
import { useSupabase } from '@/providers/SupabaseProvider';

export type ConnectionMode = "cloud" | "manual" | "env"

type TokenGeneratorData = {
  shouldConnect: boolean;
  wsUrl: string;
  token: string;
  mode: ConnectionMode;
  disconnect: () => Promise<void>;
  connect: (mode: ConnectionMode) => Promise<void>;
};

const ConnectionContext = createContext<TokenGeneratorData | undefined>(undefined);

export const ConnectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { generateToken, wsUrl: cloudWSUrl } = useCloud();
  const { setToastMessage } = useToast();
  const { config } = useConfig();
  const { supabase, session } = useSupabase();
  const { isOnline, isReconnecting, setIsReconnecting, sessionValid } = useConnectionStatus();
  const [connectionDetails, setConnectionDetails] = useState<{
    wsUrl: string;
    token: string;
    mode: ConnectionMode;
    shouldConnect: boolean;
    isDisconnecting: boolean;
  }>({ 
    wsUrl: "", 
    token: "", 
    shouldConnect: false, 
    mode: "manual",
    isDisconnecting: false 
  });
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 5;
  const connectingRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const getBackoffTime = (retry: number) => Math.min(1000 * Math.pow(2, retry), 30000);

  const parseJWT = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error parsing JWT:', e);
      return null;
    }
  };

  const connect = useCallback(
    async (mode: ConnectionMode) => {
      // Don't connect if we're disconnecting or already connected
      if (connectionDetails.isDisconnecting || connectionDetails.shouldConnect) {
        console.log('Connection blocked - disconnecting:', connectionDetails.isDisconnecting, 'shouldConnect:', connectionDetails.shouldConnect);
        return;
      }

      // Prevent multiple simultaneous connection attempts
      if (connectingRef.current) {
        console.log('Connection already in progress');
        return;
      }

      // Auth disabled for testing
      // if (!session?.user?.id) {
      //   setToastMessage({
      //     type: "error",
      //     message: "Please sign in to continue"
      //   });
      //   return;
      // }

      // Session check disabled for testing
      // if (!sessionValid) {
      //   try {
      //     // Try to refresh the session before giving up
      //     const { error: refreshError } = await supabase.auth.refreshSession();
      //     if (refreshError) {
      //       setToastMessage({
      //         type: "error",
      //         message: "Session expired. Please sign in again."
      //       });
      //       await supabase.auth.signOut();
      //       return;
      //     }
      //   } catch (error) {
      //     setToastMessage({
      //       type: "error",
      //       message: "Session expired. Please sign in again."
      //     });
      //     await supabase.auth.signOut();
      //     return;
      //   }
      // }

      if (!isOnline) {
        setToastMessage({
          type: "error",
          message: "No internet connection. Please check your network."
        });
        return;
      }

      let token = "";
      const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
      
      if (!wsUrl) {
        setToastMessage({
          type: "error",
          message: "Missing LiveKit URL configuration. Please check environment variables."
        });
        return;
      }
      
      try {
        connectingRef.current = true;
        setIsReconnecting(true);

        // Use test data when auth is disabled
        const tokenPayload = {
          userEmail: 'test@example.com',
          fullName: 'Test User',
          userId: 'test-user-123'
        };
        
        console.log('Requesting token with payload:', tokenPayload);

        const response = await fetch("/api/token", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer test-token`
          },
          body: JSON.stringify(tokenPayload)
        });

          if (!response.ok) {
          if (response.status === 401) {
            // Try to refresh the session one last time
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              setToastMessage({
                type: "error",
                message: "Session expired. Please sign in again."
              });
              await supabase.auth.signOut();
              return;
            }
            // Retry the request with the new session
            return connect(mode);
          }
          throw new Error(`Token server responded with status ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw token response:', data);
        token = data.token;
        
        // Parse the token to verify room information
        try {
        const tokenPayload = parseJWT(token);
        console.log('Full token payload:', tokenPayload);
        console.log('Video claims:', tokenPayload?.video);
        
        // Parse metadata if it exists as a string
        let parsedMetadata: Record<string, any> = {};
        if (typeof tokenPayload?.metadata === 'string') {
        try {
        parsedMetadata = JSON.parse(tokenPayload.metadata);
        console.log('Parsed metadata:', parsedMetadata);
        } catch (e) {
        console.warn('Failed to parse metadata string:', e);
        }
        }
        
        // LiveKit tokens can have identity in different places
        // Try all possible locations
        const identity = tokenPayload?.identity || 
                       tokenPayload?.video?.identity || 
                         parsedMetadata?.identity || 
                       parsedMetadata?.fullName;
        
          console.log('Token payload parsed:', { 
              room: tokenPayload?.video?.room,
              participant: identity,
              name: tokenPayload?.video?.name,
              metadata: parsedMetadata || tokenPayload?.metadata || tokenPayload?.video?.metadata
            });
            
            // Verify required fields - check all possible locations
            if (!identity) {
              throw new Error('Token missing participant identity');
            }
          } catch (error) {
            console.error('Token validation error:', error);
            throw new Error('Invalid token format: missing required fields');
          }

        setConnectionDetails({ wsUrl: wsUrl, token, shouldConnect: true, mode, isDisconnecting: false });
        console.log('Connection details set:', { 
          wsUrl, 
          hasToken: !!token, 
          shouldConnect: true, 
          mode 
        });
        setRetryCount(0); // Reset retry count on successful connection
      } catch (error) {
        console.error("Token fetch error:", error);
        
        if (error instanceof Error && error.message.includes('No valid session')) {
          setToastMessage({
            type: "error",
            message: "Please sign in to continue"
          });
          return;
        }
        
        if (retryCount < MAX_RETRIES) {
          setToastMessage({
            type: "info",
            message: `Connection failed. Retrying in ${getBackoffTime(retryCount)/1000} seconds...`
          });
          
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            connect(mode);
          }, getBackoffTime(retryCount));
        } else {
          setToastMessage({
            type: "error",
            message: "Failed to connect after multiple attempts. Please try again later."
          });
        }
      } finally {
        connectingRef.current = false;
        setIsReconnecting(false);
      }
    },
    [
      session?.user?.id,
      setToastMessage, 
      isOnline, 
      sessionValid, 
      retryCount, 
      setIsReconnecting,
      supabase.auth,
      connectionDetails.shouldConnect,
      connectionDetails.isDisconnecting
    ]
  );

  const disconnect = useCallback(async () => {
    console.log('Disconnecting - current state:', {
      shouldConnect: connectionDetails.shouldConnect,
      isDisconnecting: connectionDetails.isDisconnecting
    });

    // Set disconnecting state first
    setConnectionDetails(prev => ({
      ...prev,
      isDisconnecting: true
    }));

    // Clear connection after a short delay to ensure LiveKit has time to cleanup
    setTimeout(() => {
      if (mountedRef.current) {
        setConnectionDetails({
          wsUrl: "",
          token: "",
          shouldConnect: false,
          mode: "manual",
          isDisconnecting: false
        });
        setRetryCount(0);
        connectingRef.current = false;
        setIsReconnecting(false);
      }
    }, 500);
  }, [setIsReconnecting, connectionDetails]);

  return (
    <ConnectionContext.Provider
      value={{
        wsUrl: connectionDetails.wsUrl,
        token: connectionDetails.token,
        shouldConnect: connectionDetails.shouldConnect && !connectionDetails.isDisconnecting,
        mode: connectionDetails.mode,
        connect,
        disconnect,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const context = React.useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return context;
};