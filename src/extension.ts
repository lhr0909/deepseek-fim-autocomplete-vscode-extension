import * as vscode from "vscode";
import { configurationSection } from "./config";
import { DeepSeekFimInlineCompletionProvider } from "./inlineCompletionProvider";

export function activate(context: vscode.ExtensionContext): void {
  const provider = new DeepSeekFimInlineCompletionProvider();

  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider([{ scheme: "file" }, { scheme: "untitled" }], provider),
    vscode.commands.registerCommand("deepseekFimAutocomplete.triggerInlineCompletion", () =>
      vscode.commands.executeCommand("editor.action.inlineSuggest.trigger"),
    ),
    vscode.commands.registerCommand("deepseekFimAutocomplete.openSettings", () =>
      vscode.commands.executeCommand("workbench.action.openSettings", configurationSection),
    ),
  );
}

export function deactivate(): void {}
