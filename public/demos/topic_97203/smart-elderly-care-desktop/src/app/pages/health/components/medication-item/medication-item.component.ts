import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { Medication } from '@core/models';

@Component({
  selector: 'app-medication-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="med-item" [class.taken]="medication.takenToday">
      <label class="checkbox">
        <input
          type="checkbox"
          [checked]="medication.takenToday"
          (change)="toggle()"
          class="native-check" />
        <span class="custom-check" [class.checked]="medication.takenToday">
          <span *ngIf="medication.takenToday" nz-icon nzType="check" nzTheme="outline"></span>
        </span>
      </label>
      <div class="info">
        <div class="name">{{ medication.name }}</div>
        <div class="meta">{{ medication.dosage }} · {{ medication.frequency }}</div>
      </div>
      <div class="time">
        <span nz-icon nzType="clock-circle" nzTheme="outline"></span>
        {{ medication.timeOfDay.join(' / ') }}
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .med-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-radius: var(--radius-md);
      background: var(--color-bg-secondary);
      margin-bottom: 0.5rem;
      transition: all var(--transition-base);
    }
    .med-item.taken {
      background: var(--state-success-bg);
    }
    .checkbox {
      position: relative;
      display: inline-flex;
      align-items: center;
      cursor: pointer;
    }
    .native-check {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }
    .custom-check {
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 50%;
      border: 1.5px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 0.625rem;
      background: var(--color-surface);
      transition: all var(--transition-fast);
    }
    .custom-check.checked {
      background: var(--state-success);
      border-color: var(--state-success);
    }
    .info { flex: 1; min-width: 0; }
    .name {
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      color: var(--color-text-primary);
    }
    .meta {
      font-size: var(--text-xs);
      color: var(--color-text-tertiary);
      margin-top: 0.125rem;
    }
    .time {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: var(--text-xs);
      color: var(--color-text-secondary);
      flex-shrink: 0;
    }
  `],
})
export class MedicationItemComponent {
  @Input() medication!: Medication;
  @Output() toggleTaken = new EventEmitter<Medication>();

  toggle(): void {
    this.toggleTaken.emit(this.medication);
  }
}
