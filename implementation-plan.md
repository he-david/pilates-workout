# Tónus – Implementation Architecture (MVP)

Oct 1, 2026 · @Heda

## Summary

Build Tónus as an **installable web app (PWA)** that she adds to her iPhone Home Screen from Safari. All data stays on the phone, and there is **no backend, no login, no App Store and no Apple developer account**.

- **Stack:** Vite + React + TypeScript + Tailwind, with Dexie (IndexedDB) for storage. This is the stack AI coding tools generate most reliably.
- **Hosting:** a static site on Cloudflare Pages or GitHub Pages, deployed on every push. It is free.
- **Content:** the exercises and the 36-session program live in typed files in the repo. Changing the program means editing a file, not using an admin UI.
- **Logic that matters:** two small pure modules, the progression engine and the workout player. Both are covered by unit tests, because they are where AI-written bugs would hurt.
- **Time to first install:** about one day for a skeleton on her phone. A complete MVP takes 6 milestones (see Milestones).

## Platform choice

A PWA is the only option that runs on her iPhone without an Apple account, a Mac or a yearly fee. Each feature the design needs works in Safari for a Home Screen app.

| Option                 | What it takes to get onto her iPhone                                                           | Cost                        | AI-generation fit                         | Verdict                           |
| ---------------------- | ---------------------------------------------------------------------------------------------- | --------------------------- | ----------------------------------------- | --------------------------------- |
| **PWA (Vite + React)** | Open a URL in Safari, then Share › Add to Home Screen                                          | €0                          | Excellent: the most common web stack      | **Chosen**                        |
| Native SwiftUI         | Mac + Xcode. A free account re-signs the app every 7 days; TestFlight needs the $99/yr program | $99/yr or weekly re-install | Good, but slower loop and simulator-bound | Too much friction for one user    |
| Expo / React Native    | Expo Go for testing; a standalone install still needs an Apple developer account               | $99/yr for a real install   | Good                                      | Native power the app doesn't need |

What a native app would add (Live Activities, Apple Health sync, reliable local notifications) is not in the MVP. If one becomes essential later, the domain modules described below can be reused in an Expo app.

## Architecture overview

The whole app runs on the phone. The web host only delivers files, and the only data that ever leaves the device is a backup she exports herself.

&#91;embedded content: runtime architecture · 6 modules on the phone, 3 outside\]

Screens call `domain/` for every decision and `data/` for every save, so the logic stays testable without a browser. Only the Player screen uses `platform/`.

## Tech stack

Every choice is the mainstream default, so AI tools have seen it thousands of times and rarely invent APIs for it.

| Concern     | Choice                                   | Why this one                                                                      |
| ----------- | ---------------------------------------- | --------------------------------------------------------------------------------- |
| Build       | Vite                                     | Instant dev server, one-line PWA plugin                                           |
| UI          | React 19 + TypeScript (strict)           | Types catch most AI mistakes at compile time                                      |
| Styling     | Tailwind CSS                             | Design tokens from the canvas map 1:1 to a theme; no CSS files to drift           |
| Routing     | React Router (7 routes)                  | Matches the 7 screens of the design                                               |
| Storage     | Dexie + `dexie-react-hooks`              | IndexedDB with a tiny typed API; `useLiveQuery` makes screens update after a save |
| UI state    | React state + one reducer for the player | No global store needed for one user                                               |
| PWA         | `vite-plugin-pwa`                        | Generates the manifest, icons and offline service worker                          |
| Tests       | Vitest + Testing Library                 | Same config as Vite; fast unit tests for the engine and player                    |
| Lint/format | ESLint + Prettier                        | Keeps AI output consistent across sessions                                        |
| Font        | Plus Jakarta Sans, self-hosted           | Has Hungarian ő/ű; works offline                                                  |

Deliberately left out: a backend, auth, a UI component library, state libraries (Redux, Zustand) and server-side rendering.

## Data model

There are two kinds of data. **Content** is read-only and ships in the code. **User data** is written by the app into IndexedDB. Stats such as streak, total time and personal records are always computed from logs, never stored.

