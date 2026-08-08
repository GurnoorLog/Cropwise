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
