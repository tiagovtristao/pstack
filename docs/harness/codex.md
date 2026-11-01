# pstack in Codex

Read this adapter before following a bundled skill or agent role. It adapts the Cursor names in pstack to the tools available in the current Codex session. These mappings replace the host-specific instructions in the shared files. They do not grant permission to commit, publish, install dependencies, change settings, or contact external services.

`<plugin>` is the installed package containing the selected skill, `skills/`, `agents/`, and `docs/`. Resolve it from the skill path supplied by Codex. Keep all references inside that same package. Do not scan plugin caches for the newest version or select a different installation.

## Tools and skill routing

- `Task`: use the session's native subagent tools, such as `spawn_agent`, plus their message and wait tools. Read their schemas before choosing fields. Do not send Cursor fields to them. If delegation is unavailable, do work sequentially only where the task permits it, and report that independent or parallel work did not run.
- `AskQuestion`: use an available question tool when its mode and purpose permit it. Otherwise ask in chat. A pending question is not an answer or approval.
- Open a todolist: use the session's planning tool if available. Otherwise maintain a short checklist in the conversation, including incomplete verification steps.
- Run another pstack skill (`/name` or "the **name** skill"): read `<plugin>/skills/<name>/SKILL.md` and its required references. Use the installed skill selector when telling the user how to invoke it. Codex CLI supports `$name`; other clients can present a different selector. Preserve the source skill names, such as `setup-pstack` and `poteto-mode`, inside the `pstack` package.
- `create-skill`: read the bundled `<plugin>/skills/create-skill/SKILL.md`. Host authoring tools are optional helpers.
- `Read`, `Grep`, and `Glob`: use available file tools or the terminal. Prefer `rg` and `rg --files` for searches.

## Delegates and isolation

The Markdown files in `agents/` are role prompts. Their presence does not register native Codex agent types.

- `generalPurpose`: use a native general agent type only if the tool schema supports it. Otherwise omit the type and provide the task in the brief.
- `poteto-agent`: tell the delegate to read this adapter, `<plugin>/agents/poteto-agent.md`, and `<plugin>/skills/poteto-mode/SKILL.md` before working. Pass all three as absolute paths.
- `comment-sicko`: provide this adapter and `<plugin>/agents/comment-sicko.md`, the exact review scope, and a read-only brief. Do not use an invented `subagent_type` value.
- `readonly: true`: use enforced read-only permissions if the host offers them. Also state "do not edit files" in the brief. A prompt is not a sandbox; verify the scoped working tree after the review. `readonly: false` does not expand the session's permissions.
- `environment: "cloud"`: use a remote worker only when the host actually provides one. A local worktree isolates Git changes, not processes, credentials, or the machine. Use local delegation with separate output paths when the task needs only independent context or Git changes, and disclose the change. If remote isolation is required, leave that step pending. `environment: "local"` means the current execution environment; omit unsupported fields.
- `cloud_base_branch`: give the worker an exact base branch or commit and its own workspace. Do not switch a shared checkout underneath other workers.
- `run_in_background: true`: follow the native tool's lifecycle and wait for terminal results. Omit this field when the tool does not accept it.
- `resume`: use the host's supported follow-up mechanism only when the workflow needs the existing agent's state. Otherwise create a fresh delegate with a complete brief. A new agent with a summary is not a resumed session.
- `file_attachments`: provide absolute paths accessible to the worker. If the worker cannot access those files, transfer only the scoped material using a supported mechanism.

Each delegate needs the goal, scope, exact output location, verification method, and reporting contract. Pass this adapter and the selected role preferences to every delegate. Respect the host's context-sharing and model-override restrictions. For example, a host may permit a model override only with a fresh context. Do not weaken an independent review by exposing the author's conclusions to its reviewer.

## Models and setup-pstack

Read `${XDG_CONFIG_HOME:-$HOME/.config}/pstack/codex-models.md` before choosing a delegate's model. This file is not an always-applied rule; Codex does not load it automatically. It replaces `~/.cursor/rules/pstack-models.mdc`. A missing role defaults to `inherit-parent`, including roles whose shared skills specify a Cursor model.

