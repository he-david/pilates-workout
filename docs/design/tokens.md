# Design tokens

Extracted from `docs/design/01..07-*.dc.html`. Every colour literal in the designs is listed. Tailwind names live in the `@theme` block of `src/index.css` (`bg-bg`, `text-ink-muted`, `rounded-xl`, `text-md`...).

## Colours

| Token | Hex | Role / where used |
|---|---|---|
| bg | `#EEF5FB` | page background |
| bg-tint | `#E3F2FC` | alternate screen background (player/finish) |
| surface | `#FFFFFF` | cards, nav, inputs |
| surface-muted | `#E4EEF7` | chips, pills, neutral fills |
| border | `#D6E3EF` | 1px card/pill borders |
| border-strong | `#C2D2E3` | selected/emphasised outlines |
| border-dashed | `#B5C6D9` | dashed placeholder borders, empty rings |
| divider | `#C9E2F5` | section top borders |
| track | `#DCE7F2` | progress ring track |
| bar-empty | `#CFE3F3` | empty bar in charts |
| ink | `#16233A` | primary text, icons |
| ink-soft | `#364559` | secondary strong text (values) |
| ink-body | `#3F5675` | body text, section meta |
| ink-muted | `#4F5F75` | muted text, headings of sections |
| ink-faint | `#7E8DA3` | numbering, disabled, dashed-ring text |
| accent | `#8EC9EE` | primary brand colour, buttons, active |
| accent-ink | `#405A6B` | text on accent (accent x 0.45; not in design files, per plan) |
| accent-soft | `#8EC9EE40` | accent at 25% alpha, soft fills |
| accent-light | `#B3DCF5` | lighter accent (palette option) |
| accent-deep | `#5FAEE3` | stronger accent (palette option) |
| lavender | `#C3CDF2` | palette option |
| pink | `#F6BED1` | secondary accent (palette option) |
| pink-soft | `#FBE1EA` | pink chip / warning card fill |
| pink-tint | `#FBE4EC` | pink illustration background |
| pink-border | `#F4B6CB` | border on pink-soft |
| pink-bar | `#F1A9C0` | pink bars |
| pink-strong | `#E98DAE` | palette option |
| streak | `#D9759A` | streak / flame icon |
| streak-ink | `#B04673` | streak number |
| warn-ink | `#9C3D63` | "Figyelj rá" text on pink-soft |
| warn-deep | `#6E2A47` | darkest pink text |
| link | `#2B6CA3` | links (hover `link-hover` `#1D4E7A`) |
| overlay | `rgba(255,255,255,0.55)` | translucent white overlay (use inline) |

## Radii

3px `xs`, 4px `sm`, 10px `md`, 14px `lg`, 16px `xl`, 18px `2xl`, 20px `3xl`, 24px `4xl`; `rounded-full` for 999px pills and 50% circles. One-offs 5px, 6px, 12px, 22px: use arbitrary values.

## Type scale

Plus Jakarta Sans, weights 400, 500, 600 (30 uses), 700 (43), 800 (65). Sizes: 10 `2xs`, 11 (arbitrary), 12 `xs`, 13 `sm`, 14 `base`, 15 `md`, 16 `lg`, 17 `xl`, 18/21/24 (arbitrary), 22 `2xl`, 28 `3xl`, 30 `4xl`, 54 `timer`. Letter-spacing: -0.02em display (`tracking-tight-display`), 0.05em / 0.06em uppercase labels.

## Spacing

Common gaps: 2, 4, 6, 8, 10, 12, 14, 18 px. Common padding: 18px card, 12px 14px, 5px 10px chips, 6px 12px. Use Tailwind default scale (1 = 4px) or arbitrary values.

## Shadows

None used in the designs; elevation is expressed with 1px borders.

## Layout

Viewport 390x844 design frame; use `100dvh`, safe-area insets on header and bottom nav.
