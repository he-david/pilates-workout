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
