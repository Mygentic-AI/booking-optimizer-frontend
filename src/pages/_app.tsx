import { CloudProvider } from "@/cloud/useCloud";
import { SupabaseProvider } from "@/providers/SupabaseProvider";
import { ToastProvider } from "@/components/toast/ToasterProvider";
import { ConfigProvider } from "@/hooks/useConfig";
import { ConnectionProvider } from "@/hooks/useConnection";
import "@livekit/components-styles/components/participant";
import "@/styles/globals.css";
import "@/styles/booking.css";
import "@/styles/voice-agent.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <ConfigProvider>
        <CloudProvider>
          <SupabaseProvider>
            <ConnectionProvider>
              <Component {...pageProps} />
            </ConnectionProvider>
          </SupabaseProvider>
        </CloudProvider>
      </ConfigProvider>
    </ToastProvider>
  );
}
