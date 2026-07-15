# Step 5 · Prompt Patterns

> **扣子版说明**：这是 6 步流水线的第 5 步。**必须**用 Step 4 输出的 `style_lock.json` 整段复用，每个页面 prompt 都不能漏掉 style lock 段。同时把 `Required text only` 控制在 6 个以内短中文。

Use these patterns when generating final image-model PPT pages or planning slide content.

## Deck Style Lock

Write this once before generating a multi-page deck. Reuse the same style language in every page prompt.

```text
Refined commercial Chinese handdrawn technical article/PPT illustration.
Complete raster image on very light warm white paper, near #FBFAF5, with extremely subtle grain.
No full-page border and no rectangular frame unless explicitly requested.
No page numbers anywhere on the page.
Centered medium Chinese title with one pale blue handdrawn underline.
Small subtitle under title when needed.
For body pages, keep title size optically consistent across pages; do not enlarge short titles.
Fine black ink and pencil linework, delicate hatching, stable but slightly irregular.
Muted pastel marker labels: pale blue, sage green, peach, lavender.
Sparse corner construction marks only: faint pale grey grid, dots, ruler ticks, measurement lines.
Generous negative space, calm premium teaching-note feeling.
Mostly small object-based diagrams. No characters at all by default — no silhouettes, no tiny reader figures, no characters in any corner.
Right-top corner: a small thematic decoration (iconic small object tied to the deck's topic, or a quiet abstract mark like a tiny star, a curled arrow, a ruled ledger line, a constellation of dots). **Decide it once for the whole deck at Step 4 and reuse it on every page.** Different decks can use different decorations.
Props should be blank or contain only simple line marks unless their text appears in Required text only.
Avoid full-page border, yellow paper, beige paper, giant fonts, cheap poster look, childish doodles, many characters, thick marker strokes, dense bullets, corporate template style, shadows, gradients, neon, watermark, gibberish text, English filler, vector icons, flat sticker-style icons, silhouette figures, page numbers, corner page marks like "01/10".
```

## Reference Match Clause

Use this when the user wants the reference-image look or a commercial style sample.

```text
Match the approved article-illustration shell: near-white warm paper, no full-page border, no page numbers, no characters or silhouettes, centered restrained handwritten Chinese title, one pale blue underline, small subtitle beneath, one small thematic decoration in the right-top corner (decided once for the deck and reused on every page), sparse corner grid/dot construction marks, fine ink-and-pencil object drawings with delicate hatching, small refined central diagram, and large negative space. Keep the outer shell consistent across pages; only vary the central diagram layout according to the content.
```

## Page Role Locks

Use exactly one page role in every production prompt. **All pages are 16:9, no 21:9, no exceptions.**

```text
Page role: cover image.
Canvas: 16:9, preferred final size 1920x1080.
Title may be medium-large but still elegant and restrained.
Main metaphor occupies about 50-55% of page width.
No page number.
```

```text
Page role: body illustration.
Canvas: 16:9, preferred final size 1920x1080.
This is not a cover page.
Title is medium and restrained, optically consistent with the other body pages.
Even if the title is short, do not enlarge it.
Central diagram occupies about 50-60% of page width and 35-45% of page height.
No page number.
```

## Complete Page Image Prompt

Use for each final page image. Use the built-in image generation model directly. Do not substitute script-generated layouts for style trials.

