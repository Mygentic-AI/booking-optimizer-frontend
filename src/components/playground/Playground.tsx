"use client";

import { LoadingSVG } from "@/components/button/LoadingSVG";
import { ChatMessageType } from "@/components/chat/ChatTile";
import { ChatTileCompact } from "@/components/chat/ChatTileCompact";
import { ColorPicker } from "@/components/colorPicker/ColorPicker";
import { AudioInputTile } from "@/components/config/AudioInputTile";
import { ConfigurationPanelItem } from "@/components/config/ConfigurationPanelItem";
import { NameValueRow } from "@/components/config/NameValueRow";
import { PlaygroundHeader } from "@/components/playground/PlaygroundHeader";
import {
  PlaygroundTab,
  PlaygroundTabbedTile,
  PlaygroundTile,
} from "@/components/playground/PlaygroundTile";
import { useConfig } from "@/hooks/useConfig";
import { TranscriptionTile } from "@/transcriptions/TranscriptionTile";
import {
  BarVisualizer,
  VideoTrack,
  useConnectionState,
  useDataChannel,
  useLocalParticipant,
  useRoomInfo,
  useTracks,
  useVoiceAssistant,
} from "@livekit/components-react";
// import { ConnectionState, LocalParticipant, Track } from "livekit-client";
import { ConnectionState, LocalParticipant as LiveKitParticipant, Track } from "livekit-client";
import { TrackToggle } from "@livekit/components-react";
import { QRCodeSVG } from "qrcode.react";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import tailwindTheme from "../../lib/tailwindTheme.preval";
import { PlaygroundDeviceSelector } from "@/components/playground/PlaygroundDeviceSelector";

import { EditableNameValueRow } from "../config/EditableNameValueRow";

import { useConnection } from "@/hooks/useConnection";
import { useSupabase } from "@/providers/SupabaseProvider";
// import { RpcMethod } from "livekit-client";
// import { useEffect } from "react";

import { Button } from "@/components/button/Button";

interface ParticipantMetadata {
  fullName: string;
  userEmail: string;
  userId: string;
}

const parseMetadata = (metadata: string | undefined): ParticipantMetadata | null => {
  if (!metadata) return null;
  try {
    const parsed = JSON.parse(metadata);
    return {
      fullName: parsed.fullName,
      userEmail: parsed.userEmail,
      userId: parsed.userId
    };
  } catch (e) {
    console.error('Error parsing participant metadata:', e);
    return null;
  }
};

export interface PlaygroundMeta {
  name: string;
  value: string;
}

export interface PlaygroundProps {
  logo?: ReactNode;
  themeColors: string[];
  onConnect: (connect: boolean, opts?: { token: string; url: string }) => void;
}

const headerHeight = 56;

