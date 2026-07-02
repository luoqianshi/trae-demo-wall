import Link from 'next/link'
import { Button } from '../components/ui/Button'
import { FileQuestion, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] p-8">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#F5EDE3] flex items-center justify-center border border-[#E5DDD4]">
          <FileQuestion className="w-10 h-10 text-[#8B5E3C]" />
        </div>
        <h1 className="text-6xl font-bold text-[#E5DDD4] mb-2">404</h1>
        <h2 className="text-xl font-semibold text-[#2C2420] mb-2">页面未找到</h2>
        <p className="text-[#8A7E74] mb-8">你访问的页面不存在或已被移除</p>
        <Link href="/">
          <Button>
            <Home className="w-4 h-4" />
            返回首页
          </Button>
        </Link>
      </div>
    </div>
  )
}