```text
Use case: productivity-visual.
Asset type: one complete Chinese handdrawn technical article/PPT image, final raster page.
Preferred final size: 1920x1080 (16:9). All pages must be 16:9, no 21:9, no other ratios.

Create page <number>/<total> of a coherent deck.
Page role: <cover image | body illustration | standard deck page>
Title exactly: <short Chinese title>
Subtitle exactly: <optional short Chinese subtitle>
Archetype: <cover metaphor | left-right contrast | horizontal process | circular mechanism | branching map | classification map | matrix table | main metaphor | takeaway>
Main point: <one sentence>

Apply the deck style lock: <paste compact style lock>.
Reference match clause: <paste when needed>.

Composition:
<specific layout based on semantics. Describe object-based handdrawn diagram, not generic boxes. Use real concrete objects (e.g. a wedding ring, a small house, a notebook) — never vector icons, flat sticker-style icons, or silhouette figures.>
Scale lock:
<central diagram 50-60% page width and 35-45% page height for body; 50-55% for cover. Title same optical size as other body pages.>

Right-top corner decoration:
<one small thematic decoration, decided once for the whole deck at Step 4 and reused on every page. Either an iconic small object tied to the deck's topic, or a quiet abstract mark (tiny star, curled arrow, ruled ledger line, dot constellation). Keep it small and elegant. Paste the exact same decoration description into every page prompt in this deck.>

Required text only:
<list every visible Chinese text item exactly. Keep this list short.>

Avoid:
full-page border, yellow paper, beige paper, oversized central objects, oversized body-page title, heavy bottom boxes, extra text, invented micro-labels, gibberish, English, watermark, crowded composition, many people, childish cartoons, thick outlines, saturated colors, corporate template look, vector icons, flat sticker-style icons, silhouette figures, page numbers, "01/10" corner marks.
```

## 16:9 Cover Image Prompt (default — replaces the old 21:9 cover)

Use when the user asks for a blog/article cover or a deck cover. Always 16:9.

```text
Use case: Chinese article/deck cover image.
Asset type: one complete 16:9 Chinese handdrawn technical cover image, final raster page.
Preferred final size: 1920x1080.

Page role: cover image.
Title exactly: <title>
Subtitle exactly: <subtitle>
Archetype: cover metaphor
Main point: <one sentence>

Apply the deck style lock: <paste compact style lock>.
Apply the cover role lock: <paste cover role lock>.

Composition:
<one small refined central metaphor, occupying about 50-55% page width, with wide empty margins. Use real concrete objects, never vector icons or silhouette figures.>

Right-top corner decoration:
<one small thematic decoration, decided once for the whole deck at Step 4 and reused on every page. Either an iconic small object tied to the deck's topic, or a quiet abstract mark (tiny star, curled arrow, ruled ledger line, dot constellation). Keep it small and elegant. Paste the exact same decoration description into every page prompt in this deck.>

Required text only:
<short exact visible Chinese text list>

Avoid:
full-page border, yellow paper, beige paper, large poster composition, giant title, heavy boxes, extra text, invented micro-labels, English, gibberish, watermark, vector icons, flat sticker-style icons, silhouette figures, page numbers, "01/10" corner marks.
```

## 16:9 Body Illustration Prompt

Use for article body images and regular explanatory pages.

```text
Use case: Chinese blog/article body illustration.
Asset type: one complete 16:9 Chinese handdrawn technical body illustration, final raster page.
Preferred final size: 1920x1080 if supported.

Page role: body illustration.
Create page <number>/<total> of a coherent illustration set.
Title exactly: <title>
Subtitle exactly: <subtitle>
Archetype: <left-right contrast | horizontal process | circular mechanism | branching map | classification map | matrix table | main metaphor | takeaway>
Main point: <one sentence>

Apply the deck style lock: <paste compact style lock>.
Apply the body illustration role lock: <paste body role lock>.

Composition:
<small refined central semantic diagram. Keep the diagram about 50-60% page width and 35-45% page height. Use real concrete objects, never vector icons or silhouette figures.>

Right-top corner decoration:
<one small thematic decoration, decided once for the whole deck at Step 4 and reused on every page. Either an iconic small object tied to the deck's topic, or a quiet abstract mark (tiny star, curled arrow, ruled ledger line, dot constellation). Keep it small and elegant. Paste the exact same decoration description into every page prompt in this deck.>

Required text only:
<short exact visible Chinese text list>

Avoid:
full-page border, yellow paper, beige paper, large central objects, oversized title, heavy bottom quote box, extra text, invented micro-labels, English, gibberish, watermark, crowded composition, vector icons, flat sticker-style icons, silhouette figures, page numbers, "01/10" corner marks.
```

## Compact Three-Station Body Page

Use when the content is a process, pipeline, or three-part framework in the approved article-illustration style.

