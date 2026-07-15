# Step 6 · Output And Quality Gates

> **扣子版说明**：这是 6 步流水线的第 6 步。每张图生成后**必须**逐项检查下面的 Content / Layout / Visual / Dimension / Image-Text / Contact-Sheet 6 个 Gate，不通过则按规则重生成。

Use this before final delivery.

## Output Modes

### Blueprint

Use when the user wants planning first or the source is not ready for production.

Include:

- Deck type
- Assumptions
- Slide count
- Slide-by-slide blueprint
- Missing inputs or risks

### Final Image Deck

Use by default when the user asks for PPT/PPTX/slides/courseware/配图/效果图 as finished visual page images.

PPT/PPTX wording alone does not mean editable output. Treat it as PPT-style final PNG page images. Editable PPTX, image-based PPTX, PDF export, and object-level presentation modification are out of scope for this skill.

Deliver:

- Role-specific PNG pages, **always 16:9 (1920x1080 preferred)**. Covers and body pages share the same ratio. No 21:9, no 4:3, no other ratios.
- Contact sheet for quick review when there are multiple pages
- Short blueprint summary
- Assumptions and verification

### Polished Delivery

Use when the user asks for polished delivery.

Deliver when feasible:

- Final PNG pages
- Contact sheet
- Speaker notes
- Visual style notes

## Content Quality Gate

Check:

- Each slide has one main point.
- Slide order creates a coherent story.
- Claims are supported by source material or clearly marked as assumptions.
- Terminology is consistent.
- Examples are not fabricated as facts.
- The audience level is appropriate.

## Layout Quality Gate

Check:

- Archetype matches slide semantics.
- Layouts vary by content semantics, but share one master visual language.
- Non-cover titles are not oversized.
- Short body-page titles are not enlarged into cover headlines.
- Central body diagrams stay compact, usually 50-60% page width and 35-45% page height.
- Slides are not just bullet lists.
- Diagrams explain, not decorate.

## Visual Quality Gate

Check:

- Small readable Chinese text
- Fine handdrawn lines
- Light pastel marks
- **No characters at all on the page** (no silhouettes, no tiny reader figure, no characters in any corner)
- Near-white warm paper, not yellow or beige.
- No full-page border unless explicitly requested.
- Faint corner construction marks only; no heavy frame.
- **No page numbers** anywhere on the page.
- Centered title, one pale blue underline, are consistent.
- **Right-top corner carries one small thematic decoration, identical across every page of the deck**.
- **Lower-right corner is empty.**
- Pages feel like one illustrator and one deck, not unrelated images.
- **No vector icons, no flat sticker-style icons** — diagrams use real concrete objects with hatching and detail.
- No large card-heavy look
- No poster-like full-page illustration look
- No heavy bottom quote/conclusion boxes
- No shadows, gradients, neon, or corporate template feel

## Dimension Gate

Check:

- Page images match their role: **all pages must be 16:9 or very close. No 21:9, no 4:3, no other ratios.**
- Actual pixel dimensions are reported honestly.
- If strict delivery size is requested, normalize accepted images to 1920x1080 with high-quality resampling, then verify the normalized images still look sharp.
- Do not claim 1920x1080 if the generated source files are a different native size.

## Image Text Gate

Check:

- Required Chinese text appears and is readable.
- Text is short enough for the image model to render cleanly.
- No fake filler text, random English, URLs, watermarks, or extra labels.
- Props such as books, screens, documents, and cards are blank or only contain line marks unless their text is explicitly listed.
- If exact text fails, reduce text and regenerate.
- If exact text remains wrong after simplification, use deterministic text overlay on the accepted generated base image, then re-check readability, alignment, and style consistency before delivery.

## Contact Sheet Gate

For multiple images, make a contact sheet and inspect it before delivery:

- Backgrounds match and are not drifting yellow.
- Page shells match: no-border default, no page numbers, same title position, same underline style.
- Body-page titles look optically equal even when character counts differ.
- Diagrams have similar visual weight and do not suddenly become huge.
- **All pages share the same 16:9 aspect ratio.**
- Right-top corner decoration is identical on every page of this deck.
- No page has any character, silhouette, or tiny reader figure.

## Final Report

Mention:

- Output folder and contact sheet path
- Page count
- Deck type
- Major assumptions
- Verification performed
- Remaining risks
