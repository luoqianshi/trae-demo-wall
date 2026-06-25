include!("solution.rs");

// 回归测试：单线程下版本推进与派生字段语义正确（buggy 在此应仍能通过——安全基线）。
#[test]
fn test_single_thread_bump() {
    let config = Config::new();
    assert_eq!(config.snapshot(), (0, 0, 0));
    config.bump();
    assert_eq!(config.snapshot(), (1, A, B));
    config.bump();
    config.bump();
    let (v, val, der) = config.snapshot();
    assert_eq!(v, 3);
    assert_eq!(val, 3 * A);
    assert_eq!(der, 3 * B);
    assert_eq!(config.version(), 3);
}
