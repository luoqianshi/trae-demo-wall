"""
后端 API 冒烟测试脚本
测试核心接口是否正常工作
用法: python tests/test_api.py
环境要求: 后端服务已启动在 http://127.0.0.1:8964
"""

import sys
import time
import requests

BASE_URL = "http://127.0.0.1:8964/api"
TIMEOUT = 10

# 颜色输出
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RESET = "\033[0m"

_test_note_id = None
_test_tag_id = None
_test_folder_id = None


def log_pass(msg):
    print(f"  {GREEN}PASS{RESET} {msg}")


def log_fail(msg):
    print(f"  {RED}FAIL{RESET} {msg}")


def log_info(msg):
    print(f"  {YELLOW}INFO{RESET} {msg}")


def _req(method, path, **kwargs):
    """统一请求包装"""
    url = f"{BASE_URL}{path}"
    kwargs.setdefault("timeout", TIMEOUT)
    try:
        resp = requests.request(method, url, **kwargs)
        return resp
    except requests.exceptions.ConnectionError as e:
        log_fail(f"无法连接后端: {e}")
        return None
    except Exception as e:
        log_fail(f"请求异常: {e}")
        return None


def test_health():
    """健康检查"""
    print("\n[1/8] 系统健康检查")
    resp = _req("GET", "/health")
    if resp is None:
        return False
    if resp.status_code == 200:
        log_pass(f"健康检查通过: {resp.json()}")
        return True
    else:
        log_fail(f"健康检查失败: HTTP {resp.status_code}")
        return False


def test_frontend_served():
    """首页 HTML 是否可访问"""
    print("\n[2/8] 首页服务检查")
    try:
        resp = requests.get("http://127.0.0.1:8964/", timeout=TIMEOUT)
        if resp.status_code == 200 and "进化镜" in resp.text:
            log_pass("首页 HTML 正常返回")
            return True
        else:
            log_fail(f"首页异常: HTTP {resp.status_code}")
            return False
    except Exception as e:
        log_fail(f"首页请求失败: {e}")
        return False


def test_note_crud():
    """笔记 CRUD 全流程"""
    global _test_note_id
    print("\n[3/8] 笔记 CRUD 测试")
    all_ok = True

    # Create
    resp = _req("POST", "/notes/", json={
        "title": "冒烟测试笔记",
        "content": "# Markdown 测试\n\n这是**加粗**文字。\n\n- 列表1\n- 列表2",
        "note_type": "note"
    })
    if resp is None or resp.status_code != 200:
        log_fail(f"创建笔记失败: HTTP {resp.status_code if resp else 'N/A'}")
        return False
    data = resp.json()
    _test_note_id = data["id"]
    log_pass(f"创建笔记成功: {_test_note_id}")

    # Read
    resp = _req("GET", f"/notes/{_test_note_id}")
    if resp is None or resp.status_code != 200:
        log_fail(f"读取笔记失败: HTTP {resp.status_code if resp else 'N/A'}")
        all_ok = False
    else:
        data = resp.json()
        if data["title"] == "冒烟测试笔记" and "加粗" in data["content"]:
            log_pass("读取笔记内容正确")
        else:
            log_fail("读取笔记内容不匹配")
            all_ok = False

    # Update
    resp = _req("PUT", f"/notes/{_test_note_id}", json={
        "title": "已更新的标题",
        "content": "更新后的内容"
    })
    if resp is None or resp.status_code != 200:
        log_fail(f"更新笔记失败: HTTP {resp.status_code if resp else 'N/A'}")
        all_ok = False
    else:
        data = resp.json()
        if data["title"] == "已更新的标题":
            log_pass("更新笔记成功")
        else:
            log_fail("更新后标题不匹配")
            all_ok = False

    # List
    resp = _req("GET", "/notes/")
    if resp is None or resp.status_code != 200:
        log_fail(f"获取列表失败: HTTP {resp.status_code if resp else 'N/A'}")
        all_ok = False
    else:
        data = resp.json()
        items = data.get("items", [])
        if any(n["id"] == _test_note_id for n in items):
            log_pass(f"列表中包含测试笔记 (共 {len(items)} 条)")
        else:
            log_fail("列表中未找到测试笔记")
            all_ok = False

    return all_ok


def test_folder_crud():
    """文件夹 CRUD"""
    global _test_folder_id
    print("\n[4/8] 文件夹 CRUD 测试")
    all_ok = True

    resp = _req("POST", "/folders/", json={"name": "测试文件夹"})
    if resp is None or resp.status_code != 200:
        log_fail(f"创建文件夹失败: HTTP {resp.status_code if resp else 'N/A'}")
        return False
    data = resp.json()
    _test_folder_id = data["id"]
    log_pass(f"创建文件夹成功: {_test_folder_id}")

    resp = _req("GET", "/folders/")
    if resp is None or resp.status_code != 200:
        log_fail(f"获取文件夹列表失败")
        all_ok = False
    else:
        log_pass("获取文件夹列表成功")

    return all_ok