```text
Composition: three calm stations across the middle with slim arrows between them.
Each station has a pastel marker label above, a detailed handdrawn object in the center, and one tiny semantic caption below with a short colored underline.
Keep object drawings more detailed than icons: pencil hatching, fine contour lines, small construction details.
Leave wide margins and quiet negative space.
Keep the three-station group compact: about 55-60% page width on body illustrations.
No full-page border. Near-white warm paper. Faint corner marks only.
No characters, no silhouettes, no tiny reader figure anywhere on the page.
Right-top corner carries a small thematic decoration (iconic small object or abstract mark), designed per topic.
```

## Slide Content Compression

Use this prompt internally:

```text
Compress this source section into one slide.
Keep exactly one main point.
Choose the best semantic archetype.
Return a title, 2-4 content blocks, optional annotations, required visible text, and a complete page image brief.
Do not produce a bullet dump.
```

## Multi-Page Consistency Pass

Before generating page images, check:

```text
- Does every page share the same paper, no-border shell, title underline, line weight, and pastel family?
- Are ALL pages 16:9? (no 21:9, no other ratios)
- Are body-page titles optically the same size, including short titles?
- Is the central diagram compact enough, or did the model fill the page?
- Are layouts semantic rather than randomly different?
- Are there any characters, silhouettes, or tiny reader figures on any page? (must be zero)
- Is the right-top corner decoration present on every page, and exactly the same across all pages of this deck?
- Is the right-top decoration small and elegant, not a big icon?
- Is each page's Required text only list short enough for clean image rendering?
- Are props free of fake English, URLs, and filler text?
- Are there any vector icons or flat sticker-style icons? (must be zero — use real concrete objects)
- Are there any page numbers or "01/10" corner marks? (must be zero)
```

## Hard Rules — Apply to Every Page

These are non-negotiable. Any prompt that violates them must be rewritten before generation.

```text
1. No vector icons, no flat sticker-style icons, no SVG-style graphics.
   If a concept is hard to render as a single concrete object, pick the closest single-word
   substitute first (e.g. "成家立业" → "婚礼" / "wedding ring") and draw ONE object.

2. Canvas is ALWAYS 16:9 (1920x1080). No 21:9, no 4:3, no portrait, no other ratios.
   This applies to cover pages, body pages, and any new page role.

3. No silhouettes. No "tiny reader figure". No character in any corner.
   If you wrote "剪影" or "silhouette" in any prompt, delete it.

4. No page numbers. Never write "01 / 10" or "页码" in any prompt.
   Never paste "01/10" corner marks in any reference match clause.

5. The lower-right corner is empty. No tiny reader, no character, no decoration there.

6. The right-top corner carries exactly ONE small thematic decoration per deck.
   It can be a small iconic object tied to the deck's topic, OR a quiet abstract mark
   (tiny star, curled arrow, ruled ledger line, dot constellation).
   It must be small and elegant, not a big icon.
   **It must be decided once at Step 4 (style lock) and pasted verbatim into every
   page prompt of that deck.** Different decks can use different decorations.
```

## Anti-Failure-Mode Prompt Block — Required for Every Page

The 6 Hard Rules above cover the visual shell. They do **not** cover known
content-generation failure patterns. The image model has recurring failure modes on
specific content shapes. Every production prompt **must** append this block (or the
subset relevant to that page) right after `Required text only`, before the closing
`Avoid:` line. Missing this block is the #1 reason first-pass output gets rejected.

