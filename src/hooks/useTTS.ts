import { useCallback, useRef, useState } from "react";
import { ttsLocale, type SpeechLanguageCode } from "../lib/languages";

interface UseTTSOptions {
  language: SpeechLanguageCode;
  onEnd?: () => void;
}

export function useTTS({ language, onEnd }: UseTTSOptions) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  const speak = useCallback(
    (text: string) => {
      if (!text || typeof window === "undefined" || !window.speechSynthesis) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = ttsLocale(language);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        onEndRef.current?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        onEndRef.current?.();
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [language],
  );

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}
