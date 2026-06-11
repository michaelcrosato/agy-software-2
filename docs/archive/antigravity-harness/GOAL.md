# GOAL

## Purpose
Make this repository AFK-ready for autonomous coding agents with clear context, repeatable agent workflows, and explicit execution contracts.

## Current state
- Next.js app with API routes, Prisma-backed persistence, and a working test stack.
- Existing operational docs exist but are split across multiple markdown files and scripts.
- No canonical root AGENTS contract or repeatable autonomous command surface.

## Desired end state
- Single source of truth for agent instructions in `AGENTS.md`.
- Standardized agent entry points in `scripts/agent/*.sh` and package scripts `agent:*`.
- Small, atomic tickets with explicit acceptance criteria.
- Repo map and dependency map for fast orientation.
- Health and maintenance flow that is deterministic, documented, and repeatable.

## Non-goals
- Rewriting business logic or changing feature behavior.
- Changing UI design direction unless needed for tooling stability.
- Adding new external integrations.

## Constraints and assumptions
- Node project using npm by default (`package-lock.json` exists).
- Agents should avoid destructive commands unless explicitly requested.
- Cross-platform compatibility should stay best-effort for local development.
- Existing `.env` files are not committed as secrets and remain local-only for developers.

## Agent guidance
- Read order: `AGENTS.md` → `GOAL.md` → `ROADMAP.md` → `docs/ai/REPO_MAP.md` → top pending ticket.
- Prioritize `AGENTS.md` command loop over spontaneous edits.
- Keep edits minimal, reversible, and scoped to one objective per ticket.
- Prefer existing tools and scripts over inventing new ones.

## Definition of done
- Tickets include status, steps, commands, and acceptance criteria.
- Required AFK files exist: `GOAL.md`, `ROADMAP.md`, `AGENTS.md`, `tickets/TICKET***.md`, `.aiignore`, `docs/ai/REPO_MAP.md`.
- `agent:check` and focused gate scripts execute or explicitly log “skipped”.
- Core docs and scripts are updated together when behavior changes.
- No unresolved high-confidence bug remains without a ticket.

