'use client'

import { useEffect, useRef, useState } from 'react'

// Reveal component for scroll-triggered animations
export function Reveal({
  children,
  delay = 0,
  className = ''
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// RevealGroup for staggered animations
export function RevealGroup({
  children,
  stagger = 100,
  className = ''
}: {
  children: React.ReactNode
  stagger?: number
  className?: string
}) {
  const childArray = Array.isArray(children) ? children : [children]

  return (
    <div className={className}>
      {childArray.map((child, i) => (
        <div
          key={i}
          style={{
            opacity: 0,
            transform: 'translateY(20px)',
            animation: `revealIn 0.6s ease forwards`,
            animationDelay: `${i * stagger}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}
