import type { ReactNode } from 'react'
import { Signal, Wifi, BatteryMedium } from 'lucide-react'
import { useIsRealMobile } from '@/hooks/useIsRealMobile'

interface Props {
  children: ReactNode
}

function StatusBar() {
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return (
    <div className="phone-status-bar">
      <span className="phone-status-time">{time}</span>
      <div className="phone-dynamic-island" />
      <div className="phone-status-icons">
        <Signal size={13} strokeWidth={2.2} />
        <Wifi size={13} strokeWidth={2.2} />
        <BatteryMedium size={15} strokeWidth={2.2} />
      </div>
    </div>
  )
}

export default function PhoneFrame({ children }: Props) {
  const isRealMobile = useIsRealMobile()

  if (isRealMobile) {
    return (
      <div className="mobile-native-shell">
        {children}
      </div>
    )
  }

  return (
    <div className="phone-demo-stage">
      <div className="phone-device-glow" aria-hidden />
      <div className="phone-device">
        <div className="phone-side-btn phone-side-btn--silent" />
        <div className="phone-side-btn phone-side-btn--vol-up" />
        <div className="phone-side-btn phone-side-btn--vol-down" />

        <div className="phone-bezel">
          <div className="phone-screen phone-screen--demo">
            <StatusBar />
            <div className="phone-screen-body">
              {children}
            </div>
          </div>
          <div className="phone-home-indicator" />
        </div>
      </div>
    </div>
  )
}
