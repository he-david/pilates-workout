# Tónus

Installable web app (PWA) for one user on iPhone: a 12-week, 36-session Pilates program with a
workout player, session logging and stats. UI is Hungarian. All data stays on the device. No
backend, no accounts.

- Product spec and architecture: [`implementation-plan.md`](implementation-plan.md)
- Rules for contributors and agents: [`CLAUDE.md`](CLAUDE.md)
- Design source: `docs/design/*.dc.html`, `docs/design/tokens.md`, screenshots in `docs/design/screens/`
- Backlog and handoff notes: `docs/progress/tasks.md`, `docs/progress/log.md`
- Deploy details: [`docs/deploy.md`](docs/deploy.md)

## Stack

Vite, React 19, TypeScript (strict), Tailwind CSS v4, React Router 7, Dexie (IndexedDB),
`vite-plugin-pwa`, Vitest + Testing Library, ESLint, Prettier. Font: Plus Jakarta Sans, self-hosted
(needed for Hungarian ő/ű).

## Commands

```
npm install
npm run dev        # dev server (http://localhost:5173)
npm test           # vitest run
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run build      # typecheck + production build to dist/
npm run preview    # serve dist/ (manifest and service worker are only emitted by the build)
npm run format     # prettier --write
```

Definition of done: `typecheck`, `lint`, `test` and `build` all pass. UI changes are also checked in
Chrome against the design.

## Architecture map

```
src/
  domain/    pure TypeScript: schedule, progression, stats, player state, backup format, view models
  data/      Dexie database, logs/settings/player snapshot, backup import/export, reminder, React hooks
  platform/  browser APIs only: wake lock, audio, share, storage.persist, visibility, .ics, SW update
  content/   typed read-only exercises and the 36-session program
  screens/   route screens (Today, Program, Session overview, Exercise, Player, Finish, Log)
  ui/        shared primitives (Button, Card, Chip, Icon, Ring, BottomNav, UpdateBanner)
tests/       domain/ data/ platform/ content/ plus screen-level component tests
```

Key rules:

- `domain/` has no React, Dexie or browser APIs. Time is always passed in (no bare `new Date()`).
- Screens call `domain/` for decisions and `data/` for saving. Only the Player screen uses `platform/`.
- Stats (streak, totals, records) are computed from logs, never stored.
- The program advances by completion, not calendar: the next session is the first one without a log.
- The player timer stores `endsAt` timestamps, never decrementing counters.
- Any Dexie schema change bumps the version and adds a migration.

## Deploy (Cloudflare Pages)

Connect the GitHub repo, build command `npm run build`, output directory `dist`, production branch
`main`. Other branches get their own preview URLs (separate storage). Full steps in
[`docs/deploy.md`](docs/deploy.md).

## Install on iPhone

1. Open the production URL in Safari.
2. Share, then Add to Home Screen, then Add.
3. Always open the app from the Home Screen icon (it has its own storage, separate from Safari).
4. After the first launch it works offline. When a new version is deployed, a "Új verzió – frissítés"
   banner appears at the top; tap it.

## Your data: back it up

Data lives only on the phone. Deleting the app or clearing website data loses it.

- Log tab, backup card: export a JSON file (Web Share on iPhone, download elsewhere) regularly. The
  app nudges you if there is no backup or the last one is older than 30 days.
- Import replaces all logs and settings with the file's contents after confirmation.
- Calendar reminder: on the Today screen, "Naptárba" shares a weekly `.ics` event (training days,
  18:30, 50 min, 10 min alert, 36 occurrences) that you open in the iPhone Calendar.

## Dev helpers

In dev builds only (`npm run dev`, not the production build): add `?devDone=N` to any URL to replace
the stored logs with N fake finished sessions (e.g. `/?devDone=8`), and `&devRating=1..5` to set the
rating of the newest one, to preview adaptive progression. The seed is remembered per browser tab;
`?devDone=0` clears it. Nothing is written to the database.

## Content review (needs a human)

`src/content/exercises.ts` and `src/content/program.ts` are physical-safety relevant (cues, holds,
reps, progressions). They have automated guardrail tests but still need review by the user and/or a
Pilates instructor before relying on them. Known point: session `w03-b` lists the equipment as
"Matrac", while the design shows "Matrac + kis labda".

## Manual checks on the iPhone

- [ ] M1: icon on Home Screen; full-screen; baby blue status bar; works in airplane mode after first launch.
- [ ] M2: all 36 sessions browsable; exercise and program content reviewed by her / an instructor.
- [ ] M3: full 50-min session on the phone: screen stays on; closing the app mid-session resumes in place.
- [ ] M4: saved session shows done on Today and Program; next one becomes today's.
- [ ] M5: numbers match a hand count after a week of real use.
- [ ] M6: rating 5 shortens next session's holds; exported file opens in Files app (also check Web Share and importing the `.ics` into Calendar).

The more detailed M1 list is in [`docs/deploy.md`](docs/deploy.md).

## Open decisions and follow-ups

- A timed hold skipped with "Következő" does not count as completed. Should partial time (for
  example at least 50%) earn credit?
- Ending a session immediately with 0 exercises still counts as done and advances the program.
- Calendar reminder uses `COUNT=36` regardless of sessions already done, and the first occurrence is
  today even if 18:30 has passed.
- Backup import shows the confirmation before validating the file.
- UI minors from the final audit: player segment bar is per block (design: whole session); exercise
  "Figyelj rá" list lacks bullets; Today reminder toggle is 52×32 (design size, under 44px tall); Log
  chart week labels differ slightly; dev seed has no assessment logs below 26 sessions.
