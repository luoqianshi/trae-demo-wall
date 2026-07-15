"""历史记录测试 - 使用临时数据库，不污染用户数据"""
import pytest
from pathlib import Path
from readmate.infra.history import HistoryStore


@pytest.fixture
def history(tmp_path):
    db_path = tmp_path / "test_history.db"
    h = HistoryStore(db_path=db_path)
    h.init_db()
    return h


def test_save_and_get(history):
    rid = history.save_record("测试文本", "解释", "测试回答")
    assert rid is not None
    records = history.get_recent_records(10)
    assert len(records) >= 1
    assert records[0]["selected_text"] == "测试文本"
    assert records[0]["action"] == "解释"
    assert records[0]["answer"] == "测试回答"


def test_search(history):
    history.save_record("Python编程", "解释", "Python是一种编程语言")
    history.save_record("Java入门", "翻译", "Java is a programming language")
    results = history.search_records("Python")
    assert len(results) >= 1
    assert "Python" in results[0]["selected_text"]


def test_search_empty_keyword(history):
    history.save_record("test", "解释", "ans")
    assert history.search_records("") == []
    assert history.search_records("   ") == []


def test_delete(history):
    rid = history.save_record("待删除", "总结", "内容")
    assert history.delete_record(rid) is True
    records = history.get_recent_records(100)
    assert all(r["id"] != rid for r in records)


def test_delete_invalid(history):
    assert history.delete_record(None) is False
    assert history.delete_record(-1) is False


def test_clear_all(history):
    history.save_record("test1", "解释", "ans1")
    history.save_record("test2", "翻译", "ans2")
    assert history.clear_all() is True
    records = history.get_recent_records(100)
    assert len(records) == 0


def test_stats(history):
    history.save_record("test", "解释", "answer")
    stats = history.get_stats()
    assert stats["total"] >= 1
    assert stats["today"] >= 1


def test_limit_bounds(history):
    for i in range(5):
        history.save_record(f"text{i}", "解释", f"ans{i}")
    records = history.get_recent_records(-1)
    assert len(records) >= 1
    records = history.get_recent_records(1000)
    assert len(records) <= 500


def test_save_invalid_params(history):
    assert history.save_record("", "解释", "ans") is None
    assert history.save_record("text", "", "ans") is None
    assert history.save_record("text", "解释", None) is None
