import * as vscode from "vscode";
import { configurationSection } from "./config";
import { DeepSeekFimInlineCompletionProvider } from "./inlineCompletionProvider";
import { RequestActivity } from "./requestActivity";
import { StatusBarController } from "./statusBarController";

export function activate(context: vscode.ExtensionContext): void {
  const requestActivity = new RequestActivity();
  const statusBarController = new StatusBarController(requestActivity);
  const provider = new DeepSeekFimInlineCompletionProvider({ requestActivity });

  context.subscriptions.push(
    statusBarController,
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
