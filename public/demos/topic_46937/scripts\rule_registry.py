#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Rule Registry Management Script (v2.1)
Provides command line operations to validate and render the rule registry.

Commands:
    python scripts/rule_registry.py --validate
    python scripts/rule_registry.py --render-md
"""

import os
import sys
import re

# Defined paths
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
YAML_PATH = os.path.join(PROJECT_ROOT, "references", "rule_registry.yaml")
MD_PATH = os.path.join(PROJECT_ROOT, "references", "rule_registry.md")

def parse_simple_yaml(file_path):
    """
    A lightweight, zero-dependency YAML parser tailored for rule_registry.yaml.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"YAML file not found: {file_path}")
        
    rules = {}
    current_rule = None
    current_key = None
    
    with open(file_path, "r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, 1):
            line_str = line.rstrip()
            # Skip empty or comment lines
            if not line_str or line_str.strip().startswith("#"):
                continue
                
            # Rule block start (頂格 rule ID, e.g. "P0-VAL-001:")
            if not line.startswith(" "):
                if line_str.endswith(":"):
                    current_rule = line_str[:-1].strip()
                    rules[current_rule] = {}
                    current_key = None
                else:
                    raise ValueError(f"Line {line_no}: Top-level key must end with a colon: '{line_str}'")
                continue
                
            # Indented line
            stripped = line_str.strip()
            if stripped.startswith("-"):
                # List item
                list_item = stripped[1:].strip()
                # Remove quotes if present
                if (list_item.startswith('"') and list_item.endswith('"')) or \
                   (list_item.startswith("'") and list_item.endswith("'")):
                    list_item = list_item[1:-1]
                if current_rule and current_key:
                    if not isinstance(rules[current_rule][current_key], list):
                        rules[current_rule][current_key] = []
                    rules[current_rule][current_key].append(list_item)
                else:
                    raise ValueError(f"Line {line_no}: List item without a key: '{line_str}'")
            else:
                # Key-value pair, e.g. "title: xxx" or "applies_to:"
                if ":" in stripped:
                    key, val = stripped.split(":", 1)
                    key = key.strip()
                    val = val.strip()
                    # Remove quotes if present
                    if (val.startswith('"') and val.endswith('"')) or \
                       (val.startswith("'") and val.endswith("'")):
                        val = val[1:-1]
                    if current_rule:
                        current_key = key
                        if val:
                            rules[current_rule][current_key] = val
                        else:
                            rules[current_rule][current_key] = []
                else:
                    raise ValueError(f"Line {line_no}: Invalid key-value format: '{line_str}'")
                    
    return rules

def validate_rules(rules):
    """
    Performs rigorous validations on rules dictionary.
    """
    errors = []
    valid_severities = {"P0", "P1", "P2"}
    valid_validators = {"validate-plan", "validate-parts", "validate"}
    
    rule_id_pattern = re.compile(r"^P[0-2]-VAL-\d{3}$")
    
    for rule_id, props in rules.items():
        # 1. Rule ID naming structure
        if not rule_id_pattern.match(rule_id):
            errors.append(f"Rule ID '{rule_id}' format invalid. Must match 'P[0-2]-VAL-###'")
            
        # 2. Title checking
        if "title" not in props or not props["title"]:
            errors.append(f"[{rule_id}] Missing or empty 'title'")
            
        # 3. Severity checking
        severity = props.get("severity")
        if severity not in valid_severities:
            errors.append(f"[{rule_id}] Severity '{severity}' invalid. Must be one of {list(valid_severities)}")
            
        # 4. Source of Truth file exists checking
        sot = props.get("source_of_truth")
        if not sot:
            errors.append(f"[{rule_id}] Missing 'source_of_truth'")
        else:
            sot_path = os.path.join(PROJECT_ROOT, "references", sot)
            if not os.path.exists(sot_path):
                errors.append(f"[{rule_id}] Source of Truth file not found at: {sot_path}")
                
        # 5. Applies to checking
        applies = props.get("applies_to")
        if not applies or not isinstance(applies, list) or len(applies) == 0:
            errors.append(f"[{rule_id}] 'applies_to' must be a non-empty list")
            
        # 6. Validators checking
        validators = props.get("validators")
        if not validators or not isinstance(validators, list) or len(validators) == 0:
            errors.append(f"[{rule_id}] 'validators' must be a non-empty list")
        else:
            for v in validators:
                if v not in valid_validators:
                    errors.append(f"[{rule_id}] Validator '{v}' invalid. Must be one of {list(valid_validators)}")
                    
        # 7. Fix Hint checking
        fix_hint = props.get("fix_hint")
        if not fix_hint or len(fix_hint.strip()) < 5:
            errors.append(f"[{rule_id}] 'fix_hint' missing or too short (<5 chars)")
            
        # 8. Next Action checking
        actions = props.get("next_action")
        if not actions or not isinstance(actions, list) or len(actions) == 0:
            errors.append(f"[{rule_id}] 'next_action' must be a non-empty list")
            
    return errors

def render_markdown(rules):
    """
    Renders structured Markdown document references/rule_registry.md from rules.
    """
    md = []
    md.append("# 服装商品数字手册 Pipeline 核心验证规则库 (Rule Registry)")
    md.append("")
    md.append("> [!NOTE]")
    md.append("> **双源同步规范**：本文件是 `references/rule_registry.yaml` 规则库的人类友好阅读版。")
    md.append("> 所有流水线逻辑均以 YAML 为唯一机器读取源，严禁手动直接修改本 Markdown 文件。请修改 YAML 后运行以下脚本同步：")
    md.append("> `python scripts/rule_registry.py --render-md`")
    md.append("")
    md.append("---")
    md.append("")
    
    # Summary stats
    total_rules = len(rules)
    p0_count = sum(1 for r in rules.values() if r.get("severity") == "P0")
    p1_count = sum(1 for r in rules.values() if r.get("severity") == "P1")
    p2_count = sum(1 for r in rules.values() if r.get("severity") == "P2")
    
    md.append("## 📊 规则库概览 (Summary)")
    md.append("")
    md.append(f"- **总计核心规则**: `{total_rules}` 个")
    md.append(f"- **P0 拦截级规则**: <span style='color: #FF3B30; font-weight: bold;'>{p0_count}</span> 个 (阻断全部后续生成)")
    md.append(f"- **P1 告警级规则**: <span style='color: #FFCC00; font-weight: bold;'>{p1_count}</span> 个 (发出强警告但不拦截)")
    md.append(f"- **P2 优化级规则**: <span style='color: #007AFF; font-weight: bold;'>{p2_count}</span> 个 (审计级优化提示)")
    md.append("")
    md.append("---")
    md.append("")
    md.append("## 🔍 规则索引目录 (Table of Contents)")
    md.append("")
    md.append("| 规则 ID | 规则名称 | 级别 | 适用文件 | 验证卡点 |")
    md.append("| :--- | :--- | :---: | :--- | :--- |")
    
    # Sort rules for output consistent sorting
    sorted_rule_ids = sorted(rules.keys())
    
    for rid in sorted_rule_ids:
        props = rules[rid]
        title = props.get("title", "未命名规则")
        sev = props.get("severity", "P2")
        applies_str = ", ".join(f"`{x}`" for x in props.get("applies_to", []))
        validators_str = ", ".join(f"`{x}`" for x in props.get("validators", []))
        
        # Severity HTML badge
        if sev == "P0":
            sev_badge = "<span style='background: #FFEBEE; color: #FF3B30; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;'>P0 拦截</span>"
        elif sev == "P1":
            sev_badge = "<span style='background: #FFF9E6; color: #FFB300; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;'>P1 警告</span>"
        else:
            sev_badge = "<span style='background: #E6F0FA; color: #007AFF; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;'>P2 优化</span>"
            
        md.append(f"| [{rid}](#{rid.lower()}) | {title} | {sev_badge} | {applies_str} | {validators_str} |")
        
    md.append("")
    md.append("---")
    md.append("")
    md.append("## 🛠️ 规则详细规范 (Rule Specifications)")
    md.append("")
    
    for rid in sorted_rule_ids:
        props = rules[rid]
        title = props.get("title", "未命名规则")
        sev = props.get("severity", "P2")
        sot = props.get("source_of_truth", "")
        applies = props.get("applies_to", [])
        validators = props.get("validators", [])
        fix_hint = props.get("fix_hint", "")
        actions = props.get("next_action", [])
        
        md.append(f"### <a name='{rid.lower()}'></a>🛑 {rid} - {title}")
        md.append("")
        
        # Severity block style
        if sev == "P0":
            md.append("> [!CAUTION]")
            md.append(f"> **阻断等级：P0 (HIGH BLOCKER)**")
            md.append(f"> 该规则未满足时将强制退出生成流水线，必须完成修复后方能继续。")
        elif sev == "P1":
            md.append("> [!WARNING]")
            md.append(f"> **阻断等级：P1 (MEDIUM WARNING)**")
            md.append(f"> 校验不通过将打印控制台亮黄警告，不阻断构建，但必须记录入异常日志。")
        else:
            md.append("> [!NOTE]")
            md.append(f"> **阻断等级：P2 (LOW OPTIMIZATION)**")
            md.append(f"> 属于非强约束建议项，仅做排版美观、质量审计级提示。")
            
        md.append("")
        proj_root_url = PROJECT_ROOT.replace('\\', '/')
        if not proj_root_url.startswith('/'):
            proj_root_url = '/' + proj_root_url
        md.append(f"- **单一可信源 (Source of Truth)**: [{sot}](file://{proj_root_url}/references/{sot})")
        md.append(f"- **适用检测范围 (Applies to)**: " + ", ".join(f"`{x}`" for x in applies))
        md.append(f"- **执行校验卡点 (Validators)**: " + ", ".join(f"`{x}`" for x in validators))
        md.append(f"- **下一步返工环节 (Next Action)**: " + " ➔ ".join(f"`{x}`" for x in actions))
        md.append("")
        md.append("#### 💡 诊断修复工单指引 (Fix Instruction)")
        md.append("```text")
        md.append(fix_hint)
        md.append("```")
        md.append("")
        md.append("---")
        md.append("")
        
    return "\n".join(md)

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/rule_registry.py [--validate | --render-md]")
        sys.exit(1)
        
    action = sys.argv[1]
    
    if action == "--validate":
        print("[Rule Registry] Loading rule_registry.yaml...")
        try:
            rules = parse_simple_yaml(YAML_PATH)
            errors = validate_rules(rules)
            if errors:
                print(f"\n[ERROR] [Rule Registry] Validation failed with {len(errors)} error(s):")
                for err in errors:
                    print(f"  - {err}")
                sys.exit(1)
            else:
                print(f"[OK] [Rule Registry] Validation passed perfectly! Loaded {len(rules)} rules.")
                sys.exit(0)
        except Exception as e:
            print(f"[ERROR] [Rule Registry] Error reading or parsing YAML: {str(e)}")
            sys.exit(1)
            
    elif action == "--render-md":
        print("[Rule Registry] Rendering rule_registry.md...")
        try:
            rules = parse_simple_yaml(YAML_PATH)
            errors = validate_rules(rules)
            if errors:
                print("\n[ERROR] [Rule Registry] YAML has validation errors. Cannot render Markdown.")
                for err in errors:
                    print(f"  - {err}")
                sys.exit(1)
                
            md_content = render_markdown(rules)
            with open(MD_PATH, "w", encoding="utf-8") as f:
                f.write(md_content)
            print(f"[OK] [Rule Registry] Successfully wrote markdown to: {MD_PATH}")
            sys.exit(0)
        except Exception as e:
            print(f"[ERROR] [Rule Registry] Failed to render markdown: {str(e)}")
            sys.exit(1)
    else:
        print(f"Unknown option: {action}")
        print("Usage: python scripts/rule_registry.py [--validate | --render-md]")
        sys.exit(1)

if __name__ == "__main__":
    main()
