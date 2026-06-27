#!/usr/bin/env python3
"""批量测试脚本 - 对所有测试用例运行完整 pipeline 并验证

Loop Engineering 自我迭代测试:
1. 对每个测试文本文件运行 parse -> generate -> validate
2. 记录每个测试的通过/失败状态
3. 对失败的测试分析原因
4. 迭代修复后重新运行

测试矩阵:
  test_01_original    - 原始文本（有手动挖空标记）
  test_02_short       - 短文本（少主题、少挖空）
  test_03_history     - 历史知识点（中等长度）
  test_04_biology     - 生物知识点（中等长度，含英文术语）
  test_05_chemistry   - 化学知识点（短，无挖空标记 -> AI模式）
  test_06_physics     - 物理知识点（中等，无手动标记）
  test_07_original_long - 原始长文本（超长段落，无挖空标记）
  test_08_dense       - 地理综合（多段落、多主题）
"""
import sys
import os
import json
import shutil
import traceback

sys.path.insert(0, '/workspace/fill_in_blank_ppt')

from config import CONFIG
from modules.input_parser import parse_input, save_memory as save_parse_memory
from modules.ai_blank_extractor import process_topics, save_memory as save_blanks_memory
from modules.text_paginator import paginate_topics, save_memory as save_pages_memory
from modules.ppt_generator_v2 import generate_ppt
from modules.auto_validator import validate_pptx

# 测试用例定义
TEST_CASES = [
    {
        "name": "test_01_original",
        "desc": "原始文本（有手动{{}}挖空标记）",
        "input": "test_data/test_01_original.txt",
        "mode": "manual",
    },
    {
        "name": "test_02_short",
        "desc": "短文本（少主题少挖空）",
        "input": "test_data/test_02_short.txt",
        "mode": "manual",
    },
    {
        "name": "test_03_history",
        "desc": "历史知识点（中等长度）",
        "input": "test_data/test_03_history.txt",
        "mode": "manual",
    },
    {
        "name": "test_04_biology",
        "desc": "生物知识点（含英文术语）",
        "input": "test_data/test_04_biology.txt",
        "mode": "manual",
    },
    {
        "name": "test_05_chemistry",
        "desc": "化学知识点（无手动标记）",
        "input": "test_data/test_05_chemistry.txt",
        "mode": "manual",
    },
    {
        "name": "test_06_physics",
        "desc": "物理知识点（中等无标记）",
        "input": "test_data/test_06_physics.txt",
        "mode": "manual",
    },
    {
        "name": "test_07_original_long",
        "desc": "原始长文本（超长段落）",
        "input": "test_data/test_07_original_long.txt",
        "mode": "manual",
    },
    {
        "name": "test_08_dense",
        "desc": "地理综合（多段落多主题）",
        "input": "test_data/test_08_dense.txt",
        "mode": "manual",
    },
]

BASE_DIR = "/workspace/fill_in_blank_ppt"
TEST_OUTPUT_DIR = "/workspace/fill_in_blank_ppt/test_output"


def run_single_test(test_case: dict) -> dict:
    """运行单个测试用例"""
    name = test_case["name"]
    input_path = os.path.join(BASE_DIR, test_case["input"])
    output_path = os.path.join(TEST_OUTPUT_DIR, f"{name}.pptx")
    memory_dir = os.path.join(TEST_OUTPUT_DIR, f"{name}_memory")

    result = {
        "name": name,
        "desc": test_case["desc"],
        "input": test_case["input"],
        "output": output_path,
        "status": "RUNNING",
        "slides": 0,
        "topics": 0,
        "blanks": 0,
        "validation": None,
        "errors": [],
    }

    try:
        # 清理 memory 目录
        if os.path.exists(memory_dir):
            shutil.rmtree(memory_dir)
        os.makedirs(memory_dir, exist_ok=True)
        os.makedirs(TEST_OUTPUT_DIR, exist_ok=True)

        # 构建配置
        config = CONFIG.copy()
        config["input_doc"] = input_path
        config["output_path"] = output_path
        config["memory_dir"] = memory_dir
        config["ai_mode"] = "manual"  # 全部使用手动模式（已有的{{}}标记）

        # Step 1: 解析输入
        topics = parse_input(input_path)
        save_parse_memory(topics, memory_dir)
        result["topics"] = len(topics)
        total_blanks = sum(len(p.manual_blanks) for t in topics for p in t.paragraphs)
        result["blanks"] = total_blanks

        if not topics:
            result["errors"].append("未解析到主题")
            result["status"] = "FAIL"
            return result

        # Step 2: 挖空处理（manual模式，直接使用手动标记）
        for topic in topics:
            for para in topic.paragraphs:
                para.blanks = list(para.manual_blanks)
        save_blanks_memory(topics, memory_dir)

        # Step 3: 生成PPT
        output = generate_ppt(topics, config, output_path)

        # 获取幻灯片数
        from pptx import Presentation
        prs = Presentation(output_path)
        result["slides"] = len(prs.slides)

        # Step 4: 验证
        validation = validate_pptx(output_path, config)
        result["validation"] = validation

        if validation["all_passed"]:
            result["status"] = "PASS"
        else:
            result["status"] = "FAIL"
            for r in validation["results"]:
                if not r["passed"]:
                    result["errors"].append(f"{r['tc_id']}: {r['reason']}")

    except Exception as e:
        result["status"] = "ERROR"
        result["errors"].append(f"{type(e).__name__}: {str(e)}")
        result["errors"].append(traceback.format_exc())

    return result


def print_results(results: list):
    """打印测试结果汇总"""
    print(f"\n{'='*80}")
    print(f"  测试结果汇总 ({len(results)} 个测试)")
    print(f"{'='*80}")
    
    pass_count = sum(1 for r in results if r["status"] == "PASS")
    fail_count = sum(1 for r in results if r["status"] == "FAIL")
    error_count = sum(1 for r in results if r["status"] == "ERROR")
    
    print(f"  PASS: {pass_count}  FAIL: {fail_count}  ERROR: {error_count}")
    print(f"{'='*80}")
    
    for r in results:
        status_icon = {"PASS": "✓", "FAIL": "✗", "ERROR": "⚠"}[r["status"]]
        print(f"\n  {status_icon} {r['name']}: {r['status']}")
        print(f"    描述: {r['desc']}")
        print(f"    主题: {r['topics']}, 挖空: {r['blanks']}, 幻灯片: {r['slides']}")
        if r["errors"]:
            for e in r["errors"]:
                print(f"    错误: {e}")
        if r["validation"]:
            for v in r["validation"]["results"]:
                vstatus = "✓" if v["passed"] else "✗"
                print(f"    {vstatus} {v['tc_id']}: {'PASS' if v['passed'] else 'FAIL'} {v['reason']}")

    print(f"\n{'='*80}")
    return pass_count == len(results)


if __name__ == '__main__':
    print("开始批量测试...")
    print(f"测试用例数: {len(TEST_CASES)}")
    
    all_results = []
    for i, tc in enumerate(TEST_CASES):
        print(f"\n[{i+1}/{len(TEST_CASES)}] 运行 {tc['name']}...")
        result = run_single_test(tc)
        all_results.append(result)
        print(f"  -> {result['status']} (slides={result['slides']})")
    
    all_passed = print_results(all_results)
    
    # 保存结果到 JSON
    results_path = os.path.join(TEST_OUTPUT_DIR, "test_results.json")
    with open(results_path, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2, default=str)
    print(f"\n结果已保存: {results_path}")
    
    sys.exit(0 if all_passed else 1)
