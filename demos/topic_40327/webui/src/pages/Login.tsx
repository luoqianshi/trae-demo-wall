import { useState, type FormEvent } from 'react'
import { useAuth } from '../lib/auth'
import { KeyRound, Shield } from 'lucide-react'

export function LoginPage() {
  const { login } = useAuth()
  const [inputToken, setInputToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = inputToken.trim()
    if (!trimmed) {
      setError('请输入访问令牌')
      return
    }
    setLoading(true)
    setError('')
    const ok = await login(trimmed)
    setLoading(false)
    if (!ok) {
      setError('令牌无效，请检查后重试')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="glass rounded-xl p-8 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'hsl(var(--primary) / 0.15)' }}>
              <Shield className="h-6 w-6" style={{ color: 'hsl(var(--primary))' }} />
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'hsl(var(--text))' }}>YaraFlow</h1>
            <p className="mt-1 text-sm" style={{ color: 'hsl(var(--text-muted))' }}>请输入访问令牌以继续</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'hsl(var(--text-muted))' }} />
              <input
                type="password"
                value={inputToken}
                onChange={e => setInputToken(e.target.value)}
                placeholder="访问令牌"
                autoFocus
                className="input w-full pl-9 pr-3 h-10 rounded-lg"
                style={{ borderColor: error ? 'hsl(var(--danger))' : undefined }}
              />
            </div>

            {error && (
              <p className="text-xs" style={{ color: 'hsl(var(--danger))' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-10 rounded-lg font-medium"
            >
              {loading ? '验证中...' : '登 录'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
            令牌在启动时生成，可在控制台或配置文件中查看
          </p>
        </div>
      </div>
    </div>
  )
}