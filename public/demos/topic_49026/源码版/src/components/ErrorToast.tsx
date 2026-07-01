import { useEffect, useState } from 'react'

export function ErrorToast() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setError(`${detail.context}: ${detail.message}`)
      setTimeout(() => setError(null), 5000)
    }
    window.addEventListener('app-error', handler)
    return () => window.removeEventListener('app-error', handler)
  }, [])

  if (!error) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-lg bg-zen-crimson text-white text-sm shadow-lg">
      {error}
    </div>
  )
}
