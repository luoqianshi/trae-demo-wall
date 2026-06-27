"""Loop Engineering 闭环调度器

协调各模块运行，实现自动验证-修复循环
"""
import os
import json
import time

from config import CONFIG
from modules.input_parser import parse_input, save_memory as save_parse_memory
from modules.ai_blank_extractor import process_topics, save_memory as save_blanks_memory
from modules.text_paginator import paginate_topics, save_memory as save_pages_memory
from modules.ppt_generator_v2 import generate_ppt, save_memory_draft
from modules.auto_validator import validate_pptx, save_memory as save_validation_memory


def run_loop(config: dict = None):
    """运行完整的闭环流程"""
    if config is None:
        config = CONFIG.copy()

    memory_dir = config["memory_dir"]
    os.makedirs(memory_dir, exist_ok=True)

    max_retries = config.get("max_retries", 3)
    auto_fix = config.get("auto_fix", True)
    resume_from = config.get("resume_from")

    retry_count = 0
    start_step = resume_from or 1

    while retry_count <= max_retries:
        print(f"\n{'='*60}")
        print(f"Loop iteration {retry_count + 1} (max {max_retries + 1})")
        print(f"Starting from step {start_step}")
        print(f"{'='*60}")

        try:
            # Step 1: 输入解析
            if start_step <= 1:
                print("\n[Step 1] Parsing input...")
                topics = parse_input(config["input_doc"])
                save_parse_memory(topics, memory_dir)
                print(f"  Parsed {len(topics)} topics")
                start_step = 2

            # Step 2: 挖空处理
            if start_step <= 2:
                print("\n[Step 2] Processing blanks...")
                from modules.input_parser import load_memory as load_parsed
                topics = load_parsed(memory_dir)
                topics = process_topics(topics, config)
                save_blanks_memory(topics, memory_dir)
                total_blanks = sum(len(p.blanks) for t in topics for p in t.paragraphs)
                print(f"  Total blanks: {total_blanks}")
                start_step = 3

            # Step 3: 文本分页
            if start_step <= 3:
                print("\n[Step 3] Paginating text...")
                from modules.ai_blank_extractor import load_memory as load_blanks
                topics = load_blanks(memory_dir)
                pages = paginate_topics(topics, config)
                save_pages_memory(pages, memory_dir)
                print(f"  Total pages: {len(pages)}")
                start_step = 4

            # Step 4-6: PPT生成
            if start_step <= 4:
                print("\n[Step 4-6] Generating PPT...")
                from modules.ai_blank_extractor import load_memory as load_blanks
                topics = load_blanks(memory_dir)
                output_path = generate_ppt(topics, config, config["output_path"])
                save_memory_draft(output_path, memory_dir)
                start_step = 5

            # Step 7-8: 验证
            if start_step <= 5:
                print("\n[Step 7-8] Validating PPT...")
                validation = validate_pptx(config["output_path"], config)
                save_validation_memory(validation, memory_dir)

                print(f"\n  Validation results:")
                for r in validation["results"]:
                    status = "PASS" if r["passed"] else "FAIL"
                    print(f"    {r['tc_id']}: {status} {r['reason']}")

                if validation["all_passed"]:
                    print(f"\n{'='*60}")
                    print("ALL TESTS PASSED! PPT generated successfully.")
                    print(f"Output: {config['output_path']}")
                    print(f"{'='*60}")
                    return True
                else:
                    if auto_fix and retry_count < max_retries:
                        fix_step = validation.get("fix_target_step", 4)
                        # 确保 fix_step 在有效范围内（1-4）
                        fix_step = min(max(fix_step, 1), 4)
                        print(f"\n  Validation failed, auto-fixing from step {fix_step}...")
                        start_step = fix_step
                        retry_count += 1
                        # 调整参数
                        # 调整参数（处理 None 值）
                        current_cpp = config.get("chars_per_page")
                        if current_cpp is None:
                            current_cpp = 200  # 默认值（与 TextMeasurer 自动计算一致）
                        config["chars_per_page"] = max(80, current_cpp - 10)
                        time.sleep(1)
                        continue
                    else:
                        print(f"\n  Validation failed after {max_retries} retries.")
                        print("  Please check the output manually.")
                        return False

        except Exception as e:
            print(f"\n[ERROR] {e}")
            import traceback
            traceback.print_exc()
            if retry_count < max_retries:
                print(f"\n  Retrying from step 1... ({retry_count + 1}/{max_retries})")
                start_step = 1
                retry_count += 1
                time.sleep(2)
                continue
            else:
                print(f"\n  Failed after {max_retries} retries.")
                return False

    return False


if __name__ == '__main__':
    success = run_loop()
    exit(0 if success else 1)
