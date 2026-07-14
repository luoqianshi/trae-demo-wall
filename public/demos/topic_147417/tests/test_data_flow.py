"""数据流测试模块。

本模块针对 HomeWizard 智能家居场景规划器项目的核心数据文件进行完整性校验，
覆盖以下数据源：

    * data/device_library.json      设备库
    * data/rule_library.json        规则库
    * data/floorplan_templates/     户型模板（一居/两居/三居）
    * config.yaml                   全局配置（AI 多引擎相关）

测试目标：
    1. 确保关键数据文件可被正确加载；
    2. 校验各数据记录的必填字段、唯一性约束及字段类型；
    3. 校验规则库与设备库之间的引用一致性；
    4. 校验配置文件中 AI 引擎相关参数的合理性。

运行方式：
    在项目根目录执行 ``pytest tests/test_data_flow.py -v -s``
    （加 ``-s`` 可查看 test_statistics 中打印的统计信息。）
"""

import json
import os
import sys

import pytest
import yaml

# 项目根目录：tests/test_data_flow.py 的上两级目录
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# 关键数据文件路径
DEVICE_LIBRARY_PATH = os.path.join(PROJECT_ROOT, "data", "device_library.json")
RULE_LIBRARY_PATH = os.path.join(PROJECT_ROOT, "data", "rule_library.json")
FLOORPLAN_DIR = os.path.join(PROJECT_ROOT, "data", "floorplan_templates")
CONFIG_PATH = os.path.join(PROJECT_ROOT, "config.yaml")

# 三套户型模板文件
FLOORPLAN_FILES = ["one_bedroom.json", "two_bedroom.json", "three_bedroom.json"]


# ----------------------------------------------------------------------
# 辅助加载函数
# ----------------------------------------------------------------------
def _load_json(file_path):
    """加载 JSON 文件并返回解析后的 Python 对象。

    :param str file_path: JSON 文件绝对路径
    :returns: 解析后的字典或列表
    :raises FileNotFoundError: 文件不存在时抛出
    :raises json.JSONDecodeError: JSON 格式错误时抛出
    """
    with open(file_path, "r", encoding="utf-8") as fp:
        return json.load(fp)


def _load_yaml(file_path):
    """使用 yaml.safe_load 加载 YAML 配置文件。

    :param str file_path: YAML 文件绝对路径
    :returns: 解析后的字典
    """
    with open(file_path, "r", encoding="utf-8") as fp:
        return yaml.safe_load(fp)


