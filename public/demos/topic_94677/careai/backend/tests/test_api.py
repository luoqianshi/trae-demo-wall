#!/usr/bin/env python3
"""
CareAI API 测试用例
运行方式: 先启动后端服务，然后运行 python tests/test_api.py
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../app"))

import requests
import json

BASE_URL = "http://localhost:8000"


def test_root():
    """TC-001: 测试根路径"""
    r = requests.get(f"{BASE_URL}/")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    assert r.json()["message"] == "CareAI Backend is running"
    print("[PASS] TC-001: 根路径返回正确")


def test_cameras():
    """TC-002: 测试摄像头列表"""
    r = requests.get(f"{BASE_URL}/cameras/")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    print(f"[PASS] TC-002: 摄像头列表返回 {len(data)} 条记录")


def test_create_camera():
    """TC-003: 测试创建摄像头"""
    payload = {
        "name": "测试摄像头",
        "rtsp_url": "rtsp://192.168.1.200/stream1",
        "resolution": "1280x720",
        "sample_interval": 3
    }
    r = requests.post(f"{BASE_URL}/cameras/", json=payload)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    data = r.json()
    assert data["name"] == "测试摄像头"
    print(f"[PASS] TC-003: 创建摄像头成功，ID={data['id']}")
    return data["id"]


def test_delete_camera(camera_id):
    """TC-004: 测试删除摄像头"""
    r = requests.delete(f"{BASE_URL}/cameras/{camera_id}")
    assert r.status_code == 200
    assert r.json()["ok"] == True
    print(f"[PASS] TC-004: 删除摄像头成功，ID={camera_id}")


def test_frames_list():
    """TC-005: 测试帧列表"""
    r = requests.get(f"{BASE_URL}/frames/")
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert "total" in data
    print(f"[PASS] TC-005: 帧列表返回 {data['total']} 条记录")


def test_frames_filter():
    """TC-006: 测试帧列表过滤"""
    r = requests.get(f"{BASE_URL}/frames/?annotated=false")
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    print(f"[PASS] TC-006: 未标注帧过滤返回 {data['total']} 条")


def test_annotations_list():
    """TC-007: 测试标注列表"""
    r = requests.get(f"{BASE_URL}/annotations/")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    print(f"[PASS] TC-007: 标注列表返回 {len(data)} 条记录")


def test_create_annotation():
    """TC-008: 测试创建标注"""
    r = requests.get(f"{BASE_URL}/frames/?limit=1")
    frames = r.json()["items"]
    if not frames:
        print("[SKIP] TC-008: 无可用帧，跳过标注测试")
        return None

    frame_id = frames[0]["id"]
    payload = {"frame_id": frame_id, "label": "翻身"}
    r = requests.post(f"{BASE_URL}/annotations/", json=payload)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    data = r.json()
    assert data["label"] == "翻身"
    print(f"[PASS] TC-008: 创建标注成功，ID={data['id']}")
    return data["id"]


def test_events_list():
    """TC-009: 测试事件列表"""
    r = requests.get(f"{BASE_URL}/events/")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    print(f"[PASS] TC-009: 事件列表返回 {len(data)} 条记录")


def test_events_filter():
    """TC-010: 测试事件风险等级过滤"""
    r = requests.get(f"{BASE_URL}/events/?risk_level=P0")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    print(f"[PASS] TC-010: P0 事件过滤返回 {len(data)} 条")


def test_models_list():
    """TC-011: 测试模型列表"""
    r = requests.get(f"{BASE_URL}/models/")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    print(f"[PASS] TC-011: 模型列表返回 {len(data)} 条记录")


def test_alerts_rules():
    """TC-012: 测试告警规则列表"""
    r = requests.get(f"{BASE_URL}/alerts/rules")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    print(f"[PASS] TC-012: 告警规则返回 {len(data)} 条")


def test_dashboard_stats():
    """TC-013: 测试工作台统计"""
    r = requests.get(f"{BASE_URL}/dashboard/stats")
    assert r.status_code == 200
    data = r.json()
    assert "today_events" in data
    assert "model_accuracy" in data
    print(f"[PASS] TC-013: 工作台统计返回: {json.dumps(data, ensure_ascii=False)}")


def test_users_list():
    """TC-014: 测试用户列表"""
    r = requests.get(f"{BASE_URL}/users/")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    print(f"[PASS] TC-014: 用户列表返回 {len(data)} 条记录")


def test_train_status():
    """TC-015: 测试训练状态"""
    r = requests.get(f"{BASE_URL}/train/status")
    assert r.status_code == 200
    data = r.json()
    assert "status" in data
    print(f"[PASS] TC-015: 训练状态: {data['status']}")


def test_swagger_docs():
    """TC-016: 测试 Swagger 文档可访问"""
    r = requests.get(f"{BASE_URL}/docs")
    assert r.status_code == 200
    print("[PASS] TC-016: Swagger 文档可访问")


def run_all_tests():
    print("=" * 60)
    print("CareAI API 测试开始")
    print("=" * 60)

    passed = 0
    failed = 0
    skipped = 0

    tests = [
        test_root,
        test_cameras,
        test_create_camera,
        test_frames_list,
        test_frames_filter,
        test_annotations_list,
        test_create_annotation,
        test_events_list,
        test_events_filter,
        test_models_list,
        test_alerts_rules,
        test_dashboard_stats,
        test_users_list,
        test_train_status,
        test_swagger_docs,
    ]

    camera_id = None

    for test in tests:
        try:
            if test.__name__ == "test_create_camera":
                camera_id = test()
            elif test.__name__ == "test_delete_camera" and camera_id:
                test(camera_id)
            else:
                test()
            passed += 1
        except AssertionError as e:
            print(f"[FAIL] {test.__name__}: {e}")
            failed += 1
        except Exception as e:
            print(f"[ERROR] {test.__name__}: {e}")
            failed += 1

    # Cleanup
    if camera_id:
        try:
            test_delete_camera(camera_id)
        except:
            pass

    print("=" * 60)
    print(f"测试完成: 通过 {passed}, 失败 {failed}, 跳过 {skipped}")
    print("=" * 60)

    return failed == 0


if __name__ == "__main__":
    # Check if server is running
    try:
        requests.get(f"{BASE_URL}/", timeout=2)
    except requests.exceptions.ConnectionError:
        print("错误: 后端服务未启动。请先运行: cd backend && DATABASE_URL=sqlite:///:memory: python run.py")
        sys.exit(1)

    success = run_all_tests()
    sys.exit(0 if success else 1)
