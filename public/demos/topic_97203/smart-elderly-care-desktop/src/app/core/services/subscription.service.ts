import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { Subscription, PlanInfo, PaymentRecord, SubscriptionPlan, SubscriptionStatus } from '@core/models';

interface BackendPlan {
  id: SubscriptionPlan;
  name: string;
  price: number;
  features: string[];
}

interface BackendSubscription {
  id: number;
  userId: number;
  plan: SubscriptionPlan;
  status: string;
  price: number;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface BackendPayment {
  id: number;
  subscriptionId: number;
  userId: number;
  plan: string;
  amount: number;
  paymentMethod: string;
  status: string;
  paidAt: Date;
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  constructor(private http: HttpClient) {}

  getCurrent(): Observable<Subscription> {
    return this.http
      .get<BackendSubscription>(`${environment.apiBaseUrl}/users/me/subscription`)
      .pipe(map((s) => this.toSubscription(s)));
  }

  getPlans(): Observable<PlanInfo[]> {
    return this.http.get<BackendPlan[]>(`${environment.apiBaseUrl}/plans`).pipe(
      map((plans) =>
        plans.map((p) => ({
          plan: p.id,
          name: p.name,
          price: p.price,
          features: p.features.map((label) => ({ label, included: true as const })),
          recommended: p.id === 'premium',
        }))
      )
    );
  }

  update(plan: SubscriptionPlan): Observable<Subscription> {
    return this.http
      .put<BackendSubscription>(`${environment.apiBaseUrl}/users/me/subscription`, { plan })
      .pipe(map((s) => this.toSubscription(s)));
  }

  getPayments(): Observable<PaymentRecord[]> {
    return this.http
      .get<BackendPayment[]>(`${environment.apiBaseUrl}/users/me/payments`)
      .pipe(
        map((rows) =>
          rows.map((r) => ({
            id: String(r.id),
            subscriptionId: String(r.subscriptionId),
            plan: r.plan,
            amount: r.amount,
            paymentMethod: (r.paymentMethod === 'wechat' || r.paymentMethod === 'alipay' ? r.paymentMethod : 'wechat') as 'wechat' | 'alipay',
            status: (r.status === 'paid' || r.status === 'refunded' ? r.status : 'paid') as 'paid' | 'refunded',
            paidAt: r.paidAt,
          }))
        )
      );
  }

  exportBill(): Observable<Blob> {
    return this.http
      .get(`${environment.apiBaseUrl}/users/me/payments/export`, {
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((res) => {
          const blob = res.body as Blob;
          const disposition = res.headers.get('Content-Disposition') || '';
          const match = /filename="?([^"]+)"?/.exec(disposition);
          const filename = match?.[1] ?? `bill-${new Date().toISOString().split('T')[0]}.csv`;
          this.triggerDownload(blob, filename);
          return blob;
        })
      );
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private toSubscription(s: BackendSubscription): Subscription {
    return {
      id: String(s.id),
      userId: String(s.userId),
      plan: s.plan,
      status: (s.status === 'active' || s.status === 'expired' || s.status === 'cancelled' ? s.status : 'active') as SubscriptionStatus,
      price: s.price,
      startDate: s.startDate,
      endDate: s.endDate,
      autoRenew: s.autoRenew,
    };
  }
}
