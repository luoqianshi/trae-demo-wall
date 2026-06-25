use std::cell::RefCell;
use std::rc::Rc;

// 键值配置存储：用有序键值对表示。snapshot() 须返回拍摄时刻的独立定格。
pub struct ConfigStore {
    // 内部用 Rc<RefCell<..>> 持有底层数据，便于在不暴露所有权的情况下读写。
    entries: Rc<RefCell<Vec<(String, i64)>>>,
}

impl ConfigStore {
    pub fn new() -> Self {
        ConfigStore { entries: Rc::new(RefCell::new(Vec::new())) }
    }

    // 写入/更新键值：存在则覆盖，否则追加。
    pub fn set(&mut self, key: &str, val: i64) {
        let mut v = self.entries.borrow_mut();
        if let Some(slot) = v.iter_mut().find(|(k, _)| k == key) {
            slot.1 = val;
        } else {
            v.push((key.to_string(), val));
        }
    }

    pub fn get(&self, key: &str) -> Option<i64> {
        self.entries.borrow().iter().find(|(k, _)| k == key).map(|(_, v)| *v)
    }

    pub fn len(&self) -> usize {
        self.entries.borrow().len()
    }

    // 拍一份快照：真正克隆底层 Vec，快照拥有独立副本，与 store 后续修改隔离。
    pub fn snapshot(&self) -> ConfigSnapshot {
        ConfigSnapshot { entries: self.entries.borrow().clone() }
    }
}

// 配置快照：拍摄时刻的独立定格，持有数据的独立副本。
pub struct ConfigSnapshot {
    entries: Vec<(String, i64)>,
}

impl ConfigSnapshot {
    pub fn get(&self, key: &str) -> Option<i64> {
        self.entries.iter().find(|(k, _)| k == key).map(|(_, v)| *v)
    }

    pub fn len(&self) -> usize {
        self.entries.len()
    }
}
