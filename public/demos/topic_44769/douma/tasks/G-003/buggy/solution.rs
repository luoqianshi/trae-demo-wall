use std::sync::{Arc, Mutex};
use std::thread;

// 限量名额登记器：容量固定，多线程抢占名额，不得超卖。
pub struct SeatRegistry {
    capacity: usize,
    granted: Mutex<usize>, // 已发放名额数，用锁保护
}

impl SeatRegistry {
    pub fn new(capacity: usize) -> Self {
        SeatRegistry {
            capacity,
            granted: Mutex::new(0),
        }
    }

    // 抢占一个名额。
    pub fn try_acquire(&self) -> bool {
        // 缺陷：判断（check）与自增（act）拆成两个独立的临界区。
        // 第一段只读出当前发放数后立刻释放锁——多个线程可同时读到
        // 同一个「还有余量」的快照，从而都通过判断，最终一起自增导致超卖。
        let has_room = {
            let g = self.granted.lock().unwrap();
            *g < self.capacity
        }; // 锁在此释放，留出竞态窗口
        if !has_room {
            return false;
        }
        // 判断通过后到真正自增之间存在空窗（如记账/风控），
        // 让出 CPU 放大窗口，使并发线程更易同时跨过同一份余量判断。
        thread::yield_now();
        let mut g = self.granted.lock().unwrap();
        *g += 1;
        true
    }

    pub fn granted(&self) -> usize {
        *self.granted.lock().unwrap()
    }

    pub fn capacity(&self) -> usize {
        self.capacity
    }
}

// 起 threads 个线程，每线程连续抢占 per_thread 次，返回成功抢占的总次数。
pub fn run_concurrent(reg: &Arc<SeatRegistry>, threads: usize, per_thread: usize) -> usize {
    let mut handles = vec![];
    for _ in 0..threads {
        let r = Arc::clone(reg);
        handles.push(thread::spawn(move || {
            let mut ok = 0usize;
            for _ in 0..per_thread {
                if r.try_acquire() {
                    ok += 1;
                }
            }
            ok
        }));
    }
    handles.into_iter().map(|h| h.join().unwrap()).sum()
}
