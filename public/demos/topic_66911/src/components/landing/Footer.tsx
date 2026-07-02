'use client'

import Link from 'next/link'
import { Github, Twitter } from 'lucide-react'

const footerLinks = {
  product: [
    { label: '六艺', href: '#features' },
    { label: '演示', href: '#showcase' },
    { label: '流程', href: '#workflow' },
    { label: '解惑', href: '#faq' },
  ],
  resources: [
    { label: '使用文档', href: '/docs' },
    { label: 'API 参考', href: '/api-docs' },
    { label: 'GitHub', href: 'https://github.com' },
  ],
  company: [
    { label: '关于我们', href: '/about' },
    { label: '加入我们', href: '/careers' },
    { label: '联系方式', href: '/contact' },
  ],
}

function RedSeal({ text }: { text: string }) {
  return (
    <div
      className="border-2 flex items-center justify-center"
      style={{
        width: '32px',
        height: '32px',
        borderColor: '#B8956E',
        backgroundColor: 'rgba(184,149,110,0.08)',
      }}
    >
      <span
        className="font-bold"
        style={{
          fontFamily: 'Ma Shan Zheng, cursive',
          color: '#B8956E',
          fontSize: '10px',
          letterSpacing: '0.1em',
        }}
      >
        {text}
      </span>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="relative py-20" style={{ backgroundColor: '#1C1816' }}>
      <div className="flex justify-center mb-12">
        <svg className="w-32" viewBox="0 0 100 4" preserveAspectRatio="none">
          <path
            d="M0,2 Q25,0 50,2 T100,2"
            stroke="rgba(184,149,110,0.1)"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="5,3"
          />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12 mb-16">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <RedSeal text="彩笺寄" />
              <span
                className="text-[20px] tracking-widest"
                style={{
                  fontFamily: 'Ma Shan Zheng, cursive',
                  color: '#FAFAF8',
                }}
              >
                彩笺寄
              </span>
            </div>
            <p
              className="text-[12px] leading-[1.8] tracking-wide"
              style={{ color: '#7A7068' }}
            >
              以墨香古韵，助学术耕耘
            </p>
          </div>

          <div>
            <h4
              className="text-[12px] font-medium tracking-[0.3em] mb-5"
              style={{ color: '#8A8A8A' }}
            >
              产品
            </h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[12px] tracking-wider transition-colors duration-300 hover:text-[#FAFAF8] no-underline"
                    style={{ color: '#7A7068' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className="text-[12px] font-medium tracking-[0.3em] mb-5"
              style={{ color: '#8A8A8A' }}
            >
              资源
            </h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[12px] tracking-wider transition-colors duration-300 hover:text-[#FAFAF8] no-underline"
                    style={{ color: '#7A7068' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className="text-[12px] font-medium tracking-[0.3em] mb-5"
              style={{ color: '#8A8A8A' }}
            >
              关于
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[12px] tracking-wider transition-colors duration-300 hover:text-[#FAFAF8] no-underline"
                    style={{ color: '#7A7068' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className="text-[12px] font-medium tracking-[0.3em] mb-5"
              style={{ color: '#8A8A8A' }}
            >
              关注
            </h4>
            <div className="flex gap-4">
              <a
                href="https://github.com"
                className="w-10 h-10 flex items-center justify-center transition-all duration-300"
                style={{
                  backgroundColor: 'rgba(184,149,110,0.06)',
                  border: '1px solid rgba(184,149,110,0.1)',
                }}
              >
                <Github className="w-5 h-5" style={{ color: '#8B5E3C' }} />
              </a>
              <a
                href="https://twitter.com"
                className="w-10 h-10 flex items-center justify-center transition-all duration-300"
                style={{
                  backgroundColor: 'rgba(184,149,110,0.06)',
                  border: '1px solid rgba(184,149,110,0.1)',
                }}
              >
                <Twitter className="w-5 h-5" style={{ color: '#8B5E3C' }} />
              </a>
            </div>
          </div>
        </div>

        <div
          className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(250,250,248,0.04)' }}
        >
          <p
            className="text-[11px] tracking-wider"
            style={{ color: '#6A6560' }}
          >
            © 二〇二五 彩笺寄 · 智能学术写作助手
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-[11px] tracking-wider transition-colors duration-300 hover:text-[#8A8A8A] no-underline"
              style={{ color: '#6A6560' }}
            >
              隐私政策
            </Link>
            <Link
              href="/terms"
              className="text-[11px] tracking-wider transition-colors duration-300 hover:text-[#8A8A8A] no-underline"
              style={{ color: '#6A6560' }}
            >
              服务条款
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
