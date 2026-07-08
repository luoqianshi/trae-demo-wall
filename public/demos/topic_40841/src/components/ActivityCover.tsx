import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import type { Activity } from '@/types'

interface Props {
  activity: Activity
  className?: string
  imgClassName?: string
  showDistance?: boolean
  showCategory?: boolean
}

export default function ActivityCover({
  activity,
  className = '',
  imgClassName = '',
  showDistance = false,
  showCategory = false,
}: Props) {
  const [errored, setErrored] = useState(false)
  const hasVideo = Boolean(activity.coverVideo)
  const hasImage = activity.coverImage && !errored

  return (
    <div className={`cover-frame ${className}`}>
      {hasVideo ? (
        <video
          src={activity.coverVideo}
          poster={activity.coverImage}
          className={`h-full w-full object-cover ${imgClassName}`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : hasImage ? (
        <img
          src={activity.coverImage}
          alt={activity.title}
          className={`h-full w-full object-cover ${imgClassName}`}
          loading="lazy"
          onError={() => setErrored(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 to-surface-subtle">
          <ShieldAlert size={28} className="text-ink-faint" strokeWidth={1.5} />
        </div>
      )}

      {showCategory && activity.category && (
        <span className="cover-tag cover-tag--category">{activity.category}</span>
      )}

      {showDistance && activity.distance > 0 && (
        <span className="cover-tag cover-tag--distance">{activity.distance}km</span>
      )}
    </div>
  )
}
