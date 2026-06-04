#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

const dryRun = args.includes("--dry-run");
const vsceArgs = args.filter((arg) => arg !== "--dry-run");

loadDotenv(path.join(projectRoot, ".env"));

const packageJson = readPackageJson();
const token = readRequiredEnv("VSCE_PERSONAL_ACCESS_TOKEN", "VSCE_PAT");
const publisher = readRequiredEnv("VSCE_PUBLISHER");

if (!packageJson.publisher) {
  fail("package.json must include a publisher before publishing to the VS Code Marketplace.");
}

if (publisher !== packageJson.publisher) {
  fail(`VSCE_PUBLISHER (${publisher}) must match package.json publisher (${packageJson.publisher}).`);
}

if (dryRun) {
  console.log("VSCE publish dry run passed.");
  console.log(`Extension: ${packageJson.publisher}.${packageJson.name}@${packageJson.version}`);
  console.log(`Command: npx vsce publish --no-dependencies --allow-missing-repository ${vsceArgs.join(" ")}`.trim());
  console.log("Token: loaded from .env/environment and hidden");
  process.exit(0);
}

const result = spawnSync(getNpxCommand(), [
  "vsce",
  "publish",
  "--no-dependencies",
  "--allow-missing-repository",
  ...vsceArgs,
], {
  cwd: projectRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    VSCE_PAT: token,
  },
});

process.exit(result.status ?? 1);

function printHelp() {
  console.log(`Usage: npm run publish:vsce -- [vsce publish args]

Loads .env, validates VSCE_PUBLISHER against package.json, maps VSCE_PERSONAL_ACCESS_TOKEN to VSCE_PAT, then runs:
  npx vsce publish --no-dependencies --allow-missing-repository

Required .env keys:
  VSCE_PERSONAL_ACCESS_TOKEN=your-marketplace-token
  VSCE_PUBLISHER=your-publisher-name

Examples:
  npm run publish:vsce:dry
  npm run publish:vsce
  npm run publish:vsce -- patch
  npm run publish:vsce -- --pre-release
`);
}

function loadDotenv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const parsed = parseDotenvLine(line);
    if (!parsed || process.env[parsed.key] !== undefined) {
      continue;
    }

    process.env[parsed.key] = parsed.value;
  }
}

function parseDotenvLine(line) {
  const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/);
  if (!match) {
    return undefined;
  }

  const key = match[1];
  const value = parseDotenvValue(match[2] ?? "");
  return { key, value };
}

function parseDotenvValue(rawValue) {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return "";
  }

  const quote = trimmed[0];
  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
    return trimmed.slice(1, -1);
  }

  return trimmed.replace(/\s+#.*$/, "");
}

function readPackageJson() {
  return JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"));
}

function readRequiredEnv(primaryName, fallbackName) {
  const rawValue = process.env[primaryName] || (fallbackName ? process.env[fallbackName] : undefined);
  const value = rawValue?.trim();
  if (!value) {
    const names = fallbackName ? `${primaryName} or ${fallbackName}` : primaryName;
    fail(`Missing required environment variable: ${names}`);
  }

  return value;
}

function getNpxCommand() {
  return process.platform === "win32" ? "npx.cmd" : "npx";
}

function fail(message) {
  console.error(`VSCE publish failed: ${message}`);
  process.exit(1);
}
