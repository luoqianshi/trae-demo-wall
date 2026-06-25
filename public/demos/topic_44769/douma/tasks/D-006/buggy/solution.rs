use std::sync::{Arc, Mutex};
use std::thread;

// 派生常量：value = version*A，derived = version*B（不得改动取值）。
pub const A: i64 = 7;
pub const B: i64 = 13;

// 带版本号的运行时配置：version 与两个派生字段必须始终自洽。
pub struct Config {
    // 缺陷：三个字段各自一把锁，彼此之间没有任何整体原子性保证。
    version: Mutex<i64>,
    value: Mutex<i64>,
    derived: Mutex<i64>,
}

impl Config {
    pub fn new() -> Self {
        Config {
            version: Mutex::new(0),
            value: Mutex::new(0),
            derived: Mutex::new(0),
        }
    }

    // 推进到下一个版本。
    pub fn bump(&self) {
        // 缺陷：分三次独立加锁更新，三个字段不在同一临界区。
        // 在更新到一半时（如 version 已自增、value 尚未跟上），
        // 其它读线程读到的快照就会字段对不上。
        let new_v = {
            let mut v = self.version.lock().unwrap();
            *v += 1;
            *v
        }; // version 锁释放，此刻 value/derived 仍是旧版本——撕裂窗口
        thread::yield_now();
        {
            let mut val = self.value.lock().unwrap();
            *val = new_v * A;
        }
        thread::yield_now();
        {
            let mut der = self.derived.lock().unwrap();
            *der = new_v * B;
        }
    }

    // 读取快照。
    pub fn snapshot(&self) -> (i64, i64, i64) {
        // 缺陷：三个字段分别读取、各自加锁，读到一半时可能被写线程穿插，
        // 导致 version、value、derived 来自不同版本，三元组互不自洽。
        let v = *self.version.lock().unwrap();
        thread::yield_now();
        let val = *self.value.lock().unwrap();
        let der = *self.derived.lock().unwrap();
        (v, val, der)
    }

    pub fn version(&self) -> i64 {
        *self.version.lock().unwrap()
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
