# DeepSeek FIM Autocomplete

A deliberately tiny VS Code extension that provides inline autocomplete suggestions with DeepSeek's Fill-In-Middle completion API.

## Features

- TypeScript extension code.
- VS Code inline completions at the cursor.
- Status bar indicator that spins while DeepSeek requests are in flight.
- Prefix and suffix context sent to DeepSeek FIM.
- Simple JSON settings for API key, model, base URL, token limit, temperature, trigger mode, timeout, and context size.
- Unit tests for the core request/config/context logic.

## Settings

Add these to your VS Code `settings.json`:

```json
{
  "deepseekFimAutocomplete.apiKey": "YOUR_DEEPSEEK_API_KEY",
  "deepseekFimAutocomplete.model": "deepseek-v4-pro",
  "deepseekFimAutocomplete.baseUrl": "https://api.deepseek.com/beta",
  "deepseekFimAutocomplete.maxTokens": 128,
  "deepseekFimAutocomplete.temperature": 0.2,
  "deepseekFimAutocomplete.triggerMode": "automatic"
}
```

Set `deepseekFimAutocomplete.triggerMode` to `manual` if you only want requests when running **DeepSeek FIM: Trigger Inline Completion**. The default keybinding is `Ctrl+Alt+Space` (`Cmd+Alt+Space` on macOS).

## Development

```bash
npm install
npm test
```

To run inside VS Code, open this folder and press `F5` to start an Extension Development Host.

## Package locally

```bash
npm run package
code --install-extension deepseek-fim-autocomplete-0.0.2.vsix
```

After installing, reload VS Code and set `deepseekFimAutocomplete.apiKey` in `settings.json`.

## Publish to the VS Code Marketplace

Create `.env` from `.env.example` and fill in your marketplace token:

```bash
cp .env.example .env
```

Required keys:

```dotenv
VSCE_PERSONAL_ACCESS_TOKEN=your-vscode-marketplace-personal-access-token
VSCE_PUBLISHER=simon-liang
```

Then validate the publish configuration without publishing:

```bash
npm run publish:vsce:dry
```

Publish the current package version:

```bash
npm run publish:vsce
```

You can pass normal `vsce publish` arguments after `--`, for example:

```bash
npm run publish:vsce -- patch
npm run publish:vsce -- --pre-release
```
