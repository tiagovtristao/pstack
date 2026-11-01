# pstack in Claude Code

Apply the [shared host rules](README.md) and the mappings below before following a skill. Resolve `<plugin>` from the selected skill path. Use only tools, agent types, models, and fields exposed by this session.

## Tools and roles

- `Task`: use the available native delegation tool, such as `Agent`. Match its current schema; do not forward Cursor-only fields.
- `AskQuestion`: use the available question tool, such as `AskUserQuestion`. If the current mode has no question tool, ask in the conversation.
- Todo lists: use the native planning tool when present, or a short checklist that retains incomplete steps.
- Run another skill: read `<plugin>/skills/<name>/SKILL.md` and its references. Use the installed selector when telling the user how to invoke it. Claude Code plugin commands normally use the `pstack:` namespace.
- `Read`, `Grep`, and `Glob`: use native file tools or the terminal.
- `poteto-agent` and `comment-sicko`: use a registered plugin agent type only if it is available. Otherwise provide the corresponding file from `<plugin>/agents/` as a role prompt to a native agent. Pass the shared host router and the absolute skill paths as well.
- `readonly: true`: request native read-only permissions when available and state the read-only scope in the brief. A prompt alone is not enforcement. Inspect the scoped working tree afterward.
- `environment: "cloud"`: follow the shared isolation rule. A local worktree can separate Git changes when that is sufficient; it does not provide remote isolation. Omit unsupported fields and disclose the actual boundary.
- `cloud_base_branch`: pass the exact base branch or commit and a separate working location. Do not change a shared checkout underneath another worker.
- `run_in_background`, `resume`, and `file_attachments`: use the native lifecycle and fields. A fresh agent with a summary is not the same session; a path must be accessible to its worker.

## Models and setup-pstack

Read `${XDG_CONFIG_HOME:-$HOME/.config}/pstack/claude-code-models.md` before selecting a delegate model. This is an explicitly read preference file, not an automatically loaded global rule. Missing roles inherit the current model.

For `setup-pstack`, keep the source skill's role labels and panel sizes, but replace model defaults with `inherit-parent`. Show only models and effort settings exposed by the current host. Store explicit choices as `<model> <effort>` when both are supported, or `<model>` otherwise. An inherited value keeps the host default. Do not convert a Cursor model slug by guessing its Claude equivalent.

After the user confirms the choices, write the role lines and a `# budget` comment to that preference file. Preserve unrelated preferences. Do not change `CLAUDE.md`, `AGENTS.md`, or global model settings. A cross-family judge requires a confirmed available different family; inherited or same-family reviewers do not satisfy it.

## Paths and optional features

Use the current host's supported skill directories when authoring skills. Existing `.claude/skills/` and `~/.claude/skills/` installations can be used when those are the configured locations. Bundled resources remain relative to `<plugin>`.

Use a supported conversation-history interface or a transcript supplied for this task. Do not guess cache paths or select a conversation by its file timestamp. A script that parses Cursor transcripts needs adaptation before it can consume another format.

The bundled `deslop`, `control-cli`, `control-ui`, and `create-skill` workflows do not require another plugin. Their execution tools must still be present. Use the available forge tools for PRs. Existing Bugbot comments can be reviewed as ordinary PR comments; triggering Bugbot needs that integration.

Cursor Automations, cloud dashboards, routine webhooks, and secret-request cards are not provided by this package. Omit an optional integration with a short explanation. Keep dependent steps pending when a missing capability provides required evidence or isolation.
