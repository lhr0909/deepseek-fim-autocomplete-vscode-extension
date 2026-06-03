import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCompletionsUrl,
  buildFimRequestBody,
  extractCompletionText,
  FetchImplementation,
  FimCompletionOptions,
  requestFimCompletion,
} from "../src/fimClient";

const baseOptions: FimCompletionOptions = {
  apiKey: "sk-test",
  baseUrl: "https://api.deepseek.com/beta/",
  model: "deepseek-v4-pro",
  prefix: "function fib(n) {\n  ",
  suffix: "\n}",
  maxTokens: 128,
  temperature: 0.2,
  timeoutMs: 15000,
  stopSequences: ["\n\n"],
};

test("buildCompletionsUrl appends completions to a trimmed base URL", () => {
  assert.equal(buildCompletionsUrl("https://api.deepseek.com/beta/"), "https://api.deepseek.com/beta/completions");
});

test("buildFimRequestBody maps extension options to DeepSeek fields", () => {
  assert.deepEqual(buildFimRequestBody(baseOptions), {
    model: "deepseek-v4-pro",
    prompt: "function fib(n) {\n  ",
    suffix: "\n}",
    max_tokens: 128,
    temperature: 0.2,
    stop: ["\n\n"],
    stream: false,
  });
});

test("buildFimRequestBody omits empty optional fields", () => {
  const body = buildFimRequestBody({ ...baseOptions, suffix: "", stopSequences: [] });

  assert.equal("suffix" in body, false);
  assert.equal("stop" in body, false);
});

test("extractCompletionText returns the first choice text", () => {
  const text = extractCompletionText({ choices: [{ text: "return n;" }] });

  assert.equal(text, "return n;");
});

test("extractCompletionText rejects malformed response bodies", () => {
  assert.throws(() => extractCompletionText({ choices: [] }), /did not include any completion choices/);
  assert.throws(() => extractCompletionText({ choices: [{ value: "missing text" }] }), /did not include text/);
});

test("requestFimCompletion posts a non-streaming FIM request", async () => {
  const calls: Array<{ input: string; init: RequestInit }> = [];
  const fetchImplementation: FetchImplementation = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ choices: [{ text: "return fib(n - 1) + fib(n - 2);" }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const completion = await requestFimCompletion(baseOptions, undefined, fetchImplementation);

  assert.equal(completion, "return fib(n - 1) + fib(n - 2);");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].input, "https://api.deepseek.com/beta/completions");
  assert.deepEqual(JSON.parse(calls[0].init.body as string), buildFimRequestBody(baseOptions));
  assert.deepEqual(calls[0].init.headers, {
    "Content-Type": "application/json",
    Authorization: "Bearer sk-test",
  });
});

test("requestFimCompletion reports HTTP errors", async () => {
  const fetchImplementation: FetchImplementation = async () => new Response("invalid key", {
    status: 401,
    statusText: "Unauthorized",
  });

  await assert.rejects(() => requestFimCompletion(baseOptions, undefined, fetchImplementation), /401 Unauthorized\): invalid key/);
});

test("requestFimCompletion passes through an already-aborted signal", async () => {
  const abortController = new AbortController();
  abortController.abort();

  const fetchImplementation: FetchImplementation = async (_input, init) => {
    assert.equal(init.signal instanceof AbortSignal, true);
    assert.equal(init.signal?.aborted, true);
    return new Response(JSON.stringify({ choices: [{ text: "" }] }), { status: 200 });
  };

  await requestFimCompletion(baseOptions, abortController.signal, fetchImplementation);
});