export default function Playground({
  logo,
  themeColors,
  onConnect,
}: PlaygroundProps) {

  console.log('Playground component rendering');
  const { config, setUserSettings } = useConfig();
  const { name } = useRoomInfo();
  const { disconnect } = useConnection();
  const { fullLogout } = useSupabase();

  // Add these lines right after that line above
  const [transcripts, setTranscripts] = useState<ChatMessageType[]>(() => {
    console.log('Initializing transcripts state');
    return [];
  });
  
  // Diagnosis chat state
  const [diagnosisMessages, setDiagnosisMessages] = useState<ChatMessageType[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Settings visibility
  const [showSettings, setShowSettings] = useState(false);
  
  const { localParticipant } = useLocalParticipant();

  const voiceAssistant = useVoiceAssistant();
  const roomState = useConnectionState();
  const tracks = useTracks();

  useEffect(() => {
    const handleToggleSettings = () => setShowSettings(prev => !prev);
    window.addEventListener('toggle-settings', handleToggleSettings);
    return () => window.removeEventListener('toggle-settings', handleToggleSettings);
  }, []);

  useEffect(() => {
    if (roomState === ConnectionState.Connected && localParticipant) {
      console.log('Playground mounted, room state:', roomState);
      console.log('Local participant:', localParticipant?.identity);
      
      try {
        (localParticipant as any).registerRpcMethod('handleDisconnect', async (data: any): Promise<string> => {
          console.log('RPC handleDisconnect triggered');
          const params = JSON.parse(data.payload);
          console.log('Parsed disconnect reason:', params.reason);
          
          try {
            await disconnect();
            console.log('Disconnect completed successfully');
            return JSON.stringify({success: true});
          } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            console.error('Error during disconnect:', errorMessage);
            return JSON.stringify({success: false, error: errorMessage});
          }
        });
        console.log('RPC handler registered successfully');
      } catch (err) {
        console.error('Failed to register RPC handler:', err);
      }
    }
  }, [roomState, localParticipant, disconnect]);

  // Handle manual disconnect via UI
  const handleDisconnect = useCallback(async () => {
    console.log('Manual disconnect triggered');
    try {
      await disconnect();
      console.log('Disconnect completed successfully');
    } catch (error) {
      console.error('Error during manual disconnect:', error);
    }
  }, [disconnect]);

  useEffect(() => {
    if (roomState === ConnectionState.Connected) {
      localParticipant.setCameraEnabled(config.settings.inputs.camera);
      localParticipant.setMicrophoneEnabled(config.settings.inputs.mic);
    }
  }, [config, localParticipant, roomState]);

  const agentVideoTrack = tracks.find(
    (trackRef) =>
      trackRef.publication.kind === Track.Kind.Video &&
      trackRef.participant.isAgent
  );

  const localTracks = tracks.filter(
    ({ participant }) => participant instanceof LiveKitParticipant
  );
  const localVideoTrack = localTracks.find(
    ({ source }) => source === Track.Source.Camera
  );
  const localMicTrack = localTracks.find(
    ({ source }) => source === Track.Source.Microphone
  );

  const onDataReceived = useCallback(
    (msg: any) => {
      if (msg.topic === "transcription") {
        const decoded = JSON.parse(
          new TextDecoder("utf-8").decode(msg.payload)
        );
        let timestamp = new Date().getTime();
        if ("timestamp" in decoded && decoded.timestamp > 0) {
          timestamp = decoded.timestamp;
        }
        setTranscripts([
          ...transcripts,
          {
            name: "You",
            message: decoded.text,
            timestamp: timestamp,
            isSelf: true,
          },
        ]);
      } else if (msg.topic === "diagnosis") {
        // Handle diagnosis updates from backend
        const diagnosisData = JSON.parse(
          new TextDecoder("utf-8").decode(msg.payload)
        );
        
        if (diagnosisData.type === "diagnosis_update") {
          // Format the diagnosis message
          let formattedMessage = `**Input:**\n${diagnosisData.narrative}\n\n`;
          
          // Add diagnoses
          formattedMessage += "**Diagnoses:**\n";
          if (diagnosisData.diagnosis && diagnosisData.diagnosis.length > 0) {
            diagnosisData.diagnosis.forEach((dx: string) => {
              formattedMessage += `• ${dx}\n`;
            });
            formattedMessage += "\n";
          } else {
            formattedMessage += "\n\n";
          }
          
          // Add follow-up questions
          formattedMessage += "**Recommended follow-up questions:**\n";
          if (diagnosisData.follow_up_questions && diagnosisData.follow_up_questions.length > 0) {
            diagnosisData.follow_up_questions.forEach((q: string) => {
              formattedMessage += `• ${q}\n`;
            });
            formattedMessage += "\n";
          } else {
            formattedMessage += "\n\n";
          }
          
          // Add tests
          formattedMessage += "**Recommended follow-up tests:**\n";
          if (diagnosisData.further_tests && diagnosisData.further_tests.length > 0) {
            diagnosisData.further_tests.forEach((test: string) => {
              formattedMessage += `• ${test}\n`;
            });
          } else {
            formattedMessage += "\n";
          }
          
          // Update diagnosis chat with the formatted message
          const diagnosisMessage: ChatMessageType = {
            name: "Diagnosis Analysis",
            message: formattedMessage,
            isSelf: false,
            timestamp: Date.now()
          };
          setDiagnosisMessages([diagnosisMessage]);
        }
      }
    },
    [transcripts]
  );

  useDataChannel(onDataReceived);

  // Handle sending diagnosis chat messages
  const sendDiagnosisMessage = useCallback(async (message: string) => {
    if (!message.trim() || isStreaming) return;
    
    setIsStreaming(true);
    
    try {
      const response = await fetch(`http://localhost:8000/api/diagnosis/chat?message=${encodeURIComponent(message)}`);
      
      if (!response.ok) throw new Error('Failed to get response');
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        let fullResponse = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              fullResponse += data;
            }
          }
        }
        
        // Format the response into 4 sections with markdown formatting
        let formattedMessage = `**Input:**\n${message}\n\n`;
        
        try {
          // Parse the JSON response
          const data = JSON.parse(fullResponse);
          
          // Add diagnoses section
          formattedMessage += "**Diagnoses:**\n";
          if (data.diagnosis && data.diagnosis.length > 0) {
            data.diagnosis.forEach((dx: string) => {
              formattedMessage += `• ${dx}\n`;
            });
            formattedMessage += "\n";
          } else {
            formattedMessage += "\n\n";
          }
          
          // Add follow-up questions section
          formattedMessage += "**Recommended follow-up questions:**\n";
          if (data.follow_up_questions && data.follow_up_questions.length > 0) {
            data.follow_up_questions.forEach((q: string) => {
              formattedMessage += `• ${q}\n`;
            });
            formattedMessage += "\n";
          } else {
            formattedMessage += "\n\n";
          }
          
          // Add tests section
          formattedMessage += "**Recommended follow-up tests:**\n";
          if (data.further_tests && data.further_tests.length > 0) {
            data.further_tests.forEach((test: string) => {
              formattedMessage += `• ${test}\n`;
            });
          } else {
            formattedMessage += "\n";
          }
        } catch (e) {
          console.error('Failed to parse diagnosis response:', e);
          formattedMessage += "Error parsing response\n";
        }
        
        // Replace all messages with just the formatted result
        const resultMessage: ChatMessageType = {
          name: "Diagnosis Analysis",
          message: formattedMessage,
          isSelf: false,
          timestamp: Date.now()
        };
        setDiagnosisMessages([resultMessage]);
      }
    } catch (error) {
      console.error('Diagnosis chat error:', error);
      const errorMessage: ChatMessageType = {
        name: "Error",
        message: 'Failed to get diagnosis. Please try again.',
        isSelf: false,
        timestamp: Date.now()
      };
      setDiagnosisMessages([errorMessage]);
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming]);

  const videoTileContent = useMemo(() => {
    const videoFitClassName = `object-${config.video_fit || "cover"}`;

    const disconnectedContent = (
      <div className="flex items-center justify-center text-gray-700 text-center w-full h-full">
        No video track. Connect to get started.
      </div>
    );

    const loadingContent = (
      <div className="flex flex-col items-center justify-center gap-2 text-gray-700 text-center h-full w-full">
        <LoadingSVG />
        Waiting for video track
      </div>
    );

    const videoContent = (
      <VideoTrack
        trackRef={agentVideoTrack}
        className={`absolute top-1/2 -translate-y-1/2 ${videoFitClassName} object-position-center w-full h-full`}
      />
    );

    let content = null;
    if (roomState === ConnectionState.Disconnected) {
      content = disconnectedContent;
    } else if (agentVideoTrack) {
      content = videoContent;
    } else {
      content = loadingContent;
    }

    return (
      <div className="flex flex-col w-full grow text-gray-950 bg-black rounded-sm border border-gray-800 relative">
        {content}
      </div>
    );
  }, [agentVideoTrack, config, roomState]);

  useEffect(() => {
    document.body.style.setProperty(
      "--lk-theme-color",
      // @ts-ignore
      tailwindTheme.colors[config.settings.theme_color]["500"]
    );
    document.body.style.setProperty(
      "--lk-drop-shadow",
      `var(--lk-theme-color) 0px 0px 18px`
    );
  }, [config.settings.theme_color]);

  const chatTileContent = useMemo(() => {
    return (
      <div className="flex flex-col w-full h-full">
        {/* Chat Component - with overflow container */}
        <div className="flex-1 min-h-0"> {/* Add min-h-0 to enable proper flexbox scrolling */}
          {voiceAssistant.audioTrack && (
            <TranscriptionTile
              agentAudioTrack={voiceAssistant.audioTrack}
              accentColor={config.settings.theme_color}
            />
          )}
        </div>
     
        <div className="border-t border-gray-800 bg-black p-0">
          <div className="flex items-center justify-center w-full h-10 bg-gray-900/40 m-2">
            <BarVisualizer
              state={voiceAssistant.state}
              trackRef={voiceAssistant.audioTrack}
              barCount={5}
              options={{ minHeight: 14 }}
              className="[--lk-va-bar-width:20px] [--lk-va-bar-gap:12px] [--lk-fg:var(--lk-theme-color)] [--lk-bar-bg:rgb(38,38,38)]"
            />
          </div>
     
          <div className="m-2">
            <div className="flex items-center bg-gray-900/40">
              <div className="flex-grow">
                {localMicTrack && <AudioInputTile trackRef={localMicTrack} />}
              </div>
              
              <div className="flex items-center gap-2 p-3">
                <TrackToggle 
                  source={Track.Source.Microphone}
                  className="bg-gray-900/60 p-2 rounded-lg text-white"
                />
                <PlaygroundDeviceSelector kind="audioinput" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [config.settings.theme_color, voiceAssistant.audioTrack, voiceAssistant.state, localMicTrack]);

  const diagnosisTileContent = useMemo(() => {
    return (
      <ChatTileCompact
        messages={diagnosisMessages}
        accentColor={config.settings.theme_color}
        onSend={sendDiagnosisMessage}
      />
    );
  }, [diagnosisMessages, config.settings.theme_color, sendDiagnosisMessage]);

  const settingsTileContent = useMemo(() => {
    const metadata = parseMetadata(localParticipant?.metadata as string);
    
    return (
      <div className="flex flex-col gap-4 h-full w-full items-start overflow-y-auto">
        <ConfigurationPanelItem 
          title={
            <div className="flex items-center gap-2">
              <span>Status</span>
              <div className={`w-2 h-2 rounded-full ${
                roomState === ConnectionState.Connected ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>
          }
        >
          <div className="flex flex-col gap-2">
            <NameValueRow
              name="Room connected"
              value={
                roomState === ConnectionState.Connecting ? (
                  <LoadingSVG diameter={16} strokeWidth={2} />
                ) : (
                  roomState.toUpperCase()
                )
              }
              valueColor={
                roomState === ConnectionState.Connected
                  ? `${config.settings.theme_color}-500`
                  : "gray-500"
              }
            />
            <NameValueRow
              name="Agent connected"
              value={
                voiceAssistant.agent ? (
                  "TRUE"
                ) : roomState === ConnectionState.Connected ? (
                  <LoadingSVG diameter={12} strokeWidth={2} />
                ) : (
                  "FALSE"
                )
              }
              valueColor={
                voiceAssistant.agent
                  ? `${config.settings.theme_color}-500`
                  : "gray-500"
              }
            />
            <div className="mt-4 flex justify-end">
              <Button
                onClick={fullLogout}
                accentColor="pink"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </ConfigurationPanelItem>

        <ConfigurationPanelItem title="User Settings">
          {localParticipant && (
            <div className="flex flex-col gap-2">
              <NameValueRow
                name="Full Name"
                value={metadata?.fullName || '-'}
                valueColor={`${config.settings.theme_color}-500`}
              />
              <NameValueRow
                name="Email"
                value={metadata?.userEmail || '-'}
                valueColor={`${config.settings.theme_color}-500`}
              />
              <NameValueRow
                name="User ID"
                value={metadata?.userId || '-'}
                valueColor={`${config.settings.theme_color}-500`}
              />
              <NameValueRow
                name="Room"
                value={name || '-'}
                valueColor={`${config.settings.theme_color}-500`}
              />
            </div>
          )}
        </ConfigurationPanelItem>

        {localVideoTrack && (
          <ConfigurationPanelItem
            title="Camera"
            deviceSelectorKind="videoinput"
          >
            <div className="relative">
              <VideoTrack
                className="rounded-sm border border-gray-800 opacity-70 w-full"
                trackRef={localVideoTrack}
              />
            </div>
          </ConfigurationPanelItem>
        )}
      </div>
    );
  }, [
    config.settings.theme_color,
    localParticipant,
    name,
    roomState,
    localVideoTrack,
    voiceAssistant.agent,
    fullLogout,
  ]);

  let mobileTabs: PlaygroundTab[] = [];
  if (config.settings.outputs.video) {
    mobileTabs.push({
      title: "Video",
      content: (
        <PlaygroundTile
          className="w-full h-full grow"
          childrenClassName="justify-center"
        >
          {videoTileContent}
        </PlaygroundTile>
      ),
    });
  }

  if (config.settings.chat) {
    mobileTabs.push({
      title: "Chat",
      content: chatTileContent,
    });
  }

  mobileTabs.push({
    title: "Settings",
    content: (
      <PlaygroundTile
        padding={false}
        backgroundColor="gray-950"
        className="h-full w-full basis-1/4 items-start overflow-y-auto flex"
        childrenClassName="h-full grow items-start"
      >
        {settingsTileContent}
      </PlaygroundTile>
    ),
  });

  return (
    <div className="flex h-full p-4 gap-4" style={{ maxHeight: 'calc(100vh - 96px)' }}>
      {/* Left pane - Main Chat */}
      <div className="flex flex-col w-2/3 bg-gray-900/50 rounded-lg overflow-hidden border border-gray-800">
        <PlaygroundHeader
          title={config.title}
          logo={logo}
          githubLink={config.github_link}
          height={headerHeight}
          accentColor={config.settings.theme_color}
          connectionState={roomState}
          onConnectClicked={() => {
            if (roomState === ConnectionState.Connected) {
              handleDisconnect();
            } else {
              onConnect(true);
            }
          }}
        />
        {/* Message list */}
        <div className="flex-1 overflow-y-auto p-4">
          {voiceAssistant.audioTrack && (
            <TranscriptionTile
              agentAudioTrack={voiceAssistant.audioTrack}
              accentColor={config.settings.theme_color}
            />
          )}
        </div>
        {/* Bottom controls */}
        <div className="border-t border-gray-800 bg-black p-2">
          <div className="flex items-center justify-center w-full h-10 bg-gray-900/40 mb-2">
            <BarVisualizer
              state={voiceAssistant.state}
              trackRef={voiceAssistant.audioTrack}
              barCount={5}
              options={{ minHeight: 14 }}
              className="[--lk-va-bar-width:20px] [--lk-va-bar-gap:12px] [--lk-fg:var(--lk-theme-color)] [--lk-bar-bg:rgb(38,38,38)]"
            />
          </div>
          <div className="flex items-center bg-gray-900/40 rounded">
            <div className="flex-grow">
              {localMicTrack && <AudioInputTile trackRef={localMicTrack} />}
            </div>
            <div className="flex items-center gap-2 p-3">
              <TrackToggle 
                source={Track.Source.Microphone}
                className="bg-gray-900/60 p-2 rounded-lg text-white"
              />
              <PlaygroundDeviceSelector kind="audioinput" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Right pane - Diagnosis Chat */}
      <div className="flex flex-col w-1/3 bg-gray-900/50 rounded-lg overflow-hidden border border-gray-800">
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-800">
          <h2 className="text-sm uppercase tracking-wider text-gray-500">Diagnosis Chat</h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ChatTileCompact
            messages={diagnosisMessages}
            accentColor={config.settings.theme_color}
            onSend={sendDiagnosisMessage}
          />
        </div>
      </div>
      
      
      {/* Settings Modal */}
      {showSettings && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={() => setShowSettings(false)} />
          <div className="fixed top-20 right-4 z-50 bg-gray-900 rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto shadow-2xl border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {settingsTileContent}
          </div>
        </>
      )}
    </div>
  );
}