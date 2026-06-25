include!("solution.rs");

// 功能测试：多写多读并发下，所有读到的快照必须自洽，且终版本精确。
// buggy 因字段各自独立加锁，读线程会读到字段撕裂的快照，不自洽计数 > 0。
#[test]
fn test_snapshot_consistency() {
    for _round in 0..20 {
        let config = Arc::new(Config::new());
        // 4 写线程各 bump 200 次；8 读线程各 snapshot 400 次
        let bad = run_concurrent(&config, 4, 200, 8, 400);
        assert_eq!(bad, 0, "读到 {} 个不自洽快照", bad);
        // 版本精确
        assert_eq!(config.version(), 4 * 200, "终版本不精确");
        // 终态自洽
        let (v, val, der) = config.snapshot();
        assert_eq!(val, v * A);
        assert_eq!(der, v * B);
    }
}
