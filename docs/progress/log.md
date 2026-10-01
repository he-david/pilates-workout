# Tónus – Work log

Append-only handoff notes written by `/work` after each task (newest at the bottom). Keep entries short.

Format:

```
## YYYY-MM-DD · Txx · <title> · done | blocked
- what changed / decisions
- HUMAN REVIEW: … (if any)
- follow-ups: …
```

---

## 2026-10-01 · T00 · Orchestration setup · done
- Unpacked `design.html` bundle into readable per-screen markup `docs/design/0N-*.dc.html` (+ `index-board.html` layout). Accent `#8EC9EE`, accentInk = accent×0.45.
- Added CLAUDE.md, `/work` skill, `implementer` + `ui-validator` agents (Sonnet 5.5), project `.mcp.json` with chrome-devtools MCP.

## 2026-10-01 · T01 · Scaffold project · done
- Vite 8.3 (Rolldown/oxc) + React 19 + TS strict (+ noUncheckedIndexedAccess), Tailwind v4, React Router 7, ESLint flat + Prettier, Vitest/jsdom + jest-dom. `build` = `tsc --noEmit && vite build`.
- JSX via `oxc: { jsx: { runtime: 'automatic' } }`; `@vitejs/plugin-react` not added (not on allowed list) → no fast refresh in dev. Ask user if wanted.
- `@eslint/js` added as part of eslint flat config; `globals` package avoided.
- Build warns harmless "use client" MODULE_LEVEL_DIRECTIVE from react-router.

## 2026-10-01 · T02 · Design tokens and font · done
- `docs/design/tokens.md`: 29 colour literals mapped to roles, radii, type scale, spacing; designs use no shadows. Mapped into Tailwind `@theme` in `src/index.css`.
- accent-ink `#405A6B` / accent-soft `#8EC9EE40` derived per task (computed in design, not literal).
- One-off radii (5/6/12/22 px) and sizes (11/18/21/24 px) kept as arbitrary values, documented in tokens.md.
- Plus Jakarta Sans 400–800 latin + latin-ext self-hosted via @fontsource (10 woff2 in build).

## 2026-10-01 · T03 · Reference screenshots · done
- 7 boards captured to `docs/design/screens/0N-*.png` (390 CSS px, 2x). 03/04 re-captured via 600×1700 viewport + element screenshot after first attempt cropped.
- Minor: Today/Program boards cut bottom nav at board edge (design board height). Use 07-log.png for full nav reference (Ma / Program / Napló).

## 2026-10-01 · T04 · App shell, routes and UI primitives · done
- Routes per plan; `TabLayout` layout route shows BottomNav only on `/`, `/program`, `/log` (designs show no nav on session/exercise/player/finish).
- `src/ui/`: Icon (16 inline SVGs from designs), BottomNav, Card, Button/ButtonLink (primary = accent bg, 54px, r16), Chip, Ring. Placeholder screens with titles.
- Validator pass: nav computed styles match 07-log design, active state follows route, no horizontal scroll.
- Validator minor / follow-up: `/favicon.ico` 404 in console → fixed by T05 icons.

## 2026-10-01 · T05 · PWA, icons, update banner, deploy docs · done
- vite-plugin-pwa 1.3 (works with Vite 8), registerType prompt; manifest Tónus/hu/standalone, theme #8ec9ee, bg #eef5fb. Icons generated from `public/logo.svg` (64/192/512, maskable, apple-touch 180, favicon.ico). Precache 40 entries incl. fonts.
- SW hook in `src/platform/useAppUpdate.ts`, presentational `ui/UpdateBanner`, glue `screens/AppUpdateBanner` mounted in app.
- `docs/deploy.md`: Cloudflare Pages, iPhone install, M1 checklist.
- Validator pass on preview: manifest/icons 200, SW activated, offline reload of /program and /log renders with font, console clean, favicon 404 gone.
- Follow-up: update banner only testable by deploying two builds (check on device).

