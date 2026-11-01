# Host adapters

Read this file before following a pstack skill or agent role. Use the adapter for the current host. The adapter replaces host-specific tool names, paths, model defaults, and capability assumptions in the shared workflows.

- In Codex, read [the Codex adapter](codex.md).
- In Claude Code, read [the Claude Code adapter](claude-code.md).
- In Cursor, use the native tools described by the workflow only when their current schemas support them. The shared rules below still apply.
- In another host, use the portable mappings below. Do not imitate unavailable tool names.

Resolve the package root from the selected skill's path. Read sibling skills from that same package. Agent files under `agents/` are role prompts; installing the files does not register custom agent types in every host.

## Shared rules

The user's scope and the host's permission policy control external actions, dependency installation, publishing, and destructive work. A skill's autonomy instructions do not grant permission.

`deslop`, `control-cli`, `control-ui`, and `create-skill` are bundled skills. Read them from `skills/<name>/SKILL.md`. They do not require another plugin. Use an optional visualisation tool when it is available; otherwise use Mermaid, a local chart, or plain text that communicates the same evidence.

Use native, fresh delegates for independent review. An upstream preference for cloud workers does not require a remote machine when a task only needs separate context or a Git worktree. State which isolation you used. A worktree does not isolate processes or credentials. Keep a step pending if the task actually requires remote isolation and the host cannot provide it.

Keep evidence requirements intact. An unavailable optional integration can be omitted with a brief explanation. An unavailable required test, independent review, or isolation boundary remains incomplete; it cannot produce a passing result. Multiple reviewers using one model family do not provide cross-family judging.

Cursor Automations, routine webhooks, cloud dashboards, and the Benny automation examples require their own platform support. A plugin installation does not create those capabilities. Use a host equivalent only when it provides the requested behaviour and the user authorised the action.

## Portable mappings

- `Task`: use the host's subagent tools and lifecycle. Give each worker the task, scope, package paths, and verification requirements. Pass only fields its schema accepts. If no delegation is available, do work sequentially only when independence is not required.
- `AskQuestion`: use an available question tool or ask in the conversation. Respect any mode restrictions.
- `Read`, `Grep`, `Glob`, and shell tools: use the host's file and execution tools. Resolve paths from the current project and installed package.
- Todo lists: use native planning tools or a short checklist with incomplete steps retained.
- Models: inherit the current model unless the user has selected an available model for the role. Use only model and effort settings the host exposes. Do not translate Cursor model slugs by guessing.
- Skill authoring: follow the bundled `create-skill` workflow and the host's supported discovery location. Preserve explicit-invocation policies using host metadata.
- History: use supported conversation tools or user-supplied transcripts. Do not guess cache paths or parse another host's transcript format.
- PRs and checks: use an available forge CLI or integration within the user's permissions. A built-in PR tool is not required.

Runtime helpers can require Bun, Java, a browser, or other tools. Check those requirements only when a selected workflow uses the helper. Use existing tools first; install dependencies only with the required permission and keep writable runtime state outside installed plugin caches.
