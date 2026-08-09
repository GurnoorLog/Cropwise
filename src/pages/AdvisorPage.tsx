import { useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Mic, X, Languages, RefreshCw, Volume2, Keyboard, Bot } from "lucide-react";

import { supabase } from "../supabase";
import { useAuth } from "../lib/auth";
import { getApiKey } from "../lib/apiKeys";
import { useSpeechmatics } from "../hooks/useSpeechmatics";
import { useTTS } from "../hooks/useTTS";
import { fetchMarketPrices, formatPrices } from "../data/prices";
import TextInput from "../components/TextInput";
import UserMenu from "../components/UserMenu";
import type { AIResponse } from "../components/ResponseCard";

type AdvisorStep = "idle" | "recording" | "connecting" | "thinking" | "result" | "error";

type AgentState = "listening" | "processing" | "speaking" | "ready";

const AI_MODEL = "gpt-4o-mini";
const AI_ENDPOINT = "https://api.aimlapi.com/v1/chat/completions";

const SUGGESTIONS = [
  "Market Prices",
  "Weather Forecast",
  "Buyer Opportunities",
] as const;

const STATE_LABEL: Record<AgentState, string> = {
  listening: "Listening...",
  processing: "Processing...",
  speaking: "Speaking...",
  ready: "Ready",
};

const STATE_DOT: Record<AgentState, string> = {
  listening: "#00d084",
  processing: "#f59e0b",
  speaking: "#3b82f6",
  ready: "#4b5563",
};

const STATE_CLASS: Record<AgentState, string> = {
  listening: "state-listening",
  processing: "state-processing",
  speaking: "state-speaking",
  ready: "state-idle",
};

/** Call the AI/ML API directly from the browser using a user-provided key */
async function callAIMLDirect(opts: {
  query: string;
  priceStr: string;
  weatherSummary: string;
  language: "hi" | "en";
  apiKey: string;
}): Promise<AIResponse> {
  const { query, priceStr, weatherSummary, language, apiKey } = opts;

  const prompt = `You are Harvest Window, helping a farmer decide when to sell their crop. Here is the data:

Crop query: ${query}
Live market prices per kg: ${priceStr}
Weather: ${weatherSummary || "weather data unavailable"}

Respond in ${language === "hi" ? "Hindi" : "English"}.

Write:
1. weather_summary — a short one-line summary of the weather relevant to selling.
2. price_estimate — a short line describing the current market price picture.
3. recommendation — a 2-3 sentence plain-language recommendation on when to sell and why.
4. spoilage_risk — "green", "yellow", or "red" based on weather-driven spoilage risk.
5. language — "hi" or "en".

Respond with ONLY valid JSON in exactly this shape:
{"weather_summary":"...","price_estimate":"...","recommendation":"...","spoilage_risk":"green","language":"en"}`;

  const res = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI request failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const content: string = json?.choices?.[0]?.message?.content ?? "";
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI returned an unreadable response");

  const parsed = JSON.parse(match[0]) as Partial<AIResponse>;
  if (!parsed.recommendation) throw new Error("AI returned an incomplete response");

  const risk = parsed.spoilage_risk === "red" ? "red" : parsed.spoilage_risk === "green" ? "green" : "yellow";
  return {
    weather_summary: parsed.weather_summary ?? weatherSummary,
    price_estimate: parsed.price_estimate ?? priceStr,
    recommendation: parsed.recommendation,
    spoilage_risk: risk,
    language: parsed.language === "hi" ? "hi" : "en",
  };
}

