# AI穿搭助手 Design System

A design system for **AI穿搭助手** — a warm, feminine, hand-drawn line art style WeChat mini program for daily outfit recommendations. The system wraps terracotta-and-rosegold warmth into a mobile-first component library, deliberately soft and approachable rather than sleek or minimal.

## Source

From-scratch generation, inspired by hand-drawn line art bakery/cafe apps (D Bakery, Honobono, Beiye Corner Coffee), adapted for fashion context and female users.

## What this design system covers

- **Foundations** — 6 color scales (terracotta, rosegold, brown, success, warning, info, error) plus neutrals and a warm cream surface system; Noto Serif SC / Noto Sans SC / Caveat typography; 8-step spacing; 4-step radius; 5-layer elevation with brown-tinted shadows.
- **Components** — 6 mobile components: Button (4 variants), Card (3 variants), BottomNav, Input, Avatar, Chip.
- **Preview pages** — One HTML card per component with live CSS rendering.

---

## CONTENT FUNDAMENTALS

### Voice & tone

Warm, friendly, approachable. Like a close friend helping you pick an outfit — never preachy, always encouraging. The language is bilingual CN-first; Chinese carries the emotional weight, English appears only in functional labels. Playful but not childish — think thoughtful stylist, not cartoon mascot. Address the user directly ("你"), use question format for discovery prompts, confirmation format for actions.

### Concrete copy examples (from component previews)

- **Action button**: "确认穿搭" — direct, personal, makes the AI recommendation feel like a mutual decision.
- **Navigation**: "首页", "今日穿搭", "搭配方案", "我的" — short, scannable, task-oriented without being cold.
- **Filter chips**: "职场", "休闲", "约会", "运动" — lifestyle-first categories, not abstract taxonomy.
- **Card title**: "米色风衣+白衬衫" — concrete outfit pairings as content, not generic labels.

### When generating copy

- Keep it personal and warm. Address the user directly with "你".
- Use question format for discovery prompts ("今天穿什么？"), confirmation format for actions ("确认穿搭", "换一套").
- Category labels should feel like lifestyle descriptors ("职场", "约会"), not system tags.
- Keep nav items to 2-4 characters for mobile density.

---

## VISUAL FOUNDATIONS

### Color

**Brand primary:** `#c45d3e` (terracotta-500) — a warm, earthy red-orange that sits between coral and clay. It carries the entire brand identity: not aggressive, not pastel, just comfortably warm. Used for primary buttons, active nav tabs, selected chips, and card CTAs. On-primary text is pure white (`#ffffff`).

**Brand accent:** `#d45a6e` (rosegold-500) — a muted rose that pairs with terracotta without competing. Used for secondary elements and warm highlights.

The system carries **7 color scales**, each running 50 through 900 (10 stops): terracotta (primary), rosegold (accent), brown, success, warning, info, and error. Terracotta and rosegold are the brand-defining pair; brown ties them to a warm neutral base; the remaining four are functional semantics.

**Neutrals** lean warm. A 10-stop neutral scale runs from `#fdf8f3` (near-cream) through `#3a2c20` (dark espresso brown). The dominant working values are `#fdf8f3` as the page background, `#ffffff` for card/surface, and `#f0e0cc` as a visible container fill. Text foreground is `#3a2c20` — dark brown rather than pure black, keeping everything warm.

**Semantic mapping:** Success resolves to `#2f7d44` (success-600), warning to `#cc8f24` (warning-600), error to `#a93333` (error-600). These are called at the 600 level in the semantic layer, slightly deeper than their 500 midpoints, ensuring readability on light surfaces.

**Surface system:** Five elevation tiers from `surface-container-lowest` (`#fdf8f3`, same as background) up to `surface-container-highest` (`#e0c9a8`, a visible warm beige). This gives cards and modals a distinct "layer" feel without relying heavily on shadow.

**Vibe:** Imagine a sun-warmed pottery studio. Terracotta clay, dried rose petals, linen cloth, a latte in a ceramic cup. The palette is autumn-adjacent but not seasonal — it reads as cozy year-round. Nothing is cold, nothing is neon, nothing is corporate blue.

### Typography

