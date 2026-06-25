#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
刷题系统 — 数据转换工具
========================
功能：
  1. 将 JSON 题目文件 转换为 data_choices.js / data_cases.js（供模板加载）
  2. 合并多个章节 JSON 文件为单一数据文件
  3. 将模板 HTML + 数据文件打包为自包含 HTML（可离线使用）

用法：
  python 数据转换工具.py json-to-js     <json文件>  <输出.js>  [--var VAR_NAME]
  python 数据转换工具.py merge-chapters <章节目录> <输出.js>  [--type choices|cases]
  python 数据转换工具.py generate-html  <模板HTML>  <choices.js>  <cases.js>  <输出HTML>
  python 数据转换工具.py quick-merge    <章节目录> <输出目录>

示例：
  # 单文件转换
  python 数据转换工具.py json-to-js ch01_choices.json data_choices.js --var CHOICE_DATA

  # 合并所有章节的选择题
  python 数据转换工具.py merge-chapters ./ data_choices.js --type choices

  # 一键合并并生成自包含HTML
  python 数据转换工具.py quick-merge ./ ./output/
"""

import json
import os
import sys
import re
import glob as glob_module


# ============================================================
# 核心函数
# ============================================================

def json_to_js(json_path, output_path, var_name="CHOICE_DATA", sort_by_id=True):
    """将 JSON 题目文件转换为 .js 数据文件
    
    Args:
        json_path: 输入 JSON 文件路径
        output_path: 输出 .js 文件路径
        var_name: 全局变量名 (CHOICE_DATA 或 CASE_DATA)
        sort_by_id: 是否按 id 排序
    """
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if not isinstance(data, list):
        raise ValueError(f"JSON 根元素必须是数组，当前类型: {type(data).__name__}")
    
    if sort_by_id:
        data.sort(key=lambda x: x.get('id', 0))
    
    # 验证数据格式
    validate_data(data, var_name)
    
    # 写入 .js 文件
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(f"// 刷题系统数据文件 — 由数据转换工具自动生成\n")
        f.write(f"// 题目数量: {len(data)}\n")
        f.write(f"// 生成时间: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"var {var_name} = ")
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write(";\n")
    
    print(f"[OK] 已生成: {output_path} ({len(data)} 条数据, var={var_name})")
    return len(data)


def merge_chapter_files(chapter_dir, output_path, data_type="choices", sort_by_id=True):
    """合并目录下所有章节 JSON 文件
    
    Args:
        chapter_dir: 包含 chXX_choices.json / chXX_cases.json 的目录
        output_path: 输出 .js 文件路径
        data_type: "choices" 或 "cases"
        sort_by_id: 是否按 id 排序
    """
    if data_type == "choices":
        pattern = os.path.join(chapter_dir, "ch*_choices.json")
        var_name = "CHOICE_DATA"
    elif data_type == "cases":
        pattern = os.path.join(chapter_dir, "ch*_cases.json")
        var_name = "CASE_DATA"
    else:
        raise ValueError(f"data_type 必须是 'choices' 或 'cases'，当前: {data_type}")
    
    files = sorted(glob_module.glob(pattern))
    # 过滤掉临时/错误文件
    files = [f for f in files if re.match(r'.*ch\d{1,2}_' + data_type + r'\.json$', os.path.basename(f))]
    
    if not files:
        print(f"[警告] 未找到匹配的文件: {pattern}")
        # 尝试不区分大小写
        files = sorted(glob_module.glob(pattern.replace('_choices', '_*').replace('_cases', '_*')))
        files = [f for f in files if data_type in os.path.basename(f).lower()]
    
    if not files:
        print(f"[错误] 目录 {chapter_dir} 中未找到任何 {data_type} 类型的章节文件")
        return 0
    
    all_data = []
    next_id = 1
    for fpath in files:
        with open(fpath, 'r', encoding='utf-8') as f:
            chunk = json.load(f)
        items = chunk if isinstance(chunk, list) else [chunk]
        for item in items:
            item['id'] = next_id
            next_id += 1
            all_data.append(item)
        print(f"  读取: {os.path.basename(fpath)} ({len(items)} 条)")
    
    # 按章节排序
    def sort_key(item):
        ch = item.get('chapter', '')
        m = re.search(r'(\d+)', ch)
        ch_num = int(m.group(1)) if m else 99
        return (ch_num, item.get('id', 0))
    
    all_data.sort(key=sort_key)
    
    # 重新分配全局唯一ID
    for i, item in enumerate(all_data):
        item['id'] = i + 1
    
    # 写入临时 JSON 再转换
    temp_json = output_path.replace('.js', '_temp.json')
    with open(temp_json, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    count = json_to_js(temp_json, output_path, var_name=var_name, sort_by_id=False)
    os.remove(temp_json)
    
    print(f"  总计: {len(files)} 个文件 → {count} 条数据")
    return count


def generate_self_contained_html(template_path, choices_js_path, cases_js_path, output_path,
                                  title=None, footer=None):
    """将模板 HTML + 数据文件打包为自包含 HTML
    
    Args:
        template_path: 模板 HTML 路径（刷题系统_模板.html）
        choices_js_path: data_choices.js 路径
        cases_js_path: data_cases.js 路径
        output_path: 输出 HTML 路径
        title: 可选，覆盖默认标题
        footer: 可选，覆盖默认页脚
    """
    with open(template_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # 读取数据文件内容
    choices_content = ""
    cases_content = ""
    
    if choices_js_path and os.path.exists(choices_js_path):
        with open(choices_js_path, 'r', encoding='utf-8') as f:
            choices_content = f.read()
        print(f"  读取选择题数据: {os.path.basename(choices_js_path)}")
    else:
        print(f"  [警告] 选择题数据文件不存在: {choices_js_path}")
    
    if cases_js_path and os.path.exists(cases_js_path):
        with open(cases_js_path, 'r', encoding='utf-8') as f:
            cases_content = f.read()
        print(f"  读取案例分析数据: {os.path.basename(cases_js_path)}")
    else:
        print(f"  [警告] 案例分析数据文件不存在: {cases_js_path}")
    
    # 替换外部 script 标签为内联数据
    # 替换 <script src="data_choices.js"></script>
    if choices_content:
        html = html.replace(
            '<script src="data_choices.js"></script>',
            '<script>\n' + choices_content + '\n</script>'
        )
    
    # 替换 <script src="data_cases.js"></script>
    if cases_content:
        html = html.replace(
            '<script src="data_cases.js"></script>',
            '<script>\n' + cases_content + '\n</script>'
        )
    
    # 自定义标题/页脚
    if title:
        # 在 data check 之前插入标题
        html = html.replace(
            "if (typeof QUIZ_TITLE !== 'undefined')",
            "var QUIZ_TITLE = " + json.dumps(title, ensure_ascii=False) + ";\nif (typeof QUIZ_TITLE !== 'undefined')"
        )
    if footer:
        html = html.replace(
            "if (typeof QUIZ_FOOTER !== 'undefined')",
            "var QUIZ_FOOTER = " + json.dumps(footer, ensure_ascii=False) + ";\nif (typeof QUIZ_FOOTER !== 'undefined')"
        )
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    size_kb = os.path.getsize(output_path) / 1024
    print(f"[OK] 已生成自包含HTML: {output_path} ({size_kb:.1f} KB)")


def quick_merge(chapter_dir, output_dir, title=None, footer=None):
    """一键操作：合并章节 → 生成数据文件 + 自包含HTML
    
    Args:
        chapter_dir: 包含章节 JSON 文件的目录
        output_dir: 输出目录
        title: 可选，刷题系统标题
        footer: 可选，页脚文字
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # 模板路径（与脚本同目录或从参数获取）
    script_dir = os.path.dirname(os.path.abspath(__file__))
    template_path = os.path.join(script_dir, '刷题系统_模板.html')
    
    # 如果脚本目录没有模板，尝试 c:\中级
    if not os.path.exists(template_path):
        alt_path = r'c:\中级\刷题系统_模板.html'
        if os.path.exists(alt_path):
            template_path = alt_path
        else:
            # 尝试在 chapter_dir 的父目录找
            alt_path = os.path.join(chapter_dir, '刷题系统_模板.html')
            if os.path.exists(alt_path):
                template_path = alt_path
    
    if not os.path.exists(template_path):
        print(f"[错误] 找不到模板文件 刷题系统_模板.html")
        print(f"  已搜索: {os.path.join(script_dir, '刷题系统_模板.html')}")
        print(f"  已搜索: c:\\中级\\刷题系统_模板.html")
        return
    
    print(f"模板: {template_path}")
    print(f"源目录: {chapter_dir}")
    print(f"输出目录: {output_dir}")
    print()
    
    # 生成选择题数据文件
    print("=" * 50)
    print("Step 1/4: 合并选择题章节文件")
    choices_js = os.path.join(output_dir, 'data_choices.js')
    c_count = merge_chapter_files(chapter_dir, choices_js, data_type="choices")
    
    # 生成案例分析数据文件
    print()
    print("Step 2/4: 合并案例分析章节文件")
    cases_js = os.path.join(output_dir, 'data_cases.js')
    s_count = merge_chapter_files(chapter_dir, cases_js, data_type="cases")
    
    # 生成自包含 HTML
    print()
    print("Step 3/4: 生成自包含HTML（嵌入数据，可离线使用）")
    standalone_html = os.path.join(output_dir, '刷题系统_自包含.html')
    generate_self_contained_html(
        template_path, choices_js, cases_js, standalone_html,
        title=title, footer=footer
    )
    
    # 复制模板 HTML 到输出目录
    print()
    print("Step 4/4: 复制模板HTML到输出目录")
    template_out = os.path.join(output_dir, '刷题系统_模板.html')
    with open(template_path, 'r', encoding='utf-8') as f:
        template_content = f.read()
    with open(template_out, 'w', encoding='utf-8') as f:
        f.write(template_content)
    print(f"[OK] 已复制: {template_out}")
    
    print()
    print("=" * 50)
    print("全部完成！")
    print(f"  选择题: {c_count} 道")
    print(f"  案例分析: {s_count} 道")
    print(f"  数据文件: {choices_js}, {cases_js}")
    print(f"  模板文件: {template_out}")
    print(f"  自包含HTML: {standalone_html}")
    print()
    print("使用方法：")
    print(f"  1. 用模板刷题：打开 {template_out}（需同目录有 data_choices.js 和 data_cases.js）")
    print(f"  2. 离线使用：打开 {standalone_html}（无需其他文件）")


