import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '@env/environment';
import { Device, DeviceAlert } from '@core/models';
import { ElderService } from './elder.service';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly devicesSubject = new BehaviorSubject<Device[]>([]);
  readonly devices$ = this.devicesSubject.asObservable();
  private readonly alertsSubject = new BehaviorSubject<DeviceAlert[]>([]);
  readonly alerts$ = this.alertsSubject.asObservable();

  constructor(private http: HttpClient, private elderService: ElderService) {}

  loadDevices(): Observable<Device[]> {
    const elder = this.elderService.getActive();
    const elderId = elder?.id ?? 'me';
    return this.http.get<Device[]>(`${environment.apiBaseUrl}/elders/${elderId}/devices`).pipe(
      tap((devices) => this.devicesSubject.next(devices))
    );
  }

  loadAlerts(): Observable<DeviceAlert[]> {
    const elder = this.elderService.getActive();
    const elderId = elder?.id ?? 'me';
    return this.http.get<DeviceAlert[]>(`${environment.apiBaseUrl}/elders/${elderId}/alerts`).pipe(
      tap((alerts) => this.alertsSubject.next(alerts))
    );
  }

  getDeviceById(id: number): Observable<Device> {
    const elder = this.elderService.getActive();
    const elderId = elder?.id ?? 'me';
    return this.http.get<Device>(`${environment.apiBaseUrl}/elders/${elderId}/devices/${id}`);
  }

  addDevice(data: Partial<Device>): Observable<Device> {
    const elder = this.elderService.getActive();
    const elderId = elder?.id ?? 'me';
    return this.http.post<Device>(`${environment.apiBaseUrl}/elders/${elderId}/devices`, data);
  }

  pushAlert(alert: DeviceAlert): void {
    const current = this.alertsSubject.value;
    this.alertsSubject.next([alert, ...current]);
  }
}
