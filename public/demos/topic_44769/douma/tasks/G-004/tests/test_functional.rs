include!("solution.rs");

// 功能测试：拍快照后继续修改 store，快照内容必须保持定格不变。
#[test]
fn test_snapshot_is_frozen() {
    let mut store = ConfigStore::new();
    store.set("max_conn", 100);
    store.set("timeout", 30);

    let snap = store.snapshot();            // 定格此刻：max_conn=100, timeout=30

    // 之后继续修改 store
    store.set("max_conn", 999);
    store.set("timeout", 5);
    store.set("retries", 3);                // 新增键

    // 快照必须仍是拍摄时刻的样子
    assert_eq!(snap.get("max_conn"), Some(100), "快照 max_conn 被后续修改污染");
    assert_eq!(snap.get("timeout"), Some(30), "快照 timeout 被后续修改污染");
    assert_eq!(snap.get("retries"), None, "快照不应包含拍摄后新增的键");
    assert_eq!(snap.len(), 2, "快照键数不应随 store 变化");

    // store 自身的修改应正常生效
    assert_eq!(store.get("max_conn"), Some(999));
    assert_eq!(store.len(), 3);
}
