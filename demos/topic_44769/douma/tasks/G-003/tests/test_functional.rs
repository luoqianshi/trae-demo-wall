include!("solution.rs");

// 功能测试：高并发抢占有限名额，发放数不得超卖，且请求充足时恰好发满。
// buggy 因判断与自增不在同一临界区，会超卖：granted > capacity，迅速失败。
#[test]
fn test_no_oversell_high_contention() {
    for _round in 0..20 {
        let capacity = 100usize;
        let reg = Arc::new(SeatRegistry::new(capacity));
        // 16 线程 * 每线程 50 次 = 800 次请求，远超 100 个名额
        let total_ok = run_concurrent(&reg, 16, 50);
        // 不超卖
        assert!(
            reg.granted() <= capacity,
            "超卖：granted {} 超过容量 {}",
            reg.granted(),
            capacity
        );
        // 请求充足时恰好发满
        assert_eq!(reg.granted(), capacity, "未恰好发满：granted={}", reg.granted());
        // 计数一致：成功总次数 == 发放数
        assert_eq!(total_ok, reg.granted(), "成功次数与发放数不一致");
    }
}
