include!("solution.rs");

// 边界测试：极高并发放大跨字段撕裂——大量写线程疯狂 bump，海量读线程持续校验，
// 反复多轮。任何一轮出现不自洽快照或终态/版本异常都判失败。
// buggy 在此几乎必现撕裂。
#[test]
fn test_tearing_amplified() {
    for _round in 0..30 {
        let config = Arc::new(Config::new());
        // 8 写线程各 bump 500 次；64 读线程各 snapshot 200 次
        let bad = run_concurrent(&config, 8, 500, 64, 200);
        assert_eq!(bad, 0, "读到 {} 个不自洽快照（跨字段撕裂）", bad);
        assert_eq!(config.version(), 8 * 500, "终版本不精确");
        let (v, val, der) = config.snapshot();
        assert_eq!(val, v * A, "终态 value 与 version 不符");
        assert_eq!(der, v * B, "终态 derived 与 version 不符");
    }
}

// 边界测试：无写线程、纯并发读初始配置应全自洽且不报错。
#[test]
fn test_read_only_initial() {
    let config = Arc::new(Config::new());
    let bad = run_concurrent(&config, 0, 0, 16, 500);
    assert_eq!(bad, 0);
    assert_eq!(config.snapshot(), (0, 0, 0));
}