def test_tag_crud():
    """标签 CRUD"""
    global _test_tag_id
    print("\n[5/8] 标签 CRUD 测试")
    all_ok = True

    resp = _req("POST", "/tags/", json={"name": "测试标签", "color": "#0D7377"})
    if resp is None or resp.status_code != 200:
        log_fail(f"创建标签失败: HTTP {resp.status_code if resp else 'N/A'}")
        return False
    data = resp.json()
    _test_tag_id = data["id"]
    log_pass(f"创建标签成功: {_test_tag_id}")

    # 给笔记添加标签
    if _test_note_id and _test_tag_id:
        resp = _req("POST", f"/notes/{_test_note_id}/tags", json={"tag_id": _test_tag_id})
        if resp and resp.status_code == 200:
            log_pass("给笔记添加标签成功")
        else:
            log_fail("给笔记添加标签失败")
            all_ok = False

    resp = _req("GET", "/tags/")
    if resp is None or resp.status_code != 200:
        log_fail("获取标签列表失败")
        all_ok = False
    else:
        log_pass("获取标签列表成功")

    return all_ok


def test_stats():
    """统计接口"""
    print("\n[6/8] 统计接口测试")
    resp = _req("GET", "/notes/stats/overview")
    if resp is None or resp.status_code != 200:
        log_fail(f"获取统计失败: HTTP {resp.status_code if resp else 'N/A'}")
        return False
    data = resp.json()
    total = data.get("total", 0)
    log_pass(f"统计接口正常 (总笔记数: {total})")
    return True


def test_ai_asr_status():
    """AI 和 ASR 状态接口"""
    print("\n[7/8] AI/ASR 状态检查")
    all_ok = True

    resp = _req("GET", "/ai/status")
    if resp and resp.status_code == 200:
        data = resp.json()
        configured = data.get("configured", False)
        log_pass(f"AI 状态: {'已配置' if configured else '未配置'}")
    else:
        log_fail("AI 状态接口异常")
        all_ok = False

    resp = _req("GET", "/asr/status")
    if resp and resp.status_code == 200:
        data = resp.json()
        available = data.get("available", False)
        log_pass(f"ASR 状态: {'可用' if available else '不可用'}")
    else:
        log_fail("ASR 状态接口异常")
        all_ok = False

    return all_ok


def test_settings():
    """设置接口"""
    print("\n[8/9] 设置接口测试")
    resp = _req("GET", "/settings/all")
    if resp is None or resp.status_code != 200:
        log_fail(f"获取设置失败: HTTP {resp.status_code if resp else 'N/A'}")
        return False
    log_pass("设置接口正常")
    return True


def test_wiki_links():
    """双链功能测试"""
    print("\n[9/9] 双链功能测试")
    all_ok = True

    # 创建目标笔记
    resp = _req("POST", "/notes/", json={
        "title": "双链测试-目标",
        "content": "目标笔记内容",
        "note_type": "note"
    })
    if resp is None or resp.status_code != 200:
        log_fail("创建目标笔记失败")
        return False
    target_id = resp.json()["id"]
    log_pass(f"创建目标笔记: {target_id}")

    # 创建源笔记，包含双链
    resp = _req("POST", "/notes/", json={
        "title": "双链测试-源",
        "content": "引用了[[双链测试-目标]]的内容",
        "note_type": "note"
    })
    if resp is None or resp.status_code != 200:
        log_fail("创建源笔记失败")
        _req("DELETE", f"/notes/{target_id}")
        return False
    source_id = resp.json()["id"]
    log_pass(f"创建源笔记: {source_id}")

    # 查询反向链接
    resp = _req("GET", f"/notes/{target_id}/backlinks")
    if resp is None or resp.status_code != 200:
        log_fail("获取反向链接失败")
        all_ok = False
    else:
        data = resp.json()
        items = data.get("items", [])
        if len(items) == 1 and items[0]["source_note_id"] == source_id:
            log_pass(f"反向链接正确: {len(items)} 条")
        else:
            log_fail(f"反向链接不匹配: 期望 1 条，实际 {len(items)} 条")
            all_ok = False

    # 清理
    _req("DELETE", f"/notes/{source_id}")
    _req("DELETE", f"/notes/{target_id}")
    log_pass("双链测试数据已清理")
    return all_ok


