# Step 4 · Visual DNA V6

> **扣子版说明**：这是 6 步流水线的第 4 步。**必须**同时加载 `assets/theme-tokens.json`（在主 Skill 目录下），把所有 token 整合进 `style_lock.json`。后续 Step 5/6 要复用 style_lock 整段。

Use this visual system for Chinese handdrawn technical PPT image pages.

## Positioning

Create refined handdrawn technical explanation images: small exact Chinese text, fine ink lines, light pastel marks, sparse characters, clear structure, and a premium Chinese article/teaching-note feeling.

Do not create generic business templates, cute slide decks, big-title quote cards, dense whiteboards, or poster-like full-page illustrations.

## Canvas

- Final output is a complete raster image.
- **All pages are 16:9, no exceptions** (preferred 1920x1080). This includes cover images, body illustrations, and standard deck pages. Never use 21:9, 4:3, or any other ratio.
- Use very light warm white paper, near `#FBFAF5`, with only extremely subtle grain. Avoid yellow, beige, old paper, or tea-stained paper.
- Default to no full-page border. Do not draw a rectangular frame around the page unless the user explicitly asks for a card/bordered look.
- Keep only tiny notebook marks at the corners: faint grey grid, dots, ruler ticks, or construction lines. These marks should feel incidental and very quiet.
- Keep the central diagram small and refined:
  - Body illustration diagram: about 50-60% of page width and 35-45% of page height.
  - Cover metaphor: about 50-55% of page width.
- Use large negative space. The page should feel like a premium article illustration, not a filled PPT canvas.
- **No page numbers anywhere on the page.** The page number convention has been removed.
- **No characters, no silhouettes, no tiny reader figures anywhere on the page.** The lower-right corner stays empty.
- **The right-top corner carries exactly one small thematic decoration per deck** — a small iconic object tied to the deck's topic, or a quiet abstract mark (tiny star, curled arrow, ruled ledger line, dot constellation). The decoration is decided once at the deck level and **reused on every page of that deck**. Different decks can use different decorations. The decoration must be small, elegant, and consistent within one deck.
- **Name the decoration explicitly in the prompt.** Vague phrases like "small decoration" cause the model to substitute (a lightbulb request becomes a compass or clock). Always write the exact noun, e.g. "small LIGHTBULB doodle (NOT compass, NOT clock, NOT any other object)" or "constellation of three small dots (NOT a star, NOT a checkmark)". Keep it under ~5% of page width in the very corner.

## Master Consistency

Lock these constants across a multi-page deck before generating:

- Same paper tone and grain.
- Same no-border shell by default; if a border is explicitly requested, use the same very faint border style across all pages.
- No page numbers on any page.
- Same title treatment: centered, hard-pen Chinese, medium size, with one short pale blue underline.
- Same subtitle treatment: one short line below the title, smaller than title.
- Same title optical size across body pages. Do not enlarge short titles just because they contain fewer characters.
- Same diagram line weight and hatching style.
- Same pastel label fills: light blue, sage green, pale peach, soft lavender.
- No characters anywhere. No silhouettes, no tiny reader figures, no characters in any corner. The lower-right corner stays empty.
- The right-top corner has one small thematic decoration for the whole deck, designed once and reused on every page.
- Same margin rhythm: wide margins, calm center, no full-bleed crowding.

If multiple pages feel like different illustrators made them, revise prompts before regenerating.

## Deck Shell And Variation

Treat a deck as one fixed shell plus variable semantic diagrams:

- Fixed shell: paper tone, grain, no-border default, no page numbers, centered title, pale blue title underline, subtitle position, corner construction marks, wide margins, and overall text scale.
- Variable middle: the object diagram, flow direction, grouping, arrows, labels, and metaphor chosen for the slide's content.
- Variable right-top decoration: one small thematic decoration per deck, decided once at the deck level and reused on every page. Different decks can use different decorations.
- Vary layouts by semantic archetype, not by changing the deck identity. A horizontal process, contrast page, loop, and layered map can feel different while still sharing the same shell.
- Do not create variety by moving the title, adding/removing borders, switching font mood, adding characters, changing title scale, or changing the palette.

## Typography

The final image contains the visible Chinese text. Keep the text short, exact, and manually checkable.

Style:

