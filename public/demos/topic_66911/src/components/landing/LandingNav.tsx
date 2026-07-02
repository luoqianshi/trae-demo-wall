'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { href: '#features', label: '六艺' },
  { href: '#showcase', label: '演示' },
  { href: '#workflow', label: '流程' },
  { href: '#faq', label: '解惑' },
]

function RedSealLogo({ scrolled }: { scrolled: boolean }) {
  return (
    <div
      className="border-2 flex items-center justify-center"
      style={{
        width: '32px',
        height: '32px',
        borderColor: '#B54A3A',
        backgroundColor: scrolled ? 'rgba(181,74,58,0.06)' : 'rgba(181,74,58,0.12)',
      }}
    >
      <span
        className="font-bold"
        style={{
          fontFamily: 'Ma Shan Zheng, cursive',
          color: '#B54A3A',
          fontSize: '10px',
          letterSpacing: '0.1em',
        }}
      >
        彩笺寄
      </span>
    </div>
  )
}

function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50"
      style={{ backgroundColor: 'rgba(28,24,22,0.98)' }}
    >
      <div className="flex flex-col h-full px-6 py-8">
        <button
          onClick={onClose}
          className="self-end p-2"
          style={{ color: '#8A8A8A' }}
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          {navLinks.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="text-[32px] tracking-widest no-underline"
              style={{
                fontFamily: 'Ma Shan Zheng, cursive',
                color: '#FAFAF8',
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.15}s`,
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex justify-center">
          <Link
            href="/login"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-8 py-4 text-[15px] font-medium tracking-wider no-underline"
            style={{
              backgroundColor: '#B54A3A',
              color: '#FFFFFF',
              fontFamily: 'Ma Shan Zheng, cursive',
              boxShadow: '0 4px 16px rgba(181,74,58,0.3)',
            }}
          >
            开启书卷
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!mounted) return null

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          backgroundColor: scrolled ? 'rgba(250,250,248,0.96)' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(28,24,22,0.04)' : 'none',
        }}
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="flex items-center gap-3 no-underline">
              <RedSealLogo scrolled={scrolled} />
              <span
                className="text-[18px] md:text-[20px] tracking-widest"
                style={{
                  fontFamily: 'Ma Shan Zheng, cursive',
                  color: scrolled ? '#1C1816' : '#1C1816',
                }}
              >
                彩笺寄
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-10">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[13px] tracking-[0.3em] no-underline relative"
                  style={{
                    color: scrolled ? '#6A6A6A' : '#6A6A6A',
                    fontFamily: 'Noto Serif SC, serif',
                  }}
                >
                  {link.label}
                  <span
                    className="absolute -bottom-1 left-0 w-0 h-px transition-all duration-300"
                    style={{ backgroundColor: '#8B5E3C' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.width = '100%'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.width = '0'
                    }}
                  />
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium tracking-wider no-underline transition-all duration-300"
                style={{
                  backgroundColor: scrolled ? '#1C1816' : '#1C1816',
                  color: '#FAFAF8',
                  fontFamily: 'Ma Shan Zheng, cursive',
                }}
              >
                开启书卷
              </Link>

              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2"
                style={{ color: scrolled ? '#1C1816' : '#1C1816' }}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      )}
    </>
  )
}
