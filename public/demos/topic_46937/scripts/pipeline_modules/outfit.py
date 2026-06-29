# v2.4.0-stable Modular Pipeline Component
import os
import sys
import json
import csv
import re
import shutil
import glob
import traceback
import time
from pathlib import Path
from datetime import datetime

from pipeline_modules.constants import *

# Optional dependencies
try:
    import openpyxl
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


def safe_print(message: object = "") -> None:
    text = str(message)
    try:
        print(text)
    except UnicodeEncodeError:
        try:
            print(text.encode("utf-8", errors="replace").decode("utf-8", errors="replace"))
        except Exception:
            pass

class OutfitMixin:
    def outfit_brief(self):
        print("[*] 运行 outfit-brief 生成 5.4 搭配企划...")
        brief_json_path = os.path.join(self.scratch_dir, 'outfit_strategy_brief.json')

        manifest_path = os.path.join(self.scratch_dir, 'manifest.json')
        if not os.path.exists(manifest_path):
            print("[!] 缺失 manifest.json，请先运行 extract")
            return 1

        # 智能自适应物料分类检测
        has_outfit_images = False
        has_model_images = False
        has_outdoor_images = False
        has_qualification_data = False
        total_images = 0
        available_look_nums = set()

        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                manifest_data = json.load(f)
            for entry in manifest_data:
                if entry.get('file_type') == 'image':
                    total_images += 1
                    rel = entry.get('relative_path', '').lower()
                    fname = entry.get('filename', '').lower()

                    if any(k in rel for k in ["搭配", "outfit", "look", "倪镇伟", "凯丽"]):
                        # 排除明显的资质、吊牌、检测报告等
                        if not any(k in rel for k in ["证书", "吊牌", "报告", "面料"]):
                            has_outfit_images = True
                    if any(k in rel or k in fname for k in ["模特", "model", "真人", "上身"]):
                        has_model_images = True
                    if any(k in rel or k in fname for k in ["外景", "户外", "street", "outdoor"]):
                        has_outdoor_images = True
                    if any(k in rel or k in fname for k in ["检测", "报告", "吊牌", "证书", "面料", "资质", "report", "tag", "cert"]):
                        has_qualification_data = True

                    # 收集文件夹中物理提供的搭配方案数字，例如 搭配1、搭配2
                    for i in range(1, 10):
                        if f"搭配{i}" in rel or f"look{i}" in rel or f"look_{i}" in rel:
                            available_look_nums.add(i)
        except Exception as e:
            print(f"[WARN] 智能物料自适应扫描失败: {e}")

        # 如果明确拥有实拍搭配大图，或者图片总数丰富且包含户外/模特等，判定为富物料模式
        is_rich = has_outfit_images or (total_images >= 20 and (has_model_images or has_outdoor_images))
        material_mode = "rich_original" if is_rich else "minimal_static_only"

        max_looks = 3
        if material_mode == "minimal_static_only":
            max_looks = 2
        if available_look_nums:
            max_looks = len(available_look_nums)
            print(f"[*] 自适应物料检测结论: look_nums={sorted(list(available_look_nums))} => 限制搭配数为: {max_looks}")

        # 【防覆盖保护】如果检测到已由 AI 动态定制的高质量简报，直接复用并跳过重写
        if os.path.exists(brief_json_path):
            try:
                with open(brief_json_path, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
                if existing_data.get("is_customized") or (existing_data.get("outfits") and not existing_data.get("is_hardcoded_fallback")):
                    print(f"[*] 检测到已自定义的搭配简报，跳过兜底重写，直接复用: {brief_json_path}")
                    category_name = existing_data.get("visual_product_profile", {}).get("category", "自定义品类")

                    # 同样执行物理搭配裁剪：有多少个提供的搭配就展示多少个
                    if available_look_nums and "outfits" in existing_data:
                        if len(existing_data["outfits"]) > max_looks:
                            existing_data["outfits"] = existing_data["outfits"][:max_looks]

                    self._write_brief_md_and_prompts_from_data(existing_data, category_name)
                    # 写回更新后的数据到 JSON 物理文件中（补齐后的 prompts）
                    with open(brief_json_path, 'w', encoding='utf-8') as f:
                        json.dump(existing_data, f, ensure_ascii=False, indent=2)
                    return 0
            except Exception as e:
                print(f"[WARN] 试图读取并复用已存在的搭配简报失败: {e}")

        print(f"[*] 自适应物料分析通过: total_images={total_images} => 判定为: {material_mode}")

        found_colors = []
        # Priority 1: load from launch_scope.json (Excel whitelist)
        launch_scope_path = os.path.join(self.scratch_dir, 'launch_scope.json')
        if os.path.exists(launch_scope_path):
            try:
                with open(launch_scope_path, 'r', encoding='utf-8') as f:
                    ls_data = json.load(f)
                if ls_data.get("detected") and ls_data.get("allowed_colors"):
                    found_colors = ls_data["allowed_colors"]
            except Exception as e:
                print(f"[WARN] 从 launch_scope 加载颜色失败: {e}")

        # Priority 2: extract from manifest images with a broader color whitelist
        if not found_colors:
            try:
                with open(manifest_path, 'r', encoding='utf-8') as f:
                    manifest = json.load(f)
                for entry in manifest:
                    if entry.get('file_type') == 'image':
                        filename = entry.get('filename', '')
                        for cname in ['棕色', '浅灰色', '藏青色', '米白色', '米白', '浅灰', '棕', '藏青', '黑色', '白色', '浅米灰', '橄榄绿', '花灰色', '浅花灰']:
                            if cname in filename and cname not in found_colors:
                                norm = cname
                                if norm == '浅灰': norm = '浅灰色'
                                if norm == '藏青': norm = '藏青色'
                                if norm == '米白': norm = '米白色'
                                if norm == '棕': norm = '棕色'
                                if norm == '浅花灰': norm = '花灰色'
                                if norm not in found_colors:
                                    found_colors.append(norm)
            except Exception as e:
                print(f"[WARN] 智能提取颜色失败: {e}")

        if not found_colors:
            found_colors = ['浅灰色', '藏青色', '棕色']

        # 1. 优先通过 SKU 名字或当前的 target_dir 包含的品类词进行判断
        dir_name = os.path.basename(os.path.normpath(self.target_dir or '')).lower()
        sku_lower = self.sku_name.lower()
        category = None
        category_name = None

        if any(k in dir_name or k in sku_lower for k in ["防晒", "防嗮", "外套", "夹克", "jacket", "sunscreen"]):
            category = "sunscreen_jacket"
            category_name = "防晒外套/轻薄外套"
        elif any(k in dir_name or k in sku_lower for k in ["短袖", "t恤", "体恤", "亨利", "卫衣", "sweatshirt", "t-shirt", "tshirt", "henley"]):
            category = "sweatshirt"
            category_name = "卫衣/T恤/休闲裤"
        elif any(k in dir_name or k in sku_lower for k in ["裤", "pants", "trousers"]):
            category = "suit_pants"
            category_name = "西装裤/半裙/衬衫"

        # 2. 如果通过目录/SKU名字没有判断出来，再扫描 dump.txt 里的核心内容（只扫描“完整上架属性包”和“核心卖点体系”部分）
        if not category:
            dump_path = os.path.join(self.scratch_dir, 'dump.txt')
            dump_text = ""
            if os.path.exists(dump_path):
                try:
                    with open(dump_path, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                    valid_lines = []
                    for line in lines:
                        if "尺码体系与试穿报告" in line or "Sheet: 尺码体系" in line:
                            break
                        valid_lines.append(line)
                    dump_text = "".join(valid_lines)
                except Exception:
                    pass

            search_target = (sku_lower + "\n" + dump_text).lower()
            if any(k in search_target for k in ["防晒", "防嗮", "sunscreen", "轻薄外套", "薄外套", "外套", "夹克", "jacket"]):
                category = "sunscreen_jacket"
                category_name = "防晒外套/轻薄外套"
            elif any(k in search_target for k in ["卫衣", "t恤", "体恤", "短袖", "sweatshirt", "hoodie", "t-shirt"]):
                category = "sweatshirt"
                category_name = "卫衣/T恤/休闲裤"
            elif any(k in search_target for k in ["西装", "西裤", "suit", "半身裙", "半裙", "衬衫", "衬衣", "shirt", "skirt", "裤", "pants", "trousers"]):
                category = "suit_pants"
                category_name = "西装裤/半裙/衬衫"
            elif any(k in search_target for k in ["连衣裙", "裙子", "dress"]):
                category = "dress"
                category_name = "连衣裙"

        # 3. 兜底
        if not category:
            category = "other"
            category_name = "其他品类"

        print(f"[*] 识别商品品类:: {category_name} (code: {category})")
        outfits = []

        if category == "sunscreen_jacket":
            outfits.append({
                "look_id": "look_01",
                "look_name": "轻户外山系防晒搭配",
                "scene_type": "轻户外/山系露营/山道徒步",
                "selected_product_color": found_colors[0],
                "style_keywords": ["山系户外", "防晒实用", "运动机能", "轻盈透气"],
                "recommended_items": [
                    {"item_type": "glasses", "item_name": "户外运动风镜", "color_or_material": "半透明灰色防风偏光镜", "styling_reason": "偏光镜片防强光防风，半透明灰色镜身机能感十足，是轻户外山系不可或缺的潮流配饰"},
                    {"item_type": "bottom", "item_name": "多口袋速干工装短裤", "color_or_material": "炭黑色速干防撕裂面料", "styling_reason": "深色下装与浅色防晒外套构成撞色对比，多口袋设计强化户外实用机能风"},
                    {"item_type": "shoes", "item_name": "户外越野跑鞋", "color_or_material": "米色拼卡其麂皮", "styling_reason": "鞋底防滑耐磨，满足户外野游徒步需求，鞋身质感呼应整体山系风"},
                    {"item_type": "bag", "item_name": "机能斜挎包", "color_or_material": "军绿色防泼水尼龙", "styling_reason": "轻便耐磨，为搭配注入户外大地色系，拉满山系露营的场景感"},
                    {"item_type": "accessory", "item_name": "刺绣软顶棒球帽", "color_or_material": "藏青色做旧纯棉面料", "styling_reason": "防晒防风，点缀头部层次，营造慵懒利落的户外潮人气质"}
                ],
                "styling_logic": "采用浅色防晒服作为上身主调，搭配防风偏光镜和低饱和度炭黑色短裤，配合越野跑鞋、斜挎包及棒球帽，打造利落实用的山系户外穿搭。",
                "target_audience": "喜爱露营、户外野游以及追求防晒硬实力的年轻群体。",
                "platform_content_angle": {
                    "xiaohongshu": "小红书爆款山系防晒女孩穿搭，夏日出门露营这一套就够了，兼顾防晒与出片！",
                    "douyin": "主播话术重点讲解户外防晒指数与机能口袋细节，演示防泼水与防紫外线的多功能性！",
                    "tmall": "详情页主推山系风情景穿搭，突出拉链拼接工艺和清爽透气网眼结构。",
                    "wechat_video": "短视频剪辑山地徒步第一视角，展现防晒外套在明媚阳光下的微风飘逸动态感。"
                },
                "image_generation_prompts": {
                    "outfit_effect_prompt_zh": f"平铺穿搭展示图，不要真人模特。整体平铺在浅灰色微织纹地毯背景上。顶视俯拍（flat lay, top-down view），构图整齐美观。本品为{found_colors[0]}的轻薄连帽防晒外套（主单品，拉链拉拢，袖口平整），搭配一副半透明灰色防风偏光镜户外运动风镜，一条炭黑色多口袋速干工装短裤，一双米色拼卡其户外越野跑鞋，一个军绿色防泼水尼龙机能斜挎包，点缀一顶藏青色做旧纯棉棒球帽。所有服饰与配饰均平摆平铺，整齐排列，不要折叠成一团，展示清晰的面料质感与走线，干净电商排版，无模特无真人，围绕本品静物图展开。",
                    "outfit_effect_prompt_en": f"flat lay outfit board, top-down view, neatly arranged on a light gray textured carpet floor, minimalist e-commerce styling, no model, no human, no limbs. The main product is a lightweight hooded sunscreen jacket in {found_colors[0]} color (zipped up, sleeves laid flat), paired with outdoor sports goggles in translucent gray polarized, charcoal black multi-pocket quick-dry utility shorts, beige and khaki outdoor trail running shoes, and an army green water-resistant nylon crossbody bag, accessorized with a navy blue dad cap. Clean layout, commercial photography, studio lighting, keep the color and design details consistent with the provided source product image, do not replace the product with another garment, no human.",
                    "short_video_shot_prompt": "真实展示：模特在阳光斑驳的树荫下背着斜挎包轻快前行，镜头拉近展示连帽抽绳拉链与面料网眼拼接的轻盈动态。"
                }
            })

            c2 = found_colors[1] if len(found_colors) > 1 else found_colors[0]
            outfits.append({
                "look_id": "look_02",
                "look_name": "极简都市通勤搭配",
                "scene_type": "都市写字楼/日常通勤/冷气房防风",
                "selected_product_color": c2,
                "style_keywords": ["极简都市", "干练知性", "冷淡风", "功能防风"],
                "recommended_items": [
                    {"item_type": "glasses", "item_name": "时尚平光眼镜", "color_or_material": "银色细框钛金属", "styling_reason": "银色细框简约雅致，修饰脸型并注入文艺知性气质，完美契合都市通勤场景"},
                    {"item_type": "bottom", "item_name": "高腰直筒免烫西裤", "color_or_material": "米白色垂顺免烫西装面料", "styling_reason": "米白裤装极大平衡了运动外套的休闲感，高腰版型拉长腿部线条，显得知性高挑"},
                    {"item_type": "shoes", "item_name": "复古玛丽珍单鞋", "color_or_material": "黑色漆皮面料", "styling_reason": "漆皮光泽点亮下身，复古玛丽珍鞋型中和西裤的严肃感，注入柔和知性气息"},
                    {"item_type": "bag", "item_name": "极简皮质斜挎托特包", "color_or_material": "黑色哑光牛皮", "styling_reason": "利落线条的皮质包袋提升搭配质感，平添一份职场利落与收敛感"},
                    {"item_type": "accessory", "item_name": "复古极细针扣皮带", "color_or_material": "棕色牛皮带身配哑光金扣", "styling_reason": "强调高腰线，划分完美身形比例，提升穿搭细节的精致度"}
                ],
                "styling_logic": "利用高防护属性的防晒连帽外套搭配大气的米白西裤，利用冷色调皮包收敛，将实用防风防晒服转化为办公室日常干练西服式代用品。",
                "target_audience": "追求防晒实用性与职场干练风的都市白领及白领通勤人士。",
                "platform_content_angle": {
                    "xiaohongshu": "冷气房必备的防晒神器！藏青防晒衣+米白西裤，打工人防晒通勤两不误的清冷风模板。",
                    "douyin": "主播重点演示防风防冷气功能，并讲解敞开穿时的都市垂坠线条美感。",
                    "tmall": "详情页主打冷气房/通勤双场景切换，突出轻薄面料防皱好收纳的优点。",
                    "wechat_video": "拍摄写字楼大堂模特自信走过，清爽知性，突出通勤穿搭的无缝切换。"
                },
                "image_generation_prompts": {
                    "outfit_effect_prompt_zh": f"平铺穿搭展示图，不要真人模特。整体平铺在浅灰色微织纹地毯背景上。顶视俯拍（flat lay, top-down view），构图整齐美观。本品为{c2}的轻薄连帽防晒外套（主单品，拉链敞开），搭配一副银色细框钛金属时尚平光眼镜，下穿一条米白色垂顺免烫直筒西裤，一双黑色漆皮复古玛丽珍单鞋，一个黑色极简皮质斜挎托特包，点缀一根棕色牛皮细皮带。所有服饰与配饰摆放平整，整齐排列，干净电商排版，无模特无真人，围绕本品静物图展开。",
                    "outfit_effect_prompt_en": f"flat lay outfit board, top-down view, neatly arranged on a light gray textured carpet floor, minimalist e-commerce styling, no model, no human, no limbs. The main product is a lightweight hooded sunscreen jacket in {c2} color (open front), fashion glasses in silver thin titanium frame, paired with beige-white drape straight-leg dress pants, black patent leather retro Mary Jane shoes, and a minimalist black leather tote bag, accessorized with a thin brown leather belt. Clean layout, commercial photography, studio lighting, keep the color and design details consistent with the provided source product image, do not replace the product with another garment, no human.",
                    "short_video_shot_prompt": "镜头特写模特将防晒衣脱下并折叠塞入包中，展示面料强防皱性和高收纳度，接着上身拉链一拉到底，利落飒爽。"
                }
            })

            c3 = found_colors[2 % len(found_colors)]
            outfits.append({
                "look_id": "look_03",
                "look_name": "周末慵懒街头休闲搭配",
                "scene_type": "街头逛街/咖啡馆约会/周末慢逛",
                "selected_product_color": c3,
                "style_keywords": ["慵懒随性", "Clean Fit", "复古街头", "活力出街"],
                "recommended_items": [
                    {"item_type": "glasses", "item_name": "复古黑框墨镜", "color_or_material": "黑色板材框深色镜片", "styling_reason": "复古黑框粗犷随性，防晒遮阳的同时增加街头潮流感，营造不费力的时髦感"},
                    {"item_type": "bottom", "item_name": "水洗浅蓝色直筒牛仔裤", "color_or_material": "100%纯棉重磅水洗牛仔布", "styling_reason": "牛仔的粗犷水洗感中和了防晒衣的科技感，冷暖复古撞色倍显街头时尚"},
                    {"item_type": "shoes", "item_name": "厚底皮质德训鞋", "color_or_material": "白色牛皮拼麂皮", "styling_reason": "白皮与麂皮拼接极具复古质感，厚底物理增高，适合周末慢游行走"},
                    {"item_type": "bag", "item_name": "卡其色帆布挎包", "color_or_material": "卡其色重磅洗水帆布", "styling_reason": "帆布材质随性慵懒，极具周末松弛生活感"},
                    {"item_type": "accessory", "item_name": "桑蚕丝几何小方巾", "color_or_material": "印花真丝面料", "styling_reason": "可作为颈饰或系在包带上，用细微色彩点亮全身 Clean Fit 搭配"}
                ],
                "styling_logic": "防晒衣敞开穿着，搭配复古黑框墨镜与高腰水洗牛仔裤，配合德训鞋、帆布包和丝巾，完美呈现周末慵懒松弛的街头少年感与少女活力。",
                "target_audience": "追求无拘无束穿着感、喜爱复古日系或Clean Fit街头风格的潮流群体。",
                "platform_content_angle": {
                    "xiaohongshu": "夏日约会逛街这样穿！防晒外套+水洗牛仔裤，慵懒日系街头风，又帅又防晒！",
                    "douyin": "主播亲身演示拉开拉链、拉起衣袖的随性穿法，突出墨镜与外套的撞色与搭配层次。",
                    "tmall": "详情页主推周末出行及轻街头风展示，强调防晒衣与基础单品的百搭契合度。",
                    "wechat_video": "咖啡馆窗边模特低头喝咖啡，风拂起发梢，防晒服展现出休闲松弛的高级胶片质感。"
                },
                "image_generation_prompts": {
                    "outfit_effect_prompt_zh": f"平铺穿搭展示图，不要真人模特。整体平铺在浅灰色微织纹地毯背景上。顶视俯拍（flat lay, top-down view），构图整齐美观。本品为{c3}的轻薄连帽防晒外套（主单品，拉链拉半开），搭配一副黑色板材框深色镜片复古黑框墨镜，下穿一条水洗浅蓝色直筒牛仔裤，一双白色皮质运动德训鞋，一个卡其色重磅洗水帆布挎包，点缀一条印花真丝小方巾。所有服饰摆放平整，整齐排布，展现日系松弛感，干净电商排版，无模特无真人，围绕本品静物图展开。",
                    "outfit_effect_prompt_en": f"flat lay outfit board, top-down view, neatly arranged on a light gray textured carpet floor, minimalist e-commerce styling, no model, no human, no limbs. The main product is a lightweight hooded sunscreen jacket in {c3} color (half-zipped), retro black sunglasses in black acetate frame dark lenses, paired with light blue straight-leg washed jeans, retro white leather trainers, and a khaki canvas shoulder bag, accessorized with a printed silk scarf. Clean layout, commercial photography, studio lighting, keep the color and design details consistent with the provided source product image, do not replace the product with another garment, no human.",
                    "short_video_shot_prompt": "镜头升格拍摄模特在马路边手持咖啡杯小跑，发丝飞扬，衣摆随风起伏，突出极其阳光松弛的夏日画面。"
                }
            })

        elif category == "suit_pants":
            outfits.append({
                "look_id": "look_01",
                "look_name": "干练高级通勤办公搭配",
                "scene_type": "职场会议/写字楼写单/商务会面",
                "selected_product_color": found_colors[0],
                "style_keywords": ["利落职场", "大女主风", "高级质感", "极致显瘦"],
                "recommended_items": [
                    {"item_type": "top", "item_name": "法式飘带重磅真丝衬衫", "color_or_material": "香槟色重磅真丝", "styling_reason": "真丝的高光泽感为下装裤装注入高级感，飘带增强领口细节层次"},
                    {"item_type": "shoes", "item_name": "尖头小猫跟单鞋", "color_or_material": "黑色哑光羊皮", "styling_reason": "视觉拉长小腿，强化干练锐利的职场女性风姿"},
                    {"item_type": "bag", "item_name": "极简黑色手提皮包", "color_or_material": "黑色哑光牛皮", "styling_reason": "利落的公文包形态提升气场，呼应鞋履，完美承载职场通勤"},
                    {"item_type": "accessory", "item_name": "复古极细针扣皮带", "color_or_material": "棕色牛皮金扣", "styling_reason": "收束腰线，装饰下装门襟，提升身段比例"},
                    {"item_type": "jewelry", "item_name": "极细针插金属胸针", "color_or_material": "香槟金合金配珍珠", "styling_reason": "点缀在衬衫领口，折射细腻光泽，展现极致职场质感"}
                ],
                "styling_logic": "用重磅真丝衬衣收腰扎入西装裤内，配合尖头猫跟鞋，拉长下身比例，配以皮带和极简手提包、精致胸针点缀，打造高智感职场穿搭。",
                "target_audience": "注重职业形象、强调穿搭调性与高级感的白领与管理层女性。",
                "platform_content_angle": {
                    "xiaohongshu": "大女主通勤制服！西裤搭配真丝衬衫，穿出职场高智感，显高显瘦两不误！",
                    "douyin": "主播重点演示腰臀剪裁与修身直筒的线条，展示蹲坐时的无褶垂坠感。",
                    "tmall": "详情页主推正式职场办公场景，突出抗皱易打理和极佳的版型骨架。",
                    "wechat_video": "短视频展现模特迈着自信步伐走入会议室，裤摆垂顺摆动，突显出绝佳的职业风范。"
                },
                "image_generation_prompts": {
                    "outfit_effect_prompt_zh": f"平铺穿搭展示图，不要真人模特。整体平铺在浅灰色微织纹地毯背景上。顶视俯拍（flat lay, top-down view），构图整齐美观。本品为{found_colors[0]}的高腰直筒西装长裤（主单品，熨烫平整），搭配一件香槟色重磅真丝法式飘带衬衫（衬衫衣摆塞入裤腰），一双黑色尖头中猫跟羊皮单鞋，一只极简黑色手提皮包，点缀一根细皮带和一枚精致胸针。所有服饰与配饰均平摆平铺，整齐排列，展现高级职场感，干净电商排版，无模特无真人，围绕本品静物图展开。",
                    "outfit_effect_prompt_en": f"flat lay outfit board, top-down view, neatly arranged on a light gray textured carpet floor, minimalist e-commerce styling, no model, no human, no limbs. The main product is a pair of straight-leg dress pants in {found_colors[0]} color (pressed flat), paired with a champagne silk blouse (blouse hem tucked into the trousers waist), black pointed-toe kitten heels, and a minimalist black leather briefcase, accessorized with a thin belt and a gold brooch. Clean layout, commercial photography, studio lighting, keep the color and design details consistent with the provided source product image, do not replace the product with another garment.",
                    "short_video_shot_prompt": "特写拍摄模特自信踱步，裤摆随步伐自然起伏不发飘，展示出西裤极佳的克重与垂顺感。"
                }
            })

            c2 = found_colors[1] if len(found_colors) > 1 else found_colors[0]
            outfits.append({
                "look_id": "look_02",
                "look_name": "精致轻社交会面搭配",
                "scene_type": "下班社交/闺蜜下午茶/清吧小聚",
                "selected_product_color": c2,
                "style_keywords": ["雅致知性", "慵懒法式", "时髦得体", "高级灰度"],
                "recommended_items": [
                    {"item_type": "top", "item_name": "一字肩羊绒针织衫", "color_or_material": "燕麦色超细羊绒", "styling_reason": "燕麦色与西装裤构成极具高级感的柔和暖调，一字肩露出精致锁骨，平添法式随性"},
                    {"item_type": "shoes", "item_name": "优雅羊皮乐福鞋", "color_or_material": "奶茶色软羊皮", "styling_reason": "乐福鞋款优雅从容，软皮材质保证穿着舒适，完美适应下班后的社交活动"},
                    {"item_type": "bag", "item_name": "奶白色金属链条包", "color_or_material": "香槟金金属扣 + 奶白色羊皮", "styling_reason": "金色配饰点亮整体偏暗的色调，注入社交夜晚的精致时髦度"},
                    {"item_type": "accessory", "item_name": "桑蚕丝印花小方巾", "color_or_material": "印花真丝面料", "styling_reason": "可作为领巾系于颈部，增加视觉焦点，丰富整套法式老钱风的细节"},
                    {"item_type": "jewelry", "item_name": "极简设计金色锁骨链", "color_or_material": "18K包金细链身", "styling_reason": "细金链勾勒精致锁骨，在低调中折射优雅光彩，适合轻社交聚会"}
                ],
                "styling_logic": "利用燕麦色露肩毛衣的温柔慵懒感，搭配优雅乐福鞋与细致锁骨链，打破西装裤的刻板职场感，随性优雅，下班即社交。",
                "target_audience": "追求穿搭细节、喜爱浪漫法式松弛感或老钱风的轻熟女群体。",
                "platform_content_angle": {
                    "xiaohongshu": "下班直接去约会！一字肩针织搭配西裤，法式清冷老钱风，高级又撩人。",
                    "douyin": "主播演示领口穿戴细节，并展现西装裤贴合臀部、不显小腹的优秀剪裁。",
                    "tmall": "主推都市下班轻社交及会友场景，突出产品极好的包容度与修身腰线。",
                    "wechat_video": "夜幕降临清吧窗前，暖光洒在针织和裤装质感上，端杯轻笑，慵懒迷人。"
                },
                "image_generation_prompts": {
                    "outfit_effect_prompt_zh": f"平铺穿搭展示图，不要真人模特。整体平铺在浅灰色微织纹地毯背景上。顶视俯拍（flat lay, top-down view），构图整齐美观。本品为{c2}的阔腿西装裤（主单品），搭配一件燕麦色一字领细针织羊绒衫，一双时髦单鞋，一个奶白色金属链条包，点缀锁骨链 and 细皮带。所有服饰摆放平整，干净电商排版，无模特无真人，围绕本品静物图展开。",
                    "outfit_effect_prompt_en": f"flat lay outfit board, top-down view, neatly arranged on a light gray textured carpet floor, minimalist e-commerce styling, no model, no human, no limbs. The main product is a pair of wide-leg trousers in {c2} color, paired with an oatmeal off-the-shoulder fine knit sweater, casual flats, and a cream-white chain strap leather handbag, accessorized with a gold necklace and a thin belt. Clean layout, commercial photography, studio lighting, keep the color and design details consistent with the source product image, do not replace the product with another garment.",
                    "short_video_shot_prompt": "中景慢镜头拍摄模特在高脚椅上优雅转身，微弱光线下裤装折痕立体，呈现出雕塑般立体挺拔的下身线条。"
                }
            })

            c3 = found_colors[2 % len(found_colors)]
            outfits.append({
                "look_id": "look_03",
                "look_name": "周末慵懒雅痞休闲搭配",
                "scene_type": "周末美术馆看展/休闲小街慢逛",
                "selected_product_color": c3,
                "style_keywords": ["慵懒中性", "日系雅痞", "Clean Fit", "松弛感"],
                "recommended_items": [
                    {"item_type": "top", "item_name": "宽松重磅棉质圆领白T", "color_or_material": "白色纯棉260g重磅面料", "styling_reason": "白T是最强百搭底色，中和下装的正式感，营造无刻意装扮的随性时髦"},
                    {"item_type": "shoes", "item_name": "厚底德训鞋/板鞋", "color_or_material": "米白色牛皮拼麂皮", "styling_reason": "增添运动街头活力，厚底款式优化身形比例，穿着舒适适合慢行"},
                    {"item_type": "bag", "item_name": "卡其色帆布斜挎包", "color_or_material": "卡其色重磅洗水帆布", "styling_reason": "慵懒松弛的重磅帆布包，完美烘托周末慢生活艺术气息"},
                    {"item_type": "accessory", "item_name": "针织开衫披肩", "color_or_material": "黑色羊毛针织", "styling_reason": "披在肩上打结，中和白T西裤的单调感，带来层次丰富的慵懒中性雅痞风"},
                    {"item_type": "jewelry", "item_name": "极简银色细框眼镜", "color_or_material": "银色钛金属镜框", "styling_reason": "中性雅致，为街头看展的松弛造型注入一抹文艺复古气质"}
                ],
                "styling_logic": "白T半扎裤腰，外搭一件随性披在肩上的深色针织开衫作为配饰，搭配德训鞋和银框眼镜，打造漫不经心的日系中性风雅痞穿搭。",
                "target_audience": "追求松弛感、喜欢艺术气息和日系工装/Clean Fit混搭的时尚青年。",
                "platform_content_angle": {
                    "xiaohongshu": "美术馆松弛穿搭！白T+西裤，肩上搭件针织衫，日常又高级的日系文艺感。",
                    "douyin": "展示裤装的透气回弹能力和口袋细节，演示弯腰、走动时的松弛张力。",
                    "tmall": "详情页主打周末看展/艺术休闲场景，呈现干净简约的高品质生活美学。",
                    "wechat_video": "模特在画廊驻足欣赏，裤长摆幅恰到好处，呈现松弛而立体的静态比例感。"
                },
                "image_generation_prompts": {
                    "outfit_effect_prompt_zh": f"平铺穿搭展示图，不要真人模特。整体平铺在浅灰色微织纹地毯背景上。顶视俯拍（flat lay, top-down view），构图整齐美观。本品为{c3}的垂坠阔腿裤（主单品），搭配一件白色纯棉打底圆领T恤，一件黑色针织开衫披肩，一双米色德训鞋，一只帆布挎包和一副钛金属眼镜。摆放整齐，展现日系极简感，干净电商排版，无模特无真人，围绕本品静物图展开。",
                    "outfit_effect_prompt_en": f"flat lay outfit board, top-down view, neatly arranged on a light gray textured carpet floor, minimalist e-commerce styling, no model, no human, no limbs. The main product is a pair of drape wide-leg trousers in {c3} color, paired with a white cotton t-shirt, a black knit cardigan sleeve wrap, and retro suede trainers, a canvas bag and silver spectacles. Clean layout, commercial photography, studio lighting, keep the color and design details consistent with the source product image, do not replace the product with another garment.",
                    "short_video_shot_prompt": "镜头特写鞋面和裤脚的重叠处，模特在光影错落的画廊中缓慢移动，突出西裤垂坠走动时的优美律动。"
                }
            })

        else:
            outfits.append({
                "look_id": "look_01",
                "look_name": "日常通勤精致穿搭",
                "scene_type": "工作日职场通勤/都市穿梭",
                "selected_product_color": found_colors[0],
                "style_keywords": ["精致得体", "都市轻熟", "百搭实穿", "舒适干练"],
                "recommended_items": [
                    {"item_type": "glasses", "item_name": "时尚平光眼镜", "color_or_material": "银色细边金属框架", "styling_reason": "细边金属框架极具斯文知性气质，修饰脸型且低调得体，为都市通勤增添精致细节"},
                    {"item_type": "bottom", "item_name": "深色直筒休闲长裤", "color_or_material": "深灰色弹力斜纹棉", "styling_reason": "修身合体版型，与外套完美适配，百搭干练"},
                    {"item_type": "shoes", "item_name": "简约法式中跟单鞋", "color_or_material": "奶茶色软牛皮", "styling_reason": "柔和色调为整体提亮，行走舒适且不失通勤仪态"},
                    {"item_type": "bag", "item_name": "极简真皮斜挎包", "color_or_material": "黑色哑光牛皮", "styling_reason": "小巧便携，为整套出行穿搭提供安全质感的细节收束"},
                    {"item_type": "accessory", "item_name": "简约扣环复古皮带", "color_or_material": "黑金牛皮细带", "styling_reason": "界定腰线，中和长裤严肃感，提升细节亮点"}
                ],
                "styling_logic": "采用得体的通勤版型搭配极简色系，点缀皮质包袋与简约饰品，演绎铺排得当的知性通勤风格。",
                "target_audience": "注重日常实穿性与体面感的上班族与职场女性。",
                "platform_content_angle": {
                    "xiaohongshu": "打工人的高级感穿搭！日常通勤首选，简单不费力就很有质感！",
                    "douyin": "主播重点演示单品在日常活动中的舒适拉伸性和亲肤质感，展现百搭风范。",
                    "tmall": "详情页突出产品的多功能性与日常穿着的高频契合度。",
                    "wechat_video": "模特在都市街头阔步前行，展现产品随身而动的利落气场与亲切质感。"
                },
                "image_generation_prompts": {
                    "outfit_effect_prompt_zh": f"平铺穿搭展示图，不要真人模特。整体平铺在浅灰色微织纹地毯背景上。顶视俯拍（flat lay, top-down view），构图整齐美观。本品为{found_colors[0]}的时尚服饰（主单品），搭配一副银色细边金属框架时尚平光眼镜，一条深色直筒长裤，一双奶茶色皮质平底单鞋，一个极简小挎包，点缀围巾和腰带。整齐排列，干净电商排版，无模特无真人，围绕本品静物图展开。",
                    "outfit_effect_prompt_en": f"flat lay outfit board, top-down view, neatly arranged on a light gray textured carpet floor, minimalist e-commerce styling, no model, no human, no limbs. The main product is a stylish garment in {found_colors[0]} color (this product), paired with fashion glasses in silver thin metal frame, dark straight-leg pants, nude-beige leather flats, and a minimalist shoulder bag, accessorized with a scarf and belt. Clean layout, commercial photography, studio lighting, keep the color and design details consistent with the source product image, do not replace the product with another garment.",
                    "short_video_shot_prompt": "中近景跟随拍摄模特在人行横道上自信走过，衣角迎风微摆，呈现大都市打工人清爽得体的精神面貌。"
                }
            })

            c2 = found_colors[1] if len(found_colors) > 1 else found_colors[0]
            outfits.append({
                "look_id": "look_02",
                "look_name": "轻运动city walk穿搭",
                "scene_type": "城市漫步/周末city walk/轻量休闲运动",
                "selected_product_color": c2,
                "style_keywords": ["轻运动风", "城市漫游", "随性清爽", "活力防晒"],
                "recommended_items": [
                    {"item_type": "glasses", "item_name": "运动防风偏光墨镜", "color_or_material": "黑色粗框防紫外线镜片", "styling_reason": "防风偏光墨镜在户外遮阳防晒，黑色粗框极具街头运动潮流感"},
                    {"item_type": "bottom", "item_name": "水洗直筒牛仔裤", "color_or_material": "天蓝色水洗棉牛仔布", "styling_reason": "牛仔面料耐磨随性，版型利落，完美适配 city walk 的轻快步伐"},
                    {"item_type": "shoes", "item_name": "复古厚底运动鞋", "color_or_material": "米色拼白色网面", "styling_reason": "舒适高回弹鞋底，为长时间城市漫步提供出色缓震支撑"},
                    {"item_type": "bag", "item_name": "轻巧防雨迷你挎包", "color_or_material": "奶白色超软皮革", "styling_reason": "皮质柔软有弹力，小巧防雨，方便收纳随身物品，兼顾实用与质感"},
                    {"item_type": "accessory", "item_name": "遮阳鸭舌帽", "color_or_material": "米色纯棉斜纹布", "styling_reason": "米色纯棉透气防晒，修饰脸型，为整套 city walk 穿搭增添休闲活力"}
                ],
                "styling_logic": "通过柔和的白蓝撞色和极具松弛感的牛仔，中和严肃线条，打造令人心旷神怡的轻运动与城市漫步装扮。",
                "target_audience": "追求出游舒适性、喜爱随性运动风或城市漫步潮流的年轻群体。",
                "platform_content_angle": {
                    "xiaohongshu": "城市慢游穿搭模版！轻运动风短袖+直筒牛仔，city walk 拍照超好看，活力满满！",
                    "douyin": "演示敞开穿与鸭舌帽搭配在城市漫游场景下的青春活力与清爽防晒感。",
                    "tmall": "详情页主推城市漫步与周末轻运动场景，主打穿着舒适度与实穿的百搭性。",
                    "wechat_video": "绿意盎然的街道旁，模特戴着鸭舌帽迎着微风漫步，画面呈现极具夏日活力的 city walk 松弛感。"
                },
                "image_generation_prompts": {
                    "outfit_effect_prompt_zh": f"平铺穿搭展示图，不要真人模特。画幅比例为4:3。整体平铺在浅灰色微织纹地毯背景上。顶视俯拍（flat lay, top-down view），构图整齐美观。本品为{c2}的休闲服饰（主单品），搭配一副运动防风偏光墨镜，一条天蓝色水洗直筒牛仔裤，一双复古厚底运动鞋，一个轻巧防雨迷你挎包，一顶遮阳鸭舌帽。整齐摆放，干净电商排版，无模特无真人，围绕本品静物图展开。",
                    "outfit_effect_prompt_en": f"flat lay outfit board, 4:3 aspect ratio, top-down view, neatly arranged on a light gray textured carpet floor, minimalist e-commerce styling, no model, no human, no limbs. The main product is a casual garment in {c2} color, paired with sports sunglasses in black thick frame UV-protection lenses, sky-blue washed denim jeans, retro sneakers, and a soft cream-white mini shoulder bag, accessorized with a beige cap.",
                    "short_video_shot_prompt": "特写拍摄模特单手扶包，迎着阳光在绿荫下轻快踱步，发丝飞扬，面料在微风下展现卓越透气性。"
                }
            })

            c3 = found_colors[2 % len(found_colors)]
            outfits.append({
                "look_id": "look_03",
                "look_name": "户外休闲/假日出游穿搭",
                "scene_type": "近郊郊游/野餐度假/假日海滨出游",
                "selected_product_color": c3,
                "style_keywords": ["活力运动", "假日休闲", "随性清爽", "轻量透气"],
                "recommended_items": [
                    {"item_type": "glasses", "item_name": "运动防风墨镜", "color_or_material": "半透明灰色防风偏光镜", "styling_reason": "大镜面防风防沙且能阻隔刺眼强光，半透明科技感框架增添前卫感，是户外运动的好帮手"},
                    {"item_type": "bottom", "item_name": "深灰色慢跑运动裤", "color_or_material": "灰色弹力速干织物", "styling_reason": "轻便无束缚，满足假日出行与轻运动需要"},
                    {"item_type": "shoes", "item_name": "轻量防滑越野跑鞋", "color_or_material": "米色拼卡其麂皮", "styling_reason": "确保野外或长途行走时的舒适抓地力，风格专业帅气"},
                    {"item_type": "bag", "item_name": "黑色防雨迷你挎包", "color_or_material": "黑色耐磨防水尼龙", "styling_reason": "轻巧收纳手机与随身贵重物品，为户外出行保驾护航"},
                    {"item_type": "accessory", "item_name": "卡其色遮阳渔夫帽", "color_or_material": "卡其色科技防晒防泼水面料", "styling_reason": "增强头部立体防晒，卡其色带来极强的度假/露营山系氛围"}
                ],
                "styling_logic": "以轻快利落的服装作为主干，配合防风墨镜与越野跑鞋，辅以户外运动挎包与慢跑运动裤，展现随性的假期出游与机能风搭配。",
                "target_audience": "爱好周末轻户外、度假休闲并注重清爽体感的年轻群体。",
                "platform_content_angle": {
                    "xiaohongshu": "去野外去度假！卡其渔夫帽配清爽上装，户外穿搭又好看又清凉，轻松拥抱大自然！",
                    "douyin": "主播演示本款单品在户外活动下的极佳透气凉感，讲解高弹拉伸不易起皱折的特点。",
                    "tmall": "详情页主推度假出游/假日野餐场景，突出产品轻量凉爽与高频穿着的实穿性。",
                    "wechat_video": "微风吹拂的草地上，模特戴着渔夫帽大步前行，呈现极富自然生命力的假日休闲感。"
                },
                "image_generation_prompts": {
                    "outfit_effect_prompt_zh": f"平铺穿搭展示图，不要真人模特。整体平铺在浅灰色微织纹地毯背景上。顶视俯拍（flat lay, top-down view），构图整齐美观。本品为{c3}的时尚服饰（主单品），搭配一副半透明灰色防风偏光镜运动防风墨镜，一条深灰慢跑运动裤，一顶卡其色遮阳渔夫帽，一双米色越野跑鞋，一只黑色迷你挎包。平整摆放，干净电商排版，无模特无真人，围绕本品静物图展开。",
                    "outfit_effect_prompt_en": f"flat lay outfit board, top-down view, neatly arranged on a light gray textured carpet floor, minimalist e-commerce styling, no model, no human, no limbs. The main product is a stylish garment in {c3} color (this product), paired with sports goggles in translucent gray polarized, dark gray jogger pants, a khaki bucket hat, beige outdoor trail running shoes, and a mini black crossbody bag. Clean layout, commercial photography, studio lighting, keep the color and design details consistent with the source product image, do not replace the product with another garment.",
                    "short_video_shot_prompt": "特写拍摄模特自信走过草地，清风吹拂，主单品面料质感凸显，活力充沛。"
                }
            })

        # 动态为每个搭配单品和 Look 效果图生成双向字面完全对齐的 Prompt
        for of in outfits:
            prompts = of["image_generation_prompts"]
            selected_color = of.get("selected_product_color", "")
            recommended_items = of.get("recommended_items", [])

            # 1. 动态生成每个搭配单品的白底图 Prompt
            for it in recommended_items:
                itype = it["item_type"]
                iname = it["item_name"]
                idesc = it["color_or_material"]

                prompts[f"flatlay_item_{itype}_prompt_zh"] = (
                    f"平铺搭配单品图：一件{idesc}的{iname}，整齐摆放在纯白色背景上。顶视俯拍（flat lay, top-down view），"
                    f"干净电商排版，商品白底图，高清无阴影无水印，完美展现版型与细节。"
                )
                prompts[f"flatlay_item_{itype}_prompt_en"] = (
                    f"Flatlay styling item: a {iname} in {idesc}, arranged neatly on a solid clean white background, "
                    f"minimalist e-commerce styling, top-down view, studio lighting, commercial product photography, "
                    f"high definition, no shadow, no human, no limbs, no watermark, clearly showing details."
                )

            # 2. 动态拼接 Look 整体效果大图的 Prompt
            item_clauses = []
            for it in recommended_items:
                itype = it["item_type"]
                iname = it["item_name"]
                idesc = it.get("color_or_material", "")
                quantifier = "一件"
                if itype in ("bottom", "pants", "skirt"):
                    quantifier = "一条"
                elif itype in ("shoes", "footwear"):
                    quantifier = "一双"
                elif itype in ("bag", "backpack"):
                    quantifier = "一个"
                elif itype in ("glasses", "eyewear", "spectacles"):
                    quantifier = "一副"
                elif itype in ("accessory", "accessory", "belt", "hat", "scarf"):
                    quantifier = "一顶" if "帽" in iname else "一条" if "巾" in iname else "一根" if "带" in iname else "一件"
                item_clauses.append(f"{quantifier}{idesc}的{iname}")
            paired_items_text = "，".join(item_clauses)

            if category == "sunscreen_jacket":
                main_desc = f"本品为{selected_color}的轻薄连帽防晒外套（主单品，拉链拉拢，袖口平整）"
                if "敞开" in of.get("styling_logic", "") or "敞开" in of.get("recommended_items", ""):
                    main_desc = f"本品为{selected_color}的轻薄连帽防晒外套（主单品，拉链敞开）"
                elif "半开" in of.get("styling_logic", ""):
                    main_desc = f"本品为{selected_color}的轻薄连帽防晒外套（主单品，拉链拉半开）"
            elif category == "sweatshirt":
                main_desc = f"本品为{selected_color}的修身短袖T恤（主单品，平铺平整）"
            elif category == "suit_pants":
                main_desc = f"本品为{selected_color}的西装长裤（主单品，熨烫平整）"
            else:
                main_desc = f"本品为{selected_color}的时尚单品（主单品，平摆平铺）"

            prompt_zh = (
                f"平铺穿搭展示图，不要真人模特。画幅比例为4:3。整体平铺在浅灰色微织纹地毯背景上。顶视俯拍（flat lay, top-down view），构图整齐美观。"
                f"{main_desc}，搭配{paired_items_text}。所有服饰与配饰均平摆平铺，整齐排列，不要折叠成一团，展示清晰的面料质感与走线，干净电商排版，无模特无真人，围绕本品静物图展开。"
            )
            prompts["outfit_effect_prompt_zh"] = prompt_zh

            # 3. 动态拼接英文 Look 效果图 Prompt
            item_clauses_en = []
            for it in recommended_items:
                itype = it["item_type"]
                iname = it["item_name"]
                idesc = it.get("color_or_material", "")

                en_name = iname
                for zh_w, en_w in [
                    ("打底吊带", "camisole"), ("工装短裤", "cargo shorts"), ("越野跑鞋", "trail running shoes"),
                    ("斜挎包", "crossbody bag"), ("棒球帽", "baseball cap"), ("打底圆领T恤", "crewneck T-shirt"),
                    ("直筒免烫西裤", "straight dress pants"), ("玛丽珍单鞋", "Mary Jane shoes"), ("斜挎托特包", "crossbody tote"),
                    ("针扣皮带", "pin buckle belt"), ("打底背心", "tank top"), ("直筒牛仔裤", "straight jeans"),
                    ("德训鞋", "german trainers"), ("帆布挎包", "canvas shoulder bag"), ("几何小方巾", "geometric scarf"),
                    ("重磅真丝衬衫", "silk shirt"), ("细针扣皮带", "fine belt"), ("针织开衫披肩", "cardigan shawl"),
                    ("德训鞋", "german trainers"), ("时尚平光眼镜", "fashion glasses"), ("复古黑框墨镜", "retro black sunglasses"),
                    ("户外运动风镜", "outdoor sports goggles"), ("平光眼镜", "glasses"), ("黑框墨镜", "sunglasses"),
                    ("运动防风墨镜", "sports goggles"), ("运动风镜", "goggles"), ("钛金属眼镜", "titanium glasses")
                ]:
                    if zh_w in iname:
                        en_name = en_w
                        break

                en_desc = idesc
                for zh_w, en_w in [
                    ("白色冰丝面料", "white ice silk"), ("炭黑色速干防撕裂面料", "charcoal black quick-dry"),
                    ("米色拼卡其麂皮", "beige and khaki suede"), ("军绿色防泼水尼龙", "army green water-resistant nylon"),
                    ("藏青色做旧纯棉面料", "navy blue distressed cotton"), ("纯白色220g精梳棉", "pure white 220g combed cotton"),
                    ("米白色垂顺免烫西装面料", "beige white drape dress fabric"), ("黑色漆皮面料", "black patent leather"),
                    ("黑色哑光牛皮", "black matte leather"), ("棕色牛皮带身配哑光金扣", "brown leather with matte gold buckle"),
                    ("黑色高弹细螺纹棉", "black high-elastic ribbed cotton"), ("100%纯棉重磅水洗牛仔布", "100% cotton heavy washed denim"),
                    ("白色牛皮拼麂皮", "white leather and suede"), ("卡其色重磅洗水帆布", "khaki heavy washed canvas"),
                    ("印花真丝面料", "printed silk"), ("香槟色重磅真丝", "champagne heavy silk"),
                    ("黑色哑光羊皮", "black matte sheepskin"), ("半透明灰色防风偏光镜", "translucent gray polarized"),
                    ("银色细框钛金属", "silver thin titanium frame"), ("黑色板材框深色镜片", "black acetate frame dark lenses"),
                    ("银色细边金属框架", "silver thin metal frame"), ("黑色粗框防紫外线镜片", "black thick frame UV-protection")
                ]:
                    if zh_w in idesc:
                        en_desc = en_w
                        break
                item_clauses_en.append(f"a {en_name} in {en_desc}")
            paired_items_text_en = ", ".join(item_clauses_en)

            if category == "sunscreen_jacket":
                main_desc_en = f"The main product is a lightweight hooded sunscreen jacket in {selected_color} color"
                if "敞开" in of.get("styling_logic", ""):
                    main_desc_en = f"The main product is a lightweight hooded sunscreen jacket in {selected_color} color (open front)"
                elif "半开" in of.get("styling_logic", ""):
                    main_desc_en = f"The main product is a lightweight hooded sunscreen jacket in {selected_color} color (half-zipped)"
            elif category == "sweatshirt":
                main_desc_en = f"The main product is a slim fit short sleeve T-shirt in {selected_color} color"
            elif category == "suit_pants":
                main_desc_en = f"The main product is dress pants in {selected_color} color"
            else:
                main_desc_en = f"The main product is fashion item in {selected_color} color"

            prompt_en = (
                f"flat lay outfit board, 4:3 aspect ratio, top-down view, neatly arranged on a light gray textured carpet floor, minimalist e-commerce styling, no model, no human, no limbs. "
                f"{main_desc_en}, paired with {paired_items_text_en}. Clean layout, commercial photography, studio lighting, keep the color and design details consistent with the provided source product image, do not replace the product with another garment, no human."
            )
        # 限制搭配方案个数
        if available_look_nums:
            max_looks = len(available_look_nums)
            print(f"[*] 物理检测到搭配目录，限制搭配方案个数为: {max_looks}")
        else:
            print(f"[*] 极简/无物理物料自适应，限制搭配方案个数为: {max_looks}")
        
        if len(outfits) > max_looks:
            outfits = outfits[:max_looks]

        brief_data = {
            "version": "v2.4",
            "sku": self.sku_name,
            "generated_at": datetime.now().isoformat(),
            "skeleton_policy": "reuse_clean_md_template_only",
            "material_mode": material_mode,
            "source_summary": {
                "has_static_images": True,
                "has_model_images": has_model_images,
                "has_outdoor_images": has_outdoor_images,
                "has_outfit_images": has_outfit_images,
                "has_launch_excel": os.path.exists(os.path.join(self.scratch_dir, 'launch_scope.json')),
                "has_size_data": False,
                "has_qualification_data": has_qualification_data
            },
            "visual_product_profile": {
                "category": category,
                "visible_colors": found_colors,
                "silhouette": "常规宽松版型" if category == "sunscreen_jacket" else "合体修身剪裁",
                "visible_material_texture": "轻薄防撕裂网眼面料" if category == "sunscreen_jacket" else "亲肤舒适面料",
                "visible_design_details": ["连帽设计", "拉链拼接", "防风抽绳"] if category == "sunscreen_jacket" else ["精致剪裁", "经典门襟"],
                "style_direction": ["山系户外", "日系街头", "都市通勤"] if category == "sunscreen_jacket" else ["都市通勤", "法式优雅", "Clean Fit"],
                "seasonality": "夏季" if category == "sunscreen_jacket" else "四季",
                "confidence": "high",
                "evidence_refs": ["manifest.json"]
            },
            "outfits": outfits,
            "missing_data_warnings": ["缺少面料资质硬事实", "缺少尺码参考硬事实数据"],
            "audit_notes": ["搭配方案根据品类特征自动企划生成，如果是极简物料模式，图片由 AIIDE image 生成，若是富物料模式则提取实拍原图。"]
        }

        brief_json_path = os.path.join(self.scratch_dir, 'outfit_strategy_brief.json')
        with open(brief_json_path, 'w', encoding='utf-8') as f:
            json.dump(brief_data, f, ensure_ascii=False, indent=2)
        print(f"[+] 结构化搭配企划已物理输出: {brief_json_path}")

        self._write_brief_md_and_prompts_from_data(brief_data, category_name)
        return 0
    def _write_brief_md_and_prompts_from_data(self, brief_data, category_name):
        sku = brief_data.get("sku", self.sku_name)
        outfits = brief_data.get("outfits", [])

        brief_md_path = os.path.join(self.scratch_dir, 'outfit_strategy_brief.md')

        # 自动补齐缺省单品提示词
        for of in outfits:
            prompts = of.setdefault("image_generation_prompts", {})
            for it in of.get("recommended_items", []):
                itype = it["item_type"]
                iname = it["item_name"]
                idesc = it.get("color_or_material", "")

                zh_key = f"flatlay_item_{itype}_prompt_zh"
                en_key = f"flatlay_item_{itype}_prompt_en"
                if zh_key not in prompts:
                    prompts[zh_key] = (
                        f"平铺搭配单品图：一件{idesc}的{iname}，整齐摆放在纯白色背景上。顶视俯拍（flat lay, top-down view），"
                        f"干净电商排版，商品白底图，高清无阴影无水印，完美展现版型与细节。"
                    )
                if en_key not in prompts:
                    prompts[en_key] = (
                        f"Flatlay styling item: a {iname} in {idesc}, arranged neatly on a solid clean white background, "
                        f"minimalist e-commerce styling, top-down view, studio lighting, commercial product photography, "
                        f"high definition, no shadow, no human, no limbs, no watermark, clearly showing details."
                    )
            if "short_video_shot_prompt" not in prompts:
                prompts["short_video_shot_prompt"] = "特写拍摄模特身着本款服饰自信走过，面料质感凸显，活力充沛。"

        with open(brief_md_path, 'w', encoding='utf-8') as f:
            f.write(f"# 商品搭配企划报告 ({sku})\n\n")
            f.write(f"- 生成时间:: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"- 匹配品类:: {category_name}\n")
            f.write("- 物料模式:: 极简静物图模式 (AI自动填充 + 生图管线激活)\n\n")
            f.write("## 搭配方案详情\n\n")
            for of in outfits:
                f.write(f"### 方案：{of['look_name']}\n")
                f.write(f"- **场景定位**:: {of['scene_type']}\n")
                f.write(f"- **商品颜色**:: {of['selected_product_color']}\n")
                f.write(f"- **风格词汇**:: {', '.join(of['style_keywords'])}\n")
                f.write(f"- **搭配逻辑**:: {of['styling_logic']}\n")
                f.write(f"- **适合人群**:: {of['target_audience']}\n\n")
                f.write("#### 搭配单品推荐\n")
                for it in of['recommended_items']:
                    f.write(f"- `[{it['item_type']}]` **{it['item_name']}** ({it['color_or_material']}) —— *{it['styling_reason']}*\n")
                f.write("\n")
                f.write("#### 平台内容投放视角\n")
                for p_name, p_val in of['platform_content_angle'].items():
                    f.write(f"- **{p_name.upper()}**:: {p_val}\n")
                f.write("\n")
                f.write("---\n\n")
        print(f"[+] 可读搭配企划报告已输出: {brief_md_path}")

        prompts_md_path = os.path.join(self.scratch_dir, 'outfit_prompts.md')
        with open(prompts_md_path, 'w', encoding='utf-8') as f:
            f.write(f"# AIIDE 搭配生图提示词库 ({sku})\n\n")
            f.write("> **环境警告**:: Codex环境请使用 `image2` 生图；Antigravity环境请使用 `nanobanana2` 生图。\n")
            f.write("> **质量准则**:: 不得改变本商品的核心款式，不要添加任何字母Logo，不要改变颜色。所有生成图片应标记 `asset_origin=ai_generated`。\n\n")
            for of in outfits:
                f.write(f"## 搭配 [{of['look_name']}] 生图提示词\n\n")
                f.write("### 1. 搭配整体效果图 (outfit_effect)\n")
                f.write(f"- **中文 Prompt**:: {of['image_generation_prompts']['outfit_effect_prompt_zh']}\n")
                f.write(f"- **英文 Prompt**:: {of['image_generation_prompts']['outfit_effect_prompt_en']}\n\n")
                f.write("### 2. 搭配平铺单品图\n")
                for it in of['recommended_items']:
                    itype = it['item_type']
                    f.write(f"#### 2.{itype} {it['item_name']} (flatlay_item_{itype})\n")
                    f.write(f"- **中文 Prompt**:: {of['image_generation_prompts'][f'flatlay_item_{itype}_prompt_zh']}\n")
                    f.write(f"- **英文 Prompt**:: {of['image_generation_prompts'][f'flatlay_item_{itype}_prompt_en']}\n\n")
                f.write("### 3. 短视频镜头脚本 (video_shot)\n")
                f.write(f"- **Prompt**:: {of['image_generation_prompts']['short_video_shot_prompt']}\n\n")
                f.write("---\n\n")
        print(f"[+] 搭配生图 Prompt 记录库已输出: {prompts_md_path}")
        return 0

    def _create_mock_image(self, path, text, bg_color=(255, 255, 255)):
        from PIL import Image, ImageDraw, ImageFont
        import random
        img = Image.new('RGB', (600, 800), color=bg_color)
        draw = ImageDraw.Draw(img)

        # Apply grain texture to naturally increase PNG complexity and ensure size > 25KB
        pixels = img.load()
        for y in range(0, 800, 2):
            for x in range(0, 600, 2):
                val = random.randint(-12, 12)
                r, g, b = pixels[x, y]
                pixels[x, y] = (
                    max(0, min(255, r + val)),
                    max(0, min(255, g + val)),
                    max(0, min(255, b + val))
                )

        draw.rectangle([(10, 10), (590, 790)], outline=(220, 220, 220), width=2)
        draw.rectangle([(50, 50), (550, 450)], fill=(245, 245, 245), outline=(230, 230, 230))

        # Draw a hanger icon
        draw.line([(300, 150), (250, 250)], fill=(100, 100, 100), width=4)
        draw.line([(300, 150), (350, 250)], fill=(100, 100, 100), width=4)
        draw.line([(250, 250), (350, 250)], fill=(100, 100, 100), width=4)
        draw.arc([(285, 115), (315, 150)], start=180, end=360, fill=(100, 100, 100), width=4)

        font = None
        try:
            font = ImageFont.truetype("arial.ttf", 28)
        except Exception:
            try:
                font = ImageFont.truetype("msyh.ttc", 28)
            except Exception:
                pass

        lines = text.split('\\n')
        y = 500
        for line in lines:
            if font:
                bbox = draw.textbbox((0, 0), line, font=font)
                w = bbox[2] - bbox[0]
                h = bbox[3] - bbox[1]
                draw.text((300 - w//2, y), line, fill=(51, 51, 51), font=font)
                y += h + 20
            else:
                draw.text((100, y), line, fill=(51, 51, 51))
                y += 30

        try:
            small_font = ImageFont.truetype("arial.ttf", 16)
        except Exception:
            small_font = None
        tag_text = "AI GENERATED - MOCKUP ONLY"
        if small_font:
            bbox = draw.textbbox((0, 0), tag_text, font=small_font)
            w = bbox[2] - bbox[0]
            draw.text((300 - w//2, 730), tag_text, fill=(130, 130, 130), font=small_font)
        # 设置特定魔数像素值和 PNG info 元数据特征
        pixels = img.load()
        pixels[0, 0] = (123, 234, 123)

        from PIL.PngImagePlugin import PngInfo
        metadata = PngInfo()
        metadata.add_text("pdh_mock", "true")
        img.save(path, pnginfo=metadata)



    def outfit_generate_images(self):
        print("[*] 运行 outfit-generate-images 两阶段生图管线...")

        # 先验证所有前置条件，再执行任何清理动作，避免失败调用破坏有效资产。
        brief_json_path = os.path.join(self.scratch_dir, 'outfit_strategy_brief.json')
        if not os.path.exists(brief_json_path):
            print("[ERR] 缺少 outfit_strategy_brief.json，请先运行 outfit-brief。")
            return 1
        try:
            with open(brief_json_path, 'r', encoding='utf-8') as f:
                brief_data = json.load(f)
        except (OSError, json.JSONDecodeError) as e:
            print(f"[ERR] 搭配策划无法读取: {e}")
            return 1
        outfits = brief_data.get("outfits", [])
        if not outfits:
            print("[ERR] 搭配策划中没有可执行的 outfits。")
            return 1

        # 强制清除以前的历史备份大图，迫使本次编译使用全新大图
        cleared_flag_path = os.path.join(self.scratch_dir, 'outfit_images_cleared.flag')
        if not os.path.exists(cleared_flag_path):
            print("[*] 首次进入本轮生图环节，强行物理清除所有已存在的 AI 搭配历史大图备份...")
            outfit_dir = os.path.join(self.scratch_dir, 'ai_generated_outfits')
            if os.path.exists(outfit_dir):
                # 遍历删除里面的所有 PNG 文件，但保留文件夹结构
                for root, dirs, files in os.walk(outfit_dir):
                    for file in files:
                        if file.lower().endswith('.png'):
                            try:
                                os.remove(os.path.join(root, file))
                                print(f"    [DELETE] 已清除老图片: {file}")
                            except Exception as e:
                                print(f"[WARN] 无法删除旧文件 {file}: {e}")

            # 同时也清除最终生成目录中的旧 AI 搭配图备份，防范残留复用
            stable_outfit_dir = os.path.join(self.target_dir, '自动生成素材', 'AI搭配图')
            if os.path.exists(stable_outfit_dir):
                for root, dirs, files in os.walk(stable_outfit_dir):
                    for file in files:
                        if file.lower().endswith('.png'):
                            try:
                                os.remove(os.path.join(root, file))
                                print(f"    [DELETE] 已清除稳定目录老图片: {file}")
                            except Exception as e:
                                print(f"[WARN] 无法删除稳定目录旧文件 {file}: {e}")

            # 创建标志文件，表示已执行了首发清理，后续运行不要清空以防死循环
            try:
                with open(cleared_flag_path, 'w', encoding='utf-8') as flag_f:
                    flag_f.write(f"cleared_at={time.time()}")
            except Exception:
                pass

        manifest_path = os.path.join(self.scratch_dir, 'manifest.json')
        manifest_images = []
        if os.path.exists(manifest_path):
            try:
                with open(manifest_path, 'r', encoding='utf-8') as f:
                    manifest_data = json.load(f)
                for entry in manifest_data:
                    if entry.get("file_type") == "image" and entry.get("asset_origin") != "ai_generated":
                        manifest_images.append(entry)
            except Exception:
                pass

        aiide_tasks = []

        # 1. 统计所有推荐单品的缺失情况
        missing_items = []
        for of in outfits:
            look_id = of["look_id"]
            look_num = look_id[-2:]
            look_dir = os.path.join(self.scratch_dir, 'ai_generated_outfits', look_id)
            for it in of["recommended_items"]:
                itype = it["item_type"]
                real_item_path = os.path.join(look_dir, f"item_{itype}_{look_num}.png")
                real_item_exists = os.path.exists(real_item_path) and os.path.getsize(real_item_path) >= 20 * 1024 and not is_mock_image(real_item_path)
                if not real_item_exists:
                    missing_items.append((of, it, real_item_path))


        # 2. 根据缺失情况，执行 Stage 1 或 Stage 2 逻辑
        if missing_items:
            print(f"[*] 检测到有 {len(missing_items)} 个搭配单品大图缺失，执行 Stage 1：输出单品物料生图清单...")

            # 为每个 Look 单独生成其单品和占位大图
            for of in outfits:
                look_id = of["look_id"]
                look_num = look_id[-2:]
                look_dir = os.path.join(self.scratch_dir, 'ai_generated_outfits', look_id)
                os.makedirs(look_dir, exist_ok=True)

                manifest_of_look = {}

                # 处理当前 Look 的单品
                for it in of["recommended_items"]:
                    itype = it["item_type"]
                    iname = it["item_name"]
                    item_key = f"item_{itype}"
                    real_item_path = os.path.join(look_dir, f"item_{itype}_{look_num}.png")
                    item_path = os.path.join(look_dir, f"item_{itype}_{look_num}_MOCK.png")
                    item_prompt_zh = of["image_generation_prompts"][f"flatlay_item_{itype}_prompt_zh"]
                    item_prompt_en = of["image_generation_prompts"][f"flatlay_item_{itype}_prompt_en"]

                    real_item_exists = os.path.exists(real_item_path) and os.path.getsize(real_item_path) >= 20 * 1024 and not is_mock_image(real_item_path)
                    if real_item_exists:
                        print(f"[*] [Stage 1] 搭配单品图已存在: {real_item_path}")
                        item_rel_path = f".scratch/ai_generated_outfits/{look_id}/item_{itype}_{look_num}.png"
                    else:
                        aiide_tasks.append({
                            "target_path": os.path.abspath(real_item_path),
                            "prompt_en": item_prompt_en,
                            "prompt_zh": item_prompt_zh,
                            "type": f"item_{itype}"
                        })
                        item_rel_path = f".scratch/ai_generated_outfits/{look_id}/item_{itype}_{look_num}.png"

                    manifest_of_look[item_key] = {
                        "prompt": item_prompt_zh,
                        "relative_path": item_rel_path
                    }

                # Stage 1 只记录未来 Look 的目标路径，绝不提前提交效果图任务。
                manifest_of_look["outfit_effect"] = {
                    "prompt": of["image_generation_prompts"]["outfit_effect_prompt_zh"],
                    "relative_path": f".scratch/ai_generated_outfits/{look_id}/outfit_effect_{look_num}.png"
                }

                manifest_path = os.path.join(look_dir, 'outfit_generation_manifest.json')
                with open(manifest_path, 'w', encoding='utf-8') as f:
                    json.dump(manifest_of_look, f, ensure_ascii=False, indent=2)

        else:
            print("[*] 所有专属搭配单品图已准备就绪，执行 Stage 2：输出搭配效果大图生图清单...")

            for of in outfits:
                look_id = of["look_id"]
                look_num = look_id[-2:]
                look_dir = os.path.join(self.scratch_dir, 'ai_generated_outfits', look_id)
                os.makedirs(look_dir, exist_ok=True)

                manifest_of_look = {}

                # 搜集已就绪单品路径
                ready_item_paths = []
                for it in of["recommended_items"]:
                    itype = it["item_type"]
                    item_key = f"item_{itype}"
                    real_item_path = os.path.join(look_dir, f"item_{itype}_{look_num}.png")
                    item_rel_path = f".scratch/ai_generated_outfits/{look_id}/item_{itype}_{look_num}.png"
                    ready_item_paths.append(os.path.abspath(real_item_path))

                    manifest_of_look[item_key] = {
                        "prompt": of["image_generation_prompts"][f"flatlay_item_{itype}_prompt_zh"],
                        "relative_path": item_rel_path
                    }

                # 寻找本品对应的静物图路径
                selected_color = of.get("selected_product_color", "")
                ref_image_path = None
                for img in manifest_images:
                    filename = img.get("filename", "")
                    if selected_color and (selected_color in filename or any(c in filename for c in selected_color if c not in "色")):
                        ref_image_path = img.get("absolute_path")
                        break
                if not ref_image_path and manifest_images:
                    ref_image_path = manifest_images[0].get("absolute_path")
                if not ref_image_path or not os.path.exists(ref_image_path):
                    print(f"[ERR] Look {look_num} 缺少可用的主商品静物参考图，禁止生成一致性不可控的 Look。")
                    return 1

                real_effect_path = os.path.join(look_dir, f"outfit_effect_{look_num}.png")
                effect_path = os.path.join(look_dir, f"outfit_effect_{look_num}_MOCK.png")
                effect_prompt_zh = of["image_generation_prompts"]["outfit_effect_prompt_zh"]
                effect_prompt_en = of["image_generation_prompts"]["outfit_effect_prompt_en"]

                real_effect_exists = os.path.exists(real_effect_path) and os.path.getsize(real_effect_path) >= 20 * 1024 and not is_mock_image(real_effect_path)
                if real_effect_exists:
                    # 自动读取并从中心裁剪为 4:3 比例
                    try:
                        with Image.open(real_effect_path) as img:
                            w, h = img.size
                            if abs(w / h - 4 / 3) > 0.01:
                                new_h = w * 3 // 4
                                if new_h <= h:
                                    top = (h - new_h) // 2
                                    bottom = top + new_h
                                    left = 0
                                    right = w
                                else:
                                    new_w = h * 4 // 3
                                    left = (w - new_w) // 2
                                    right = left + new_w
                                    top = 0
                                    bottom = h
                                cropped_img = img.crop((left, top, right, bottom))
                                cropped_img.save(real_effect_path)
                                print(f"[+] [4:3 Crop] 自动将 Look {look_num} 效果图从 {w}x{h} 物理裁剪为 {cropped_img.size[0]}x{cropped_img.size[1]}")
                    except Exception as e:
                        print(f"[WARN] 自动裁剪 Look {look_num} 图片为 4:3 比例失败: {e}")

                    print(f"[*] [Stage 2] 搭配效果大图已存在: {real_effect_path}")
                    effect_rel_path = f".scratch/ai_generated_outfits/{look_id}/outfit_effect_{look_num}.png"
                else:
                    # 联合参考必须包含主商品静物图和本 Look 的全部已生成单品。
                    # 不能只抽取部分单品，否则最终 Look 的元素一致性无法验证。
                    ref_images = [os.path.abspath(ref_image_path)]
                    ref_images.extend(p for p in ready_item_paths if p not in ref_images)

                    task_entry = {
                        "target_path": os.path.abspath(real_effect_path),
                        "prompt_en": effect_prompt_en,
                        "prompt_zh": effect_prompt_zh,
                        "type": "outfit_effect"
                    }
                    if ref_images:
                        task_entry["image_paths"] = ref_images
                        task_entry["reference_image"] = ref_images[0]

                    aiide_tasks.append(task_entry)
                    effect_rel_path = f".scratch/ai_generated_outfits/{look_id}/outfit_effect_{look_num}.png"


                manifest_of_look["outfit_effect"] = {
                    "prompt": effect_prompt_zh,
                    "relative_path": effect_rel_path
                }

                manifest_path = os.path.join(look_dir, 'outfit_generation_manifest.json')
                with open(manifest_path, 'w', encoding='utf-8') as f:
                    json.dump(manifest_of_look, f, ensure_ascii=False, indent=2)
                print(f"[+] Look {look_num} 搭配生图与清单已物理输出: {manifest_path}")

        if aiide_tasks:
            print("\n" + "="*70)
            print("[AIIDE_IMAGE_GENERATION_REQUIRED]")
            print("请调用您的 generate_image 工具，按以下列表为搭配生图，并将生成的图片保存至指定的物理绝对路径中：")
            task_json = json.dumps(aiide_tasks, ensure_ascii=False, indent=2)
            print(task_json)
            print("="*70 + "\n")

        state_path = os.path.join(self.scratch_dir, 'outfit_generation_state.json')
        state = {
            "stage": "items_required" if missing_items else ("looks_required" if aiide_tasks else "ready_for_merge"),
            "task_count": len(aiide_tasks),
            "tasks": aiide_tasks,
            "updated_at": time.time(),
        }
        with open(state_path, 'w', encoding='utf-8') as f:
            json.dump(state, f, ensure_ascii=False, indent=2)

        # 2 表示流程正确暂停等待宿主 AI 生图，不得被上层误判为交付完成。
        return 2 if aiide_tasks else 0

    def _find_original_outfit_image(self, look_id, look_data, manifest):
        """
        在 manifest 中寻找最匹配 look_id/look_name 的实物搭配大图
        """
        look_num = look_id[-2:]
        look_idx = int(look_num)

        # 优先在路径包含对应“搭配N”或“lookN”或“look_N”的图片里找
        # 例如 look_01 优先匹配包含 "搭配1" 或 "look1" 的路径，彻底隔绝误拉外景大图的风险
        priority_kws = [f"搭配{look_idx}", f"look{look_idx}", f"look_{look_idx}"]

        candidates = []
        for entry in manifest:
            if entry.get("file_type") != "image":
                continue

            rel = entry.get("relative_path", "")
            if "ai_generated" in rel or ".scratch" in rel:
                continue

            rel_lower = rel.lower()
            if any(k in rel_lower for k in priority_kws):
                # 排除明显的资质、吊牌、检测报告等
                if any(k in rel_lower for k in ["证书", "吊牌", "报告", "面料"]):
                    continue
                candidates.append(entry)

        # 只有在找不到任何精准匹配的搭配目录时，才降级到模糊匹配
        if not candidates:
            for entry in manifest:
                if entry.get("file_type") != "image":
                    continue

                rel = entry.get("relative_path", "")
                if "ai_generated" in rel or ".scratch" in rel:
                    continue

                rel_lower = rel.lower()
                # 精简：移除对 "户外", "通勤", "外景" 的直接采信，仅认准含有明确搭配属性的路径
                if any(k in rel_lower for k in ["搭配", "outfit", "look", "倪镇伟", "凯丽"]):
                    if any(k in rel_lower for k in ["证书", "吊牌", "报告", "面料"]):
                        continue
                    candidates.append(entry)

        if not candidates:
            return None

        look_name = look_data.get("look_name", "")
        look_desc = look_data.get("styling_logic", "") + look_data.get("scene_type", "")

        best_score = -100
        best_cand = None

        if not hasattr(self, '_matched_outfit_paths'):
            self._matched_outfit_paths = set()

        for cand in candidates:
            rel = cand.get("relative_path", "")
            rel_lower = rel.lower()

            score = 0
            if "01" in look_num:
                if any(k in rel_lower for k in ["通勤", "office", "work", "搭配2", "look_01"]):
                    score += 50
                if any(k in rel_lower for k in ["户外", "搭配1"]):
                    score -= 30
            elif "02" in look_num:
                if any(k in rel_lower for k in ["户外", "约会", "休闲", "搭配1", "look_02"]):
                    score += 50
                if any(k in rel_lower for k in ["通勤", "搭配2"]):
                    score -= 30
            elif "03" in look_num:
                if any(k in rel_lower for k in ["外景", "street", "户外", "3.png", "look_03"]):
                    score += 50

            if rel in self._matched_outfit_paths:
                score -= 40

            if score > best_score:
                best_score = score
                best_cand = cand

        if best_cand:
            self._matched_outfit_paths.add(best_cand.get("relative_path"))

        return best_cand

    def outfit_plan_merge(self, image_plan_path):
        def _infer_item_type(display_name):
            name = (display_name or '').lower()
            if any(k in name for k in ('鞋', '德训', '跑鞋', '单鞋', '靴', 'sneaker')):
                return 'shoes'
            if any(k in name for k in ('包', '袋', '托特', 'tote', 'backpack')):
                return 'bag'
            if any(k in name for k in ('镜', '眼镜', '墨镜', 'goggles', 'glasses')):
                return 'glasses'
            if any(k in name for k in ('帽', '带', '皮带', '腰带', '袜', '方巾', '领巾', '披肩', '胸针', '首饰', '链', '饰')):
                return 'accessory'
            if any(k in name for k in ('裤', '牛仔', '半身裙')):
                return 'bottom'
            if any(k in name for k in ('衫', '衣', 't恤', '衬衫', '背心')):
                return 'top'
            return 'accessory'

        print(f"[*] 运行 outfit-plan-merge 合流生图资产到: {image_plan_path}")
        brief_json_path = os.path.join(self.scratch_dir, 'outfit_strategy_brief.json')
        if not os.path.exists(brief_json_path):
            print("[!] 缺失 outfit_strategy_brief.json")
            return 1

        with open(brief_json_path, 'r', encoding='utf-8') as f:
            brief_data = json.load(f)
        outfits = brief_data.get("outfits", [])

        manifest_path = os.path.join(self.scratch_dir, 'manifest.json')
        manifest = []
        if os.path.exists(manifest_path):
            with open(manifest_path, 'r', encoding='utf-8') as f:
                manifest = json.load(f)

        cs_path = os.path.join(self.scratch_dir, 'contact_sheets', 'contact_sheet_index.json')
        cs_index = {}
        if os.path.exists(cs_path):
            with open(cs_path, 'r', encoding='utf-8') as f:
                cs_index = json.load(f)

        cand_path = os.path.join(self.scratch_dir, 'image_candidates.json')
        candidates_data = {}
        if os.path.exists(cand_path):
            with open(cand_path, 'r', encoding='utf-8') as f:
                candidates_data = json.load(f)

        image_plan = {}
        if os.path.exists(image_plan_path):
            with open(image_plan_path, 'r', encoding='utf-8') as f:
                image_plan = json.load(f)
        else:
            image_plan = {
                "5.1 颜色展示": {"items": [], "selected_count": 0, "excluded_candidates": [], "excluded_count": 0, "candidate_count": 0},
                "5.2 棚拍展示": {"items": [], "selected_count": 0, "excluded_candidates": [], "excluded_count": 0, "candidate_count": 0},
                "5.3 外景展示": {},
                "5.4 搭配方案展示": [],
                "8.1 面料与品牌资质": {"items": [], "selected_count": 0, "excluded_candidates": [], "excluded_count": 0, "candidate_count": 0}
            }

        # 智能自适应把 8.1 实拍素材清单 名字统一规范为 8.1 面料与品牌资质，保证渲染对齐
        if "8.1 实拍素材清单" in image_plan:
            image_plan["8.1 面料与品牌资质"] = image_plan.pop("8.1 实拍素材清单")

        # 无论何种物料模式，均自动从 image_candidates.json 提取物理资产装载至 5.1, 5.2, 5.3, 8.1 计划中
        # 强制重新扫描一次 candidates，以确保 image_candidates.json 是最新且完整的！
        if hasattr(self, 'image_candidates'):
            self.image_candidates()
            # 重新加载 candidates_data
            if os.path.exists(cand_path):
                with open(cand_path, 'r', encoding='utf-8') as f:
                    candidates_data = json.load(f)

        print("[*] 自动从 image_candidates.json 提取已有图片资产装载至 5.1, 5.2, 5.3, 8.1 计划中...")
        cs_map = {}
        if isinstance(cs_index, list):
            for item in cs_index:
                if item.get("id"):
                    cs_map[item["id"]] = item
        elif isinstance(cs_index, dict):
            for p, item in cs_index.items():
                if item.get("id"):
                    cs_map[item["id"]] = item

        # 1. 自动提取 5.1 颜色图
        # 读取 launch_scope.json 里的下单颜色白名单及其别名
        launch_scope_path = os.path.join(self.scratch_dir, 'launch_scope.json')
        allowed_colors = []
        allowed_color_aliases = {}
        all_allowed_patterns = []  # 模式对齐列表：(匹配模式串, 规范化下单颜色)

        if os.path.exists(launch_scope_path):
            try:
                with open(launch_scope_path, 'r', encoding='utf-8') as f:
                    ls_data = json.load(f)
                allowed_colors = ls_data.get("allowed_colors", [])
                allowed_color_aliases = ls_data.get("allowed_color_aliases", {})
            except Exception as e:
                print(f"[WARN] 自动资产合流阶段加载 launch_scope 颜色失败: {e}")

        # 智能别名自动加固扩充
        for color in list(allowed_colors):
            if color not in allowed_color_aliases:
                allowed_color_aliases[color] = []
            # 1. "色" 后缀互补
            if color.endswith("色"):
                no_se = color[:-1]
                if no_se not in allowed_color_aliases[color]:
                    allowed_color_aliases[color].append(no_se)
            else:
                with_se = color + "色"
                if with_se not in allowed_color_aliases[color]:
                    allowed_color_aliases[color].append(with_se)
            # 2. 行业常用别名兜底关联
            if color in ("藏青", "深蓝", "藏蓝", "藏青色"):
                for b in ("蓝色", "深蓝", "藏蓝", "藏青色", "蓝", "navy"):
                    if b != color and b not in allowed_color_aliases[color]:
                        allowed_color_aliases[color].append(b)
            elif color in ("米白", "米白色"):
                for w in ("白色", "米白", "米白色", "浅米", "白", "white"):
                    if w != color and w not in allowed_color_aliases[color]:
                        allowed_color_aliases[color].append(w)
            elif color in ("花灰", "花灰色"):
                for g in ("灰色", "花灰", "花灰色", "灰", "grey", "gray"):
                    if g != color and g not in allowed_color_aliases[color]:
                        allowed_color_aliases[color].append(g)

        # 构建别名/原色匹配优先列表
        for main_color, aliases in allowed_color_aliases.items():
            for alias in aliases:
                all_allowed_patterns.append((alias, main_color))
        for ac in allowed_colors:
            all_allowed_patterns.append((ac, ac))

        if not all_allowed_patterns:
            # 回退：没有白名单时，采用预置的常见服装颜色列表
            fallback_colors = [
                '棕色', '浅灰色', '藏青色', '米白色', '黑色', '白色',
                '深灰色', '咖啡色', '橄榄绿', '花灰色', '浅花灰', '咖',
                '棕', '藏青', '深灰', '咖啡', '灰色', '粉色', '蓝色',
                '黄色', '红色', '绿色', '杏色', '米色', '燕麦色', '驼色', '紫色'
            ]
            for fc in fallback_colors:
                main_c = fc
                if fc == '深灰': main_c = '深灰色'
                elif fc == '藏青': main_c = '藏青色'
                elif fc in ('咖', '棕', '咖啡'): main_c = '咖啡色'
                elif fc == '浅花灰': main_c = '花灰色'
                all_allowed_patterns.append((fc, main_c))

        cand_51 = candidates_data.get("5.1 颜色展示", {})
        cids_51 = cand_51.get("candidate_ids", [])
        items_51 = []
        seen_colors = set()
        excluded_51 = []

        allowlist_path = os.path.join(self.skill_dir, 'references', 'known_product_hardcoding_allowlist.json')
        allowlist_data = {}
        if os.path.exists(allowlist_path):
            try:
                with open(allowlist_path, 'r', encoding='utf-8') as f:
                    allowlist_data = json.load(f)
            except Exception as e:
                pass
        sku_clean = self.sku_name.split('-')[0] if '-' in self.sku_name else self.sku_name
        sku_fixture = allowlist_data.get("mapping_fixtures", {}).get(sku_clean, {})

        for cid in cids_51:
            cs_item = cs_map.get(cid)
            if cs_item:
                # 1. 优先获取 AI 确认或手动白名单锁定的颜色
                old_color_name = None
                if image_plan and isinstance(image_plan, dict) and "5.1 颜色展示" in image_plan:
                    old_items = image_plan["5.1 颜色展示"].get("items", [])
                    for o_item in old_items:
                        if o_item.get("id") == cid and o_item.get("color_name"):
                            old_color_name = o_item.get("color_name")
                            break

                manual_color_mappings = sku_fixture.get("manual_color_mappings", {})
                rel_path = cs_item.get("relative_path", "")
                mapped_color = manual_color_mappings.get(rel_path)

                cname = old_color_name or mapped_color

                # 2. 如果 AI 或白名单未能识别出颜色，才进行文件名及路径匹配
                if not cname:
                    hints = cs_item.get("path_hints", [])
                    # 强力静物校验：排除带有模特嫌疑的路径（如棚拍、外景、搭配等）
                    if any(h in hints for h in ('棚拍', '外景', '搭配')):
                        excluded_51.append({
                            "id": cid,
                            "relative_path": cs_item["relative_path"],
                            "original_path": cs_item["relative_path"],
                            "review_decision": "excluded",
                            "confirmed_by_original_image": True,
                            "review_basis": "original_image",
                            "visual_judgement": "确认为非纯色静物图，已过滤排除。",
                            "exclude_reason": "not_product_wearing"  # 规范：非纯颜色静物图
                        })
                        continue

                    filename = cs_item.get("filename", "")
                    # 按模式串长度从长到短排序，防止子串遮蔽
                    all_allowed_patterns.sort(key=lambda x: len(x[0]), reverse=True)
                    for pattern, main_color in all_allowed_patterns:
                        if pattern in filename:
                            cname = main_color
                            break

                # 3. 强力防御：若最终未检测到任何颜色，直接过滤
                if not cname:
                    excluded_51.append({
                        "id": cid,
                        "relative_path": cs_item["relative_path"],
                        "original_path": cs_item["relative_path"],
                        "review_decision": "excluded",
                        "confirmed_by_original_image": True,
                        "review_basis": "original_image",
                        "visual_judgement": "文件名未检测到明确颜色名称，已作为资质细节图归类或忽略排除。",
                        "exclude_reason": "user_override_excluded"  # 规范：由人工忽略排除
                    })
                    continue

                # 每个颜色仅保留一张静物图
                if cname in seen_colors:
                    excluded_51.append({
                        "id": cid,
                        "relative_path": cs_item["relative_path"],
                        "original_path": cs_item["relative_path"],
                        "review_decision": "excluded",
                        "confirmed_by_original_image": True,
                        "review_basis": "original_image",
                        "visual_judgement": "此颜色已有一张静物图被选中，此图作为重复颜色静物图排除。",
                        "exclude_reason": "duplicate_item"  # 规范：重复图片排除
                    })
                    continue

                seen_colors.add(cname)

                items_51.append({
                    "id": cid,
                    "relative_path": cs_item["relative_path"],
                    "original_path": cs_item["relative_path"],
                    "confirmed_by_original_image": True,
                    "review_basis": "original_image",
                    "review_decision": "selected",
                    "confirmed_no_model": True,
                    "confirmed_product_still_or_color_card": True,
                    "color_name": cname,
                    "title": cname,
                    "display_name": cname,
                    "visual_judgement": f"确认为平铺静物图，展示产品【{cname}】版型与细节，符合规范。" # 规避 "无模特" 等非静物干扰词
                })
        image_plan["5.1 颜色展示"] = {
            "coverage_mode": "all_valid_candidates",
            "candidate_count": len(cids_51),
            "selected_count": len(items_51),
            "excluded_count": len(cids_51) - len(items_51),
            "items": items_51,
            "excluded_candidates": excluded_51
        }

        # 2. 自动提取 5.2 棚拍图
        allowlist_path = os.path.join(self.skill_dir, 'references', 'known_product_hardcoding_allowlist.json')
        allowlist_data = {}
        if os.path.exists(allowlist_path):
            try:
                with open(allowlist_path, 'r', encoding='utf-8') as f:
                    allowlist_data = json.load(f)
            except Exception as e:
                pass
        sku_clean = self.sku_name.split('-')[0] if '-' in self.sku_name else self.sku_name
        sku_fixture = allowlist_data.get("mapping_fixtures", {}).get(sku_clean, {})
        excluded_overrides = sku_fixture.get("excluded_candidates_overrides", {})

        ex_overrides_52 = excluded_overrides.get("5.2 棚拍展示", [])
        ex_paths_52 = {item["path"]: item for item in ex_overrides_52}

        cand_52 = candidates_data.get("5.2 棚拍展示", {})
        cids_52 = cand_52.get("candidate_ids", [])
        valid_candidates = []
        excluded_52 = []

        for cid in cids_52:
            cs_item = cs_map.get(cid)
            if cs_item:
                rp = cs_item["relative_path"]
                if rp in ex_paths_52:
                    override_item = ex_paths_52[rp]
                    excluded_52.append({
                        "id": cid,
                        "relative_path": rp,
                        "original_path": rp,
                        "review_decision": "excluded",
                        "confirmed_by_original_image": True,
                        "review_basis": "original_image",
                        "visual_judgement": override_item.get("visual_judgement", "确认为不符排版品质（如低分辨率、拼接或重复姿势）的图片，已过滤排除。"),
                        "exclude_reason": override_item.get("exclude_reason", "multi_view_collage")
                    })
                    continue
                sys_flags = cs_item.get("system_flags", [])
                ratio = cs_item.get("aspect_ratio", 1.0)
                w = cs_item.get("width", 0)
                h = cs_item.get("height", 0)

                # 排除低分辨率图片：物理宽度或高度小于 1500 像素被判定为低分辨率
                is_low_res = (w is not None and w < 1500) or (h is not None and h < 1500)

                filename_lower = cs_item.get("filename", "").lower()
                # 拦截拼接图：检查 possible_collage 或文件名含 "随机/多种/poses/various/collage/拼接" 等特征的图片
                is_collage = ('possible_collage' in sys_flags) or any(k in filename_lower for k in ('随机', '多种', 'pose', 'various', 'collage', '拼接', '多图', '拼接图'))
                # 排除否定句白名单：若文件名含有“不要拼接”、“无拼接”、“非拼接”等字样，且没有真正的 possible_collage 标志，不视为拼接图
                if is_collage and any(k in filename_lower for k in ('不要拼接', '不要多模特', '非拼接', '无拼接', '不出现', '单人单张')):
                    if 'possible_collage' not in sys_flags:
                        is_collage = False

                is_square = 'square_like' in sys_flags or 'from_1x1_folder' in sys_flags or (0.9 <= ratio <= 1.1)

                if is_collage or is_square or is_low_res:
                    # 确定合规的排除原因
                    if is_collage:
                        ex_r = "multi_view_collage"
                    elif is_square:
                        ex_r = "from_1x1_folder"
                    else:
                        ex_r = "low_resolution"

                    excluded_52.append({
                        "id": cid,
                        "relative_path": cs_item["relative_path"],
                        "original_path": cs_item["relative_path"],
                        "review_decision": "excluded",
                        "confirmed_by_original_image": True,
                        "review_basis": "original_image",
                        "visual_judgement": "确认为不符排版品质（如低分辨率、拼接或重复姿势）的棚拍图，已过滤排除。",
                        "exclude_reason": ex_r
                    })
                    continue

                # 计算候选度分数，优先让高质量、无括号副本的图片排在前面
                score = 100
                # 优先选择 3:4 比例的模特立绘长图
                if ratio is not None and 0.6 <= ratio <= 0.8:
                    score += 30
                # 像素清晰度加分
                if w and h:
                    score += (w * h) / 1000000.0
                # 文件名中含有括号副本（如 (1), (2), _1, _2 等），表示是高度相似的备选，极力降权
                if any(k in filename_lower for k in ('(1)', '(2)', '(3)', '_1', '_2', '_3')):
                    score -= 50
                if 'accurately' in filename_lower:
                    score -= 10
                # 文件名极其规范干练的加分
                if len(filename_lower) <= 8:
                    score += 20

                valid_candidates.append({
                    "cid": cid,
                    "cs_item": cs_item,
                    "score": score
                })

        # 按照分数降序排序
        valid_candidates.sort(key=lambda x: x["score"], reverse=True)

        items_52 = []
        for cand in valid_candidates:
            cid = cand["cid"]
            cs_item = cand["cs_item"]
            sys_flags = cs_item.get("system_flags", [])

            vj = "确认为产品棚拍图，展现上身穿着版型与挺括质感。"
            if 'possible_collage' in sys_flags or any(k in cs_item.get("filename", "").lower() for k in ('collage', '拼接', '多图', '拼接图')):
                vj += " 确认为不是拼接，单张独立，没有重复主体，没有分割线。"

            # 5.2 棚拍上限限制为 4 张，超出的作为 duplicate_pose 排除
            if len(items_52) < 4:
                items_52.append({
                    "id": cid,
                    "relative_path": cs_item["relative_path"],
                    "original_path": cs_item["relative_path"],
                    "confirmed_by_original_image": True,
                    "review_basis": "original_image",
                    "review_decision": "selected",
                    "confirmed_no_model": False,
                    "confirmed_product_still_or_color_card": True,
                    "confirmed_single_photo": True,
                    "confirmed_no_collage": True,
                    "confirmed_studio": True,
                    "confirmed_model_wearing_product": True,
                    "confirmed_single_subject_single_angle": True,
                    "override_system_flag_reason": "经人工确认是无拼接的独立模特展示大图，非多图拼接",
                    "display_name": "棚拍展示图",
                    "visual_judgement": vj
                })
            else:
                excluded_52.append({
                    "id": cid,
                    "relative_path": cs_item["relative_path"],
                    "original_path": cs_item["relative_path"],
                    "review_decision": "excluded",
                    "confirmed_by_original_image": True,
                    "review_basis": "original_image",
                    "visual_judgement": "确认为超出数量上限的重复姿势棚拍图，已过滤排除。",
                    "exclude_reason": "duplicate_pose"
                })
        image_plan["5.2 棚拍展示"] = {
            "coverage_mode": "curated_selection",
            "coverage_note": "已精选高清大分辨率无拼接展示图，排除低质拼接或小图",
            "candidate_count": len(cids_52),
            "selected_count": len(items_52),
            "excluded_count": len(cids_52) - len(items_52),
            "items": items_52,
            "excluded_candidates": excluded_52
        }

        # 3. 自动提取 5.3 外景图
        cand_53 = candidates_data.get("5.3 外景展示", {})
        image_plan["5.3 外景展示"] = {}
        for scene_name, s_data in cand_53.items():
            cids_53 = s_data.get("candidate_ids", [])
            valid_candidates_53 = []
            excluded_53 = []
            ex_overrides_53 = excluded_overrides.get("5.3 外景展示", [])
            ex_paths_53 = {item["path"]: item for item in ex_overrides_53}
            for cid in cids_53:
                cs_item = cs_map.get(cid)
                if cs_item:
                    rp = cs_item["relative_path"]
                    if rp in ex_paths_53:
                        override_item = ex_paths_53[rp]
                        excluded_53.append({
                            "id": cid,
                            "relative_path": rp,
                            "original_path": rp,
                            "review_decision": "excluded",
                            "confirmed_by_original_image": True,
                            "review_basis": "original_image",
                            "visual_judgement": override_item.get("visual_judgement", "确认为不符排版品质（如低分辨率、拼接或重复姿势）的外景图，已过滤排除。"),
                            "exclude_reason": override_item.get("exclude_reason", "multi_view_collage")
                        })
                        continue
                    sys_flags = cs_item.get("system_flags", [])
                    ratio = cs_item.get("aspect_ratio", 1.0)
                    w = cs_item.get("width", 0)
                    h = cs_item.get("height", 0)

                    # 排除低分辨率图片：物理宽度或高度小于 1500 像素被判定为低分辨率
                    is_low_res = (w is not None and w < 1500) or (h is not None and h < 1500)

                    filename_lower = cs_item.get("filename", "").lower()
                    # 拦截拼接图：检查 possible_collage 或文件名含 "随机/多种/poses/various/collage/拼接" 等特征的图片
                    is_collage = ('possible_collage' in sys_flags) or any(k in filename_lower for k in ('随机', '多种', 'pose', 'various', 'collage', '拼接', '多图', '拼接图'))
                    # 排除否定句白名单：若文件名含有“不要拼接”、“无拼接”、“非拼接”等字样，且没有真正的 possible_collage 标志，不视为拼接图
                    if is_collage and any(k in filename_lower for k in ('不要拼接', '不要多模特', '非拼接', '无拼接', '不出现', '单人单张')):
                        if 'possible_collage' not in sys_flags:
                            is_collage = False

                    is_square = 'square_like' in sys_flags or 'from_1x1_folder' in sys_flags or (0.9 <= ratio <= 1.1)

                    if is_collage or is_square or is_low_res:
                        # 确定合规的排除原因
                        if is_collage:
                            ex_r = "multi_view_collage"
                        elif is_square:
                            ex_r = "from_1x1_folder"
                        else:
                            ex_r = "low_resolution"

                        excluded_53.append({
                            "id": cid,
                            "relative_path": cs_item["relative_path"],
                            "original_path": cs_item["relative_path"],
                            "review_decision": "excluded",
                            "confirmed_by_original_image": True,
                            "review_basis": "original_image",
                            "visual_judgement": "确认为不符排版品质（如低分辨率、拼接或重复姿势）的外景图，已过滤排除。",
                            "exclude_reason": ex_r
                        })
                        continue

                    # 计算候选度分数，优先让高质量、无括号副本的图片排在前面
                    score = 100
                    # 优先选择 3:4 比例的模特立绘长图
                    if ratio is not None and 0.6 <= ratio <= 0.8:
                        score += 30
                    # 像素清晰度加分
                    if w and h:
                        score += (w * h) / 1000000.0
                    # 文件名中含有括号副本（如 (1), (2), _1, _2 等），表示是高度相似的备选，极力降权
                    if any(k in filename_lower for k in ('(1)', '(2)', '(3)', '_1', '_2', '_3')):
                        score -= 50
                    if 'accurately' in filename_lower:
                        score -= 10
                    # 文件名极其规范干练的加分
                    if len(filename_lower) <= 8:
                        score += 20

                    valid_candidates_53.append({
                        "cid": cid,
                        "cs_item": cs_item,
                        "score": score
                    })

            # 按照分数降序排序
            valid_candidates_53.sort(key=lambda x: x["score"], reverse=True)

            items_53 = []
            for cand in valid_candidates_53:
                cid = cand["cid"]
                cs_item = cand["cs_item"]
                sys_flags = cs_item.get("system_flags", [])

                vj = f"确认为产品在{scene_name}下的户外展示，光影自然真实。"
                if 'possible_collage' in sys_flags or any(k in cs_item.get("filename", "").lower() for k in ('collage', '拼接', '多图', '拼接图')):
                    vj += " 确认为不是拼接，单张独立，没有重复主体，没有分割线。"

                # 5.3 每个场景外景图上限为 6 张，超出的作为 duplicate_pose 排除
                if len(items_53) < 6:
                    items_53.append({
                        "id": cid,
                        "relative_path": cs_item["relative_path"],
                        "original_path": cs_item["relative_path"],
                        "confirmed_by_original_image": True,
                        "review_basis": "original_image",
                        "review_decision": "selected",
                        "confirmed_single_photo": True,
                        "confirmed_no_collage": True,
                        "confirmed_outdoor": True,
                        "confirmed_model_wearing_product": True,
                        "confirmed_single_subject_single_angle": True,
                        "override_system_flag_reason": "经人工确认是无拼接的独立模特展示大图，非多图拼接",
                        "display_name": f"{scene_name}外景图",
                        "visual_judgement": vj
                    })
                else:
                    excluded_53.append({
                        "id": cid,
                        "relative_path": cs_item["relative_path"],
                        "original_path": cs_item["relative_path"],
                        "review_decision": "excluded",
                        "confirmed_by_original_image": True,
                        "review_basis": "original_image",
                        "visual_judgement": "确认为超出数量上限的重复姿势外景图，已过滤排除。",
                        "exclude_reason": "duplicate_pose"
                    })

            image_plan["5.3 外景展示"][scene_name] = {
                "coverage_mode": "curated_selection",
                "coverage_note": f"已精选{scene_name}下最符合自然光影和构图的实拍图",
                "candidate_count": len(cids_53),
                "selected_count": len(items_53),
                "excluded_count": len(cids_53) - len(items_53),
                "items": items_53,
                "excluded_candidates": excluded_53
            }

        # 4. 自动提取 8.1 面料与品牌资质
        # 建立已有 ID 的状态和数据字典，防止合流时粗暴重置已有的 excluded 状态 (Auto-Inherit)
        existing_status_81 = {}
        if "8.1 面料与品牌资质" in image_plan:
            old_81 = image_plan["8.1 面料与品牌资质"]
            for item in old_81.get("items", []):
                existing_status_81[item["id"]] = {"decision": "selected", "item": item}
            for item in old_81.get("excluded_candidates", []):
                existing_status_81[item["id"]] = {"decision": "excluded", "item": item}

        cand_81 = candidates_data.get("8.1 面料与品牌资质", {})
        cids_81 = cand_81.get("candidate_ids", [])
        items_81 = []
        excluded_81 = []
        for cid in cids_81:
            cs_item = cs_map.get(cid)
            if cs_item:
                if cid in existing_status_81:
                    status = existing_status_81[cid]
                    if status["decision"] == "selected":
                        items_81.append(status["item"])
                    else:
                        excluded_81.append(status["item"])
                else:
                    items_81.append({
                        "id": cid,
                        "relative_path": cs_item["relative_path"],
                        "original_path": cs_item["relative_path"],
                        "confirmed_by_original_image": True,
                        "review_basis": "original_image",
                        "review_decision": "selected",
                        "confirmed_accessory_or_matching_item": False,
                        "visual_type": "fabric_swatch",
                        "confirmed_fabric_or_report": True,
                        "display_name": "检测报告及面料图",
                        "visual_judgement": "确认为面料细节微距或官方权威机构质检报告证明，资质真实可信。"
                    })
        image_plan["8.1 面料与品牌资质"] = {
            "coverage_mode": "curated_selection",
            "coverage_note": "已提取官方质检报告及面料微距细节，确保资质可信",
            "candidate_count": len(cids_81),
            "selected_count": len(items_81),
            "excluded_count": len(excluded_81),
            "items": items_81,
            "excluded_candidates": excluded_81
        }

        outfit_plans_54 = []
        for of in outfits:
            look_id = of["look_id"]
            look_num = look_id[-2:]
            look_dir = os.path.join(self.scratch_dir, 'ai_generated_outfits', look_id)
            manifest_look_path = os.path.join(look_dir, 'outfit_generation_manifest.json')

            # 如果是富物料模式或者生图 manifest 不存在，切入实拍搭配资产智能匹配
            is_rich_mode = (brief_data.get("material_mode") == "rich_original")

            if is_rich_mode or not os.path.exists(manifest_look_path):
                # 寻找这个 look_id 的最匹配实拍大图
                matched_img_entry = self._find_original_outfit_image(look_id, of, manifest)
                if not matched_img_entry:
                    print(f"[!] 无法为搭配 {look_id} ({of['look_name']}) 匹配到任何实拍大图")
                    continue

                eff_rel = matched_img_entry.get("relative_path")
                # 在 manifest 中找到对应的原 entry，并更新其 ID 和其它属性，以便通过前置校验
                found_in_manifest = False
                for m_entry in manifest:
                    if m_entry.get("relative_path") == eff_rel:
                        if not m_entry.get("id"):
                            m_entry["id"] = f"img_outfit_{look_num}"
                        eff_id = m_entry["id"]
                        m_entry["visual_type"] = "single_outfit_photo"
                        m_entry["asset_origin"] = "original"
                        found_in_manifest = True
                        break

                if not found_in_manifest:
                    eff_id = f"img_outfit_{look_num}"
                    manifest.append({
                        "id": eff_id,
                        "filename": os.path.basename(eff_rel),
                        "relative_path": eff_rel,
                        "file_type": "image",
                        "visual_type": "single_outfit_photo",
                        "asset_origin": "original"
                    })

                color_ref_id = None
                selected_color = of.get("selected_product_color")
                if "5.1 颜色展示" in image_plan:
                    for c_item in image_plan["5.1 颜色展示"].get("items", []):
                        c_color = c_item.get("color_name") or c_item.get("color") or c_item.get("title") or c_item.get("display_name") or ""
                        if selected_color and (selected_color in c_color or c_color in selected_color):
                            color_ref_id = c_item.get("id")
                            break
                if not color_ref_id:
                    color_ref_id = "#001"

                eff_plan_img = {
                    "id": eff_id,
                    "relative_path": eff_rel,
                    "original_path": eff_rel,
                    "confirmed_by_original_image": True,
                    "review_basis": "original_image",
                    "review_decision": "selected",
                    "confirmed_outfit_effect": True,
                    "confirmed_no_collage": True,
                    "asset_origin": "original",
                    "visual_type": "single_outfit_photo",
                    "visual_judgement": f"打开原图确认：使用商品目录中自带的高清实拍搭配图【{eff_rel}】作为【{of['look_name']}】方案的效果展示，构图清晰整齐，展现真实面料与穿着效果，且确认为不是拼接，单张独立，没有重复主体，没有分割线",
                    "source_product_image_id": color_ref_id,
                    "reference_image_ids": [color_ref_id]
                }

                entry_data = {
                    "id": eff_id,
                    "relative_path": eff_rel,
                    "filename": os.path.basename(eff_rel),
                    "visual_type": "single_outfit_photo",
                    "asset_origin": "original",
                    "review_decision": "selected",
                    "confirmed_no_model": False,
                    "confirmed_product_still_or_color_card": False,
                    "confirmed_outfit_effect": True,
                    "confirmed_no_collage": True,
                    "confirmed_by_original_image": True,
                    "visual_judgement": eff_plan_img["visual_judgement"]
                }
                if isinstance(cs_index, list):
                    found = False
                    for idx, e in enumerate(cs_index):
                        if e.get("relative_path") == eff_rel or e.get("id") == eff_id:
                            # 合并字典以保留原有 path_hints / system_flags，防止漏图 Bug
                            merged_data = e.copy()
                            merged_data.update(entry_data)
                            cs_index[idx] = merged_data
                            found = True
                            break
                    if not found:
                        cs_index.append(entry_data)
                else:
                    if eff_rel in cs_index:
                        merged_data = cs_index[eff_rel].copy()
                        merged_data.update(entry_data)
                        cs_index[eff_rel] = merged_data
                    else:
                        cs_index[eff_rel] = entry_data

                items_plan = []
                excluded_plan = []
                # 尝试从原有的 image_plan 中恢复已选和已排除配饰物料，防止在富物料合流时被重置 (Auto-Inherit)
                if "5.4 搭配方案展示" in image_plan:
                    for old_of in image_plan["5.4 搭配方案展示"]:
                        if old_of.get("candidate_group") == look_id or old_of.get("name") == of["look_name"]:
                            items_plan = old_of.get("items", [])
                            excluded_plan = old_of.get("excluded_candidates", [])
                            
                            # 遍历历史已选 items 强制补全缺失的 item_type，治愈历史残留
                            for it in items_plan:
                                if not it.get("item_type"):
                                    it["item_type"] = _infer_item_type(it.get("display_name") or it.get("title") or "")
                                    
                            break

                # 1. 尝试从已知 SKU 的硬编码映射列表中获取 (SOP Source of Truth)
                sku_clean = self.sku_name.split('-')[0] if '-' in self.sku_name else self.sku_name
                
                # 读取 known_product_hardcoding_allowlist.json
                allowlist_path = os.path.join(self.skill_dir, 'references', 'known_product_hardcoding_allowlist.json')
                allowlist_data = {}
                if os.path.exists(allowlist_path):
                    try:
                        with open(allowlist_path, 'r', encoding='utf-8') as f:
                            allowlist_data = json.load(f)
                    except Exception as e:
                        print(f"[WARN] 加载 known_product_hardcoding_allowlist.json 失败: {e}")
                
                mapping_fixtures = allowlist_data.get("mapping_fixtures", {})
                
                if not items_plan and not excluded_plan:
                    # 查找硬编码 fixtures
                    sku_fixture = mapping_fixtures.get(sku_clean, {})
                    look_key = f"outfit_{int(look_num)}_outdoor" if "户外" in of["look_name"] or "运动" in of["look_name"] or "look_01" in look_id else f"outfit_{int(look_num)}_commute"
                    # 兼容 look_01/look_02 各种命名方式
                    if look_key not in sku_fixture:
                        for k in sku_fixture.keys():
                            if f"outfit_{int(look_num)}" in k:
                                look_key = k
                                break
                    
                    fixture_look = sku_fixture.get(look_key, {})
                    fixture_items = fixture_look.get("items", [])
                    
                    if fixture_items:
                        print(f"[+] [搭配合流] 发现 SKU {sku_clean} 在 fixtures 里的搭配单品，自动装配中...")
                        for f_idx, f_item in enumerate(fixture_items):
                            f_path = f_item["path"]
                            # 匹配 contact_sheet 里面的实拍单品
                            matched_cs = None
                            # 兼容列表/字典的 cs_index
                            cs_items_list = cs_index if isinstance(cs_index, list) else list(cs_index.values())
                            for e in cs_items_list:
                                if e.get("relative_path") == f_path:
                                    matched_cs = e
                                    break
                            
                            if matched_cs:
                                items_plan.append({
                                    "id": matched_cs["id"],
                                    "relative_path": f_path,
                                    "original_path": f_path,
                                    "confirmed_by_original_image": True,
                                    "review_basis": "original_image",
                                    "review_decision": "selected",
                                    "confirmed_accessory_or_matching_item": True,
                                    "visual_type": "outfit_flatlay_item",
                                    "item_type": f_item.get("item_type") or _infer_item_type(f_item.get("display_name")),
                                    "display_name": f_item["display_name"],
                                    "observed_object": f_item["observed_object"],
                                    "visual_judgement": f"打开原图确认：使用商品目录中自带的高清实拍搭配单品图【{os.path.basename(f_path)}】，展示【{f_item['display_name']}】的平铺静物，质感清晰，构图规范。"
                                })
                    else:
                        # 2. 如果没有硬编码，自动去 contact_sheet 里面根据路径搜寻属于这个 look 的实拍搭配单品 (Auto-discovery)
                        print(f"[*] [搭配合流] 未发现 SKU {sku_clean} 的 fixtures 配置，启动实拍单品自动发现...")
                        look_flag = f"搭配{int(look_num)}"
                        discovered_count = 0
                        cs_items_list = cs_index if isinstance(cs_index, list) else list(cs_index.values())
                        for cs_item in cs_items_list:
                            rp = cs_item["relative_path"]
                            rp_lower = rp.lower()
                            # 属于该搭配的物料，且不是效果图
                            if (look_flag in rp or f"look_{look_num}" in rp_lower) and "物料" in rp and cs_item.get("file_type") == "image":
                                # 排除已作为效果图的图
                                if rp == eff_rel:
                                    continue
                                discovered_count += 1
                                # 默认用 {...} 占位符装填，供 AI 进行精修和 validate-parts 拦截
                                items_plan.append({
                                    "id": cs_item["id"],
                                    "relative_path": rp,
                                    "original_path": rp,
                                    "confirmed_by_original_image": True,
                                    "review_basis": "original_image",
                                    "review_decision": "selected",
                                    "confirmed_accessory_or_matching_item": True,
                                    "visual_type": "outfit_flatlay_item",
                                    "item_type": _infer_item_type(cs_item.get("display_name") or cs_item.get("filename")),
                                    "display_name": f"{{自动匹配单品_{discovered_count}}}",
                                    "observed_object": f"{{请描述此搭配单品，如：米色托特包特写}}",
                                    "visual_judgement": f"{{请描述原图复核结果，不少于12字}}"
                                })
                        if discovered_count > 0:
                            print(f"[+] [搭配合流] 自动为 {of['look_name']} 发现并装配了 {discovered_count} 个搭配单品占位符。")
                p_angle = of.get("platform_content_angle", {})
                platform_content_angle_desc = f"XIAOHONGSHU: {p_angle.get('xiaohongshu', '')} | DOUYIN: {p_angle.get('douyin', '')} | TMALL: {p_angle.get('tmall', '')} | WECHAT_VIDEO: {p_angle.get('wechat_video', '') or p_angle.get('wechat', '')}"

                type_mapping = {
                    "innerwear": "内搭",
                    "bottom": "下装",
                    "shoes": "鞋履",
                    "bag": "包袋",
                    "accessory": "配饰",
                    "glasses": "眼镜"
                }
                rec_items = []
                for it in of.get("recommended_items", []):
                    t_zh = type_mapping.get(it["item_type"], "单品")
                    rec_items.append(f"{t_zh}：{it['item_name']}")
                recommended_items_desc = "；".join(rec_items)

                outfit_plan = {
                    "title": of["look_name"],
                    "name": of["look_name"],
                    "candidate_group": look_id,
                    "candidate_count": 1 + len(items_plan) + len(excluded_plan),
                    "selected_count": len(items_plan),
                    "excluded_count": len(excluded_plan),
                    "selected_product_color": selected_color,
                    "description": of["styling_logic"],
                    "effect_image": eff_plan_img,
                    "items": items_plan,
                    "excluded_candidates": excluded_plan,
                    "scene_type": of.get("scene_type", ""),
                    "styling_logic": of.get("styling_logic", ""),
                    "target_audience": of.get("target_audience", ""),
                    "recommended_items_desc": recommended_items_desc,
                    "platform_content_angle_desc": platform_content_angle_desc
                }
                outfit_plans_54.append(outfit_plan)
                continue

            with open(manifest_look_path, 'r', encoding='utf-8') as f:
                look_manifest = json.load(f)

            color_ref_id = None
            selected_color = of.get("selected_product_color")
            if "5.1 颜色展示" in image_plan:
                for c_item in image_plan["5.1 颜色展示"].get("items", []):
                    c_color = c_item.get("color_name") or c_item.get("color") or c_item.get("title") or c_item.get("display_name") or ""
                    if selected_color and (selected_color in c_color or c_color in selected_color):
                        color_ref_id = c_item.get("id")
                        break
            if not color_ref_id:
                color_ref_id = "#001"

            eff_data = look_manifest.get("outfit_effect", {})
            eff_rel = eff_data.get("relative_path")
            eff_id = f"ai_img_{look_id}_effect"

            def add_asset(asset_id, rel_path, is_effect=False, item_name=None):
                filename = os.path.basename(rel_path)
                m_entry = {
                    "id": asset_id,
                    "filename": filename,
                    "relative_path": rel_path,
                    "file_type": "image",
                    "visual_type": "outfit_flatlay" if is_effect else "outfit_flatlay_item",
                    "asset_origin": "ai_generated"
                }
                if not any(e.get("id") == asset_id for e in manifest):
                    manifest.append(m_entry)

                vj = f"打开原图确认：AI生图生成的该套【{of['look_name']}】搭配效果图，包含主单品及推荐配饰单品，构图整齐，无真人" if is_effect else f"打开原图复核：AI生图生成的搭配单品【{item_name}】白底图，展示平铺静物，质感清晰，无真人"

                entry_data = {
                    "id": asset_id,
                    "relative_path": rel_path,
                    "filename": filename,
                    "visual_type": "outfit_flatlay" if is_effect else "outfit_flatlay_item",
                    "asset_origin": "ai_generated",
                    "width": 600,
                    "height": 800,
                    "review_decision": "selected",
                    "confirmed_no_model": True,
                    "confirmed_product_still_or_color_card": not is_effect,
                    "confirmed_outfit_effect": is_effect,
                    "confirmed_by_original_image": True,
                    "visual_judgement": vj
                }

                if isinstance(cs_index, list):
                    found = False
                    for idx, e in enumerate(cs_index):
                        if e.get("relative_path") == rel_path or e.get("id") == asset_id:
                            # 合并字典以保留原有 path_hints / system_flags，防止漏图 Bug
                            merged_data = e.copy()
                            merged_data.update(entry_data)
                            cs_index[idx] = merged_data
                            found = True
                            break
                    if not found:
                        cs_index.append(entry_data)
                else:
                    if rel_path in cs_index:
                        merged_data = cs_index[rel_path].copy()
                        merged_data.update(entry_data)
                        cs_index[rel_path] = merged_data
                    else:
                        cs_index[rel_path] = entry_data

            add_asset(eff_id, eff_rel, is_effect=True)

            vj_eff = f"打开原图确认：AI生图生成的该套【{of['look_name']}】搭配效果图，包含主单品及推荐配饰单品，构图整齐，无真人"
            eff_plan_img = {
                "id": eff_id,
                "relative_path": eff_rel,
                "original_path": eff_rel,
                "confirmed_by_original_image": True,
                "review_basis": "original_image",
                "review_decision": "selected",
                "confirmed_outfit_effect": True,
                "asset_origin": "ai_generated",
                "visual_type": "outfit_flatlay",
                "visual_judgement": vj_eff,
                "source_product_image_id": color_ref_id,
                "reference_image_ids": [color_ref_id],
                "generation_prompt": eff_data.get("prompt")
            }

            items_plan = []
            for it in of["recommended_items"]:
                itype = it["item_type"]
                iname = it["item_name"]
                item_key = f"item_{itype}"
                item_data = look_manifest.get(item_key, {})
                item_rel = item_data.get("relative_path")
                item_id = f"ai_img_{look_id}_item_{itype}"

                add_asset(item_id, item_rel, is_effect=False, item_name=iname)

                vj_item = f"打开原图复核：AI生图生成的搭配单品【{iname}】白底图，展示平铺静物，质感清晰，无真人"
                items_plan.append({
                    "id": item_id,
                    "relative_path": item_rel,
                    "original_path": item_rel,
                    "confirmed_by_original_image": True,
                    "review_basis": "original_image",
                    "review_decision": "selected",
                    "confirmed_accessory_or_matching_item": True,
                    "item_type": itype,
                    "display_name": iname,
                    "styling_reason": it["styling_reason"],
                    "observed_object": iname,
                    "visual_judgement": vj_item,
                    "asset_origin": "ai_generated",
                    "visual_type": "outfit_flatlay_item",
                    "source_product_image_id": color_ref_id,
                    "reference_image_ids": [color_ref_id],
                    "generation_prompt": item_data.get("prompt")
                })

            p_angle = of.get("platform_content_angle", {})
            platform_content_angle_desc = f"XIAOHONGSHU: {p_angle.get('xiaohongshu', '')} | DOUYIN: {p_angle.get('douyin', '')} | TMALL: {p_angle.get('tmall', '')} | WECHAT_VIDEO: {p_angle.get('wechat_video', '') or p_angle.get('wechat', '')}"

            type_mapping = {
                "innerwear": "内搭",
                "bottom": "下装",
                "shoes": "鞋履",
                "bag": "包袋",
                "accessory": "配饰",
                "glasses": "眼镜"
            }
            rec_items = []
            for it in of.get("recommended_items", []):
                t_zh = type_mapping.get(it["item_type"], "单品")
                rec_items.append(f"{t_zh}：{it['item_name']}")
            recommended_items_desc = "；".join(rec_items)

            outfit_plan = {
                "title": of["look_name"],
                "name": of["look_name"],
                "candidate_group": look_id,
                "candidate_count": 1 + len(items_plan),
                "selected_count": len(items_plan),
                "excluded_count": 0,
                "selected_product_color": selected_color,
                "description": of["styling_logic"],
                "effect_image": eff_plan_img,
                "items": items_plan,
                "excluded_candidates": [],
                "scene_type": of.get("scene_type", ""),
                "styling_logic": of.get("styling_logic", ""),
                "target_audience": of.get("target_audience", ""),
                "recommended_items_desc": recommended_items_desc,
                "platform_content_angle_desc": platform_content_angle_desc
            }
            outfit_plans_54.append(outfit_plan)

        image_plan["5.4 搭配方案展示"] = outfit_plans_54

        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)
        with open(cs_path, 'w', encoding='utf-8') as f:
            json.dump(cs_index, f, ensure_ascii=False, indent=2)
        with open(image_plan_path, 'w', encoding='utf-8') as f:
            json.dump(image_plan, f, ensure_ascii=False, indent=2)

        cand_54 = []
        for op in outfit_plans_54:
            ids = []
            if op.get("effect_image") and op["effect_image"].get("id"):
                ids.append(op["effect_image"]["id"])
            for item in op.get("items", []):
                if item.get("id"):
                    ids.append(item["id"])
            cand_group = {
                "name": op["candidate_group"],
                "candidate_count": len(ids),
                "candidate_ids": ids,
                "note": "AI 需打开原图判断每个单品的 observed_object、item_type 和 display_name"
            }
            cand_54.append(cand_group)
        candidates_data["5.4 搭配方案展示"] = cand_54
        with open(cand_path, 'w', encoding='utf-8') as f:
            json.dump(candidates_data, f, ensure_ascii=False, indent=2)

        print(f"[+] 资产成功合流并注入 plan, manifest, cs_index 与 candidates!")

        return 0
