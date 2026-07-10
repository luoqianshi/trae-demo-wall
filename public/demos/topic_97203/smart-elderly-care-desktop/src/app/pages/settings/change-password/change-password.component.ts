import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';

interface StrengthRule {
  key: string;
  label: string;
  passed: boolean;
}

@Component({
  selector: 'app-change-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent implements OnInit, OnDestroy {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrent = false;
  showNew = false;
  showConfirm = false;
  submitting = false;
  private subs: Subscription[] = [];

  strengthRules: StrengthRule[] = [
    { key: 'length', label: '至少8位字符', passed: false },
    { key: 'letter', label: '包含字母', passed: false },
    { key: 'number', label: '包含数字', passed: false },
    { key: 'special', label: '包含特殊字符', passed: false },
  ];

  constructor(
    private auth: AuthService,
    private router: Router,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  goBack(): void {
    this.router.navigate(['/settings']);
  }

  onNewPasswordChange(value: string): void {
    this.newPassword = value;
    this.updateStrength(value);
    this.cdr.markForCheck();
  }

  toggleVisibility(field: 'current' | 'new' | 'confirm'): void {
    if (field === 'current') this.showCurrent = !this.showCurrent;
    else if (field === 'new') this.showNew = !this.showNew;
    else this.showConfirm = !this.showConfirm;
  }

  allRulesPassed(): boolean {
    return this.strengthRules.every((r) => r.passed);
  }

  submit(): void {
    if (!this.currentPassword) {
      this.message.warning('请输入当前密码');
      return;
    }
    if (!this.allRulesPassed()) {
      this.message.warning('新密码未满足强度要求');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.message.warning('两次输入的新密码不一致');
      return;
    }
    this.submitting = true;
    this.subs.push(
      this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
        next: () => {
          this.submitting = false;
          this.message.success('密码修改成功，请重新登录');
          this.auth.logout();
          this.cdr.markForCheck();
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.submitting = false;
          this.message.error(err?.error?.message ?? '密码修改失败');
          this.cdr.markForCheck();
        },
      })
    );
  }

  private updateStrength(value: string): void {
    this.strengthRules = [
      { key: 'length', label: '至少8位字符', passed: value.length >= 8 },
      { key: 'letter', label: '包含字母', passed: /[A-Za-z]/.test(value) },
      { key: 'number', label: '包含数字', passed: /\d/.test(value) },
      { key: 'special', label: '包含特殊字符', passed: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/';`~]/.test(value) },
    ];
  }
}