```ts
// content (src/content/*.ts) — versioned in git
type Exercise = {
  id: string; // 'roll-up'
  nameHu: string; // 'Felgördülés'
  nameEn: string; // 'Roll Up'
  focus: string[]; // ['has', 'gerinc']
  equipment: ("mat" | "ball" | "ring" | "band" | "weights")[];
  steps: string[]; // with breathing cues
  mistakes: string[];
  easier: string;
  harder: string;
  cue: string; // one line shown in the player
  media?: string; // optional video/image path
};

type Dose =
  | { kind: "reps"; reps: number; perSide?: boolean }
  | { kind: "time"; seconds: number; sets?: number };

type SessionItem = {
  exerciseId: string;
  dose: Dose;
  estSeconds: number;
  isNew?: boolean;
};

type ProgramSession = {
  id: string; // 'w03-b'
  week: number; // 1..12
  slot: "A" | "B" | "C";
  phase: 1 | 2 | 3;
  title: string; // 'Core & gerinc'
  isAssessment?: boolean; // weeks 4, 8, 12
  warmup: SessionItem[];
  main: SessionItem[];
  cooldown: SessionItem[];
};

// user data (IndexedDB via Dexie)
type SessionLog = {
  id?: number;
  sessionId: string; // which ProgramSession
  startedAt: string;
  finishedAt: string; // ISO
  durationSec: number;
  completed: string[]; // exerciseIds finished
  usedEasier: string[]; // exerciseIds done in the easier variant
  rating: 1 | 2 | 3 | 4 | 5;
  areas: string[]; // 'Has', 'Hát', ...
  note?: string;
  bestHoldSec?: Record<string, number>; // e.g. plank
};

type Settings = {
  id: "me";
  startDate: string;
  trainingDays: number[];
  reminderTime?: string;
};
```

The program **advances by completion, not by calendar**. The next session is the first one without a log, so a missed Thursday shifts the plan instead of skipping a workout.

## Program content and progression

The 12-week plan is a fixed list of 36 sessions in `program.ts`. A small pure function then tweaks the next session based on her ratings. The plan itself gets harder; the engine only fine-tunes it.

**Built-in progression (authored in the content):**

- Week to week: +1–2 reps or +5 s on holds for the same exercises.
- Phase 2 (weeks 5–8): adds ball, ring and band variants and longer holds.
- Phase 3 (weeks 9–12): adds the advanced mat repertoire (Teaser, Rollover, Corkscrew) and shorter rests.
- Weeks 4, 8 and 12 are assessment weeks. They repeat key tests (plank hold, clean Roll Up reps) so the Log screen has real progress numbers.
- Every session is checked by a test: estimated total of 48–52 min, with an 8 / 34 / 8 split.

**Adaptive rules (`domain/progression.ts`)**, applied only to the next session:

| Her rating                    | Rule         | Effect on the next session                          |
| ----------------------------- | ------------ | --------------------------------------------------- |
| 1 · Nagyon könnyű             | Bump         | +1 rep or +5 s on every main-block item             |
| 2 · Könnyű, twice in one week | Pull forward | Swap in the harder variant of 2 main exercises      |
| 3 · Pont jó                   | None         | As written                                          |
| 4 · Nehéz                     | Offer easier | Easier variant pre-selected on exercises marked new |
| 5 · Túl nehéz                 | Hold         | Same doses as the last session, holds −20%          |

Signature: `prescribe(session: ProgramSession, history: SessionLog[]): Prescription`. It has no I/O and no dates beyond the logs, so it can be tested exhaustively with Vitest tables.

**Content authoring:** let AI draft `exercises.ts` and `program.ts` from this spec in a separate session, then have her (or a Pilates instructor) review the list before coding the screens. The content is the part where AI errors would be physical, not visual.

## Workout player

The player is a pure reducer (`domain/player.ts`) plus a thin React screen. Time is computed from timestamps, so the countdown stays correct even when iOS throttles or freezes the page.

