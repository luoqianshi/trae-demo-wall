import { useNavigate } from 'react-router-dom'
import { Clock, MapPin } from 'lucide-react'
import type { Activity } from '@/types'
import TrustBadge from './TrustBadge'
import TrustScorePill from './TrustScorePill'
import ActivityCover from './ActivityCover'

interface Props {
  activity: Activity
  featured?: boolean
}

export default function ActivityCard({ activity, featured = false }: Props) {
  const navigate = useNavigate()

  if (featured) {
    return (
      <article
        onClick={() => navigate(`/app/detail/${activity.id}`)}
        className="mobile-card mobile-card--interactive mobile-card--featured overflow-hidden"
      >
        <div className="mobile-card--featured-cover">
          <ActivityCover activity={activity} className="h-full w-full" showCategory />
          <div className="absolute inset-0 z-[1] flex flex-col justify-end p-4">
            <TrustBadge level={activity.trustLevel} size="md" />
            <h3 className="mt-2 text-[19px] font-bold leading-snug tracking-tight text-white">
              {activity.title}
            </h3>
            <p className="mt-1 truncate text-[12px] text-white/75">{activity.organizer}</p>
          </div>
          <div className="absolute right-3 top-3 z-[2]">
            <TrustScorePill score={activity.trustScore} size="md" />
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-[12px] text-ink-muted">
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {activity.distance > 0 ? `${activity.distance} km` : '线上活动'}
          </span>
          <span>{activity.time.split(' ')[0]}</span>
        </div>
      </article>
    )
  }

  return (
    <article
      onClick={() => navigate(`/app/detail/${activity.id}`)}
      className={`mobile-card mobile-card--interactive mobile-card--list mobile-card--trust-${activity.trustLevel}`}
    >
      <ActivityCover
        activity={activity}
        className="h-[96px] w-[96px] flex-shrink-0 rounded-[16px]"
        showCategory
      />

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 flex-1 text-[15px] font-semibold leading-snug tracking-tight text-ink">
              {activity.title}
            </h3>
            <TrustScorePill score={activity.trustScore} />
          </div>
          <p className="mt-1 truncate text-[11px] text-ink-muted">{activity.organizer}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-ink-muted">
            <Clock size={10} className="flex-shrink-0 opacity-70" />
            <span className="truncate">{activity.time.split(' ')[0]}</span>
            {activity.fee && <span className="mobile-fee-tag">{activity.fee}</span>}
            {activity.distance > 0 && (
              <span className="ml-auto text-[10px] font-medium text-ink-secondary">{activity.distance}km</span>
            )}
          </div>
        </div>

        <div className="mt-2.5">
          <TrustBadge level={activity.trustLevel} />
        </div>
      </div>
    </article>
  )
}
