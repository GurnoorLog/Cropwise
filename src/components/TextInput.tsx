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
