import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { MedicationService } from '@core/services';
import { Medication, HealthMetric } from '@core/models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-health',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './health.component.html',
  styleUrls: ['./health.component.scss'],
})
export class HealthComponent implements OnInit, OnDestroy {
  metrics: HealthMetric[] = [
    { type: 'bp', label: '血压', value: '145/92', unit: 'mmHg', status: 'warning', trend: 'up' },
    { type: 'heartRate', label: '心率', value: '72', unit: 'bpm', status: 'normal', trend: 'flat' },
    { type: 'bloodSugar', label: '血糖', value: '5.8', unit: 'mmol/L', status: 'normal', trend: 'flat' },
    { type: 'weight', label: '体重', value: '62', unit: 'kg', status: 'normal', trend: 'flat' },
  ];

  medications: Medication[] = [
    { id: 1, elderId: 1, name: '硝苯地平', dosage: '30mg × 1片', frequency: '每日1次', timeOfDay: ['08:00'], totalDoses: 7, takenDoses: 7, adherenceRate: 100, takenToday: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 2, elderId: 1, name: '二甲双胍', dosage: '0.5g × 1片', frequency: '每日2次', timeOfDay: ['08:00', '20:00'], totalDoses: 14, takenDoses: 13, adherenceRate: 93, takenToday: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 3, elderId: 1, name: '阿司匹林', dosage: '100mg × 1片', frequency: '每日1次', timeOfDay: ['08:00'], totalDoses: 7, takenDoses: 7, adherenceRate: 100, takenToday: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 4, elderId: 1, name: '辛伐他汀', dosage: '20mg × 1片', frequency: '每日1次', timeOfDay: ['20:00'], totalDoses: 7, takenDoses: 6, adherenceRate: 86, takenToday: false, createdAt: new Date(), updatedAt: new Date() },
    { id: 5, elderId: 1, name: '维生素D', dosage: '1片', frequency: '每日1次', timeOfDay: ['08:00'], totalDoses: 7, takenDoses: 7, adherenceRate: 100, takenToday: false, createdAt: new Date(), updatedAt: new Date() },
  ];

  weeklySummary = {
    avgBp: '138/85',
    bpChange: '较上周略升',
    avgSugar: '5.6',
    steps: '8240',
    stepsChange: '比上周多12%',
  };

  private subs: Subscription[] = [];

  constructor(
    private medService: MedicationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.medService.loadMedications().subscribe({
      next: (m) => {
        this.medications = m;
        this.cdr.markForCheck();
      },
      error: () => this.cdr.markForCheck(),
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  toggleMedication(med: Medication): void {
    const previousState = med.takenToday ?? false;
    const updated = { ...med, takenToday: !previousState };
    this.medications = this.medications.map((m) => (m.id === med.id ? updated : m));
    this.medService.toggleTaken(Number(med.id), updated.takenToday ?? false).subscribe({
      next: () => this.cdr.markForCheck(),
      error: () => {
        this.medications = this.medications.map((m) =>
          m.id === med.id ? { ...m, takenToday: previousState } : m
        );
        this.cdr.markForCheck();
      },
    });
  }

  viewReport(): void {
    this.router.navigate(['/health/report']);
  }

  get takenCount(): number {
    return this.medications.filter((m) => m.takenToday).length;
  }
}