- Heading: clear handdrawn hard-pen Chinese title feel
- Body: small readable hard-pen Chinese
- Avoid calligraphic brush style, dramatic flyaway strokes, childish doodle fonts, and heavy advertising type.

Scale guidance:

- Cover title: medium-large, but only on cover pages
- Body illustration title: medium and restrained
- Normal slide title: medium
- Section labels: small-medium, often inside small pastel marker labels
- Node text: small
- Annotations: smaller
- Bottom takeaway: only slightly stronger than body text

Avoid huge typography. The page should feel authored and precise, not like a cheap poster.
Short-title trap: when a title has only 4-6 Chinese characters, explicitly keep the same optical size as other body pages. Do not let the image model make it a cover headline.

## Text Budget

For reliable Chinese rendering, prefer:

- Title: 5-12 Chinese characters.
- Subtitle: 3-12 Chinese characters, or three short terms separated by `·`.
- Main labels: 2-5 labels per slide.
- Captions/annotations: 0-6 short items, each usually 2-6 Chinese characters.

If a slide needs more text than this, split it or move detail into speaker notes/adjacent pages.

## Color

- Background: very light warm white paper, near `#FBFAF5`
- Line: near black, fine handdrawn stroke
- Pastels: very light blue, sage green, peach, lavender
- Accent: small red-orange star, dot, or underline only when useful

Avoid:

- Large saturated blocks
- Shadows
- Gradients
- Neon colors
- Product-card styling

## Line And Shape

- Use fine handdrawn lines.
- Lines should be stable but slightly irregular.
- Use careful line-art objects: nets, sieves, drawers, cards, cabinets, funnels, clocks, dials, trays, shelves, documents, magnifying glasses.
- Use small rounded boxes, tags, speech bubbles, dashed notes, arrows, tables, and diagrams only when they explain the content.
- Most containers should be paper-filled with thin outline; use pastel fills sparingly.
- Prefer detailed object drawing and hatching over flat vector icons.
- Arrows should be slim and quiet.
- Props such as cards, books, screens, trays, and documents should be blank or contain only simple line marks unless the text is listed in `Required text only`. Avoid fake English, fake URLs, and filler writing.

## Characters

Characters are not used in this style.

Rules:

- No characters of any kind on any page.
- No silhouettes. No "tiny reader figure". No character in any corner, including the lower-right.
- No reader proxies, no metaphor actors, no decorative people.
- If the content feels lonely, fill the space with objects, props, or right-top thematic decoration instead of a character.

## Slide Density

Prefer:

- Two to four main structure groups
- Four to twelve micro modules
- Zero to three annotations
- One main idea per slide

Avoid:

- Three to five huge colored cards
- Oversized bottom quotes
- Heavy bottom conclusion boxes
- Overcrowded bullet text
- Decorative people or icons that do not explain anything

## Text In Images

For final image-page decks:

- Chinese text is part of the final generated page.
- Keep required text short: title, subtitle, section labels, and a few micro labels.
- Always provide a `Required text only` list in the image prompt.
- Avoid long paragraphs, dense bullets, URLs, code blocks, and any non-essential text.
- If text accuracy is poor, regenerate with fewer words or split the page.
- If exact Chinese text is still wrong after simplification, keep the accepted visual direction and add the required text with deterministic post-processing. This is a text-fidelity repair, not the primary visual-generation method.

## Reference-Style Anchor

For blog/article cover and body illustrations, use `assets/reference-handdrawn-course-style.png` as the active style anchor:

- Near-white warm paper, not yellow.
- No full-page border.
- Faint corner grid/dot construction marks only.
- Small, refined central object diagrams with large negative space.
- Medium restrained body-page titles with short pale blue underlines.
- Fine ink-and-pencil object drawings with delicate hatching.
- No characters, no silhouettes, no tiny reader figure anywhere on the page.
- The right-top corner has one small thematic decoration (iconic small object or abstract mark), decided once for this deck and reused on every page.
- No page numbers, no "01/10" corner marks.
- No extra text beyond the required visible Chinese text.

Legacy bordered PPT references are archived outside active assets. Do not load or imitate them unless the user explicitly asks for the older bordered page style.

## Final Look

The page should feel like a technical author carefully drew a compact concept illustration on near-white paper, then polished it enough for paid teaching, article publishing, or commercial delivery.
