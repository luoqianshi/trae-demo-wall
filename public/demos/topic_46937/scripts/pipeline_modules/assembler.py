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

class AssemblerMixin:
    def sanitize_handbook_text(self, text, is_html=False):
        import re
        import json

        # 1. 载入高奢平替字典与默认 fallback
        fallback_pools = {
            "舒适": ["无感亲肤", "软糯触感", "零压舒体", "松弛穿着", "轻质无感"],
            "显瘦": ["视觉纤细", "遮蔽瑕疵", "纵向拉伸身形", "线条收拢", "显露修长"],
            "百搭": ["四季皆宜", "随性混搭", "衣橱常客", "无感兼容", "多场景穿搭"],
            "修身": ["微压收拢", "合体贴身", "顺应身形", "贴合有度", "收腰显型"]
        }

        synonym_data = fallback_pools
        synonym_dict_path = os.path.join(self.skill_dir, 'references', 'synonym_dictionary.json')
        if os.path.exists(synonym_dict_path):
            try:
                with open(synonym_dict_path, 'r', encoding='utf-8') as f:
                    sd = json.load(f)
                    if "replacement_pools" in sd:
                        synonym_data = sd["replacement_pools"]
            except Exception as e:
                safe_print(f"[WARN] 读取同义词词典失败，启用 fallback 词库: {e}")

        target_words = list(synonym_data.keys())

        # 2. 提取并保护特定结构（HTML 标签、Markdown 链接、商品名）
        protected_blocks = []
        def placeholder_repl(match):
            protected_blocks.append(match.group(0))
            return f"__PDH_PROTECT_{len(protected_blocks)-1}__"

        sku_name = getattr(self, 'sku_name', 'DefaultProduct')
        temp_text = text.replace(sku_name, "__PDH_PROTECT_SKU__")

        # 保护 HTML 标签和属性，防止其内部包含敏感词被误改
        temp_text = re.sub(r'<[^>]+>', placeholder_repl, temp_text)

        # 保护 Markdown 链接，防止路径/名称被误改
        temp_text = re.sub(r'\[([^\]]*)\]\([^\)]*\)', placeholder_repl, temp_text)

        # 3. 全局频次平替逻辑（与 quality.py 的 md_content.count 审计完美对齐）
        for word in target_words:
            replacements = synonym_data[word]
            # 查找该词在整个文本的所有非重叠匹配位置
            matches = list(re.finditer(re.escape(word), temp_text))
            if len(matches) <= 3:
                continue  # 全局频次不超过 3 次，完美豁免

            # 从第 4 个匹配项开始，倒序进行替换以避免偏移量失效
            for idx, match in reversed(list(enumerate(matches))):
                if idx < 3:
                    break
                # 轮询选择平替词
                rep_word = replacements[(idx - 3) % len(replacements)]

                if is_html:
                    wrapped_word = f"<span class='pdh-replaced-term' data-tooltip='原词“{word}”在此章节已超频，已自动为您平替为当前词以提升调性。'>{rep_word}</span>"
                else:
                    wrapped_word = rep_word

                start, end = match.span()
                temp_text = temp_text[:start] + wrapped_word + temp_text[end:]

        final_text = temp_text

        # 4. 还原被保护的区域
        final_text = final_text.replace("__PDH_PROTECT_SKU__", sku_name)
        for idx_block, orig in enumerate(protected_blocks):
            final_text = final_text.replace(f"__PDH_PROTECT_{idx_block}__", orig)

        return final_text

    def assemble(self, parts_dir=None, output_path=None, preview_absolute_paths=False):
        # 默认 parts_dir
        if not parts_dir:
            parts_dir = os.path.join(self.scratch_dir, 'parts')
        # 默认 output_path
        if not output_path:
            output_path = os.path.join(self.target_dir, f'{self.sku_name}.md')
        # 相对路径 → 相对于 target_dir
        if not os.path.isabs(output_path):
            output_path = os.path.join(self.target_dir, output_path)

        # 预加载 Excel 上新颜色尺码白名单 (v2.3.9.1 launch-scope-filter hotfix)
        launch_scope = {"detected": False}
        try:
            launch_scope = self.load_launch_scope_from_excel()
        except Exception as e:
            safe_print(f"[WARN] 预加载上新白名单发生错误: {e}")

        # 自动同步 snippets/fabric_gallery.md 到 parts/part_05_qualification_size_index.md 的 8.1 章节 并净化为纯 Markdown 表格
        fab_path = os.path.join(self.scratch_dir, 'snippets', 'fabric_gallery.md')
        part05_path = os.path.join(parts_dir, 'part_05_qualification_size_index.md')
        if os.path.exists(fab_path) and os.path.exists(part05_path):
            with open(fab_path, 'r', encoding='utf-8') as f:
                fab_text = f.read().strip()
            if fab_text:
                # 保存原始 HTML 面料图库用于以后的 HTML 渲染
                fab_html_path = os.path.join(self.scratch_dir, 'snippets', 'fabric_gallery_html.md')
                with open(fab_html_path, 'w', encoding='utf-8', newline='\n') as f:
                    f.write(fab_text)

                # 自动把带有 table / td 等 HTML 的面料图库转换为 100% 纯净 Markdown 表格
                img_tags = re.findall(r'<img\b[^>]*>', fab_text)
                md_fab_rows = []
                titles = ["检测报告封面", "检测数据详情", "检测结论盖章"]
                for idx, img_tag in enumerate(img_tags):
                    m_src = re.search(r'src=["\']([^"\']+)["\']', img_tag)
                    m_alt = re.search(r'alt=["\']([^"\']+)["\']', img_tag)
                    m_pid = re.search(r'data-pid=["\']([^"\']+)["\']', img_tag)
                    if m_src:
                        src = m_src.group(1)
                        alt = m_alt.group(1) if (m_alt and m_alt.group(1)) else "图片"
                        pid = m_pid.group(1) if m_pid else ""
                        pid_str = f" {pid}" if pid else ""
                        title = alt if alt and alt != "图片" else (titles[idx] if idx < len(titles) else f"检测报告图 {idx+1}")
                        md_fab_rows.append([f"![{alt}{pid_str}]({src})", title])

                # 生成对称折行 markdown 表格 (每行最多 2 列)
                if md_fab_rows:
                    MAX_COLS = 2
                    ncol = min(len(md_fab_rows), MAX_COLS)

                    items_processed = []
                    for idx, r_item in enumerate(md_fab_rows):
                        title = r_item[1]
                        if ("070" in r_item[0] or "合格证" in r_item[0]) and (not title or title == "图片" or title == "检测结论盖章"):
                            title = "合格证"
                        items_processed.append({'img': r_item[0], 'title': title})

                    # 1. 前 ncol 个作为表头
                    headers = [it['title'] for it in items_processed[:ncol]]
                    while len(headers) < ncol:
                        headers.append("")

                    md_table = [
                        "| " + " | ".join(headers) + " |",
                        "| " + " | ".join([":---:"] * ncol) + " |"
                    ]

                    # 2. 第一行内容 (前 ncol 张图片)
                    first_row_imgs = [it['img'] for it in items_processed[:ncol]]
                    while len(first_row_imgs) < ncol:
                        first_row_imgs.append("")
                    md_table.append("| " + " | ".join(first_row_imgs) + " |")

                    # 3. 折行处理 (从第 3 个图开始，每 2 个一排)
                    for i in range(ncol, len(items_processed), ncol):
                        chunk = items_processed[i:i+ncol]

                        # 折行标题行
                        chunk_titles = [it['title'] for it in chunk]
                        while len(chunk_titles) < ncol:
                            chunk_titles.append("")
                        md_table.append("| " + " | ".join(chunk_titles) + " |")

                        # 折行图片行
                        chunk_imgs = [it['img'] for it in chunk]
                        while len(chunk_imgs) < ncol:
                            chunk_imgs.append("")
                        md_table.append("| " + " | ".join(chunk_imgs) + " |")

                    fab_content = '\n'.join(md_table)
                else:
                    fab_content = "> ⚠️ 面料展示图与资质报告待补充"

                with open(part05_path, 'r', encoding='utf-8') as f:
                    p05_text = f.read()

                # 匹配 ### 8.1 面料与品牌资质 或 ### 8.1 面料工艺与资质展示 直到下一个 ### 8.2 或其他小节开始
                pattern = r'(### 8\.1 (?:面料与品牌资质|面料工艺与资质展示)\n\n)(.*?)(?=\n### 8\.2|\n### |\n---| \Z)'
                def _rep(match):
                    return match.group(1) + "<!-- PDH_SECTION_START:8.1 面料与品牌资质 -->\n" + fab_content + "\n<!-- PDH_SECTION_END:8.1 面料与品牌资质 -->\n"

                new_p05_text, count = re.subn(pattern, _rep, p05_text, flags=re.S)
                if count > 0:
                    with open(part05_path, 'w', encoding='utf-8', newline='\n') as f:
                        f.write(new_p05_text)
                    print(f"[*] 已自动同步并净化 snippets/fabric_gallery.md 为纯 Markdown 表格 到 {part05_path} (替换成功)")
                else:
                    print(f"[!] 未能匹配到 8.1 结构，同步 fabric_gallery 失败")

        # 自动同步 snippets/gallery.md 到 parts/part_03_product_gallery.md 并净化为纯 Markdown
        gal_path = os.path.join(self.scratch_dir, 'snippets', 'gallery.md')
        part03_path = os.path.join(parts_dir, 'part_03_product_gallery.md')
        if os.path.exists(gal_path) and os.path.exists(part03_path):
            with open(gal_path, 'r', encoding='utf-8') as f:
                gal_content = f.read().strip()
            if gal_content:
                # 过滤 HTML 格式的颜色卡片 (v2.3.9.1 launch-scope-filter hotfix: HTML端同步降噪)
                if launch_scope.get("detected", False):
                    excluded_colors = launch_scope.get("excluded_colors", [])
                    if excluded_colors:
                        # 重建允许的所有颜色和别名的大集合，开展精确的白名单守护，杜绝子串冲突导致误杀
                        allowed_colors = launch_scope.get("allowed_colors", [])
                        allowed_color_aliases = launch_scope.get("allowed_color_aliases", {})
                        
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

                        all_allowed = set(allowed_colors)
                        for aliases in allowed_color_aliases.values():
                            for alias in aliases:
                                all_allowed.add(alias)

                        def _filter_color_card(match):
                            card_html = match.group(0)
                            # 提取卡片中的真实颜色属性文字，按白名单保留
                            alt_match = re.search(r'alt=["\']([^"\']+)["\']', card_html)
                            alt_val = alt_match.group(1).strip() if alt_match else ""
                            caption_match = re.search(r'<div class="pdh-caption"[^>]*>(.*?)</div>', card_html, re.S)
                            caption_val = re.sub(r'<[^>]*>', '', caption_match.group(1)).strip() if caption_match else ""

                            # 只要卡片表达的展示文字属于白名单，就绝对予以保留
                            if alt_val in all_allowed or caption_val in all_allowed:
                                # 检查是否有别名对齐但名称对不上的情况
                                hit_color = None
                                for ac in all_allowed:
                                    if ac == alt_val or ac == caption_val:
                                        hit_color = ac
                                        break

                                if hit_color and hit_color not in allowed_colors:
                                    main_color = None
                                    for mc, aliases in allowed_color_aliases.items():
                                        if hit_color in aliases:
                                            main_color = mc
                                            break
                                    if main_color:
                                        # 路径保护安全替换别名，避免破坏 HTML img src 路径（例如 src="设计师_七月/浅米灰.jpg"）
                                        src_match = re.search(r'src=["\']([^"\']+)["\']', card_html)
                                        if src_match:
                                            src_url = src_match.group(1)
                                            placeholder = "__PDH_HTML_SRC_PLACEHOLDER__"
                                            # 先用占位符安全替换 src 路径
                                            card_html = card_html.replace(src_url, placeholder)
                                            # 安全执行文本别名 tips 替换
                                            if f"{hit_color}(下单色:" not in card_html and f"{hit_color} (下单色:" not in card_html:
                                                card_html = card_html.replace(hit_color, f"{hit_color}(下单色:{main_color})")
                                            # 还原真实的 img src 路径
                                            card_html = card_html.replace(placeholder, src_url)
                                        else:
                                            # 兜底：如果完全没有 src，直接替换
                                            if f"{hit_color}(下单色:" not in card_html and f"{hit_color} (下单色:" not in card_html:
                                                card_html = card_html.replace(hit_color, f"{hit_color}(下单色:{main_color})")

                                return card_html
                            # 兜底：如果完全没有提取出有效的颜色字样，且命中了禁用颜色，则物理删除
                            if not alt_val and not caption_val:
                                # 抹去 src 属性，避免图片文件命名引起的误杀
                                clean_card = re.sub(r'src=["\'][^"\']+["\']', '', card_html)
                                if any(ec in clean_card for ec in excluded_colors):
                                    return ""
                            else:
                                # 明确属于废弃未下单颜色卡片，予以隔离剔除
                                return ""
                            return card_html
                        gal_content = re.sub(r'<div class="pdh-card pdh-color-card".*?</div>\s*</div>', _filter_color_card, gal_content, flags=re.S)

                gal_html_path = os.path.join(self.scratch_dir, 'snippets', 'gallery_html.md')
                gal_html_content = gal_content
                for img_tag in re.findall(r'<img\b[^>]*>', gal_content):
                    src_m = re.search(r'src=["\']([^"\']+)["\']', img_tag)
                    if not src_m:
                        continue
                    src = src_m.group(1)
                    abs_src = self._resolve_delivery_image_path(output_path, src)
                    if self._is_mock_ai_generated_image(abs_src, src):
                        gal_html_content = gal_html_content.replace(img_tag, '')

                # 保存原始 HTML 图库用于 HTML 高保真渲染；模拟 AI 图的 <img> 会被剔除，避免假图进入交付。
                if gal_html_content != gal_content:
                    print("[WARN] 检测到 gallery 中含模拟 AI 占位图，已从 gallery_html 注入中移除对应图片。")
                
                # 对 gallery_html 内容物理清洗，过滤掉已被排除的卡片
                image_plan_path = os.path.join(self.scratch_dir, 'image_selection_plan.json')
                ex_ids, ex_paths = self._get_excluded_candidates(image_plan_path)
                gal_html_content = self._clean_html_cards(gal_html_content, ex_ids, ex_paths)

                with open(gal_html_path, 'w', encoding='utf-8', newline='\n') as f:
                    f.write(gal_html_content)

                # 自动把带有 div / img / styles 等 HTML 的图库转换为 100% 纯净 Markdown (采用 Markdown 表格形式展示)
                sections = {}

                # 5.1 颜色展示
                m_51 = re.search(r'### 5.1 颜色展示(.*?)### 5.2', gal_content, re.S)
                if m_51:
                    sections['5.1'] = m_51.group(1).strip()

                # 5.2 棚拍展示
                m_52 = re.search(r'### 5.2 棚拍展示(.*?)### 5.3', gal_content, re.S)
                if m_52:
                    sections['5.2'] = m_52.group(1).strip()

                # 5.3 外景展示
                m_53 = re.search(r'### 5.3 外景展示(.*?)### 5.4', gal_content, re.S)
                if m_53:
                    sections['5.3'] = m_53.group(1).strip()

                # 5.4 搭配方案展示
                m_54 = re.search(r'### 5.4 搭配方案展示(.*)', gal_content, re.S)
                if m_54:
                    sections['5.4'] = m_54.group(1).strip()

                md_output = ["## 五、产品展示与搭配库\n\n"]

                # Helper to parse images from a block of HTML
                def parse_images(block):
                    if 'pdh-card' not in block:
                        imgs = re.findall(r'<img[^>]+>', block)
                        result = []
                        for img in imgs:
                            src = re.search(r'src=["\']([^"\']+)["\']', img)
                            alt = re.search(r'alt=["\']([^"\']+)["\']', img)
                            pid = re.search(r'data-pid=["\']([^"\']+)["\']', img)
                            if src:
                                result.append({
                                    'src': src.group(1),
                                    'alt': alt.group(1) if alt else '',
                                    'pid': pid.group(1) if pid else '',
                                    'caption': alt.group(1) if alt else ''
                                })
                        return result

                    parts = re.split(r'(?=<div class="pdh-card\b)', block)
                    result = []
                    for part in parts:
                        if 'pdh-card' not in part:
                            continue
                        img_tag = re.search(r'<img[^>]+>', part)
                        caption_tag = re.search(r'<div class="pdh-caption"[^>]*>(.*?)</div>', part, re.S)
                        if not caption_tag:
                            caption_tag = re.search(r'<div class="pdh-material-row-title"[^>]*>(.*?)</div>', part, re.S)

                        if img_tag:
                            img_html = img_tag.group(0)
                            src = re.search(r'src=["\']([^"\']+)["\']', img_html)
                            alt = re.search(r'alt=["\']([^"\']+)["\']', img_html)
                            pid = re.search(r'data-pid=["\']([^"\']+)["\']', img_html)
                            caption = re.sub(r'<[^>]*>', '', caption_tag.group(1)).strip() if caption_tag else ''

                            if src:
                                result.append({
                                    'src': src.group(1),
                                    'alt': alt.group(1) if alt else '',
                                    'pid': pid.group(1) if pid else '',
                                    'caption': caption or (alt.group(1) if alt else '')
                                })
                    return result

                # 5.1
                md_output.append("### 5.1 颜色展示\n\n")
                if '5.1' in sections:
                    items = parse_images(sections['5.1'])
                    if items:
                        headers = [item['caption'] or item['alt'] or f"颜色 {i+1}" for i, item in enumerate(items)]
                        alignments = [":---:"] * len(items)
                        images = [f"![{item['alt'] or '颜色'} {item['pid']}]({item['src']})" for item in items]
                        md_output.append("| " + " | ".join(headers) + " |\n")
                        md_output.append("| " + " | ".join(alignments) + " |\n")
                        md_output.append("| " + " | ".join(images) + " |\n\n")
                    else:
                        md_output.append("暂无颜色展示图片。\n\n")

                # 5.2
                md_output.append("### 5.2 棚拍展示\n\n")
                if '5.2' in sections:
                    items = parse_images(sections['5.2'])
                    if items:
                        headers = [f"棚拍展示 {i+1}" for i in range(len(items))]
                        alignments = [":---:"] * len(items)
                        images = [f"![{item['alt'] or '图片'} {item['pid']}]({item['src']})" for item in items]
                        md_output.append("| " + " | ".join(headers) + " |\n")
                        md_output.append("| " + " | ".join(alignments) + " |\n")
                        md_output.append("| " + " | ".join(images) + " |\n\n")
                    else:
                        md_output.append("暂无棚拍展示图片。\n\n")

                # 5.3
                md_output.append("### 5.3 外景展示\n\n")
                if '5.3' in sections:
                    s53_content = sections['5.3']
                    subsections = re.split(r'<h4[^>]*>(.*?)</h4>', s53_content)
                    has_items = False
                    if len(subsections) > 1:
                        for idx in range(1, len(subsections), 2):
                            title = subsections[idx].strip()
                            block = subsections[idx+1]
                            items = parse_images(block)
                            if items:
                                has_items = True
                                md_output.append(f"{title}\n\n")
                                headers = [f"{title} {i+1}" for i in range(len(items))]
                                alignments = [":---:"] * len(items)
                                images = [f"![{item['alt'] or '图片'} {item['pid']}]({item['src']})" for item in items]
                                md_output.append("| " + " | ".join(headers) + " |\n")
                                md_output.append("| " + " | ".join(alignments) + " |\n")
                                md_output.append("| " + " | ".join(images) + " |\n\n")
                    else:
                        items = parse_images(s53_content)
                        if items:
                            has_items = True
                            headers = [f"外景展示 {i+1}" for i in range(len(items))]
                            alignments = [":---:"] * len(items)
                            images = [f"![{item['alt'] or '图片'} {item['pid']}]({item['src']})" for item in items]
                            md_output.append("| " + " | ".join(headers) + " |\n")
                            md_output.append("| " + " | ".join(alignments) + " |\n")
                            md_output.append("| " + " | ".join(images) + " |\n\n")
                    if not has_items:
                        md_output.append("暂无外景展示图片。\n\n")
                else:
                    md_output.append("暂无外景展示图片。\n\n")

                # 5.4
                md_output.append("### 5.4 搭配方案展示\n\n")
                if '5.4' in sections:
                    s54_content = sections['5.4']
                    outfits = re.split(r'<h4[^>]*>(.*?)</h4>', s54_content)
                    if len(outfits) > 1:
                        for idx in range(1, len(outfits), 2):
                            title = outfits[idx].strip()
                            block = outfits[idx+1]

                            effect_img = re.search(r'<div class="[^"]*pdh-outfit-effect[^"]*".*?<img data-pid=["\']([^"\']+)["\'] src=["\']([^"\']+)["\'] alt=["\']([^"\']+)["\']', block, re.S)
                            if not effect_img:
                                effect_img = re.search(r'<div class="pdh-card pdh-effect-board-card".*?<img data-pid=["\']([^"\']+)["\'] src=["\']([^"\']+)["\'] alt=["\']([^"\']+)["\']', block, re.S)

                            note_box = re.search(r'<div class="pdh-outfit-note"[^>]*>(.*?)</div>', block, re.S)
                            badge = ""
                            description = ""
                            highlights = ""
                            if note_box:
                                note_html = note_box.group(1)
                                m_badge = re.search(r'<strong[^>]*>(.*?)</strong>', note_html, re.S)
                                badge = re.sub(r'<[^>]*>', '', m_badge.group(1)).strip() if m_badge else ""
                                p_tags = re.findall(r'<p[^>]*>(.*?)</p>', note_html, re.S)
                                if p_tags:
                                    description = re.sub(r'<[^>]*>', '', p_tags[0]).strip()
                                    if len(p_tags) > 1:
                                        highlights = re.sub(r'<[^>]*>', '', p_tags[1]).strip()
                                        highlights = re.sub(r'^✨\s*', '', highlights)

                            # 兼容传统的 pdh-material-row-card 以及 premium 的 pdh-card pdh-material-card
                            items_block = re.findall(r'<div class="(?:pdh-material-row-card|pdh-card pdh-material-card)"[^>]*>(.*?)</div>\s*</div>', block, re.S)
                            items_list = []
                            for item in items_block:
                                img_tag = re.search(r'<img[^>]+>', item)
                                # 兼容 pdh-material-row-title/pdh-caption 以及 div/span 元素
                                title_tag = re.search(r'<(?:div|span) class="(?:pdh-material-row-title|pdh-caption)"[^>]*>(.*?)</(?:div|span)>', item, re.S)
                                if not title_tag:
                                    # 兼容未闭合或 .* 的老式写法
                                    title_tag = re.search(r'<(?:div|span) class="(?:pdh-material-row-title|pdh-caption)"[^>]*>(.*)', item, re.S)
                                badge_tag = re.search(r'<span class="pdh-material-row-badge"[^>]*>(.*?)</span>', item, re.S)
                                if not badge_tag:
                                    badge_tag = re.search(r'<span class="pdh-material-row-badge"[^>]*>(.*?)</div>', item, re.S)
                                reason_tag = re.search(r'<p class="pdh-material-row-reason"[^>]*>(.*?)</p>', item, re.S)

                                if img_tag and title_tag:
                                    src = re.search(r'src=["\']([^"\']+)["\']', img_tag.group(0))
                                    pid = re.search(r'data-pid=["\']([^"\']+)["\']', img_tag.group(0))
                                    item_title = re.sub(r'<[^>]*>', '', title_tag.group(1)).strip()
                                    item_badge = re.sub(r'<[^>]*>', '', badge_tag.group(1)).strip() if badge_tag else "搭配单品"
                                    item_reason = re.sub(r'<[^>]*>', '', reason_tag.group(1)).strip() if reason_tag else ""
                                    item_src = src.group(1) if src else ''
                                    item_abs = self._resolve_delivery_image_path(output_path, item_src) if item_src else ''
                                    items_list.append({
                                        'src': item_src,
                                        'pid': pid.group(1) if pid else '',
                                        'title': item_title,
                                        'badge': item_badge,
                                        'reason': item_reason,
                                        'is_mock_ai': self._is_mock_ai_generated_image(item_abs, item_src) if item_abs else False
                                    })

                            md_output.append(f"#### {title}\n\n")
                            if effect_img:
                                eff_pid = effect_img.group(1)
                                eff_src = effect_img.group(2)
                                eff_alt = effect_img.group(3)
                                eff_abs = self._resolve_delivery_image_path(output_path, eff_src) if eff_src else ''
                                is_eff_mock = self._is_mock_ai_generated_image(eff_abs, eff_src) if eff_abs else False
                                if not is_eff_mock:
                                    md_output.append(f"![{eff_alt} {eff_pid}]({eff_src})\n\n")

                            # Extract metadata spans
                            scene_type_m = re.search(r'<span class="pdh-meta-scene-type"[^>]*>(.*?)</span>', block, re.S)
                            selected_product_color_m = re.search(r'<span class="pdh-meta-selected-product-color"[^>]*>(.*?)</span>', block, re.S)
                            recommended_items_desc_m = re.search(r'<span class="pdh-meta-recommended-items-desc"[^>]*>(.*?)</span>', block, re.S)
                            styling_logic_m = re.search(r'<span class="pdh-meta-styling-logic"[^>]*>(.*?)</span>', block, re.S)
                            target_audience_m = re.search(r'<span class="pdh-meta-target-audience"[^>]*>(.*?)</span>', block, re.S)
                            platform_content_angle_desc_m = re.search(r'<span class="pdh-meta-platform-content-angle-desc"[^>]*>(.*?)</span>', block, re.S)
                            generation_prompt_m = re.search(r'<span class="pdh-meta-generation-prompt"[^>]*>(.*?)</span>', block, re.S)

                            import html
                            scene_type_val = html.unescape(scene_type_m.group(1).strip()) if scene_type_m else ''
                            selected_product_color_val = html.unescape(selected_product_color_m.group(1).strip()) if selected_product_color_m else ''
                            if selected_product_color_val and launch_scope.get("detected", False):
                                allowed_color_aliases = launch_scope.get("allowed_color_aliases", {})
                                for mc, aliases in allowed_color_aliases.items():
                                    if selected_product_color_val in aliases:
                                        if f"{selected_product_color_val}(下单色:" not in selected_product_color_val:
                                            selected_product_color_val = f"{selected_product_color_val}(下单色:{mc})"
                                        break
                            recommended_items_desc_val = html.unescape(recommended_items_desc_m.group(1).strip()) if recommended_items_desc_m else ''
                            styling_logic_val = html.unescape(styling_logic_m.group(1).strip()) if styling_logic_m else ''
                            target_audience_val = html.unescape(target_audience_m.group(1).strip()) if target_audience_m else ''
                            platform_content_angle_desc_val = html.unescape(platform_content_angle_desc_m.group(1).strip()) if platform_content_angle_desc_m else ''
                            generation_prompt_val = html.unescape(generation_prompt_m.group(1).strip()) if generation_prompt_m else ''

                            # 搭配企划分析
                            md_output.append("##### 搭配企划分析\n\n")
                            # 定义辅助变量与函数，避开 Python 3.12 之前 f-string 不允许包含反斜杠的语法限制
                            # 使用零宽单词连接符 U+2060 结合完全不换行的 Unicode 朝鲜文填充符 U+3164 锁定列宽，防止任何 markdown 预览器自动换行
                            wj_char = "\u2060"
                            fill_char = "\u3164"
                            col_pad = fill_char * 6

                            def _nw(text):
                                return wj_char.join(list(text)) + col_pad

                            md_output.append(f"| {_nw('企划维度')} | 企划内容 |\n")
                            md_output.append("| :--- | :--- |\n")
                            md_output.append(f"| {_nw('场景定位')} | {scene_type_val} |\n")
                            md_output.append(f"| {_nw('本品颜色')} | {selected_product_color_val} |\n")
                            md_output.append(f"| {_nw('推荐单品')} | {recommended_items_desc_val} |\n")
                            md_output.append(f"| {_nw('搭配逻辑')} | {styling_logic_val} |\n")
                            md_output.append(f"| {_nw('适合人群')} | {target_audience_val} |\n")

                            # 格式化各个平台内容角度，使用中文分号分隔以保持 Clean MD 合规性
                            angles_formatted = platform_content_angle_desc_val
                            angles_formatted = angles_formatted.replace("XIAOHONGSHU:", "**小红书**：")
                            angles_formatted = angles_formatted.replace("DOUYIN:", "；**抖音**：")
                            angles_formatted = angles_formatted.replace("TMALL:", "；**天猫**：")
                            angles_formatted = angles_formatted.replace("WECHAT_VIDEO:", "；**视频号**：")
                            angles_formatted = re.sub(r'\s*\|\s*', '', angles_formatted)

                            md_output.append(f"| {_nw('内容角度')} | {angles_formatted.strip()} |\n")
                            md_output.append(f"| {_nw('生图说明')} | {generation_prompt_val} |\n\n")

                            if badge:
                                md_output.append(f"> **{badge}**\n>\n")
                            if description:
                                md_output.append(f"> {description}\n")
                            if highlights:
                                if badge or description:
                                    md_output.append(">\n")
                                md_output.append(f"> ✨ **配饰亮点**：{highlights}\n")

                            if badge or description or highlights:
                                md_output.append("\n")

                            if generation_prompt_val:
                                md_output.append("##### AI 搭配生图提示词\n\n")
                                md_output.append(f"> **生图提示词**：{generation_prompt_val}\n\n")

                            if items_list:
                                md_output.append("##### 搭配物料清单\n\n")
                                headers = [f"**{it['title']}** ({it['badge']})" for it in items_list]
                                alignments = [":---:"] * len(items_list)
                                reasons = [f"*{it.get('reason')}*" if it.get('reason') else "" for it in items_list]

                                md_output.append("| " + " | ".join(headers) + " |\n")
                                md_output.append("| " + " | ".join(alignments) + " |\n")
                                images = [
                                    f"![{it['title']} {it['pid']}]({it['src']})" if (not it.get('is_mock_ai')) and it.get('src') else "真实生图未生成"
                                    for it in items_list
                                ]
                                md_output.append("| " + " | ".join(images) + " |\n")
                                md_output.append("| " + " | ".join(reasons) + " |\n\n")
                    else:
                        md_output.append(s54_content)

                gal_clean_content = "".join(md_output)
                # 使用排除图名单对生成的 gallery markdown 表格内容进行最后物理清洗
                image_plan_path = os.path.join(self.scratch_dir, 'image_selection_plan.json')
                ex_ids, ex_paths = self._get_excluded_candidates(image_plan_path)
                gal_clean_content = self._clean_markdown_tables(gal_clean_content, ex_ids, ex_paths)

                with open(part03_path, 'w', encoding='utf-8', newline='\n') as f:
                    f.write(gal_clean_content)
                print(f"[*] 已自动同步并净化 snippets/gallery.md 为纯 Markdown 表格 到 {part03_path} (替换成功)")

        print(f"[*] 组装最终手册，部件目录: {parts_dir}")
        if not os.path.exists(parts_dir):
            print(f"[!] 部件目录不存在: {parts_dir}")
            return

        # 1. 物理清洗非白名单的冗余部件文件（打扫战场，保持纯净）
        if os.path.exists(parts_dir):
            for f in os.listdir(parts_dir):
                if f.startswith('part_') and f.endswith('.md') and f not in ALLOWED_PARTS:
                    garbage_path = os.path.join(parts_dir, f)
                    try:
                        os.remove(garbage_path)
                        print(f"[*] 已物理清理多余的错误部件文件: {f}")
                    except Exception as e:
                        print(f"[!] 清理冗余文件 {f} 失败: {e}")

        # 2. 从模块全局常量白名单按顺序收集待组装部件
        parts = [f for f in ALLOWED_PARTS if os.path.exists(os.path.join(parts_dir, f))]

        if not parts:
            print("[!] 未找到任何合格的 part_*.md 文件")
            return

        combined_content = []
        image_plan_path = os.path.join(self.scratch_dir, 'image_selection_plan.json')
        ex_ids, ex_paths = self._get_excluded_candidates(image_plan_path)

        for p in parts:
            part_path = os.path.join(parts_dir, p)
            with open(part_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # 零件内容层面的物理清洗，彻底擦除被排除图的 Markdown 表格列和 HTML 卡片
                content = self._clean_markdown_tables(content, ex_ids, ex_paths)
                content = self._clean_html_cards(content, ex_ids, ex_paths)
                
                if p == 'part_05_qualification_size_index.md' and self.exclude_index:
                    # 动态剔除整个第十章
                    pattern_ch10 = r'\n---\s*\n\s*## 十、(?:相关素材文件索引|素材索引).*?\n---\s*\n'
                    content = re.sub(pattern_ch10, '\n---\n\n', content, flags=re.DOTALL)
                combined_content.append(content)


        # 合并内容并统一换行符为 LF
        final_content = '\n\n'.join(combined_content)
        final_content = final_content.replace('\r\n', '\n').replace('\r', '\n')

        # 图片路径处理
        if preview_absolute_paths:
            # 仅调试/预览模式：将相对路径转为 /c:/... 绝对路径
            target_abs = os.path.abspath(self.target_dir).replace('\\', '/')
            if len(target_abs) >= 2 and target_abs[1] == ':':
                target_abs = '/' + target_abs[0].lower() + target_abs[1:]

            def replace_src(match):
                src_path = match.group(1)
                if src_path.startswith('/') or src_path.startswith('http'):
                    return match.group(0)
                return f'src="{target_abs}/{src_path}"'

            final_content = re.sub(r'src="([^"]+)"', replace_src, final_content)
            print("[*] 已转换为预览绝对路径模式")
        # else: 默认保留相对路径，不做转换

        # Extract component annotations and write to render_component_map.json (v2.3.5)
        component_map = {}
        lines = final_content.split('\n')
        for idx, line in enumerate(lines):
            line_strip = line.strip()
            if line_strip.startswith("<!--") and "pdh:component=" in line_strip:
                m_comp = re.search(r'<!--\s*pdh:component=(\w+)\s*-->', line_strip)
                if m_comp:
                    comp_name = m_comp.group(1)
                    # Look ahead up to 10 lines for a heading starting with '#'
                    for offset in range(1, 11):
                        if idx + offset < len(lines):
                            next_line = lines[idx + offset].strip()
                            if next_line.startswith('#'):
                                m_title = re.match(r'^(#+)\s*(.*)', next_line)
                                if m_title:
                                    raw_title = m_title.group(2).strip()
                                    clean_title = re.sub(r'🤖 AI 推断.*', '', raw_title).strip()
                                    clean_title = re.sub(r'<span.*?>.*?</span>', '', clean_title).strip()
                                    clean_title = re.sub(r'<!--.*?-->', '', clean_title).strip()
                                    component_map[clean_title] = comp_name
                                    break
        map_path = os.path.join(self.scratch_dir, 'render_component_map.json')
        os.makedirs(os.path.dirname(map_path), exist_ok=True)
        with open(map_path, 'w', encoding='utf-8') as f:
            json.dump(component_map, f, ensure_ascii=False, indent=2)
        print(f"[*] 已自动提取 {len(component_map)} 个组件映射并持久化保存至 sidecar: {map_path}")

        # 自动同步 Excel 上新颜色尺码白名单 (v2.3.9.1 launch-scope-filter hotfix)
        try:
            final_content = self.apply_launch_scope_filter_to_markdown(final_content, launch_scope)
        except Exception as e:
            safe_print(f"[WARN] 运行 v2.3.9.1 上新白名单过滤发生错误: {e}")

        # 全局滤除所有 <!-- pdh:... --> 辅助型组件与格式注释，以及 <!-- PDH_SECTION_... --> 同步定位标记（打扫战场，为最终纯 Markdown 交付物彻底扫清全部 HTML 注释杂质，实现 100% 注释全清）
        final_content = re.sub(r'<!--\s*pdh:.*?\s*-->\n?', '', final_content)
        final_content = re.sub(r'<!--\s*PDH_SECTION_.*?\s*-->\n?', '', final_content)

        # 确保目录存在
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        # 在敏感词平替前，保存未经平替的 raw assembled content 到内存中，供后续 HTML 渲染使用
        self._raw_assembled_content = final_content
        # 敏感词物理自净
        final_content = self.sanitize_handbook_text(final_content, is_html=False)
        with open(output_path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(final_content)

        mode_desc = "预览绝对路径" if preview_absolute_paths else "交付相对路径"
        print(f"[+] 最终手册组装完成（LF 换行符 + {mode_desc}）: {output_path}")

    def render_html_handbook(self, md_path=None, html_path=None):
        if not md_path:
            md_path = os.path.join(self.target_dir, f'{self.sku_name}.md')
        if not html_path:
            html_path = os.path.join(self.target_dir, f'{self.sku_name}.html')

        if not os.path.exists(md_path):
            raise FileNotFoundError(f"未找到 Markdown 文件: {md_path}")

        if hasattr(self, '_raw_assembled_content') and self._raw_assembled_content:
            md_content = self._raw_assembled_content
        else:
            with open(md_path, 'r', encoding='utf-8') as f:
                md_content = f.read()

        # 1. 自动注入编译好的 HTML 图库（Chapter 5）
        gallery_html_path = os.path.join(self.scratch_dir, 'snippets', 'gallery_html.md')
        gal_html = ""
        if os.path.exists(gallery_html_path):
            with open(gallery_html_path, 'r', encoding='utf-8') as f:
                gal_html = f.read().strip()
            # 物理擦除已排除的卡片
            image_plan_path = os.path.join(self.scratch_dir, 'image_selection_plan.json')
            ex_ids, ex_paths = self._get_excluded_candidates(image_plan_path)
            gal_html = self._clean_html_cards(gal_html, ex_ids, ex_paths)
            
            # 定位并替换整个第五章
            pattern = r'(## 五、产品展示与搭配库\n.*?\n)(?=\n## |\Z)'
            md_content, count = re.subn(pattern, r'<!-- pdh:gallery_injection -->\n', md_content, flags=re.S)

        # 2. 自动注入编译好的 HTML 面料图库（8.1）
        fabric_html_path = os.path.join(self.scratch_dir, 'snippets', 'fabric_gallery_html.md')
        fab_html = ""
        if os.path.exists(fabric_html_path):
            with open(fabric_html_path, 'r', encoding='utf-8') as f:
                fab_html = f.read().strip()
            # 定位并替换 8.1 章节
            pattern = r'(### 8\.1 (?:面料与品牌资质|面料工艺与资质展示)\n.*?\n)(?=\n### |\n---| \Z)'
            md_content, count = re.subn(pattern, r'### 8.1 面料工艺与资质展示\n\n<!-- pdh:fabric_injection -->\n', md_content, flags=re.S)

        # 加载风格配置获取 CSS 变量
        style_profile_path = os.path.join(self.skill_dir, 'references', 'style_profiles', f"{self.style_profile}.json")
        if os.path.exists(style_profile_path):
            with open(style_profile_path, 'r', encoding='utf-8') as f:
                profile_data = json.load(f)
            tokens = profile_data.get("inline_theme_tokens", {})
            style_name = profile_data.get("name", "常规风格")
        else:
            tokens = {}
            style_name = "常规风格"
            print(f"[!] 警告: 未找到风格配置，使用默认样式")

        # 加载组件 Schema 校验规则
        schema_path = os.path.join(self.skill_dir, 'references', 'render_components', 'components_schema.json')
        if os.path.exists(schema_path):
            with open(schema_path, 'r', encoding='utf-8') as f:
                components_schema = json.load(f)
        else:
            components_schema = {}
            print(f"[!] 警告: 未找到 components_schema.json")

        # 加载 sidecar map
        sidecar_map = {}
        map_path = os.path.join(self.scratch_dir, 'render_component_map.json')
        if os.path.exists(map_path):
            try:
                with open(map_path, 'r', encoding='utf-8') as f:
                    sidecar_map = json.load(f)
                print(f"[*] 成功载入 {len(sidecar_map)} 个侧栏组件映射配置")
            except Exception as e:
                print(f"[!] 读取 sidecar map 失败: {e}")

        # 辅助解析 Markdown 原生表格
        def parse_markdown_table(table_lines):
            if len(table_lines) < 2:
                return [], []
            headers = [c.strip() for c in table_lines[0].split('|')[1:-1]]
            rows = []
            for line in table_lines[2:]:
                cells = [c.strip() for c in line.split('|')[1:-1]]
                while len(cells) < len(headers):
                    cells.append("")
                row_dict = {}
                for col_name, val in zip(headers, cells):
                    row_dict[col_name] = val
                rows.append(row_dict)
            return rows, headers

        # 辅助 Schema 匹配与别名对齐
        def match_schema_and_align(rows, headers, schema):
            required = schema.get("required_columns", [])
            aliases = schema.get("aliases", {})
            optional = schema.get("optional_columns", [])

            mapped_headers = {}
            for col in headers:
                mapped_col = None
                if col in required or col in optional:
                    mapped_col = col
                else:
                    for target_col, alias_list in aliases.items():
                        if col in alias_list:
                            mapped_col = target_col
                            break
                if mapped_col:
                    mapped_headers[col] = mapped_col
                else:
                    mapped_headers[col] = col

            present_mapped = set(mapped_headers.values())
            missing_required = [req for req in required if req not in present_mapped]
            if missing_required:
                return None, None, f"缺失必需列: {missing_required}"

            aligned_rows = []
            for r in rows:
                aligned_r = {}
                for original_col, val in r.items():
                    mapped_col = mapped_headers[original_col]
                    aligned_r[mapped_col] = val
                    aligned_r[original_col] = val
                aligned_rows.append(aligned_r)

            aligned_headers = [mapped_headers[col] for col in headers]
            return aligned_rows, aligned_headers, None

        # 辅助 Markdown 表格转标准 HTML 样式 fallback
        def markdown_table_to_html(rows, headers, is_fallback=True):
            def make_status_badge(text):
                text_clean = text.strip()
                if text_clean in ["✓ 100%符合标示", "100%符合标示"]:
                    return '<span class="pdh-status-pill success" style="background: #E8F5E9; color: #2E7D32; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; display: inline-block;">✓ 100%符合标示</span>'
                elif text_clean in ["✓ 安全亲肤类", "安全亲肤类"]:
                    return '<span class="pdh-status-pill info" style="background: #EBF5FF; color: #007AFF; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; display: inline-block;">✓ 安全亲肤类</span>'
                elif text_clean in ["✓ 温和无刺激", "温和无刺激"]:
                    return '<span class="pdh-status-pill warning" style="background: #F3E5F5; color: #8E24AA; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; display: inline-block;">✓ 温和无刺激</span>'
                elif text_clean in ["✓ 合格", "合格", "✓ PASS", "PASS", "✓ 安全合格", "安全合格", "✓ 优于标准", "优于标准"]:
                    return f'<span class="pdh-status-pill success" style="background: #E8F5E9; color: #2E7D32; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; display: inline-block;">{text_clean}</span>'
                elif text_clean == "痛点":
                    return '<span class="pdh-status-pill" style="background: #FFE5E5; color: #D32F2F; border: 1px solid rgba(211, 47, 47, 0.25); padding: 2px 8px; border-radius: 20px; font-size: 12px; display: inline-block;">痛点</span>'
                elif text_clean == "痒点":
                    return '<span class="pdh-status-pill" style="background: #FFF3E0; color: #E65100; border: 1px solid rgba(230, 81, 0, 0.25); padding: 2px 8px; border-radius: 20px; font-size: 12px; display: inline-block;">痒点</span>'
                elif text_clean == "爽点":
                    return '<span class="pdh-status-pill" style="background: #E8F5E9; color: #2E7D32; border: 1px solid rgba(46, 125, 50, 0.25); padding: 2px 8px; border-radius: 20px; font-size: 12px; display: inline-block;">爽点</span>'
                elif text_clean == "槽点":
                    return '<span class="pdh-status-pill" style="background: #ECEFF1; color: #455A64; border: 1px solid rgba(69, 90, 100, 0.25); padding: 2px 8px; border-radius: 20px; font-size: 12px; display: inline-block;">槽点</span>'
                elif text_clean == "爆点":
                    return '<span class="pdh-status-pill" style="background: #F3E5F5; color: #7B1FA2; border: 1px solid rgba(123, 31, 162, 0.25); padding: 2px 8px; border-radius: 20px; font-size: 12px; display: inline-block;">爆点</span>'
                return text

            html_lines = []
            is_qualification = "检测项目" in headers or "资质/认证/检测项目" in headers
            cls_name = "pdh-table-fallback" if is_fallback else "pdh-table-normal"

            if is_qualification:
                html_lines.append(f'<div class="{cls_name}" style="overflow-x: auto; margin: 16px 0; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">')
                html_lines.append('  <table style="width: 100%; border-collapse: collapse; background: #fff;">')
                html_lines.append('    <thead>')
                html_lines.append('      <tr style="background: linear-gradient(135deg, #4A00E0 0%, #8E2DE2 100%); border-bottom: 2px solid rgba(0,0,0,0.08);">')
                for h in headers:
                    html_lines.append(f'        <th style="padding: 14px 16px; text-align: left; color: white; font-weight: 600; font-size: 14px;">{h}</th>')
                html_lines.append('      </tr>')
                html_lines.append('    </thead>')
                html_lines.append('    <tbody>')
                for idx, r in enumerate(rows):
                    row_bg = "#FFFFFF" if idx % 2 == 0 else "#FAFAFA"
                    html_lines.append(f'      <tr style="background: {row_bg}; border-bottom: 1px solid #F0F0F0;">')
                    for h in headers:
                        val = r.get(h, "")
                        val_badge = make_status_badge(val)
                        align_style = "text-align: center;" if "结论" in h or "说明" in h else "text-align: left;"
                        html_lines.append(f'        <td style="padding: 12px 16px; font-size: 13.5px; color: #333; {align_style}">{val_badge}</td>')
                    html_lines.append('      </tr>')
                html_lines.append('    </tbody>')
                html_lines.append('  </table>')
                html_lines.append('</div>')
            else:
                html_lines.append(f'<div class="{cls_name}" style="overflow-x: auto; margin: 16px 0; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px;">')
                html_lines.append('  <table style="width: 100%; border-collapse: collapse; background: #fff;">')
                html_lines.append('    <thead>')
                html_lines.append('      <tr style="background: #F8F9FA; border-bottom: 2px solid rgba(0,0,0,0.08);">')
                for col_idx, h in enumerate(headers):
                    width_style = ""
                    if col_idx == 0:
                        if len(headers) == 2:
                            width_style = "width: 120px; min-width: 100px; white-space: nowrap; "
                        else:
                            width_style = "min-width: 90px; "
                    html_lines.append(f'        <th style="{width_style}padding: 12px 14px; text-align: left; font-weight: 600; font-size: 13px; color: #333;">{h}</th>')
                html_lines.append('      </tr>')
                html_lines.append('    </thead>')
                html_lines.append('    <tbody>')
                for idx, r in enumerate(rows):
                    row_bg = "#FFFFFF" if idx % 2 == 0 else "#FAFAFA"
                    html_lines.append(f'      <tr style="background: {row_bg}; border-bottom: 1px solid rgba(0,0,0,0.05);">')
                    for idx_cell, h in enumerate(headers):
                        val = r.get(h, "")
                        val_badge = make_status_badge(val)
                        width_style = ""
                        if idx_cell == 0:
                            if len(headers) == 2:
                                width_style = "width: 120px; min-width: 100px; font-weight: 600; white-space: nowrap; "
                            else:
                                width_style = "min-width: 90px; "
                        html_lines.append(f'        <td style="{width_style}padding: 12px 14px; font-size: 13px; color: #555; vertical-align: top;">{val_badge}</td>')
                    html_lines.append('      </tr>')
                html_lines.append('    </tbody>')
                html_lines.append('  </table>')
                html_lines.append('</div>')
            return '\n'.join(html_lines)

        # Automated component inference based on section clean title and table headers (v2.3.5)
        def infer_component(title_text, table_headers):
            title_clean = title_text.strip().lower()
            headers_set = {h.strip() for h in table_headers}

            # 引入通用正则匹配，增强卡片容错性
            if re.search(r'(2\.1|基础属性|目标人群|用户定位|audience|user)', title_clean):
                return "audience_card_grid"
            if re.search(r'(2\.2|行为dna|行为特征|dna)', title_clean):
                return "audience_card_grid"
            if re.search(r'(2\.3|决策旅程|购买旅程|journey)', title_clean):
                return "audience_card_grid"

            if re.search(r'(3\.1|场景矩阵|使用场景|scene)', title_clean):
                return "scene_card_grid"
            if re.search(r'(3\.2|平台内容策略|平台策略|内容策略|marketing|content)', title_clean):
                return "marketing_card_grid"

            if any(k in title_clean for k in ["小红书", "抖音", "天猫", "微信视频号", "微信视觉"]):
                return "marketing_card_grid"

            if any(k in title_clean for k in ["主播视觉", "开场钩子", "痛点共鸣", "卖点展示", "逼单成交", "直播间话术"]):
                return "livestream_quote_card"
            if "脚本" in title_clean:
                return "livestream_quote_card"

            if "检测报告" in title_clean or "品牌资质" in title_clean or "检测项目" in title_clean:
                return "qualification_card_grid"

            if "尺码参考" in title_clean or "九、" in title_clean:
                if "尺码" in headers_set and any(h in headers_set for h in ["腰围", "臀围", "裤长", "胸围", "肩宽", "袖长", "衣长", "前衣长"]):
                    return "size_table_gradient"
                if any(h in headers_set for h in ["身高体重", "推荐尺码", "试穿感受", "身材类型", "推荐尺码建议"]):
                    return "size_guide_cards"
            if "试穿建议" in title_clean or "选码指南" in title_clean or "选码" in title_clean:
                return "size_guide_cards"

            if "具体场景" in headers_set or "痛点需求" in headers_set:
                return "scene_card_grid"
            if "平台" in headers_set and "内容侧重点" in headers_set:
                return "marketing_card_grid"
            if "时间" in headers_set and "环节" in headers_set:
                return "livestream_quote_card"
            if "资质/认证/检测项目" in headers_set or "标准与结论说明" in headers_set:
                return "qualification_card_grid"
            if "建议维度" in headers_set or "具体内容说明" in headers_set:
                return "size_guide_cards"

            return None

        # 统计组件装载量 (v2.3.5)
        audit_counts = {
            "hero": 1,
            "basic_info_card": 0,
            "selling_point_cards": 0,
            "audience_card_grid": 0,
            "scene_card_grid": 0,
            "emotion_cards": 0,
            "marketing_cards": 0,
            "livestream_timeline": 0,
            "qualification_cards": 0,
            "size_table": 0,
            "lookbook_gallery": 0
        }
        fallback_blocks = []

        lines = md_content.split('\n')
        i = 0
        n = len(lines)
        html_blocks = []
        headings = []
        heading_counter = 0
        current_component = None
        current_section = ""
        inside_h2_card = False

        def compile_md_to_html(md_text):
            nonlocal heading_counter
            lines_sub = md_text.split('\n')
            h_blocks = []
            for line_sub in lines_sub:
                line_str = line_sub.strip()
                if not line_str:
                    continue
                if line_str.startswith('#'):
                    m = re.match(r'^(#+)\s*(.*)', line_str)
                    if m:
                        level = len(m.group(1))
                        title_raw = m.group(2).strip()
                        title_clean = re.sub(r'🤖 AI 推断.*', '', title_raw).strip()
                        title_clean = re.sub(r'<span.*?>.*?</span>', '', title_clean).strip()

                        heading_counter += 1
                        anchor_id = f"sec-{heading_counter}"
                        headings.append((level, title_clean, anchor_id))

                        title_styled = re.sub(
                            r'🤖 AI 推断',
                            r'<span style="background: #FFF3E0; color: #E65100; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px; font-weight: normal; vertical-align: middle;">🤖 AI 推断</span>',
                            title_raw
                        )

                        if level == 1:
                            h_blocks.append(f'<h1 id="{anchor_id}" style="margin-top: 40px; margin-bottom: 20px; color: #1D1D1F; font-size: 26px; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 8px;">{title_styled}</h1>')
                        elif level == 2:
                            h_blocks.append(f'<h2 id="{anchor_id}" style="margin-top: 36px; margin-bottom: 16px; color: #1D1D1F; font-size: 20px; border-bottom: 2px solid var(--brand-color); padding-bottom: 6px; display: flex; align-items: center;">{title_styled}</h2>')
                        elif level == 3:
                            h_blocks.append(f'<h3 id="{anchor_id}" style="margin-top: 26px; margin-bottom: 12px; color: #222; font-size: 16px; display: flex; align-items: center;">{title_styled}</h3>')
                        else:
                            h_blocks.append(f'<h4 id="{anchor_id}" style="margin-top: 20px; margin-bottom: 10px; color: #333; font-size: 14px;">{title_styled}</h4>')
                else:
                    h_blocks.append(line_sub)
            return '\n'.join(h_blocks)

        if gal_html:
            audit_counts["lookbook_gallery"] += 1
        if fab_html:
            audit_counts["qualification_cards"] += 1

        while i < n:
            line = lines[i].strip()

            # 跳过 clean md 的顶部注释
            if "pdh:format=clean-md-compatible" in line:
                i += 1
                continue

            # 捕获注入注释并直接渲染图库 HTML
            if "pdh:gallery_injection" in line:
                html_blocks.append(compile_md_to_html(gal_html))
                i += 1
                continue
            if "pdh:fabric_injection" in line:
                html_blocks.append(compile_md_to_html(fab_html))
                i += 1
                continue

            # 捕获组件标记
            if line.startswith("<!-- pdh:component="):
                m = re.match(r'<!--\s*pdh:component=(\w+)\s*-->', line)
                if m:
                    current_component = m.group(1)
                i += 1
                continue

            # 捕获标题并提取锚点
            if line.startswith("#"):
                m = re.match(r'^(#+)\s*(.*)', line)
                if m:
                    level = len(m.group(1))
                    title_raw = m.group(2).strip()
                    title_clean = re.sub(r'🤖 AI 推断.*', '', title_raw).strip()
                    title_clean = re.sub(r'<span.*?>.*?</span>', '', title_clean).strip()

                    heading_counter += 1
                    anchor_id = f"sec-{heading_counter}"
                    headings.append((level, title_clean, anchor_id))

                    # 给 AI 推断等角标上色
                    title_styled = re.sub(
                        r'🤖 AI 推断',
                        r'<span style="background: #FFF3E0; color: #E65100; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px; font-weight: normal; vertical-align: middle;">🤖 AI 推断</span>',
                        title_raw
                    )

                    # macOS 圆角卡片包装二级章节 (H2)
                    if level == 2:
                        current_section = title_clean
                        if inside_h2_card:
                            html_blocks.append('</section>\n')
                        html_blocks.append(f'<section class="pdh-chapter-card pdh-section-card">\n')
                        inside_h2_card = True

                    if level == 1:
                        html_blocks.append(f'<h1 id="{anchor_id}" style="margin-top: 40px; margin-bottom: 20px; color: #1D1D1F; font-size: 26px; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 8px;">{title_styled}</h1>')
                    elif level == 2:
                        html_blocks.append(f'<h2 id="{anchor_id}" style="margin-top: 36px; margin-bottom: 16px; color: #1D1D1F; font-size: 20px; border-bottom: 2px solid var(--brand-color); padding-bottom: 6px; display: flex; align-items: center;">{title_styled}</h2>')
                    elif level == 3:
                        current_section = title_clean

                        # 特殊优化：将 ## 一、核心卖点 -> 1.1 转换为彩色 selling points cards 网格
                        if title_clean == "1.1 AI提炼核心卖点" or "AI提炼核心卖点" in title_clean:
                            html_blocks.append(f'<h3 id="{anchor_id}" style="margin-top: 26px; margin-bottom: 12px; color: #222; font-size: 16px; display: flex; align-items: center;">{title_styled}</h3>')
                            sp_lines = []
                            i += 1
                            while i < n and not lines[i].strip().startswith("#"):
                                sp_lines.append(lines[i])
                                i += 1
                            sp_text = '\n'.join(sp_lines)
                            chunks = sp_text.split('\n---')

                            sp_cards_html = ['<div class="pdh-selling-point-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin: 20px 0;">']
                            for chunk in chunks:
                                chunk_strip = chunk.strip()
                                if not chunk_strip:
                                    continue
                                m_sp_title = re.search(r'\*\*(.*?)\*\*', chunk_strip)
                                if m_sp_title:
                                    title_text = m_sp_title.group(1).strip()
                                    m_kws = re.search(r'>\s*关键词：\s*(.*)', chunk_strip)
                                    if not m_kws:
                                        m_kws = re.search(r'>\s*Keywords:\s*(.*)', chunk_strip, re.I)
                                    kws_text = m_kws.group(1).strip() if m_kws else ""

                                    desc_text = chunk_strip.replace(m_sp_title.group(0), "")
                                    if m_kws:
                                        desc_text = desc_text.replace(m_kws.group(0), "")
                                    desc_text = re.sub(r'^>\s*$', '', desc_text, flags=re.M).strip()
                                    desc_text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', desc_text)
                                    desc_text = desc_text.replace('\n', '<br>')

                                    sp_cards_html.append(f'''  <div class="pdh-selling-point-card" style="padding: 24px; background: var(--card-bg); border-radius: 16px; border: var(--card-border); border-top: var(--accent-border); box-shadow: var(--card-shadow); display: flex; flex-direction: column; justify-content: space-between; transition: all 0.3s ease;">
    <div>
      <h4 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: var(--brand-color);">{title_text}</h4>
      <p style="margin: 0 0 12px 0; font-size: 13px; color: #333; line-height: 1.6;">{desc_text}</p>
    </div>
    {f'<div style="font-size: 11px; color: rgba(0,0,0,0.5); border-top: 1px dashed rgba(0,0,0,0.08); padding-top: 10px;">🏷️ {kws_text}</div>' if kws_text else ''}
  </div>''')
                                    audit_counts["selling_point_cards"] += 1
                                else:
                                    sp_cards_html.append(f'<div style="padding: 12px; background: rgba(0,0,0,0.02); border-radius: 8px;">{compile_md_to_html(chunk_strip)}</div>')
                            sp_cards_html.append('</div>')
                            html_blocks.append('\n'.join(sp_cards_html))
                            continue

                        html_blocks.append(f'<h3 id="{anchor_id}" style="margin-top: 26px; margin-bottom: 12px; color: #222; font-size: 16px; display: flex; align-items: center;">{title_styled}</h3>')
                    else:
                        html_blocks.append(f'<h4 id="{anchor_id}" style="margin-top: 20px; margin-bottom: 10px; color: #333; font-size: 14px;">{title_styled}</h4>')
                i += 1
                continue

            # 捕获表格段落并应用组件或降级 fallback
            if line.startswith("|"):
                table_lines = []
                while i < n and lines[i].strip().startswith("|"):
                    table_lines.append(lines[i].strip())
                    i += 1

                rows, headers = parse_markdown_table(table_lines)

                # 语义推断或 sidecar 匹配组件名
                comp_name = None
                if current_component:
                    comp_name = current_component
                    current_component = None
                else:
                    comp_name = sidecar_map.get(current_section) or sidecar_map.get(line)
                    if not comp_name:
                        comp_name = infer_component(current_section, headers)

                # 特殊强化 1: ## 基础信息 键盘值卡片网格
                if "基础信息" in current_section:
                    comp_name = "basic_info_panel"

                if comp_name == "basic_info_panel":
                    basic_info_html = ['<div class="pdh-basic-info-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin: 20px 0;">']
                    for r in rows:
                        attr = r.get("属性", "").strip()
                        val = r.get("内容", "").strip()
                        if not attr and not val:
                            keys = list(r.keys())
                            if len(keys) >= 2:
                                attr = r[keys[0]].strip()
                                val = r[keys[1]].strip()
                        if attr:
                            basic_info_html.append(f'''  <div class="pdh-kv-card" style="padding: 16px; background: var(--card-bg); border-radius: 12px; border: var(--card-border); box-shadow: var(--card-shadow); display: flex; flex-direction: column;">
    <span style="font-size: 11px; color: rgba(0,0,0,0.4); text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">{attr}</span>
    <strong style="font-size: 15px; color: #1D1D1F; font-weight: 600;">{val}</strong>
  </div>''')
                    basic_info_html.append('</div>')
                    html_blocks.append('\n'.join(basic_info_html))
                    audit_counts["basic_info_card"] += 1
                    continue

                # 特殊强化 2: ### 4.1 买家心理五维图谱 转换为情绪卡片
                if "4.1" in current_section or "心理五维" in current_section:
                    emotion_html = ['<div class="pdh-emotion-card-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin: 20px 0;">']
                    for r in rows:
                        dim = r.get("情绪维度", "").strip()
                        mon = r.get("内心独白", "").strip()
                        sol = r.get("解决方案", "").strip()
                        sup = r.get("工艺/面料支撑", "").strip()

                        pill_bg = "#FFE5E5"
                        pill_color = "#D32F2F"
                        if dim == "痒点":
                            pill_bg = "#FFF3E0"
                            pill_color = "#E65100"
                        elif dim == "爽点":
                            pill_bg = "#E8F5E9"
                            pill_color = "#2E7D32"
                        elif dim == "槽点":
                            pill_bg = "#ECEFF1"
                            pill_color = "#455A64"
                        elif dim == "爆点":
                            pill_bg = "#F3E5F5"
                            pill_color = "#7B1FA2"

                        emotion_html.append(f'''  <div class="pdh-emotion-card" style="padding: 20px; background: var(--card-bg); border-radius: 14px; border: var(--card-border); box-shadow: var(--card-shadow); display: flex; flex-direction: column; justify-content: space-between; border-left: var(--accent-border);">
    <div>
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <span class="pdh-status-pill" style="background: {pill_bg}; color: {pill_color}; border: 1px solid rgba(0,0,0,0.03); padding: 2px 8px; border-radius: 20px; font-size: 12px; font-weight: 700;">{dim}</span>
      </div>
      <p style="font-style: italic; color: #555; margin-bottom: 12px; font-size: 13px; line-height: 1.6;">“{mon}”</p>
      <div style="background: rgba(255,255,255,0.6); border-radius: 8px; padding: 12px; margin-bottom: 10px; font-size: 13px; color: #333;">
        <strong>解决方案：</strong>{sol}
      </div>
    </div>
    <div style="font-size: 11.5px; color: #666; border-top: 1px dashed rgba(0,0,0,0.06); padding-top: 8px;">
      <strong>工艺支撑：</strong>{sup}
    </div>
  </div>''')
                        audit_counts["emotion_cards"] += 1
                    emotion_html.append('</div>')
                    html_blocks.append('\n'.join(emotion_html))
                    continue

                # 特殊强化 3: ### 2.3 决策旅程 转换为极富设计感的 macOS 风格步骤流 (v2.3.5)
                if "2.3" in current_section or "决策旅程" in current_section:
                    journey_html = ['<div class="pdh-decision-journey-timeline" style="display: flex; flex-direction: column; gap: 16px; margin: 20px 0; position: relative;">']
                    step_emojis = ["🔍", "❤️", "⚖️", "🛒", "📢", "✨"]
                    for idx, r in enumerate(rows):
                        stage = r.get("阶段", "").strip()
                        behavior = r.get("行为", "").strip()
                        touchpoint = r.get("触点", "").strip()
                        if not stage and not behavior:
                            keys = list(r.keys())
                            if len(keys) >= 3:
                                stage = r[keys[0]].strip()
                                behavior = r[keys[1]].strip()
                                touchpoint = r[keys[2]].strip()

                        emoji = step_emojis[idx % len(step_emojis)]
                        journey_html.append(f'''  <div class="pdh-journey-card" style="padding: 18px 20px; background: var(--card-bg); border-radius: 14px; border: var(--card-border); box-shadow: var(--card-shadow); display: flex; align-items: center; justify-content: space-between; gap: 16px; border-left: var(--accent-border);">
    <div style="display: flex; align-items: center; gap: 12px; min-width: 120px;">
      <span style="font-size: 18px;">{emoji}</span>
      <span class="pdh-status-pill" style="background: rgba(0, 113, 227, 0.08); color: var(--brand-color); padding: 4px 10px; border-radius: 8px; font-size: 13px; font-weight: 700;">{stage}</span>
    </div>
    <div style="flex-grow: 1; font-size: 13.5px; color: #1D1D1F; font-weight: 500;">
      {behavior}
    </div>
    <div style="font-size: 12px; color: rgba(0,0,0,0.5); font-weight: 600; text-align: right; background: rgba(0,0,0,0.03); padding: 6px 12px; border-radius: 20px;">
      📍 {touchpoint}
    </div>
  </div>''')
                    journey_html.append('</div>')
                    html_blocks.append('\n'.join(journey_html))
                    audit_counts["audience_card_grid"] += 1
                    continue

                # 特殊强化 4: ### 4.2 情绪→内容转化钩子矩阵 转换为高奢营销卡片 (v2.3.5)
                if "4.2" in current_section or "转化钩子" in current_section:
                    hook_html = ['<div class="pdh-emotion-hook-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin: 20px 0;">']
                    for r in rows:
                        emo = r.get("情绪", "").strip()
                        xhs = r.get("小红书钩子", "").strip()
                        dy = r.get("抖音钩子", "").strip()
                        zb = r.get("直播间钩子", "").strip()
                        pl = r.get("评论区引导", "").strip() or r.get("评论区引流", "").strip()

                        hook_html.append(f'''  <div class="pdh-hook-card" style="padding: 20px; background: var(--card-bg); border-radius: 16px; border: var(--card-border); box-shadow: var(--card-shadow); display: flex; flex-direction: column; justify-content: space-between; border-left: var(--accent-border);">
    <div>
      <div style="font-size: 14px; font-weight: 700; color: var(--brand-color); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
        🎭 <span>触发情绪: {emo}</span>
      </div>
      <div style="font-size: 13.5px; color: #1D1D1F; font-weight: 600; margin-bottom: 8px;">
        📖 <strong>小红书钩子：</strong>{xhs}
      </div>
      <div style="font-size: 13.5px; color: #1D1D1F; font-weight: 600; margin-bottom: 8px;">
        🎵 <strong>抖音钩子：</strong>{dy}
      </div>
      <div style="font-size: 13.5px; color: #1D1D1F; font-weight: 600; margin-bottom: 8px; background: rgba(0,0,0,0.02); padding: 10px; border-radius: 8px;">
        📺 <strong>直播间钩子：</strong>{zb}
      </div>
    </div>
    <div style="font-size: 12px; color: #555; border-top: 1px dashed rgba(0,0,0,0.06); padding-top: 10px; margin-top: 12px;">
      💬 <strong>评论区引导：</strong>{pl}
    </div>
  </div>''')
                    hook_html.append('</div>')
                    html_blocks.append('\n'.join(hook_html))
                    audit_counts["marketing_cards"] += 1
                    continue

                # 特殊强化 6: 真人试穿建议 转换为买手真人试穿体验卡片 (通用适配版)
                if ("试穿者编号" in headers or "试穿感受" in headers) and ("试穿感受" in headers):
                    fit_html = ['<div class="pdh-fit-suggest-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin: 20px 0;">']
                    for r in rows:
                        h = r.get("身高", "").strip()
                        w = r.get("体重", "").strip()
                        height_weight = f"{h} / {w}" if (h or w) else r.get("身高体重", "").strip()
                        if not height_weight:
                            height_weight = r.get("试穿者编号", "").strip()

                        rec_size = r.get("试穿尺码", "").strip() or r.get("推荐尺码", "").strip()
                        feel = r.get("试穿感受", "").strip()

                        fit_html.append(f'''  <div class="pdh-fit-card" style="padding: 20px; background: var(--card-bg); border-radius: 16px; border: var(--card-border); box-shadow: var(--card-shadow); display: flex; flex-direction: column; justify-content: space-between; border-left: var(--accent-border);">
    <div>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <span style="font-size: 13px; font-weight: 700; color: #1D1D1F;">🧍‍♀️ {height_weight}</span>
        <span class="pdh-status-pill" style="background: rgba(0, 113, 227, 0.08); color: var(--brand-color); padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700;">建议: {rec_size}</span>
      </div>
      <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.6; font-style: italic;">“{feel}”</p>
    </div>
  </div>''')
                    fit_html.append('</div>')
                    html_blocks.append('\n'.join(fit_html))
                    audit_counts["size_table"] += 1
                    continue

                # 特殊强化 7: 身高体重推荐表 转换为优雅的推荐卡片
                if "身高范围" in headers and "体重范围" in headers and "推荐尺码" in headers:
                    rec_html = ['<div class="pdh-size-recommend-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin: 20px 0;">']
                    for r in rows:
                        h_range = r.get("身高范围", "").strip()
                        w_range = r.get("体重范围", "").strip()
                        rec_size = r.get("推荐尺码", "").strip()
                        note = r.get("备注", "").strip()

                        rec_html.append(f'''  <div class="pdh-recommend-card" style="padding: 16px; background: var(--card-bg); border-radius: 12px; border: var(--card-border); box-shadow: var(--card-shadow); display: flex; flex-direction: column; justify-content: space-between; border-top: var(--accent-border);">
    <div>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 13px; font-weight: 700; color: #1D1D1F;">📏 {h_range} | {w_range}</span>
        <span class="pdh-status-pill" style="background: rgba(46, 125, 50, 0.08); color: #2E7D32; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">建议: {rec_size}</span>
      </div>
      <p style="margin: 0; font-size: 12px; color: #666; line-height: 1.5;">{note}</p>
    </div>
  </div>''')
                    rec_html.append('</div>')
                    html_blocks.append('\n'.join(rec_html))
                    audit_counts["size_table"] += 1
                    continue

                # 特殊强化 8: 特殊身材选码提示表 转换为警告/建议卡片
                if "身材类型" in headers and "推荐尺码建议" in headers:
                    tips_html = ['<div class="pdh-body-tips-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin: 20px 0;">']
                    for r in rows:
                        body_type = r.get("身材类型", "").strip()
                        rec_sug = r.get("推荐尺码建议", "").strip()
                        effect = r.get("穿着效果说明", "").strip()
                        note = r.get("注意事项", "").strip()

                        tips_html.append(f'''  <div class="pdh-body-tip-card" style="padding: 16px; background: var(--card-bg); border-radius: 12px; border: var(--card-border); box-shadow: var(--card-shadow); display: flex; flex-direction: column; gap: 8px; border-left: 4px solid #E65100;">
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <strong style="font-size: 13.5px; color: #1D1D1F;">👤 {body_type}</strong>
      <span class="pdh-status-pill" style="background: rgba(230, 81, 0, 0.08); color: #E65100; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">{rec_sug}</span>
    </div>
    <div style="font-size: 12px; color: #444; line-height: 1.5;"><strong>效果:</strong> {effect}</div>
    <div style="font-size: 11.5px; color: #777; line-height: 1.5; border-top: 1px dashed rgba(0,0,0,0.05); padding-top: 6px;"><strong>注意:</strong> {note}</div>
  </div>''')
                    tips_html.append('</div>')
                    html_blocks.append('\n'.join(tips_html))
                    audit_counts["size_table"] += 1
                    continue

                # 特殊强化 5: ### 7.1 主播视觉 setup 转换为高奢卡片网格 (v2.3.5)
                if "7.1" in current_section or "主播视觉 setup" in current_section:
                    setup_html = ['<div class="pdh-setup-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin: 20px 0;">']
                    emoji_map = {
                        "穿搭": "👕", "主播": "👕", "场景": "🎬", "布置": "🎬", "灯光": "💡", "道具": "🎒", "面料": "🎒"
                    }
                    for r in rows:
                        project = r.get("项目", "").strip()
                        suggest = r.get("建议", "").strip()
                        if not project and not suggest:
                            keys = list(r.keys())
                            if len(keys) >= 2:
                                project = r[keys[0]].strip()
                                suggest = r[keys[1]].strip()

                        emoji = "✨"
                        for k, v in emoji_map.items():
                            if k in project:
                                emoji = v
                                break

                        setup_html.append(f'''  <div class="pdh-setup-card" style="padding: 20px; background: var(--card-bg); border-radius: 14px; border: var(--card-border); box-shadow: var(--card-shadow); border-top: var(--accent-border); display: flex; flex-direction: column; justify-content: space-between;">
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
      <span style="font-size: 20px;">{emoji}</span>
      <span style="font-size: 14px; font-weight: 700; color: var(--brand-color); letter-spacing: 0.5px;">{project}</span>
    </div>
    <p style="margin: 0; font-size: 13px; color: #333; line-height: 1.6; text-align: left; background: rgba(255,255,255,0.4); padding: 10px; border-radius: 8px;">{suggest}</p>
  </div>''')
                    setup_html.append('</div>')
                    html_blocks.append('\n'.join(setup_html))
                    audit_counts["livestream_timeline"] += 1
                    continue

                # 特殊强化 6: 试穿建议 转换为高奢买手真人试穿体验卡片 (v2.3.5)
                if "身高体重" in headers and "推荐尺码" in headers and "试穿感受" in headers:
                    fit_html = ['<div class="pdh-fit-suggest-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin: 20px 0;">']
                    for r in rows:
                        height_weight = r.get("身高体重", "").strip()
                        rec_size = r.get("推荐尺码", "").strip()
                        feel = r.get("试穿感受", "").strip()

                        fit_html.append(f'''  <div class="pdh-fit-card" style="padding: 20px; background: var(--card-bg); border-radius: 16px; border: var(--card-border); box-shadow: var(--card-shadow); display: flex; flex-direction: column; justify-content: space-between; border-left: var(--accent-border);">
    <div>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <span style="font-size: 13px; font-weight: 700; color: #1D1D1F;">🧍‍♀️ {height_weight}</span>
        <span class="pdh-status-pill" style="background: rgba(0, 113, 227, 0.08); color: var(--brand-color); padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700;">建议: {rec_size}</span>
      </div>
      <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.6; font-style: italic;">“{feel}”</p>
    </div>
  </div>''')
                    fit_html.append('</div>')
                    html_blocks.append('\n'.join(fit_html))
                    audit_counts["size_table"] += 1
                    continue

                # 标准组件装载路径
                if comp_name and comp_name in components_schema:
                    schema = components_schema.get(comp_name)
                    aligned_rows, aligned_headers, err = match_schema_and_align(rows, headers, schema)
                    if err:
                        print(f"[!] 渲染器警告: 组件 {comp_name} 匹配失败: {err}，已优雅降级回退标准表格")
                        html_blocks.append(markdown_table_to_html(rows, headers, is_fallback=True))
                        fallback_blocks.append(current_section)
                        continue

                    comp_html = self._render_component_html(comp_name, aligned_rows, aligned_headers, tokens)
                    html_blocks.append(comp_html)

                    # 递增组件审计量
                    if comp_name == "audience_card_grid":
                        audit_counts["audience_card_grid"] += 1
                    elif comp_name == "scene_card_grid":
                        audit_counts["scene_card_grid"] += 1
                    elif comp_name == "marketing_card_grid":
                        audit_counts["marketing_cards"] += 1
                    elif comp_name == "livestream_quote_card":
                        audit_counts["livestream_timeline"] += 1
                    elif comp_name == "qualification_card_grid":
                        audit_counts["qualification_cards"] += 1
                    elif comp_name == "size_table_gradient":
                        audit_counts["size_table"] += 1
                    elif comp_name == "size_guide_cards":
                        audit_counts["size_table"] += 1
                else:
                    html_blocks.append(markdown_table_to_html(rows, headers, is_fallback=False))
                continue

            # 捕获列表块并转换为标准的无序列表
            if line.startswith("-") or line.startswith("*"):
                list_items = []
                while i < n and (lines[i].strip().startswith("-") or lines[i].strip().startswith("*")):
                    item_text = re.sub(r'^[-*]\s*', '', lines[i].strip())
                    list_items.append(item_text)
                    i += 1

                html_list = ['<ul style="line-height: 1.6; color: #444; padding-left: 20px; margin: 12px 0;">']
                for item in list_items:
                    item = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', item)
                    html_list.append(f'  <li style="margin-bottom: 6px;">{item}</li>')
                html_list.append('</ul>')
                html_blocks.append('\n'.join(html_list))
                continue

            # 捕获引用块并添加优雅样式
            if line.startswith(">"):
                quote_lines = []
                while i < n and lines[i].strip().startswith(">"):
                    item_text = re.sub(r'^>\s*', '', lines[i].strip())
                    quote_lines.append(item_text)
                    i += 1
                quote_content = '<br>'.join(quote_lines)
                quote_content = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', quote_content)
                quote_content = re.sub(
                    r'<span style="background: #FFF3E0; color: #E65100; padding: 2px 8px; border-radius: 4px; font-size: 11px; cursor: help;" title="[^"]+">🤖 AI 推断</span>',
                    r'<span style="background: #FFF3E0; color: #E65100; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px;">🤖 AI 推断</span>',
                    quote_content
                )
                html_blocks.append(f'<blockquote style="border-left: 4px solid var(--brand-color); padding: 12px 18px; margin: 20px 0; background: rgba(0,0,0,0.01); color: #555; border-radius: 0 8px 8px 0; font-size: 14px;">{quote_content}</blockquote>')
                continue

            # 捕获水平分割线
            if line == "---":
                html_blocks.append('<hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.08); margin: 30px 0;">')
                i += 1
                continue

            # 跳过空白行
            if not line:
                i += 1
                continue

            # 普通段落处理
            p_text = line
            p_text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', p_text)
            p_text = re.sub(
                r'!\[(.*?)\]\((.*?)\)',
                r'<div style="text-align: center; margin: 20px 0; display: flex; justify-content: center;"><div class="pdh-image-box" style="width: 100%; max-width: 600px; height: 360px; background: rgba(0,0,0,0.02); display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 8px; border: var(--card-border); box-shadow: 0 4px 15px rgba(0,0,0,0.03);"><img src="\2" alt="\1" style="width: 100%; height: 100%; object-fit: contain; display: block;"></div></div>',
                p_text
            )
            html_blocks.append(f'<p style="margin-bottom: 14px; color: #444; font-size: 14.5px;">{p_text}</p>')
            i += 1

        # 闭合最后一个二级章节卡片
        if inside_h2_card:
            html_blocks.append('</section>\n')

        # 构建 TOC 列表 (锚点跳转)
        toc_html = []
        for lvl, tit, anc in headings:
            if lvl == 2:
                toc_html.append(f'<li class="toc-item"><a href="#{anc}" class="toc-link h2-link">{tit}</a></li>')
            elif lvl == 3:
                toc_html.append(f'<li class="toc-item"><a href="#{anc}" class="toc-link h3-link">{tit}</a></li>')

        # Task 3: 模块化解耦加载 Shell 和 Theme CSS 文件
        shell_path = os.path.join(self.skill_dir, 'references', 'html_shell', 'base_shell.html')
        if os.path.exists(shell_path):
            with open(shell_path, 'r', encoding='utf-8') as f:
                shell_tpl = f.read()
        else:
            raise FileNotFoundError(f"未找到 HTML Shell 模板: {shell_path}")

        css_path = os.path.join(self.skill_dir, 'references', 'html_themes', f"{self.style_profile}.css")
        if os.path.exists(css_path):
            with open(css_path, 'r', encoding='utf-8') as f:
                css_tpl = f.read()
        else:
            print(f"[!] 警告: 未找到 {self.style_profile}.css，使用默认 css 样式")
            css_tpl = ""

        # 注入 macOS traffic lights 等高奢类，并对齐 shell semantic tags
        shell_tpl = shell_tpl.replace('<body>', '<body class="pdh-mac-body">\n  <input type="checkbox" id="pdh-sidebar-toggle" class="pdh-toggle-checkbox" style="display: none;">\n  <label for="pdh-sidebar-toggle" class="pdh-sidebar-toggle-label" title="收起/展开导航目录">\n    <span class="pdh-toggle-icon"></span>\n  </label>')
        shell_tpl = shell_tpl.replace('<div class="sidebar">', '<nav class="sidebar pdh-toc">')
        shell_tpl = shell_tpl.replace('</div>\n\n  <div class="content-area">', '</nav>\n\n  <main class="content-area pdh-mac-page">')
        # 更加健壮地对齐闭合标签，支持尾部可能存在的注释
        shell_tpl = re.sub(r'</div>\s*(<!--.*?-->\s*)?</body>', '</main>\n\\1</body>', shell_tpl, flags=re.DOTALL)

        # 填充 CSS 变量
        css_tpl = css_tpl.replace('{{brand_color}}', tokens.get('brand_color', '#0071E3'))
        css_tpl = css_tpl.replace('{{card_bg}}', tokens.get('card_bg', 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F7 100%)'))
        css_tpl = css_tpl.replace('{{card_shadow}}', tokens.get('card_shadow', '0 8px 30px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.02)'))
        css_tpl = css_tpl.replace('{{card_border}}', tokens.get('card_border', '1px solid rgba(0, 0, 0, 0.08)'))
        css_tpl = css_tpl.replace('{{accent_border}}', tokens.get('accent_border', '4px solid #0071E3'))
        css_tpl = css_tpl.replace('{{icon_bg}}', tokens.get('icon_bg', '#0071E3'))

        allow_remote = getattr(self, 'allow_remote_fonts', False)
        remote_font_import = "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Outfit:wght@300;400;600;700&display=swap');" if allow_remote else ""

        final_html = shell_tpl
        final_html = final_html.replace('{{title}}', f"{self.sku_name} 商品手册")
        final_html = final_html.replace('{{sku_title}}', self.sku_name)
        final_html = final_html.replace('{{style_profile_name}}', style_name)
        final_html = final_html.replace('{{remote_font_import}}', remote_font_import)
        final_html = final_html.replace('{{style_profile_css}}', css_tpl)
        final_html = final_html.replace('{{toc_items}}', '\n      '.join(toc_html))
        final_html = final_html.replace('{{main_body}}', '\n      '.join(html_blocks))

        os.makedirs(os.path.dirname(os.path.abspath(html_path)), exist_ok=True)
        # 敏感词物理自净
        final_html = self.sanitize_handbook_text(final_html, is_html=True)
        with open(html_path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(final_html)

        print(f"[+] 精美 HTML 视图编译组装成功! {html_path}")

        # Task 1: 新增 HTML 视觉渲染审计报告
        total_comps = sum(audit_counts.values()) - audit_counts.get("hero", 0)
        visual_pass = total_comps > 0

        audit_json = {
            "timestamp": datetime.now().isoformat(),
            "sku_name": self.sku_name,
            "shell_loaded": True,
            "theme_loaded": self.style_profile,
            "component_blocks": audit_counts,
            "fallback_blocks": fallback_blocks,
            "visual_enhancement_pass": visual_pass
        }

        audit_dir = os.path.join(self.scratch_dir, 'reports')
        os.makedirs(audit_dir, exist_ok=True)

        with open(os.path.join(audit_dir, 'html_render_visual_audit.json'), 'w', encoding='utf-8') as f:
            json.dump(audit_json, f, ensure_ascii=False, indent=2)

        with open(os.path.join(audit_dir, 'html_render_visual_audit.md'), 'w', encoding='utf-8') as f:
            f.write(f"# v2.3.5 HTML 视觉化渲染审计报告\n\n")
            f.write(f"- **SKU**: `{self.sku_name}`\n")
            f.write(f"- **样式模版**: `{self.style_profile}`\n")
            f.write(f"- **视觉增强校验**: `{'✅ PASS' if visual_pass else '❌ FAIL'}`\n\n")
            f.write(f"## 📊 视觉组件装载明细\n\n")
            f.write(f"| 组件类型 | 核心卡片数量 |\n")
            f.write(f"|---|---|\n")
            for k, v in audit_counts.items():
                f.write(f"| {k} | {v} |\n")

            if fallback_blocks:
                f.write(f"\n## ⚠️ 以下章节触发普通 Table 降级\n\n")
                for fb in fallback_blocks:
                    f.write(f"- `{fb}`\n")

        print(f"[*] 视觉渲染审计完成，共装载组件卡片数量 {total_comps} 个，状态: {'PASS' if visual_pass else 'FAIL'}")
        if not visual_pass:
            raise RuntimeError("[!] 渲染审计阻断：编译出的 HTML 组件增强数量为 0！")

        return html_path

    def _get_excluded_candidates(self, image_plan_path):
        excluded_ids = set()
        excluded_paths = set()
        selected_ids = set()
        selected_paths = set()
        if not os.path.exists(image_plan_path):
            return excluded_ids, excluded_paths

        try:
            with open(image_plan_path, 'r', encoding='utf-8') as f:
                plan = json.load(f)
        except Exception as e:
            safe_print(f"[WARN] 无法读取 image_selection_plan.json: {e}")
            return excluded_ids, excluded_paths

        def collect_ex(ex_list):
            if not isinstance(ex_list, list):
                return
            for ex in ex_list:
                if not isinstance(ex, dict):
                    continue
                ex_id = ex.get('id')
                if ex_id:
                    excluded_ids.add(ex_id)
                p = ex.get('original_path') or ex.get('path') or ex.get('relative_path')
                if p:
                    excluded_paths.add(p)
                    excluded_paths.add(os.path.basename(p))

        def collect_sel(sel_list):
            if not isinstance(sel_list, list):
                return
            for sel in sel_list:
                if not isinstance(sel, dict):
                    continue
                sel_id = sel.get('id')
                if sel_id:
                    selected_ids.add(sel_id)
                p = sel.get('original_path') or sel.get('path') or sel.get('relative_path')
                if p:
                    selected_paths.add(p)
                    selected_paths.add(os.path.basename(p))

        for sec_name, sec_val in plan.items():
            if not isinstance(sec_val, dict):
                continue
            if 'excluded_candidates' in sec_val:
                collect_ex(sec_val['excluded_candidates'])
            if 'items' in sec_val:
                collect_sel(sec_val['items'])
            
            for sub_key, sub_val in sec_val.items():
                if isinstance(sub_val, dict):
                    if 'excluded_candidates' in sub_val:
                        collect_ex(sub_val['excluded_candidates'])
                    if 'items' in sub_val:
                        collect_sel(sub_val['items'])

        # 差集计算，保障在别处被选用的图片不被误杀
        final_ex_ids = excluded_ids - selected_ids
        final_ex_paths = excluded_paths - selected_paths
        return final_ex_ids, final_ex_paths

    def _clean_markdown_tables(self, content, ex_ids, ex_paths):
        if not ex_ids and not ex_paths:
            return content

        lines = content.split('\n')
        new_lines = []
        in_table = False
        table_lines = []

        def flush_table(tbl_lines):
            if not tbl_lines:
                return []
            
            parsed_rows = []
            for line in tbl_lines:
                row_strip = line.strip()
                if row_strip.startswith('|') and row_strip.endswith('|'):
                    cells = [c.strip() for c in row_strip[1:-1].split('|')]
                else:
                    cells = [c.strip() for c in row_strip.split('|')]
                parsed_rows.append(cells)
            
            col_count = len(parsed_rows[0])
            for row in parsed_rows:
                if len(row) != col_count:
                    return tbl_lines

            cols_to_delete = set()
            for col_idx in range(col_count):
                should_delete = False
                for row in parsed_rows:
                    cell_text = row[col_idx]
                    for ex_id in ex_ids:
                        if ex_id in cell_text:
                            should_delete = True
                            break
                    if should_delete:
                        break
                    for ex_path in ex_paths:
                        if ex_path in cell_text:
                            should_delete = True
                            break
                    if should_delete:
                        break
                if should_delete:
                    cols_to_delete.add(col_idx)

            if not cols_to_delete:
                return tbl_lines

            if len(cols_to_delete) >= col_count:
                return []

            new_tbl_lines = []
            for row in parsed_rows:
                new_cells = [row[idx] for idx in range(col_count) if idx not in cols_to_delete]
                new_tbl_lines.append("| " + " | ".join(new_cells) + " |")
            return new_tbl_lines

        for line in lines:
            line_strip = line.strip()
            if line_strip.startswith('|') and (line_strip.endswith('|') or '|' in line_strip):
                in_table = True
                table_lines.append(line)
            else:
                if in_table:
                    new_lines.extend(flush_table(table_lines))
                    table_lines = []
                    in_table = False
                new_lines.append(line)
        
        if in_table:
            new_lines.extend(flush_table(table_lines))
            
        return '\n'.join(new_lines)

    def _clean_html_cards(self, content, ex_ids, ex_paths):
        if not ex_ids and not ex_paths:
            return content

        pattern_54_card = r'<div class="(?:pdh-material-row-card|pdh-card pdh-material-card)"[^>]*>.*?</div>\s*</div>'
        def repl_54_card(match):
            card_text = match.group(0)
            for ex_id in ex_ids:
                if ex_id in card_text:
                    return ""
            for ex_path in ex_paths:
                if ex_path in card_text:
                    return ""
            return card_text
        content = re.sub(pattern_54_card, repl_54_card, content, flags=re.S)

        pattern_normal_card = r'<div class="pdh-card\b[^>]*>.*?</div>\s*</div>'
        def repl_normal_card(match):
            card_text = match.group(0)
            for ex_id in ex_ids:
                if ex_id in card_text:
                    return ""
            for ex_path in ex_paths:
                if ex_path in card_text:
                    return ""
            return card_text
        content = re.sub(pattern_normal_card, repl_normal_card, content, flags=re.S)

        pattern_effect_wrap = r'<div class="pdh-outfit-effect-wrap"[^>]*>.*?</div>\s*</div>'
        content = re.sub(pattern_effect_wrap, repl_normal_card, content, flags=re.S)

        return content

    def _render_component_html(self, comp_name, rows, headers, tokens):
        tpl_path = os.path.join(self.skill_dir, 'references', 'render_components', f"{comp_name}.html")
        with open(tpl_path, 'r', encoding='utf-8') as f:
            tpl_content = f.read()

        container_match = re.search(r'<!-- container -->\n(.*?)\n<!-- /container -->', tpl_content, re.DOTALL)
        if not container_match:
            return ""
        container_tpl = container_match.group(1)

        if comp_name == "audience_card_grid" and not ("人群" in headers or "画像描述" in headers):
            # Simple mode (Single table with rows)
            item_simple_match = re.search(r'<!-- item_simple -->\n(.*?)\n<!-- /item_simple -->', tpl_content, re.DOTALL)
            header_match = re.search(r'<!-- behavior_header -->\n(.*?)\n<!-- /behavior_header -->', tpl_content, re.DOTALL)
            row_match = re.search(r'<!-- behavior_row -->\n(.*?)\n<!-- /behavior_row -->', tpl_content, re.DOTALL)

            item_simple_tpl = item_simple_match.group(1) if item_simple_match else ""
            header_tpl = header_match.group(1) if header_match else ""
            row_tpl = row_match.group(1) if row_match else ""

            header_html = header_tpl

            pill_colors = [
                ("#E0F2FE", "#0284C7"), # Blue
                ("#F3E8FF", "#7C3AED"), # Purple
                ("#E0F2FE", "#0284C7"), # Blue
                ("#F3E8FF", "#7C3AED"), # Purple
                ("#EEF2F6", "#4B5563"), # Gray
            ]

            formatted_rows = []
            for idx, r in enumerate(rows):
                row_bg = "#FFFFFF" if idx % 2 == 0 else "#FAFAFA"
                pill_bg, pill_color = pill_colors[idx % len(pill_colors)]

                row_html = row_tpl.replace('{{row_bg}}', row_bg)\
                                  .replace('{{pill_bg}}', pill_bg)\
                                  .replace('{{pill_color}}', pill_color)\
                                  .replace('{{idx}}', str(idx % len(pill_colors)))

                for k, v in r.items():
                    row_html = row_html.replace('{{' + k + '}}', v)
                formatted_rows.append(row_html)

            table_html = item_simple_tpl.replace('{{behavior_header}}', header_html)\
                                        .replace('{{behavior_rows}}', '\n'.join(formatted_rows))

            return container_tpl.replace('{{items}}', table_html)

        if comp_name == "audience_card_grid":
            item_match = re.search(r'<!-- item_rich -->\n(.*?)\n<!-- /item_rich -->', tpl_content, re.DOTALL)
        elif comp_name == "size_table_gradient":
            header_cell_match = re.search(r'<!-- header_cell -->\n(.*?)\n<!-- /header_cell -->', tpl_content, re.DOTALL)
            row_item_match = re.search(r'<!-- row_item -->\n(.*?)\n<!-- /row_item -->', tpl_content, re.DOTALL)
            cell_item_match = re.search(r'<!-- cell_item -->\n(.*?)\n<!-- /cell_item -->', tpl_content, re.DOTALL)

            header_cell_tpl = header_cell_match.group(1) if header_cell_match else ""
            row_item_tpl = row_item_match.group(1) if row_item_match else ""
            cell_item_tpl = cell_item_match.group(1) if cell_item_match else ""

            # 格式化表头
            formatted_headers = []
            for h in headers:
                formatted_headers.append(header_cell_tpl.replace('{{name}}', h))

            # 格式化各行数据
            formatted_rows = []
            for idx, r in enumerate(rows):
                row_bg = "#FFFFFF" if idx % 2 == 0 else "#FAFAFA"
                cells_html = []
                for h in headers:
                    val = r.get(h, "")
                    cell_style = "font-weight: 700; color: var(--brand-color);" if h == "尺码" else ""
                    cell_content = cell_item_tpl.replace('{{value}}', val).replace('{{cell_style}}', cell_style)
                    cells_html.append(cell_content)
                row_content = row_item_tpl.replace('{{row_bg}}', row_bg).replace('{{cells}}', '\n'.join(cells_html))
                formatted_rows.append(row_content)

            return container_tpl.replace('{{headers}}', '\n'.join(formatted_headers)).replace('{{rows}}', '\n'.join(formatted_rows))
        else:
            item_match = re.search(r'<!-- item -->\n(.*?)\n<!-- /item -->', tpl_content, re.DOTALL)

        item_tpl = item_match.group(1) if item_match else ""

        formatted_items = []
        for r in rows:
            item_html = item_tpl

            # 自动注入匹配的图标 emoji
            if "人群" in r:
                item_html = item_html.replace('{{icon}}', self._get_emoji_helper(r["人群"]))
            elif "具体场景" in r:
                item_html = item_html.replace('{{icon}}', self._get_emoji_helper(r["具体场景"]))
            elif "平台" in r:
                item_html = item_html.replace('{{icon}}', self._get_emoji_helper(r["平台"]))
            elif "建议维度" in r:
                item_html = item_html.replace('{{icon}}', self._get_emoji_helper(r["建议维度"]))

            # 针对可选/特有属性的处理
            if comp_name == "scene_card_grid":
                cat = r.get("场景类别", "")
                cat_display = f'<span style="opacity: 0.6; font-size: 13px;">{cat}</span><br>' if cat else ""
                item_html = item_html.replace('{{category_display}}', cat_display)
            elif comp_name == "marketing_card_grid":
                style = r.get("视觉风格", "")
                if style:
                    style_match = re.search(r'<!-- optional_style -->\n(.*?)\n<!-- /optional_style -->', tpl_content, re.DOTALL)
                    style_tpl = style_match.group(1) if style_match else ""
                    style_html = style_tpl.replace('{{视觉风格}}', style)
                    item_html = item_html.replace('{{optional_style}}', style_html)
                else:
                    item_html = item_html.replace('{{optional_style}}', "")
            elif comp_name == "livestream_quote_card":
                act = r.get("核心动作", "")
                if act:
                    act_match = re.search(r'<!-- optional_action -->\n(.*?)\n<!-- /optional_action -->', tpl_content, re.DOTALL)
                    act_tpl = act_match.group(1) if act_match else ""
                    act_html = act_tpl.replace('{{核心动作}}', act)
                    item_html = item_html.replace('{{optional_action}}', act_html)
                else:
                    item_html = item_html.replace('{{optional_action}}', "")

                emo = r.get("情绪调性", "")
                if emo:
                    emo_match = re.search(r'<!-- optional_emotion -->\n(.*?)\n<!-- /optional_emotion -->', tpl_content, re.DOTALL)
                    emo_tpl = emo_match.group(1) if emo_match else ""
                    emo_html = emo_tpl.replace('{{情绪调性}}', emo)
                    item_html = item_html.replace('{{optional_emotion}}', emo_html)
                else:
                    item_html = item_html.replace('{{optional_emotion}}', "")
            elif comp_name == "audience_card_grid" and ("人群" in headers or "画像描述" in headers):
                age = r.get("年龄层", "") or r.get("年龄", "")
                inc = r.get("收入", "") or r.get("月收入", "")
                reg = r.get("地域", "")
                meta_parts = []
                if age: meta_parts.append(f"年龄 {age}")
                if inc: meta_parts.append(f"月收入 {inc}")
                if reg: meta_parts.append(reg)
                item_html = item_html.replace('{{meta}}', ' · '.join(meta_parts))

            # 填充值
            for k, v in r.items():
                item_html = item_html.replace('{{' + k + '}}', v)

            # 清理所有未替换的双花括号占位符 (防止验证未通过)
            item_html = re.sub(r'\{\{[a-zA-Z0-9_\u4e00-\u9fff]+\}\}', '', item_html)

            formatted_items.append(item_html)

        return container_tpl.replace('{{items}}', '\n'.join(formatted_items))

    def _get_emoji_helper(self, text):
        emoji_map = {
            "日常通勤": "🏢", "办公室": "🏢", "商务会议": "🏢",
            "下午茶约会": "☕", "咖啡探店": "☕", "逛街购物": "☕", "日常约会": "☕", "下午茶": "☕", "周末休闲": "☕",
            "居家放松": "🧘‍♀️", "居家办公": "🧘‍♀️", "宅家休息": "🧘‍♀️", "居家休闲": "🧘‍♀️",
            "户外出行": "🚴‍♀️", "郊游": "🚴‍♀️", "野餐": "🚴‍♀️", "轻徒步": "🚴‍♀️",
            "轻社交": "📸", "闺蜜聚会": "📸", "轻约会": "📸", "拍照打卡": "📸",
            "旅行出行": "✈️", "差旅出行": "✈️",
            "都市通勤丽人": "👩‍💼", "精致生活女生": "👩‍🎓", "运动休闲爱好者": "🏃‍♀️",
            "建议维度": "💡", "挑选建议": "👗", "尺码挑选": "👗",
            "洗护建议": "⚖️", "洗护指南": "⚖️", "洗护说明": "⚖️",
            "穿搭建议": "💡", "搭配建议": "💡",
            "小红书": "📕", "小红书策略": "📕",
            "抖音": "🎬", "抖音策略": "🎬",
            "得物": "👟",
            "天猫": "🏬", "天猫策略": "🏬", "淘宝": "🏬",
            "微信视频号": "📺", "微信视频号策略": "📺",
        }
        for k, v in emoji_map.items():
            if k in text:
                return v
        return "✨"

    def patch_gallery(self, section, patch_content_or_file):
        """
        在 parts/ 对应文件中，局部物理替换指定小节的 HTML 块。
        支持的安全边界: <!-- PDH_SECTION_START:XX --> 与 <!-- PDH_SECTION_END:XX -->
        """
        if os.path.exists(patch_content_or_file):
            with open(patch_content_or_file, 'r', encoding='utf-8') as f:
                patch_content = f.read().strip()
        else:
            patch_content = patch_content_or_file.strip()

        # 映射小节到对应的 part 文件名
        SECTION_TO_PART = {
            '5.1 颜色展示': 'part_03_product_gallery.md',
            '5.2 棚拍展示': 'part_03_product_gallery.md',
            '5.3 外景展示': 'part_03_product_gallery.md',
            '5.4 搭配方案展示': 'part_03_product_gallery.md',
            '8.1 面料与品牌资质': 'part_05_qualification_size_index.md'
        }

        if section not in SECTION_TO_PART:
            print(f"[!] 不支持局部 Patch 的小节名称: {section}")
            return False

        part_name = SECTION_TO_PART[section]
        parts_dir = os.path.join(self.scratch_dir, 'parts')
        part_path = os.path.join(parts_dir, part_name)

        if not os.path.exists(part_path):
            print(f"[!] 目标部件文件不存在，无法 Patch: {part_path}")
            return False

        with open(part_path, 'r', encoding='utf-8') as f:
            part_content = f.read()

        # 检查边界是否存在
        start_marker = f"<!-- PDH_SECTION_START:{section} -->"
        end_marker = f"<!-- PDH_SECTION_END:{section} -->"

        if start_marker not in part_content or end_marker not in part_content:
            print(f"[!] 在 {part_name} 中找不到安全边界注释 '{start_marker}' 或 '{end_marker}'")
            return False

        # 正则替换或字符串切片替换，基于 index 极度精准！
        try:
            start_idx = part_content.index(start_marker) + len(start_marker)
            end_idx = part_content.index(end_marker)
        except ValueError as e:
            print(f"[!] 提取安全边界索引失败: {e}")
            return False

        if start_idx > end_idx:
            print(f"[!] 错误: 起始边界在结束边界之后。")
            return False

        # 拼接替换后的新内容
        new_part_content = part_content[:start_idx] + "\n" + patch_content + "\n" + part_content[end_idx:]

        # 校验新内容的 HTML 标签平衡性
        print(f"[*] 正在对 Patch 后的新部件文件 {part_name} 进行 HTML 标签平衡性检查...")
        if not self._check_html_tag_balance_bool(new_part_content):
            print(f"[!] [安全阻断] 检测到 HTML 标签失衡/撕裂！Patch 被强行终止。")
            return False
        print(f"[OK] 标签平衡性检查通过。")

        # 触发物理备份
        backups_dir = os.path.join(self.scratch_dir, 'backups')
        os.makedirs(backups_dir, exist_ok=True)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_name = f"{os.path.splitext(part_name)[0]}.before_patch_{timestamp}.md"
        backup_path = os.path.join(backups_dir, backup_name)

        try:
            with open(backup_path, 'w', encoding='utf-8', newline='\n') as f:
                f.write(part_content)
            print(f"[+] [Backup] 物理备份成功: {backup_path}")
        except Exception as e:
            print(f"[!] 备份失败，终止 Patch: {e}")
            return False

        # 写入新内容
        try:
            with open(part_path, 'w', encoding='utf-8', newline='\n') as f:
                f.write(new_part_content)
            print(f"[+] [Patch] 局部 Patch 替换成功！已更新 {part_path} 的 [{section}] 板块。")
            self._log_manual_edit(section, part_name, "patch-gallery", "物理局部 HTML 补丁注入")
        except Exception as e:
            print(f"[!] 写入部件文件失败，触发自动秒级回滚...")
            # 回滚物理文件
            with open(part_path, 'w', encoding='utf-8', newline='\n') as f:
                f.write(part_content)
            print(f"[+] [Rollback] 物理回滚成功，原文件已还原。")
            return False

        return True

    def image_snippet(self, image_plan_path, limit_section=None):
        if not os.path.exists(image_plan_path):
            print(f"[!] image_selection_plan.json 不存在: {image_plan_path}")
            return
        try:
            plan = self._load_image_plan(image_plan_path)
        except Exception as e:
            print(f"[!] 加载 image_selection_plan.json 失败: {e}")
            return

        launch_scope = {"detected": False}
        try:
            launch_scope = self.load_launch_scope_from_excel()
        except Exception as e:
            print(f"[WARN] 预加载上新白名单发生错误: {e}")

        cs_dir = os.path.join(self.scratch_dir, 'contact_sheets')
        index_json_path = os.path.join(cs_dir, 'contact_sheet_index.json')
        id_to_item = {}
        if os.path.exists(index_json_path):
            with open(index_json_path, 'r', encoding='utf-8') as f:
                cs_idx = json.load(f)
                id_to_item = {item['id']: item for item in cs_idx}

        snippets_dir = os.path.join(self.scratch_dir, 'snippets')
        os.makedirs(snippets_dir, exist_ok=True)

        gallery_lines = ['## 五、产品展示与搭配库', '']
        fabric_lines = []
        audit_lines = [
            '| id | section | thumbnail | relative_path | visual_type | system_flags | AI确认字段 | review_decision | observed_object | item_type | display_name | visual_judgement | 渲染结果 | 拒绝原因 |',
            '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|'
        ]

        def _log_audit(item_id, section, path, vtype, flags, ai_fields, result, reason,
                        review_decision='', observed_object='', item_type='', display_name='', visual_judgement=''):
            vj_short = visual_judgement[:30] + '...' if len(visual_judgement) > 30 else visual_judgement
            obs_short = observed_object[:25] + '...' if len(observed_object) > 25 else observed_object
            # thumbnail: compute path relative to snippets_dir for local audit preview
            thumb = ''
            if path and path != 'N/A':
                try:
                    abs_img = os.path.join(self.target_dir, path)
                    rel_thumb = os.path.relpath(abs_img, snippets_dir).replace('\\', '/')
                    thumb = f'<img src="{rel_thumb}" style="max-width:80px;max-height:60px;">'
                except ValueError:
                    thumb = f'<img src="{path}" style="max-width:80px;max-height:60px;">'
            audit_lines.append(f'| {item_id} | {section} | {thumb} | {path} | {vtype} | {flags} | {ai_fields} | {review_decision} | {obs_short} | {item_type} | {display_name} | {vj_short} | {result} | {reason} |')

        def _materialize_ai_generated_path(item, path):
            path_norm = str(path or '').replace('\\', '/')
            if item.get('asset_origin') != 'ai_generated' and not path_norm.startswith('.scratch/ai_generated_outfits/'):
                return path
            # P0级图片合流安全门：严禁将带有 Mock 标记的临时资产拷贝为正式交付资产，强制阻断 assemble
            if '_MOCK' in path_norm:
                raise ValueError(f"[P0图片泄漏拦截] 发现非法的 Mock 临时资产被送入物理分发合流中: '{path_norm}'。请在运行 assemble 编译手册前，必须完成 Stage 2 搭配生图以生成真实的图片，将其彻底替换！")
            src_abs = os.path.join(self.target_dir, path_norm)
            if not os.path.exists(src_abs):
                return path
            ext = os.path.splitext(path_norm)[1].lower() or '.png'
            item_id = item.get('id') or os.path.splitext(os.path.basename(path_norm))[0]
            stable_rel = os.path.join('自动生成素材', 'AI搭配图', f'{item_id}{ext}').replace('\\', '/')
            stable_abs = os.path.join(self.target_dir, stable_rel)
            os.makedirs(os.path.dirname(stable_abs), exist_ok=True)
            shutil.copy2(src_abs, stable_abs)
            return stable_rel

        def _get_src_and_check(item, section_name, req_fields, deny_flags=None, require_original_review=False):
            item_id = item.get('id')
            ai_fields_str = ', '.join([f"{k}={v}" for k,v in item.items() if k.startswith('confirmed_')])
            vj = item.get('visual_judgement', '')
            vtype = item.get('visual_type', '')

            if not item_id:
                _log_audit('N/A', section_name, 'N/A', vtype, '', ai_fields_str, '拒绝', '缺少 id 字段')
                return None

            cs_item = id_to_item.get(item_id)
            if not cs_item:
                _log_audit(item_id, section_name, 'N/A', vtype, '', ai_fields_str, '拒绝', '无效的 id，不在 contact_sheet 中')
                return None

            path = cs_item['relative_path']
            flags_str = ','.join(cs_item.get('system_flags', []))

            # 原图复核检查
            if require_original_review:
                VAGUE_SNIPPETS = ('已确认', '符合要求', '已打开原图', '已打开原图确认', '确认无误', '通过', '已复核')
                if not item.get('confirmed_by_original_image'):
                    _log_audit(item_id, section_name, path, vtype, flags_str, ai_fields_str, '拒绝', '缺少 confirmed_by_original_image=true（必须打开原图复核）')
                    return None
                rb = item.get('review_basis')
                if rb != 'original_image':
                    _log_audit(item_id, section_name, path, vtype, flags_str, ai_fields_str, '拒绝', f'review_basis 应为 original_image，实际为 {rb}')
                    return None
                op = item.get('original_path')
                if not op:
                    _log_audit(item_id, section_name, path, vtype, flags_str, ai_fields_str, '拒绝', '缺少 original_path')
                    return None
                if op != path:
                    print(f"[WARN] 物理硬纠偏机制激活: ID {item_id} 在 {section_name} 的 original_path('{op}') 与 contact_sheet 实际路径 '{path}' 不一致，已自动硬纠偏强制覆盖为正确物理路径。")
                    _log_audit(item_id, section_name, path, vtype, flags_str, ai_fields_str, '警告/自动纠正', f'original_path("{op}") 与 contact_sheet 实际路径 "{path}" 不一致，触发硬纠正')
                if not vj:
                    _log_audit(item_id, section_name, path, vtype, flags_str, ai_fields_str, '拒绝', '缺少 visual_judgement（必须描述原图复核结论）')
                    return None
                cn_chars = len([c for c in vj if '\u4e00' <= c <= '\u9fff'])
                if cn_chars < 12:
                    _log_audit(item_id, section_name, path, vtype, flags_str, ai_fields_str, '拒绝', f'visual_judgement 过短（中文{cn_chars}字，需≥12）')
                    return None
                if vj.strip() in VAGUE_SNIPPETS:
                    _log_audit(item_id, section_name, path, vtype, flags_str, ai_fields_str, '拒绝', f'visual_judgement 不允许使用空泛短句: {vj.strip()}')
                    return None

            missing = [r for r in req_fields if not item.get(r)]
            if missing:
                _log_audit(item_id, section_name, path, vtype, flags_str, ai_fields_str, '拒绝', f'缺少必要确认字段 {missing}')
                return None

            if deny_flags:
                has_deny = [f for f in deny_flags if f in cs_item.get('system_flags', [])]
                if has_deny:
                    _log_audit(item_id, section_name, path, vtype, flags_str, ai_fields_str, '拒绝', f'包含被拒绝的系统标记 {has_deny}')
                    return None

            path = _materialize_ai_generated_path(item, path)
            _log_audit(item_id, section_name, path, vtype, flags_str, ai_fields_str, '通过', '',
                        review_decision=item.get('review_decision', ''),
                        observed_object=item.get('observed_object', ''),
                        item_type=item.get('item_type', ''),
                        display_name=item.get('display_name', item.get('title', '')),
                        visual_judgement=vj)
            return path

        # ========= pdh-* HTML helpers =========
        import html as _html_mod

        def _safe_text(s):
            return _html_mod.escape(str(s or ''), quote=True)

        def _cols(n, max_cols):
            if n <= 1: return 1
            if n == 2: return 2
            if n == 3: return 3
            return max_cols

        def _img_tag(item_id, src, alt=''):
            return (
                f'<img data-pid="{_safe_text(item_id)}" '
                f'src="{_safe_text(src)}" '
                f'alt="{_safe_text(alt)}" '
                f'style="width: 100%; height: 100%; object-fit: contain; display: block;">'
            )

        def _image_box(img_html, height, aspect_ratio=None):
            if aspect_ratio:
                if aspect_ratio in ('3 / 4', '3/4'):
                    ar_class = ' pdh-ar-3-4'
                elif aspect_ratio in ('4 / 3', '4/3'):
                    ar_class = ' pdh-ar-4-3'
                else:
                    ar_class = ''
                return (
                    f'<div class="pdh-image-box{ar_class}" '
                    f'style="width: 100%; aspect-ratio: {aspect_ratio}; background: #F7F7F7; '
                    f'display: flex; align-items: center; justify-content: center; overflow: hidden;">'
                    f'{img_html}'
                    f'</div>'
                )

            return (
                f'<div class="pdh-image-box" '
                f'style="height: {height}; background: #F7F7F7; display: flex; '
                f'align-items: center; justify-content: center; overflow: hidden;">'
                f'{img_html}'
                f'</div>'
            )

        def _card(img_html, title='', card_class='pdh-card', box_height='280px',
                  show_caption=True, caption_font_size='13px', aspect_ratio=None):
            parts = []
            parts.append(
                f'<div class="{card_class}" '
                f'style="border-radius: 10px; overflow: hidden; '
                f'box-shadow: 0 2px 8px rgba(0,0,0,0.10); background: #fff; '
                f'border: 1px solid #EFEFEF; break-inside: avoid; page-break-inside: avoid;">'
            )
            parts.append(_image_box(img_html, box_height, aspect_ratio=aspect_ratio))
            if show_caption and title:
                parts.append(
                    f'<div class="pdh-caption" '
                    f'style="padding: 9px 10px; text-align: center; font-size: {caption_font_size}; '
                    f'color: #333; line-height: 1.4; border-top: 1px solid #EFEFEF;">'
                    f'{_safe_text(title)}</div>'
                )
            parts.append('</div>')
            return '\n'.join(parts)

        def _gallery_aspect_ratio(item, cs_item=None, section_name=''):
            # 服装棚拍/外景默认竖版人像逻辑
            if section_name in ('5.2 棚拍展示', '5.3 外景展示'):
                # 只有明确横向宽图才用 4:3
                flags = set((cs_item or {}).get('system_flags', []))
                ar = (cs_item or {}).get('aspect_ratio')
                if 'wide_image' in flags:
                    return '4 / 3'
                try:
                    if ar and float(ar) >= 1.2:
                        return '4 / 3'
                except Exception:
                    pass
                return '3 / 4'
            return None

        def _grid_start(grid_class, cols, gap='14px', margin='14px 0 18px 0'):
            return (
                f'<div class="pdh-grid {grid_class}" '
                f'style="display: grid; grid-template-columns: repeat({cols}, minmax(0, 1fr)); '
                f'gap: {gap}; margin: {margin};">'
            )

        def _clean_accessory_note(s):
            s = str(s or '').strip()
            import re as _re
            s = _re.sub(r'<[^>]+>', '', s).strip()
            pat = r'^(?:✨|🌟|\*|#)?\s*(?:配饰亮点|搭配亮点|亮点说明|配饰说明)\s*[:：]\s*'
            changed = True
            while changed:
                old_s = s
                s = _re.sub(pat, '', s, flags=_re.I).strip()
                s = _re.sub(r'^✨\s*', '', s).strip()
                changed = (s != old_s)
            return s

        HARD_DENY_FLAGS = {'from_1x1_folder', 'temp_or_unstable_path'}
        RISK_FLAGS = {'possible_collage', 'square_like', 'wide_image'}
        OVERRIDE_KEYWORDS = ('不是拼接', '非拼接', '单张独立', '没有拼接', '没有多角度', '无拼接', '没有重复主体', '没有分割线', '无网格')

        def _check_snippet_risk_override(item, cs_item, section_name):
            """Check if a risk-flagged item has valid override. Returns (allow, reason)."""
            sys_flags = set(cs_item.get('system_flags', []))
            hard = sys_flags & HARD_DENY_FLAGS
            if hard:
                return False, f'硬禁止标记 {hard}'
            risk = sys_flags & RISK_FLAGS
            if not risk:
                return True, ''
            # Has risk flags — check override
            override_reason = item.get('override_system_flag_reason', '')
            confirmed_single = item.get('confirmed_single_subject_single_angle')
            vj = item.get('visual_judgement', '')
            if not override_reason:
                return False, f'风险标记 {risk}，缺少 override_system_flag_reason'
            if not confirmed_single:
                return False, f'风险标记 {risk}，缺少 confirmed_single_subject_single_angle=true'
            has_kw = any(kw in vj for kw in OVERRIDE_KEYWORDS)
            if not has_kw:
                return False, f'风险标记 {risk}，visual_judgement 未包含非拼接关键词'
            return True, ''

        # --- 5.1 颜色展示 ---
        sp51_raw = plan.get('5.1 颜色展示', [])
        # 兼容新格式 (dict with items) 和旧格式 (plain list)
        if isinstance(sp51_raw, dict):
            items_51 = sp51_raw.get('items', [])
        else:
            items_51 = sp51_raw if isinstance(sp51_raw, list) else []
        sec_51_lines = ['### 5.1 颜色展示\n']
        valid_items = []
        for item in items_51:
            src = _get_src_and_check(item, '5.1 颜色展示',
                ['confirmed_no_model', 'confirmed_product_still_or_color_card'],
                require_original_review=True)
            if src:
                title = item.get('title', '') or item.get('display_name', '') or '颜色图'
                valid_items.append({'src': src, 'id': item.get('id'), 'title': title})

        if valid_items:
            sec_51_lines.append('<!-- PDH_SECTION_START:5.1 颜色展示 -->')
            cols = _cols(len(valid_items), 4)
            sec_51_lines.append('<div class="pdh-gallery-section pdh-section-51" style="margin: 18px 0 26px 0;">')
            sec_51_lines.append(_grid_start('pdh-color-grid', cols))
            for vi in valid_items:
                img = _img_tag(vi['id'], vi['src'], vi['title'])
                sec_51_lines.append(_card(img, vi['title'], card_class='pdh-card pdh-color-card', box_height='280px'))
            sec_51_lines.append('</div>')
            sec_51_lines.append('</div>')
            sec_51_lines.append('<!-- PDH_SECTION_END:5.1 颜色展示 -->')
        else:
            sec_51_lines.append('<!-- PDH_SECTION_START:5.1 颜色展示 -->')
            cand_path = os.path.join(self.scratch_dir, 'image_candidates.json')
            cand_51_count = 0
            if os.path.exists(cand_path):
                with open(cand_path, 'r', encoding='utf-8') as f:
                    cands = json.load(f)
                cand_51_count = len(cands.get('5.1 颜色展示', {}).get('candidate_ids', []))
            if cand_51_count > 0:
                sec_51_lines.append(f'> ⚠️ **风险**：缺少对应图片引用：5.1 产品静物/色卡图候选池有 {cand_51_count} 张候选，但 image_selection_plan 中 5.1 为空或全部被拒绝。请检查 image_selection_plan.json。')
                _log_audit('N/A', '5.1 颜色展示', 'N/A', '', '', '', '风险', f'候选池有 {cand_51_count} 张但 valid_items=0')
            else:
                sec_51_lines.append('> ⚠️ 静物图待补充')
            sec_51_lines.append('<!-- PDH_SECTION_END:5.1 颜色展示 -->')
        gallery_lines.append('')

        # --- 5.2 棚拍展示 ---
        studio_plan = plan.get('5.2 棚拍展示', [])
        items_52 = studio_plan.get('items', []) if isinstance(studio_plan, dict) else studio_plan
        sec_52_lines = ['### 5.2 棚拍展示\n']
        valid_items = []
        reqs_52 = ['confirmed_single_photo', 'confirmed_no_collage', 'confirmed_studio', 'confirmed_model_wearing_product']
        for item in items_52:
            item_id = item.get('id')
            cs_item = id_to_item.get(item_id, {})
            # Hard deny only from_1x1_folder / temp_or_unstable_path
            hard_deny = [f for f in HARD_DENY_FLAGS if f in cs_item.get('system_flags', [])]
            if hard_deny:
                flags_str = ','.join(cs_item.get('system_flags', []))
                ai_fields_str = ', '.join([f"{k}={v}" for k,v in item.items() if k.startswith('confirmed_')])
                _log_audit(item_id, '5.2 棚拍展示', cs_item.get('relative_path', 'N/A'), '', flags_str, ai_fields_str, '拒绝', f'硬禁止标记 {hard_deny}')
                continue
            src = _get_src_and_check(item, '5.2 棚拍展示', reqs_52, deny_flags=None, require_original_review=True)
            if not src:
                continue
            # Check risk flags with override
            allow, reason = _check_snippet_risk_override(item, cs_item, '5.2 棚拍展示')
            if not allow:
                flags_str = ','.join(cs_item.get('system_flags', []))
                _log_audit(item_id, '5.2 棚拍展示', src, '', flags_str, '', '拒绝', reason)
                continue
            title = item.get('title', '棚拍展示')
            valid_items.append({'src': src, 'id': item_id, 'title': title})

        # 5.2 excluded_candidates audit
        if isinstance(studio_plan, dict):
            for ex in studio_plan.get('excluded_candidates', []):
                ex_id = ex.get('id', 'N/A')
                cs_ex = id_to_item.get(ex_id)
                ex_path = ex.get('original_path', cs_ex['relative_path'] if cs_ex else 'N/A')
                ex_flags = ','.join(cs_ex.get('system_flags', [])) if cs_ex else ''
                _log_audit(ex_id, '5.2 棚拍展示', ex_path, '', ex_flags, '', '排除', ex.get('exclude_reason', ''),
                            review_decision='excluded', visual_judgement=ex.get('visual_judgement', ''))

        if valid_items:
            cols = _cols(len(valid_items), 3)
            sec_52_lines.append('<!-- PDH_SECTION_START:5.2 棚拍展示 -->')
            sec_52_lines.append('<div class="pdh-gallery-section pdh-section-52" style="margin: 18px 0 26px 0;">')
            sec_52_lines.append(_grid_start('pdh-studio-grid', cols))
            for vi in valid_items:
                img = _img_tag(vi['id'], vi['src'], vi['title'])
                item_data = next((x for x in items_52 if x.get('id') == vi['id']), {})
                cs_item = id_to_item.get(vi['id'], {})
                ar = _gallery_aspect_ratio(item_data, cs_item, '5.2 棚拍展示')
                sec_52_lines.append(_card(img, card_class='pdh-card pdh-studio-card', box_height='360px', show_caption=False, aspect_ratio=ar))
            sec_52_lines.append('</div>')
            sec_52_lines.append('</div>')
            sec_52_lines.append('<!-- PDH_SECTION_END:5.2 棚拍展示 -->')
        else:
            sec_52_lines.append('<!-- PDH_SECTION_START:5.2 棚拍展示 -->')
            sec_52_lines.append('> ⚠️ 棚拍图待补充')
            sec_52_lines.append('<!-- PDH_SECTION_END:5.2 棚拍展示 -->')

        # --- 5.3 外景展示 ---
        scenes = plan.get('5.3 外景展示', {})
        sec_53_lines = ['### 5.3 外景展示\n']
        reqs_53 = ['confirmed_single_photo', 'confirmed_no_collage', 'confirmed_outdoor', 'confirmed_model_wearing_product']

        def _render_53_items(scene_items, scene_label):
            valid = []
            for item in scene_items:
                item_id = item.get('id')
                cs_item = id_to_item.get(item_id, {})
                hard_deny = [f for f in HARD_DENY_FLAGS if f in cs_item.get('system_flags', [])]
                if hard_deny:
                    flags_str = ','.join(cs_item.get('system_flags', []))
                    ai_str = ', '.join([f"{k}={v}" for k,v in item.items() if k.startswith('confirmed_')])
                    _log_audit(item_id, scene_label, cs_item.get('relative_path', 'N/A'), '', flags_str, ai_str, '拒绝', f'硬禁止标记 {hard_deny}')
                    continue
                src = _get_src_and_check(item, scene_label, reqs_53, deny_flags=None, require_original_review=True)
                if not src:
                    continue
                allow, reason = _check_snippet_risk_override(item, cs_item, scene_label)
                if not allow:
                    flags_str = ','.join(cs_item.get('system_flags', []))
                    _log_audit(item_id, scene_label, src, '', flags_str, '', '拒绝', reason)
                    continue
                title = item.get('title', '外景展示')
                valid.append({'src': src, 'id': item_id, 'title': title})
            return valid

        has_rendered_any_53 = False
        if isinstance(scenes, dict) and scenes:
            temp_lines = []
            for scene_name, scene_val in scenes.items():
                scene_items = scene_val.get('items', []) if isinstance(scene_val, dict) else scene_val
                valid_items = _render_53_items(scene_items, f'5.3 外景展示/{scene_name}')
                # excluded audit
                if isinstance(scene_val, dict):
                    for ex in scene_val.get('excluded_candidates', []):
                        ex_id = ex.get('id', 'N/A')
                        cs_ex = id_to_item.get(ex_id)
                        ex_path = ex.get('original_path', cs_ex['relative_path'] if cs_ex else 'N/A')
                        ex_flags = ','.join(cs_ex.get('system_flags', [])) if cs_ex else ''
                        _log_audit(ex_id, f'5.3 外景展示/{scene_name}', ex_path, '', ex_flags, '', '排除', ex.get('exclude_reason', ''),
                                    review_decision='excluded', visual_judgement=ex.get('visual_judgement', ''))
                if valid_items:
                    has_rendered_any_53 = True
                    cols = _cols(len(valid_items), 3)
                    temp_lines.append(f'<h4 style="margin: 20px 0 16px 0; font-size: 16px; font-weight: 600; color: #1D1D1F;">{_safe_text(scene_name)}</h4>')
                    temp_lines.append(f'<div class="pdh-scene-block" style="margin: 0 0 24px 0;">')
                    temp_lines.append(_grid_start('pdh-scene-grid', cols, margin='12px 0 18px 0'))
                    for vi in valid_items:
                        img = _img_tag(vi['id'], vi['src'], vi.get('title') or scene_name)
                        item_data = next((x for x in scene_items if x.get('id') == vi['id']), {})
                        cs_item = id_to_item.get(vi['id'], {})
                        ar = _gallery_aspect_ratio(item_data, cs_item, '5.3 外景展示')
                        temp_lines.append(_card(img, card_class='pdh-card pdh-scene-card', box_height='340px', show_caption=False, aspect_ratio=ar))
                    temp_lines.append('</div>')
                    temp_lines.append('</div>')
            if has_rendered_any_53:
                sec_53_lines.append('<!-- PDH_SECTION_START:5.3 外景展示 -->')
                sec_53_lines.append('<div class="pdh-gallery-section pdh-section-53" style="margin: 18px 0 26px 0;">')
                sec_53_lines.extend(temp_lines)
                sec_53_lines.append('</div>')
                sec_53_lines.append('<!-- PDH_SECTION_END:5.3 外景展示 -->')

        elif isinstance(scenes, list) and scenes:
            valid_items = _render_53_items(scenes, '5.3 外景展示')
            if valid_items:
                has_rendered_any_53 = True
                cols = _cols(len(valid_items), 3)
                sec_53_lines.append('<!-- PDH_SECTION_START:5.3 外景展示 -->')
                sec_53_lines.append('<div class="pdh-gallery-section pdh-section-53" style="margin: 18px 0 26px 0;">')
                sec_53_lines.append(f'<div class="pdh-scene-block" style="margin: 18px 0 24px 0;">')
                sec_53_lines.append(_grid_start('pdh-scene-grid', cols, margin='12px 0 18px 0'))
                for vi in valid_items:
                    img = _img_tag(vi['id'], vi['src'], vi.get('title') or '外景展示')
                    item_data = next((x for x in scenes if x.get('id') == vi['id']), {})
                    cs_item = id_to_item.get(vi['id'], {})
                    ar = _gallery_aspect_ratio(item_data, cs_item, '5.3 外景展示')
                    sec_53_lines.append(_card(img, card_class='pdh-card pdh-scene-card', box_height='340px', show_caption=False, aspect_ratio=ar))
                sec_53_lines.append('</div>')
                sec_53_lines.append('</div>')
                sec_53_lines.append('</div>')
                sec_53_lines.append('<!-- PDH_SECTION_END:5.3 外景展示 -->')

        if not has_rendered_any_53:
            sec_53_lines.append('<!-- PDH_SECTION_START:5.3 外景展示 -->')
            sec_53_lines.append('> ⚠️ 外景图待补充')
            sec_53_lines.append('<!-- PDH_SECTION_END:5.3 外景展示 -->')

        # --- 5.4 搭配方案展示 ---
        outfits = plan.get('5.4 搭配方案展示', [])
        sec_54_lines = ['### 5.4 搭配方案展示\n']
        OUTFIT_COLORS = ['#34C759', '#007AFF', '#FF8C00', '#9B59B6', '#FF3B30']

        if outfits:
            # 自动从 outfit_strategy_brief.json 回填缺漏的企划分析属性，确保表格不留白 (Auto-Backfill)
            import json as _json
            brief_data = {}
            brief_json_path = os.path.join(self.scratch_dir, 'outfit_strategy_brief.json')
            if os.path.exists(brief_json_path):
                try:
                    with open(brief_json_path, 'r', encoding='utf-8') as bf:
                        brief_data = _json.load(bf)
                except Exception as e:
                    print(f"[WARN] 自动回填企划属性时读取 outfit_strategy_brief.json 失败: {e}")

            sec_54_lines.append('<!-- PDH_SECTION_START:5.4 搭配方案展示 -->')
            sec_54_lines.append('<div class="pdh-gallery-section pdh-section-54" style="margin: 18px 0 26px 0;">')

            for oi, outfit in enumerate(outfits):
                # 自动从 brief 回填缺损属性
                if brief_data and (not outfit.get('scene_type') or not outfit.get('styling_logic')):
                    look_id = outfit.get('candidate_group') or f"look_{oi+1:02d}"
                    matched_of = None
                    for b_of in brief_data.get('outfits', []):
                        if b_of.get('look_id') == look_id or b_of.get('look_name') == outfit.get('name'):
                            matched_of = b_of
                            break
                    if matched_of:
                        for key in ('scene_type', 'styling_logic', 'target_audience', 'recommended_items_desc', 'platform_content_angle_desc'):
                            if not outfit.get(key) and matched_of.get(key):
                                outfit[key] = matched_of[key]
                        # 转换 platform_content_angle
                        if not outfit.get('platform_content_angle_desc') and matched_of.get('platform_content_angle'):
                            p_angle = matched_of['platform_content_angle']
                            outfit['platform_content_angle_desc'] = f"XIAOHONGSHU: {p_angle.get('xiaohongshu', '')} | DOUYIN: {p_angle.get('douyin', '')} | TMALL: {p_angle.get('tmall', '')} | WECHAT_VIDEO: {p_angle.get('wechat_video', '') or p_angle.get('wechat', '')}"

                color = outfit.get('style_color', OUTFIT_COLORS[oi % len(OUTFIT_COLORS)])
                tag = outfit.get('style_tag', f'搭配 {oi+1}')
                name = outfit.get('name', f'搭配{oi+1}')
                desc = outfit.get('description', '')
                acc_note = _clean_accessory_note(outfit.get('accessory_note', ''))

                sec_54_lines.append(f'<h4 style="margin: 20px 0 16px 0; font-size: 16px; font-weight: 600; color: #1D1D1F;">{_safe_text(name)}</h4>')
                sec_54_lines.append(
                    f'<div class="pdh-outfit-block" style="margin: 0 0 32px 0; padding: 16px; '
                    f'border-radius: 14px; background: #FAFAFA; border: 1px solid #ECECEC;">'
                )

                # Hidden metadata spans for assembly parsing (v2.4.2)
                eff = outfit.get('effect_image')
                scene_type = outfit.get('scene_type', '')
                selected_product_color = outfit.get('selected_product_color', '')
                if selected_product_color and launch_scope.get("detected", False):
                    allowed_color_aliases = launch_scope.get("allowed_color_aliases", {})
                    for mc, aliases in allowed_color_aliases.items():
                        if selected_product_color in aliases:
                            if f"{selected_product_color}(下单色:" not in selected_product_color:
                                selected_product_color = f"{selected_product_color}(下单色:{mc})"
                            break
                recommended_items_desc = outfit.get('recommended_items_desc', '')
                styling_logic = outfit.get('styling_logic', '')
                target_audience = outfit.get('target_audience', '')
                platform_content_angle_desc = outfit.get('platform_content_angle_desc', '')
                gen_prompt = eff.get('generation_prompt', '') if eff else ''

                sec_54_lines.append(f'<span class="pdh-meta-scene-type" style="display:none;">{_safe_text(scene_type)}</span>')
                sec_54_lines.append(f'<span class="pdh-meta-selected-product-color" style="display:none;">{_safe_text(selected_product_color)}</span>')
                sec_54_lines.append(f'<span class="pdh-meta-recommended-items-desc" style="display:none;">{_safe_text(recommended_items_desc)}</span>')
                sec_54_lines.append(f'<span class="pdh-meta-styling-logic" style="display:none;">{_safe_text(styling_logic)}</span>')
                sec_54_lines.append(f'<span class="pdh-meta-target-audience" style="display:none;">{_safe_text(target_audience)}</span>')
                sec_54_lines.append(f'<span class="pdh-meta-platform-content-angle-desc" style="display:none;">{_safe_text(platform_content_angle_desc)}</span>')
                sec_54_lines.append(f'<span class="pdh-meta-generation-prompt" style="display:none;">{_safe_text(gen_prompt)}</span>')

                # 说明卡片
                sec_54_lines.append(
                    f'<div class="pdh-outfit-note" style="background: #F8F9FA; border-left: 4px solid {color}; '
                    f'padding: 14px 16px; margin: 10px 0 16px 0; border-radius: 0 10px 10px 0; '
                    f'break-inside: avoid; page-break-inside: avoid;">'
                )
                sec_54_lines.append(f'<strong style="color: {color}; font-size: 15px;">{_safe_text(tag)}</strong>')
                if desc:
                    sec_54_lines.append(f'<p style="margin: 8px 0; color: #1D1D1F; font-size: 13px; line-height: 1.7;">{_safe_text(desc)}</p>')
                else:
                    sec_54_lines.append('<p style="margin: 8px 0; color: #1D1D1F; font-size: 13px; line-height: 1.7;">搭配说明待补充</p>')
                if acc_note:
                    sec_54_lines.append(
                        f'<p style="margin: 8px 0 0 0; color: #666; font-size: 13px; line-height: 1.7;">'
                        f'<strong>配饰亮点：</strong>{_safe_text(acc_note)}</p>'
                    )
                sec_54_lines.append('</div>')

                # Start layout
                sec_54_lines.append('<div class="pdh-outfit-layout" style="display: flex; flex-direction: column; gap: 20px; margin: 16px 0;">')

                # Left column auditing and rendering for outfit effect image.
                valid_eff = None
                eff = outfit.get('effect_image')
                if eff:
                    eff_id = eff.get('id', 'N/A')
                    eff_cs = id_to_item.get(eff_id, {})
                    eff_flags_list = eff_cs.get('system_flags', [])
                    eff_flags_str = ','.join(eff_flags_list)
                    eff_path = eff.get('original_path', eff_cs.get('relative_path', 'N/A'))
                    eff_vtype = eff.get('visual_type', '')

                    hard_deny_eff = [f for f in HARD_DENY_FLAGS if f in eff_flags_list]
                    if hard_deny_eff:
                        _log_audit(eff_id, f'5.4 搭配效果图/{name}', eff_path, eff_vtype, eff_flags_str, '', '拒绝', f'硬禁止标记 {hard_deny_eff}')
                    else:
                        src = _get_src_and_check(eff, '5.4 搭配效果图', ['confirmed_outfit_effect'], require_original_review=True)
                        if src:
                            valid_eff = {
                                'src': src,
                                'id': eff_id,
                                'title': eff.get('title') or name or '搭配效果图'
                            }
                        _log_audit(eff_id, f'5.4 搭配效果图/{name}', eff_path, eff_vtype, eff_flags_str, '', '通过', '',
                                    review_decision='selected', visual_judgement=eff.get('visual_judgement', ''))

                # Right column items list (flex cards, excluding main product)
                mat_items = outfit.get('items', [])
                valid_mats = []
                seen_mat_names = {}
                _SNIPPET_ANGLE_SUFFIXES = (
                    '正面', '侧面', '背面', '后跟', '后视', '细节', '特写',
                    '局部', '佩戴图', '上脚图', '单品图', '俯视', '仰视',
                    '全身', '半身', '近景', '远景', '内侧', '外侧',
                )
                def _snippet_canonical_dn(raw):
                    import re as _re
                    s = (raw or '').strip().lower()
                    s = _re.sub(r'[（(][^）)]*[）)]', lambda m: '' if any(a in m.group() for a in _SNIPPET_ANGLE_SUFFIXES) else m.group(), s)
                    for a in _SNIPPET_ANGLE_SUFFIXES:
                        if s.endswith(a):
                            s = s[:-len(a)]
                    s = s.rstrip(' -·/、_')
                    return s.strip()

                for item in mat_items:
                    mat_id = item.get('id', 'N/A')
                    mat_cs = id_to_item.get(mat_id, {})
                    mat_sys_flags = mat_cs.get('system_flags', [])
                    hard_deny_mat = [f for f in HARD_DENY_FLAGS if f in mat_sys_flags]
                    if hard_deny_mat:
                        _log_audit(mat_id, '5.4 搭配物料', mat_cs.get('relative_path', 'N/A'), '', ','.join(mat_sys_flags), '', '拒绝', f'硬禁止标记 {hard_deny_mat}')
                        continue
                    src = _get_src_and_check(item, '5.4 搭配物料', ['confirmed_accessory_or_matching_item'], require_original_review=True)
                    if src:
                        itype = item.get('item_type')
                        if not itype:
                            name_for_infer = (item.get('display_name') or item.get('title') or item.get('observed_object') or '').lower()
                            if any(k in name_for_infer for k in ('鞋', '德训', '跑鞋', '单鞋', '靴', 'sneaker')):
                                itype = 'shoes'
                            elif any(k in name_for_infer for k in ('包', '袋', '托特', 'tote', 'backpack')):
                                itype = 'bag'
                            elif any(k in name_for_infer for k in ('镜', '眼镜', '墨镜', 'goggles', 'glasses')):
                                itype = 'glasses'
                            elif any(k in name_for_infer for k in ('帽', '带', '皮带', '腰带', '袜', '方巾', '领巾', '披肩', '胸针', '首饰', '链', '饰')):
                                itype = 'accessory'
                            elif any(k in name_for_infer for k in ('裤', '牛仔', '半身裙')):
                                itype = 'bottom'
                            elif any(k in name_for_infer for k in ('衫', '衣', 't恤', '衬衫', '背心')):
                                itype = 'top'
                            else:
                                itype = 'accessory'
                        dname = item.get('display_name') or item.get('title')
                        observed = item.get('observed_object', '')
                        missing_extra = []
                        if not itype: missing_extra.append('item_type')
                        if not dname: missing_extra.append('display_name/title')
                        if not observed: missing_extra.append('observed_object')
                        if missing_extra:
                            _log_audit(mat_id, '5.4 搭配物料', src, '', '', '', '拒绝', f'缺少 {missing_extra}',
                                        observed_object=observed, item_type=itype or '', display_name=dname or '',
                                        visual_judgement=item.get('visual_judgement', ''))
                        else:
                            cap = dname or itype or '搭配物料'
                            seen_key = _snippet_canonical_dn(dname)
                            if seen_key and seen_key in seen_mat_names:
                                _log_audit(mat_id, '5.4 搭配物料', src, '', '', '', '去重跳过',
                                            f'同一物品重复入选（display_name="{dname}"，首张已选 {seen_mat_names[seen_key]}）',
                                            observed_object=observed, item_type=itype, display_name=dname,
                                            visual_judgement=item.get('visual_judgement', ''))
                            else:
                                _log_audit(mat_id, '5.4 搭配物料', src, '', '', '', '通过', '',
                                            review_decision='selected',
                                            observed_object=observed, item_type=itype, display_name=dname,
                                            visual_judgement=item.get('visual_judgement', ''))
                                valid_mats.append({
                                    'src': src,
                                    'id': mat_id,
                                    'title': cap,
                                    'item_type': itype,
                                    'styling_reason': item.get('styling_reason', '')
                                })
                                if seen_key:
                                    seen_mat_names[seen_key] = mat_id

                # excluded audit
                for ex in outfit.get('excluded_candidates', []):
                    ex_id = ex.get('id', 'N/A')
                    cs_ex = id_to_item.get(ex_id)
                    ex_path = ex.get('original_path', cs_ex['relative_path'] if cs_ex else 'N/A')
                    ex_flags = ','.join(cs_ex.get('system_flags', [])) if cs_ex else ''
                    _log_audit(ex_id, f'5.4 搭配物料/{name}', ex_path, '', ex_flags, '', '排除', ex.get('exclude_reason', ''),
                                review_decision='excluded',
                                observed_object=ex.get('observed_object', ''),
                                item_type=ex.get('item_type', ''),
                                display_name=ex.get('display_name', ''),
                                visual_judgement=ex.get('visual_judgement', ''))

                right_col_html = '<div class="pdh-outfit-right-col" style="width: 100%; display: flex; flex-direction: row; gap: 12px; flex-wrap: wrap; justify-content: flex-start; min-width: 0;">\n'
                if valid_eff:
                    eff_img = _img_tag(valid_eff['id'], valid_eff['src'], valid_eff['title'])
                    right_col_html += (
                        '<div class="pdh-outfit-effect-wrap" style="width: 100%; max-width: 420px; margin: 0 0 8px 0;">\n'
                        + _card(eff_img, valid_eff['title'], card_class='pdh-card pdh-outfit-effect-card', box_height='320px')
                        + '\n</div>\n'
                    )
                if valid_mats:
                    for vi in valid_mats:
                        if vi.get('item_type') == 'main_product' or vi.get('title') == '本品':
                            continue
                        itype_zh = vi.get('item_type', '单品')
                        iname = vi.get('title')
                        ireason = vi.get('styling_reason', '')

                        card_html = (
                            f'<div class="pdh-card pdh-material-card" style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; '
                            f'padding: 12px; border-radius: 10px; background: #FFFFFF; border: 1px solid #EAEAEA; flex: 1; min-width: 140px; max-width: 220px;">\n'
                            f'  <div class="pdh-image-box" style="width: 90px; height: 90px; flex-shrink: 0; '
                            f'border-radius: 6px; overflow: hidden; background: #FFFFFF; border: 1px solid #F0F0F0; display: flex; align-items: center; justify-content: center;">\n'
                            f'    <img data-pid="{vi["id"]}" src="{vi["src"]}" style="width: 100%; height: 100%; object-fit: contain;" alt="{iname}" />\n'
                            f'  </div>\n'
                            f'  <div class="pdh-material-text-container" style="flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; width: 100%;">\n'
                            f'    <span class="pdh-material-row-badge" style="font-size: 11px; font-weight: 600; padding: 2px 6px; '
                            f'border-radius: 4px; background: #F0F0F0; color: #666666; margin-bottom: 6px; display: inline-block;">{itype_zh}</span>\n'
                            f'    <span class="pdh-material-row-title" style="font-size: 13px; font-weight: bold; color: #1D1D1F; display: block; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">{iname}</span>\n'
                            f'    <p class="pdh-material-row-reason" style="margin: 4px 0 0 0; font-size: 11px; color: #86868B; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; width: 100%; text-align: center;">{ireason}</p>\n'
                            f'  </div>\n'
                            f'</div>'
                        )
                        right_col_html += card_html + '\n'
                right_col_html += '</div>'
                sec_54_lines.append(right_col_html)

                # Append copyable AI prompt box at the bottom of the grid
                if gen_prompt:
                    prompt_html = (
                        f'<div class="pdh-outfit-prompt-box" style="background: #F5F5F7; border-radius: 8px; padding: 12px; margin: 8px 0 0 0; border: 1px dashed #D2D2D7; text-align: left; width: 100%;">\n'
                        f'  <strong style="color: #1D1D1F; font-size: 13px; display: block; margin-bottom: 6px;">💡 AI 搭配效果图生图提示词:</strong>\n'
                        f'  <p style="margin: 0; font-size: 12px; color: #515154; line-height: 1.6; user-select: all; cursor: pointer;" title="双击或长按可全选复制">{_safe_text(gen_prompt)}</p>\n'
                        f'</div>\n'
                    )
                    sec_54_lines.append(prompt_html)

                sec_54_lines.append('</div>') # close layout
                sec_54_lines.append('</div>') # close block

            sec_54_lines.append('</div>') # close pdh-section-54
            sec_54_lines.append('<!-- PDH_SECTION_END:5.4 搭配方案展示 -->')
        else:
            sec_54_lines.append('<!-- PDH_SECTION_START:5.4 搭配方案展示 -->')
            sec_54_lines.append('> ⚠️ 搭配方案待补充')
            sec_54_lines.append('<!-- PDH_SECTION_END:5.4 搭配方案展示 -->')
                # --- 8.1 面料与品牌资质 ---
        fabric_plan = plan.get('8.1 面料与品牌资质', [])
        fabrics = fabric_plan.get('items', []) if isinstance(fabric_plan, dict) else fabric_plan
        sec_81_lines = []
        valid_items = []
        VALID_81_VTYPES = ('fabric_swatch', 'texture_closeup', 'composition_label', 'pdf_thumbnail', 'craft_detail_closeup', 'certificate')
        for item in fabrics:
            extra_reqs = ['confirmed_fabric_or_report']
            if item.get('visual_type') == 'craft_detail_closeup':
                extra_reqs.append('confirmed_craft_or_material_detail')
            src = _get_src_and_check(item, '8.1 面料与品牌资质', extra_reqs, require_original_review=True)
            if src:
                vtype = item.get('visual_type')
                if vtype not in VALID_81_VTYPES:
                    _log_audit(item.get('id'), '8.1 面料与品牌资质', src, str(vtype), '', '', '拒绝', f'非法的 visual_type: {vtype}，允许值: {VALID_81_VTYPES}')
                else:
                    valid_items.append({'src': src, 'id': item.get('id'), 'title': item.get('title', '')})

        if valid_items:
            # 智能自适应画布宽高比对齐补白（4:3 比例物理定高对齐通用算法）
            for vi in valid_items:
                vi_src = vi['src']
                vi_abs = os.path.join(self.target_dir, vi_src)
                if os.path.exists(vi_abs):
                    import subprocess
                    ps_code = """
                    Add-Type -AssemblyName System.Drawing
                    $imgPath = $Env:TARGET_IMAGE_PATH
                    $img = [System.Drawing.Image]::FromFile($imgPath)
                    $width = $img.Width
                    $height = $img.Height

                    # 设定 900x1200 像素作为 8.1 节资质图片的标准物理统一分辨率 (3:4 比例)
                    $targetWidth = 900
                    $targetHeight = 1200

                    if ($width -ne $targetWidth -or $height -ne $targetHeight) {
                        $currentRatio = $width / $height
                        $targetRatio = 3.0 / 4.0

                        if ($currentRatio -gt $targetRatio) {
                            $drawWidth = $targetWidth
                            $drawHeight = [int]($targetWidth / $currentRatio)
                            $pasteX = 0
                            $pasteY = [int](($targetHeight - $drawHeight) / 2)
                        } else {
                            $drawHeight = $targetHeight
                            $drawWidth = [int]($targetHeight * $currentRatio)
                            $pasteX = [int](($targetWidth - $drawWidth) / 2)
                            $pasteY = 0
                        }

                        $newImg = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
                        $g = [System.Drawing.Graphics]::FromImage($newImg)
                        $g.Clear([System.Drawing.Color]::White)

                        # 开启高质量插值算法，保障文字缩放后极其高清晰度
                        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

                        $g.DrawImage($img, $pasteX, $pasteY, $drawWidth, $drawHeight)
                        $img.Dispose()

                        if ($imgPath.ToLower().EndsWith(".jpg") -or $imgPath.ToLower().EndsWith(".jpeg")) {
                            $newImg.Save($imgPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
                        } else {
                            $newImg.Save($imgPath, [System.Drawing.Imaging.ImageFormat]::Png)
                        }
                        $newImg.Dispose()
                        $g.Dispose()
                    } else {
                        $img.Dispose()
                    }
                    """
                    my_env = os.environ.copy()
                    my_env["TARGET_IMAGE_PATH"] = vi_abs
                    try:
                        p = subprocess.Popen(
                            ["powershell", "-NoProfile", "-Command", "-"],
                            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                            text=True, encoding="utf-8", env=my_env
                        )
                        p.communicate(input=ps_code)
                    except Exception as e:
                        print(f"[!] 自动图像宽高比智能补白失败: {e}")

            n = len(valid_items)
            # 智能自适应折行与50%物理定宽拉齐布局 (MAX_COLS = 2)
            MAX_COLS = 2
            sec_81_lines.append('<!-- PDH_SECTION_START:8.1 面料与品牌资质 -->')
            sec_81_lines.append(f'<table class="pdh-fabric-table" style="width: 100%; border-collapse: collapse; margin: 14px 0 18px 0; border: 1px solid #EFEFEF; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); background: #fff;">')
            for i in range(0, n, MAX_COLS):
                chunk = valid_items[i:i+MAX_COLS]
                sec_81_lines.append(f'  <tr style="background: #fff;">')
                for vi in chunk:
                    img = _img_tag(vi['id'], vi['src'], vi.get('title', ''))
                    title_html = f'<div style="margin-top: 8px; font-size: 13px; font-weight: 500; color: #333; line-height: 1.4;">{_safe_text(vi["title"])}</div>' if vi.get('title') else ''
                    cell_content = (
                        f'      <div class="pdh-image-box" style="height: 280px; background: #F7F7F7; '
                        f'display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 6px;">'
                        f'{img}'
                        f'</div>'
                        f'{title_html}'
                    )
                    sec_81_lines.append(
                        f'    <td style="padding: 12px; text-align: center; border: 1px solid #EFEFEF; vertical-align: top; width: 50.0%;">'
                        f'{cell_content}'
                        f'</td>'
                    )
                # 不足 MAX_COLS 用空白 td 补齐，确保完美的对称布局
                if len(chunk) < MAX_COLS:
                    for _ in range(MAX_COLS - len(chunk)):
                        sec_81_lines.append(
                            f'    <td style="padding: 12px; border: 1px solid #EFEFEF; width: 50.0%;">'
                            f'</td>'
                        )
                sec_81_lines.append('  </tr>')
            sec_81_lines.append('</table>')
            sec_81_lines.append('<!-- PDH_SECTION_END:8.1 面料与品牌资质 -->')
        else:
            sec_81_lines.append('<!-- PDH_SECTION_START:8.1 面料与品牌资质 -->')
            sec_81_lines.append('> ⚠️ 面料展示图与资质报告待补充')
            sec_81_lines.append('<!-- PDH_SECTION_END:8.1 面料与品牌资质 -->')

        # 检查是否为局部 Sandbox 重生成模式
        if limit_section:
            target_lines = None
            if limit_section == '5.1 颜色展示':
                target_lines = sec_51_lines
            elif limit_section == '5.2 棚拍展示':
                target_lines = sec_52_lines
            elif limit_section == '5.3 外景展示':
                target_lines = sec_53_lines
            elif limit_section == '5.4 搭配方案展示':
                target_lines = sec_54_lines
            elif limit_section == '8.1 面料与品牌资质':
                target_lines = sec_81_lines

            if target_lines is None:
                print(f"[!] 找不到对应的 limit_section: {limit_section}")
                return

            # 剔除首尾的边界注释标记，仅将内部的 HTML 块做 Patch 写入
            patch_body = '\n'.join(target_lines[1:-1])
            print(f"[*] 局部重生成模式激活！正在将 [{limit_section}] 的新渲染 HTML Patch 到目标部件中...")

            success = self.patch_gallery(limit_section, patch_body)
            if success:
                print(f"[+] [Sandbox] 局部重生成与 Patch 成功！")
            else:
                print(f"[!] [Sandbox] 局部重生成或 Patch 失败！")
            return

        # 正常全量输出模式
        gallery_lines.append('\n'.join(sec_51_lines))
        gallery_lines.append('')
        gallery_lines.append('\n'.join(sec_52_lines))
        gallery_lines.append('')
        gallery_lines.append('\n'.join(sec_53_lines))
        gallery_lines.append('')
        gallery_lines.append('\n'.join(sec_54_lines))

        fabric_lines.extend(sec_81_lines)

        # 写入 outputs
        gal_path = os.path.join(snippets_dir, 'gallery.md')
        with open(gal_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(gallery_lines))

        fab_path = os.path.join(snippets_dir, 'fabric_gallery.md')
        with open(fab_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(fabric_lines))

        audit_path = os.path.join(snippets_dir, 'image_audit.md')
        with open(audit_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(audit_lines))

        print(f"[+] 图像片段已生成:")
        print(f"    - {gal_path}")
        print(f"    - {fab_path}")
        print(f"    - 审计记录: {audit_path}")

    def index_snippet(self):
        manifest_path = os.path.join(self.scratch_dir, 'manifest.json')
        if not os.path.exists(manifest_path):
            print("[!] 请先运行 extract 生成 manifest.json")
            return
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)

        snippets_dir = os.path.join(self.scratch_dir, 'snippets')
        os.makedirs(snippets_dir, exist_ok=True)

        # 排除项
        sku_prefix = self.sku_name.split('-')[0] if '-' in self.sku_name else self.sku_name
        def _should_exclude(entry):
            rp = entry['relative_path']
            fn = entry['filename']
            if fn.startswith(sku_prefix) and fn.endswith('.md'):
                return True
            if fn.endswith(('.review.md', '.tmp', '.bak')):
                return True
            for skip in ('.scratch/', '自动生成素材/', 'scratch/', 'parts/'):
                if rp.startswith(skip):
                    return True
            if self.stable_assets_rel in rp:
                return True
            return False

        filtered = [e for e in manifest if not _should_exclude(e)]

        # 分组
        images = [e for e in filtered if e['file_type'] == 'image']
        texts = [e for e in filtered if e['file_type'] in ('text', 'spreadsheet', 'document')]
        videos = [e for e in filtered if e['file_type'] == 'video']

        def _build_table(entries, prefix):
            rows = []
            rows.append('| 编号 | 文件类型 | 文件名 | 相对路径 |')
            rows.append('|:---|:---|:---|:---|')
            for i, e in enumerate(entries, 1):
                ext_upper = e['extension'].upper().lstrip('.')
                fn_clean = e["filename"].replace('|', '\\|')
                rp_clean = e["relative_path"].replace('|', '\\|')
                rows.append(f'| {prefix}{i:03d} | {ext_upper} | {fn_clean} | {rp_clean} |')
            return '\n'.join(rows)

        lines = ['## 十、相关素材文件索引', '']
        lines.append('### 10.1 图片素材')
        lines.append('')
        if images:
            lines.append(_build_table(images, 'P'))
        else:
            lines.append('> 无图片素材')
        lines.append('')

        lines.append('### 10.2 文本/表格/文档素材')
        lines.append('')
        if texts:
            lines.append(_build_table(texts, 'T'))
        else:
            lines.append('> 无文本/表格/文档素材')
        lines.append('')

        lines.append('### 10.3 视频素材')
        lines.append('')
        if videos:
            lines.append(_build_table(videos, 'V'))
        else:
            lines.append('> 无视频素材')

        out_path = os.path.join(snippets_dir, 'asset_index.md')
        with open(out_path, 'w', encoding='utf-8', newline='\n') as f:
            f.write('\n'.join(lines))
        print(f"[+] 第10章素材索引已生成: {out_path}")
        print(f"    图片: {len(images)} | 文本/表格/文档: {len(texts)} | 视频: {len(videos)}")

    def migrate_plan(self, plan_path):
        """
        物理 Plan 迁移命令行工具 (v2.1.0)
        读取物理磁盘旧 v1.0 plan，自动在 .scratch/backups/ 备份，
        然后以 v1.1 标准物理覆写 plan 磁盘文件，完成永久迁移。
        """
        print(f"[*] 启动物理 Plan 数据迁移: {plan_path}")
        if not os.path.exists(plan_path):
            print(f"[!] Plan 文件不存在: {plan_path}")
            sys.exit(1)

        try:
            backups_dir = os.path.join(self.scratch_dir, 'backups')
            os.makedirs(backups_dir, exist_ok=True)

            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_filename = f"image_selection_plan.before_migrate_{timestamp}.json"
            backup_path = os.path.join(backups_dir, backup_filename)

            shutil.copy2(plan_path, backup_path)
            print(f"[+] [Backup] 成功备份原 Plan 到: {backup_path}")

            migrated_plan = self._load_image_plan(plan_path)

            with open(plan_path, 'w', encoding='utf-8') as f:
                json.dump(migrated_plan, f, ensure_ascii=False, indent=2)

            print(f"[OK] [Migrate] 物理 Plan 成功升轨并覆写: {plan_path}")
            print(f"    - 新格式完全兼容 v1.1 协议规范")
        except Exception as e:
            print(f"[ERROR] [Migrate] 迁移失败: {e}")
            traceback.print_exc()
            sys.exit(1)

    def render(self, data_json_path, template_path):
        print(f"[*] 渲染 Markdown")
        if not os.path.exists(data_json_path):
            raise FileNotFoundError(f"未找到: {data_json_path}")
        if not os.path.exists(template_path):
            raise FileNotFoundError(f"未找到: {template_path}")
        with open(data_json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        with open(template_path, 'r', encoding='utf-8') as f:
            tpl = f.read()
        for key, val in data.items():
            tpl = tpl.replace('{' + key + '}', str(val))
        out = os.path.join(self.scratch_dir, f'{self.sku_name}_draft.md')
        with open(out, 'w', encoding='utf-8') as f:
            f.write(tpl)
        print(f"[+] 草稿: {out}")

    def split_plan(self):
        plan_content = """# 分批生成计划 (Section Plan)
为了避免一次性生成内容过长导致截断或超时，请严格按以下分批顺序生成 Markdown 片段：

⚠️ 每次只生成一个 part，每个 part 写入独立文件后保存，禁止合并或跳过。

- `part_01_intro_selling_points.md`: Hero Banner、基础信息、一、核心卖点（含1.1 AI提炼核心卖点 + 1.2 设计师卖点原文）
- `part_02_audience_scene_emotion.md`: 二、全域人群画像、三、全域场景分析、四、全域情绪转化矩阵（绝不允许跳过这3章）
- `part_03_product_gallery.md`: 五、产品展示与搭配库
  - 5.1 颜色展示（静物图，一色一图）
  - 5.2 棚拍展示（模特图，禁止拼接/多视图）
  - 5.3 外景展示（不允许遗漏任何一张）
  - 5.4 搭配方案展示（搭配物料一品一图）
  - 5.5 设计灵感参考（可选，无则跳过）
- `part_04_marketing_livestream.md`: 六、营销方向与传播建议、七、主播通用穿搭与话术模版
- `part_05_qualification_size_index.md`: 八、品牌与产品资质（含8.1面料与品牌资质+8.2品牌资质）、九、尺码参考、十、相关素材文件索引、文档生成时间、版本、声明

请将这些文件生成到: {SKU}/.scratch/parts/
"""
        parts_dir = os.path.join(self.scratch_dir, 'parts')
        os.makedirs(parts_dir, exist_ok=True)
        plan_path = os.path.join(self.scratch_dir, 'section_plan.md')
        with open(plan_path, 'w', encoding='utf-8') as f:
            f.write(plan_content.replace('{SKU}', self.sku_name))
        print(f"[+] 分批生成计划已创建: {plan_path}")

    def part_skeletons(self, template_path):
        if not os.path.exists(template_path):
            print(f"[!] 模板不存在: {template_path}")
            return
        with open(template_path, 'r', encoding='utf-8') as f:
            tpl = f.read()

        parts_dir = os.path.join(self.scratch_dir, 'parts')
        os.makedirs(parts_dir, exist_ok=True)

        # 去掉模板头部注释（<!-- ... -->）
        tpl_clean = re.sub(r'^<!--.*?-->\s*', '', tpl, flags=re.DOTALL)

        # 定义切割锚点（按模板中的章节分界线 --- 和 ## 标题定位）
        def _find(marker):
            idx = tpl_clean.find(marker)
            if idx == -1:
                # 尝试模糊搜索
                for line_idx, line in enumerate(tpl_clean.split('\n')):
                    if marker.strip('#').strip() in line:
                        return sum(len(l)+1 for l in tpl_clean.split('\n')[:line_idx])
            return idx

        # 锚点位置
        p_hero = 0
        p_ch2 = _find('## 二、全域人群画像')
        p_ch5 = _find('## 五、产品展示与搭配库')
        p_ch6 = _find('## 六、营销方向与传播建议')
        p_ch8 = _find('## 八、品牌与产品资质')

        if any(p == -1 for p in [p_ch2, p_ch5, p_ch6, p_ch8]):
            print("[!] 无法在模板中找到所有章节锚点，请检查 clean_md_template.md")
            print(f"    ch2={p_ch2} ch5={p_ch5} ch6={p_ch6} ch8={p_ch8}")
            return

        # part_01: Hero → 基础信息 → 第1章（到 ## 二 之前）
        part_01 = tpl_clean[p_hero:p_ch2].rstrip() + '\n'

        # part_02: 第2-4章（到 ## 五 之前）
        part_02 = tpl_clean[p_ch2:p_ch5].rstrip() + '\n'

        # part_03: 由 gallery-snippet 生成，但骨架阶段需要保留标题结构
        # 从模板中提取第 5 章标题结构作为骨架
        part_03_skeleton = tpl_clean[p_ch5:p_ch6].rstrip() + '\n' if p_ch5 != -1 and p_ch6 != -1 else ''
        if not part_03_skeleton:
            # 如果无法提取，使用默认标题结构
            part_03_skeleton = '''## 五、产品展示与搭配库

> ⚠️ **致命强制要求：第5章图片 HTML 必须由 `image-snippet` action 生成。AI 不得手写 5.1/5.2/5.3/5.4 图片 HTML。**

### 5.1 颜色展示

{由 image-snippet 生成，最终呈现为 Markdown 图片列表或表格}

### 5.2 棚拍展示

{由 image-snippet 生成，最终呈现为 Markdown 图片列表}

### 5.3 外景展示

{由 image-snippet 生成，最终呈现为 Markdown 图片列表（按场景分组）}

### 5.4 搭配方案展示

{由 image-snippet 生成，最终呈现为 Markdown 图片列表}

### 5.5 设计灵感参考（可选）

{由 image-snippet 生成。仅当商品目录中确实存在设计灵感参考图时才展示，没有则不生成此章节。}
'''
        part_03_note = '<!-- part_03 由 gallery-snippet 引擎生成，请勿手动编辑 -->\n' + part_03_skeleton

        # part_04: 第6-7章（到 ## 八 之前）
        part_04 = tpl_clean[p_ch6:p_ch8].rstrip() + '\n'

        # part_05: 第8-9-10章 + 底部
        part_05 = tpl_clean[p_ch8:].rstrip() + '\n'

        if self.exclude_index:
            # 剔除整个第十章：支持“十、相关素材文件索引”和下装裤的“十、素材索引”
            pattern_ch10 = r'\n---\s*\n\s*## 十、(?:相关素材文件索引|素材索引).*?\n---\s*\n'
            part_05 = re.sub(pattern_ch10, '\n---\n\n', part_05, flags=re.DOTALL)

            # 熔断断言校验：严防由于模板不一致静默出错
            if '## 十、相关素材文件索引' in part_05 or '## 十、素材索引' in part_05:
                raise RuntimeError('[熔断] exclude_index 已启用，但第十章素材索引章节切除失败，请检查模板结构')


        # 写入文件
        files = {
            'part_01_intro_selling_points.md': part_01,
            'part_02_audience_scene_emotion.md': part_02,
            'part_03_product_gallery.md': part_03_note,
            'part_04_marketing_livestream.md': part_04,
            'part_05_qualification_size_index.md': part_05,
        }

        # 调用自动 AI 智能填充管线进行极简物料填充
        files = self.fill_skeleton_parts_for_minimal_material(files)

        for fname, body in files.items():
            fpath = os.path.join(parts_dir, fname)
            with open(fpath, 'w', encoding='utf-8', newline='\n') as f:
                f.write(body)
            line_count = body.count('\n')
            print(f"[+] {fname}: {line_count} 行")

        print(f"[+] 骨架文件已生成到: {parts_dir}")
        print("[*] AI 只需在骨架中替换 {{...}} 占位符，不得修改固定标题")
