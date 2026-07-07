const locks = new Map();
const lockWaiters = new Map();

const LOCK_TIMEOUT = 30 * 1000;
const ACQUIRE_TIMEOUT = 5 * 1000;
const MAX_RETRY = 3;

function generateLockId(resourceKey, requesterId) {
  return `${resourceKey}_${requesterId}_${Date.now()}`;
}

function acquireLock(resourceKey, requesterId, options = {}) {
  return new Promise((resolve, reject) => {
    const lockTimeout = options.lockTimeout || LOCK_TIMEOUT;
    const acquireTimeout = options.acquireTimeout || ACQUIRE_TIMEOUT;
    const maxRetry = options.maxRetry || MAX_RETRY;
    let retryCount = 0;

    const tryAcquire = () => {
      const existingLock = locks.get(resourceKey);

      if (!existingLock || isLockExpired(existingLock)) {
        if (existingLock && isLockExpired(existingLock)) {
          releaseLock(resourceKey, 'timeout');
        }

        const lockRecord = {
          lockId: generateLockId(resourceKey, requesterId),
          resourceKey,
          requesterId,
          acquiredAt: Date.now(),
          expiredAt: Date.now() + lockTimeout,
          released: false
        };

        locks.set(resourceKey, lockRecord);

        setTimeout(() => {
          const lock = locks.get(resourceKey);
          if (lock && !lock.released && Date.now() > lock.expiredAt) {
            releaseLock(resourceKey, 'timeout');
          }
        }, lockTimeout);

        resolve({
          success: true,
          message: '锁获取成功',
          lockId: lockRecord.lockId,
          resourceKey,
          expiresIn: lockTimeout
        });
        return;
      }

      if (existingLock.requesterId === requesterId) {
        existingLock.expiredAt = Date.now() + lockTimeout;
        resolve({
          success: true,
          message: '锁已由当前请求者持有，已续期',
          lockId: existingLock.lockId,
          resourceKey,
          expiresIn: lockTimeout
        });
        return;
      }

      retryCount++;
      if (retryCount > maxRetry) {
        resolve({
          success: false,
          message: '获取锁失败，已达到最大重试次数',
          retryCount
        });
        return;
      }

      const backoffDelay = Math.pow(2, retryCount) * 100 + Math.random() * 100;

      if (Date.now() + backoffDelay > acquireTimeout) {
        resolve({
          success: false,
          message: '获取锁超时',
          retryCount
        });
        return;
      }

      setTimeout(tryAcquire, backoffDelay);
    };

    setTimeout(() => {
      resolve({
        success: false,
        message: '获取锁超时',
        retryCount
      });
    }, acquireTimeout);

    tryAcquire();
  });
}

function isLockExpired(lockRecord) {
  return lockRecord && !lockRecord.released && Date.now() > lockRecord.expiredAt;
}

function releaseLock(resourceKey, reason = 'manual') {
  const lockRecord = locks.get(resourceKey);
  if (!lockRecord || lockRecord.released) {
    return { success: false, message: '锁不存在或已释放' };
  }

  lockRecord.released = true;
  lockRecord.releaseReason = reason;
  lockRecord.releasedAt = Date.now();

  const waiters = lockWaiters.get(resourceKey) || [];
  if (waiters.length > 0) {
    const nextWaiter = waiters.shift();
    setTimeout(nextWaiter, 0);
  }

  return {
    success: true,
    message: `锁已释放，原因: ${reason}`,
    lockRecord
  };
}

function getLockStatus(resourceKey) {
  const lockRecord = locks.get(resourceKey);
  if (!lockRecord) {
    return { locked: false, message: '资源未被锁定' };
  }

  if (lockRecord.released) {
    return { locked: false, message: '锁已释放' };
  }

  if (isLockExpired(lockRecord)) {
    return { locked: false, message: '锁已过期' };
  }

  return {
    locked: true,
    lockId: lockRecord.lockId,
    requesterId: lockRecord.requesterId,
    acquiredAt: lockRecord.acquiredAt,
    expiresAt: lockRecord.expiredAt,
    remainingTime: Math.max(0, lockRecord.expiredAt - Date.now())
  };
}

function tryAcquireLock(resourceKey, requesterId) {
  const existingLock = locks.get(resourceKey);

  if (!existingLock || isLockExpired(existingLock)) {
    if (existingLock && isLockExpired(existingLock)) {
      releaseLock(resourceKey, 'timeout');
    }

    const lockRecord = {
      lockId: generateLockId(resourceKey, requesterId),
      resourceKey,
      requesterId,
      acquiredAt: Date.now(),
      expiredAt: Date.now() + LOCK_TIMEOUT,
      released: false
    };

    locks.set(resourceKey, lockRecord);

    setTimeout(() => {
      const lock = locks.get(resourceKey);
      if (lock && !lock.released && Date.now() > lock.expiredAt) {
        releaseLock(resourceKey, 'timeout');
      }
    }, LOCK_TIMEOUT);

    return {
      success: true,
      message: '锁获取成功',
      lockId: lockRecord.lockId
    };
  }

  return { success: false, message: '资源已被锁定' };
}

function extendLock(resourceKey, requesterId, additionalTime = LOCK_TIMEOUT) {
  const lockRecord = locks.get(resourceKey);
  if (!lockRecord || lockRecord.released) {
    return { success: false, message: '锁不存在或已释放' };
  }

  if (lockRecord.requesterId !== requesterId) {
    return { success: false, message: '无权续期他人持有的锁' };
  }

  lockRecord.expiredAt += additionalTime;

  return {
    success: true,
    message: '锁已续期',
    expiresAt: lockRecord.expiredAt,
    extendedBy: additionalTime
  };
}

function cleanupExpiredLocks() {
  const now = Date.now();
  locks.forEach((lockRecord, key) => {
    if (!lockRecord.released && now > lockRecord.expiredAt) {
      releaseLock(key, 'timeout_cleanup');
    }
  });
}

setInterval(cleanupExpiredLocks, 30 * 1000);

module.exports = {
  LOCK_TIMEOUT,
  ACQUIRE_TIMEOUT,
  acquireLock,
  releaseLock,
  getLockStatus,
  tryAcquireLock,
  extendLock
};