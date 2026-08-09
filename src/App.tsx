import { useCallback, useRef, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  RealtimeTranscriptionProvider,
} from "@speechmatics/real-time-client-react";
import {
  PCMAudioRecorderProvider,
} from "@speechmatics/browser-audio-input-react";
import workletScriptURL from "@speechmatics/browser-audio-input/pcm-audio-worklet.min.js?url";

import { AuthProvider, useAuth } from "./lib/auth";
import LandingPage from "./components/LandingPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import AdvisorPage from "./pages/AdvisorPage";
import DashboardPage from "./pages/DashboardPage";
import NewsPage from "./pages/NewsPage";
import SettingsPage from "./pages/SettingsPage";
import OnboardingPage from "./pages/OnboardingPage";
import { Loader2 } from "lucide-react";

function Protected({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#171310]">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  if (!session) return <Navigate to="/" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="/app"
        element={
          <Protected>
            <AdvisorPage />
          </Protected>
        }
      />
      <Route
        path="/dashboard"
        element={
          <Protected>
            <DashboardPage />
          </Protected>
        }
      />
      <Route
        path="/news"
        element={
          <Protected>
            <NewsPage />
          </Protected>
        }
      />
      <Route
        path="/settings"
        element={
          <Protected>
            <SettingsPage />
          </Protected>
        }
      />
      <Route
        path="/onboarding"
        element={
          <Protected>
            <OnboardingPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

function AppWithProviders() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback((): AudioContext | undefined => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      } catch {
        // AudioContext not supported
      }
    }
    return audioContextRef.current ?? undefined;
  }, []);

  const audioContext = getAudioContext();

  return (
    <BrowserRouter>
      <RealtimeTranscriptionProvider appId="cropwise-mvp">
        <PCMAudioRecorderProvider
          workletScriptURL={workletScriptURL}
          audioContext={audioContext}
        >
          <App />
        </PCMAudioRecorderProvider>
      </RealtimeTranscriptionProvider>
    </BrowserRouter>
  );
}

export default AppWithProviders;
