import { Calendar, MapPin, ShoppingCart, ClipboardCopy } from 'lucide-react'
import { executeAction, type ActionSuggestion } from '../lib/actionEngine'

const ICONS = {
  calendar: Calendar,
  location: MapPin,
  purchase: ShoppingCart,
  reply: ClipboardCopy,
  reminder: Calendar,
}

export function ActionSuggestions({ actions }: { actions: ActionSuggestion[] }) {
  if (actions.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {actions.map((action) => {
        const Icon = ICONS[action.type]
        return (
          <button
            key={action.id}
            onClick={() => executeAction(action)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zen-terracotta/10 text-zen-terracotta text-xs hover:bg-zen-terracotta/20 transition-colors"
            title={action.description}
          >
            <Icon className="w-3.5 h-3.5" />
            {action.title}
          </button>
        )
      })}
    </div>
  )
}
