import { useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";

import { supabase } from "../supabase";
import { useAuth } from "../lib/auth";
import { getApiKey } from "../lib/apiKeys";
import { useSpeechmatics } from "../hooks/useSpeechmatics";
import { useTTS } from "../hooks/useTTS";
import { getAdjustedPrices, formatPrices } from "../data/prices";
import MicButton from "../components/MicButton";
import TextInput from "../components/TextInput";
import ResponseCard, { type AIResponse } from "../components/ResponseCard";
import {
  Sprout,
  Languages,
  AlertTriangle,
  LayoutDashboard,
  KeyRound,
  LogOut,
} from "lucide-react";

type AdvisorStep = "idle" | "recording" | "connecting" | "thinking" | "result" | "error";

const AI_MODEL = "gpt-4o-mini";
const AI_ENDPOINT = "https://api.aimlapi.com/v1/chat/completions";

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
  const [micBlocked, setMicBlocked] = useState(false);

  const { user, signOut } = useAuth();
  const weatherRef = useRef<any>(null);
  const queryRef = useRef("");

  const { speak, isSpeaking } = useTTS({ language });

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
        const prices = getAdjustedPrices();

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

      setMicBlocked(false);
      setStep("recording");
      await startRecording();
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setMicBlocked(true);
        setShowTextInput(true);
        setErrorMessage(
          language === "hi" ? "माइक की अनुमति नहीं मिली। नीचे टाइप करें।" : "Mic access denied. Type below.",
        );
      } else {
        setErrorMessage(err.message || "Mic error");
      }
      setStep("error");
    }
  }, [isRecording, startRecording, stopRecording, language]);

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
    weatherRef.current = null;
    window.speechSynthesis.cancel();
  }, []);

  const navLink =
    "inline-flex items-center gap-1.5 text-sm font-medium text-foreground/50 hover:text-foreground transition-colors";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Sprout className="w-7 h-7 text-primary" />
            <h1 className="text-xl font-bold text-foreground tracking-tight">Harvest Window</h1>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-5">
          <Link to="/dashboard" className={navLink}>
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
          <Link to="/app" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            <Sprout className="w-4 h-4" /> Advisor
          </Link>
          <Link to="/settings" className={navLink}>
            <KeyRound className="w-4 h-4" /> API Keys
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            aria-label={`Switch to ${language === "hi" ? "English" : "Hindi"}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-sm font-medium transition-all hover:bg-primary/10 active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Languages className="w-4 h-4" />
            {language === "hi" ? "हिं" : "EN"}
          </button>
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-sm font-medium transition-all hover:bg-destructive/10 hover:text-destructive active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-8 max-w-lg mx-auto w-full">
        <div className="text-center">
          <p className="text-xs text-foreground/40 uppercase tracking-widest font-semibold mb-1">
            {user?.email ?? "Signed in"}
          </p>
        </div>

        {step === "idle" && (
          <div className="flex flex-col items-center gap-8 w-full animate-fade-in-up">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {language === "hi" ? "नमस्ते किसान भाई! 🌱" : "Hello Farmer! 🌱"}
              </h2>
              <p className="text-foreground/60 text-base">
                {language === "hi"
                  ? "बोलिए — मौसम, फसल की सलाह, मंडी भाव"
                  : "Speak — weather, crop advice, market prices"}
              </p>
            </div>

            <MicButton isRecording={false} isConnecting={false} onClick={handleMicTap} />

            <button
              onClick={() => setShowTextInput(!showTextInput)}
              className="text-sm text-foreground/50 underline underline-offset-2 hover:text-foreground/80 transition-colors cursor-pointer"
            >
              {language === "hi" ? "टाइप करके पूछें" : "Type your question instead"}
            </button>

            {showTextInput && <TextInput onSubmit={handleTextSubmit} />}
          </div>
        )}

        {(step === "connecting" || step === "recording") && (
          <div className="flex flex-col items-center gap-8 w-full animate-fade-in-up">
            {interimText && (
              <div className="w-full bg-card rounded-xl border border-border px-5 py-4 min-h-[60px]">
                <p className="text-base text-foreground/80 leading-relaxed">
                  {interimText}
                  {step === "recording" && (
                    <span className="inline-block w-2 h-5 bg-primary ml-1 animate-pulse align-middle rounded-sm" />
                  )}
                </p>
              </div>
            )}

            <MicButton
              isRecording={isRecording}
              isConnecting={step === "connecting"}
              onClick={handleMicTap}
            />

            {step === "recording" && !interimText && (
              <p className="text-sm text-foreground/50">
                {language === "hi" ? "सुन रहा हूं…" : "Listening…"}
              </p>
            )}

            <button
              onClick={() => setShowTextInput(!showTextInput)}
              className="text-sm text-foreground/50 underline underline-offset-2 hover:text-foreground/80 transition-colors cursor-pointer"
            >
              {language === "hi" ? "टाइप करके पूछें" : "Type your question instead"}
            </button>

            {showTextInput && <TextInput onSubmit={handleTextSubmit} />}
          </div>
        )}

        {step === "thinking" && (
          <div className="flex flex-col items-center gap-6 animate-fade-in-up">
            {finalText && (
              <div className="w-full bg-card rounded-xl border border-border px-5 py-4">
                <p className="text-base text-foreground/80">"{finalText}"</p>
              </div>
            )}
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin-slow" />
              <p className="text-sm text-foreground/50 font-medium">
                {language === "hi" ? "सोच रहा हूं…" : "Thinking…"}
              </p>
            </div>
          </div>
        )}

        {step === "result" && response && (
          <ResponseCard
            data={response}
            isSpeaking={isSpeaking}
            onReplay={() => speak(response.recommendation)}
            onReset={handleReset}
          />
        )}

        {step === "error" && (
          <div className="flex flex-col items-center gap-6 animate-fade-in-up w-full">
            <div className="w-full bg-card rounded-2xl border border-destructive/20 p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
              <p className="text-base text-foreground/80 mb-1 font-medium">
                {language === "hi" ? "कुछ गलत हुआ" : "Something went wrong"}
              </p>
              <p className="text-sm text-foreground/60">{errorMessage}</p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-xl bg-primary text-on-primary font-semibold transition-all hover:bg-secondary active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {language === "hi" ? "फिर से कोशिश करें" : "Try Again"}
              </button>

              {micBlocked && <TextInput onSubmit={handleTextSubmit} />}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-3 text-center text-xs text-foreground/30">
        Harvest Window — {language === "hi" ? "आपका खेती सलाहकार" : "Your Farming Advisor"}
      </footer>
    </div>
  );
}
