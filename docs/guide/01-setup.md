# Set up pstack

Use the [host adapter](../harness/README.md) for tool names, model options, and paths in these examples. Cursor-only features require a supported equivalent in other hosts.

In this page you install the plugin, pick which models pstack uses, and run your first task. Setup is one command plus a short conversation.

## Install the plugin

Follow the [repository installation instructions](../../README.md#install) for Codex, Claude Code, or Cursor. The same shared skill tree is installed in each host. Use the [host adapter](../harness/README.md) for invocation syntax and available tools.

## Pick your models

Select [`setup-pstack`](../../skills/setup-pstack/SKILL.md). It detects the model and effort settings your host exposes, shows the role choices, and asks you to confirm them before saving preferences.

On Codex and Claude Code, unconfigured roles inherit the current model. If the host does not expose model selection, that is the available choice. Panel size still controls the number of reviewers; repeating one model does not create model diversity. A cross-family judge remains unavailable unless the host provides a suitable different family.

The adapter selects the preference file and reads it explicitly when choosing models. Codex uses `${XDG_CONFIG_HOME:-$HOME/.config}/pstack/codex-models.md`; Claude Code uses the corresponding `claude-code-models.md`. Cursor uses its native model rule. Setup does not change the project's instructions or the host's global model settings.

## Accept the verification offers, or don't

At the end of setup, `/setup-pstack` looks for a way to prove app behavior in your project, either a `verify-*` skill or an existing harness. If it finds neither, it offers once to generate one with [`/create-verification-skill`](../../skills/create-verification-skill/SKILL.md).

Say yes and it writes a `verify-<app>` skill in the host's project skill directory, a project-local workflow that teaches agents to drive your app the way a user does. It proves the skill works once before handing it over. Say no and setup moves on. You can run `/create-verification-skill` yourself any time. [Verify and ship](./06-verify-and-ship.md#create-a-project-verification-skill) covers it in depth.

If you're new to pstack, say yes. An agent that can check its own work keeps going until the check passes. An agent that can't hands every result back to you to check by hand. Of everything in this guide, the verification skill pays off the most.

Then setup offers once to generate a formal verification skill with [`/create-formal-verification-skill`](../../skills/create-formal-verification-skill/SKILL.md), unless the project already has one. Tests check the cases someone thought to write. A formal verification skill checks one key property of your code, such as "a job never runs twice at once", in every case within a stated scope. Say yes when your code has concurrency, retries, a state machine, or a parser, where a bug is costly and tests rarely reach the case that breaks. Otherwise say no, and run it later if that changes. [Verify and ship](./06-verify-and-ship.md#prove-a-property-with-a-formal-verification-skill) covers it.

After installation, start a new chat so the host discovers the package. The adapter reads saved model preferences when choosing delegates.

## Keep the cost in check

pstack spends extra tokens on subagents and review panels. That's the price of the rigor. To spend fewer:

- Rerun `/setup-pstack` and pick a smaller reasoning budget or cheaper models. A strong model in the main chat with cheaper, faster models in the code roles is a good split.
- Set a role to `auto` or `inherit-parent` so it runs on the chat's own model.
- Shorten a panel list. Each entry runs one subagent.
- Save `/poteto-mode` for work that needs rigor. A small, obvious edit doesn't.

## Run your first task

Pick something real but small, and describe it the way you'd describe it to a colleague:

```text
/poteto-mode add a --json flag to this command. text output stays byte-identical. verify both.
```

Watch the todo list. Its first items are the matched playbook's steps copied in, the Feature playbook for this prompt. If `/poteto-mode` skips a step, the step stays in the list with `skip: <reason>`, so you can see what it chose not to do.

From here you can type normal follow-ups. In Cursor, to keep `/poteto-mode` on for the whole chat, pick it from the `/` menu with Option+Enter (Mac) or Alt+Enter (Windows) instead of Enter. That makes it a [Custom Mode](https://cursor.com/docs/skills#using-a-skill-as-a-custom-mode), which stays in context on every turn until you exit it. Custom Modes are available in the Agents Window and the CLI. Plain Enter attaches the skill to one message, and it fades as the chat moves on.

Next: [Route work through `/poteto-mode`](./02-poteto-mode.md).