# ============================================================
# 数据验证
# ============================================================

def validate_data(data, var_name):
    """验证数据格式，发现问题时打印警告"""
    if not data:
        print(f"[警告] 数据为空！var={var_name}")
        return
    
    # 统计字段
    fields_count = {}
    for item in data:
        for key in item:
            fields_count[key] = fields_count.get(key, 0) + 1
    
    total = len(data)
    
    # 检查必填字段
    if var_name == "CHOICE_DATA":
        required = ["id", "question", "options", "answer"]
        for field in required:
            count = fields_count.get(field, 0)
            if count < total:
                missing = total - count
                print(f"[警告] {missing} 条选择题缺少字段: {field}")
        
        # 检查选项格式
        bad_options = 0
        for item in data:
            opts = item.get('options', [])
            if not isinstance(opts, list) or len(opts) < 2:
                bad_options += 1
            elif not all(isinstance(o, str) and len(o) >= 2 for o in opts):
                bad_options += 1
        if bad_options > 0:
            print(f"[警告] {bad_options} 条选择题的 options 格式可能有问题")
        
        # 检查 answer 值
        valid_letters = set('ABCDEFGH')
        bad_answer = sum(1 for item in data 
                        if item.get('answer', '') not in valid_letters)
        if bad_answer > 0:
            print(f"[警告] {bad_answer} 条选择题的 answer 不是有效的字母选项")
    
    elif var_name == "CASE_DATA":
        required = ["id", "title", "scenario", "questions"]
        for field in required:
            count = fields_count.get(field, 0)
            if count < total:
                missing = total - count
                print(f"[警告] {missing} 条案例分析缺少字段: {field}")
        
        # 检查 questions 格式
        bad_questions = 0
        for item in data:
            qs = item.get('questions', [])
            if not isinstance(qs, list) or len(qs) == 0:
                bad_questions += 1
            else:
                for q in qs:
                    if not isinstance(q, dict) or 'question' not in q or 'answer' not in q:
                        bad_questions += 1
                        break
        if bad_questions > 0:
            print(f"[警告] {bad_questions} 条案例分析的 questions 格式可能有问题")
    
    # 打印统计
    print(f"  数据验证: {total} 条, 字段: {list(fields_count.keys())}")