export default function AdvisorPage() {
  const [language, setLanguage] = useState<"hi" | "en">("hi");
  const [step, setStep] = useState<AdvisorStep>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [interimText, setInterimText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);

  const { user } = useAuth();
  const weatherRef = useRef<any>(null);
  const queryRef = useRef("");

  const { speak, isSpeaking } = useTTS({ language });

  const agentState: AgentState =
    step === "recording"
      ? "listening"
      : step === "connecting" || step === "thinking"
        ? "processing"
        : step === "result" && isSpeaking
          ? "speaking"
          : "ready";

  const handleFinalTranscript = useCallback((text: string) => {
    setFinalText(text);
    queryRef.current = text;
    getAIRecommendation(text);
  }, []);

  const handleInterimTranscript = useCallback((text: string) => {
    setInterimText(text);
  }, []);

  const handleError = useCallback((err: string) => {
    setErrorMessage(err);
    setStep("error");
  }, []);

  const { isRecording, startRecording, stopRecording } = useSpeechmatics({
    language,
    onFinalTranscript: handleFinalTranscript,
    onInterimTranscript: handleInterimTranscript,
    onError: handleError,
  });

  /** Weather code to simple description */
  const weatherCodeToDesc = useCallback(
    (code: number): string => {
      if (code <= 3) return language === "hi" ? "साफ" : "Clear";
      if (code <= 48) return language === "hi" ? "धुंध" : "Fog";
      if (code <= 57) return language === "hi" ? "बूंदाबांदी" : "Drizzle";
      if (code <= 67) return language === "hi" ? "बारिश" : "Rain";
      if (code <= 77) return language === "hi" ? "बर्फ" : "Snow";
      if (code <= 82) return language === "hi" ? "तेज़ बारिश" : "Heavy Rain";
      if (code <= 86) return language === "hi" ? "बर्फ" : "Snow";
      return language === "hi" ? "आंधी" : "Storm";
    },
    [language],
  );

  /** Fetch weather from Open-Meteo */
  const fetchWeather = useCallback(async (): Promise<any> => {
    if (weatherRef.current) return weatherRef.current;

    const fetchForecast = async (lat: number, lon: number) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&forecast_days=7`;
      const res = await fetch(url);
      const data = await res.json();
      return { latitude: lat, longitude: lon, daily: data.daily };
    };

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const weather = await fetchForecast(pos.coords.latitude, pos.coords.longitude);
            weatherRef.current = weather;
            resolve(weather);
          } catch {
            resolve(null);
          }
        },
        async () => {
          // Fallback: Pune, Maharashtra
          try {
            const weather = await fetchForecast(18.52, 73.85);
            weatherRef.current = weather;
            resolve(weather);
          } catch {
            resolve(null);
          }
        },
        { timeout: 10000 },
      );
    });
  }, []);

  /** Build the AI recommendation — direct API if a key is set, else the Edge Function */
  const getAIRecommendation = useCallback(
    async (query: string) => {
      setStep("thinking");
      setInterimText("");
      setFinalText(query);

      try {
        const weather = await fetchWeather();
        const prices = await fetchMarketPrices();

        let weatherSummary = "";
        if (weather?.daily) {
          const d = weather.daily;
          const day0 = d.time?.[0] || "today";
          const tMax = d.temperature_2m_max?.[0];
          const tMin = d.temperature_2m_min?.[0];
          const precip = d.precipitation_sum?.[0];
          const wCode = d.weathercode?.[0];
          const desc = weatherCodeToDesc(wCode ?? 0);

          weatherSummary = `${day0}: ${tMin ?? "?"}-${tMax ?? "?"}°C, ${desc}`;
          if (precip > 0) weatherSummary += `, ${language === "hi" ? "बारिश" : "rain"} ${precip}mm`;
        }

        const priceStr = formatPrices(prices);
        const aiKey = getApiKey("ai");

        let aiResponse: AIResponse;
        if (aiKey) {
          aiResponse = await callAIMLDirect({
            query,
            priceStr,
            weatherSummary,
            language,
            apiKey: aiKey,
          });
        } else {
          const { data, error } = await supabase.functions.invoke("recommend-crop", {
            body: {
              query,
              location: {
                lat: weather?.latitude ?? 18.52,
                lon: weather?.longitude ?? 73.85,
                district: "Pune",
              },
              weather: weatherSummary ? { summary: weatherSummary } : null,
              prices: { summary: priceStr },
            },
          });
          if (error) throw new Error(error.message || "AI request failed");
          aiResponse = data as AIResponse;
        }

        setResponse(aiResponse);
        setStep("result");

        // Auto-play TTS
        if (aiResponse.recommendation) {
          const ttsLang = aiResponse.language || language;
          const utterance = new SpeechSynthesisUtterance(aiResponse.recommendation);
          utterance.lang = ttsLang === "hi" ? "hi-IN" : "en-IN";
          utterance.rate = 0.9;
          window.speechSynthesis.speak(utterance);
        }
      } catch (err: any) {
        if (err.message?.includes("timed out") || err.message?.includes("AbortError")) {
          setErrorMessage(
            language === "hi"
              ? "थोड़ा समय लग रहा है… फिर से कोशिश करें"
              : "Taking too long… please try again",
          );
        } else if (err.message?.includes("fetch") || err.message?.includes("network")) {
          setErrorMessage(language === "hi" ? "इंटरनेट कनेक्शन जांचें" : "Check your connection");
        } else {
          setErrorMessage(err.message || "Something went wrong");
        }
        setStep("error");
      }
    },
    [language, fetchWeather, weatherCodeToDesc],
  );

  /** Handle mic button tap */
  const handleMicTap = useCallback(async () => {
    if (step === "result" || step === "error") {
      setStep("idle");
      setResponse(null);
      setErrorMessage("");
      return;
    }

    if (isRecording) {
      await stopRecording();
      return;
    }

    setStep("connecting");
    setErrorMessage("");
    setResponse(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());

      setStep("recording");
      await startRecording();
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setShowTextInput(true);
        setErrorMessage(
          language === "hi" ? "माइक की अनुमति नहीं मिली। नीचे टाइप करें।" : "Mic access denied. Type below.",
        );
      } else {
        setErrorMessage(err.message || "Mic error");
      }
      setStep("error");
    }
  }, [isRecording, startRecording, stopRecording, language, step]);

  /** Handle text submit */
  const handleTextSubmit = useCallback(
    (text: string) => {
      setShowTextInput(false);
      getAIRecommendation(text);
    },
    [getAIRecommendation],
  );

  /** Toggle language */
  const toggleLanguage = useCallback(() => {
    setLanguage((l) => (l === "hi" ? "en" : "hi"));
    window.speechSynthesis.cancel();
  }, []);

  /** Reset */
  const handleReset = useCallback(() => {
    setStep("idle");
    setResponse(null);
    setErrorMessage("");
    setInterimText("");
    setFinalText("");
    setShowTextInput(false);
    weatherRef.current = null;
    window.speechSynthesis.cancel();
  }, []);

  const iconButton =
    "p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer text-white/60 hover:text-white";

  const micIcon =
    step === "connecting" || step === "thinking" ? (
      <RefreshCw className="w-16 h-16 animate-spin-slow" />
    ) : step === "result" && isSpeaking ? (
      <Volume2 className="w-16 h-16" />
    ) : (
      <Mic className="w-16 h-16" />
    );

  const showWaveform = step === "recording" || step === "connecting" || step === "thinking";

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center isolate overflow-hidden bg-[#171310]">
      {/* Background Video Layer */}
      <div className="fixed inset-0 w-full h-full -z-20 overflow-hidden">
        <video autoPlay muted loop playsInline className="w-full h-full object-cover">
          <source
            src="https://designerstephen.github.io/public-assets/videos/serene-art-hero.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 video-overlay-voice" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="font-serif text-2xl text-white tracking-tight">
            Harvest Window
          </Link>
          <div className="hidden md:flex items-center gap-5 text-sm font-medium">
            <Link to="/dashboard" className="text-white/60 hover:text-white transition-colors">
              Overview
            </Link>
            <Link to="/news" className="text-white/60 hover:text-white transition-colors">
              Forecasts
            </Link>
            <Link to="/news" className="text-white/60 hover:text-white transition-colors">
              Buyers
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/app"
            className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-white/90 hover:scale-105 active:scale-95 transition-all"
          >
            <Bot className="w-3.5 h-3.5" />
            Ask AI Agent
          </Link>
          <button
            onClick={toggleLanguage}
            aria-label={`Switch to ${language === "hi" ? "English" : "Hindi"}`}
            title={`Switch to ${language === "hi" ? "English" : "Hindi"}`}
            className={`${iconButton} inline-flex items-center gap-1.5 text-xs font-medium`}
          >
            <Languages className="w-5 h-5" />
            {language === "hi" ? "हिं" : "EN"}
          </button>
          <Link to="/dashboard" aria-label="Close" title="Close" className={iconButton}>
            <X className="w-5 h-5" />
          </Link>
          <UserMenu size="sm" />
        </div>
      </nav>

      {/* Main */}
      <main className="relative z-10 w-full max-w-[1000px] px-8 text-center flex flex-col items-center">
        <header className="fade-rise stagger-1 mb-16 text-center">
          <h1 className="font-serif text-5xl md:text-6xl text-white mb-4 tracking-[-2.46px]">
            {language === "hi" ? "आज मैं आपकी कैसे मदद करूं?" : "How can I help you today?"}
          </h1>
          <p className="text-white/50 text-lg font-light">
            {language === "hi"
              ? "बाज़ार भाव, मौसम, फसल सलाह या खरीदार पूछें।"
              : "Ask about market prices, weather, crop insights, or buyers."}
          </p>
        </header>

        {/* Mic + waveform */}
        <div className="fade-rise stagger-2 mb-12 flex flex-col items-center relative">
          <div className="absolute -top-12 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
            <div
              className="w-2 h-2 rounded-full dot-pulse"
              style={{ backgroundColor: STATE_DOT[agentState] }}
            />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
              {STATE_LABEL[agentState]}
            </span>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="flex items-center gap-1.5 mr-10">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="waveform-bar" style={showWaveform ? undefined : { animation: "none" }} />
              ))}
            </div>

            <button
              onClick={handleMicTap}
              aria-label="Voice agent"
              className={`w-[200px] h-[200px] rounded-full ${STATE_CLASS[agentState]} flex items-center justify-center text-white shadow-2xl transition-all duration-500 hover:scale-105 ${step === "result" || step === "error" || step === "idle" ? "" : "mic-pulse"} group cursor-pointer`}
            >
              {micIcon}
            </button>

            <div className="flex items-center gap-1.5 ml-10">
              {[5, 6, 7, 8].map((n) => (
                <div key={n} className="waveform-bar" style={showWaveform ? undefined : { animation: "none" }} />
              ))}
            </div>
          </div>
        </div>

        {/* Transcription */}
        <div className="fade-rise stagger-3 w-full max-w-[600px] mb-12 text-center">
          <p className="text-white/70 text-lg leading-relaxed font-light transition-all duration-500">
            {step === "recording" && interimText
              ? `"${interimText}"`
              : finalText
                ? `"${finalText}"`
                : "—"}
          </p>
        </div>

        {/* Agent card */}
        {(step === "thinking" || step === "result") && response && (
          <div className="fade-rise stagger-4 w-full max-w-[600px] bg-white/95 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl text-left">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Agent Response
              </span>
              {step === "thinking" && (
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
            </div>

            {step === "result" ? (
              <>
                <p className="text-[#0f172a] text-lg leading-relaxed">{response.recommendation}</p>
                {response.weather_summary && (
                  <p className="text-[#0f172a]/60 text-sm leading-relaxed mt-4">
                    {response.weather_summary}
                  </p>
                )}
                {response.price_estimate && (
                  <p className="text-[#0f172a]/60 text-sm leading-relaxed mt-1">
                    {response.price_estimate}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-6">
                  <button
                    onClick={() => speak(response.recommendation)}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                      isSpeaking
                        ? "bg-[#3b82f6] border-[#3b82f6] text-white"
                        : "bg-white/5 border-white/10 text-slate-500 hover:bg-black hover:text-white"
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                    Replay
                  </button>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider border bg-white/5 border-white/10 text-slate-500 hover:bg-black hover:text-white transition-all cursor-pointer"
                  >
                    <Mic className="w-4 h-4" />
                    New Question
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
          </div>
        )}

        {/* Error card */}
        {step === "error" && (
          <div className="fade-rise stagger-4 w-full max-w-[600px] bg-white/95 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Something went wrong
            </span>
            <p className="text-[#0f172a] text-lg leading-relaxed mt-2">{errorMessage}</p>
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider bg-black text-white transition-all cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {step === "idle" && (
          <div className="fade-rise stagger-4 mt-12 flex flex-wrap justify-center gap-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleTextSubmit(s)}
                className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-semibold uppercase tracking-wider hover:bg-white hover:text-black transition-all cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Text input fallback */}
        {showTextInput && (
          <div className="w-full max-w-[600px] mt-8">
            <TextInput onSubmit={handleTextSubmit} />
          </div>
        )}

        {!showTextInput && step !== "result" && step !== "thinking" && (
          <button
            onClick={() => setShowTextInput((v) => !v)}
            className="mt-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40 hover:text-white transition-all cursor-pointer"
          >
            <Keyboard className="w-4 h-4" />
            {language === "hi" ? "टाइप करके पूछें" : "Type your question"}
          </button>
        )}
      </main>

      <p className="relative z-10 text-center text-xs text-white/30 mt-10 pb-6">
        {user?.email ?? "Signed in"} · Harvest Window
      </p>
    </div>
  );
}
