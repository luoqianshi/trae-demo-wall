"""回归测试：干净基线 —— 全部合法记录时解析结果与计数完全正确。"""
from solution import BatchParser


def test_all_valid_records():
    p = BatchParser()
    records = ["0", "10", "255", "1000"]
    res = p.parse(records)
    assert res.results == [0, 10, 255, 1000]
    assert res.ok_count == 4
    assert res.error_count == 0
    assert res.errors == []


def test_empty_batch():
    p = BatchParser()
    res = p.parse([])
    assert res.results == []
    assert res.ok_count == 0
    assert res.error_count == 0
