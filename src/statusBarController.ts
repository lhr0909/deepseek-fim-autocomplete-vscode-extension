import * as vscode from "vscode";
import { RequestActivity } from "./requestActivity";

export class StatusBarController implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem;
  private readonly unsubscribe: () => void;

  public constructor(private readonly requestActivity: RequestActivity) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.item.command = "deepseekFimAutocomplete.openSettings";
    this.unsubscribe = this.requestActivity.onDidChange(() => this.render());
    this.render();
    this.item.show();
  }

  public dispose(): void {
    this.unsubscribe();
    this.item.dispose();
  }

  private render(): void {
    if (this.requestActivity.isActive) {
      this.item.text = "$(sync~spin) DeepSeek FIM";
      this.item.tooltip = "DeepSeek FIM is requesting an autocomplete suggestion.";
      return;
    }

    this.item.text = "$(hubot) DeepSeek FIM";
    this.item.tooltip = "DeepSeek FIM Autocomplete is ready. Click to open settings.";
  }
}
