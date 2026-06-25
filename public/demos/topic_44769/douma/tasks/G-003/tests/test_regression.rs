include!("solution.rs");

// 回归测试：单线程下的基础语义正确（buggy 在此应当仍能通过——安全基线）。
#[test]
fn test_single_thread_semantics() {
    let reg = SeatRegistry::new(3);
    assert_eq!(reg.capacity(), 3);
    assert!(reg.try_acquire());
    assert!(reg.try_acquire());
    assert!(reg.try_acquire());
    // 名额耗尽后继续抢占应失败且不改变发放数
    assert!(!reg.try_acquire());
    assert!(!reg.try_acquire());
    assert_eq!(reg.granted(), 3);
}
