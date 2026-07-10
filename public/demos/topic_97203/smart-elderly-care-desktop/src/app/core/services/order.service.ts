import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { ServiceOrder } from '@core/models';
import { ElderService } from './elder.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient, private elderService: ElderService) {}

  list(): Observable<ServiceOrder[]> {
    const id = this.elderService.getActive()?.id ?? 'me';
    return this.http.get<ServiceOrder[]>(`${environment.apiBaseUrl}/elders/${id}/orders`);
  }

  getById(orderId: number): Observable<ServiceOrder> {
    const id = this.elderService.getActive()?.id ?? 'me';
    return this.http.get<ServiceOrder>(`${environment.apiBaseUrl}/elders/${id}/orders/${orderId}`);
  }

  create(payload: Partial<ServiceOrder>): Observable<ServiceOrder> {
    const id = this.elderService.getActive()?.id ?? 'me';
    return this.http.post<ServiceOrder>(`${environment.apiBaseUrl}/elders/${id}/orders`, payload);
  }
}
