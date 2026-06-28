export interface PollingController {
  start: () => void
  stop: () => void
}

type TimerHandle = ReturnType<typeof globalThis.setInterval>

export function createPollingController(
  intervalMs: number,
  onTick: () => void | Promise<void>,
  onCountdown?: (secondsLeft: number) => void,
): PollingController {
  const runtime = globalThis
  let tickTimer: TimerHandle | null = null
  let countdownTimer: TimerHandle | null = null
  let secondsLeft = Math.ceil(intervalMs / 1000)

  const clearTimers = () => {
    if (tickTimer !== null) {
      runtime.clearInterval(tickTimer)
      tickTimer = null
    }

    if (countdownTimer !== null) {
      runtime.clearInterval(countdownTimer)
      countdownTimer = null
    }
  }

  return {
    start() {
      clearTimers()
      secondsLeft = Math.ceil(intervalMs / 1000)
      onCountdown?.(secondsLeft)
      void onTick()

      tickTimer = runtime.setInterval(() => {
        secondsLeft = Math.ceil(intervalMs / 1000)
        onCountdown?.(secondsLeft)
        void onTick()
      }, intervalMs)

      countdownTimer = runtime.setInterval(() => {
        secondsLeft = Math.max(1, secondsLeft - 1)
        onCountdown?.(secondsLeft)
      }, 1000)
    },
    stop() {
      clearTimers()
    },
  }
}
