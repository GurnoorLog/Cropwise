# Components

## Shared UI Primitives

### MicButton
- File: `src/components/MicButton.tsx`
- Description: Round mic toggle button for the Advisor voice flow (Hindi/English). States: idle (primary), connecting (spinner), recording (destructive pulse).
- Props: `isRecording: boolean`, `isConnecting: boolean`, `onClick: () => void`, `disabled?: boolean`

```tsx
import { Mic, MicOff, Loader2 } from "lucide-react";

interface MicButtonProps {
  isRecording: boolean;
  isConnecting: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function MicButton({
  isRecording,
  isConnecting,
  onClick,
  disabled = false,
}: MicButtonProps) {
  const label = isRecording
    ? "बोलना बंद करें"
    : isConnecting
      ? "कनेक्ट हो रहा है..."
      : "बोलने के लिए टैप करें";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={onClick}
        disabled={disabled || isConnecting}
        aria-label={label}
        aria-pressed={isRecording}
        className={`
          relative flex items-center justify-center
          w-20 h-20 sm:w-24 sm:h-24
          rounded-full cursor-pointer
          transition-all duration-300 ease-out
          focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring
          active:scale-95
          ${isRecording
            ? "bg-destructive text-white shadow-lg shadow-destructive/30 animate-mic-pulse"
            : "bg-primary text-on-primary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
          }
          ${disabled || isConnecting ? "opacity-60 cursor-not-allowed" : ""}
        `}
      >
        {isConnecting ? (
          <Loader2 className="w-9 h-9 sm:w-11 sm:h-11 animate-spin-slow" />
        ) : isRecording ? (
          <MicOff className="w-9 h-9 sm:w-11 sm:h-11" />
        ) : (
          <Mic className="w-9 h-9 sm:w-11 sm:h-11" />
        )}
      </button>
      <span className="text-sm text-foreground/70 font-medium text-center px-4">
        {label}
      </span>
    </div>
  );
}
```

### ResponseCard
- File: `src/components/ResponseCard.tsx`
- Description: Result card for the Advisor AI response. Header spoilage badge (green/yellow/red), weather summary, price estimate, recommendation, replay + reset actions. Bilingual (hi/en).
- Props: `data: AIResponse`, `isSpeaking: boolean`, `onReplay`, `onReset`
- Exports `AIResponse` interface used app-wide.

```tsx
import { Volume2, RefreshCw } from "lucide-react";

export interface AIResponse {
  weather_summary: string;
  price_estimate: string;
  recommendation: string;
  spoilage_risk: "green" | "yellow" | "red";
  language: "hi" | "en";
}

interface ResponseCardProps {
  data: AIResponse;
  isSpeaking: boolean;
  onReplay: () => void;
  onReset: () => void;
}

function SpoilageBadge({ risk, lang }: { risk: string; lang: "hi" | "en" }) {
  const labels: Record<string, { hi: string; en: string }> = {
    green: { hi: "कम जोखिम", en: "Low Risk" },
    yellow: { hi: "मध्यम जोखिम", en: "Moderate Risk" },
    red: { hi: "उच्च जोखिम", en: "High Risk" },
  };

  const colors: Record<string, string> = {
    green: "bg-success/10 text-success border-success/30",
    yellow: "bg-warning/10 text-warning border-warning/30",
    red: "bg-destructive/10 text-destructive border-destructive/30",
  };

  const label = labels[risk]?.[lang] ?? labels.yellow[lang];

  return (
    <span
      className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${colors[risk]}`}
    >
      {label}
    </span>
  );
}

export default function ResponseCard({
  data,
  isSpeaking,
  onReplay,
  onReset,
}: ResponseCardProps) {
  const lang = data.language || "hi";

  const labels = {
    spoilageTitle: lang === "hi" ? "खराब होने का जोखिम" : "Spoilage Risk",
    weatherTitle: lang === "hi" ? "मौसम" : "Weather",
    priceTitle: lang === "hi" ? "अनुमानित कीमत" : "Price Estimate",
    adviceTitle: lang === "hi" ? "सलाह" : "Recommendation",
    replayLabel: lang === "hi" ? "दोबारा सुनें" : "Replay",
    newQuestion: lang === "hi" ? "नया सवाल पूछें" : "Ask Another Question",
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in-up">
      <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
        {/* Header with spoilage badge */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-foreground/60 uppercase tracking-wide">
            {labels.spoilageTitle}
          </h3>
          <SpoilageBadge risk={data.spoilage_risk} lang={lang} />
        </div>

        {/* Weather Summary */}
        {data.weather_summary && (
          <div className="px-5 py-3 border-b border-border/50">
            <h4 className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1">
              {labels.weatherTitle}
            </h4>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {data.weather_summary}
            </p>
          </div>
        )}

        {/* Price Estimate */}
        {data.price_estimate && (
          <div className="px-5 py-3 border-b border-border/50">
            <h4 className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1">
              {labels.priceTitle}
            </h4>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {data.price_estimate}
            </p>
          </div>
        )}

        {/* Recommendation */}
        <div className="px-5 py-4">
          <h4 className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-2">
            {labels.adviceTitle}
          </h4>
          <p className="text-[15px] text-foreground leading-relaxed whitespace-pre-line">
            {data.recommendation}
          </p>
        </div>

        {/* Actions */}
        <div className="px-5 py-3 bg-muted flex items-center gap-3">
          <button
            onClick={onReplay}
            aria-label={labels.replayLabel}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
              transition-all duration-200 ease-out cursor-pointer
              ${isSpeaking
                ? "bg-primary text-on-primary"
                : "bg-card border border-border text-foreground hover:bg-primary/5"
              }
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring
            `}
          >
            <Volume2 className={`w-4 h-4 ${isSpeaking ? "animate-pulse" : ""}`} />
            {labels.replayLabel}
          </button>
          <button
            onClick={onReset}
            aria-label={labels.newQuestion}
            className="
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
              bg-primary text-on-primary
              transition-all duration-200 ease-out
              hover:bg-secondary active:scale-95
              cursor-pointer
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring
            "
          >
            <RefreshCw className="w-4 h-4" />
            {labels.newQuestion}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### TextInput
- File: `src/components/TextInput.tsx`
- Description: Text question input for the Advisor (bilingual). Keyboard icon, send button.
- Props: `onSubmit: (text: string) => void`, `disabled?: boolean`, `placeholder?: string`

```tsx
import { Send, Keyboard } from "lucide-react";
import { useState, type FormEvent } from "react";

interface TextInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function TextInput({
  onSubmit,
  disabled = false,
  placeholder = "अपना सवाल लिखें...",
}: TextInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSubmit(trimmed);
      setValue("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="flex items-center gap-2 px-1">
        <div className="relative flex-1">
          <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            aria-label="अपना सवाल लिखें"
            className="
              w-full pl-12 pr-4 py-3.5
              bg-card border border-border
              rounded-xl text-base text-foreground
              placeholder:text-foreground/35
              transition-all duration-200 ease-out
              focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          aria-label="सवाल भेजें"
          className="
            flex-shrink-0 w-12 h-12
            flex items-center justify-center
            rounded-xl bg-primary text-on-primary
            transition-all duration-200 ease-out
            hover:bg-secondary active:scale-95
            disabled:opacity-40 disabled:cursor-not-allowed
            cursor-pointer
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring
          "
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
```
