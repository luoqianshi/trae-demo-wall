export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

export function showToast(title: string, icon: 'success' | 'error' | 'loading' | 'none' = 'none'): void {
  uni.showToast({
    title,
    icon,
    duration: 2000
  })
}

export function showModal(title: string, content: string): Promise<boolean> {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

export function navigateTo(url: string): void {
  uni.navigateTo({ url })
}

export function navigateBack(): void {
  uni.navigateBack()
}

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: unknown, ...args: unknown[]) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  } as T
}

export function throttle<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let lastTime = 0
  return function (this: unknown, ...args: unknown[]) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn.apply(this, args)
    }
  } as T
}
