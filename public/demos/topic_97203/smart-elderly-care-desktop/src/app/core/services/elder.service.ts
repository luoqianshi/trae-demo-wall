import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '@env/environment';
import { Elder } from '@core/models';

@Injectable({ providedIn: 'root' })
export class ElderService {
  private readonly eldersSubject = new BehaviorSubject<Elder[]>([]);
  readonly elders$ = this.eldersSubject.asObservable();
  private readonly activeSubject = new BehaviorSubject<Elder | null>(null);
  readonly activeElder$ = this.activeSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadElders(): Observable<Elder[]> {
    return this.http.get<Elder[]>(`${environment.apiBaseUrl}/elders`).pipe(
      tap((elders) => {
        this.eldersSubject.next(elders);
        if (elders.length && !this.activeSubject.value) {
          this.activeSubject.next(elders[0]);
        }
      })
    );
  }

  setActive(elder: Elder): void {
    this.activeSubject.next(elder);
  }

  getActive(): Elder | null {
    return this.activeSubject.value;
  }
}
