import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ViewChildren, QueryList, ElementRef, AfterViewInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';

@Component({
  selector: 'app-otp-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="otp-container">
      <input
        *ngFor="let v of values; let i = index; trackBy: trackByIndex"
        #otpInput
        type="text"
        inputmode="numeric"
        maxlength="1"
        class="otp-cell"
        [class.filled]="v"
        [value]="v"
        (input)="onInput(i, $event)"
        (keydown)="onKeyDown(i, $event)"
        (paste)="onPaste($event)" />
    </div>
  `,
  styles: [`
    :host { display: block; }
    .otp-container {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
    }
    .otp-cell {
      width: 3rem;
      height: 3rem;
      text-align: center;
      font-size: var(--text-xl);
      font-weight: var(--weight-semibold);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      color: var(--color-text-primary);
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    }
    .otp-cell:focus {
      border-color: var(--brand-primary);
      box-shadow: 0 0 0 3px rgba(212, 118, 60, 0.1);
      outline: none;
    }
    .otp-cell.filled {
      border-color: var(--brand-primary);
    }
  `],
})
export class OtpInputComponent implements AfterViewInit, OnDestroy {
  @Input() length = 6;
  @Output() completed = new EventEmitter<string>();
  @ViewChildren('otpInput') inputs!: QueryList<ElementRef<HTMLInputElement>>;

  values: string[] = [];
  private zoneChangeHandler: any = null;

  constructor(private cdr: ChangeDetectorRef, private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.values = Array.from({ length: this.length }, () => '');
    this.inputs.changes.subscribe(() => this.focusAt(0));
  }

  trackByIndex(index: number): number {
    return index;
  }

  onInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(-1);
    this.values[index] = value;
    input.value = value;
    this.cdr.markForCheck();
    if (value && index < this.length - 1) {
      this.focusAt(index + 1);
    } else if (this.isComplete()) {
      this.emitCompleted();
    }
  }

  onKeyDown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.values[index] && index > 0) {
      this.focusAt(index - 1);
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusAt(index - 1);
    } else if (event.key === 'ArrowRight' && index < this.length - 1) {
      event.preventDefault();
      this.focusAt(index + 1);
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const data = event.clipboardData?.getData('text') ?? '';
    const digits = data.replace(/\D/g, '').slice(0, this.length).split('');
    if (!digits.length) return;
    digits.forEach((d, i) => (this.values[i] = d));
    this.cdr.markForCheck();
    this.inputs.forEach((el, i) => {
      el.nativeElement.value = this.values[i] ?? '';
    });
    const next = Math.min(digits.length, this.length - 1);
    this.focusAt(next);
    if (this.isComplete()) this.emitCompleted();
  }

  private focusAt(index: number): void {
    const arr = this.inputs.toArray();
    setTimeout(() => arr[index]?.nativeElement.focus(), 0);
  }

  private isComplete(): boolean {
    return this.values.every((v) => v !== '');
  }

  private emitCompleted(): void {
    this.completed.emit(this.values.join(''));
  }

  ngOnDestroy(): void {
    if (this.zoneChangeHandler) {
      clearTimeout(this.zoneChangeHandler);
    }
  }
}
