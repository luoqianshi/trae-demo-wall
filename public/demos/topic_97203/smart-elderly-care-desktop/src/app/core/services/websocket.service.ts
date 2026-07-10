import { Injectable, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subject, Subscription as RxSubscription, timer } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { filter, map, retry } from 'rxjs/operators';
import { environment } from '@env/environment';
import { DeviceAlert, HealthRecord, Medication, FamilyFeed } from '@core/models';
import { AuthService } from './auth.service';

export type WsEventType =
  | 'device.alert'
  | 'device.status'
  | 'health.anomaly'
  | 'medication.reminder'
  | 'family.new_message'
  | 'emergency.alert';

export interface WsMessage<T = unknown> {
  type: WsEventType;
  payload: T;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private socket$: WebSocketSubject<WsMessage> | null = null;
  private reconnectSub: RxSubscription | null = null;
  private readonly messageSubject = new Subject<WsMessage>();
  private connected = false;

  constructor(private auth: AuthService, private zone: NgZone) {}

  connect(): void {
    if (this.connected) return;
    const token = this.auth.getToken();
    if (!token) return;
    const url = `${environment.wsBaseUrl}?token=${token}`;

    this.zone.runOutsideAngular(() => {
      this.socket$ = webSocket<WsMessage>({
        url,
        openObserver: {
          next: () => {
            this.connected = true;
          },
        },
        closeObserver: {
          next: () => {
            this.connected = false;
            this.scheduleReconnect();
          },
        },
      });

      this.socket$
        .pipe(retry({ delay: () => timer(3000), count: 3 }))
        .subscribe({
          next: (msg) => this.zone.run(() => this.messageSubject.next(msg)),
          error: () => this.scheduleReconnect(),
        });
    });
  }

  disconnect(): void {
    this.reconnectSub?.unsubscribe();
    this.socket$?.complete();
    this.socket$ = null;
    this.connected = false;
  }

  onDeviceAlert(): Observable<DeviceAlert> {
    return this.messageSubject
      .asObservable()
      .pipe(filter((m) => m.type === 'device.alert'), map((m) => m.payload as DeviceAlert));
  }

  onDeviceStatus(): Observable<unknown> {
    return this.messageSubject
      .asObservable()
      .pipe(filter((m) => m.type === 'device.status'), map((m) => m.payload));
  }

  onHealthAnomaly(): Observable<HealthRecord> {
    return this.messageSubject
      .asObservable()
      .pipe(filter((m) => m.type === 'health.anomaly'), map((m) => m.payload as HealthRecord));
  }

  onMedicationReminder(): Observable<Medication> {
    return this.messageSubject
      .asObservable()
      .pipe(filter((m) => m.type === 'medication.reminder'), map((m) => m.payload as Medication));
  }

  onFamilyMessage(): Observable<FamilyFeed> {
    return this.messageSubject
      .asObservable()
      .pipe(filter((m) => m.type === 'family.new_message'), map((m) => m.payload as FamilyFeed));
  }

  onEmergencyAlert(): Observable<unknown> {
    return this.messageSubject
      .asObservable()
      .pipe(filter((m) => m.type === 'emergency.alert'), map((m) => m.payload));
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private scheduleReconnect(): void {
    this.reconnectSub?.unsubscribe();
    this.reconnectSub = timer(3000).subscribe(() => this.connect());
  }
}