def test_fts_search():
    """FTS5 全文搜索测试（英文）+ 中文自动 fallback 到 LIKE"""
    print("\n[10/10] FTS5 全文搜索测试")
    all_ok = True

    # 创建英文测试笔记
    resp = _req("POST", "/notes/", json={
        "title": "FTS English Test",
        "content": "Hello world this is a full text search test",
        "note_type": "note"
    })
    if resp is None or resp.status_code != 200:
        log_fail("创建 FTS 测试笔记失败")
        return False
    note_id = resp.json()["id"]
    log_pass(f"创建测试笔记: {note_id}")

    # 英文关键词用 FTS5 搜索
    resp = _req("GET", "/notes/?keyword=Hello&search_mode=fts")
    fts_results = resp.json() if resp and resp.status_code == 200 else {"total": 0}
    if fts_results.get("total", 0) >= 1:
        log_pass(f"FTS 英文搜索命中 {fts_results['total']} 条")
    else:
        log_fail("FTS 英文搜索未命中")
        all_ok = False

    # 中文关键词自动 fallback 到 LIKE
    resp = _req("POST", "/notes/", json={
        "title": "中文测试",
        "content": "这是中文内容",
        "note_type": "note"
    })
    cnote_id = resp.json()["id"] if resp and resp.status_code == 200 else None

    if cnote_id:
        resp = _req("GET", "/notes/?keyword=中文&search_mode=fts")
        cjk_results = resp.json() if resp and resp.status_code == 200 else {"total": 0}
        if cjk_results.get("total", 0) >= 1:
            log_pass(f"中文自动 fallback LIKE 命中 {cjk_results['total']} 条")
        else:
            log_fail("中文 fallback 搜索未命中")
            all_ok = False
        _req("DELETE", f"/notes/{cnote_id}")

    # 清理
    _req("DELETE", f"/notes/{note_id}")
    log_pass("FTS 测试数据已清理")
    return all_ok


def test_graph():
    """知识图谱数据接口测试"""
    print("\n[11/11] 知识图谱数据接口测试")

    resp = _req("GET", "/notes/graph/data")
    if resp is None or resp.status_code != 200:
        log_fail("获取图谱数据失败")
        return False

    data = resp.json()
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])

    if not isinstance(nodes, list) or not isinstance(edges, list):
        log_fail("图谱数据格式错误")
        return False

    log_pass(f"图谱数据正常: {len(nodes)} 个节点, {len(edges)} 条边")
    return True


def test_ai_related():
    """笔记关联推荐测试"""
    print("\n[12/12] 笔记关联推荐测试")

    # 需要先有一个笔记
    resp = _req("POST", "/notes/", json={
        "title": "AI关联推荐测试",
        "content": "这是一篇关于人工智能和机器学习的测试文章，用于测试关联推荐功能",
        "note_type": "note"
    })
    if resp is None or resp.status_code != 200:
        log_fail("创建测试笔记失败")
        return False
    note_id = resp.json()["id"]
    log_pass(f"创建测试笔记: {note_id}")

    # 创建另一个笔记用来关联
    resp2 = _req("POST", "/notes/", json={
        "title": "第二篇笔记",
        "content": "这篇也关于人工智能技术，应该能被关联推荐找到",
        "note_type": "note"
    })
    note2_id = resp2.json()["id"] if resp2 and resp2.status_code == 200 else None

    # 测试关联推荐
    resp = _req("GET", f"/ai/related/{note_id}")
    if resp is None:
        log_fail("关联推荐接口无响应")
        _req("DELETE", f"/notes/{note_id}")
        if note2_id: _req("DELETE", f"/notes/{note2_id}")
        return False

    data = resp.json()
    notes = data.get("notes", [])
    keywords = data.get("keywords", [])

    # 即使没有关联笔记，接口也应返回有效格式
    if isinstance(notes, list) and isinstance(keywords, list):
        log_pass(f"关联推荐返回正常: {len(notes)} 条推荐, {len(keywords)} 个关键词")
    else:
        log_fail("关联推荐数据格式错误")
        _req("DELETE", f"/notes/{note_id}")
        if note2_id: _req("DELETE", f"/notes/{note2_id}")
        return False

    # 清理
    _req("DELETE", f"/notes/{note_id}")
    if note2_id: _req("DELETE", f"/notes/{note2_id}")
    log_pass("关联推荐测试数据已清理")
    return True


_test_weakness_id = None


