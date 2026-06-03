export interface FimCompletionOptions {
  apiKey: string;
  baseUrl: string;
  model: string;
  prefix: string;
  suffix: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
  stopSequences: string[];
}

export interface DeepSeekFimRequestBody {
  model: string;
  prompt: string;
  suffix?: string;
  max_tokens: number;
  temperature: number;
  stop?: string[];
  stream: false;
}

export type FetchImplementation = (input: string, init: RequestInit) => Promise<Response>;

export function buildCompletionsUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/completions`;
}

export function buildFimRequestBody(options: FimCompletionOptions): DeepSeekFimRequestBody {
  const body: DeepSeekFimRequestBody = {
    model: options.model,
    prompt: options.prefix,
    max_tokens: options.maxTokens,
    temperature: options.temperature,
    stream: false,
  };

  if (options.suffix.length > 0) {
    body.suffix = options.suffix;
  }

  if (options.stopSequences.length > 0) {
    body.stop = options.stopSequences;
  }

  return body;
}

export async function requestFimCompletion(
  options: FimCompletionOptions,
  abortSignal?: AbortSignal,
  fetchImplementation: FetchImplementation = fetch,
): Promise<string> {
  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), options.timeoutMs);
  const abortRequest = () => timeoutController.abort();

  if (abortSignal?.aborted) {
    timeoutController.abort();
  } else {
    abortSignal?.addEventListener("abort", abortRequest);
  }

  try {
    const response = await fetchImplementation(buildCompletionsUrl(options.baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify(buildFimRequestBody(options)),
      signal: timeoutController.signal,
    });

    if (!response.ok) {
      throw new Error(await createErrorMessage(response));
    }

    return extractCompletionText(await response.json());
  } finally {
    clearTimeout(timeout);
    abortSignal?.removeEventListener("abort", abortRequest);
  }
}

export function extractCompletionText(responseBody: unknown): string {
  if (!isRecord(responseBody) || !Array.isArray(responseBody.choices) || responseBody.choices.length === 0) {
    throw new Error("DeepSeek FIM response did not include any completion choices.");
  }

  const [firstChoice] = responseBody.choices;
  if (!isRecord(firstChoice) || typeof firstChoice.text !== "string") {
    throw new Error("DeepSeek FIM response choice did not include text.");
  }

  return firstChoice.text;
}

async function createErrorMessage(response: Response): Promise<string> {
  const responseText = await response.text();
  const statusText = response.statusText ? ` ${response.statusText}` : "";
  const detail = responseText ? `: ${responseText}` : "";

  return `DeepSeek FIM request failed (${response.status}${statusText})${detail}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
