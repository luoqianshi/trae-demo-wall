import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-toggle-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="toggle"
      [class.active]="value"
      role="switch"
      [attr.aria-checked]="value"
      (click)="toggle()">
      <div class="knob"></div>
    </div>
  `,
  styles: [`
    .toggle {
      width: 36px;
      height: 20px;
      border-radius: 9999px;
      background: var(--color-border);
      position: relative;
      cursor: pointer;
      transition: background-color var(--transition-fast);
      flex-shrink: 0;
    }
    .toggle.active { background-color: var(--brand-primary); }
    .knob {
      width: 16px;
      height: 16px;
      border-radius: 9999px;
      background: #fff;
      position: absolute;
      top: 2px;
      left: 2px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
      transition: left var(--transition-fast);
    }
    .toggle.active .knob { left: 18px; }
  `],
})
export class ToggleSwitchComponent {
  @Input() value = false;
  @Output() valueChange = new EventEmitter<boolean>();

  toggle(): void {
    this.value = !this.value;
    this.valueChange.emit(this.value);
  }
}
