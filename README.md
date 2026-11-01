# pstack

> **Fork notice:** This project is an independent fork of the [`pstack/` directory in `cursor/plugins`](https://github.com/cursor/plugins/tree/4dd1d05818d19792e7cd6e818f1667f95f7e1dbe/pstack) at commit [`4dd1d05818d19792e7cd6e818f1667f95f7e1dbe`](https://github.com/cursor/plugins/commit/4dd1d05818d19792e7cd6e818f1667f95f7e1dbe), adapted for Codex. Original author attribution and the MIT licence are preserved.

Portable engineering workflows derived from [Lauren Tan’s pstack](https://github.com/cursor/plugins/tree/main/pstack). The first adaptation targets Codex. Shared skills, principles, playbooks, references, and role prompts remain in `pstack/` so updates from upstream stay manageable.

## Install in Codex

Use Node.js 22 or later to generate the package from this checkout:

```sh
node scripts/generate-pstack-harness-trees.mjs
codex plugin marketplace add /absolute/path/to/pstack
codex plugin add pskills@pskills
```

Open a new Codex chat and select `setup-pstack` to configure model roles, or `poteto-mode` to start a task. Codex CLI supports `$setup-pstack` and `$poteto-mode`; use the skill selector to choose the pskills copy if another package provides the same name. The commands above require a Codex CLI with `plugin marketplace add` and `plugin add` support.

Clone this repository on another machine and use the same local-path commands to install it. Keep the whole generated plugin together; individual skill files depend on bundled references and sibling skills.

See the [Codex adapter](pstack/docs/harness/codex.md) for tool mappings, model setup, and capability limits. It reads model preferences explicitly from `${XDG_CONFIG_HOME:-$HOME/.config}/pskills/codex-models.md`. Missing roles inherit the current model. Setup does not change project instructions or Codex global model settings.

## Compatibility

- Codex installs `harness/pstack/codex/` as `pskills`. Upstream explicit-invocation policies are preserved.
- Cursor and Claude Code retain their upstream pstack packages. Their installation instructions remain in the [upstream guide](pstack/README.md).
- Native subagents, model choice, history, and automations depend on the host’s available tools. The adapter reports unavailable capabilities and leaves required verification gates pending.
- Cursor Automations, Bugbot, and `cursor-team-kit` are optional integrations. Installing pskills does not provide them.
- Workflow helpers can require Bun, Java, or other runtimes. Core installation needs no helper dependencies. Set them up only when the chosen workflow needs them, outside the installed plugin cache.

## Development

Edit `pstack/` and the generator. Do not edit generated files under `harness/pstack/` by hand.

```sh
node scripts/generate-pstack-harness-trees.mjs
node scripts/generate-pstack-harness-trees.mjs --check
node --test scripts/*.test.mjs
node scripts/check-pstack-docs.mjs
```

The generator preserves the existing Claude package and creates the Codex package from the same source. Tests check complete resources, invocation policy, package identity, executable permissions, and stale output. Installation and live agent behaviour need separate checks.

This checkout retains the upstream repository and its history. `upstream` points to `cursor/plugins`; `origin` is the `tiagovtristao/pstack` repository. Only the pskills entry is exposed through the Codex marketplace. Other upstream plugin directories remain for synchronisation.

## Attribution

pstack is by Lauren Tan and is distributed under the [MIT licence](pstack/LICENSE). Its licence and author attribution remain in each generated package. Other retained upstream plugins keep their own licences.
