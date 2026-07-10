import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { HealthRecord, HealthReport } from '@core/models';
import { ElderService } from './elder.service';

@Injectable({ providedIn: 'root' })
export class HealthService {
  constructor(private http: HttpClient, private elderService: ElderService) {}

  getLatest(): Observable<HealthRecord> {
    const id = this.elderService.getActive()?.id ?? 'me';
    return this.http.get<HealthRecord>(`${environment.apiBaseUrl}/elders/${id}/health/latest`);
  }

  getTrend(type: 'bp' | 'heartRate' | 'bloodSugar' | 'weight' | 'steps' | 'sleep', days: number): Observable<HealthRecord[]> {
    const id = this.elderService.getActive()?.id ?? 'me';
    const backendType = this.toBackendTrendType(type);
    const params = new HttpParams().set('type', backendType).set('days', days.toString());
    return this.http.get<HealthRecord[]>(`${environment.apiBaseUrl}/elders/${id}/health/trend`, { params });
  }

  private toBackendTrendType(type: string): string {
    const map: Record<string, string> = {
      bp: 'bloodPressure',
      heartRate: 'heartRate',
      bloodSugar: 'bloodSugar',
      weight: 'weight',
      steps: 'steps',
      sleep: 'sleep',
    };
    return map[type] ?? type;
  }

  getReport(period: 'week' | 'month' | 'quarter' = 'week'): Observable<HealthReport> {
    const id = this.elderService.getActive()?.id ?? 'me';
    const params = new HttpParams().set('period', period);
    return this.http.get<HealthReport>(`${environment.apiBaseUrl}/elders/${id}/health/report`, { params });
  }
}
