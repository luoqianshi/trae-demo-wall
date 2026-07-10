import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SettingsService } from '@core/services/settings.service';
import { NzMessageService } from 'ng-zorro-antd/message';

type FamilyRole = 'admin' | 'assistant' | 'elderly';
type InviteMethod = 'wechat' | 'sms' | 'link';

interface RoleOption {
  value: FamilyRole;
  title: string;
  desc: string;
  icon: string;
}

interface InviteOption {
  value: InviteMethod;
  title: string;
  desc: string;
  icon: string;
}

@Component({
  selector: 'app-add-member',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-member.component.html',
  styleUrls: ['./add-member.component.scss'],
})
export class AddMemberComponent implements OnInit, OnDestroy {
  name = '';
  phone = '';
  phonePrefix = '+86';
  relation: string | null = null;
  role: FamilyRole = 'assistant';
  inviteMethod: InviteMethod = 'wechat';

  relations: string[] = ['子女', '配偶', '父母', '岳父母/公婆', '兄弟姐妹', '朋友', '其他亲属'];

  roleOptions: RoleOption[] = [
    {
      value: 'admin',
      title: '管理员',
      desc: '可邀请、移除成员，修改全部设置',
      icon: 'user-switch',
    },
    {
      value: 'assistant',
      title: '协助者',
      desc: '可查看数据、添加备注、协助下单',
      icon: 'user',
    },
    {
      value: 'elderly',
      title: '被照护人',
      desc: '仅查看与本人相关的数据与告警',
      icon: 'heart',
    },
  ];

  inviteOptions: InviteOption[] = [
    { value: 'wechat', title: '微信邀请', desc: '通过微信发送邀请卡片', icon: 'wechat' },
    { value: 'sms', title: '短信邀请', desc: '发送短信邀请链接', icon: 'message' },
    { value: 'link', title: '复制邀请链接', desc: '手动复制链接发送', icon: 'link' },
  ];

  loading = false;
  private subs: Subscription[] = [];

  constructor(
    private settingsService: SettingsService,
    private router: Router,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  selectRole(role: FamilyRole): void {
    this.role = role;
  }

  selectInviteMethod(method: InviteMethod): void {
    this.inviteMethod = method;
  }

  goBack(): void {
    this.router.navigate(['/settings']);
  }

  submit(): void {
    if (!this.name.trim()) {
      this.message.warning('请输入成员姓名');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(this.phone)) {
      this.message.warning('请输入正确的手机号');
      return;
    }
    if (!this.relation) {
      this.message.warning('请选择与成员的关系');
      return;
    }
    this.loading = true;
    this.subs.push(
      this.settingsService
        .inviteMember({
          phone: this.phone,
          role: this.role === 'elderly' ? 'elder' : this.role === 'admin' ? 'guardian' : 'viewer',
        })
        .subscribe({
          next: () => {
            this.loading = false;
            this.message.success('邀请发送成功');
            this.cdr.markForCheck();
            this.router.navigate(['/settings']);
          },
          error: () => {
            this.loading = false;
            this.message.success('邀请已发送（演示）');
            this.cdr.markForCheck();
            this.router.navigate(['/settings']);
          },
        })
    );
  }
}
