import assert from "node:assert/strict";
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { checkPackage } from "./check-package.mjs";

function write(root, path, text) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
}

function fixture(t) {
  const sandbox = mkdtempSync(join(tmpdir(), "pstack-package-"));
  t.after(() => rmSync(sandbox, { recursive: true, force: true }));
  const root = join(sandbox, "source");
  const manifest = { name: "pstack", version: "0.2.0", description: "Test package" };
  for (const path of ["plugin.json", ".cursor-plugin/plugin.json", ".claude-plugin/plugin.json"]) write(root, path, JSON.stringify(manifest));
  for (const path of [".agents/plugins/marketplace.json", ".cursor-plugin/marketplace.json", ".claude-plugin/marketplace.json"]) {
    write(root, path, JSON.stringify({ name: "pstack", plugins: [{ name: "pstack", source: { source: "local", path: "./" } }] }));
  }
  write(root, "LICENSE", "Test licence\n");
  write(root, "THIRD_PARTY_NOTICES.md", "Test attribution\n");
  write(root, "docs/harness/README.md", "# Host adapters\n\n[Codex](codex.md), [Claude](claude-code.md)\n");
  write(root, "docs/harness/codex.md", "# Codex\n");
  write(root, "docs/harness/claude-code.md", "# Claude\n");
  write(root, "skills/review/SKILL.md", "---\nname: review\ndescription: Review the current change.\ndisable-model-invocation: true\n---\n\n[Host adapter](../../docs/harness/README.md)\n\nRead [the checklist](references/checklist.md).\n");
  write(root, "skills/review/references/checklist.md", "Check behaviour.\n");
  write(root, "skills/review/agents/openai.yaml", "policy:\n  allow_implicit_invocation: false\n");
  write(root, "skills/review/scripts/probe.sh", "#!/bin/sh\nexit 0\n");
  chmodSync(join(root, "skills/review/scripts/probe.sh"), 0o755);
  write(root, "agents/reviewer.md", "# Reviewer\n\n[Host adapter](../docs/harness/README.md)\n");
  return { root, sandbox };
}

function errorsAt(root, path) {
  return checkPackage(root).filter((error) => error.startsWith(path + ":"));
}

test("a copied package keeps its resources and can be checked without the source checkout", (t) => {
  const { root, sandbox } = fixture(t);
  const installed = join(sandbox, "installed");
  cpSync(root, installed, { recursive: true });
  rmSync(root, { recursive: true });
  write(installed, "README.md", "# Usage\n\nExample: `[label](not-a-file.md)`.\n\n```md\n[example](also-not-a-file.md)\n```\n");
  const before = readFileSync(join(installed, "skills/review/SKILL.md"));
  assert.deepEqual(checkPackage(installed), []);
  assert.deepEqual(readFileSync(join(installed, "skills/review/SKILL.md")), before);
  assert.ok(statSync(join(installed, "skills/review/scripts/probe.sh")).mode & 0o111);
});

test("host identities and marketplace sources must describe the same standalone package", (t) => {
  const { root } = fixture(t);
  write(root, ".claude-plugin/plugin.json", JSON.stringify({ name: "another-plugin", version: "9.0.0" }));
  write(root, ".agents/plugins/marketplace.json", JSON.stringify({ name: "pstack", plugins: [{ name: "pstack", source: "../sibling" }] }));
  write(root, ".cursor-plugin/marketplace.json", JSON.stringify({ name: "pstack", plugins: [{ name: "pstack", source: "./" }, { name: "unrelated", source: "./other" }] }));
  assert.ok(errorsAt(root, ".claude-plugin/plugin.json").length);
  assert.ok(errorsAt(root, ".agents/plugins/marketplace.json").length);
  assert.ok(errorsAt(root, ".cursor-plugin/marketplace.json").length);
});

test("entry points preserve host routing, skill identity and explicit invocation policy", (t) => {
  const { root } = fixture(t);
  const path = "skills/review/SKILL.md";
  write(root, path, readFileSync(join(root, path), "utf8").replace("name: review", "name: wrong").replace("[Host adapter](../../docs/harness/README.md)", ""));
  write(root, "agents/reviewer.md", "# Reviewer\n");
  write(root, "skills/review/agents/openai.yaml", "policy:\n  allow_implicit_invocation: true\n");
  assert.ok(errorsAt(root, path).some((error) => error.includes("skill name")));
  assert.ok(errorsAt(root, path).some((error) => error.includes("entry point")));
  assert.ok(errorsAt(root, "agents/reviewer.md").length);
  assert.ok(errorsAt(root, "skills/review/agents/openai.yaml").length);
});

test("missing resources and references outside the installed package are rejected", (t) => {
  const { root, sandbox } = fixture(t);
  unlinkSync(join(root, "skills/review/references/checklist.md"));
  write(sandbox, "outside.md", "Not bundled\n");
  write(root, "README.md", "[Outside](../outside.md)\n\n[Through symlink](outside-link.md)\n");
  symlinkSync("../outside.md", join(root, "outside-link.md"));
  assert.ok(errorsAt(root, "skills/review/SKILL.md").length);
  assert.ok(errorsAt(root, "README.md").some((error) => error.includes("../outside.md")));
  assert.ok(errorsAt(root, "README.md").some((error) => error.includes("outside-link.md")));
  assert.ok(errorsAt(root, "outside-link.md").length);
});
