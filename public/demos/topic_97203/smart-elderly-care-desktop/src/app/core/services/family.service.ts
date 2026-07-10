import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { environment } from '@env/environment';
import { FamilyFeed, CommunityActivity } from '@core/models';
import { ElderService } from './elder.service';

interface BackendCommunityActivity {
  id: number;
  title: string;
  description: string | null;
  category: string;
  schedule: Date;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  imageUrl: string | null;
  status: string;
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class FamilyService {
  private readonly feedsSubject = new BehaviorSubject<FamilyFeed[]>([]);
  readonly feeds$ = this.feedsSubject.asObservable();

  constructor(private http: HttpClient, private elderService: ElderService) {}

  loadFeeds(): Observable<FamilyFeed[]> {
    const id = this.elderService.getActive()?.id ?? 'me';
    return this.http.get<FamilyFeed[]>(`${environment.apiBaseUrl}/elders/${id}/feeds`).pipe(
      tap((feeds) => this.feedsSubject.next(feeds))
    );
  }

  publish(payload: { type: 'text' | 'photo' | 'voice'; content: string; photoUrl?: string; voiceUrl?: string; voiceDuration?: number }): Observable<FamilyFeed> {
    const id = this.elderService.getActive()?.id ?? 'me';
    return this.http.post<FamilyFeed>(`${environment.apiBaseUrl}/elders/${id}/feeds`, payload);
  }

  replyFeed(feedId: number, content: string): Observable<FamilyFeed> {
    const id = this.elderService.getActive()?.id ?? 'me';
    return this.http.post<FamilyFeed>(`${environment.apiBaseUrl}/elders/${id}/feeds/${feedId}/reply`, { content });
  }

  loadCommunityActivities(): Observable<CommunityActivity[]> {
    return this.http.get<BackendCommunityActivity[]>(`${environment.apiBaseUrl}/community/activities`).pipe(
      map((rows) =>
        rows.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description ?? '',
          category: r.category as 'common' | 'community',
          icon: this.iconFromCategory(r.category),
          schedule: r.schedule ? new Date(r.schedule).toLocaleDateString('zh-CN') : undefined,
          remindable: r.status === 'upcoming',
          location: r.location,
          maxParticipants: r.maxParticipants,
          currentParticipants: r.currentParticipants,
          imageUrl: r.imageUrl ?? undefined,
          status: r.status,
        }))
      )
    );
  }

  registerActivity(activityId: number, elderId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiBaseUrl}/community/activities/${activityId}/register`,
      { elderId }
    );
  }

  private iconFromCategory(category: string): string {
    const map: Record<string, string> = {
      common: 'read',
      community: 'team',
      exercise: 'thunderbolt',
      culture: 'read',
    };
    return map[category] ?? 'calendar';
  }
}
