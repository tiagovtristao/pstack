import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GENERATOR = "scripts/generate-pstack-harness-trees.mjs";
const OUTPUT = "harness/pstack";
const CODEX = OUTPUT + "/codex";
const CLAUDE = OUTPUT + "/claude-code";

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  }).sort();
}

function inventory(directory) {
  return files(directory).map((path) => ({
    path: relative(directory, path),
    digest: createHash("sha256").update(readFileSync(path)).digest("hex"),
    executable: Boolean(statSync(path).mode & 0o111),
  }));
}

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), "pskills-package-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  cpSync(join(ROOT, "pstack"), join(directory, "pstack"), {
    recursive: true,
    filter: (path) => !["node_modules", ".DS_Store"].includes(basename(path)),
  });
  mkdirSync(join(directory, "scripts"));
  cpSync(join(ROOT, GENERATOR), join(directory, GENERATOR));
  const marketplace = ".agents/plugins/marketplace.json";
  if (existsSync(join(ROOT, marketplace))) {
    mkdirSync(dirname(join(directory, marketplace)), { recursive: true });
    cpSync(join(ROOT, marketplace), join(directory, marketplace));
  }
  return directory;
}

function run(directory, ...args) {
  return spawnSync(process.execPath, [join(directory, GENERATOR), ...args], {
    cwd: directory,
    encoding: "utf8",
    timeout: 30_000,
  });
}

function generate(directory) {
  const result = run(directory);
  assert.equal(result.status, 0, result.stderr + result.stdout);
}

function assertAdapterLink(path, packageRoot, host = "codex") {
  const body = readFileSync(path, "utf8");
  const links = [...body.matchAll(/\]\(([^)\s]+)\)/g)].map((match) => match[1]);
  const adapter = join(packageRoot, "docs/harness", host + ".md");
  assert.ok(links.some((link) => resolve(dirname(path), link) === adapter), relative(packageRoot, path) + " must route to its packaged host adapter");
  assert.ok(existsSync(adapter));
}

test("Codex package installs independently with its resources, licence and marketplace identity", (t) => {
  const directory = fixture(t);
  generate(directory);
  const installed = join(directory, "installed-plugin");
  cpSync(join(directory, CODEX), installed, { recursive: true });
  const manifest = JSON.parse(readFileSync(join(installed, "plugin.json"), "utf8"));
  const marketplace = JSON.parse(readFileSync(join(directory, ".agents/plugins/marketplace.json"), "utf8"));
  const entry = marketplace.plugins.find((plugin) => plugin.name === manifest.name);
  assert.ok(entry, "marketplace must expose the generated plugin");
  assert.equal(manifest.name, "pskills");
  assert.equal(entry.source.source, "local");
  assert.equal(resolve(directory, entry.source.path), join(directory, CODEX));
  assert.equal(entry.policy.installation, "AVAILABLE");
  assert.equal(entry.policy.authentication, "ON_INSTALL");
  assert.ok(entry.category);
  assert.deepEqual(readFileSync(join(installed, "LICENSE")), readFileSync(join(directory, "pstack/LICENSE")));

  for (const resourceRoot of ["skills", "agents", "docs/guide"]) {
    const sourceRoot = join(directory, "pstack", resourceRoot);
    for (const source of files(sourceRoot)) {
      const path = relative(join(directory, "pstack"), source);
      const bundled = join(installed, path);
      assert.ok(existsSync(bundled), "missing packaged resource: " + path);
      assert.equal(Boolean(statSync(bundled).mode & 0o111), Boolean(statSync(source).mode & 0o111), "executable permission: " + path);
      if (!source.endsWith(".md")) {
        assert.deepEqual(readFileSync(bundled), readFileSync(source), "resource bytes changed: " + path);
      }
    }
  }
});

test("every Codex entry point loads its adapter and retains explicit invocation policy", (t) => {
  const directory = fixture(t);
  generate(directory);
  const packageRoot = join(directory, CODEX);
  const sourceSkills = join(directory, "pstack/skills");
  for (const name of readdirSync(sourceSkills)) {
    const source = join(sourceSkills, name, "SKILL.md");
    if (!existsSync(source)) continue;
    const bundled = join(packageRoot, "skills", name, "SKILL.md");
    assertAdapterLink(bundled, packageRoot);
    const frontmatter = readFileSync(source, "utf8").match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
    const explicitOnly = /^disable-model-invocation:\s*true\s*$/m.test(frontmatter);
    const policyPath = join(packageRoot, "skills", name, "agents/openai.yaml");
    if (explicitOnly) assert.ok(existsSync(policyPath), name + " needs its explicit invocation policy");
    if (existsSync(policyPath)) {
      const policy = readFileSync(policyPath, "utf8");
      assert.equal(/^\s+allow_implicit_invocation:\s*false\s*$/m.test(policy), explicitOnly, "invocation policy changed for " + name);
    }
  }
  for (const path of files(join(packageRoot, "agents")).filter((path) => path.endsWith(".md"))) {
    assertAdapterLink(path, packageRoot);
  }
});

test("generation is deterministic, leaves source untouched and retains Claude package identity", (t) => {
  const directory = fixture(t);
  const sourceBefore = inventory(join(directory, "pstack"));
  generate(directory);
  const first = inventory(join(directory, OUTPUT));
  generate(directory);
  assert.deepEqual(inventory(join(directory, OUTPUT)), first);
  assert.deepEqual(inventory(join(directory, "pstack")), sourceBefore);
  const check = run(directory, "--check");
  assert.equal(check.status, 0, check.stderr + check.stdout);

  const sourceManifest = JSON.parse(readFileSync(join(directory, "pstack/plugin.json"), "utf8"));
  const claudeRoot = join(directory, CLAUDE);
  for (const manifest of ["plugin.json", ".claude-plugin/plugin.json"]) {
    const generated = JSON.parse(readFileSync(join(claudeRoot, manifest), "utf8"));
    assert.equal(generated.name, sourceManifest.name);
    assert.equal(generated.version, sourceManifest.version);
  }
  assertAdapterLink(join(claudeRoot, "skills/setup-pstack/SKILL.md"), claudeRoot, "claude-code");
});

test("--check rejects changed, missing and extra output without rewriting it", (t) => {
  const directory = fixture(t);
  generate(directory);
  const mutations = [
    () => writeFileSync(join(directory, CODEX, "plugin.json"), "{}\n"),
    () => unlinkSync(join(directory, CODEX, "LICENSE")),
    () => writeFileSync(join(directory, CODEX, "unexpected.txt"), "untracked output\n"),
    () => chmodSync(join(directory, CODEX, "plugin.json"), 0o755),
  ];
  for (const mutate of mutations) {
    mutate();
    const before = inventory(join(directory, OUTPUT));
    const result = run(directory, "--check");
    assert.equal(result.status, 1, result.stderr + result.stdout);
    assert.deepEqual(inventory(join(directory, OUTPUT)), before, "--check must leave output untouched");
    generate(directory);
  }
});