**Primary face:** **Noto Serif SC** — used for all headings (h1 through h3). The serif choice is deliberate: it softens the UI and evokes the hand-crafted, editorial quality of a fashion magazine spread rather than a tech product. Weights: 700 for h1/display, 600 for h2/h3.

**Body face:** **Noto Sans SC** — the workhorse for body text, captions, labels, eyebrow text, and button copy. Weight 400 for body/lead/caption, 500 for h4 and avatar initials, 600 for eyebrow (uppercase tracking).

**Display / hand-drawn accent face:** **Caveat** — a casual handwriting-style Latin font used at 48px/700 for decorative display text only (`.outfit-display`). This is the "hand-drawn" signature of the brand — sparing use preserves its charm. If Caveat is unavailable, fall back to any cursive system font, but the hand-drawn quality is lost.

**Mono face:** **Geist Mono** — for code or numeric-only contexts (13px/400).

**Scale:** Display 48px, h1 32px, h2 26px, h3 22px, h4 18px, lead 17px, body 15px, mono 13px, caption 12px, eyebrow 11px. The step between body (15px) and caption (12px) is notably large — this is intentional for mobile, where small text must remain legible.

**Line-height:** Tight at the top (display 1.2, h1 1.3) and progressively looser down the scale (body 1.7, lead 1.75). This creates a clear hierarchy where display text feels compact and dense while body copy breathes.

**Font import:** All three primary fonts load via Google Fonts CDN (Caveat, Noto Sans SC, Noto Serif SC). The import is embedded at the top of `colors_and_type.css`. For offline or WeChat mini program environments, these fonts must be bundled or replaced with system equivalents (PingFang SC / STSong for Serif fallback).

### Spacing

Base unit is **4px** (`--space-1`). The scale runs through 8 discrete steps: 4, 8, 12, 16, 24, 32, 48, 64. Notably, there is no 20px or 40px step — the system jumps from 16 to 24 and from 32 to 48. Component heights reference their own sizing tokens independently: buttons at 32/40/48px, inputs at 40px, avatars at 32/40/56px, bottom-nav at 56px. Card padding uses `--space-5` (24px) consistently.

### Radius

Four intentional values, plus a pill catch-all. **8px** (`radius-sm`) appears on small interactive elements where a subtle softening is enough. **12px** (`radius-md`) is the workhorse — used on input fields, bottom-nav container, and tab items. **16px** (`radius-lg`) is the default for buttons, card images, and the bottom-nav outer shell — this is the "comfortably rounded" signature. **24px** (`radius-xl`) is reserved for cards themselves, giving them a distinctive pillow shape. **9999px** (`radius-full`) creates pills — used exclusively on chips, card tags, ghost buttons, and card CTAs. The pattern is clear: the bigger the container, the rounder the corners.

### Shadow / Elevation

Five shadow layers, all tinted with `rgba(92,61,46,...)` — a warm brown that matches the neutral palette rather than using neutral gray.

1. **shadow-1 (Card):** `0 1px 3px rgba(92,61,46,.06), 0 1px 2px rgba(92,61,46,.04)` — barely there, just enough to lift a card from the surface.
2. **shadow-2 (Card Hover):** `0 4px 8px rgba(92,61,46,.08), 0 2px 4px rgba(92,61,46,.04)` — the resting state for elevated cards and the hover state for default cards.
3. **shadow-3 (Float):** `0 8px 20px rgba(92,61,46,.10), 0 4px 8px rgba(92,61,46,.06)` — used for elevated card variants and floating elements.
4. **shadow-4 (Modal):** `0 16px 40px rgba(92,61,46,.14), 0 8px 16px rgba(92,61,46,.08)` — reserved for overlays and modal surfaces.
5. **shadow-5 (Overlay):** `0 24px 56px rgba(92,61,46,.18), 0 12px 24px rgba(92,61,46,.10)` — the heaviest layer, for full-screen overlays.

The dark mode tokens switch to pure black (`rgba(0,0,0,...)`) with higher opacity values, following standard dark-mode shadow conventions.

### Borders

