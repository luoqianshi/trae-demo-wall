include!("solution.rs");

// 回归测试：句柄全程持有时的基线正确性 —— get 找回同一节点、共享内部状态。
#[test]
fn test_live_nodes_shared_state() {
    let mut graph = NodeGraph::new();

    let a = graph.add(10, 1);
    let _b = graph.add(20, 2);

    assert_eq!(graph.live_count(), 2);

    // get 找回的句柄应与原句柄指向同一份内部状态
    let a2 = graph.get(10).expect("应能找回节点10");
    a2.borrow_mut().value = 999;
    assert_eq!(a.borrow().value, 999, "get 找回的应是同一个节点（共享状态）");

    // 不存在的 id 返回 None
    assert!(graph.get(404).is_none());
    assert_eq!(graph.live_count(), 2);
}
