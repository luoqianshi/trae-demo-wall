use std::sync::{Arc, Mutex};
use std::thread;

// 派生常量：value = version*A，derived = version*B（不得改动取值）。
pub const A: i64 = 7;
pub const B: i64 = 13;

// 配置内部状态：三个字段必须协同变化，作为一个整体被保护。
struct Inner {
    version: i64,
    value: i64,
    derived: i64,
}

// 带版本号的运行时配置：version 与两个派生字段必须始终自洽。
pub struct Config {
    // 把整组字段放进同一把锁下，保证更新与读取都对整体原子可见。
    inner: Mutex<Inner>,
}

impl Config {
    pub fn new() -> Self {
        Config {
            inner: Mutex::new(Inner { version: 0, value: 0, derived: 0 }),
        }
    }

    // 推进到下一个版本：在同一临界区内一次性更新三个字段，
    // 期间不释放锁，使任何读取都看不到「字段对不上」的中间态。
    pub fn bump(&self) {
        let mut g = self.inner.lock().unwrap();
        g.version += 1;
        g.value = g.version * A;
        g.derived = g.version * B;
    }

    // 读取整组字段的一致快照：整个读取在同一临界区内完成。
    pub fn snapshot(&self) -> (i64, i64, i64) {
        let g = self.inner.lock().unwrap();
        (g.version, g.value, g.derived)
    }

    pub fn version(&self) -> i64 {
        self.inner.lock().unwrap().version
    }
}

// 并发驱动：writers 个写线程各 bump bumps_per_writer 次；
// readers 个读线程各 snapshot reads_per_reader 次并校验自洽，
// 返回观察到的不自洽快照总数。
pub fn run_concurrent(
    config: &Arc<Config>,
    writers: usize,
    bumps_per_writer: usize,
    readers: usize,
    reads_per_reader: usize,
) -> usize {
    let mut handles = vec![];
    for _ in 0..writers {
        let c = Arc::clone(config);
        handles.push(thread::spawn(move || {
            for _ in 0..bumps_per_writer {
                c.bump();
            }
            0usize
        }));
    }
    for _ in 0..readers {
        let c = Arc::clone(config);
        handles.push(thread::spawn(move || {
            let mut bad = 0usize;
            for _ in 0..reads_per_reader {
                let (v, val, der) = c.snapshot();
                if val != v * A || der != v * B {
                    bad += 1;
                }
            }
            bad
        }));
    }
    handles.into_iter().map(|h| h.join().unwrap()).sum()
}
