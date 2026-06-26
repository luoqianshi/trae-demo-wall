# Image Selection Plan Contract

`image_selection_plan.json` is the single source of truth for all handbook images. Final Markdown and HTML image output must be derived from this plan through `scripts/pipeline_engine.py`; do not handwrite image galleries in parts.

## When To Read

Read this file before creating, reviewing, repairing, or merging `image_selection_plan.json`, especially for:

- 5.1 color/product-still images
- 5.2 studio/model images
- 5.3 outdoor/lifestyle images
- 5.4 outfit plans and AI-generated outfit assets
- 8.1 fabric, swatch, certificate, and report assets

## Global Requirements

Every selected image must include:

- `id`
- `review_decision: "selected"`
- `confirmed_by_original_image: true`
- `review_basis: "original_image"`
- `original_path`
- `visual_judgement`

Every excluded candidate must include:

- `id`
- `review_decision: "excluded"`
- `exclude_reason`
- `visual_judgement`

Each section should track:

- `candidate_count`
- `selected_count`
- `excluded_count`
- `coverage_mode`
- `coverage_note`

All selected and excluded candidates must map back to actual contact-sheet IDs and product-directory relative paths.

## 5.1 Color Display

5.1 is limited to product stills, flat lays, or color-card images.

Required selected-item fields:

- `confirmed_no_model: true`
- `confirmed_product_still_or_color_card: true`
- `title` or `display_name`

Reject or exclude:

- model-wearing photos
- lifestyle/studio model photos
- reports or certificates
- unrelated material details
- collage or multi-view images unless they are clearly product-color still comparisons

`visual_judgement` must explicitly support the static/product-still claim. Do not mark a model-wearing image as a static product image.

## 5.2 Studio Display

5.2 is for single studio photos of a model wearing the product.

Required selected-item fields:

- `confirmed_single_photo: true`
- `confirmed_no_collage: true`
- `confirmed_studio: true`
- `confirmed_model_wearing_product: true`

Exclude multi-view boards, collages, 1:1-folder images, square-like layout boards, and images where the product is not visually worn by the model.

## 5.3 Outdoor And Lifestyle Display

5.3 must be grouped by scene or shooting style, such as "户外场景" or "通勤场景".

Each scene group should include:

- `candidate_count`
- `selected_count`
- `excluded_count`
- `items`
- `excluded_candidates`

Each selected image must be a single non-collage photo and should include the relevant scene confirmation field, such as `confirmed_outdoor: true`.

All valid candidates must be accounted for in either `items` or `excluded_candidates`.

## 5.4 Outfit Plan Display

Each outfit plan must include:

- `name`
- `candidate_group`
- `candidate_count`
- `selected_count`
- `excluded_count`
- `style_tag`
- `style_color`
- `description`
- `accessory_note`
- `effect_image`
- `items`
- `excluded_candidates`

The `effect_image` must include:

- `id`
- `confirmed_outfit_effect: true`
- `visual_type`
- `title`
- original-image review fields

Allowed `effect_image.visual_type` values:

- `single_outfit_photo`
- `outfit_multi_view_board`
- `outfit_flatlay`

Each selected outfit item must include:

- `confirmed_accessory_or_matching_item: true`
- `observed_object`
- `item_type`
- `display_name`
- `title`

Name items from visual evidence: describe `observed_object` first, then derive `item_type` and `display_name`. Do not cross-map glasses to shoes, bags to accessories, or any other mismatched category.

Within one outfit, the same physical item may appear only once. Use `display_name` as the primary dedupe key and `item_type` as the secondary key.

### Avoid Category Duplication (No Innerwear for Tops)

If the main product itself belongs to a top garment category (such as jackets, coats, sweatshirts, or t-shirts), do not include another top garment (like camisoles, tanks, or undershirts under the item_type `innerwear`) as a matching item.

