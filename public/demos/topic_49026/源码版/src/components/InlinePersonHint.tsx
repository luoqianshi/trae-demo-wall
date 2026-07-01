import { useEffect, useState } from 'react'
import { User } from 'lucide-react'

interface InlinePersonHintProps {
  personName: string | null
  onExpand: () => void
}

export function InlinePersonHint({ personName, onExpand }: InlinePersonHintProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!personName) {
      setVisible(false)
      return
    }
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), 3000)
    return () => clearTimeout(timer)
  }, [personName])

  if (!visible || !personName) return null

  return (
    <button
      onClick={() => { onExpand(); setVisible(false) }}
      className="flex items-center gap-2 mx-3 mb-1 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs"
    >
      <User size={12} />
      <span>帮你想怎么回复{personName}？</span>
    </button>
  )
}
