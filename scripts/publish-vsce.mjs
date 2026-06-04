#!/usr/bin/env node
import "dotenv/config";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

const dryRun = args.includes("--dry-run");
const vsceArgs = args.filter((arg) => arg !== "--dry-run");
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
  console.log(`Command: npx vsce publish --no-dependencies ${vsceArgs.join(" ")}`.trim());
  console.log("Token: loaded from .env/environment and hidden");
  process.exit(0);
}

const result = spawnSync(getNpxCommand(), [
  "vsce",
  "publish",
  "--no-dependencies",
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

Loads .env with dotenv/config, validates VSCE_PUBLISHER against package.json, maps VSCE_PERSONAL_ACCESS_TOKEN to VSCE_PAT, then runs:
  npx vsce publish --no-dependencies

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