## 2026-10-01 · T06 · Types and formatting helpers · done
- `domain/types.ts` per plan data model. Prescription `{session, easierPreselected[], harderSwapped[], notes[]}` and PlayerSnapshot `{sessionId, index, endsAt?, pausedRemaining?}` not specified in plan → designed here; revise in T14/T24 if needed.
- `domain/format.ts`: doseLabel ("8 ismétlés", "3 × 35 mp", "45 mp", perSide → "6 ismétlés oldalanként" — wording chosen, not in design), minutesLabel/minutesShort, durationLabel ("51:20" / "6 ó 52 p"), Hungarian day/month names, dateHeader ("Csütörtök, október 1."). Day/month take getDay()/getMonth() indexes.

## 2026-10-01 · T07 · Exercise library · done
- 42 exercises in `src/content/exercises/{warmup,mat,props,advanced,cooldown}.ts`, aggregated in `src/content/exercises.ts` (`exercises`, `getExercise(id)`). Kebab-case ids. Tests in `tests/content/exercises.test.ts` (unique ids/names, fields filled, breathing mention, all design names present with matching hu/en, Roll Up equals design 04).
- Design names kept verbatim, incl. "Sellő nyújtás + gyermekpóz" as ONE exercise (id `mermaid-childs-pose`, nameEn "Mermaid · Child's Pose") and "Macska–tehén" with en dash.
- Roll Up steps: the design's bold "Belégzés:/Kilégzés:" prefixes are plain text in the step strings. Tempo ("3 le · 3 fel") is not in the Exercise type; T08/T10 must supply it or derive it.
- HUMAN REVIEW: exercises. Instructor should check safety wording, esp. Átfordulás (Rollover, neck), Teaser, Fekvőtámasz, Hattyú, Fali guggolás labdával, nyújtások, and Hungarian names/wording generally.
- Review deferred by user ("I'll review it later"); not blocking. Also proofread chosen names: Csavaró hasprés (Criss-Cross), Fejemelés (Chest Lift), Átfordulás (Rollover), Fűrész, Lábemelés plankban, Egylábas egyensúly.

## 2026-10-01 · T08 · 36-session program + guardrail tests · done
- `src/content/program.ts` (+ `program/{build,slots,phases}.ts`): ids `w03-b`; slot titles A "Légzés & középtest", B "Core & gerinc", C "Láb, far & egyensúly". Every session 8/34/8 min exactly (estSeconds weighted shares). Week 3 B reproduces design 03. 48 guardrail tests.
- Progression: +1 rep / +5 s weekly, capped; assessment weeks 4/8/12 repeat previous dose (`isAssessment` on all 3); props from week 5; teaser/push-up/corkscrew/rollover/leg-pull-front phase 3 only, starting 3–4 reps. `isNew` = first appearance.
- Added optional `Exercise.tempo` (roll-up "3 le · 3 fel", hundred "5 be · 5 ki").
- Follow-ups for UI (T10/T12): hundred stored `{reps:100}` but design shows "100 számolás"; cooldown `{time:480}` design shows "8 perc" → handle in domain format, not ad hoc. "+5 mp" badge / "Új a héten" must be derived from week-over-week dose diff. Phase 2 design chips "Teaser előkészítő", "Nyitott lábú billenés" not in library → highlights use side-plank, swimming, saw, ball-bridge.
- HUMAN REVIEW: program — deferred by user, will review later.

## 2026-10-01 · T09 · Schedule · done
- `domain/schedule.ts`: nextSession, sessionStatus (done/next/upcoming), weekView (days with done/today/planned/missed/rest, doneCount over training days), programProgress, currentStreak. Program passed in; logs matched by local calendar day of finishedAt (DST-tested).
- Streak rule (plan silent, chosen): consecutive planned training days back from today each with ≥1 log; rest days never break; today pending doesn't break; extra sessions on rest days neither add nor break. Review: training on Tue instead of Mon breaks streak — revisit if too strict in real use.