- `auto` and `inherit-parent`: omit model and effort overrides so the host inherits its defaults. Do not claim that this selects a separate Auto service.
- `claude-*`, `grok-*`, and `gpt-*`: treat each as an identifier, not as proof of availability. Use only model IDs and effort values exposed by the current host. Do not translate model-family names or append Cursor effort and speed suffixes to Codex IDs.
- Store an explicit choice as `<model> <effort>` when both are supported, or `<model>` when effort is not configurable. Pass model and effort through their separate native fields. Do not infer an ID's family by arbitrary string splitting.
- If a saved choice is no longer supported, report it. Use `inherit-parent` only where the task permits the change. Leave a required capability pending rather than repeatedly trying guessed IDs.
- Repeated `inherit-parent` entries can preserve a panel's seat count. They do not provide model diversity. A cross-family judge requires a confirmed parent family and an available different family. If either is unknown or unavailable, report that cross-family judging did not run. Do not count a self-review or same-family review as that gate.

For `setup-pstack`, replace its Cursor-specific steps as follows:

1. Detect the native model and effort options. When the host exposes neither, offer `inherit-parent` without inventing a model list.
2. Read the preferences file above. Keep the source skill's role labels and comma-separated panel lists. On first setup, replace each model default with `inherit-parent`; preserve panel seat counts. Mark the `arena cross-judge pool` unavailable until it contains a confirmed different-family choice.
3. Offer reasoning budgets only through supported effort settings. Show the selected model and effort for each role. If the host does not expose an inherited value, label it inherited and unknown. An inherited role keeps its inherited effort. Explain any unavailable judging capability before the user confirms the choices.
4. After confirmation, create the preferences directory and write the role lines with a `# budget` comment and no Cursor frontmatter. Validate explicit model and effort choices against the current host first. Keep unrelated preferences intact.
5. Confirm the file path and that this adapter reads it on later uses. Do not write `.cursor/rules/`, `AGENTS.md`, `CLAUDE.md`, or Codex `config.toml` as part of this setup.

## Authoring skills

When a workflow such as `automate-me` creates or updates a skill for Codex, translate `disable-model-invocation: true` into a sibling `agents/openai.yaml` file with `policy.allow_implicit_invocation: false`. Cursor frontmatter alone does not express this policy in Codex. Preserve existing interface and dependency metadata. Keep automatic discovery enabled when the source workflow or user has not requested explicit invocation. Bundled skills include this metadata. Keep it in sync when changing invocation policy; new user-authored skills need the metadata at their destination.

## Paths and history

- `.cursor/skills/` and `~/.cursor/skills/`: use Codex's available skill paths. For local skill authoring, Codex supports project `.agents/skills/` and user `~/.agents/skills/`. Bundled references stay relative to `<plugin>`.
- `.cursor/rules/` and always-applied rules: follow the project's existing instructions. Do not create a replacement global policy file. Only model preferences use the path defined above.
- Upstream links such as `https://github.com/cursor/plugins/blob/main/pstack/<path>`: read `<plugin>/<path>` when it is bundled. Use the upstream URL as attribution, not as a replacement for the installed version.
- `agent-transcripts` and `~/.cursor/projects/`: use supported Codex history tools for the relevant chat or a transcript the user supplied. Do not guess cache paths, search unrelated chats, or treat the newest file as the current conversation. Scripts that parse Cursor transcript formats cannot be reused against Codex logs unchanged.

## Cursor-only features and optional tools

Check the capability before starting a step that needs it. Omit an optional integration with a short explanation. If a missing feature supplies required evidence, isolation, or verification, keep the dependent steps pending and report the missing capability.

- Cursor Automations, routine `update_state`, `SendToUser`, and Cursor webhook endpoints: these are not Codex tool names. Use a native automation facility only when it supports the requested behaviour and the user authorised that automation.
- Bugbot: existing GitHub comments can be reviewed through the available forge tools. Starting or waiting for a Bugbot run requires that integration to exist on the repository.
- A built-in PR tool: use an available forge integration or CLI, such as `gh`, within the user's publishing permissions.
- `deslop`, `control-cli`, and `control-ui`: these skills are bundled at `<plugin>/skills/<name>/SKILL.md`. Their execution tools depend on the current environment; an unavailable required verification tool leaves its check pending.
- Bun helpers, formal-verification tools, browser tools, and other runtimes: they are optional until a selected workflow needs them. Check prerequisites at that point and obtain any required installation approval. Do not bootstrap dependencies or write runtime state inside the installed plugin cache. Run helpers that need writable dependencies from a separate task workspace.
