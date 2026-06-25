include!("solution.rs");

// 功能测试：合法配置解析正确，且 find_value 命中/未命中语义正确。
#[test]
fn test_valid_config_parsed() {
    let input = ["port=800", "retries=3", "timeout=1000"];
    let cfg = parse_config(&input).expect("合法配置应解析成功");
    assert_eq!(cfg.len(), 3);
    assert_eq!(cfg[0], ("port".to_string(), 800));
    assert_eq!(cfg[2], ("timeout".to_string(), 1000));
}

#[test]
fn test_find_value_hit_and_miss() {
    let input = ["a=1", "b=2"];
    let cfg = parse_config(&input).unwrap();
    assert_eq!(find_value(&cfg, "a"), Some(1));
    assert_eq!(find_value(&cfg, "b"), Some(2));
    // 未命中必须为 None，不得返回 Some(默认值)
    assert_eq!(find_value(&cfg, "missing"), None);
}
