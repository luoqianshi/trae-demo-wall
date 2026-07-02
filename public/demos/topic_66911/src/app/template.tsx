'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '../components/Navbar'
import { useEffect, useRef } from 'react'

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showNavbar = pathname !== '/' && !pathname.startsWith('/app') && pathname !== '/login' && pathname !== '/register'
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.classList.remove('animate-page-enter')
      void mainRef.current.offsetWidth
      mainRef.current.classList.add('animate-page-enter')
    }
  }, [pathname])

  return (
    <>
      {showNavbar && <Navbar />}
      <main ref={mainRef}>
        {children}
      </main>
    </>
  )
}