```text
CRITICAL ANTI-FAILURE RULES (apply to this page):

CRITICAL: absolutely NO page numbers, NO digits like X/Y, NO fractions like 1/12,
NO corner page marks anywhere. Upper-left corner is completely empty.

CRITICAL: write the FULL title from the source script. NEVER truncate the title.
Even if the title is long, render all characters. Do NOT shorten "Transformer: 一切背后的引擎"
to "Transformer".

CRITICAL: multi-word English terms like "Context Window", "RAG", "AI Agent" must
stay as a SINGLE label, NEVER split into two separate circles, boxes, or nodes.

CRITICAL: never combine two Chinese labels into one. In circular loops with N
boxes, each box contains EXACTLY ONE label. NEVER write merged words like
"使用重复" / "理解工具" / "检查使用".

CRITICAL: never repeat the same label or phrase in multiple places. Each label
appears EXACTLY ONCE on the page.

CRITICAL: spell every English word correctly. No typos like "Tontext",
"Tempeext", "Agetn". Read each English word back to yourself before submitting.

CRITICAL: for N-step processes, label steps "Box 1: ..., Box 2: ..., ..., Box N: ..."
with DIFFERENT labels. Never use the same label in two boxes.

CRITICAL: each item in any list or callout box must be on its OWN line, separated
by line breaks. NEVER compress all items into one continuous line.

CRITICAL: use simple math format. NEVER use long Chinese formulas like
"90% × 3 步 = 73%". Use "每步 90% / 3 步: 73% / 10 步: 35%" instead.

CRITICAL: right-top corner decoration must be the EXACT noun from the style lock.
If the style lock says "small LIGHTBULB doodle", write exactly that, and add
"(NOT compass, NOT clock, NOT any other object)" to prevent substitution.
```

### When to include which rule

- **All pages**: page numbers, full title, no-repetition, spelling, no-merge.
- **Pages with a circular loop or N-step process**: also include no-combine and
  no-duplicate-step-label rules.
- **Pages with multi-line callouts or list boxes**: also include the line-break rule.
- **Pages with a math / percentage expression**: also include the simple-math rule.
- **Pages with an English multi-word label (e.g. "Context Window", "AI Agent")**:
  also include the no-split rule.
- **Cover pages listing N tags**: also include the no-duplicate-tag rule with the
  exact enumerated list ("1) Token, 2) Embedding, ..., N) Agent").

### What to do if a rule still fails after one regeneration

1. Strengthen the CRITICAL prefix from one line to three lines.
2. Move the failing rule from the bottom of the prompt to right under the
   `Composition:` block, so it sits next to the affected region.
3. Reduce the visual complexity (fewer callout boxes, fewer loop boxes).
4. If still failing on a specific English/Chinese token: switch to a simpler
   synonym or accept the visual direction and use Text Fidelity Fallback
   (deterministic overlay) for that one label.

## Text Fidelity Fallback

Use only after the image direction is accepted and image-generated Chinese text remains incorrect.

```text
Regenerate or reuse the accepted visual with blank reserved spaces for every exact Chinese label.
Do not invent any placeholder writing.
Leave clean pale marker labels or empty paper areas where text will be overlaid.
After generation, add only the Required text items with deterministic local post-processing, matching the small hard-pen Chinese title/body style as closely as practical.
Re-check that no duplicate, fake, or misspelled generated text remains visible.
```

## Archetype-Specific Prompt Templates

These three templates cover the most failure-prone archetypes. For each, paste the
**complete template** into the `Composition:` block of your page prompt, then
fill in the bracketed `<...>` slots with the exact Chinese / English labels from
the source script. The mandatory anti-failure-mode lines are already woven in.

### A. Horizontal / Vertical N-Step Flow

Use for: linear processes, pipelines, RAG, ETL, agent runtimes with a clear sequence.

```text
Composition: a horizontal left-to-right flow of EXACTLY N boxes connected by
slim arrows. Each box is a hand-drawn rounded rectangle, paper-filled, with
a thin outline.

Write the EXACT label inside each box, one label per box, never two:
Box 1: <label1>
Box 2: <label2>
Box 3: <label3>
Box 4: <label4>
Box 5: <label5>          (extend or shrink to N boxes as needed)

CRITICAL: every label in the N boxes must be DIFFERENT. Never repeat a label
across two boxes (e.g. do not write "检索" in both Box 3 and Box 5).
CRITICAL: do not invent extra boxes. If the source has 5 steps, draw 5 boxes.
CRITICAL: arrows are slim and quiet, no bold arrows.
```

### B. Circular Loop (N-Step Cycle)

Use for: agent loops, feedback cycles, training loops, attention cycles.