## 2026-10-01 · T10 · Today screen · done
- `screens/TodayScreen` + `screens/today/{HeroCard,WeekStrip,PhaseCard,ReminderCard,headline}`; pure helpers in `domain/todaySummary.ts` (what's-new from isNew + week-over-week dose diff, max 2 names per part then "+N további"; slot n/3; equipment; phase hint).
- `data/` stubs: useLogs → [] (dev-only `?devDone=N` seeds fake logs, stripped from prod build), useSettings → `defaultSettings(today)` (Mon/Thu/Sat, 18:30), useToday reads clock. T15/T18 replace stubs; reminder toggle is local state only → wire to settings in T18.
- h1 varies by day status; three phrasings invented ("Mára megvagy, szép munka", "Ma pihenőnap van", "Végigcsináltad a programot").
- Validator pass. Minors left: what's-new is 3 lines vs design 2; meta row single line because w03-b equipment is "Matrac" only (design shows "Matrac + kis labda" — phase 1 is mat-only by T08 content; reconcile during content review).

## 2026-10-01 · T11 · Program screen · done
- `screens/ProgramScreen` + `screens/program/{ProgressCard,PhaseSection,WeekRow,SessionRow}`; pure `domain/programView.ts` (buildWeekRows, phaseState, weekdayLetters) with tests. Current week expanded by default; week rows toggle (aria-expanded, local state).
- Done phases show weeks with "Kész"; locked phases show description + highlight chips from library. Assessment weeks dashed + expandable. "→ ma" only when today is an open training day, else "→ következő".
- Validator fail round 1 (major): done sessions lacked line-through (`no-underline` on same Link overrode it) → moved to inner span. Re-check pass.
- Intentional: session rows 44px (design 32px) for tap targets.
- Note: theme `text-base` = 14px (not Tailwind default 16px) — keep in mind for inputs (≥16px rule).

## 2026-10-01 · T12 · Session overview screen · done
- `screens/SessionScreen` + `session/{BlockBar,BlockList}`; pure `domain/sessionOverview.ts` (buildOverview, difficulty = ceil(week/12×5), doseGrowth vs same slot last week).
- Dose display: new `doseShort` ("8 ism.", "8 / oldal", "5 / irány", "100 számolás", "3 × 35 mp", "8 perc"); optional `Exercise.repUnit` (count/direction) set on hundred, ball-hundred, single-leg-circles, band-leg-circles. Whole minutes render "N perc".
- "Előnézet" → first exercise detail; all rows link to `/exercise/:id?session=`; sticky bottom bar with safe-area; not-found state.
- Validator pass. Minor follow-up: "+1 ism." growth badges on 9 rows of w03-b (design shows only "Új" + "+5 mp") — screen busier than design; reconsider (e.g. show only time growth / first growth) with T25 "Módosítva" badges.

## 2026-10-01 · T13 · Exercise detail screen · done
- `screens/ExerciseScreen` + `exercise/{MediaPlaceholder,Steps}`; pure `domain/exerciseDetail.ts` (parseStep bolds Belégzés/Kilégzés prefixes, buildExerciseContext: position n/total, dose, "kb. N perc" only for rep doses, badge, prev/next; lastTimeText).
- With `?session`: badge, position, dose, Előző/Következő + "Vissza az edzéshez" (additions). Without: generic view. Not-found state.
- "Te legutóbb": SessionLog has no per-exercise dose → uses prescribed dose of latest completed session containing the exercise; hidden when none. Dev seed now fills `completed`.
- Not built (no behaviour defined yet): design's "Csere másikra", "Könnyítést kérek" buttons; fake media pills omitted. Revisit in T25 (easier variant).
- Validator: spot-check walked all exercises of w01-a, w06-b, w12-c — no errors. Fix round 1: Roll Up mistake em dash (content now matches design), duplicate "kb." on time doses, link tap height. Re-check pass.

## 2026-10-01 · T14 · Player reducer and timing · done
- `domain/player.ts`: buildSteps (one step per set for time items; rep items one step, estSeconds soft guide, advance only on done), createPlayer, playerReducer, toSnapshot, selectors (currentStep, upNext, remainingMs, progress, blockProgress, completedExerciseIds, elapsedMs excl. pauses).
- 10 s skippable transition between every step incl. sets (doubles as rest; plan silent on set rest). In transition `index` = upcoming step.
- Frozen tab: tick crosses at most one boundary; next timer restarts from `now` → never silently skips exercises.
- useEasier marks all remaining sets of the item done + records exerciseId. skip ≠ done (skipped not in completed).
- PlayerSnapshot revised: `{sessionId, index, at, endsAt?|pausedRemaining?, doneSteps, usedEasier, elapsedMs}`. Restore always lands paused; expired time step restarts full duration. UI (T17) dispatches restore after createPlayer and saves toSnapshot at transitions/pauses.

## 2026-10-01 · T15 · Dexie database and player resume store · done
- `data/db.ts` Dexie v1: logs `++id, sessionId, finishedAt`; settings `id` (single row); player out-of-line key `active`. `data/settings.ts` getSettings / idempotent initSettings(today) / saveSettings; `data/player.ts` save/load/clear snapshot + `useSnapshot()` (undefined loading, null none).
- `platform/storage.ts` requestPersistence (feature-detected, never throws), called once in main.tsx.
- Follow-up T18: useSettings/useLogs still stubs; nothing calls initSettings at app start yet → wire in T18 (start date must be persisted on first run).

## 2026-10-01 · T16 · Wake lock and sound · done
- `platform/wakeLock.ts` createWakeLock() {acquire, release, status: native|fallback|none}, idempotent, re-acquire on visible; `useWakeLock(active)` hook. `platform/sound.ts` unlockAudio() (call from Indítás tap), beep('tick'|'go'), chime() — synthesised oscillator tones. `platform/visibility.ts` onVisible/onHidden/isVisible.
- Fallback video uses 2×2 canvas.captureStream() (no ffmpeg → no mp4 asset). TODO: verify on iPhone (M3 manual check); if screen still sleeps without native wake lock, add tiny looping mp4 to public/.

## 2026-10-01 · T17 · Player screen · done
- `screens/PlayerScreen` + `player/{usePlayer,PlayerHeader,PlayerBody,PlayerControls,stepDose}`; reducer gained `finish` action + `finishSummary()`. 250 ms clock in screen layer, tick on visible; snapshot saved on every real state change and on hidden, cleared on finish.
- Audio unlock on Player's first play tap (keeps platform/ inside Player; costs one extra tap after overview "Indítás"). Beeps 3-2-1 once per phase/index/second; chime at step end.
- Today: snapshot for hero session → "Folytatás" main button, "Edzés megnyitása" small link.
- Finish: navigate replace to /finish/:id with router state `FinishSummary {sessionId, startedAt, finishedAt, durationSec, completed, usedEasier}`. T19 must handle missing state (reload on /finish) → e.g. redirect to Today.
- Validator fix round 1: restored paused transition showed "Kész" (bug) → hidden; finish link colour #3F5675; finish link shown in idle (no confirm, goes to Today). Re-check pass.
- Follow-up: no "use easier" button in player UI (reducer supports it; design has none) → consider in T25.

## 2026-10-01 · T18 · Session logs · done
- `data/logs.ts`: saveLog (validates; strips id; no de-dup by sessionId), listLogs, live hooks. `useLogs()` now `SessionLog[] | undefined` (undefined = loading → screens render null, no empty flash); dev `?devDone=N` replaces stored logs with seeded ones.
- `useSettings` live from Dexie with defaults fallback; `initSettings(new Date())` on app start persists start date on first run. `Settings.reminderEnabled?` (absent = on); Today reminder toggle persisted.
- Follow-ups: T19 decide re-doing a session → second log (completion-based schedule unaffected); T21 e2e should confirm reminder toggle persists across reload.

## 2026-10-01 · T19 · Finish screen · done
- `screens/FinishScreen` + `finish/{StatTile,RatingPicker,AreaChips}`; pure `domain/finish.ts` (RATING_OPTIONS, AREA_OPTIONS Has/Hát/Far/Comb/Váll/Nyak, DEFAULT_RATING 3, buildLog, streakWithPending, exerciseCount).
- Missing/mismatched router state → redirect to `/`. "Pont jó" preselected per design; areas start EMPTY (design sample shows "Has" selected — not copied, would bias logs). Textarea 16px. Save: saveLog → clearSnapshot → navigate('/', replace), double-tap guarded. Re-doing a session adds another log.
- Validator pass: log saved with ő/ű intact, snapshot cleared, Today advances to w01-b, 1/36, streak 1.
- Minor: save button not pinned to bottom (page scrolls, 998px). Follow-up question for user: a session ended immediately via "Edzés befejezése" (0 exercises) still counts as done and advances the program — consider requiring ≥1 completed step or a warning.
