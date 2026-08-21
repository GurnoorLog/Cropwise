import { useState, useCallback, useRef, useEffect } from "react";
import {
  useRealtimeTranscription,
  useRealtimeEventListener,
} from "@speechmatics/real-time-client-react";
import {
  usePCMAudioRecorderContext,
  usePCMAudioListener,
} from "@speechmatics/browser-audio-input-react";
import { supabase } from "../supabase";
import { getApiKey } from "../lib/apiKeys";
import type { SpeechLanguageCode } from "../lib/languages";

interface UseSpeechmaticsOptions {
  language: SpeechLanguageCode;
  onFinalTranscript: (text: string) => void;
  onInterimTranscript: (text: string) => void;
  onError: (error: string) => void;
}

export function useSpeechmatics({
  language,
  onFinalTranscript,
  onInterimTranscript,
  onError,
}: UseSpeechmaticsOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptRef = useRef("");
  const stopRef = useRef<() => Promise<void> | undefined>();

  const { startTranscription, stopTranscription, sendAudio, socketState } =
    useRealtimeTranscription();
  const { startRecording, stopRecording } = usePCMAudioRecorderContext();

  // Speechmatics throws "Socket not ready to receive audio" if audio is sent
  // before the WebSocket is open. Buffer chunks until the socket is ready.
  const audioBufferRef = useRef<Float32Array[]>([]);
  const socketOpenRef = useRef(false);
  socketOpenRef.current = socketState === "open";

  const flushAudioBuffer = useCallback(() => {
    if (audioBufferRef.current.length === 0) return;
    const chunks = audioBufferRef.current.splice(0);
    for (const chunk of chunks) sendAudio(chunk);
  }, [sendAudio]);

  const onAudio = useCallback(
    (audio: Float32Array) => {
      if (socketOpenRef.current) {
        flushAudioBuffer();
        sendAudio(audio);
      } else {
        audioBufferRef.current.push(audio);
      }
    },
    [flushAudioBuffer, sendAudio],
  );

  // Pipe mic audio to Speechmatics (buffered until the socket is open)
  usePCMAudioListener(onAudio);

  // Flush anything captured while the socket was still connecting
  useEffect(() => {
    if (socketState === "open") flushAudioBuffer();
  }, [socketState, flushAudioBuffer]);

  /** Stop all — defined first so it can be referenced by silence timer */
  const stopAll = useCallback(async () => {
    try {
      await stopRecording();
      await stopTranscription();
    } catch {
      // Ignore cleanup errors
    }
    audioBufferRef.current = [];
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setIsRecording(false);
  }, [stopRecording, stopTranscription]);

  stopRef.current = stopAll;

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      stopRef.current?.();
      if (transcriptRef.current) {
        onFinalTranscript(transcriptRef.current);
      }
    }, 8000);
  }, [onFinalTranscript]);

  // Listen for transcription results
  useRealtimeEventListener("receiveMessage", ({ data }: { data: any }) => {
    if (data.message === "AddPartialTranscript") {
      const text =
        data.results
          ?.map((r: any) => r.alternatives?.[0]?.content ?? "")
          .join(" ") ?? "";
      if (text) {
        onInterimTranscript(text);
        resetSilenceTimer();
      }
    } else if (data.message === "AddTranscript") {
      const text =
        data.results
          ?.map((r: any) => r.alternatives?.[0]?.content ?? "")
          .join(" ") ?? "";
      if (text) {
        transcriptRef.current = text;
        onFinalTranscript(text);
      }
    }
  });

  const getToken = useCallback(async (): Promise<string> => {
    // If a Speechmatics API key was entered in Settings, mint a JWT directly
    const apiKey = getApiKey("speechmatics");
    if (apiKey) {
      const res = await fetch("https://mp.speechmatics.com/v1/api_keys?type=rt", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ttl: 60 }),
      });
      if (!res.ok) throw new Error(`Speechmatics token request failed (${res.status})`);
      const json = await res.json();
      if (!json?.key_value) throw new Error("No token returned from Speechmatics");
      return json.key_value as string;
    }

    const { data, error } = await supabase.functions.invoke("speechmatics-token");
    if (error) throw new Error(error.message);
    if (!data?.token) throw new Error("No token returned from speechmatics-token");
    return data.token as string;
  }, []);

  const startAll = useCallback(async () => {
    try {
      audioBufferRef.current = [];
      setIsRecording(true);
      const token = await getToken();

      await startTranscription(token, {
        transcription_config: {
          language,
          enable_partials: true,
        },
      } as any);

      await startRecording({});
      resetSilenceTimer();
    } catch (err: any) {
      setIsRecording(false);
      onError(err.message || "Failed to start recording");
    }
  }, [language, getToken, startTranscription, startRecording, resetSilenceTimer, onError]);

  return {
    isRecording,
    startRecording: startAll,
    stopRecording: stopAll,
  };
}