- **1.5px solid** is the default border weight, using `--color-outline-variant` (`#f9f0e6`) for resting state and `--color-primary` (`#c45d3e`) for focus. This slightly-thicker-than-standard weight gives the hand-drawn aesthetic a tangible, craft-paper feel.
- **2px solid** on avatar outlines uses `--color-outline-variant`, bumped to 3px solid with `--color-primary` for the accent variant.
- **3px** primary-color ring on focusable inputs (`box-shadow: 0 0 0 3px` using primary-container) — a soft glow rather than a hard outline.

### Backgrounds

- Page background is `#fdf8f3` — a warm off-white that never reads as clinical.
- Cards and popovers default to pure white (`#ffffff`), creating clear contrast against the warm page.
- The outlined card variant drops shadow entirely in favor of a 1.5px `--color-outline-variant` border — useful for dense layouts where shadows compete.
- Primary-container (`#fdf5f0`, terracotta-50) is the universal "selected light" background — chip active states, avatar accent backgrounds, and focus rings all reference this single token.

---

## COMPONENT PATTERNS

| Component | File | Key Insight |
|---|---|---|
| Button | `components/button.json` | 4 variants (primary/secondary/outline/ghost), 3 sizes. Ghost uses pill radius; all others use `radius-lg`. Primary background is terracotta-500, hover darkens to 600. |
| Card | `components/card.json` | 3 surface variants (default/elevated/outlined). Pillow-shaped at `radius-xl` (24px). Card tags use pill chips on primary-container. |
| BottomNav | `components/bottom-nav.json` | 4-tab layout, 56px height. Active state tints icon + label to primary color. Container uses `radius-lg` with surface-container background. |
| Input | `components/input.json` | Text input + textarea. 40px height, `radius-lg`, focus ring via 3px primary-container glow. Disabled state at 50% opacity. |
| Avatar | `components/avatar.json` | 3 sizes (32/40/56px). Warm variant fills primary-container with on-primary-container text. Accent variant adds 3px primary border + shadow-2. |
| Chip | `components/chip.json` | Pill-shaped filter tags. Default on surface-variant, active on primary. Used for outfit category filtering (职场, 休闲, 约会, 运动). |

---

## INDEX

- `README.md` — this file; brand narrative and visual foundations reference
- `colors_and_type.css` — single drop-in CSS file with all tokens (color, type, spacing, radius, shadow); link directly in production
- `css.json` — structured JSON token export for programmatic consumption
- `components.css` — aggregated component CSS extracted from preview pages
- `components/index.json` — component manifest with slug, category, and variant count
- `components/{slug}.json` — per-component contract (button, card, bottom-nav, input, avatar, chip)
- `preview/component-{slug}.html` — standalone HTML preview cards (6 files)
- `SKILL.md` — AI agent skill entry point
- `library-consumption.json` — recommended downstream file read order

---

## CAVEATS / KNOWN SUBSTITUTIONS

1. **Caveat (hand-drawn font)** is the brand's signature display typeface, but it is a Google Fonts dependency. WeChat mini programs cannot load Google Fonts at runtime — for production, Caveat must be either bundled as a local woff2 or replaced with a native cursive fallback (e.g., system cursive stack). The hand-drawn quality will degrade with system fallbacks.

2. **Geist Mono** is referenced in the token set but has no corresponding Google Fonts import in `colors_and_type.css`. In practice, any monospace font will resolve via the `monospace` generic family. For code display in production, `Menlo` / `Consolas` / `Source Code Pro` are safe substitutions.

3. **Brand context (phase2-brand-analyst.json)** was empty at generation time. All brand personality, voice, and copy observations in this document were derived from token names, component index keyInsightSeed fields, and the task brief — not from a structured brand analyst output. Treat the Content Fundamentals section as inference, not audit.

4. **No icon system.** The bottom-nav preview uses inline Lucide icon references (`data-lucide="home"` etc.) but no icon assets are bundled in the library. For production, an icon set must be sourced separately or the Lucide CDN must be available.

5. **Dark mode tokens exist** in `colors_and_type.css` (`.dark` class) but no preview pages demonstrate dark mode rendering. Dark mode is structurally complete but visually unverified.

6. **No animation tokens.** Transitions are inline in component CSS (`.15s` duration throughout) but not abstracted into reusable tokens. If animation timing needs to be consistent across new components, extract `--transition-fast: .15s` manually.
