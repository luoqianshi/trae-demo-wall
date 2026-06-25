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

    // 抢占一个名额：判断「是否还有余量」与「自增已发放数」在同一临界区内
    // 一气呵成，杜绝多个线程同时通过同一份余量判断而导致超卖。
    pub fn try_acquire(&self) -> bool {
        let mut g = self.granted.lock().unwrap();
        if *g < self.capacity {
            *g += 1;
            true
        } else {
            false
        }
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