# ============================================================
# CLI 入口
# ============================================================

def print_help():
    print("""
刷题系统 — 数据转换工具
========================

命令:
  json-to-js     <json文件> <输出.js>  [--var VAR_NAME]
                 将 JSON 文件转换为 .js 数据文件
                 
  merge-chapters <章节目录> <输出.js>  [--type choices|cases]
                 合并目录下所有 chXX_* 章节文件为一个 .js 数据文件
                 
  generate-html  <模板HTML> <choices.js> <cases.js> <输出HTML>  [--title TITLE] [--footer FOOTER]
                 将数据文件嵌入模板，生成自包含HTML
                 
  quick-merge    <章节目录> <输出目录>  [--title TITLE] [--footer FOOTER]
                 一键完成：合并章节 → 生成数据文件 → 生成自包含HTML

示例:
  python 数据转换工具.py json-to-js 题库.json data_choices.js --var CHOICE_DATA
  python 数据转换工具.py merge-chapters ./ data_choices.js --type choices
  python 数据转换工具.py quick-merge ./ output/ --title "我的刷题系统"
  
JSON 数据格式请参考: 题目JSON格式说明.md
""")


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ('-h', '--help', 'help'):
        print_help()
        return
    
    cmd = sys.argv[1]
    args = sys.argv[2:]
    
    # 解析通用选项
    def get_flag(flag, default=None):
        try:
            idx = args.index(flag)
            val = args[idx + 1]
            del args[idx:idx + 2]
            return val
        except (ValueError, IndexError):
            return default
    
    try:
        if cmd == 'json-to-js':
            if len(args) < 2:
                print("[错误] 用法: json-to-js <json文件> <输出.js> [--var VAR_NAME]")
                return
            var_name = get_flag('--var', 'CHOICE_DATA')
            json_to_js(args[0], args[1], var_name=var_name)
        
        elif cmd == 'merge-chapters':
            if len(args) < 2:
                print("[错误] 用法: merge-chapters <章节目录> <输出.js> [--type choices|cases]")
                return
            data_type = get_flag('--type', 'choices')
            merge_chapter_files(args[0], args[1], data_type=data_type)
        
        elif cmd == 'generate-html':
            if len(args) < 4:
                print("[错误] 用法: generate-html <模板HTML> <choices.js> <cases.js> <输出HTML>")
                return
            title = get_flag('--title')
            footer = get_flag('--footer')
            generate_self_contained_html(args[0], args[1], args[2], args[3],
                                         title=title, footer=footer)
        
        elif cmd == 'quick-merge':
            if len(args) < 2:
                print("[错误] 用法: quick-merge <章节目录> <输出目录> [--title TITLE] [--footer FOOTER]")
                return
            title = get_flag('--title')
            footer = get_flag('--footer')
            quick_merge(args[0], args[1], title=title, footer=footer)
        
        else:
            print(f"[错误] 未知命令: {cmd}")
            print_help()
    
    except FileNotFoundError as e:
        print(f"[错误] 文件未找到: {e}")
    except json.JSONDecodeError as e:
        print(f"[错误] JSON 解析失败: {e}")
    except Exception as e:
        print(f"[错误] {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()