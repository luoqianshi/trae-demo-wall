import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { FamilyService } from '@core/services';
import { FamilyFeed, CommunityActivity } from '@core/models';

@Component({
  selector: 'app-family',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './family.component.html',
  styleUrls: ['./family.component.scss'],
})
export class FamilyComponent implements OnInit, OnDestroy {
  feeds: FamilyFeed[] = [
    { id: 1, elderId: 1, userId: 2, userName: '张明', userAvatar: '#E89B6A', type: 'photo', content: '给妈妈寄的水果到了', photoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600', voiceUrl: null, voiceDuration: null, createdAt: new Date(Date.now() - 3600000) },
    { id: 2, elderId: 1, userId: 1, userName: '妈妈', userAvatar: '#5B8DC9', type: 'voice', content: '语音留言', photoUrl: null, voiceUrl: '', voiceDuration: 32, createdAt: new Date(Date.now() - 7200000) },
    { id: 3, elderId: 1, userId: 2, userName: '张明', userAvatar: '#E89B6A', type: 'text', content: '明天有雨，出门记得带伞 🌂', photoUrl: null, voiceUrl: null, voiceDuration: null, createdAt: new Date(Date.now() - 10800000) },
    { id: 4, elderId: 1, userId: 1, userName: '妈妈', userAvatar: '#5B8DC9', type: 'text', content: '今天社区有书法课，写了几个字很开心', photoUrl: null, voiceUrl: null, voiceDuration: null, createdAt: new Date(Date.now() - 14400000) },
    { id: 5, elderId: 1, userId: 2, userName: '张明', userAvatar: '#E89B6A', type: 'photo', content: '周末带孩子去看您', photoUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600', voiceUrl: null, voiceDuration: null, createdAt: new Date(Date.now() - 86400000) },
  ];

  commonActivities: CommunityActivity[] = [
    { id: 1, title: '一起看新闻', description: '', category: 'common', icon: 'read' },
    { id: 2, title: '听戏曲', description: '', category: 'common', icon: 'customer-service' },
    { id: 3, title: '每天健康打卡', description: '', category: 'common', icon: 'schedule' },
  ];

  communityActivities: CommunityActivity[] = [
    { id: 4, title: '社区书法课', description: '', category: 'community', icon: 'read', schedule: '每周三 14:00', remindable: true },
    { id: 5, title: '老年大学唱歌班', description: '', category: 'community', icon: 'customer-service', schedule: '每周五 10:00', remindable: true },
  ];

  draftText = '';
  private subs: Subscription[] = [];

  constructor(private familyService: FamilyService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.familyService.loadFeeds().subscribe({
      next: (feeds) => {
        this.feeds = feeds;
        this.cdr.markForCheck();
      },
      error: () => this.cdr.markForCheck(),
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  sendMessage(): void {
    if (!this.draftText.trim()) return;
    const draft = this.draftText;
    this.draftText = '';
    this.familyService.publish({ type: 'text', content: draft }).subscribe({
      next: (feed) => {
        this.feeds = [feed, ...this.feeds];
        this.cdr.markForCheck();
      },
      error: () => this.cdr.markForCheck(),
    });
  }

  remindActivity(activity: CommunityActivity): void {
    // 模拟设置提醒
    activity.remindable = false;
  }
}
