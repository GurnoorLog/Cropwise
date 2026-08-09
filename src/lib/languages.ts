export type SpeechLanguageCode = "en" | "hi" | "mr" | "bn" | "ta" | "ur";

export interface SpeechLanguage {
  code: SpeechLanguageCode;
  name: string;
  native: string;
  tts: string;
}

export const LANGUAGES: SpeechLanguage[] = [
  { code: "en", name: "English", native: "English", tts: "en-IN" },
  { code: "hi", name: "Hindi", native: "हिन्दी", tts: "hi-IN" },
  { code: "mr", name: "Marathi", native: "मराठी", tts: "mr-IN" },
  { code: "bn", name: "Bengali", native: "বাংলা", tts: "bn-IN" },
  { code: "ta", name: "Tamil", native: "தமிழ்", tts: "ta-IN" },
  { code: "ur", name: "Urdu", native: "اردو", tts: "ur-IN" },
];

export function isSpeechLanguage(code: string | null | undefined): code is SpeechLanguageCode {
  return LANGUAGES.some((l) => l.code === code);
}

export function languageName(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.name ?? "English";
}

export function ttsLocale(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.tts ?? "en-IN";
}

export function languageLabel(lang: SpeechLanguageCode): string {
  return lang === "en" ? "English" : `${LANGUAGES.find((l) => l.code === lang)?.native ?? lang} (${languageName(lang)})`;
}