- **Timer:** store `endsAt` (ms). Remaining time = `endsAt − Date.now()`, redrawn every 250 ms and recomputed on `visibilitychange`. Never count down by decrementing a number in `setInterval`.
- **Reps vs time:** time-dosed items (plank, The Hundred) count down and auto-advance. Rep-dosed items (Roll Up, 8×) show the estimated time as a soft guide and advance with a large **Kész** button. Counting reps by timer would feel wrong.
- **Transitions:** a 10 s "Következő: …" break between exercises, skippable.
- **Resume:** each transition saves `{ sessionId, index, endsAt | pausedRemaining }` to IndexedDB. If the app is closed mid-workout, Today shows "Folytatás".
- **Sound:** Web Audio beeps (3-2-1 and an end chime), unlocked by the tap on **Indítás**. iOS blocks audio that isn't started by a tap. iOS Safari has no vibration API, so there are no haptics.
- **Screen awake:** request a Screen Wake Lock while running and re-acquire it on `visibilitychange`. Test this on her phone in milestone 3. If it fails in Home Screen mode on her iOS version, fall back to the muted looping-video trick (the NoSleep.js approach).

## iPhone specifics

Most PWA problems on iOS are known in advance; put each of these into the first milestone's checklist.

| Topic              | What to do                                                                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Separate storage   | The Home Screen app has its own storage, apart from Safari tabs. She should install first and only ever open the app from the icon.                                    |
| Data durability    | Home Screen apps are exempt from Safari's 7-day storage purge. Still call `navigator.storage.persist()` and offer a JSON export (see Deployment).                      |
| Icon and look      | 180×180 `apple-touch-icon` PNG, `display: standalone`, `theme_color` baby blue, `apple-mobile-web-app-status-bar-style: default`.                                      |
| Notch and home bar | `viewport-fit=cover` and `env(safe-area-inset-*)` padding on the header and bottom nav.                                                                                |
| Layout height      | Use `100dvh`, not `100vh`; add `overscroll-behavior: none` so the page doesn't bounce.                                                                                 |
| Accidental zoom    | Inputs ≥ 16 px font (the Jegyzet field), `touch-action: manipulation` on buttons.                                                                                      |
| Reminders          | Web Push needs a push server, so it is out of the MVP. The reminder card offers an `.ics` file instead: a repeating Mon/Thu/Sat 18:30 event she adds to Calendar once. |
| Updates            | The service worker shows a "Új verzió – frissítés" banner instead of updating silently mid-workout.                                                                    |

## Project structure

Small files with one job each. An AI session can then load exactly the files a task touches, and `domain/` never imports React or Dexie.

```text
tonus/
├─ CLAUDE.md                 # rules for every AI session (see next section)
├─ docs/
│  ├─ architecture.md        # this plan
│  └─ design/                # exported canvas screens + tokens.md
├─ public/                   # icons, apple-touch-icon, fonts
├─ src/
│  ├─ content/
│  │  ├─ exercises.ts        # ~40 Exercise records
│  │  └─ program.ts          # 36 ProgramSession records
│  ├─ domain/                # pure TS, 100% unit-tested
│  │  ├─ types.ts
│  │  ├─ progression.ts      # prescribe()
│  │  ├─ player.ts           # reducer + timing helpers
│  │  ├─ schedule.ts         # next session, week view, streak
│  │  └─ stats.ts            # totals, records, rating trend
│  ├─ data/
│  │  ├─ db.ts               # Dexie schema (versioned)
│  │  ├─ logs.ts             # saveLog, useLogs …
│  │  └─ backup.ts           # export / import JSON
│  ├─ platform/              # browser APIs, isolated
│  │  ├─ wakeLock.ts
│  │  ├─ sound.ts
│  │  └─ calendar.ts         # .ics reminder
│  ├─ ui/                    # Button, Card, Chip, Ring, BottomNav, Icon
│  ├─ screens/               # one file per design screen
│  │  ├─ Today.tsx  Program.tsx  SessionOverview.tsx
│  │  └─ ExerciseDetail.tsx  Player.tsx  Finish.tsx  Log.tsx
│  ├─ app.tsx                # routes
│  └─ main.tsx
└─ tests/                    # mirrors domain/ and content/
```

## AI-assisted build workflow

Use Claude Code in the repo, one milestone per session. The tests and type checker do the reviewing, so you read diffs rather than every line.

**`CLAUDE.md` holds the standing rules:**

