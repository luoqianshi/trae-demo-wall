include!("solution.rs");

// 边界测试：大量节点交错创建/释放，live_count 必须始终精确反映仍持有的数量。
#[test]
fn test_interleaved_create_drop() {
    let mut graph = NodeGraph::new();

    // 创建 20 个节点，先全部持有
    let mut handles: Vec<NodeHandle> = Vec::new();
    for i in 0..20 {
        let h = graph.add(i, i as i64 * 10);
        // 注册表不得对外部句柄持有强引用：刚 add、调用方独占时 strong_count 必为 1。
        // 这可挡住"保留 Vec<Rc<Node>> 强引用、仅按 strong_count>1 过滤"的半修复 hack。
        assert_eq!(Rc::strong_count(&h), 1, "注册表不得对外部句柄持有强引用");
        handles.push(h);
    }
    assert_eq!(graph.live_count(), 20);

    // 释放所有偶数 id 的节点句柄
    let mut kept: Vec<NodeHandle> = Vec::new();
    for (i, h) in handles.into_iter().enumerate() {
        if i % 2 == 0 {
            drop(h); // 偶数：放手
        } else {
            kept.push(h); // 奇数：继续持有
        }
    }

    // 只剩 10 个奇数节点存活
    assert_eq!(graph.live_count(), 10, "释放偶数节点后应只剩 10 个存活");
    for id in 0..20 {
        let found = graph.get(id);
        if id % 2 == 0 {
            assert!(found.is_none(), "偶数节点 {} 应已释放", id);
        } else {
            assert!(found.is_some(), "奇数节点 {} 应仍存活", id);
        }
    }

    // 再释放全部剩余，应清零
    kept.clear();
    assert_eq!(graph.live_count(), 0, "全部释放后 live_count 应为 0");
    assert!(graph.get(1).is_none());
}
