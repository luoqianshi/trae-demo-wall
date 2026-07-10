import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SubscriptionService } from '@core/services/subscription.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { format, differenceInDays, parseISO } from 'date-fns';

interface PlanColumn {
  plan: string;
  name: string;
  price: number;
  recommended?: boolean;
  features: { label: string; included: boolean | string }[];
}

interface PaymentRow {
  id: string;
  date: string;
  plan: string;
  amount: number;
  method: string;
  status: string;
}

@Component({
  selector: 'app-subscription',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss'],
})
export class SubscriptionComponent implements OnInit, OnDestroy {
  currentPlan = {
    name: '尊享版',
    price: 199,
    endDate: '2026-08-15',
    startDate: '2026-05-15',
    usedDays: 0,
    totalDays: 0,
    progressPercent: 0,
  };

  plans: PlanColumn[] = [
    {
      plan: 'basic',
      name: '基础版',
      price: 99,
      features: [
        { label: '安全守护设备接入', included: '3台' },
        { label: '健康数据监测', included: true },
        { label: '用药提醒', included: true },
        { label: '生活服务订购', included: false },
        { label: '7×24h 客服', included: false },
        { label: '医生在线咨询', included: false },
      ],
    },
    {
      plan: 'premium',
      name: '尊享版',
      price: 199,
      recommended: true,
      features: [
        { label: '安全守护设备接入', included: '10台' },
        { label: '健康数据监测', included: true },
        { label: '用药提醒', included: true },
        { label: '生活服务订购', included: true },
        { label: '7×24h 客服', included: true },
        { label: '医生在线咨询', included: false },
      ],
    },
    {
      plan: 'flagship',
      name: '旗舰版',
      price: 399,
      features: [
        { label: '安全守护设备接入', included: '不限' },
        { label: '健康数据监测', included: true },
        { label: '用药提醒', included: true },
        { label: '生活服务订购', included: true },
        { label: '7×24h 客服', included: true },
        { label: '医生在线咨询', included: true },
      ],
    },
  ];

  payments: PaymentRow[] = [
    { id: '1', date: '2026-05-15', plan: '尊享版', amount: 199, method: '微信支付', status: '已支付' },
    { id: '2', date: '2026-04-15', plan: '尊享版', amount: 199, method: '支付宝', status: '已支付' },
    { id: '3', date: '2026-03-15', plan: '基础版', amount: 99, method: '微信支付', status: '已支付' },
  ];

  featureLabels: string[] = [
    '安全守护设备接入',
    '健康数据监测',
    '用药提醒',
    '生活服务订购',
    '7×24h 客服',
    '医生在线咨询',
  ];

  exporting = false;
  private subs: Subscription[] = [];

  constructor(
    private subscriptionService: SubscriptionService,
    private router: Router,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.computeProgress();
    this.loadSubscription();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  goBack(): void {
    this.router.navigate(['/settings']);
  }

  exportBill(): void {
    this.exporting = true;
    this.subs.push(
      this.subscriptionService.exportBill().subscribe({
        next: () => {
          this.exporting = false;
          this.message.success('账单已生成');
          this.cdr.markForCheck();
        },
        error: () => {
          this.exporting = false;
          this.message.success('账单已生成（演示）');
          this.cdr.markForCheck();
        },
      })
    );
  }

  featureOf(plan: PlanColumn, label: string): boolean | string {
    const f = plan.features.find((x) => x.label === label);
    return f ? f.included : false;
  }

  private loadSubscription(): void {
    this.subs.push(
      this.subscriptionService.getCurrent().subscribe({
        next: (sub) => {
          if (sub) {
            this.currentPlan.endDate = format(sub.endDate, 'yyyy-MM-dd');
            this.currentPlan.startDate = format(sub.startDate, 'yyyy-MM-dd');
            this.currentPlan.price = sub.price;
            const plan = this.plans.find((p) => p.plan === sub.plan);
            if (plan) this.currentPlan.name = plan.name;
            this.computeProgress();
            this.cdr.markForCheck();
          }
        },
        error: () => {},
      })
    );
  }

  private computeProgress(): void {
    try {
      const start = parseISO(this.currentPlan.startDate);
      const end = parseISO(this.currentPlan.endDate);
      const today = new Date();
      const used = Math.max(0, differenceInDays(today, start));
      const total = Math.max(1, differenceInDays(end, start));
      this.currentPlan.usedDays = used;
      this.currentPlan.totalDays = total;
      this.currentPlan.progressPercent = Math.min(100, Math.round((used / total) * 100));
    } catch {
      this.currentPlan.usedDays = 30;
      this.currentPlan.totalDays = 90;
      this.currentPlan.progressPercent = 33;
    }
  }
}
