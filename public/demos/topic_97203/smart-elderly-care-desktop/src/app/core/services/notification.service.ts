import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { NotificationSettings } from '@core/models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private http: HttpClient) {}

  get(): Observable<NotificationSettings> {
    return this.http.get<NotificationSettings>(`${environment.apiBaseUrl}/users/me/notifications`);
  }

  update(settings: Partial<NotificationSettings>): Observable<NotificationSettings> {
    return this.http.put<NotificationSettings>(`${environment.apiBaseUrl}/users/me/notifications`, settings);
  }

  getMobile(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${environment.apiBaseUrl}/users/me/notification-settings`);
  }

  getPermissions(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${environment.apiBaseUrl}/users/me/permissions`);
  }

  getReportSettings(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${environment.apiBaseUrl}/users/me/report-settings`);
  }
}
