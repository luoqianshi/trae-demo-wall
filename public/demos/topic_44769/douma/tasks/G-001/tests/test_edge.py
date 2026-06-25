"""边界测试：放大“吞异常”缺陷——各类触发异常的坏输入都必须被如实登记。"""
from solution import BatchParser


def test_none_and_type_errors_recorded():
    p = BatchParser()
    # None 会触发 TypeError，必须被登记而非静默跳过
    records = [None, "7", 3.5]
    res = p.parse(records)
    # 守恒：无论成功或失败，都不允许记录凭空消失
    assert res.ok_count + res.error_count == len(records)
    # "7" 成功；None 触发 TypeError 必须被登记为失败（下标 0）
    assert 7 in res.results
    err_index = {e[0] for e in res.errors}
    assert 0 in err_index, f"None 应被登记为失败：{res.errors}"


def test_failures_must_surface_not_swallowed():
    p = BatchParser()
    records = ["nan", "1e3", "  ", "-9", "12abc"]
    res = p.parse(records)
    # 全部都是非法非负整数，必须逐条登记，绝不静默吞掉
    assert res.results == []
    assert res.error_count == len(records), f"失败被吞掉：errors={res.errors}"
    assert res.ok_count + res.error_count == len(records)
    # 每条失败都保留其原始下标
    assert sorted(e[0] for e in res.errors) == [0, 1, 2, 3, 4]
