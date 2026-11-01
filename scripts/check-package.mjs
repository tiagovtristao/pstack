#!/usr/bin/env node

// Check the installable package without downloading tools or changing files.
// Run after editing manifests, skills, adapters, or their bundled resources.
// Usage: node scripts/check-package.mjs [package-root]

import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const MANIFESTS = ["plugin.json", ".cursor-plugin/plugin.json", ".claude-plugin/plugin.json"];
const CATALOGS = [".agents/plugins/marketplace.json", ".cursor-plugin/marketplace.json", ".claude-plugin/marketplace.json"];
const ROUTER = "docs/harness/README.md";
const IGNORED = new Set([".git", "node_modules", ".DS_Store"]);

function inside(root, path) {
  const part = relative(root, path);
  return part !== ".." && !part.startsWith("../") && !part.startsWith("..\\") && !isAbsolute(part);
}

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (IGNORED.has(entry.name)) return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

function prose(text) {
  let fence;
  return text.split("\n").filter((line) => {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = undefined;
      return false;
    }
    return !fence;
  }).join("\n").replace(/(`+)[\s\S]*?\1/g, "");
}

function links(text) {
  const body = prose(text);
  return [
    ...body.matchAll(/\]\(\s*(?:<([^>\n]+)>|([^\s)]+))(?:\s+["'][^\n]*?["'])?\s*\)/g),
    ...body.matchAll(/^\s{0,3}\[[^\]\n]+\]:\s*(?:<([^>\n]+)>|(\S+))/gm),
  ].map((match) => match[1] ?? match[2]);
}

/** Return package errors. This function does not write or resolve remote URLs. */
export function checkPackage(packageRoot) {
  let root;
  try { root = realpathSync(packageRoot); }
  catch { return [`${packageRoot}: package directory does not exist`]; }
  if (!statSync(root).isDirectory()) return [`${packageRoot}: package root must be a directory`];
  const packagePath = (path) => relative(root, path).split(sep).join("/");
  const errors = [];
  const fail = (path, message) => errors.push(`${path}: ${message}`);
  const read = (path) => {
    try { return readFileSync(join(root, path), "utf8"); }
    catch { fail(path, "missing or unreadable file"); return ""; }
  };
  const json = (path) => {
    try { return JSON.parse(read(path)); }
    catch { fail(path, "invalid JSON"); return {}; }
  };
  const manifests = MANIFESTS.map((path) => [path, json(path)]);
  const manifest = manifests[0][1];
  for (const [path, value] of manifests) {
    for (const field of ["name", "version"]) {
      if (typeof value[field] !== "string" || !value[field] || value[field] !== manifest[field]) {
        fail(path, `${field} must match the root plugin manifest`);
      }
    }
  }
  for (const path of CATALOGS) {
    const catalog = json(path);
    if (!Array.isArray(catalog.plugins) || catalog.plugins.length !== 1) {
      fail(path, "marketplace must expose only this package");
      continue;
    }
    const entry = catalog.plugins[0];
    const source = typeof entry.source === "string" ? entry.source : entry.source?.path;
    if (entry.name !== manifest.name) fail(path, "plugin name must match the root manifest");
    if (typeof entry.source === "object" && entry.source?.source !== "local") fail(path, "plugin source must be local");
    if (typeof source !== "string" || !source.startsWith("./") || resolve(root, source) !== root) {
      fail(path, "plugin source must point to this package root");
    }
  }
  for (const path of ["LICENSE", "THIRD_PARTY_NOTICES.md", ROUTER, "docs/harness/codex.md", "docs/harness/claude-code.md"]) {
    if (!read(path).trim()) fail(path, "required package file is empty");
  }

  const localTarget = (path, href) => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//")) return;
    let target;
    try { target = decodeURIComponent(href.split(/[?#]/)[0]); }
    catch { fail(path, `invalid link ${href}`); return; }
    if (!target) return;
    const absolute = resolve(dirname(join(root, path)), target);
    if (!inside(root, absolute)) fail(path, `reference leaves the package: ${href}`);
    else if (!existsSync(absolute)) fail(path, `missing bundled resource: ${href}`);
    else if (!inside(root, realpathSync(absolute))) fail(path, `reference resolves outside the package: ${href}`);
    return absolute;
  };
  const router = join(root, ROUTER);
  const allFiles = files(root);
  for (const absolute of allFiles) {
    const path = packagePath(absolute);
    if (lstatSync(absolute).isSymbolicLink()) {
      if (!existsSync(absolute) || !inside(root, realpathSync(absolute))) fail(path, "symlink must resolve inside the package");
      continue;
    }
    if (path.endsWith(".md")) {
      const targets = links(read(path)).map((href) => localTarget(path, href));
      if ((/^skills\/[^/]+\/SKILL\.md$/.test(path) || /^agents\/[^/]+\.md$/.test(path)) && !targets.includes(router)) {
        fail(path, "entry point must link to the packaged host adapter router");
      }
    }
    if (/\.[cm]?[jt]s$/.test(path)) {
      for (const match of read(path).matchAll(/(?:from\s+|import\s+|import\s*\(|require\s*\()\s*["'](\.[^"']+)["']/g)) localTarget(path, match[1]);
    }
  }
  const skills = allFiles.filter((path) => /^skills\/[^/]+\/SKILL\.md$/.test(packagePath(path)));
  if (!skills.length) fail("skills/", "package has no skills");
  for (const absolute of skills) {
    const path = packagePath(absolute);
    const body = read(path);
    const frontmatter = body.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] ?? "";
    const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1].trim().replace(/^(["'])(.*)\1$/, "$2");
    if (name !== path.split("/")[1]) fail(path, "skill name must match its directory");
    if (!/^description:\s*\S/m.test(frontmatter)) fail(path, "skill needs a description");
    const explicit = /^disable-model-invocation:\s*true\s*$/m.test(frontmatter);
    const policyPath = join(dirname(path), "agents/openai.yaml");
    const policy = existsSync(join(root, policyPath)) ? read(policyPath) : "";
    const explicitInCodex = /^\s+allow_implicit_invocation:\s*false\s*$/m.test(policy);
    if (explicit !== explicitInCodex) fail(policyPath, "Codex invocation policy must match the skill's explicit-invocation setting");
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log("Usage: node scripts/check-package.mjs [package-root]\n\nCheck manifests, local references, adapter routing and invocation policies.\nExamples:\n  node scripts/check-package.mjs\n  node scripts/check-package.mjs /tmp/installed-pstack");
  } else if (args.length > 1 || args.some((arg) => arg.startsWith("-"))) {
    console.error("Unknown argument. Run node scripts/check-package.mjs --help.");
    process.exitCode = 1;
  } else {
    const root = args[0] ?? resolve(dirname(fileURLToPath(import.meta.url)), "..");
    const errors = checkPackage(root);
    for (const error of errors) console.error(error);
    console.log(errors.length ? `${errors.length} package error(s)` : "Package checks passed.");
    process.exitCode = errors.length ? 1 : 0;
  }
}
