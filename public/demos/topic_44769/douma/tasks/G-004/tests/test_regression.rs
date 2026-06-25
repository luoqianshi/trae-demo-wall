include!("solution.rs");

// 回归测试：基线读写正确性 —— 不涉及"拍后再改"场景。
#[test]
fn test_basic_read_write() {
    let mut store = ConfigStore::new();
    store.set("a", 1);
    store.set("b", 2);
    store.set("a", 11); // 覆盖

    assert_eq!(store.get("a"), Some(11));
    assert_eq!(store.get("b"), Some(2));
    assert_eq!(store.get("missing"), None);
    assert_eq!(store.len(), 2);

    // 拍快照后立即读取（期间不修改 store），值应与 store 完全一致
    let snap = store.snapshot();
    assert_eq!(snap.get("a"), Some(11));
    assert_eq!(snap.get("b"), Some(2));
    assert_eq!(snap.len(), 2);
}
