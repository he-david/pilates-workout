# Tónus – Pilates workout PWA

Installable web app (PWA) for one user on iPhone. 12-week, 36-session Pilates program, workout player, logging and stats. All data on device. No backend, no auth.

- Architecture & product spec: `implementation-plan.md` (source of truth for behaviour)
- Design source of truth: `docs/design/*.dc.html` (one file per screen, readable markup) and `docs/design/tokens.md`. Original bundled canvas: `design.html` (open in Chrome to see all 7 screens rendered). Reference screenshots: `docs/design/screens/*.png`.
- Work backlog & progress: `docs/progress/tasks.md`, handoff notes: `docs/progress/log.md`. Run `/work` to continue.

## Stack & commands

Vite + React 19 + TypeScript (strict) + Tailwind CSS v4 + React Router 7 + Dexie (`dexie-react-hooks`) + `vite-plugin-pwa` + Vitest + Testing Library + ESLint + Prettier. Font: Plus Jakarta Sans, self-hosted (Hungarian ő/ű).

```
npm run dev        # vite dev server (validation uses port 5173, --strictPort)
npm test           # vitest run
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run build      # production build to dist/
```

## Definition of done

A task is done only when `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` all pass. Never mark a task done otherwise. UI tasks additionally pass the `ui-validator` check in Chrome.

## Architecture rules

- `src/domain/` is pure TypeScript: no React, no Dexie, no browser APIs, no `Date.now()` / `new Date()` without an argument (time is passed in). Every function there gets unit tests in `tests/domain/`.
- Browser APIs (wake lock, audio, share, storage.persist, visibility) only in `src/platform/`. Storage only in `src/data/`.
- Screens (`src/screens/`) call `domain/` for every decision and `data/` for every save. Only the Player screen uses `platform/` directly.
- Content (`src/content/exercises.ts`, `src/content/program.ts`) is typed, read-only, versioned in git. Guardrail tests in `tests/content/`.
- Stats (streak, totals, records) are always computed from logs, never stored.
- Program advances by completion, not calendar: next session = first one without a log.
- Player timer uses timestamps (`endsAt`), never decrementing counters.
- Dexie schema changes bump the version and add a migration.
- Small files, one job each. Follow the project structure in `implementation-plan.md`.

## Dependencies

Allowed without asking: react, react-dom, react-router, dexie, dexie-react-hooks, vite-plugin-pwa, @vite-pwa/assets-generator, tailwindcss, @tailwindcss/vite, @fontsource/plus-jakarta-sans, vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom, fake-indexeddb, eslint (+ typescript-eslint, react-hooks, react-refresh plugins), prettier, typescript, @types/*. Anything else: do not add — report it as a blocker.

## UI rules

- UI text is Hungarian, written inline. Exercise names come from `content/`.
- Copy colours, radii, spacing, font sizes from the design files / `tokens.md`. Never invent colours. Theme tokens live in the Tailwind `@theme` block.
- Mobile-first at 390–393 px width. `100dvh` not `100vh`, `overscroll-behavior: none`, `env(safe-area-inset-*)` padding on header and bottom nav, `viewport-fit=cover`.
- Inputs ≥ 16px font. `touch-action: manipulation` on buttons. Tap targets ≥ 44px.
- No UI component library. Shared primitives in `src/ui/`.

## Git conventions

- Conventional Commits: `type(scope): imperative summary` (≤ 72 chars). Types: feat, fix, test, refactor, chore, docs, build, ci, style, perf. Scopes: `infra`, `ui`, `domain`, `content`, `data`, `platform`, `pwa`, plus a screen name (`today`, `program`, `overview`, `exercise`, `player`, `finish`, `log`).
- One commit per backlog task, with footer `Refs: Txx`. Body explains what and why in 1–5 lines.
- Only the orchestrator (`/work`) commits. Subagents never commit, never push, never rewrite history.
- Never commit `.vscode/`, `node_modules/`, `dist/`, `.validation/`.
