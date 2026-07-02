'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, LayoutDashboard, PlusCircle, BarChart3, Menu, X } from 'lucide-react'

const navItems = [
  { href: '/', label: '首页', icon: BookOpen },
  { href: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { href: '/plans/new', label: '新建计划', icon: PlusCircle },
  { href: '/statistics', label: '数据统计', icon: BarChart3 },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 px-6 md:px-12 h-16 flex items-center justify-between transition-all duration-300 ${
        scrolled ? 'bg-[#FAF8F5]/85 backdrop-blur-xl shadow-md' : 'bg-transparent'
      }`}
    >
      <Link href="/" className="flex items-center gap-2.5">
        <BookOpen className="w-6 h-6 text-[#8B5E3C]" />
        <span className="font-display text-xl text-[#8B5E3C]">彩笺寄</span>
      </Link>

      {/* Desktop Nav */}
      <div className="hidden md:flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#8B5E3C] text-white'
                  : 'text-[#5A5048] hover:text-[#8B5E3C] hover:bg-[#F5EDE3]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden p-2 rounded-lg hover:bg-[#F5F0EB] transition-colors"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-[#E5DDD4] shadow-lg md:hidden">
          <div className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#8B5E3C] text-white'
                      : 'text-[#5A5048] hover:bg-[#F5F0EB]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