def test_weakness_system():
    """弱点改进系统测试"""
    global _test_weakness_id
    print("\n[13/13] 弱点改进系统测试")
    all_ok = True

    # 创建弱点
    resp = _req("POST", "/weakness/", json={
        "title": "测试弱点-拖延",
        "description": "总是把重要事情拖到最后",
        "category": "habit",
        "severity": 4,
        "frequency": "daily",
        "trigger_context": "面对困难任务",
        "impact": "工作效率低",
        "tried_solutions": "番茄钟"
    })
    if resp is None or resp.status_code != 200:
        log_fail("创建弱点失败")
        return False
    _test_weakness_id = resp.json()["id"]
    log_pass(f"创建弱点成功: {_test_weakness_id}")

    # 获取弱点列表
    resp = _req("GET", "/weakness/")
    if resp and resp.status_code == 200 and len(resp.json()) > 0:
        log_pass("获取弱点列表成功")
    else:
        log_fail("获取弱点列表失败")
        all_ok = False

    # 创建改进计划
    resp = _req("POST", "/weakness/plans", json={
        "weakness_id": _test_weakness_id,
        "title": "克服拖延计划",
        "description": "30天渐进改进",
        "strategy": "两分钟法则",
        "duration_days": 30
    })
    if resp is None or resp.status_code != 200:
        log_fail("创建改进计划失败")
        all_ok = False
    else:
        plan_id = resp.json()["id"]
        log_pass(f"创建改进计划成功: {plan_id}")

        # 创建微行动
        resp = _req("POST", "/weakness/actions", json={
            "plan_id": plan_id,
            "title": "两分钟启动",
            "description": "先做两分钟",
            "frequency": "daily",
            "estimated_minutes": 2
        })
        if resp and resp.status_code == 200:
            action_id = resp.json()["id"]
            log_pass(f"创建微行动成功: {action_id}")

            # 记录行动日志
            resp = _req("POST", f"/weakness/actions/{action_id}/log", json={
                "completed": True,
                "notes": "今天完成了",
                "mood": 4,
                "difficulty": 2
            })
            if resp and resp.status_code == 200:
                log_pass("记录行动日志成功")
            else:
                log_fail("记录行动日志失败")
                all_ok = False

            # 获取行动统计
            resp = _req("GET", f"/weakness/actions/{action_id}/stats")
            if resp and resp.status_code == 200:
                log_pass(f"行动统计: {resp.json()}")
            else:
                log_fail("获取行动统计失败")
                all_ok = False
        else:
            log_fail("创建微行动失败")
            all_ok = False

    # 获取仪表盘
    resp = _req("GET", "/weakness/dashboard/stats")
    if resp and resp.status_code == 200:
        log_pass(f"仪表盘统计: {resp.json()}")
    else:
        log_fail("获取仪表盘失败")
        all_ok = False

    return all_ok


def cleanup():
    """清理测试数据"""
    global _test_weakness_id
    print("\n[清理] 删除测试数据")
    if _test_weakness_id:
        resp = _req("DELETE", f"/weakness/{_test_weakness_id}")
        if resp and resp.status_code == 200:
            log_pass(f"删除测试弱点 {_test_weakness_id}")
        else:
            log_fail(f"删除测试弱点失败")
    if _test_note_id:
        resp = _req("DELETE", f"/notes/{_test_note_id}")
        if resp and resp.status_code == 200:
            log_pass(f"删除测试笔记 {_test_note_id}")
        else:
            log_fail(f"删除测试笔记失败")
    if _test_folder_id:
        resp = _req("DELETE", f"/folders/{_test_folder_id}")
        if resp and resp.status_code == 200:
            log_pass(f"删除测试文件夹 {_test_folder_id}")
        else:
            log_fail(f"删除测试文件夹失败")
    if _test_tag_id:
        resp = _req("DELETE", f"/tags/{_test_tag_id}")
        if resp and resp.status_code == 200:
            log_pass(f"删除测试标签 {_test_tag_id}")
        else:
            log_fail(f"删除测试标签失败")


def run_all():
    print("=" * 60)
    print("进化镜 API 冒烟测试 (Backend API Smoke Test)")
    print("=" * 60)
    print(f"目标: {BASE_URL}")

    # 先检查后端是否在线
    try:
        requests.get(f"{BASE_URL}/health", timeout=3)
    except requests.exceptions.ConnectionError:
        print(f"\n{RED}后端未启动！请先运行: python run.py{RESET}")
        print(f"或者检查服务是否监听 127.0.0.1:8964\n")
        return False

    results = []
    results.append(test_health())
    results.append(test_frontend_served())
    results.append(test_note_crud())
    results.append(test_folder_crud())
    results.append(test_tag_crud())
    results.append(test_stats())
    results.append(test_ai_asr_status())
    results.append(test_settings())
    results.append(test_wiki_links())
    results.append(test_fts_search())
    results.append(test_graph())
    results.append(test_ai_related())
    results.append(test_weakness_system())

    cleanup()

    passed = sum(results)
    total = len(results)

    print("\n" + "=" * 60)
    if all(results):
        print(f"{GREEN}全部通过 ({passed}/{total}){RESET}")
    else:
        print(f"{RED}部分失败 ({passed}/{total} 通过){RESET}")
    print("=" * 60)
    return all(results)


if __name__ == "__main__":
    ok = run_all()
    sys.exit(0 if ok else 1)
