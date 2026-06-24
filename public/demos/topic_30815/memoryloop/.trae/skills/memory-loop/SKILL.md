---
name: "memory-loop"
description: "Project-level memory loop system for AI-assisted development. Initializes, reads, writes, and compresses project memory with hot/cold layers. Invoke when starting a new task, completing a task, or when user asks to view/edit project memory."
---

# Memory Loop

A project-level memory persistence system based on loop engineering principles. The agent is stateless across runs; this skill provides on-disk memory that the harness injects into each new session, giving the illusion of continuity.

## Core Principle

> "The agent forgets, the repo doesn't."
> "The memory has to be on disk and not in the context."

Memory lives in files on disk. The agent writes; the harness injects. The model never truly "remembers" — it just re-reads the handoff notes from the previous shift.

## File Layout (per project)

```
project-root/
└── .trae/
    └── memory/
        ├── MEMORY.md              # Hot layer, fully injected each run
        ├── archive.md             # Cold layer, compressed history
        └── memory-schema.yaml     # Editable schema defining structure
```

## Initialization Logic

Run this check at the very start of every invocation, before any other work:

```
IF .trae/memory/MEMORY.md does not exist:
  → Create .trae/memory/ directory
  → Copy memory-schema.yaml from plugin templates (or generate default)
  → Generate MEMORY.md from template with project name and creation date
  → Initialize empty archive.md
  → Notify user: "Initialized project memory at .trae/memory/"
ELSE:
  → Read .trae/memory/MEMORY.md content
  → Read .trae/memory/memory-schema.yaml
  → Inject MEMORY.md content into current context as "Project Memory"
```

This check is zero-cost and runs every time, ensuring any new project auto-initializes on first use.

## Read / Inject Protocol

At the start of each new task or session:

1. Read `.trae/memory/MEMORY.md` (hot layer) — inject FULL content into context
2. Read `.trae/memory/memory-schema.yaml` — understand current structure
3. Do NOT auto-inject archive.md (cold layer) — only retrieve on demand

If the task requires historical context (e.g., "how did we solve X before?"), the agent may search `.trae/memory/archive.md` selectively.

## Write Protocol

After completing a task, making a key decision, or discovering a gotcha, append to the appropriate section in MEMORY.md. **The agent does NOT decide hot/cold routing at write time.** It fills predefined slots per the schema.

### Write Triggers

- **Task completion checkpoint** — append to `Completed` section
- **Key decision made** — append to `Decisions Log`
- **Gotcha discovered** — append to `Gotchas` immediately (prevent re-stepping)
- **Goal updated** — update `Active Goals`
- **Architecture-level finding** — force-write to `Project Context` or `Gotchas`, never just to execution log

### Write Rules

1. **Fill slots, don't route.** The schema defines slots; the agent fills them.
2. **Slot semantics must be narrow.** Follow the format examples in schema exactly.
3. **Append, don't overwrite** — unless updating `Active Goals` or `Status`.
4. **Respect max_items** — if a section is full, trigger compression (see below).
5. **Use precise dates** — always `YYYY-MM-DD` format.

### Write Quality Constraints

Bad slot definition (ambiguous, LLM fills inconsistently):
```
## Key Learnings
```

Good slot definition (narrow, format-locked):
```
## Gotchas
- [module] problem description → workaround
## Decisions
- YYYY-MM-DD | chose X over Y | reason: Z
## Status
- IN_PROGRESS / BLOCKED / DONE | one-line summary
```

The narrower the slot, the more consistent the writes, the more reliable the compression and retrieval.

## Compression Protocol

When MEMORY.md exceeds `trigger_tokens` (default: 3000 tokens, ~12000 chars), trigger compression:

1. Spawn the `memory-compressor` sub-agent (see `agents/memory-compressor.md`)
2. Compressor reads MEMORY.md + schema
3. Keeps `keep_recent_decisions` most recent Decisions (default: 5)
4. Keeps `keep_recent_completed` most recent Completed (default: 3)
5. Compresses older entries into summary prose
6. Appends compressed summary to `archive.md` with timestamp header
7. Rewrites MEMORY.md with only retained entries + fresh section headers
8. Reports compression stats to user

### Content-Type Aware Compression

- **Narrative content** (decision process, execution logs, gotcha background) → compress aggressively. Extract conclusions, drop process noise. Improves retrieval signal-to-noise.
- **Precise facts** (register addresses, error codes, API responses, numeric values) → preserve verbatim. Compression distorts precision. Vector search can't match exact numbers anyway.

When in doubt: compress the "how we got here", preserve the "what is true".

## Schema Editing

Users may edit `.trae/memory/memory-schema.yaml` directly to:
- Add/remove sections
- Change `max_items` per section
- Modify format templates
- Adjust compression triggers

The skill reads schema at runtime — schema changes take effect on next invocation, no skill restart needed.

## Frontend Viewer

A local web UI is available for browsing and editing memory:

```bash
# From the plugin directory
node server/server.js
```

Opens a dashboard at `http://localhost:3721` showing:
- Memory layout (all hot-layer sections, rendered)
- Archive browser (cold layer, searchable)
- Schema editor (live YAML edit with validation)
- Compression trigger (manual button)
- Project switcher (point to any project folder)

Design follows Apple HIG: minimalist, SF Pro typography, subtle depth, light/dark mode.

## Integration with Development Loop

```
┌─────────────────────────────────────────────────┐
│  Session Start                                   │
│  ↓                                               │
│  Skill reads MEMORY.md → injects into context    │
│  ↓                                               │
│  Agent performs task (with memory awareness)     │
│  ↓                                               │
│  Task complete → agent writes to MEMORY.md       │
│  ↓                                               │
│  If MEMORY.md > trigger_tokens → compress         │
│  ↓                                               │
│  Session End (state persisted to disk)           │
└─────────────────────────────────────────────────┘
```

The state file is the spine of the whole loop. Tomorrow morning's run picks up where today stopped.
