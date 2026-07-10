import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '@env/environment';
import { ActivityEvent, PageQuery } from '@core/models';
import { ElderService } from './elder.service';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly eventsSubject = new BehaviorSubject<ActivityEvent[]>([]);
  readonly events$ = this.eventsSubject.asObservable();

  constructor(private http: HttpClient, private elderService: ElderService) {}

  loadEvents(query?: PageQuery): Observable<ActivityEvent[]> {
    const id = this.elderService.getActive()?.id ?? 'me';
    let params = new HttpParams();
    if (query?.start) params = params.set('start', query.start);
    if (query?.end) params = params.set('end', query.end);
    if (query?.type) params = params.set('type', query.type);
    if (query?.search) params = params.set('search', query.search);
    return this.http.get<ActivityEvent[]>(`${environment.apiBaseUrl}/elders/${id}/events`, { params }).pipe(
      tap((events) => this.eventsSubject.next(events))
    );
  }
}
