#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HomeWizard 数据校验工具

校验 data/ 目录下的 JSON 数据文件，覆盖：
1. device_library.json     — 设备库结构、ID 唯一性、价格、标签、网关协议
2. rule_library.json       — 规则库结构、ID 唯一性、分类、设备引用
3. floorplan_templates/*.json — 户型模板结构、房间字段、设备位置映射

全部校验通过退出码 0，存在失败项退出码 1。

用法：
    python3 scripts/validate_data.py
"""

import os
import sys
import json

# ============================================
# 项目根目录 & 关键路径
# ============================================
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, 'data')
DEVICE_PATH = os.path.join(DATA_DIR, 'device_library.json')
RULE_PATH = os.path.join(DATA_DIR, 'rule_library.json')
FLOORPLAN_DIR = os.path.join(DATA_DIR, 'floorplan_templates')

# 设备必填字段
DEVICE_REQUIRED_FIELDS = ['id', 'name', 'brand', 'category', 'price']
# 规则必填字段
RULE_REQUIRED_FIELDS = ['id', 'scene_name', 'category', 'devices', 'actions']
# 房间必填字段
ROOM_REQUIRED_FIELDS = ['name', 'x', 'y', 'width', 'height']

# 全局失败计数
_fail_count = 0


# ============================================
# 通用工具
# ============================================
def load_json(path):
    """加载 JSON 文件，返回 (data, error)"""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f), None
    except FileNotFoundError:
        return None, f'文件不存在：{path}'
    except json.JSONDecodeError as e:
        return None, f'JSON 解析失败：{e}'
    except Exception as e:  # noqa: BLE001
        return None, f'加载失败：{e}'


def report(ok, msg):
    """输出校验结果并累计失败计数"""
    global _fail_count
    icon = '✅' if ok else '❌'
    print(f"  {icon} {msg}")
    if not ok:
        _fail_count += 1


def short_id_match(short_id, dev_ids):
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
# 1. 设备库校验
# ============================================
def validate_devices():
    print("\n" + "=" * 60)
    print("校验 device_library.json")
    print("=" * 60)

    data, err = load_json(DEVICE_PATH)
    if err:
        report(False, err)
        return []

    if not isinstance(data, dict) or 'devices' not in data:
        report(False, "缺少 'devices' 顶层字段")
        return []

    devices = data['devices']
    if not isinstance(devices, list):
        report(False, "'devices' 字段不是列表")
        return []

    report(True, f"共 {len(devices)} 个设备待校验")

    # 1.1 必填字段
    missing_field_count = 0
    for dev in devices:
        for field in DEVICE_REQUIRED_FIELDS:
            if not isinstance(dev, dict) or field not in dev or dev[field] in (None, ''):
                missing_field_count += 1
    if missing_field_count:
        report(False, f"必填字段缺失 {missing_field_count} 处（字段："
                       f"{', '.join(DEVICE_REQUIRED_FIELDS)}）")
    else:
        report(True, "所有设备必填字段完整（id/name/brand/category/price）")

    # 1.2 ID 唯一性
    ids = [d.get('id') for d in devices if isinstance(d, dict) and d.get('id')]
    dup = {i for i in ids if ids.count(i) > 1}
    if dup:
        report(False, f"发现重复设备 ID：{', '.join(sorted(dup))}")
    else:
        report(True, f"设备 ID 全部唯一（{len(ids)} 个）")

    # 1.3 价格为正数
    bad_price = [
        d for d in devices
        if isinstance(d, dict) and (
            not isinstance(d.get('price'), (int, float))
            or d.get('price') <= 0
        )
    ]
    if bad_price:
        report(False, f"{len(bad_price)} 个设备价格非正数或非数字")
    else:
        report(True, "所有设备价格均为正数")

    # 1.4 标签非空
    empty_tags = [
        d for d in devices
        if isinstance(d, dict)
        and (not d.get('tags') or not isinstance(d.get('tags'), list))
    ]
    if empty_tags:
        report(False, f"{len(empty_tags)} 个设备 tags 为空或非列表")
    else:
        report(True, "所有设备 tags 非空")

    # 1.5 网关设备需有 protocol 字段
    gateway_no_protocol = [
        d for d in devices
        if isinstance(d, dict)
        and d.get('category') == '网关'
        and not d.get('protocol')
    ]
    if gateway_no_protocol:
        report(False, f"{len(gateway_no_protocol)} 个网关设备缺少 protocol 字段")
    else:
        report(True, "网关设备均包含 protocol 字段")

    return ids


# ============================================
# 2. 规则库校验
# ============================================
def validate_rules(dev_ids):
    print("\n" + "=" * 60)
    print("校验 rule_library.json")
    print("=" * 60)

    data, err = load_json(RULE_PATH)
    if err:
        report(False, err)
        return

    if not isinstance(data, dict) or 'rules' not in data:
        report(False, "缺少 'rules' 顶层字段")
        return

    rules = data['rules']
    if not isinstance(rules, list):
        report(False, "'rules' 字段不是列表")
        return

    report(True, f"共 {len(rules)} 条规则待校验")

    # 2.1 必填字段
    missing_field_count = 0
    for rule in rules:
        for field in RULE_REQUIRED_FIELDS:
            if not isinstance(rule, dict) or field not in rule:
                missing_field_count += 1
    if missing_field_count:
        report(False, f"必填字段缺失 {missing_field_count} 处（字段："
                       f"{', '.join(RULE_REQUIRED_FIELDS)}）")
    else:
        report(True, "所有规则必填字段完整（id/scene_name/category/devices/actions）")

    # 2.2 ID 唯一性
    ids = [r.get('id') for r in rules if isinstance(r, dict) and r.get('id')]
    dup = {i for i in ids if ids.count(i) > 1}
    if dup:
        report(False, f"发现重复规则 ID：{', '.join(sorted(dup))}")
    else:
        report(True, f"规则 ID 全部唯一（{len(ids)} 个）")

    # 2.3 分类为有效字符串
    bad_category = [
        r for r in rules
        if isinstance(r, dict)
        and (not isinstance(r.get('category'), str) or not r.get('category'))
    ]
    if bad_category:
        report(False, f"{len(bad_category)} 条规则 category 非有效字符串")
    else:
        report(True, "所有规则 category 均为有效字符串")

    # 2.4 设备引用子串匹配
    unmatched = []
    for rule in rules:
        if not isinstance(rule, dict):
            continue
        for short_id in rule.get('devices', []) or []:
            if not short_id_match(short_id, dev_ids):
                unmatched.append((rule.get('id', ''), short_id))
    if unmatched:
        sample = ', '.join(f'{rid}->{sid}' for rid, sid in unmatched[:5])
        report(False, f"{len(unmatched)} 个设备引用无法子串匹配设备库（如 {sample}）")
    else:
        report(True, "所有规则设备引用均可在设备库中子串匹配")


# ============================================
# 3. 户型模板校验
# ============================================
def validate_floorplans():
    print("\n" + "=" * 60)
    print("校验 floorplan_templates/*.json")
    print("=" * 60)

    if not os.path.isdir(FLOORPLAN_DIR):
        report(False, f"户型模板目录不存在：{FLOORPLAN_DIR}")
        return

    files = sorted(f for f in os.listdir(FLOORPLAN_DIR) if f.endswith('.json'))
    if not files:
        report(False, "户型模板目录下未找到 JSON 文件")
        return

    report(True, f"共发现 {len(files)} 个户型模板文件")

    for fname in files:
        fpath = os.path.join(FLOORPLAN_DIR, fname)
        _validate_one_floorplan(fname, fpath)


def _validate_one_floorplan(fname, fpath):
    """校验单个户型模板文件"""
    print(f"\n  ▶ {fname}")
    data, err = load_json(fpath)
    if err:
        report(False, err)
        return

    if not isinstance(data, dict):
        report(False, f"{fname}：顶层结构不是字典")
        return

    # 3.1 rooms 数组
    rooms = data.get('rooms')
    if not isinstance(rooms, list):
        report(False, f"{fname}：缺少 'rooms' 数组")
        rooms = []
    else:
        report(True, f"{fname}：rooms 数组存在（{len(rooms)} 个房间）")

    # 3.2 房间必填字段
    bad_rooms = []
    for room in rooms:
        if not isinstance(room, dict):
            bad_rooms.append('非字典')
            continue
        for field in ROOM_REQUIRED_FIELDS:
            if field not in room:
                bad_rooms.append(f"{room.get('name', '?')} 缺 {field}")
                break
    if bad_rooms:
        report(False, f"{fname}：{len(bad_rooms)} 个房间字段不完整（{bad_rooms[:3]}）")
    else:
        report(True, f"{fname}：所有房间字段完整（name/x/y/width/height）")

    # 3.3 device_positions 为字典
    dp = data.get('device_positions')
    if not isinstance(dp, dict):
        report(False, f"{fname}：'device_positions' 不是字典")
    else:
        report(True, f"{fname}：device_positions 为字典（{len(dp)} 项）")


# ============================================
# 主入口
# ============================================
def main():
    print("=" * 60)
    print("HomeWizard 数据校验工具")
    print(f"项目根目录：{PROJECT_ROOT}")
    print("=" * 60)

    # 设备库校验，返回设备 ID 列表供规则库校验引用
    dev_ids = validate_devices()
    validate_rules(dev_ids)
    validate_floorplans()

    # 汇总
    print("\n" + "=" * 60)
    if _fail_count == 0:
        print("✅ 全部校验通过")
        sys.exit(0)
    else:
        print(f"❌ 校验完成，共 {_fail_count} 项失败")
        sys.exit(1)


if __name__ == '__main__':
    main()
