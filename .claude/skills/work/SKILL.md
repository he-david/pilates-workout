---
name: work
description: Orchestrate building the Tónus PWA. Picks up the next task from docs/progress/tasks.md (or resumes an interrupted one), dispatches Sonnet 5.5 implementer subagents, runs quality gates, validates UI in Chrome via the ui-validator subagent, and commits each task with Conventional Commits. Use when the user types /work, "continue", "next task" or "resume the build".
argument-hint: "[status | next | N | Txx | Mx]"
---

# /work — orchestrator loop

You are the **orchestrator**. The main context stays small: you plan, dispatch, verify, commit and record. You do not write app code yourself — `implementer` subagents do (exception: trivial one-line fixes to gates, and edits to `docs/progress/*`). Keep subagent reports short and do not re-read large source files unless a decision needs it.

## Arguments

- *(none)* — run tasks continuously until everything is done or a task is blocked.
- `status` — print progress (done / total per milestone, current/blocked task, last 5 commits) and stop.
- `next` — do exactly one task. `N` (number) — do N tasks.
- `Txx` — do that specific task (only if its predecessors are done or it is independent).
- `Mx` — do the remaining tasks of milestone x, then stop.

## 1 · Orient (every invocation)

1. Read `docs/progress/tasks.md` and the last ~40 lines of `docs/progress/log.md`.
2. `git status --short` and `git log --oneline -10`.
3. Make sure `.vscode/` is in `.git/info/exclude` (never commit it).
4. Resume logic:
   - A task marked `[~]`:
     - `git log --grep "Refs: Txx"` finds a commit → it was committed; mark `[x]` and continue.
     - Working tree has changes → interrupted mid-task. Dispatch the implementer with "Resume Txx. Partial changes already exist in the working tree (`git status` / `git diff`); finish the task." Then continue at step 3 below.
     - Clean tree, no commit → restart the task.
   - A task marked `[!]` → report the blocker from log.md and stop (unless the user's argument targets it and says it is resolved).
   - Otherwise pick the first `[ ]` task.
   - No tasks left → final report and stop.

## 2 · Per-task loop

1. **Start.** Mark the task `[~]` in tasks.md (do not commit yet). One line to the user: `▶ Txx – title`.
2. **Dispatch implementer** (`subagent_type: implementer`) unless the task is `validate`-only. Prompt = the full task block from tasks.md + milestone name + pointers: `CLAUDE.md`, relevant plan sections, design file(s), and any notes from log.md that concern it. Ask for the report format defined in the agent.
3. **Gates.** Run yourself: `npm run typecheck && npm run lint && npm test && npm run build` (before T01 finishes, skip scripts that don't exist). On failure: re-dispatch the implementer with the failing output (trimmed to the relevant ~60 lines). Max 3 attempts → mark `[!]`, log the blocker, stop.
4. **UI validation** (tasks marked `UI`):
   - Ensure the dev server is up: `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173`. If not 200, start `npm run dev -- --port 5173 --strictPort` with `run_in_background: true`, then poll curl until 200 (max ~30 s). For PWA/offline checks use `npm run build && npm run preview -- --port 4173 --strictPort` instead.
   - Dispatch `ui-validator` with: URL, task id, routes/flow (from the implementer's ROUTES + task block), design file(s) and reference screenshot paths.
   - `fail` → dispatch the implementer with the findings (major ones first), re-run gates, re-validate. Max 2 fix rounds; remaining minors go to log.md as follow-ups and do not block. Remaining majors → `[!]` and stop.
   - `blocked` because chrome-devtools MCP is missing → tell the user to restart Claude Code in this repo and approve the `chrome-devtools` server (`/mcp`), mark `[!]`, stop.
5. **Record.** In tasks.md mark `[x]`. Append a log.md entry (date, task, 2–5 bullets: what changed, decisions, `HUMAN REVIEW:` items, follow-ups, validator minors).
6. **Commit** (one per task, includes the tasks.md/log.md update):
   - `git add -A` (respects .gitignore and .git/info/exclude), review `git status --short` for junk (screenshots in `.validation/`, `dist/`, secrets) before committing.
   - Message: the task's `Commit:` line (adjust scope/summary if the work differs), Conventional Commits, ≤ 72 chars subject. Body: 1–5 lines of what/why. Footer: `Refs: Txx`, then the Co-Authored-By attribution line required by the current session.
   - `validate` tasks with no code changes: commit only the tasks.md/log.md update as `chore(progress): complete Txx <title>`.
   - Never push, never amend previous commits, never rewrite history.
7. **Report** one line: `✓ Txx – <subject> (<short sha>)`.
8. **Milestone end** (last task of an M section): print the matching "Manual checks on the iPhone" line for the user. Do not wait for it — continue.
9. Continue with the next task unless the argument limits the run.

## 3 · Final / stop report

Short: tasks done this run (with shas), current position, blockers, HUMAN REVIEW items still open (exercise + program content), and the manual iPhone checks due. Leave the dev server running only if the user is likely to look at it; otherwise stop it.

## Rules

- Sequential: one task at a time, never two implementers editing the tree concurrently.
- Content tasks (T07, T08) are physical-safety relevant: always log `HUMAN REVIEW` and mention it in the final report.
- If a subagent wants a dependency not allowed in CLAUDE.md, or the spec is ambiguous in a way that changes behaviour, stop and ask the user (AskUserQuestion) instead of guessing.
- If tasks.md and git disagree, git wins (commit with `Refs: Txx` = done).
