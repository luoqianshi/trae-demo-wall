import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root():
    """测试根路径"""
    response = client.get("/")
    assert response.status_code == 200
    assert "app" in response.json()


def test_health():
    """测试健康检查"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_identify_without_file():
    """测试缺少文件的鉴别请求"""
    response = client.post("/api/v1/identify")
    assert response.status_code == 422


def test_get_identify_not_found():
    """测试获取不存在的记录"""
    response = client.get("/api/v1/identify/99999")
    assert response.status_code == 404


def test_admin_stats():
    """测试统计接口"""
    response = client.get("/api/v1/admin/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_identifies" in data
    assert "today_identifies" in data
    assert "total_users" in data


def test_admin_records():
    """测试管理端记录列表"""
    response = client.get("/api/v1/admin/records")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
