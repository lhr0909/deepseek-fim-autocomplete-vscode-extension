import assert from "node:assert/strict";
import test from "node:test";
import { ConfigurationReader, defaultSettings, readDeepSeekFimSettings } from "../src/config";

class TestConfiguration implements ConfigurationReader {
  public constructor(private readonly values: Record<string, unknown> = {}) {}

  public get<T>(key: string, defaultValue: T): T | undefined {
    return Object.prototype.hasOwnProperty.call(this.values, key) ? (this.values[key] as T) : defaultValue;
  }
}

test("readDeepSeekFimSettings returns defaults", () => {
  assert.deepEqual(readDeepSeekFimSettings(new TestConfiguration()), defaultSettings);
});

test("readDeepSeekFimSettings reads configured values", () => {
  const settings = readDeepSeekFimSettings(
    new TestConfiguration({
      enabled: false,
      apiKey: "  sk-test  ",
      baseUrl: "https://example.test/beta/",
      model: "custom-fim-model",
      maxTokens: 512,
      temperature: 0.4,
      triggerMode: "manual",
      debounceMs: 100,
      timeoutMs: 3000,
      maxPrefixChars: 123,
      maxSuffixChars: 45,
      stopSequences: ["\n\n", "```", "", 42],
    }),
  );

  assert.deepEqual(settings, {
    enabled: false,
    apiKey: "sk-test",
    baseUrl: "https://example.test/beta/",
    model: "custom-fim-model",
    maxTokens: 512,
    temperature: 0.4,
    triggerMode: "manual",
    debounceMs: 100,
    timeoutMs: 3000,
    maxPrefixChars: 123,
    maxSuffixChars: 45,
    stopSequences: ["\n\n", "```"],
  });
});

test("readDeepSeekFimSettings falls back to automatic trigger mode", () => {
  const settings = readDeepSeekFimSettings(new TestConfiguration({ triggerMode: "sometimes" }));

  assert.equal(settings.triggerMode, "automatic");
});
