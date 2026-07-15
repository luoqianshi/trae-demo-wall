---
name: outfit-ai-design
description: Use this skill to generate well-branded interfaces for AI穿搭助手. Contains colors, type, fonts, assets, and UI kit for prototyping mobile UIs.
user-invocable: true
---
# AI穿搭助手 Design Skill

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts, copy assets out and create static HTML files. If working on production code, read the rules here to become an expert in designing with this brand.

## Quick map
- `README.md` — brand context, content fundamentals, visual foundations (read first)
- `colors_and_type.css` — drop-in CSS variables for colors, type, radius, shadow, spacing
- `css.json` — structured token understanding source
- `components/index.json` — component index + cross-component patterns
- `preview/` — small HTML cards illustrating foundations and components
- `library-consumption.json` — recommended downstream read order

## Essentials at a glance
- Brand primary `#c45d3e` (terracotta). Warm, earthy, approachable — no cold blues, no neon accents.
- Radius: **8 / 12 / 16 / 24px** — soft organic feel; `24px` for cards, pill (`9999px`) for chips and ghost buttons.
- Default control height 40px (md button), spacing base 4px (`--space-1`), card padding 24px.
- Fonts: **Caveat** (display / handwritten), **Noto Serif SC** (headings), **Noto Sans SC** (body), **Geist Mono** (code).
- Voice: Chinese-first, warm and friendly, fashion-conscious. Expect copy like "确认穿搭", "职场", "休闲", "约会".
- Shadows: warm-brown tinted (`rgba(92,61,46,...)`), 5 levels — whisper-quiet at rest (`shadow-1` cards), modal overlay (`shadow-5`).
- Signature pattern: pill-shaped chips with terracotta active state for outfit category filtering; cards with `24px` radius and cream surface (`#fdf8f3`).

## Components
| Slug | Name | Key Insight |
|---|---|---|
| button | Button | Rounded terracotta primary (16px radius), 4 variants: primary / secondary / outline / ghost |
| card | Card | 24px radius, cream `#fdf8f3` surface, warm shadow, 3 variants: default / outlined / elevated |
| bottom-nav | BottomNav | 4-tab mobile nav with terracotta active state, 56px height, `12px` inner radius |
| input | Input | Clean rounded field with warm cream background, terracotta focus ring (`3px` primary-container glow) |
| avatar | Avatar | Circular with warm border accent, sm/md/lg sizes, optional `accent` ring (`3px` primary) |
| chip | Chip | Pill filter tags for outfit categories; terracotta fill for active, warm surface for default |
