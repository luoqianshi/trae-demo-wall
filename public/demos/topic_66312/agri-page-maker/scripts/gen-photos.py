"""
AI 图片生成配置脚本（用于 GenerateImage 工具）。

尺寸对齐规则（与网页 CSS aspect-ratio 一致，避免图片被拉伸变形）：
  - Hero 主图: aspect-ratio:4/3 → landscape_4_3 (1152x864)
  - 产地画廊: aspect-ratio:4/3 (grid 2x2) → landscape_4_3 (1152x864)
  - 产品信息图: 120x120 正方形 → square_hd (1024x1024)
  - 卖点配图: 无固定比例 → landscape_16_9 (1280x720)
  - 吃法图: grid 2x2, aspect-ratio:1/1 → square_hd (1024x1024)
  - 收尾圆形图: 160x160 圆形 → square_hd (1024x1024)
"""


def build_photos_config(product_name, product_type, origin, template="T1"):
    region = origin.get("region", "")
    climate = origin.get("climate", "")
    scene = origin.get("scene_keywords", region)
    configs = []

    # === 1. Hero 主图 ===
    # 网页: aspect-ratio:4/3; object-fit:cover; width:100%
    configs.append({
        "filename": "hero.jpg",
        "prompt": (
            f"E-commerce hero banner: Fresh {product_name} beautifully arranged on rustic wooden surface, "
            f"soft natural window light from the left, shallow depth of field, water droplets, "
            f"{scene} atmosphere, professional food photography, warm earthy tones, "
            f"landscape 4:3 composition, no text, no watermark, no illustration, realistic photography"
        ),
        "image_size": "landscape_4_3"
    })

    # === 2. 产地画廊 (4张) ===
    # 网页: .gallery .item {aspect-ratio:4/3} + object-fit:cover
    for i, label in enumerate([
        f"Aerial view of {product_name} orchards in {region}, rolling hills with morning mist",
        f"Inside a modern greenhouse in {region}, rows of {product_name} plants growing, sunlight streaming",
        f"Local farmers hand-picking ripe {product_name} in {region} orchard, traditional woven baskets",
        f"Freshly harvested {product_name} displayed at local market in {region}, vibrant colors"
    ], 1):
        configs.append({
            "filename": f"origin-{i}.jpg",
            "prompt": (
                f"{label}, "
                f"{climate} landscape, documentary photography style, "
                f"landscape 4:3 composition, no text, no watermark, realistic photography"
            ),
            "image_size": "landscape_4_3"
        })

    # === 3. 产品信息 ===
    # 网页: 120x120px 正方形
    configs.append({
        "filename": "info-1.jpg",
        "prompt": (
            f"Close-up of {product_name} showing texture and details, "
            f"studio lighting with soft shadows, neutral background, "
            f"macro food photography, fresh and appetizing, "
            f"landscape 4:3 composition, no text, no watermark, realistic photography"
        ),
        "image_size": "landscape_4_3"
    })

    # === 4. 卖点 1~4 ===
    # 网页: 无固定 aspect-ratio，max-width:100% 自然显示
    feature_prompts = [
        f"Cross-section of {product_name} revealing juicy interior, macro photography, studio lighting",
        f"{product_name} arranged in traditional woven basket, rustic wooden table, natural window light",
        f"Panoramic view of {region} mountains with {product_name} plantations, dramatic sky, golden hour",
        f"Sliced {product_name} arranged artistically on marble surface, overhead flat lay, natural daylight"
    ]
    for i, prompt in enumerate(feature_prompts, 1):
        configs.append({
            "filename": f"feature-{i}.jpg",
            "prompt": (
                f"{prompt}, "
                f"landscape 16:9 composition, no text, no watermark, realistic photography"
            ),
            "image_size": "landscape_16_9"
        })

    # === 5. 百变吃法 (4张) ===
    # 网页: .gallery grid 2x2, aspect-ratio:1/1
    usage_prompts = [
        f"Fresh {product_name} served on elegant white plate, minimalist styling, natural light",
        f"Colorful salad featuring fresh {product_name}, vibrant vegetables, wooden bowl",
        f"{product_name} dessert or cooked dish on ceramic plate, warm ambient lighting",
        f"Fresh {product_name} juice in glass with ice, condensation droplets, bright natural light"
    ]
    for i, prompt in enumerate(usage_prompts, 1):
        configs.append({
            "filename": f"usage-{i}.jpg",
            "prompt": (
                f"{prompt}, "
                f"square 1:1 composition, no text, no watermark, realistic photography"
            ),
            "image_size": "square_hd"
        })

    # === 6. 故事/收尾圆形图 ===
    # 网页: .circle {width:160px;height:160px;border-radius:50%}
    configs.append({
        "filename": "story-circle.jpg",
        "prompt": (
            f"Artistic arrangement of {product_name} with {scene} elements, "
            f"dramatic side lighting, dark moody background, "
            f"editorial food photography, cinematic composition, "
            f"landscape 4:3 composition, no text, no watermark, realistic photography"
        ),
        "image_size": "landscape_4_3"
    })

    return configs


def get_photo_config_for_section(section_name, product_name, origin):
    all_configs = build_photos_config(product_name, "", origin)
    for cfg in all_configs:
        if cfg["filename"].replace(".jpg", "") == section_name:
            return cfg
    return None


if __name__ == "__main__":
    test_origin = {
        "region": "Xinjiang",
        "climate": "continental dry climate",
        "scene_keywords": "Xinjiang highland orchard"
    }
    configs = build_photos_config("Xinjiang Small White Apricot", "fruit", test_origin, "T1")
    print(f"Generated {len(configs)} photo configs:")
    for cfg in configs:
        print(f"  {cfg['filename']}: {cfg['image_size']}")
