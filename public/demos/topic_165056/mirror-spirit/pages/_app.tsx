import { useState, useEffect } from 'react'
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { DemoProvider } from '../lib/useDemo'
import DemoTimeline from '../components/DemoTimeline'
import OnboardingModal from '../components/OnboardingModal'
import { useDemo } from '../lib/useDemo'

function DemoWrapper({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const { toggleDemoMode } = useDemo()

  useEffect(() => {
    const hasSeen = localStorage.getItem('mirror_spirit_onboarded')
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setShowOnboarding(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setShowOnboarding(false)
    localStorage.setItem('mirror_spirit_onboarded', 'true')
  }

  const handleStartDemo = () => {
    toggleDemoMode()
  }

  return (
    <>
      {children}
      <DemoTimeline />
      {showOnboarding && (
        <OnboardingModal onClose={handleClose} onStartDemo={handleStartDemo} />
      )}
    </>
  )
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <DemoProvider>
      <DemoWrapper>
        <Component {...pageProps} />
      </DemoWrapper>
    </DemoProvider>
  )
}

export default MyApp