# ----------------------------------------------------------------------
# 设备库测试
# ----------------------------------------------------------------------
class TestDeviceLibrary:
    """设备库 (device_library.json) 数据完整性测试。"""

    def test_devices_loadable(self):
        """设备库可被成功加载，且顶层包含 ``devices`` 键。"""
        try:
            data = _load_json(DEVICE_LIBRARY_PATH)
        except (FileNotFoundError, json.JSONDecodeError) as exc:
            pytest.fail(f"设备库加载失败: {exc}")

        assert isinstance(data, dict), "设备库顶层结构应为字典"
        assert "devices" in data, "设备库缺少 'devices' 键"
        assert isinstance(data["devices"], list), "'devices' 应为列表"

    def test_required_fields(self):
        """每台设备都应包含必填字段：id、name、brand、category、price。"""
        data = _load_json(DEVICE_LIBRARY_PATH)
        devices = data.get("devices", [])

        required_fields = ["id", "name", "brand", "category", "price"]
        missing = []
        for idx, device in enumerate(devices):
            for field in required_fields:
                if field not in device:
                    missing.append(f"第 {idx} 台设备缺少字段 '{field}'")
        assert not missing, "存在设备缺少必填字段:\n" + "\n".join(missing)

    def test_unique_device_ids(self):
        """所有设备的 id 必须唯一，不允许重复。"""
        data = _load_json(DEVICE_LIBRARY_PATH)
        devices = data.get("devices", [])

        ids = [d.get("id") for d in devices if d.get("id") is not None]
        duplicates = {iid for iid in ids if ids.count(iid) > 1}
        assert not duplicates, f"存在重复的设备 ID: {sorted(duplicates)}"

    def test_positive_prices(self):
        """所有设备的 price 字段应为正数。"""
        data = _load_json(DEVICE_LIBRARY_PATH)
        devices = data.get("devices", [])

        invalid = []
        for idx, device in enumerate(devices):
            price = device.get("price")
            # 价格应为 int/float 且大于 0
            if not isinstance(price, (int, float)) or isinstance(price, bool):
                invalid.append(f"第 {idx} 台设备 '{device.get('id')}' 价格非数字: {price!r}")
            elif price <= 0:
                invalid.append(f"第 {idx} 台设备 '{device.get('id')}' 价格非正数: {price}")
        assert not invalid, "存在非法价格:\n" + "\n".join(invalid)

    def test_non_empty_tags(self):
        """每台设备的 tags 字段必须为非空列表。"""
        data = _load_json(DEVICE_LIBRARY_PATH)
        devices = data.get("devices", [])

        invalid = []
        for idx, device in enumerate(devices):
            tags = device.get("tags")
            if not isinstance(tags, list):
                invalid.append(f"第 {idx} 台设备 '{device.get('id')}' 的 tags 不是列表: {tags!r}")
            elif len(tags) == 0:
                invalid.append(f"第 {idx} 台设备 '{device.get('id')}' 的 tags 为空列表")
        assert not invalid, "存在设备的 tags 字段不合法:\n" + "\n".join(invalid)

    def test_gateway_has_protocol(self):
        """category 包含 '网关' 的设备必须填写 protocol 字段。"""
        data = _load_json(DEVICE_LIBRARY_PATH)
        devices = data.get("devices", [])

        invalid = []
        for device in devices:
            category = device.get("category", "")
            if isinstance(category, str) and "网关" in category:
                protocol = device.get("protocol")
                if not protocol or not isinstance(protocol, str):
                    invalid.append(
                        f"网关设备 '{device.get('id')}' 缺少有效 protocol 字段: {protocol!r}"
                    )
        assert not invalid, "存在网关设备缺少 protocol:\n" + "\n".join(invalid)

    def test_statistics(self):
        """打印设备库统计信息：总数、品类数、品牌数、场景标签数。"""
        data = _load_json(DEVICE_LIBRARY_PATH)
        devices = data.get("devices", [])

        categories = {d.get("category") for d in devices if d.get("category")}
        brands = {d.get("brand") for d in devices if d.get("brand")}
        tags = set()
        for d in devices:
            t = d.get("tags")
            if isinstance(t, list):
                tags.update(t)

        print("\n===== 设备库统计 =====")
        print(f"设备总数: {len(devices)}")
        print(f"品类数: {len(categories)} -> {sorted(categories)}")
        print(f"品牌数: {len(brands)} -> {sorted(brands)}")
        print(f"场景标签数: {len(tags)} -> {sorted(tags)}")
        print("======================")

        # 至少应有一台设备
        assert len(devices) > 0, "设备库为空"


