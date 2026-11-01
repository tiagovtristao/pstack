---
name: create-skill
description: Create or update a reusable agent skill, including its SKILL.md instructions, discovery description, and supporting resources. Use for skill authoring or correcting a skill that routes or behaves incorrectly.
---

Read the [host adapter](../../docs/harness/README.md) before following this workflow. Its tool, model, path, and permission mappings apply to the instructions below.

# Create a skill

Turn the user's requested workflow into a skill that another agent can use without this conversation. Preserve the requested scope and the host's permissions. Authoring a workflow does not authorise its future actions.

## Choose the scope and location

- Inspect an existing skill before editing it. Reuse a suitable skill rather than creating a competing entry point.
- For a new skill, identify the user goal, expected inputs, useful output, and conditions that should trigger it. Ask only for details that materially affect the result.
- Use the user's chosen location or the host's supported skill directory. Preserve an existing skill's location and name unless a move or rename is requested. Do not edit installed plugin caches.
- Use a lowercase name with hyphens. Match the folder name and frontmatter `name`.

## Write the skill

Each skill needs a `SKILL.md` with YAML frontmatter:

```yaml
---
name: example-skill
description: Explain the workflow and when an agent should use it.
---
```

Keep the description focused on discovery. Keep it one YAML scalar; quote text that YAML could interpret as syntax. Put detailed steps and examples in the body.

State the result the agent should produce, the decisions it must make, and constraints that change those decisions. Use a fixed sequence only where order matters. Avoid repeating general agent instructions or prescribing extra work unrelated to the user's goal.

Add resources only when the workflow needs them:

- `references/` for substantial guidance used in particular cases. Link each reference from the relevant step.
- `scripts/` for repeatable operations that benefit from deterministic execution. Document inputs, outputs, prerequisites, and failure behaviour.
- `assets/` for templates or files copied into an output.

Use relative paths inside the skill or package. Reference another skill only when it is available in the intended installation. Treat external tools as capabilities to check; state what remains incomplete when a required capability is absent.

## Preserve invocation policy

Preserve existing invocation policy when updating a skill. New skills use normal automatic discovery unless the user or requested workflow specifies explicit invocation. Express that choice using the current host adapter; a field from another host may have no effect. Preserve unrelated host metadata.

## Check the result

1. Use an available skill validator, or inspect the YAML, required fields, folder name, and referenced paths directly. Verify that bundled resources resolve after copying the package.
2. Run new or changed scripts on safe representative inputs. Do not claim executable helpers work from a prose review alone.
3. Exercise a representative request against the skill. For a discovery change, also check a nearby request that should not trigger it. Use a separate agent when available and useful; otherwise report the narrower check performed.
4. Revise demonstrated gaps. For subjective style skills, use the user's feedback rather than forcing a benchmark loop.

Report the changed files, checks performed, and remaining limits. Follow the user's existing rules for saving, committing, installing, or publishing the skill; none is implied by authoring it.
