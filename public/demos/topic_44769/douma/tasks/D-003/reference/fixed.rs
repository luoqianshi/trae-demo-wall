use std::cell::RefCell;
use std::rc::{Rc, Weak};

// 图节点：生命周期由调用方手中的 Rc 句柄决定。
pub struct Node {
    pub id: usize,
    pub value: i64,
}

// 调用方持有的节点句柄类型。
pub type NodeHandle = Rc<RefCell<Node>>;

// 节点图：维护一个"按 id 查找"的辅助注册表，但不得延长节点寿命。
pub struct NodeGraph {
    // 关键：用 Weak 弱引用登记，注册表自身不持有所有权，
    // 调用方放手后节点即可被回收，upgrade() 随之失败。
    registry: Vec<(usize, Weak<RefCell<Node>>)>,
}

impl NodeGraph {
    pub fn new() -> Self {
        NodeGraph { registry: Vec::new() }
    }

    // 创建节点并返回所有权句柄；注册表仅记一份弱引用用于查找。
    pub fn add(&mut self, id: usize, value: i64) -> NodeHandle {
        let node = Rc::new(RefCell::new(Node { id, value }));
        self.registry.push((id, Rc::downgrade(&node)));
        node
    }

    // 按 id 找回仍存活的节点；已释放或不存在则返回 None。
    pub fn get(&self, id: usize) -> Option<NodeHandle> {
        self.registry
            .iter()
            .find(|(nid, _)| *nid == id)
            .and_then(|(_, w)| w.upgrade()) // 弱引用能升级即说明仍被调用方持有
    }

    // 仍被调用方持有的节点数量：能升级成功的弱引用计数。
    pub fn live_count(&self) -> usize {
        self.registry.iter().filter(|(_, w)| w.upgrade().is_some()).count()
    }
}
