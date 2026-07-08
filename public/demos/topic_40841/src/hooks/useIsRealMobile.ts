import { useEffect, useState } from 'react'

/** 真机触摸设备：全屏展示，不套模拟机外框 */
export function useIsRealMobile() {
  const [isRealMobile, setIsRealMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 768px) and (hover: none)').matches
      : false,
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px) and (hover: none)')
    const onChange = (e: MediaQueryListEvent) => setIsRealMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return isRealMobile
}
