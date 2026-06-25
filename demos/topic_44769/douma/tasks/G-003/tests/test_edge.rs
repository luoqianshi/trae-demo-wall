include!("solution.rs");

// 边界测试：极高并发放大竞态——大量线程争抢极小容量，反复多轮，
// 任何一轮出现超卖或计数不一致都判失败。buggy 在此几乎必现超卖。
#[test]
fn test_oversell_amplified() {
    for _round in 0..30 {
        let capacity = 10usize;
        let reg = Arc::new(SeatRegistry::new(capacity));
        // 64 线程 * 每线程 200 次 = 12800 次请求争抢 10 个名额
        let total_ok = run_concurrent(&reg, 64, 200);
        assert!(
            reg.granted() <= capacity,
            "超卖：granted {} 超过容量 {}",
            reg.granted(),
            capacity
        );
        assert_eq!(reg.granted(), capacity, "未恰好发满：granted={}", reg.granted());
        assert_eq!(total_ok, reg.granted(), "成功次数与发放数不一致");
    }
}

// 边界测试：容量为 0 时任何抢占都必须失败。
#[test]
fn test_zero_capacity() {
    let reg = Arc::new(SeatRegistry::new(0));
    let total_ok = run_concurrent(&reg, 8, 100);
    assert_eq!(total_ok, 0);
    assert_eq!(reg.granted(), 0);
}
