export type ApiKeyName = "speechmatics" | "ai";

export interface ApiKeys {
  speechmatics: string;
  ai: string;
}

const STORAGE_KEY = "harvest-window-api-keys";

const EMPTY: ApiKeys = { speechmatics: "", ai: "" };

export function getApiKeys(): ApiKeys {
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

export function getApiKey(name: ApiKeyName): string {
  return getApiKeys()[name].trim();
}

export function setApiKey(name: ApiKeyName, value: string): ApiKeys {
  const keys = { ...getApiKeys(), [name]: value.trim() };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  }
  return keys;
}

export function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 10) return "•".repeat(key.length);
  return `${key.slice(0, 6)}••••••${key.slice(-4)}`;
}
