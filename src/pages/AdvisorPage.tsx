import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Mic,
  X,
  Languages,
  RefreshCw,
  Volume2,
  Keyboard,
  Bot,
  AlertTriangle,
  Sparkles,
  MicOff,
} from "lucide-react";

import { useAuth } from "../lib/auth";
import { getApiKey } from "../lib/apiKeys";
import { getProfile, getFarmCrops } from "../lib/profile";
import { useSpeechmatics } from "../hooks/useSpeechmatics";
import { useTTS } from "../hooks/useTTS";
import { getAIResponse, type FarmContext } from "../lib/ai";
import { LANGUAGES, isSpeechLanguage, ttsLocale, type SpeechLanguageCode } from "../lib/languages";
import { fetchFarmWeather } from "../lib/weather";
import { proactiveAlert } from "../lib/agent";
import { actionFromResultType } from "../lib/agent";
import type { ConversationTurn } from "../lib/agent";
import TextInput from "../components/TextInput";
import AppNav from "../components/AppNav";
import AgentResultPanel from "../components/results/AgentResultPanel";
import type { AIResponse, ResultType } from "../components/ResponseCard";

type AdvisorStep = "idle" | "recording" | "connecting" | "thinking" | "result" | "error";

type AgentState = "listening" | "processing" | "speaking" | "ready";

