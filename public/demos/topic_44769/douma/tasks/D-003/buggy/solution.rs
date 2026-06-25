use std::cell::RefCell;
use std::rc::Rc;

// 图节点：生命周期由调用方手中的 Rc 句柄决定。
pub struct Node {
    pub id: usize,
    pub value: i64,
}

// 调用方持有的节点句柄类型。
pub type NodeHandle = Rc<RefCell<Node>>;

// 节点图：维护一个"按 id 查找"的辅助注册表，但不得延长节点寿命。
pub struct NodeGraph {
    registry: Vec<(usize, Rc<RefCell<Node>>)>,
}

impl NodeGraph {
    pub fn new() -> Self {
        NodeGraph { registry: Vec::new() }
    }

    // 创建节点并返回所有权句柄；注册表记一份用于查找。
    pub fn add(&mut self, id: usize, value: i64) -> NodeHandle {
        let node = Rc::new(RefCell::new(Node { id, value }));
        self.registry.push((id, Rc::clone(&node)));
        node
    }

    // 按 id 找回仍存活的节点；已释放或不存在则返回 None。
    pub fn get(&self, id: usize) -> Option<NodeHandle> {
        self.registry
            .iter()
            .find(|(nid, _)| *nid == id)
            .map(|(_, n)| Rc::clone(n))
    }

    // 仍被调用方持有的节点数量。
    pub fn live_count(&self) -> usize {
        self.registry.len()
    }
}
