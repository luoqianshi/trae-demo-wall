import { useNavigate } from 'react-router-dom'
import { Home, Compass } from 'lucide-react'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="glass rounded-2xl p-12 shadow-lg">
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
          }}
        >
          <Compass className="h-10 w-10 text-white" aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-6xl font-extrabold tracking-tight">404</h1>
        <p className="mb-1 text-lg font-semibold">页面走丢了</p>
        <p className="mb-8 text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
          你访问的页面不存在或已被移动
        </p>
        <button
          onClick={() => navigate('/')}
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          返回首页
        </button>
      </div>
    </div>
  )
}
