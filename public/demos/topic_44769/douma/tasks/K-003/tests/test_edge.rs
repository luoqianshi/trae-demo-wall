include!("solution.rs");

// 边界测试：放大“用默认值掩盖错误”的缺陷 —— 各类非法值必须返回 Err，绝不能吞成 Ok(0)。
#[test]
fn test_non_numeric_value_must_error() {
    // 非数字值：buggy 会 unwrap_or(0) 吞成功，正确实现必须 Err
    let input = ["port=abc"];
    let r = parse_config(&input);
    assert!(r.is_err(), "非数字值应返回 Err，实际 {:?}", r);
}

#[test]
fn test_negative_and_overflow_must_error() {
    // 负数：u32 解析失败，必须 Err 而非吞成 0
    assert!(parse_config(&["x=-1"]).is_err(), "负数应 Err");
    // 超出范围
    assert!(parse_config(&["x=1001"]).is_err(), "超范围应 Err");
    // 缺少 '='
    assert!(parse_config(&["noequal"]).is_err(), "缺 = 应 Err");
    // 键为空
    assert!(parse_config(&["=5"]).is_err(), "空键应 Err");
}

#[test]
fn test_one_bad_line_fails_whole_batch_no_silent_default() {
    // 混合：前后合法、中间非法，整体必须失败，不能把非法值替换成 0 后返回 Ok
    let input = ["a=1", "b=oops", "c=3"];
    let r = parse_config(&input);
    assert!(r.is_err(), "含非法行应整体失败，实际 {:?}", r);

    // 反向佐证：若错误被吞成 0，下面这种“看似成功”的结果绝不允许出现
    if let Ok(cfg) = parse_config(&input) {
        // 一旦走到这里就说明错误被掩盖了 —— 直接判失败
        panic!("非法输入被吞成 Ok，错误被掩盖: {:?}", cfg);
    }
}

#[test]
fn test_find_value_never_fabricates() {
    let cfg = parse_config(&["only=7"]).unwrap();
    // 不存在的键必须 None，绝不能返回 Some(0) 之类的默认值
    assert_eq!(find_value(&cfg, "ghost"), None);
    assert_eq!(find_value(&cfg, "only"), Some(7));
}
