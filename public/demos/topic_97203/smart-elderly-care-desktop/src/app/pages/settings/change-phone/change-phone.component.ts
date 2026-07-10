import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';

type PhoneStep = 'verify-current' | 'enter-new' | 'verify-new' | 'done';

@Component({
  selector: 'app-change-phone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './change-phone.component.html',
  styleUrls: ['./change-phone.component.scss'],
})
export class ChangePhoneComponent implements OnInit, OnDestroy {
  step: PhoneStep = 'verify-current';
  currentPhoneMasked = '138****6789';
  newPhone = '';
  currentCode = '';
  newCode = '';
  sendingCurrent = false;
  sendingNew = false;
  submitting = false;
  currentCountdown = 0;
  newCountdown = 0;
  private timer: any = null;
  private subs: Subscription[] = [];

  get stepIndex(): number {
    const map: Record<PhoneStep, number> = {
      'verify-current': 0,
      'enter-new': 1,
      'verify-new': 2,
      done: 3,
    };
    return map[this.step] ?? 0;
  }

  constructor(
    private auth: AuthService,
    private router: Router,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.clearTimer();
  }

  goBack(): void {
    this.router.navigate(['/settings']);
  }

  onCurrentCodeCompleted(code: string): void {
    this.currentCode = code;
  }

  onNewCodeCompleted(code: string): void {
    this.newCode = code;
  }

  sendCurrentCode(): void {
    if (this.sendingCurrent || this.currentCountdown > 0) return;
    this.sendingCurrent = true;
    this.subs.push(
      this.auth.sendCode(this.currentPhoneMasked, 'change-phone').subscribe({
        next: () => {
          this.sendingCurrent = false;
          this.startCountdown('current');
          this.message.success('验证码已发送');
        },
        error: () => {
          this.sendingCurrent = false;
          this.startCountdown('current');
          this.message.success('验证码已发送（演示）');
        },
      })
    );
  }

  sendNewCode(): void {
    if (this.sendingNew || this.newCountdown > 0) return;
    if (!/^1[3-9]\d{9}$/.test(this.newPhone)) {
      this.message.warning('请先输入正确的手机号');
      return;
    }
    this.sendingNew = true;
    this.subs.push(
      this.auth.sendCode(this.newPhone, 'change-phone').subscribe({
        next: () => {
          this.sendingNew = false;
          this.startCountdown('new');
          this.message.success('验证码已发送');
        },
        error: () => {
          this.sendingNew = false;
          this.startCountdown('new');
          this.message.success('验证码已发送（演示）');
        },
      })
    );
  }

  goToEnterNew(): void {
    if (this.currentCode.length !== 6) {
      this.message.warning('请输入6位验证码');
      return;
    }
    this.step = 'enter-new';
  }

  goToVerifyNew(): void {
    if (!/^1[3-9]\d{9}$/.test(this.newPhone)) {
      this.message.warning('请输入正确的手机号');
      return;
    }
    this.step = 'verify-new';
  }
  submit(): void {
    if (this.newCode.length !== 6) {
      this.message.warning('请输入6位验证码');
      return;
    }
    this.submitting = true;
    this.subs.push(
      this.auth.changePhone(this.currentPhoneMasked, this.newPhone, this.newCode).subscribe({
        next: () => {
          this.submitting = false;
          this.step = 'done';
          this.cdr.markForCheck();
          setTimeout(() => this.router.navigate(['/settings']), 1500);
        },
        error: () => {
          this.submitting = false;
          this.step = 'done';
          this.cdr.markForCheck();
          this.message.success('手机号已更新（演示）');
          setTimeout(() => this.router.navigate(['/settings']), 1500);
        },
      })
    );
  }

  private startCountdown(which: 'current' | 'new'): void {
    if (which === 'current') this.currentCountdown = 58;
    else this.newCountdown = 58;
    this.clearTimer();
    this.timer = setInterval(() => {
      if (this.currentCountdown > 0) this.currentCountdown--;
      if (this.newCountdown > 0) this.newCountdown--;
      if (this.currentCountdown <= 0 && this.newCountdown <= 0) {
        this.clearTimer();
      }
      this.cdr.markForCheck();
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
