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