const SUGGESTIONS = [
  "Market Prices",
  "Weather Forecast",
  "Buyer Opportunities",
  "Crop Calendar",
  "MSP & Schemes",
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

export default function AdvisorPage() {
  const [language, setLanguage] = useState<SpeechLanguageCode>("hi");
  const [step, setStep] = useState<AdvisorStep>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [interimText, setInterimText] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [history, setHistory] = useState<ConversationTurn[]>([]);
  const [alwaysActive, setAlwaysActive] = useState(true);
  const [proactive, setProactive] = useState<{ title: string; body: string } | null>(null);

  const { user } = useAuth();
  const weatherRef = useRef<any>(null);
  const farmRef = useRef<FarmContext | null>(null);
  const stepRef = useRef<AdvisorStep>("idle");
  const alwaysRef = useRef(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = language === "hi";

  stepRef.current = step;
  alwaysRef.current = alwaysActive;

  const { speak, stop, isSpeaking } = useTTS({ language });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, interimText, step]);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    getProfile(user.id).then((p) => {
      if (mounted && p?.language && isSpeechLanguage(p.language)) {
        setLanguage(p.language);
      }
    });
    return () => {
      mounted = false;
    };
  }, [user]);

  const buildFarmContext = useCallback(async (): Promise<FarmContext | null> => {
    if (farmRef.current) return farmRef.current;
    if (!user) return null;
    const [profile, crops] = await Promise.all([getProfile(user.id), getFarmCrops(user.id)]);
    if (!profile) return null;
    farmRef.current = {
      farmName: profile.farm_name || "Unnamed farm",
      location: profile.farm_location || "India",
      farmType: profile.farm_type || "not set",
      size: `${profile.farm_size ?? "?"} ${profile.farm_size_unit || "acres"}`,
      irrigation: profile.irrigation_method || "not set",
      storage: profile.storage_facilities?.length ? profile.storage_facilities.join(", ") : "none",
      crops: crops.length ? crops.join(", ") : "not set",
      language: profile.language || "en",
    };
    return farmRef.current;
  }, [user]);

  const agentState: AgentState =
    step === "recording"
      ? "listening"
      : step === "connecting" || step === "thinking"
        ? "processing"
        : step === "result" && isSpeaking
          ? "speaking"
          : "ready";

  const { isRecording, startRecording, stopRecording } = useSpeechmatics({
    language,
    onFinalTranscript: (text) => {
      getAIRecommendation(text);
    },
    onInterimTranscript: (text) => setInterimText(text),
    onError: (err) => {
      setErrorMessage(err);
      setStep("error");
    },
  });

  /** Weather code to simple description */
  const weatherCodeToDesc = useCallback(
    (code: number): string => {
      if (code <= 3) return t ? "साफ" : "Clear";
      if (code <= 48) return t ? "धुंध" : "Fog";
      if (code <= 57) return t ? "बूंदाबांदी" : "Drizzle";
      if (code <= 67) return t ? "बारिश" : "Rain";
      if (code <= 77) return t ? "बर्फ" : "Snow";
      if (code <= 82) return t ? "तेज़ बारिश" : "Heavy Rain";
      if (code <= 86) return t ? "बर्फ" : "Snow";
      return t ? "आंधी" : "Storm";
    },
    [t],
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
          try {
            const farm = await buildFarmContext();
            const fallback =
              farm?.location && /agra|uttar pradesh/i.test(farm.location)
                ? { lat: 27.1767, lon: 78.0081 }
                : { lat: 18.52, lon: 73.85 };
            const weather = await fetchForecast(fallback.lat, fallback.lon);
            weatherRef.current = weather;
            resolve(weather);
          } catch {
            resolve(null);
          }
        },
        { timeout: 10000 },
      );
    });
  }, [buildFarmContext]);

  /** Begin listening with mic permission + step transitions */
  const beginListening = useCallback(async () => {
    if (isRecording) return;
    setShowTextInput(false);
    setErrorMessage("");
    setStep("connecting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((tr) => tr.stop());
      setStep("recording");
      await startRecording();
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setShowTextInput(true);
        setErrorMessage(t ? "माइक की अनुमति नहीं मिली। नीचे टाइप करें।" : "Mic access denied. Type below.");
      } else {
        setErrorMessage(err.message || "Mic error");
      }
      setStep("error");
    }
  }, [isRecording, startRecording, t]);

  /** Build the AI recommendation — direct API if a key is set, else the Edge Function */
  const getAIRecommendation = useCallback(
    async (query: string) => {
      setStep("thinking");
      setInterimText("");
      setHistory((h) => [...h.slice(-11), { role: "user", text: query }]);

      try {
        const farm = await buildFarmContext();
        const weather = await fetchWeather();

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
          if (precip > 0) weatherSummary += `, ${t ? "बारिश" : "rain"} ${precip}mm`;
        }

        const aiKey = getApiKey("ai");

        const aiResponse = await getAIResponse({
          query,
          weatherSummary,
          language,
          apiKey: aiKey,
          farm,
          lat: weather?.latitude ?? 18.52,
          lon: weather?.longitude ?? 73.85,
          district: farm?.location ?? "Pune",
          history,
        });

        setResponse(aiResponse);
        setStep("result");
        setHistory((h) => [
          ...h.slice(-11),
          { role: "agent", text: aiResponse.recommendation },
        ]);

        // Narrate recommendation + optional follow-up
        const ttsLang = aiResponse.language || language;
        const narration =
          aiResponse.recommendation +
          (aiResponse.follow_up ? `. ${aiResponse.follow_up}` : "");
        if (narration) {
          const utterance = new SpeechSynthesisUtterance(narration);
          utterance.lang = ttsLocale(ttsLang);
          utterance.rate = 0.9;
          utterance.onend = () => {
            if (alwaysRef.current && stepRef.current === "result") {
              setTimeout(() => {
                beginListening();
              }, 1200);
            }
          };
          utterance.onerror = () => {
            if (alwaysRef.current && stepRef.current === "result") {
              setTimeout(() => {
                beginListening();
              }, 1200);
            }
          };
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        }
      } catch (err: any) {
        if (err.message?.includes("timed out") || err.message?.includes("AbortError")) {
          setErrorMessage(t ? "थोड़ा समय लग रहा है… फिर से कोशिश करें" : "Taking too long… please try again");
        } else if (err.message?.includes("fetch") || err.message?.includes("network")) {
          setErrorMessage(t ? "इंटरनेट कनेक्शन जांचें" : "Check your connection");
        } else {
          setErrorMessage(err.message || "Something went wrong");
        }
        setStep("error");
      }
    },
    [language, t, history, fetchWeather, weatherCodeToDesc, buildFarmContext, beginListening],
  );

  /** Handle mic button tap — barge-in / interrupt */
  const handleMicTap = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
      return;
    }
    stop();
    await beginListening();
  }, [isRecording, stopRecording, beginListening, stop]);

  /** Handle text submit */
  const handleTextSubmit = useCallback(
    (text: string) => {
      setShowTextInput(false);
      getAIRecommendation(text);
    },
    [getAIRecommendation],
  );

  /** Reset */
  const handleReset = useCallback(() => {
    setStep("idle");
    setResponse(null);
    setErrorMessage("");
    setInterimText("");
    setShowTextInput(false);
    weatherRef.current = null;
    stop();
  }, [stop]);

  /** Proactive weather alert on mount */
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const check = async () => {
      try {
        const farm = await fetchFarmWeather(user.id);
        if (!mounted || !farm) return;
        const alert = proactiveAlert(farm);
        if (alert) {
          setProactive({ title: alert.title, body: alert.body });
        }
      } catch {
        // ignore
      }
    };
    check();
    return () => {
      mounted = false;
    };
  }, [user]);

  const resultType: ResultType = response?.result_type ?? "chat";
  const action = actionFromResultType(resultType);

  const iconButton =
    "p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer text-white/60 hover:text-white";

  const micIcon =
    step === "connecting" || step === "thinking" ? (
      <RefreshCw className="w-10 h-10 animate-spin-slow" />
    ) : step === "result" && isSpeaking ? (
      <Volume2 className="w-10 h-10" />
    ) : (
      <Mic className="w-10 h-10" />
    );

  const showWaveform = step === "recording" || step === "connecting" || step === "thinking";

  return (
    <div className="min-h-screen relative flex flex-col isolate overflow-hidden bg-[#171310]">
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
      <AppNav
        right={
          <>
            <div className="inline-flex items-center gap-2">
              <Languages className="w-5 h-5 text-white/60" />
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value as SpeechLanguageCode);
                  stop();
                }}
                aria-label="Language"
                title="Language"
                className="bg-white/10 border border-white/10 text-white text-xs font-medium rounded-full pl-3 pr-2 py-1.5 outline-none cursor-pointer [&>option]:text-black focus-visible:ring-2 focus-visible:ring-white/30"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.code === "en" ? "English" : l.native}
                  </option>
                ))}
              </select>
            </div>
            <Link to="/dashboard" aria-label="Close" title="Close" className={iconButton}>
              <X className="w-5 h-5" />
            </Link>
          </>
        }
      />

      {/* Split panel */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8">
          {/* LEFT — conversation / voice */}
          <aside className="flex flex-col gap-6 min-h-[600px]">
            <div className="fade-rise stagger-1 flex items-center justify-between">
              <h1 className="font-serif text-3xl text-white tracking-tight">
                {t ? "मैं आपकी कैसे मदद करूं?" : "How can I help?"}
              </h1>
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                <div
                  className="w-2 h-2 rounded-full dot-pulse"
                  style={{ backgroundColor: STATE_DOT[agentState] }}
                />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                  {STATE_LABEL[agentState]}
                </span>
              </div>
            </div>

            {/* Mic orb */}
            <div className="fade-rise stagger-2 flex flex-col items-center gap-6">
              <div className="relative flex items-center justify-center">
                <div className="flex items-center gap-1.5 mr-8">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="waveform-bar" style={showWaveform ? undefined : { animation: "none" }} />
                  ))}
                </div>

                <button
                  onClick={handleMicTap}
                  aria-label="Voice agent"
                  className={`w-[130px] h-[130px] rounded-full ${STATE_CLASS[agentState]} flex items-center justify-center text-white shadow-2xl transition-all duration-500 hover:scale-105 ${step === "result" || step === "error" || step === "idle" ? "" : "mic-pulse"} group cursor-pointer`}
                >
                  {micIcon}
                </button>

                <div className="flex items-center gap-1.5 ml-8">
                  {[5, 6, 7, 8].map((n) => (
                    <div key={n} className="waveform-bar" style={showWaveform ? undefined : { animation: "none" }} />
                  ))}
                </div>
              </div>

              {/* Always-active toggle */}
              <button
                onClick={() => setAlwaysActive((v) => !v)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all cursor-pointer ${
                  alwaysActive
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-transparent border-white/10 text-white/40"
                }`}
                aria-pressed={alwaysActive}
              >
                {alwaysActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                {t ? "आवाज़ हमेशा सक्रिय" : "Voice always active"}
              </button>
            </div>

            {/* Transcript bubbles */}
            <div
              ref={scrollRef}
              className="fade-rise stagger-3 flex-1 flex flex-col gap-3 overflow-y-auto max-h-[340px] pr-1 pb-2"
            >
              {history.length === 0 && !interimText && (
                <p className="text-white/40 text-sm text-center py-10 font-light">
                  {t
                    ? "बोलें या नीचे से चुनें — बाज़ार, मौसम, खरीदार, कैलेंडर या योजनाएं।"
                    : "Speak or pick a suggestion below — prices, weather, buyers, calendar, or schemes."}
                </p>
              )}

              {history.map((turn, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                    turn.role === "user"
                      ? "self-end bg-white text-black rounded-br-md"
                      : "self-start bg-white/10 backdrop-blur-md border border-white/10 text-white/90 rounded-bl-md"
                  }`}
                >
                  {turn.text}
                </div>
              ))}

              {step === "recording" && interimText && (
                <div className="self-end max-w-[85%] px-5 py-3 rounded-2xl rounded-br-md bg-white/20 backdrop-blur-md text-white text-sm">
                  {interimText}
                </div>
              )}
            </div>

            {/* Suggestions */}
            <div className="fade-rise stagger-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleTextSubmit(s)}
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Typed input fallback */}
            {showTextInput && (
              <div className="w-full">
                <TextInput onSubmit={handleTextSubmit} />
              </div>
            )}

            {!showTextInput && step !== "result" && step !== "thinking" && (
              <button
                onClick={() => setShowTextInput((v) => !v)}
                className="self-start inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40 hover:text-white transition-all cursor-pointer"
              >
                <Keyboard className="w-4 h-4" />
                {t ? "टाइप करके पूछें" : "Type your question"}
              </button>
            )}
          </aside>

          {/* RIGHT — rendered tool UI */}
          <section className="min-h-[600px]">
            {/* Proactive alert */}
            {proactive && step !== "result" && (
              <div className="fade-rise stagger-1 mb-6">
                <div className="rounded-2xl border-l-[6px] border-amber-500 bg-amber-50/95 p-6 flex flex-col md:flex-row justify-between items-start gap-5">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-amber-900">{proactive.title}</h3>
                      <p className="text-amber-800/80 text-sm leading-relaxed mt-1 max-w-xl">
                        {proactive.body}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTextSubmit(t ? "इस मौसम चेतावनी के बारे में बताएं" : "Tell me about this weather alert")}
                    className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-black transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {t ? "इस बारे में पूछें" : "Ask about this"}
                  </button>
                </div>
              </div>
            )}

            {/* Right panel content */}
            {step === "thinking" && (
              <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <RefreshCw className="w-8 h-8 animate-spin text-white/60" />
                <p className="text-white/50 text-sm">{t ? "सोच रहा हूं…" : "Thinking…"}</p>
              </div>
            )}

            {step === "result" && response && (
              <div className="space-y-6">
                <div className="fade-rise stagger-1 flex items-center gap-3">
                  <div className="flex-1 px-5 py-4 rounded-2xl bg-white/95 text-[#0f172a] text-sm leading-relaxed">
                    {response.recommendation}
                    {response.follow_up && (
                      <p className="text-[#0f172a]/50 text-xs mt-2 italic">{response.follow_up}</p>
                    )}
                  </div>
                </div>

                {resultType === "chat" ? (
                  <div className="fade-rise stagger-2 w-full max-w-[520px] rounded-2xl bg-white/95 p-6">
                    <p className="text-[#0f172a] text-lg leading-relaxed">
                      {response.recommendation}
                    </p>
                    {response.weather_summary && (
                      <p className="text-[#0f172a]/60 text-sm leading-relaxed mt-3">
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
                            : "bg-white/5 border-black/10 text-slate-500 hover:bg-black hover:text-white"
                        }`}
                      >
                        <Volume2 className="w-4 h-4" />
                        Replay
                      </button>
                      <button
                        onClick={handleReset}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider border bg-white/5 border-black/10 text-slate-500 hover:bg-black hover:text-white transition-all cursor-pointer"
                      >
                        <Mic className="w-4 h-4" />
                        New Question
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="fade-rise stagger-2">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-white/10 border border-white/10 text-white/80 text-[10px] font-bold rounded-full uppercase tracking-widest">
                        {action}
                      </span>
                      <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                        Live View
                      </span>
                    </div>
                    {user && (
                      <AgentResultPanel type={resultType} userId={user.id} lang={language} />
                    )}
                  </div>
                )}
              </div>
            )}

            {step === "error" && (
              <div className="fade-rise stagger-2 w-full max-w-[520px] rounded-2xl bg-white/95 p-8">
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

            {step === "idle" && !proactive && (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-white/60" />
                </div>
                <div>
                  <h2 className="font-serif text-3xl text-white mb-2">
                    {t ? "आज मैं आपकी कैसे मदद करूं?" : "How can I help you today?"}
                  </h2>
                  <p className="text-white/50 text-base font-light max-w-md mx-auto">
                    {t
                      ? "बोलें, और मैं लाइव मार्केट, मौसम, खरीदार, कैलेंडर और योजनाएं दाईं ओर दिखाऊंगा।"
                      : "Ask me anything — I'll render live market data, weather, buyers, calendar, and schemes on the right."}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
