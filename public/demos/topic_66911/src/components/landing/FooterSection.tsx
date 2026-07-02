'use client'

import Link from 'next/link'
import { Mail, MapPin, Phone, Heart } from 'lucide-react'
import { AncientSeal } from '../ui/AncientSeal'

const productLinks = [
  { label: '八宝功能', href: '#features' },
  { label: '文思路径', href: '#workflow' },
  { label: '墨砚展示', href: '#showcase' },
  { label: '学者心声', href: '#testimonials' },
]

const supportLinks = [
  { label: '答疑解惑', href: '#faq' },
  { label: '使用指南', href: '/app' },
  { label: '联系我们', href: '#' },
]

const aboutLinks = [
  { label: '关于我们', href: '#' },
  { label: '隐私政策', href: '#' },
  { label: '服务条款', href: '#' },
]

const linkTransition =
  'transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)]'

export default function FooterSection() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-[#1C1816] text-[#E8E2DB] px-6 md:px-12 pt-16 pb-8 relative">
      {/* Animated flowing gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
        <div
          className="absolute inset-0 animate-footer-gradient-flow"
          style={{
            background: 'linear-gradient(90deg, transparent, #8B5E3C, #C4A882, #E8D5B8, #C4A882, #8B5E3C, transparent)',
            backgroundSize: '200% 100%',
          }}
        />
      </div>

      {/* Decorative top line */}
      <div className="max-w-[1200px] mx-auto mb-12">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-[#C4A882]/30 to-transparent" />
      </div>

      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12">
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="font-display text-2xl text-[#C4A882]">
                彩笺寄
              </div>
              <AncientSeal />
            </div>
            <p className="text-sm text-[#B5A99A] leading-[1.7] mb-5 font-serif max-w-[280px]">
              以墨香古韵，助学术耕耘。
              <br />
              智笔绘章，使长周期学术著述有章可循。
            </p>
            <div className="space-y-2.5">
              <a
                href="mailto:support@caijianji.com"
                className={`flex items-center gap-2.5 text-sm text-[#B5A99A] no-underline ${linkTransition} hover:text-[#C4A882] hover:translate-x-1`}
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>support@caijianji.com</span>
              </a>
              <div className="flex items-center gap-2.5 text-sm text-[#B5A99A]">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>400-888-9999</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-[#B5A99A]">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>北京市海淀区中关村</span>
              </div>
            </div>
          </div>

          {/* Product column */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-5 tracking-[0.05em]">
              妙笔功能
            </h4>
            <ul className="space-y-3 list-none m-0 p-0">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className={`block text-sm text-[#B5A99A] no-underline font-serif ${linkTransition} hover:text-[#C4A882] hover:translate-x-1`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support column */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-5 tracking-[0.05em]">
              帮助支持
            </h4>
            <ul className="space-y-3 list-none m-0 p-0">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith('/') ? (
                    <Link
                      href={link.href}
                      className={`block text-sm text-[#B5A99A] no-underline font-serif ${linkTransition} hover:text-[#C4A882] hover:translate-x-1`}
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className={`block text-sm text-[#B5A99A] no-underline font-serif ${linkTransition} hover:text-[#C4A882] hover:translate-x-1`}
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* About column */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-5 tracking-[0.05em]">
              关于彩笺
            </h4>
            <ul className="space-y-3 list-none m-0 p-0">
              {aboutLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className={`block text-sm text-[#B5A99A] no-underline font-serif ${linkTransition} hover:text-[#C4A882] hover:translate-x-1`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar with animated separator */}
        <div className="mt-14 pt-6 relative">
          {/* Animated separator line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden">
            <div
              className="absolute inset-0 animate-footer-gradient-flow"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(196,168,130,0.15) 20%, rgba(196,168,130,0.25) 50%, rgba(196,168,130,0.15) 80%, transparent)',
                backgroundSize: '200% 100%',
              }}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-[#B5A99A] font-serif">
              &copy; {new Date().getFullYear()} 彩笺寄 - 智笔绘章 &middot; 学术写作良伴. All rights
              reserved.
            </p>
            <p className="text-[13px] text-[#B5A99A] flex items-center gap-1.5 font-serif">
              以{' '}
              <Heart className="w-3 h-3 text-cinnabar fill-cinnabar" />{' '}
              为学者而作
            </p>
          </div>
        </div>
      </div>

      {/* Vertical poetry decoration */}
      <div className="writing-vertical text-[#B5A99A]/20 text-xs font-display absolute right-8 bottom-8 hidden lg:block">
        学海无涯
      </div>

      {/* Back to top floating button */}
      <button
        onClick={scrollToTop}
        className="absolute bottom-8 right-8 lg:right-auto lg:left-1/2 lg:-translate-x-1/2 w-10 h-10 rounded-full bg-[#2C2420] border border-[#C4A882]/20 flex items-center justify-center text-[#C4A882] transition-all duration-300 ease-spring hover:bg-[#3A302A] hover:border-[#C4A882]/40 hover:scale-110 hover:shadow-[0_4px_20px_rgba(196,168,130,0.2)] group"
        aria-label="回到顶部"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-300 group-hover:-translate-y-0.5"
        >
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>

      {/* Footer gradient flow animation */}
      <style jsx>{`
        @keyframes footer-gradient-flow {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        .animate-footer-gradient-flow {
          animation: footer-gradient-flow 4s linear infinite;
        }
      `}</style>
    </footer>
  )
}