```text
Composition: a circular flow loop drawn clockwise in the center of the page.
The loop has EXACTLY N SEPARATE labeled boxes around its perimeter. Each box
contains EXACTLY ONE label, never two.

Position the N boxes like this (rotate the positions to fit your N):
- TOP: <label1>
- RIGHT: <label2>
- BOTTOM: <label3>
- LEFT: <label4>
- Arrow from LEFT back to TOP, label the arrow itself: <label5>

In the center of the loop, write: <loop-name>

CRITICAL: each of the N boxes contains exactly ONE label. NEVER combine two
labels into one box, and NEVER write merged words like "使用重复" / "理解工具" /
"检查使用". If two Chinese labels are visually adjacent, the model will try to
merge them — keep the labels short and clearly separated by arrow segments.
CRITICAL: do not duplicate any label. If N=5, you must have 5 DIFFERENT labels.
CRITICAL: if a label is a curved arrow, write it ON the arrow, not in a new box.
```

### C. Multi-Item Callout / List Box

Use for: takeaways, reliability math, pros/cons, "应用场景" lists, comparison boxes.

```text
Composition: a hand-drawn rounded callout box in the <position>. Write the
box header on the first line, then list the items, one per line:

Header: <header-text>
- <item 1>
- <item 2>
- <item 3>
- <item 4>
- <item 5>          (extend as needed)

CRITICAL: each item is on its OWN line, separated by visible line breaks. NEVER
compress all items into one continuous line of text.
CRITICAL: do not duplicate any item. If the source list has 4 bullets, draw 4 bullets.
CRITICAL: if a line contains a number or percentage (e.g. "73%"), keep the
percentage attached to its label. Do not let the model split "73%" and "成功"
onto different visual layers.
```

### D. Cover Page with N Tags Around a Central Metaphor

Use for: course/deck covers that visually preview the N concepts.

```text
Composition: a single central hand-drawn metaphor (e.g. an open brain, a lightbulb,
a tree) occupying about 50-55% of page width. Around the metaphor, place EXACTLY N
small tag labels, evenly distributed.

The N tags, in clockwise order starting from 12 o'clock, are:
1) <tag1>
2) <tag2>
3) <tag3>
4) <tag4>
5) <tag5>
6) <tag6>
7) <tag7>
8) <tag8>
9) <tag9>
10) <tag10>          (use exactly N, no more no fewer)

CRITICAL: each of the N tags appears EXACTLY ONCE. Never duplicate a tag, never
omit a tag. Count them out before submitting.
CRITICAL: every English word in the tags must be spelled correctly. Common
mistakes: "Tontext" (for "Context"), "Tempeext" (for "Temperature"), "Agetn"
(for "Agent"). Read each tag back to yourself.
CRITICAL: if a tag is multi-word English ("Context Window", "AI Agent"), write
it as ONE tag — never split into two adjacent tags.
```

### E. Single Big Concept (Body Page)

Use for: 70% of body pages — one central concept, one main diagram, supporting labels.

```text
Composition: a single central hand-drawn diagram (object, abstract shape, or
small diagram group) representing the concept, occupying 50-60% of page width
and 35-45% of page height. Around the diagram, place 2-5 small supporting labels
or callouts, each with one short phrase from the source script.

CRITICAL: write the FULL title from the source script, never truncate. Even
long titles like "Transformer: 一切背后的引擎" must render all characters.
CRITICAL: each supporting label appears exactly once. Do not repeat.
```

## Pre-Flight Checklist (paste at the end of every prompt)

```text
PRE-FLIGHT CHECK:
- [ ] Full title from source script? (not truncated)
- [ ] No "X/Y" or "01/12" page numbers?
- [ ] Multi-word English labels (e.g. "Context Window") written as ONE tag, not split?
- [ ] Loop/process boxes all have DIFFERENT labels?
- [ ] Callout box items each on their own line?
- [ ] Right-top corner decoration is the EXACT noun from style lock, with
      "(NOT compass, NOT clock)" appended if it's a lightbulb?
- [ ] Style lock and reference match clause pasted verbatim from Step 4?
- [ ] No vector icons, no silhouettes, no characters, no reader figures?
- [ ] All pages 16:9 (1920x1080)?
```
