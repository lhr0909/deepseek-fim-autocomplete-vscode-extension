import * as vscode from "vscode";
import { configurationSection, DeepSeekFimSettings, readDeepSeekFimSettings } from "./config";
import { selectFimContext } from "./documentContext";
import { FimCompletionOptions, requestFimCompletion } from "./fimClient";
import { RequestActivity } from "./requestActivity";

type CompletionRequester = (options: FimCompletionOptions, abortSignal?: AbortSignal) => Promise<string>;

interface InlineCompletionProviderDependencies {
  readSettings?: () => DeepSeekFimSettings;
  requestCompletion?: CompletionRequester;
  requestActivity?: RequestActivity;
}

export class DeepSeekFimInlineCompletionProvider implements vscode.InlineCompletionItemProvider {
  private readonly readSettings: () => DeepSeekFimSettings;
  private readonly requestCompletion: CompletionRequester;
  private readonly requestActivity?: RequestActivity;
  private missingApiKeyWarningShown = false;

  public constructor(dependencies: InlineCompletionProviderDependencies = {}) {
    this.readSettings =
      dependencies.readSettings ?? (() => readDeepSeekFimSettings(vscode.workspace.getConfiguration(configurationSection)));
    this.requestCompletion = dependencies.requestCompletion ?? requestFimCompletion;
    this.requestActivity = dependencies.requestActivity;
  }

  public async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken,
  ): Promise<vscode.InlineCompletionItem[] | undefined> {
    const settings = this.readSettings();
    if (!shouldRequestCompletion(settings, context.triggerKind)) {
      return undefined;
    }

    if (!settings.apiKey) {
      await this.showMissingApiKeyWarning(context.triggerKind);
      return undefined;
    }

    if (context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic) {
      const shouldContinue = await waitForDebounce(settings.debounceMs, token);
      if (!shouldContinue) {
        return undefined;
      }
    }

    const completion = await this.fetchCompletion(document, position, settings, context.triggerKind, token);
    if (!completion || token.isCancellationRequested) {
      return undefined;
    }

    return [new vscode.InlineCompletionItem(completion, new vscode.Range(position, position))];
  }

  private async fetchCompletion(
    document: vscode.TextDocument,
    position: vscode.Position,
    settings: DeepSeekFimSettings,
    triggerKind: vscode.InlineCompletionTriggerKind,
    token: vscode.CancellationToken,
  ): Promise<string | undefined> {
    const abortController = new AbortController();
    const cancellation = token.onCancellationRequested(() => abortController.abort());

    try {
      const documentText = document.getText();
      const { prefix, suffix } = selectFimContext(
        documentText,
        document.offsetAt(position),
        settings.maxPrefixChars,
        settings.maxSuffixChars,
      );

      const finishRequestActivity = this.requestActivity?.start() ?? (() => undefined);
      try {
        return await this.requestCompletion(
          {
            apiKey: settings.apiKey,
            baseUrl: settings.baseUrl,
            model: settings.model,
            prefix,
            suffix,
            maxTokens: settings.maxTokens,
            temperature: settings.temperature,
            timeoutMs: settings.timeoutMs,
            stopSequences: settings.stopSequences,
          },
          abortController.signal,
        );
      } finally {
        finishRequestActivity();
      }
    } catch (error) {
      if (!token.isCancellationRequested) {
        console.error("DeepSeek FIM autocomplete failed", error);
        if (triggerKind !== vscode.InlineCompletionTriggerKind.Automatic) {
          await vscode.window.showErrorMessage(`DeepSeek FIM autocomplete failed: ${readErrorMessage(error)}`);
        }
      }
      return undefined;
    } finally {
      cancellation.dispose();
    }
  }

  private async showMissingApiKeyWarning(triggerKind: vscode.InlineCompletionTriggerKind): Promise<void> {
    if (triggerKind === vscode.InlineCompletionTriggerKind.Automatic || this.missingApiKeyWarningShown) {
      return;
    }

    this.missingApiKeyWarningShown = true;
    const selection = await vscode.window.showWarningMessage(
      "DeepSeek FIM Autocomplete needs deepseekFimAutocomplete.apiKey in settings.json.",
      "Open Settings",
    );

    if (selection === "Open Settings") {
      await vscode.commands.executeCommand("deepseekFimAutocomplete.openSettings");
    }
  }
}

function shouldRequestCompletion(settings: DeepSeekFimSettings, triggerKind: vscode.InlineCompletionTriggerKind): boolean {
  if (!settings.enabled) {
    return false;
  }

  return settings.triggerMode !== "manual" || triggerKind !== vscode.InlineCompletionTriggerKind.Automatic;
}

function readErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function waitForDebounce(delayMs: number, token: vscode.CancellationToken): Promise<boolean> {
  if (delayMs <= 0) {
    return Promise.resolve(!token.isCancellationRequested);
  }

  return new Promise((resolve) => {
    let cancellation: vscode.Disposable | undefined;
    const finish = (shouldContinue: boolean) => {
      clearTimeout(timer);
      cancellation?.dispose();
      resolve(shouldContinue);
    };
    const timer = setTimeout(() => finish(true), delayMs);

    cancellation = token.onCancellationRequested(() => finish(false));
  });
}
