# Tónus – Work backlog

Driven by `/work`. Tasks run top to bottom. One task = one implementer run = one commit (`Refs: Txx`).

Status: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked (see `log.md`)
Fields: **Type** (infra | domain | content | data | platform | ui | validate | docs) · **UI** = run `ui-validator` after gates pass.

Design files: `docs/design/01-today` · `02-program` · `03-session-overview` · `04-exercise-detail` · `05-player` · `06-finish` · `07-log` (`.dc.html`).

---

## M1 · Skeleton on the phone

- [x] **T01** · infra · Scaffold project
  - Vite + React 19 + TS strict, Tailwind v4 (`@tailwindcss/vite`), React Router 7, ESLint (flat config, typescript-eslint, react-hooks) + Prettier, Vitest + Testing Library + jsdom. Scripts: `dev`, `test` (vitest run), `test:watch`, `typecheck`, `lint`, `format`, `build`, `preview`.
  - Folder skeleton from `implementation-plan.md` (`src/{content,domain,data,platform,ui,screens}`, `tests/`). `.gitignore` (node_modules, dist, dev-dist, .validation, .vscode). One trivial passing test.
  - Done when: all four gates pass; `npm run dev` serves a page.
  - Commit: `build(infra): scaffold vite react ts tailwind project`

- [x] **T02** · ui · Design tokens and font
  - Extract colours, radii, spacing, type scale, shadows from all `docs/design/*.dc.html` into `docs/design/tokens.md` (name each colour by role: bg, surface, border, ink, ink-muted, accent `#8EC9EE`, accentInk = accent×0.45 = `#405A6B`, accentSoft = accent+`40`, pink/streak, link…). Map them into the Tailwind `@theme` in `src/index.css`.
  - Self-host Plus Jakarta Sans 400–800 latin + latin-ext via `@fontsource/plus-jakarta-sans`. Base styles: `100dvh`, `overscroll-behavior: none`, `touch-action: manipulation` on buttons, body bg/ink from tokens.
  - Done when: gates pass; tokens.md complete.
  - Commit: `feat(ui): add design tokens and self-hosted font`

- [x] **T03** · validate · Reference screenshots of the design · UI
  - ui-validator only (no implementer): capture the 7 boards of `design.html` into `docs/design/screens/0N-*.png` (see ui-validator "Special task").
  - Done when: 7 PNGs exist and look like the design.
  - Commit: `docs(design): add reference screenshots of the 7 screens`

- [ ] **T04** · ui · App shell, routes and UI primitives · UI
  - Routes: `/` Today, `/program`, `/session/:id`, `/exercise/:id` (with `?session=` context), `/player/:id`, `/finish/:id`, `/log`. Placeholder screens with titles.
  - `src/ui/`: `BottomNav` (Ma / Program / Napló, icons + active state exactly as design), `Card`, `Button` (primary/secondary/ghost), `Chip`, `Icon` (inline SVG set used by the design), `Ring` (progress ring). Safe-area padding, `viewport-fit=cover` meta.
  - Done when: gates pass; validator: bottom nav matches design, navigation works, no console errors.
  - Commit: `feat(ui): add app shell, routes and ui primitives`

