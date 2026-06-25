"""功能测试：混合批次——成功项正确，失败项必须被登记，且守恒成立。"""
from solution import BatchParser


def test_mixed_batch_conserves_and_records_errors():
    p = BatchParser()
    records = ["1", "2", "bad", "4", "-5"]
    res = p.parse(records)

    # 成功项正确且保持相对顺序
    assert res.results == [1, 2, 4]
    # 守恒：成功 + 失败 == 总数
    assert res.ok_count + res.error_count == len(records)
    # 两条失败必须被登记，且带正确下标与原始值
    assert res.error_count == 2
    err_index = {e[0] for e in res.errors}
    assert err_index == {2, 4}, f"失败下标登记错误：{res.errors}"
    # 失败记录保留原始值
    raw_by_index = {e[0]: e[1] for e in res.errors}
    assert raw_by_index[2] == "bad"
    assert raw_by_index[4] == "-5"


def test_all_invalid_all_recorded():
    p = BatchParser()
    records = ["x", "", "-1"]
    res = p.parse(records)
    assert res.results == []
    assert res.error_count == 3
    assert res.ok_count + res.error_count == 3
