import { useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { usePlayerStore } from '@/store/playerStore'

export default function SearchBar() {
  const [input, setInput] = useState('')
  const search = usePlayerStore((s) => s.search)
  const searchKeyword = usePlayerStore((s) => s.searchKeyword)
  const clearSearch = usePlayerStore((s) => s.clearSearch)

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      search(input.trim())
    }
  }, [input, search])

  const handleClear = useCallback(() => {
    setInput('')
    clearSearch()
  }, [clearSearch])

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-3 text-gray-400" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="搜索歌曲、歌手..."
          className="w-full pl-9 pr-9 py-2.5 bg-gray-100/80 border border-gray-200/60 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/90 transition-all"
        />
        {input && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-full hover:bg-gray-200/50 transition-colors"
          >
            <X size={14} className="text-gray-400" />
          </button>
        )}
      </div>
    </form>
  )
}
