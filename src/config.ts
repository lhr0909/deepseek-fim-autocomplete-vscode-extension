export const configurationSection = "deepseekFimAutocomplete";

export type TriggerMode = "automatic" | "manual";

export interface DeepSeekFimSettings {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  triggerMode: TriggerMode;
  debounceMs: number;
  timeoutMs: number;
  maxPrefixChars: number;
  maxSuffixChars: number;
  stopSequences: string[];
}

export interface ConfigurationReader {
  get<T>(key: string, defaultValue: T): T | undefined;
}

export const defaultSettings: DeepSeekFimSettings = {
  enabled: true,
  apiKey: "",
  baseUrl: "https://api.deepseek.com/beta",
  model: "deepseek-v4-pro",
  maxTokens: 128,
  temperature: 0.2,
  triggerMode: "automatic",
  debounceMs: 250,
  timeoutMs: 15000,
  maxPrefixChars: 6000,
  maxSuffixChars: 2000,
  stopSequences: [],
};

export function readDeepSeekFimSettings(configuration: ConfigurationReader): DeepSeekFimSettings {
  const triggerMode = readTriggerMode(configuration.get("triggerMode", defaultSettings.triggerMode));

  return {
    enabled: configuration.get("enabled", defaultSettings.enabled) ?? defaultSettings.enabled,
    apiKey: readString(configuration.get("apiKey", defaultSettings.apiKey), defaultSettings.apiKey).trim(),
    baseUrl: readString(configuration.get("baseUrl", defaultSettings.baseUrl), defaultSettings.baseUrl),
    model: readString(configuration.get("model", defaultSettings.model), defaultSettings.model),
    maxTokens: configuration.get("maxTokens", defaultSettings.maxTokens) ?? defaultSettings.maxTokens,
    temperature: configuration.get("temperature", defaultSettings.temperature) ?? defaultSettings.temperature,
    triggerMode,
    debounceMs: configuration.get("debounceMs", defaultSettings.debounceMs) ?? defaultSettings.debounceMs,
    timeoutMs: configuration.get("timeoutMs", defaultSettings.timeoutMs) ?? defaultSettings.timeoutMs,
    maxPrefixChars: configuration.get("maxPrefixChars", defaultSettings.maxPrefixChars) ?? defaultSettings.maxPrefixChars,
    maxSuffixChars: configuration.get("maxSuffixChars", defaultSettings.maxSuffixChars) ?? defaultSettings.maxSuffixChars,
    stopSequences: readStopSequences(configuration.get("stopSequences", defaultSettings.stopSequences)),
  };
}

function readString(value: unknown, defaultValue: string): string {
  return typeof value === "string" ? value : defaultValue;
}

function readTriggerMode(value: unknown): TriggerMode {
  return value === "manual" ? "manual" : "automatic";
}

function readStopSequences(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}