- [ ] **T05** · infra · PWA, icons, update banner, deploy docs
  - `vite-plugin-pwa` (registerType `prompt`): manifest name "Tónus", lang hu, `display: standalone`, theme/background colours from tokens (baby blue), icons generated with `@vite-pwa/assets-generator` from an SVG logo in `public/` (incl. 180×180 `apple-touch-icon`). iOS meta: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: default`, title.
  - Precache all assets incl. fonts → works offline after first load.
  - "Új verzió – frissítés" banner component shown when a new SW is waiting.
  - `docs/deploy.md`: Cloudflare Pages setup (build `npm run build`, output `dist`), install on iPhone, manual checklist M1.
  - Done when: gates pass; `npm run build` emits manifest + sw; validator on `npm run preview` confirms manifest and SW registered.
  - Commit: `feat(pwa): add manifest, icons, offline sw and update banner`

## M2 · Content and browsing screens

- [ ] **T06** · domain · Types and formatting helpers
  - `src/domain/types.ts`: Exercise, Dose, SessionItem, ProgramSession, SessionLog, Settings, PlayerSnapshot, Prescription (per plan). `src/domain/format.ts`: dose label ("8 ismétlés", "45 mp", "2 × 30 mp", "oldalanként"), minutes ("50 perc", "8'"), duration ("51:20", "6 ó 52 p"), Hungarian day/month names. Tests.
  - Commit: `feat(domain): add core types and hungarian format helpers`

- [ ] **T07** · content · Exercise library
  - `src/content/exercises.ts`: ~40 Hungarian exercises (nameHu, nameEn, focus, equipment, steps with breathing cues, mistakes, easier, harder, cue). Classic mat repertoire for phase 1, ball/ring/band variants for phase 2, Teaser, Rollover, Corkscrew (Dugóhúzó), Push-up etc. for phase 3, plus warm-up and cool-down items (e.g. Sellő nyújtás + gyermekpóz). Roll Up text must match design 04.
  - Tests: unique ids, all fields non-empty, Hungarian names present.
  - Notes: flag "HUMAN REVIEW: exercises" in log.md.
  - Commit: `feat(content): add exercise library`

- [ ] **T08** · content · 36-session program + guardrail tests
  - `src/content/program.ts`: 12 weeks × A/B/C, phases 1–3 (titles/descriptions per design 02), assessment weeks 4/8/12, built-in progression (+1–2 reps or +5 s weekly, phase 2 props and longer holds, phase 3 advanced + shorter rests). Week 3 B = "Core & gerinc" with 14 exercises like design 01/03.
  - Guardrail tests (`tests/content/`): every exerciseId exists; exactly 36 sessions, 3 per week, slots A/B/C; every session est. total 48–52 min with warm-up 7–9 / main 32–36 / cool-down 7–9 min; assessment flags on weeks 4/8/12.
  - Notes: flag "HUMAN REVIEW: program" in log.md.
  - Commit: `feat(content): add 12-week program with guardrail tests`

- [ ] **T09** · domain · Schedule
  - `src/domain/schedule.ts`: `nextSession(program, logs)` (first without a log), `sessionStatus`, `weekView(settings, logs, today)` (Mon–Sun, done/today/planned), `programProgress` (n / 36, %, current week/phase), `currentStreak`. Time passed in. Exhaustive tests.
  - Commit: `feat(domain): add completion-based schedule`

- [ ] **T10** · ui · Today screen · UI
  - Per `01-today.dc.html`: date header, streak pill, accent hero card (week · slot · n/3, title, what's new, minutes, exercise count, equipment, "Edzés megnyitása"), "Ez a hét" week strip, phase progress bars + program link, info card (assessment hint), reminder card (H · Cs · Szo, 18:30), bottom nav. Data from content + schedule (logs empty until M4 → read through a `data/` hook that returns `[]` for now).
  - Commit: `feat(today): build today screen from program content`

- [ ] **T11** · ui · Program screen · UI
  - Per `02-program.dc.html`: header, overall progress, 3 phase cards, expandable week rows with sessions (done / today / upcoming), assessment week row, phase 2–3 highlights. Tap session → `/session/:id`.
  - Commit: `feat(program): build 12-week program screen`

- [ ] **T12** · ui · Session overview screen · UI
  - Per `03-session-overview.dc.html`: back header, title block, stats (minutes, exercises, difficulty, equipment), 8'/34'/8' block bar, warm-up / main / cool-down lists (number, Hungarian + English name, dose, "Új" badge), "Előnézet" and "Indítás" buttons. Tap exercise → `/exercise/:id?session=…`.
  - Commit: `feat(overview): build session overview screen`

- [ ] **T13** · ui · Exercise detail screen · UI
  - Per `04-exercise-detail.dc.html`: media placeholder, badges, position "Gyakorlat n / 14", names + dose, focus/tempo/equipment facts, numbered steps, "Figyelj rá" mistakes, easier/harder cards, "Te legutóbb" (from logs, hidden when none).
  - Done when: all 36 sessions and their exercises browsable; validator spot-checks weeks 1, 6, 12.
  - Commit: `feat(exercise): build exercise detail screen`

## M3 · Workout player

- [ ] **T14** · domain · Player reducer and timing
  - `src/domain/player.ts`: flatten session to steps; state machine (idle → running ↔ paused → transition → … → finished); actions start/pause/resume/done/skip/prev/tick/useEasier/restore; time items store `endsAt` (ms), remaining = endsAt − now (now passed in); rep items show estSeconds as soft guide, advance only with Kész; 10 s skippable "Következő: …" transition; sets for time items; snapshot `{sessionId, index, endsAt | pausedRemaining}` serialisation. Exhaustive tests incl. throttled/frozen tab (large now jumps).
  - Commit: `feat(domain): add workout player reducer with timestamp timer`

- [ ] **T15** · data · Dexie database and player resume store
  - `src/data/db.ts`: Dexie v1 schema (`logs`, `settings`, `player`); `src/data/player.ts`: save/load/clear snapshot; `src/data/settings.ts`: get/init settings (start date, training days Mon/Thu/Sat, reminder 18:30); call `navigator.storage.persist()` via `platform/`. Tests with `fake-indexeddb`.
  - Commit: `feat(data): add dexie schema and player resume store`

- [ ] **T16** · platform · Wake lock and sound
  - `src/platform/wakeLock.ts` (request, re-acquire on `visibilitychange`, muted looping-video fallback), `src/platform/sound.ts` (Web Audio unlock on first tap, 3-2-1 beeps, end chime), `src/platform/visibility.ts` helper. Unit tests with mocks where feasible.
  - Commit: `feat(platform): add wake lock and web audio cues`

- [ ] **T17** · ui · Player screen · UI
  - Per `05-player.dc.html`: block label + position, segment progress, names + dose, ring countdown (250 ms redraw from endsAt, recompute on visibilitychange), status text, cue, pause/resume, Kész for reps, prev/next, transition card, "Edzés befejezése". Starts from overview "Indítás" (unlocks audio, wake lock). Saves snapshot on every transition; Today shows "Folytatás" when a snapshot exists. Finish → `/finish/:id`.
  - Validator: start a session, verify countdown, pause/resume, Kész advances, reload mid-session resumes in place.
  - Commit: `feat(player): build workout player screen`

## M4 · Finish and logging

- [ ] **T18** · data · Session logs
  - `src/data/logs.ts`: `saveLog`, `useLogs` (useLiveQuery), `useSettings`; replace the empty-logs stub from T10. Tests with fake-indexeddb.
  - Commit: `feat(data): add session log storage and live hooks`

- [ ] **T19** · ui · Finish screen · UI
  - Per `06-finish.dc.html`: "Szép munka!", duration / exercises / streak stats, difficulty rating 1–5 (Nagyon könnyű · Könnyű · Pont jó · Nehéz · Túl nehéz with hints), areas chips (Has, Hát, …), note textarea (≥16px), "Mentés a naplóba" → saveLog, clear player snapshot, go to Today.
  - Commit: `feat(finish): build finish screen and save session log`

- [ ] **T20** · ui · Wire logs into Today, Program, Overview · UI
  - Done states, next session = first without log, week strip, n / 36 counts, streak pill, "Te legutóbb" on exercise detail.
  - Commit: `feat(ui): show logged progress across screens`

- [ ] **T21** · validate · End-to-end flow · UI
  - ui-validator: fresh DB → Today → Edzés megnyitása → Indítás → complete all steps (skip timers) → rating/areas/note → Mentés → session shows done on Today and Program, next session becomes today's. Implementer fixes findings if any (then commit `fix(...)`), otherwise no commit; mark done.

## M5 · Log and stats

- [ ] **T22** · domain · Stats
  - `src/domain/stats.ts`: streak, total time, sessions done / 36, calendar cells (done / planned / today) for a month range, rating series per session grouped by week, trend sentence, records from assessment weeks (plank hold, clean Roll Up reps: from → to). Tests.
  - Commit: `feat(domain): add stats from session logs`

- [ ] **T23** · ui · Log screen · UI
  - Per `07-log.dc.html`: streak + total time tiles, n / 36, month calendar (Kész / Tervezett legend), rating bar chart with week labels and trend text, "Fejlődés" records list. Empty states when no logs.
  - Commit: `feat(log): build log and progress screen`

## M6 · Adaptive progression and polish

- [ ] **T24** · domain · Progression engine
  - `src/domain/progression.ts`: `prescribe(session, history): Prescription` per rule table (1 bump, 2×"Könnyű" in a week pull forward, 3 none, 4 offer easier on new items, 5 hold + holds −20%). Pure, table tests row by row.
  - Commit: `feat(domain): add adaptive progression engine`

- [ ] **T25** · ui · Apply prescription in overview and player · UI
  - Overview and player use `prescribe()` output; "Módosítva" badge on changed items; easier variant pre-selected when offered; player logs usedEasier.
  - Validator: rate a session 5 → next session's holds visibly shorter with badge.
  - Commit: `feat(overview): apply adaptive prescription with modified badge`

- [ ] **T26** · data · Backup export / import · UI
  - `src/data/backup.ts` (serialise logs + settings with version, validate + import), `src/platform/share.ts` (Web Share with File, download fallback). Log screen: "Mentés exportálása", "Visszaállítás", last backup date, nudge after 30 days. Tests for round-trip and validation.
  - Commit: `feat(data): add json backup export and import`

- [ ] **T27** · platform · Calendar reminder (.ics) · UI
  - `src/platform/calendar.ts`: build weekly RRULE .ics from settings (Mon/Thu/Sat 18:30, Europe/Budapest); pure builder tested. Reminder card on Today offers it via share/download.
  - Commit: `feat(platform): add ics calendar reminder`

- [ ] **T28** · validate · Final UI audit · UI
  - ui-validator on all 7 screens vs reference screenshots + console + mobile basics + offline (preview build, SW). Implementer fixes majors (`fix(ui): …` commit).

- [ ] **T29** · docs · README and handover
  - `README.md`: what it is, commands, architecture map, deploy, iPhone install, manual checklists M1–M6, content review note.
  - Commit: `docs: add readme with deploy and install guide`

---

## Manual checks on the iPhone (user, not blocking /work)

- [ ] M1: icon on Home Screen; full-screen; baby blue status bar; works in airplane mode after first launch.
- [ ] M2: all 36 sessions browsable; exercise and program content reviewed by her / an instructor.
- [ ] M3: full 50-min session on the phone: screen stays on; closing the app mid-session resumes in place.
- [ ] M4: saved session shows done on Today and Program; next one becomes today's.
- [ ] M5: numbers match a hand count after a week of real use.
- [ ] M6: rating 5 shortens next session's holds; exported file opens in Files app.
