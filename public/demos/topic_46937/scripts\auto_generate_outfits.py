# -*- coding: utf-8 -*-
"""
Product Digital Handbook - AI Outfit Painter Agent (v1.0.0)
自动解析极简物料搭配生图任务清单，关联颜色参考图并输出结构化生图指令。
"""
import os
import sys
import json

def main():
    if len(sys.argv) < 2:
        print("[!] 请提供目标商品目录路径，例如: python scripts/auto_generate_outfits.py <target_dir>")
        sys.exit(1)

    target_dir = os.path.abspath(sys.argv[1])
    scratch_dir = os.path.join(target_dir, ".scratch")
    outfit_dir = os.path.join(scratch_dir, "ai_generated_outfits")
    plan_path = os.path.join(scratch_dir, "image_selection_plan.json")
    brief_path = os.path.join(scratch_dir, "outfit_strategy_brief.json")

    if not os.path.exists(outfit_dir):
        print(f"[ERR] 未检测到生图目录: {outfit_dir}")
        sys.exit(1)

    # 建立颜色与本地静物图的映射
    color_map = {}
    if os.path.exists(plan_path):
        try:
            with open(plan_path, 'r', encoding='utf-8') as f:
                plan_data = json.load(f)
            color_items = plan_data.get("5.1 颜色展示", {}).get("items", [])
            for item in color_items:
                cname = item.get("color_name") or item.get("title") or item.get("display_name")
                rpath = item.get("relative_path")
                if cname and rpath:
                    color_map[cname] = os.path.join(target_dir, rpath)
        except Exception as e:
            print(f"[WARN] 加载颜色计划失败: {e}")

    look_colors = {}
    if os.path.exists(brief_path):
        try:
            with open(brief_path, 'r', encoding='utf-8') as f:
                brief_data = json.load(f)
            for outfit in brief_data.get("outfits", []):
                look_id = outfit.get("look_id")
                selected_color = outfit.get("selected_product_color")
                if look_id and selected_color:
                    look_colors[look_id] = selected_color
        except (OSError, json.JSONDecodeError) as e:
            print(f"[ERR] 无法读取搭配策划颜色映射: {e}")
            sys.exit(1)

    # 扫描各 Look 的 manifest
    tasks = []
    for i in range(1, 10):
        look_name = f"look_0{i}"
        manifest_path = os.path.join(outfit_dir, look_name, "outfit_generation_manifest.json")
        if os.path.exists(manifest_path):
            try:
                with open(manifest_path, 'r', encoding='utf-8') as f:
                    manifest = json.load(f)

                # 寻找该 Look 关联的产品颜色
                selected_color = look_colors.get(look_name, "")

                ref_image_path = color_map.get(selected_color, "")
                if not ref_image_path:
                    # 备用：搜索包含颜色词的文件
                    for cname, path in color_map.items():
                        if selected_color in cname or cname in selected_color:
                            ref_image_path = path
                            break

                for itype, data in manifest.items():
                    prompt = data.get("prompt", "")
                    rel_path = data.get("relative_path", "")
                    dest_path = os.path.join(target_dir, rel_path)

                    # 5.4 AI生图一致性参考：对于整体搭配效果大图 (outfit_effect)，使用本品高清静物图、高清模特图（若有）以及已就绪的单品大图进行联合参考，最大化保证产品特征与单品一致
                    image_paths = []
                    if itype == "outfit_effect":
                        # 1. 本品高清静物图
                        if ref_image_path and os.path.exists(ref_image_path):
                            image_paths.append(ref_image_path)

                        # 2. 高清模特上身图 (若物理目录中有)
                        model_image_path = None
                        if os.path.exists(plan_path):
                            try:
                                items_52 = plan_data.get("5.2 棚拍展示", {}).get("items", [])
                                for m_item in items_52:
                                    mp = os.path.join(target_dir, m_item.get("relative_path", ""))
                                    if os.path.exists(mp):
                                        model_image_path = mp
                                        break
                            except Exception:
                                pass
                        if model_image_path:
                            image_paths.append(model_image_path)

                        # 3. Look 下已在 Stage 1 生成好的全部搭配单品大图
                        for other_type, other_data in manifest.items():
                            if other_type != "outfit_effect":
                                other_rel = other_data.get("relative_path", "")
                                other_abs = os.path.join(target_dir, other_rel)
                                if os.path.exists(other_abs) and os.path.getsize(other_abs) > 5 * 1024:
                                    image_paths.append(other_abs)

                    tasks.append({
                        "id": f"{look_name}_{itype}",
                        "type": itype,
                        "look": look_name,
                        "prompt": prompt,
                        "dest_path": dest_path,
                        "image_paths": image_paths
                    })
            except Exception as e:
                print(f"[WARN] 读取 {look_name} 任务清单失败: {e}")

    # 输出 JSON 任务流到 stdout 供 Agent 批量消费并调用 generate_image
    print(json.dumps(tasks, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
