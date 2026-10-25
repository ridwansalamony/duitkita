# Project instructions

## Frontend design rules

The complete frontend design rules for this project are maintained in
[SKILL.md](SKILL.md), relative to this file. Treat that file as the source of
truth for the design workflow; do not replace it with a summary.

Before planning, implementing, reviewing, or redesigning a landing page,
portfolio, marketing site, or editorial page, read the entire `SKILL.md`,
including its appendices. If a tool truncates the output, read it in smaller
chunks until all content has been read. Follow the applicable instructions
throughout the task and complete the applicable pre-flight checks before
delivery.

Preserve the scope and contextual conditions in `SKILL.md`: infer the brief
first and apply only rules that fit it. Do not automatically apply its marketing
design rules to dashboards, data tables, multi-step product UI, backend work,
or unrelated maintenance.

Keep `SKILL.md` intact as the canonical reference. User instructions and
higher-priority instructions take precedence over these project instructions.

## Configuration format

These are natural-language project instructions, so they belong in `AGENTS.md`.
Codex `.rules` files use Starlark `prefix_rule(...)` entries for command
permissions outside the sandbox; do not put this design guide into a `.rules`
file or derive command permissions from its example installation commands.

Official documentation:

- https://learn.chatgpt.com/docs/agent-configuration/agents-md
- https://learn.chatgpt.com/docs/agent-configuration/rules

## Release restriction during fresh setup

The owner has reinstalled the VPS OS and cleared the old database. Preserve the current source application while preparing the new installation. Do not push to GitHub or deploy to the VPS until the owner explicitly requests that action. Local cleanup and isolated tests do not authorize a release.
