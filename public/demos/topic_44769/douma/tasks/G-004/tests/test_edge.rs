include!("solution.rs");

// 边界测试：多份快照交错拍摄，每份必须各自定格、互不串味。
#[test]
fn test_multiple_snapshots_independent() {
    let mut store = ConfigStore::new();
    store.set("v", 0);

    let mut snaps = Vec::new();
    // 每改一步拍一份快照，期望第 i 份快照里 v == i
    for i in 1..=10 {
        store.set("v", i);
        snaps.push(store.snapshot());
    }
    // 收尾再大改一次，验证所有历史快照都不受影响
    store.set("v", 100000);

    for (idx, snap) in snaps.iter().enumerate() {
        let expect = (idx as i64) + 1;
        assert_eq!(
            snap.get("v"),
            Some(expect),
            "第 {} 份快照 v 应为 {}，被污染了",
            idx,
            expect
        );
        assert_eq!(snap.len(), 1);
    }
}
