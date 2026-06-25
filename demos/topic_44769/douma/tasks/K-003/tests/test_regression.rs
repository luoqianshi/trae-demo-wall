include!("solution.rs");

// 回归测试：干净基线 —— 全合法输入下解析与查值行为正确，边界值 0 与 1000 可解析。
#[test]
fn test_clean_baseline_all_valid() {
    let input = ["min=0", "mid=500", "max=1000"];
    let cfg = parse_config(&input).expect("全合法应成功");
    assert_eq!(cfg, vec![
        ("min".to_string(), 0),
        ("mid".to_string(), 500),
        ("max".to_string(), 1000),
    ]);
}

#[test]
fn test_empty_input_ok() {
    // 空输入是合法的，返回 Ok(空)
    let cfg = parse_config(&[]).expect("空输入应成功");
    assert!(cfg.is_empty());
    assert_eq!(find_value(&cfg, "any"), None);
}

#[test]
fn test_whitespace_tolerated() {
    // 键值两侧空白应被裁剪，仍属合法基线
    let input = [" k = 42 "];
    let cfg = parse_config(&input).expect("带空白的合法行应成功");
    assert_eq!(cfg[0], ("k".to_string(), 42));
}
