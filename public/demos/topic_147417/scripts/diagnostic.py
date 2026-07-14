#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HomeWizard 项目诊断工具

从数据完整性、规则匹配、性能、环境四个维度检查项目健康状态，
运行结束后在 REPORTS/DIAGNOSTIC_REPORT.md 生成 Markdown 诊断报告。

用法：
    python3 scripts/diagnostic.py
"""

import os
import sys
import json
import time
import platform
import importlib
from datetime import datetime
from unittest.mock import MagicMock

# ============================================
# 项目根目录 & 路径注入
# ============================================
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

# ============================================
# Mock streamlit（router 内部依赖 session_state）
# ============================================
mock_st = MagicMock()
mock_st.session_state = {
    'selected_floorplan': '三室一厅',
    'selected_budget_tier': '平衡',
    'use_ai': False,
}
sys.modules.setdefault('streamlit', mock_st)

# PyYAML 用于解析 config.yaml
try:
    import yaml
    _HAS_YAML = True
except ImportError:
    _HAS_YAML = False

# 导入项目核心模块
try:
    from core.rule_engine import (
        load_rules, load_devices, match_by_rules, match_rules_by_keywords,
    )
    from core.router import keyword_extraction, generate_plan_local
    _CORE_OK = True
    _CORE_ERR = ''
except Exception as _e:  # noqa: BLE001
    _CORE_OK = False
    _CORE_ERR = repr(_e)

try:
    from constants import RULE_CATEGORIES
except Exception:  # noqa: BLE001
    RULE_CATEGORIES = {}

# 常用路径
DATA_DIR = os.path.join(PROJECT_ROOT, 'data')
FLOORPLAN_DIR = os.path.join(DATA_DIR, 'floorplan_templates')
DEVICE_PATH = os.path.join(DATA_DIR, 'device_library.json')
RULE_PATH = os.path.join(DATA_DIR, 'rule_library.json')
CONFIG_PATH = os.path.join(PROJECT_ROOT, 'config.yaml')
REQUIREMENTS_PATH = os.path.join(PROJECT_ROOT, 'requirements.txt')
REPORT_DIR = os.path.join(PROJECT_ROOT, 'REPORTS')
REPORT_PATH = os.path.join(REPORT_DIR, 'DIAGNOSTIC_REPORT.md')

# 状态图标
ICON = {'pass': '✅', 'warn': '⚠️', 'fail': '❌'}


# ============================================
# 通用工具函数
# ============================================
def log(icon, msg):
    """带图标的控制台输出"""
    print(f"  {icon} {msg}")


def load_json_safe(path):
    """安全加载 JSON 文件，返回 (data, error)"""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f), None
    except FileNotFoundError:
        return None, f'文件不存在：{path}'
    except json.JSONDecodeError as e:
        return None, f'JSON 解析失败：{e}'
    except Exception as e:  # noqa: BLE001
        return None, f'加载失败：{e}'


# ============================================
# 结果收集器
# ============================================
class DiagResult:
    """收集诊断结果，用于控制台输出与报告生成"""

    def __init__(self):
        self.data_checks = []        # (检查项, 状态, 详情)
        self.rule_checks = []        # (测试用例, 预期, 实际, 状态)
        self.env_checks = []         # (检查项, 状态, 详情)
        self.perf = {}               # 指标名 -> 毫秒
        self.issues = []             # (级别, 描述)
        self.recommendations = []

    def add_data(self, item, status, detail):
        self.data_checks.append((item, status, detail))
        self._record_issue(status, item, detail)

    def add_rule(self, case, expected, actual, status):
        self.rule_checks.append((case, expected, actual, status))
        self._record_issue(status, case, actual)

    def add_env(self, item, status, detail):
        self.env_checks.append((item, status, detail))
        self._record_issue(status, item, detail)

    def add_perf(self, name, ms):
        self.perf[name] = ms

    def _record_issue(self, status, item, detail):
        if status == 'fail':
            self.issues.append(('fail', f'{item}：{detail}'))
        elif status == 'warn':
            self.issues.append(('warn', f'{item}：{detail}'))

    def all_status(self):
        """返回所有检查状态列表，用于健康度计算"""
        statuses = [s for _, s, _ in self.data_checks]
        statuses += [s for _, _, _, s in self.rule_checks]
        statuses += [s for _, s, _ in self.env_checks]
        return statuses

    def health_score(self):
        """整体健康度：pass=1.0 / warn=0.5 / fail=0"""
        statuses = self.all_status()
        if not statuses:
            return 0
        weight = {'pass': 1.0, 'warn': 0.5, 'fail': 0.0}
        total = sum(weight.get(s, 0.0) for s in statuses)
        return round(total / len(statuses) * 100)


RESULT = DiagResult()


# ============================================
# 1. 数据完整性诊断
# ============================================
def check_data_integrity():
    print("\n" + "=" * 60)
    print("1. 数据完整性诊断")
    print("=" * 60)

    # 1.1 设备库加载
    dev_data, err = load_json_safe(DEVICE_PATH)
    if err:
        log(ICON['fail'], f"设备库加载失败：{err}")
        RESULT.add_data('设备库加载', 'fail', err)
        devices = []
    else:
        devices = dev_data.get('devices', []) if isinstance(dev_data, dict) else []
        log(ICON['pass'], f"设备库加载成功，共 {len(devices)} 个设备")
        RESULT.add_data('设备库加载', 'pass', f'{len(devices)} 个设备')

    # 1.2 规则库加载
    rule_data, err = load_json_safe(RULE_PATH)
    if err:
        log(ICON['fail'], f"规则库加载失败：{err}")
        RESULT.add_data('规则库加载', 'fail', err)
        rules = []
    else:
        rules = rule_data.get('rules', []) if isinstance(rule_data, dict) else []
        log(ICON['pass'], f"规则库加载成功，共 {len(rules)} 条规则")
        RESULT.add_data('规则库加载', 'pass', f'{len(rules)} 条规则')

    # 1.3 户型模板加载
    floorplan_files = []
    if os.path.isdir(FLOORPLAN_DIR):
        floorplan_files = sorted(
            f for f in os.listdir(FLOORPLAN_DIR) if f.endswith('.json')
        )
    fp_ok_count = 0
    fp_err_msgs = []
    for fname in floorplan_files:
        fpath = os.path.join(FLOORPLAN_DIR, fname)
        _, err = load_json_safe(fpath)
        if err:
            fp_err_msgs.append(f'{fname}: {err}')
        else:
            fp_ok_count += 1
    if not floorplan_files:
        log(ICON['fail'], "户型模板目录为空或不存在")
        RESULT.add_data('户型模板加载', 'fail', '未找到户型模板文件')
    elif fp_err_msgs:
        log(ICON['warn'], f"户型模板 {fp_ok_count}/{len(floorplan_files)} 加载成功，"
            f"{len(fp_err_msgs)} 个失败")
        RESULT.add_data('户型模板加载', 'warn',
                        f'{fp_ok_count}/{len(floorplan_files)} 成功')
    else:
        log(ICON['pass'], f"户型模板全部加载成功，共 {fp_ok_count} 个")
        RESULT.add_data('户型模板加载', 'pass', f'{fp_ok_count} 个模板')

    # 1.4 设备 ID 唯一性
    dev_ids = [d.get('id') for d in devices if isinstance(d, dict) and d.get('id')]
    dup_ids = {i for i in dev_ids if dev_ids.count(i) > 1}
    if dup_ids:
        log(ICON['fail'], f"发现重复设备 ID：{', '.join(sorted(dup_ids))}")
        RESULT.add_data('设备 ID 唯一性', 'fail', f'重复 {len(dup_ids)} 个')
    else:
        log(ICON['pass'], "设备 ID 全部唯一")
        RESULT.add_data('设备 ID 唯一性', 'pass', f'{len(dev_ids)} 个唯一 ID')

    # 1.5 设备价格为正
    bad_price = [
        d for d in devices
        if isinstance(d, dict) and (
            not isinstance(d.get('price'), (int, float))
            or d.get('price') <= 0
        )
    ]
    if bad_price:
        log(ICON['fail'], f"发现 {len(bad_price)} 个设备价格非正数")
        RESULT.add_data('设备价格检查', 'fail', f'{len(bad_price)} 个异常')
    else:
        log(ICON['pass'], "所有设备价格均为正数")
        RESULT.add_data('设备价格检查', 'pass', f'{len(devices)} 个正常')

    # 1.6 规则设备引用（短 ID 通过子串匹配设备库）
    all_dev_ids = [d.get('id', '') for d in devices if isinstance(d, dict)]
    unmatched_refs = []
    total_refs = 0
    for rule in rules:
        if not isinstance(rule, dict):
            continue
        for short_id in rule.get('devices', []) or []:
            total_refs += 1
            matched = _short_id_match(short_id, all_dev_ids)
            if not matched:
                unmatched_refs.append((rule.get('id', ''), short_id))
    if unmatched_refs:
        sample = ', '.join(
            f'{rid}->{sid}' for rid, sid in unmatched_refs[:5]
        )
        log(ICON['warn'], f"规则设备引用 {total_refs - len(unmatched_refs)}/{total_refs} "
            f"可匹配；{len(unmatched_refs)} 个短 ID 无法通过子串匹配设备库（如 {sample}）")
        RESULT.add_data('规则设备引用', 'warn',
                        f'{len(unmatched_refs)} 个未匹配')
    else:
        log(ICON['pass'], f"规则设备引用全部可匹配设备库（{total_refs} 个引用）")
        RESULT.add_data('规则设备引用', 'pass', f'{total_refs} 个全部匹配')

    # 1.7 计数汇总
    log(ICON['pass'], f"数据汇总：设备 {len(devices)} / 规则 {len(rules)} / "
        f"户型模板 {fp_ok_count}")
    RESULT.add_data('数据计数汇总', 'pass',
                    f'设备 {len(devices)} / 规则 {len(rules)} / 户型 {fp_ok_count}')

    return devices, rules


def _short_id_match(short_id, dev_ids):
    """短 ID 与设备库 ID 的子串匹配（双向，大小写不敏感）"""
    if not short_id or not dev_ids:
        return False
    sid = str(short_id).lower()
    for did in dev_ids:
        did_l = str(did).lower()
        if sid in did_l or did_l in sid:
            return True
    return False


# ============================================
# 2. 规则匹配诊断
# ============================================
def check_rule_matching():
    print("\n" + "=" * 60)
    print("2. 规则匹配诊断")
    print("=" * 60)

    if not _CORE_OK:
        log(ICON['fail'], f"核心模块导入失败，跳过规则匹配诊断：{_CORE_ERR}")
        RESULT.add_rule('核心模块导入', '模块可用', f'导入失败：{_CORE_ERR}', 'fail')
        return

    test_cases = [
        ("客厅安防摄像头", "返回有效方案（含设备列表）"),
        ("卧室灯光控制", "返回有效方案（含设备列表）"),
    ]

    for user_input, expected in test_cases:
        print(f"\n  ▶ 测试输入：{user_input}")
        # 2.1 关键词提取
        try:
            keywords = keyword_extraction(user_input)
        except Exception as e:  # noqa: BLE001
            keywords = []
            log(ICON['warn'], f"关键词提取异常：{e}")
        log(ICON['pass'], f"提取关键词：{keywords}")

        # 2.2 规则匹配过程（基于关键词的匹配度评分）
        try:
            scored = match_rules_by_keywords(keywords)
        except Exception as e:  # noqa: BLE001
            scored = []
            log(ICON['warn'], f"规则评分异常：{e}")
        if scored:
            log(ICON['pass'], "规则匹配过程（Top 5）：")
            for item in scored[:5]:
                rule = item.get('rule', {})
                log(ICON['pass'],
                    f"  · [{item.get('match_score', 0):.2f}] "
                    f"{rule.get('scene_name', rule.get('id', '?'))} "
                    f"命中关键词 {item.get('matched_keywords', [])}")
        else:
            log(ICON['warn'], "未匹配到任何规则（关键词维度）")

        # 2.3 规则引擎最终结果
        try:
            plan = match_by_rules(user_input, 3000)
        except Exception as e:  # noqa: BLE001
            plan = None
            log(ICON['warn'], f"match_by_rules 异常：{e}")

        if plan and plan.get('devices'):
            scene = plan.get('scene_name', '未命名场景')
            dev_count = len(plan.get('devices', []))
            total = sum(d.get('price', 0) for d in plan.get('devices', []))
            actual = f"命中规则「{scene}」，{dev_count} 个设备，总价 ¥{total}"
            log(ICON['pass'], f"match_by_rules 结果：{actual}")
            RESULT.add_rule(user_input, expected, actual, 'pass')
        else:
            # 2.4 兜底方案生成
            try:
                fb_plan = generate_plan_local(user_input, budget=3000)
            except Exception as e:  # noqa: BLE001
                fb_plan = None
                log(ICON['warn'], f"generate_plan_local 异常：{e}")
            if fb_plan and fb_plan.get('devices'):
                scene = fb_plan.get('scene_name', '未命名场景')
                dev_count = len(fb_plan.get('devices', []))
                total = sum(
                    d.get('price', 0) for d in fb_plan.get('devices', [])
                )
                actual = (f"规则未直接命中，走兜底方案「{scene}」，"
                          f"{dev_count} 个设备，总价 ¥{total}")
                log(ICON['warn'], f"最终方案：{actual}")
                RESULT.add_rule(user_input, expected, actual, 'warn')
            else:
                actual = "未生成有效方案"
                log(ICON['fail'], actual)
                RESULT.add_rule(user_input, expected, actual, 'fail')


# ============================================
# 3. 性能诊断
# ============================================
def check_performance():
    print("\n" + "=" * 60)
    print("3. 性能诊断")
    print("=" * 60)

    if not _CORE_OK:
        log(ICON['fail'], f"核心模块导入失败，跳过性能诊断：{_CORE_ERR}")
        return

    # 3.1 JSON 加载耗时
    try:
        import core.rule_engine as re_mod
        re_mod._rules_cache = None
        re_mod._devices_cache = None
    except Exception:  # noqa: BLE001
        pass
    t0 = time.perf_counter()
    load_devices()
    load_rules()
    json_ms = round((time.perf_counter() - t0) * 1000, 2)
    log(ICON['pass'], f"JSON 加载耗时：{json_ms} ms")
    RESULT.add_perf('JSON 加载', json_ms)

    # 3.2 规则匹配耗时
    t0 = time.perf_counter()
    try:
        match_by_rules("客厅安防摄像头", 3000)
    except Exception:  # noqa: BLE001
        pass
    match_ms = round((time.perf_counter() - t0) * 1000, 2)
    log(ICON['pass'], f"规则匹配耗时：{match_ms} ms")
    RESULT.add_perf('规则匹配', match_ms)

    # 3.3 方案生成耗时
    t0 = time.perf_counter()
    try:
        generate_plan_local("客厅安防摄像头", budget=3000)
    except Exception:  # noqa: BLE001
        pass
    plan_ms = round((time.perf_counter() - t0) * 1000, 2)
    log(ICON['pass'], f"方案生成耗时：{plan_ms} ms")
    RESULT.add_perf('方案生成', plan_ms)

    # 性能阈值告警
    if json_ms > 100:
        RESULT.issues.append(('warn', f'JSON 加载较慢：{json_ms} ms'))
    if plan_ms > 500:
        RESULT.issues.append(('warn', f'方案生成较慢：{plan_ms} ms'))


# ============================================
# 4. 环境诊断
# ============================================
def check_environment():
    print("\n" + "=" * 60)
    print("4. 环境诊断")
    print("=" * 60)

    # 4.1 Python 版本
    py_ver = platform.python_version()
    try:
        major, minor = sys.version_info[:2]
        if (major, minor) >= (3, 10):
            log(ICON['pass'], f"Python 版本：{py_ver}（≥3.10 推荐）")
            RESULT.add_env('Python 版本', 'pass', py_ver)
        else:
            log(ICON['warn'], f"Python 版本：{py_ver}（建议升级至 3.10+）")
            RESULT.add_env('Python 版本', 'warn', f'{py_ver} < 3.10')
    except Exception:  # noqa: BLE001
        log(ICON['warn'], f"Python 版本检测异常：{py_ver}")
        RESULT.add_env('Python 版本', 'warn', py_ver)

    # 4.2 核心模块导入
    if _CORE_OK:
        log(ICON['pass'], "核心模块（core.rule_engine / core.router）导入正常")
        RESULT.add_env('核心模块导入', 'pass', '正常')
    else:
        log(ICON['fail'], f"核心模块导入失败：{_CORE_ERR}")
        RESULT.add_env('核心模块导入', 'fail', _CORE_ERR)

    # 4.3 requirements.txt 依赖检查
    check_dependencies()

    # 4.4 config.yaml
    check_config()

    # 4.5 API Key 配置
    check_api_keys()


def check_dependencies():
    """检查 requirements.txt 中声明的依赖是否已安装"""
    if not os.path.isfile(REQUIREMENTS_PATH):
        log(ICON['fail'], "requirements.txt 不存在")
        RESULT.add_env('依赖清单', 'fail', 'requirements.txt 缺失')
        return

    # 包名 → 导入名映射
    import_map = {
        'streamlit': 'streamlit',
        'python-dotenv': 'dotenv',
        'openpyxl': 'openpyxl',
        'pandas': 'pandas',
        'python-dateutil': 'dateutil',
    }
    missing = []
    installed = []
    for pkg, mod_name in import_map.items():
        try:
            importlib.import_module(mod_name)
            installed.append(pkg)
        except ImportError:
            missing.append(pkg)

    # PyYAML 是诊断工具自身依赖，一并检查
    if _HAS_YAML:
        installed.append('PyYAML')
    else:
        missing.append('PyYAML')

    if missing:
        log(ICON['warn'], f"缺失依赖：{', '.join(missing)}")
        RESULT.add_env('依赖安装', 'warn', f'缺失 {len(missing)} 个：{", ".join(missing)}')
    else:
        log(ICON['pass'], f"requirements 依赖全部已安装（{len(installed)} 个）")
        RESULT.add_env('依赖安装', 'pass', f'{len(installed)} 个已安装')


def check_config():
    """检查 config.yaml 是否存在且可解析"""
    if not os.path.isfile(CONFIG_PATH):
        log(ICON['fail'], "config.yaml 不存在")
        RESULT.add_env('config.yaml', 'fail', '文件缺失')
        return
    if not _HAS_YAML:
        log(ICON['warn'], "config.yaml 存在，但未安装 PyYAML 无法解析")
        RESULT.add_env('config.yaml', 'warn', 'PyYAML 未安装')
        return
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            cfg = yaml.safe_load(f)
        if isinstance(cfg, dict):
            ai_enabled = cfg.get('ai', {}).get('enabled', False)
            log(ICON['pass'], f"config.yaml 解析正常（ai.enabled={ai_enabled}）")
            RESULT.add_env('config.yaml', 'pass', '解析正常')
        else:
            log(ICON['warn'], "config.yaml 内容非字典结构")
            RESULT.add_env('config.yaml', 'warn', '结构异常')
    except yaml.YAMLError as e:
        log(ICON['fail'], f"config.yaml 解析失败：{e}")
        RESULT.add_env('config.yaml', 'fail', str(e))
    except Exception as e:  # noqa: BLE001
        log(ICON['fail'], f"config.yaml 读取异常：{e}")
        RESULT.add_env('config.yaml', 'fail', str(e))


def check_api_keys():
    """检查常见 AI Provider 的 API Key 环境变量是否配置"""
    env_keys = [
        'DEEPSEEK_API_KEY',
        'DASHSCOPE_API_KEY',
        'ZHIPU_API_KEY',
        'MOONSHOT_API_KEY',
        'OPENAI_API_KEY',
        'ARK_API_KEY',
    ]
    configured = [k for k in env_keys if os.environ.get(k)]
    if configured:
        log(ICON['pass'], f"已配置 API Key：{', '.join(configured)}")
        RESULT.add_env('API Key 配置', 'pass', f'{len(configured)} 个已配置')
    else:
        log(ICON['warn'], "未检测到任何 AI Provider 的 API Key 环境变量"
            "（本地规则模式仍可使用）")
        RESULT.add_env('API Key 配置', 'warn', '未配置，仅本地模式可用')


# ============================================
# 5. 报告生成
# ============================================
def generate_recommendations():
    """根据问题列表生成建议"""
    recs = []
    issue_descs = [d for _, d in RESULT.issues]
    has_fail = any(lvl == 'fail' for lvl, _ in RESULT.issues)
    has_warn = any(lvl == 'warn' for lvl, _ in RESULT.issues)

    if not _HAS_YAML:
        recs.append('安装 PyYAML 以支持 config.yaml 解析：`pip install pyyaml`')
    if not _CORE_OK:
        recs.append('修复核心模块导入错误，确保 core/ 目录结构与依赖完整')
    if any('依赖安装' in d and '缺失' in d for d in issue_descs):
        recs.append('补齐缺失的 Python 依赖：`pip install -r requirements.txt`')
    if any('规则设备引用' in d for d in issue_descs):
        recs.append('检查 rule_library.json 中无法匹配设备库的短 ID，'
                    '确认 DEVICE_ID_MAP 映射或补全设备库')
    if any('API Key' in d for d in issue_descs):
        recs.append('如需使用 AI 增强，配置对应 Provider 的 API Key 环境变量')
    if any('Python 版本' in d for d in issue_descs):
        recs.append('将 Python 升级至 3.10 及以上版本以获得更好兼容性')
    if RESULT.perf.get('方案生成', 0) > 500:
        recs.append('方案生成耗时偏高，可考虑优化规则索引或缓存策略')
    if not has_fail and not has_warn:
        recs.append('项目状态良好，建议定期运行本诊断工具以持续监控')
    if not recs:
        recs.append('暂无额外建议，保持现有规范即可')
    RESULT.recommendations = recs


def render_report():
    """渲染 Markdown 诊断报告并写入文件"""
    os.makedirs(REPORT_DIR, exist_ok=True)
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    lines = []
    lines.append("# HomeWizard 诊断报告\n")
    lines.append(f"生成时间：{now}\n")

    # 1. 数据完整性
    lines.append("## 1. 数据完整性检查\n")
    lines.append("| 检查项 | 状态 | 详情 |")
    lines.append("|--------|------|------|")
    for item, status, detail in RESULT.data_checks:
        lines.append(f"| {item} | {ICON[status]} | {detail} |")
    lines.append("")

    # 2. 规则引擎
    lines.append("## 2. 规则引擎验证\n")
    lines.append("| 测试用例 | 预期结果 | 实际结果 | 状态 |")
    lines.append("|----------|----------|----------|------|")
    for case, expected, actual, status in RESULT.rule_checks:
        lines.append(f"| {case} | {expected} | {actual} | {ICON[status]} |")
    lines.append("")

    # 3. 性能指标
    lines.append("## 3. 性能指标\n")
    for name, ms in RESULT.perf.items():
        lines.append(f"- {name}：{ms}ms")
    lines.append("")

    # 4. 问题列表
    lines.append("## 4. 问题列表\n")
    if RESULT.issues:
        # 错误优先，再警告
        ordered = sorted(RESULT.issues, key=lambda x: 0 if x[0] == 'fail' else 1)
        for idx, (lvl, desc) in enumerate(ordered, 1):
            icon = ICON[lvl]
            label = '错误' if lvl == 'fail' else '警告'
            lines.append(f"{idx}. {icon} {label}：{desc}")
    else:
        lines.append("无问题")
    lines.append("")

    # 5. 建议
    lines.append("## 5. 建议\n")
    for rec in RESULT.recommendations:
        lines.append(f"- {rec}")
    lines.append("")

    # 6. 整体健康度
    score = RESULT.health_score()
    lines.append("## 6. 整体健康度\n")
    lines.append(f"**{score}%**\n")

    content = "\n".join(lines)
    try:
        with open(REPORT_PATH, 'w', encoding='utf-8') as f:
            f.write(content)
        log(ICON['pass'], f"诊断报告已生成：{REPORT_PATH}")
    except Exception as e:  # noqa: BLE001
        log(ICON['fail'], f"报告写入失败：{e}")


# ============================================
# 主入口
# ============================================
def main():
    print("=" * 60)
    print("HomeWizard 项目诊断工具")
    print(f"项目根目录：{PROJECT_ROOT}")
    print(f"运行时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # 依次执行四项诊断
    check_data_integrity()
    check_rule_matching()
    check_performance()
    check_environment()

    # 生成建议与报告
    generate_recommendations()

    print("\n" + "=" * 60)
    print("5. 报告生成")
    print("=" * 60)
    render_report()

    # 控制台汇总
    score = RESULT.health_score()
    print("\n" + "=" * 60)
    print(f"诊断完成，整体健康度：{score}%")
    print(f"详细报告：{REPORT_PATH}")
    print("=" * 60)


if __name__ == '__main__':
    main()
