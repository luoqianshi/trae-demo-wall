import { describe, expect, it, vi } from 'vitest'
import { createPollingController } from '@/utils/timer'

describe('createPollingController', () => {
  it('启动后立即触发一次并支持停止', () => {
    vi.useFakeTimers()
    const onTick = vi.fn()
    const onCountdown = vi.fn()
    const controller = createPollingController(3000, onTick, onCountdown)

    controller.start()

    expect(onTick).toHaveBeenCalledTimes(1)
    expect(onCountdown).toHaveBeenCalledWith(3)

    vi.advanceTimersByTime(3000)

    expect(onTick).toHaveBeenCalledTimes(2)

    controller.stop()
    vi.advanceTimersByTime(3000)

    expect(onTick).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })
})
