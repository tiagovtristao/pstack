# pstack harness tree

This folder is generated from `pstack/skills`, `pstack/agents`, `pstack/docs/guide`, `pstack/docs/harness`, `pstack/README.md`, `pstack/LICENSE`, and `pstack/plugin.json`. Do not edit it by hand.

Cursor uses `pstack/` directly. Claude Code installs `claude-code/` as pstack, and Codex installs `codex/` as pskills. Each package includes its host adapter and the shared workflow resources. The packages leave out Cursor automations and visual assets. Links to omitted source files point to upstream GitHub instead.

After editing those sources, run `node scripts/generate-pstack-harness-trees.mjs` from the repository root and commit the result.
