include!("solution.rs");

// 功能测试：drop 节点句柄后，节点应被回收 —— live_count 减少、get 返回 None。
#[test]
fn test_dropped_node_is_reclaimed() {
    let mut graph = NodeGraph::new();

    let n1 = graph.add(1, 100);
    let n2 = graph.add(2, 200);

    // 注册表是辅助索引，不得延长节点寿命：刚 add 出来、调用方独占句柄时，
    // 外部句柄的强引用计数必须恒为 1（只有调用方自己持有）。
    // 若注册表用 Rc 强引用登记（哪怕仅按 strong_count>1 过滤 live_count/get 来"半修复"），
    // 这里就会变成 2 而被挡下——只有真正用 Weak 弱引用登记才能通过。
    assert_eq!(Rc::strong_count(&n1), 1, "注册表不得对外部句柄持有强引用");
    assert_eq!(Rc::strong_count(&n2), 1, "注册表不得对外部句柄持有强引用");

    assert_eq!(graph.live_count(), 2);
    assert!(graph.get(1).is_some());
    assert!(graph.get(2).is_some());

    // 调用方放手 n2 的句柄：节点 2 应随之释放
    drop(n2);

    assert_eq!(graph.live_count(), 1, "drop 后 live_count 应为 1（节点2已释放）");
    assert!(graph.get(2).is_none(), "已释放的节点2不应还能被 get 找回");
    assert!(graph.get(1).is_some(), "仍持有的节点1必须可被找回");

    // 保活 n1，避免被提前优化掉
    assert_eq!(n1.borrow().value, 100);
}
