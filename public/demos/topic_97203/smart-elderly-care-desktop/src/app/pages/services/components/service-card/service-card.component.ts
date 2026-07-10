import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { ServiceCategory } from '@core/models';

@Component({
  selector: 'app-service-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card card-hover service-card">
      <div class="icon-wrap" [style.background-color]="service.color + '20'" [style.color]="service.color">
        <span nz-icon [nzType]="service.icon" nzTheme="outline"></span>
      </div>
      <div class="name">{{ service.name }}</div>
      <div class="desc">{{ service.description }}</div>
      <button class="action-btn" [style.background-color]="service.color" [style.color]="'#fff'">
        {{ service.buttonText }}
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .service-card {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .icon-wrap {
      width: 3rem;
      height: 3rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin-bottom: 0.75rem;
    }
    .name {
      font-size: var(--text-base);
      font-weight: var(--weight-semibold);
      color: var(--color-text-primary);
      margin-bottom: 0.25rem;
    }
    .desc {
      font-size: var(--text-xs);
      color: var(--color-text-secondary);
      margin-bottom: 1rem;
      min-height: 2.5em;
    }
    .action-btn {
      width: 100%;
      padding: 0.5rem 0.875rem;
      border-radius: var(--radius-md);
      border: none;
      font-size: var(--text-sm);
      font-weight: var(--weight-semibold);
      cursor: pointer;
      transition: opacity var(--transition-fast);
    }
    .action-btn:hover { opacity: 0.9; }
  `],
})
export class ServiceCardComponent {
  @Input() service!: ServiceCategory;
}
