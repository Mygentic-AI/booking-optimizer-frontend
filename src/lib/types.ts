import { LocalAudioTrack, LocalVideoTrack } from "livekit-client";

export interface SessionProps {
  roomName: string;
  identity: string;
  audioTrack?: LocalAudioTrack;
  videoTrack?: LocalVideoTrack;
  region?: string;
  turnServer?: RTCIceServer;
  forceRelay?: boolean;
}

export interface TokenResult {
  identity: string;
  accessToken: string;
}

export interface UserProfile {
  id: number;
  created_at: string;
  firstname: string;
  middlenames: string | null;
  lastname: string;
  whatsapp: string | null;
  telegram: string | null;
  primaryemail: string | null;
  auth_id: string | null;
  updated_at: string | null;
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
}