- The stack and commands: `npm run dev | test | typecheck | lint | build`.
- Done means typecheck, lint and tests all pass. Never mark a task done otherwise.
- `domain/` is pure TypeScript: no React, no Dexie, no `Date.now()` (time is passed in). Every function there gets tests.
- Browser APIs only in `platform/`. Storage only in `data/`.
- No new dependency without asking. No backend, no auth.
- UI text is Hungarian and written inline. Exercise names come from `content/`.
- Design source of truth: `docs/design/*.dc.html` and `tokens.md`. Copy the colours and spacing from there rather than inventing them.
- Dexie schema changes bump the version and add a migration.

**Session loop:**

1. Start in plan mode with the milestone text from below. Approve the plan.
2. Let it write tests for `domain/` first, then the code.
3. Run it on your phone (see Deployment). Use the screenshot to fix anything that looks off.
4. Commit the milestone, then start a fresh session for the next one so context stays small.

**Guardrail tests worth having from day one:**

- Every `exerciseId` in `program.ts` exists in `exercises.ts`.
- Every session's estimated total is 48–52 min.
- There are exactly 36 sessions, 3 per week.
- The progression rule table is covered row by row.
- Optional: a Playwright smoke test at a 393×852 viewport that clicks Today → Indítás → Kész ×14 → Mentés.

## Milestones

The app is on her phone after milestone 1 and usable for real workouts after milestone 4. Each milestone is one AI session and ends with a check done on the iPhone.

1. **Skeleton on the phone:** scaffold Vite/React/TS/Tailwind, PWA manifest and icons, deploy, install.
   - [ ] Icon on her Home Screen; opens full-screen, baby blue status bar, works in airplane mode after the first launch.
2. **Content and browsing screens:** `types.ts`, `exercises.ts`, `program.ts` (reviewed), plus Today, Program, Session overview and Exercise detail rendered from content.
   - [ ] All 36 sessions browsable; guardrail content tests pass.
3. **Workout player:** reducer, timestamp timer, rep vs time items, transitions, resume, sound, wake lock.
   - [ ] A full 50-min session done on the phone: screen stays on; closing the app mid-session resumes in place.
4. **Finish and logging:** Finish screen (rating, areas, note), Dexie logs, completion-based "next session".
   - [ ] A saved session shows as done on Today and Program, and the next one becomes today's.
5. **Log and stats:** streak, total time, calendar, rating trend, records from the assessment weeks.
   - [ ] Numbers match a hand count after a week of real use.
6. **Adaptive progression and polish:** `prescribe()` wired into the overview and player with a "Módosítva" badge, JSON export/import, `.ics` reminder, update banner.
   - [ ] Rating a session 5 visibly shortens the next session's holds; an exported file opens in the Files app.

## Deployment, install and backups

Pushing to `main` publishes the app; every other branch gets its own preview URL for trying changes on your phone first.

- **Hosting:** Cloudflare Pages connected to the GitHub repo. Build `npm run build`, output `dist/`, free `*.pages.dev` HTTPS URL. GitHub Pages works too.
- **Testing on a phone:** use the branch preview URLs, not `vite --host` over Wi-Fi. Service workers and wake lock need HTTPS, and plain LAN URLs are HTTP.
- **Install (once, on her iPhone):** open the `main` URL in Safari, tap Share › Add to Home Screen, then open it from the icon only.
- **Previews vs. her app:** preview URLs are different sites with empty storage, so testing there never touches her logs.
- **Backup:** Log › "Mentés exportálása" writes all logs and settings as one JSON file through the iOS share sheet. She can save it to iCloud Drive. "Visszaállítás" imports it. The Log screen shows the last backup date and nudges after 30 days.
- **Cost:** €0. An optional custom domain is the only possible expense.

## Out of scope for the MVP

These are left out on purpose. Each has a clear path later if real use asks for it.

| Not in MVP                             | Path if needed later                                                                                |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Exercise videos                        | Record short clips with her phone and drop them in `public/media/`; `Exercise.media` already exists |
| Push notifications                     | Web Push from a tiny worker (Cloudflare Workers) once the app is on the Home Screen                 |
| Sync across devices or a second user   | Swap Dexie for Dexie Cloud or a small Supabase table; the `data/` layer is the only change          |
| Apple Health, Live Activities, widgets | Port the screens to Expo and reuse `domain/` and `content/` unchanged                               |
| Program editor in the app              | Edit `program.ts` and push; it deploys in a minute                                                  |
| After week 12                          | Add a second 12-week block as more content, with the same engine                                    |