# ----------------------------------------------------------------------
# 规则库测试
# ----------------------------------------------------------------------
class TestRuleLibrary:
    """规则库 (rule_library.json) 数据完整性测试。"""

    def test_rules_loadable(self):
        """规则库可被成功加载，且顶层包含 ``rules`` 键。"""
        try:
            data = _load_json(RULE_LIBRARY_PATH)
        except (FileNotFoundError, json.JSONDecodeError) as exc:
            pytest.fail(f"规则库加载失败: {exc}")

        assert isinstance(data, dict), "规则库顶层结构应为字典"
        assert "rules" in data, "规则库缺少 'rules' 键"
        assert isinstance(data["rules"], list), "'rules' 应为列表"

    def test_required_fields(self):
        """每条规则应包含 id、scene_name(或 category)、actions、devices 字段。"""
        data = _load_json(RULE_LIBRARY_PATH)
        rules = data.get("rules", [])

        missing = []
        for idx, rule in enumerate(rules):
            if "id" not in rule:
                missing.append(f"第 {idx} 条规则缺少 'id'")
            # scene_name 与 category 至少存在其一
            if "scene_name" not in rule and "category" not in rule:
                missing.append(f"第 {idx} 条规则缺少 'scene_name'/'category'")
            if "actions" not in rule:
                missing.append(f"第 {idx} 条规则缺少 'actions'")
            if "devices" not in rule:
                missing.append(f"第 {idx} 条规则缺少 'devices'")
        assert not missing, "存在规则缺少必填字段:\n" + "\n".join(missing)

    def test_unique_rule_ids(self):
        """所有规则的 id 必须唯一，不允许重复。"""
        data = _load_json(RULE_LIBRARY_PATH)
        rules = data.get("rules", [])

        ids = [r.get("id") for r in rules if r.get("id") is not None]
        duplicates = {rid for rid in ids if ids.count(rid) > 1}
        assert not duplicates, f"存在重复的规则 ID: {sorted(duplicates)}"

    def test_valid_categories(self):
        """每条规则的 category 字段应为非空字符串。"""
        data = _load_json(RULE_LIBRARY_PATH)
        rules = data.get("rules", [])

        invalid = []
        for idx, rule in enumerate(rules):
            category = rule.get("category")
            if not isinstance(category, str):
                invalid.append(
                    f"第 {idx} 条规则 '{rule.get('id')}' 的 category 非字符串: {category!r}"
                )
            elif category.strip() == "":
                invalid.append(f"第 {idx} 条规则 '{rule.get('id')}' 的 category 为空字符串")
        assert not invalid, "存在规则的 category 不合法:\n" + "\n".join(invalid)

    def test_device_references_exist(self):
        """规则中引用的设备短 ID 应能在设备库中找到对应设备。

        说明：规则 devices 字段使用短 ID（如 'bulb'），通过
        core.rule_engine 中的 DEVICE_ID_MAP 映射到设备库中的完整 ID。
        """
        from core.rule_engine import DEVICE_ID_MAP

        rule_data = _load_json(RULE_LIBRARY_PATH)
        device_data = _load_json(DEVICE_LIBRARY_PATH)

        rules = rule_data.get("rules", [])
        devices = device_data.get("devices", [])
        # 设备库中所有完整 ID 集合
        full_ids = {d.get("id", "") for d in devices}

        missing_refs = []
        for rule in rules:
            rule_id = rule.get("id")
            ref_devices = rule.get("devices", [])
            if not isinstance(ref_devices, list):
                continue
            for short_id in ref_devices:
                if not isinstance(short_id, str):
                    continue
                # 先通过 DEVICE_ID_MAP 映射
                mapped_id = DEVICE_ID_MAP.get(short_id, short_id)
                if mapped_id in full_ids:
                    continue
                # 再尝试子串匹配（向后兼容）
                if any(short_id in full_id for full_id in full_ids):
                    continue
                missing_refs.append(
                    f"规则 '{rule_id}' 引用了无法匹配的设备短 ID: '{short_id}'"
                )

        assert not missing_refs, (
            "存在规则引用了设备库中不存在的设备:\n" + "\n".join(missing_refs)
        )

    def test_statistics(self):
        """打印规则库统计信息：规则总数、品类数。"""
        data = _load_json(RULE_LIBRARY_PATH)
        rules = data.get("rules", [])

        categories = {r.get("category") for r in rules if r.get("category")}

        print("\n===== 规则库统计 =====")
        print(f"规则总数: {len(rules)}")
        print(f"品类数: {len(categories)} -> {sorted(categories)}")
        print("======================")

        assert len(rules) > 0, "规则库为空"


