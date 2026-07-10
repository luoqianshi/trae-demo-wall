import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { environment } from '@env/environment';
import { Medication, MedicationLog } from '@core/models';
import { ElderService } from './elder.service';

@Injectable({ providedIn: 'root' })
export class MedicationService {
  private readonly medsSubject = new BehaviorSubject<Medication[]>([]);
  readonly medications$ = this.medsSubject.asObservable();

  constructor(private http: HttpClient, private elderService: ElderService) {}

  loadMedications(): Observable<Medication[]> {
    const id = this.elderService.getActive()?.id ?? 'me';
    return this.http.get<Medication[]>(`${environment.apiBaseUrl}/elders/${id}/medications`).pipe(
      tap((meds) => this.medsSubject.next(meds))
    );
  }

  toggleTaken(medId: number, taken: boolean): Observable<MedicationLog> {
    return this.http.patch<MedicationLog>(`${environment.apiBaseUrl}/medications/${medId}/log`, { taken });
  }

  getAdherence(): Observable<{ medicationId: number; total: number; taken: number; rate: number }[]> {
    const id = this.elderService.getActive()?.id ?? 'me';
    return this.http.get<{ id: number; name: string; totalDoses: number; takenDoses: number; adherenceRate: number }[]>(
      `${environment.apiBaseUrl}/elders/${id}/medications/adherence`
    ).pipe(
      map((rows) =>
        rows.map((r) => ({
          medicationId: r.id,
          total: r.totalDoses,
          taken: r.takenDoses,
          rate: Math.round(r.adherenceRate * 100),
        }))
      )
    );
  }
}