Instead, replace them with non-garment accessories such as glasses/sunglasses (under `item_type: "glasses"` or `accessory`), hats, or belts. This prevents visual layering overlap and physical clutter when generating or displaying flat-lay assets.

## AI-Generated 5.4 Assets

AI-generated outfit effect images are allowed only as flat-lay assets.

Required fields for AI-generated `effect_image`:

- `asset_origin: "ai_generated"`
- `visual_type: "outfit_flatlay"`
- `reference_image_ids`
- `generation_prompt`
- `confirmed_outfit_effect: true`

The prompt must explicitly require:

- flat lay or flatlay
- top-down, top down, 俯拍, or 顶视
- no model, no human, 无模特, 不要真人, or 无人

`reference_image_ids` must point to selected 5.1 product-still/color images. Generated assets may originate in `.scratch/ai_generated_outfits/`, but `image-snippet` must materialize renderable output to a stable product-directory relative path such as `自动生成素材/AI搭配图/{id}.png`.

Do not generate model-wearing AI outfit photos by default.

## 8.1 Fabric And Qualification Assets

8.1 accepts fabric swatches, report thumbnails, certificates, and qualification images that are relevant to the product.

Common selected-item fields:

- `confirmed_fabric_or_report: true`
- `visual_type`

Use valid visual types defined by the engine. Fabric samples should use `fabric_swatch`. Report or certificate thumbnails should use the closest allowed report/certificate type. Do not exclude core fabric swatches or wash-label/certificate assets when they are required for the two-column qualification layout.

## Minimal Example

```json
{
  "5.1 颜色展示": {
    "candidate_count": 1,
    "selected_count": 1,
    "excluded_count": 0,
    "coverage_mode": "all_valid_candidates",
    "coverage_note": "已逐张打开原图复核，产品静物图全部入选",
    "items": [
      {
        "id": "#001",
        "review_decision": "selected",
        "confirmed_by_original_image": true,
        "review_basis": "original_image",
        "original_path": "颜色/black_front.jpg",
        "visual_judgement": "打开原图确认：黑色产品正面平铺静物图，白色背景，无模特，显示正面版型",
        "confirmed_no_model": true,
        "confirmed_product_still_or_color_card": true,
        "title": "黑色"
      }
    ],
    "excluded_candidates": []
  },
  "5.4 搭配方案展示": [
    {
      "name": "户外休闲风",
      "candidate_group": "搭配1",
      "candidate_count": 2,
      "selected_count": 2,
      "excluded_count": 0,
      "style_tag": "Clean Fit",
      "style_color": "#34C759",
      "description": "搭配说明文案",
      "accessory_note": "配饰亮点",
      "effect_image": {
        "id": "outfit_001",
        "review_decision": "selected",
        "confirmed_outfit_effect": true,
        "asset_origin": "ai_generated",
        "visual_type": "outfit_flatlay",
        "reference_image_ids": ["#001"],
        "generation_prompt": "flat lay outfit board, top-down view, no model, no human",
        "visual_judgement": "打开原图确认：平铺搭配效果图，包含本款产品与推荐单品，无真人无模特"
      },
      "items": [
        {
          "id": "#021",
          "review_decision": "selected",
          "confirmed_by_original_image": true,
          "review_basis": "original_image",
          "original_path": "搭配/鞋子.jpg",
          "visual_judgement": "打开原图确认：白色帆布鞋正侧面独立产品照，纯白背景",
          "confirmed_accessory_or_matching_item": true,
          "observed_object": "白色帆布鞋正侧面独立产品照，纯白背景",
          "item_type": "鞋",
          "display_name": "白色帆布鞋",
          "title": "白色帆布鞋"
        }
      ],
      "excluded_candidates": []
    }
  ]
}
```

## Validation

Run:

```bash
python scripts/pipeline_engine.py --action validate-plan --target_dir "{product_dir}" --image_plan "{product_dir}/.scratch/image_selection_plan.json"
```

Plan validation must pass before `image-snippet`, `part-skeletons`, `assemble`, or final delivery.
