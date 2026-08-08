export type ApiKeyName = "speechmatics" | "ai";

export interface ApiKeys {
  speechmatics: string;
  ai: string;
}

export type ApiKeySource = "none" | "env" | "browser";

const STORAGE_KEY = "harvest-window-api-keys";

const EMPTY: ApiKeys = { speechmatics: "", ai: "" };

const ENV_KEYS: ApiKeys = {
  speechmatics: import.meta.env.VITE_SPEECHMATICS_API_KEY ?? "",
  ai: import.meta.env.VITE_AI_API_KEY ?? "",
};

function readStored(): ApiKeys {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<ApiKeys>;
    return {
      speechmatics: parsed.speechmatics ?? "",
      ai: parsed.ai ?? "",
    };
  } catch {
    return EMPTY;
  }
}

/** Effective keys — browser-stored values override environment values. */
export function getApiKeys(): ApiKeys {
  const stored = readStored();
  return {
    speechmatics: stored.speechmatics || ENV_KEYS.speechmatics,
    ai: stored.ai || ENV_KEYS.ai,
  };
}

/** Browser-local keys only (no environment fallback). */
export function getStoredApiKeys(): ApiKeys {
  return readStored();
}

export function getApiKey(name: ApiKeyName): string {
  return getApiKeys()[name].trim();
}

/** Where the effective key for this provider currently comes from. */
export function getApiKeySource(name: ApiKeyName): ApiKeySource {
  if (readStored()[name].trim()) return "browser";
  if (ENV_KEYS[name].trim()) return "env";
  return "none";
}

export function setApiKey(name: ApiKeyName, value: string): ApiKeys {
  const stored = readStored();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...stored, [name]: value.trim() }),
    );
  }
  return getApiKeys();
}

export function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 10) return "•".repeat(key.length);
  return `${key.slice(0, 6)}••••••${key.slice(-4)}`;
}
