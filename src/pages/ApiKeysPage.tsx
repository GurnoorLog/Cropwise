import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  LogOut,
  Mic,
  Sparkles,
  CloudSun,
  Check,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import {
  getApiKeys,
  getStoredApiKeys,
  getApiKeySource,
  setApiKey,
  maskKey,
  type ApiKeyName,
  type ApiKeySource,
} from "../lib/apiKeys";

interface IntegrationCardProps {
  id: ApiKeyName;
  icon: typeof Mic;
  iconBg: string;
  title: string;
  description: string;
  storedValue: string;
  effectiveValue: string;
  source: ApiKeySource;
  placeholder: string;
  onSaved: (name: ApiKeyName, value: string) => void;
}

function IntegrationCard({
  id,
  icon: Icon,
  iconBg,
  title,
  description,
  storedValue,
  effectiveValue,
  source,
  placeholder,
  onSaved,
}: IntegrationCardProps) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const hasStored = storedValue.length > 0;
  const fromEnv = source === "env";
  const configured = hasStored || fromEnv;

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onSaved(id, trimmed);
      setValue("");
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
    }
  };

  const handleClear = () => {
    onSaved(id, "");
    setValue("");
  };

  const statusLabel = hasStored ? "Configured" : fromEnv ? "Configured · env" : "Not set";
  const statusClass = configured
    ? hasStored
      ? "bg-green-100 text-green-700"
      : "bg-sky-100 text-sky-700"
    : "bg-slate-100 text-slate-500";

  return (
    <div className="card-glass p-8 fade-rise stagger-1">
      <div className="flex items-start gap-4 mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h2 className="font-serif text-2xl">{title}</h2>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">{description}</p>
        </div>
        <span
          className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      {configured && (
        <div className="flex items-center justify-between mb-4 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="min-w-0">
            <p className="text-sm font-mono text-slate-600 truncate">
              {maskKey(effectiveValue)}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              {hasStored ? "Stored in this browser" : "From environment (Vercel)"}
            </p>
          </div>
          {hasStored && (
            <button
              onClick={handleClear}
              aria-label={`Remove ${title} key`}
              className="ml-3 shrink-0 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder={placeholder}
            aria-label={`${title} API key`}
            className="w-full px-4 py-3 pr-10 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          />
          <button
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide key" : "Show key"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={!value.trim()}
          className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-black text-white text-sm font-semibold transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {savedFlash ? <Check className="w-4 h-4 text-green-400" /> : null}
          {savedFlash ? "Saved" : "Save"}
        </button>
      </div>
      <p className="text-[11px] text-slate-400 mt-3">
        {hasStored
          ? "Stored only in this browser. Remove it to fall back to the environment key."
          : fromEnv
            ? "Set from the environment (Vercel). Enter one here to override it for this browser."
            : "No key set. The Advisor will fall back to the Supabase Edge Function."}
      </p>
    </div>
  );
}

export default function ApiKeysPage() {
  const { user, signOut } = useAuth();
  const [keys, setKeys] = useState(getApiKeys);
  const [stored, setStored] = useState(getStoredApiKeys);

  const handleSave = (name: ApiKeyName, value: string) => {
    setKeys(setApiKey(name, value));
    setStored(getStoredApiKeys());
  };

  const fullName = (user?.user_metadata?.full_name as string) ?? user?.email ?? "Farmer";
  const initials = fullName
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navLink = (active: boolean) =>
    `text-sm font-medium transition-colors ${active ? "text-white" : "text-white/60 hover:text-white"}`;

  return (
    <div className="min-h-screen relative flex flex-col isolate bg-[hsl(201,100%,13%)]">
      {/* Background Video Layer */}
      <div className="fixed inset-0 w-full h-full -z-20 overflow-hidden">
        <video autoPlay muted loop playsInline className="w-full h-full object-cover">
          <source
            src="https://designerstephen.github.io/public-assets/videos/serene-art-hero.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 video-overlay-dashboard" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 backdrop-blur-md bg-transparent">
        <div className="max-w-[1400px] mx-auto px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="font-serif text-2xl text-white tracking-tight">
              Harvest Window
            </Link>
            <div className="hidden md:flex gap-6">
              <Link to="/dashboard" className={navLink(false)}>
                Dashboard
              </Link>
              <Link to="/app" className={navLink(false)}>
                Advisor
              </Link>
              <Link to="/settings" className={navLink(true)}>
                API Keys
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              aria-label="Notifications"
              className="text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white">{fullName}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-tighter">Premium Estate</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-white font-bold text-sm">
                {initials}
              </div>
              <button
                onClick={signOut}
                aria-label="Sign out"
                className="text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-8 py-10">
        <header className="mb-10 fade-rise stagger-1">
          <h1 className="font-serif text-4xl text-white mb-2">Integrations & API Keys</h1>
          <p className="text-white/50 font-light max-w-xl">
            Enter the API keys that power the Advisor — voice transcription and AI
            recommendations — so the app works directly from the browser. Keys can also be
            set per deployment via environment variables.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <IntegrationCard
            id="speechmatics"
            icon={Mic}
            iconBg="bg-sky-50 text-sky-600"
            title="Speechmatics"
            description="Voice transcription. Your API key is used to mint a real-time token for the microphone flow."
            storedValue={stored.speechmatics}
            effectiveValue={keys.speechmatics}
            source={getApiKeySource("speechmatics")}
            placeholder="Enter your Speechmatics API key"
            onSaved={handleSave}
          />
          <IntegrationCard
            id="ai"
            icon={Sparkles}
            iconBg="bg-violet-50 text-violet-600"
            title="AI/ML API"
            description="Market recommendations. Your key is used to call the AI/ML API (OpenAI-compatible) for crop advice and buyer messages."
            storedValue={stored.ai}
            effectiveValue={keys.ai}
            source={getApiKeySource("ai")}
            placeholder="Enter your AI/ML API key"
            onSaved={handleSave}
          />
        </div>

        <div className="card-glass p-6 mt-8 fade-rise stagger-3 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <CloudSun className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Weather data — no key required</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Live humidity and temperature for the spoilage-risk calculation come from
              Open-Meteo, which works out of the box.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
