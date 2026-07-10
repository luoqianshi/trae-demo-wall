import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  phone = '';
  password = '';
  showPassword = false;
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submit(): void {
    if (!this.phone || !this.password) {
      this.message.warning('请输入手机号和密码');
      return;
    }
    this.loading = true;
    this.auth.login(this.phone, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.message.success('登录成功');
        this.cdr.markForCheck();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.message.error(err?.error?.message ?? '登录失败，请检查手机号和密码');
        this.cdr.markForCheck();
      },
    });
  }
}
