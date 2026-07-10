import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { FamilyFeed } from '@core/models';
import { format } from 'date-fns';

@Component({
  selector: 'app-feed-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="feed">
      <div class="avatar" [style.background-color]="feed.userAvatar || 'var(--brand-primary-light)'">
        {{ feed.userName[0] || 'U' }}
      </div>
      <div class="content">
        <div class="header">
          <span class="name">{{ feed.userName }}</span>
          <span class="time">{{ formatTime(feed.createdAt) }}</span>
        </div>
        <div class="body">
          <p *ngIf="feed.type === 'text'" class="text">{{ feed.content }}</p>
          <img *ngIf="feed.type === 'photo' && feed.photoUrl" [src]="feed.photoUrl" class="photo" alt="" />
          <app-voice-player
            *ngIf="feed.type === 'voice'"
            [audioUrl]="feed.voiceUrl || ''"
            [duration]="feed.voiceDuration || 0">
          </app-voice-player>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .feed {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: var(--radius-lg);
      background: var(--color-bg-secondary);
      margin-bottom: 0.75rem;
    }
    .avatar {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: var(--weight-semibold);
      flex-shrink: 0;
    }
    .content { flex: 1; min-width: 0; }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    .name {
      font-size: var(--text-sm);
      font-weight: var(--weight-semibold);
      color: var(--color-text-primary);
    }
    .time {
      font-size: var(--text-xs);
      color: var(--color-text-tertiary);
    }
    .body .text {
      font-size: var(--text-sm);
      color: var(--color-text-primary);
      line-height: 1.5;
    }
    .body .photo {
      max-width: 240px;
      border-radius: var(--radius-md);
    }
  `],
})
export class FeedItemComponent {
  @Input() feed!: FamilyFeed;

  formatTime(d: Date | string): string {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return format(date, 'MM-dd HH:mm');
  }
}