# ----------------------------------------------------------------------
# 户型模板测试
# ----------------------------------------------------------------------
class TestFloorplanTemplates:
    """户型模板 (floorplan_templates/*.json) 数据完整性测试。"""

    def test_templates_loadable(self):
        """三套户型模板文件均能被成功加载。"""
        for fname in FLOORPLAN_FILES:
            fpath = os.path.join(FLOORPLAN_DIR, fname)
            try:
                data = _load_json(fpath)
            except (FileNotFoundError, json.JSONDecodeError) as exc:
                pytest.fail(f"户型模板 '{fname}' 加载失败: {exc}")

            assert isinstance(data, dict), f"'{fname}' 顶层结构应为字典"
            # 必备元数据字段
            assert "name" in data, f"'{fname}' 缺少 'name' 字段"
            assert "rooms" in data, f"'{fname}' 缺少 'rooms' 字段"

    def test_rooms_structure(self):
        """每个模板的 rooms 数组中，房间应包含 name、x、y、width、height 字段。"""
        required_fields = ["name", "x", "y", "width", "height"]
        problems = []

        for fname in FLOORPLAN_FILES:
            fpath = os.path.join(FLOORPLAN_DIR, fname)
            data = _load_json(fpath)
            rooms = data.get("rooms")

            if not isinstance(rooms, list):
                problems.append(f"'{fname}' 的 rooms 不是列表")
                continue

            for idx, room in enumerate(rooms):
                for field in required_fields:
                    if field not in room:
                        problems.append(
                            f"'{fname}' 第 {idx} 个房间缺少字段 '{field}'"
                        )

        assert not problems, "户型模板 rooms 结构存在缺陷:\n" + "\n".join(problems)

    def test_device_positions(self):
        """每个模板的 device_positions 字段应为字典（允许为空字典）。"""
        problems = []
        for fname in FLOORPLAN_FILES:
            fpath = os.path.join(FLOORPLAN_DIR, fname)
            data = _load_json(fpath)
            dp = data.get("device_positions")

            if not isinstance(dp, dict):
                problems.append(
                    f"'{fname}' 的 device_positions 不是字典: {type(dp).__name__}"
                )
                continue
            # 允许为空字典，但仍校验内部结构（值为字典类型）
            for dev_id, pos in dp.items():
                if not isinstance(pos, dict):
                    problems.append(
                        f"'{fname}' 中 device_positions['{dev_id}'] 不是字典"
                    )

        assert not problems, "device_positions 校验失败:\n" + "\n".join(problems)


# ----------------------------------------------------------------------
# 配置文件测试
# ----------------------------------------------------------------------
class TestConfigFile:
    """配置文件 (config.yaml) 数据完整性测试。"""

    def test_config_loadable(self):
        """config.yaml 可被成功加载，且顶层为字典结构。"""
        try:
            config = _load_yaml(CONFIG_PATH)
        except FileNotFoundError as exc:
            pytest.fail(f"配置文件不存在: {exc}")
        except yaml.YAMLError as exc:
            pytest.fail(f"配置文件 YAML 解析失败: {exc}")

        assert isinstance(config, dict), "配置文件顶层结构应为字典"

    def test_ai_providers(self):
        """配置中应包含 ai.providers 段，且至少存在 deepseek 提供商。"""
        config = _load_yaml(CONFIG_PATH)

        ai_cfg = config.get("ai")
        assert isinstance(ai_cfg, dict), "配置缺少 'ai' 段或其非字典"

        providers = ai_cfg.get("providers")
        assert isinstance(providers, dict), "ai.providers 应为字典"

        assert "deepseek" in providers, "ai.providers 中缺少 'deepseek' 提供商"

    def test_timeout_reasonable(self):
        """ai.timeout 应在 5~60 秒之间的合理区间内。"""
        config = _load_yaml(CONFIG_PATH)
        ai_cfg = config.get("ai", {})

        timeout = ai_cfg.get("timeout")
        assert timeout is not None, "ai.timeout 未配置"

        assert isinstance(timeout, (int, float)) and not isinstance(timeout, bool), (
            f"ai.timeout 应为数字，实际为: {type(timeout).__name__}"
        )
        assert 5 <= timeout <= 60, (
            f"ai.timeout={timeout} 不在合理区间 [5, 60] 内"
        )
