import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SettingsService } from '@core/services/settings.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-edit-emergency',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-emergency.component.html',
  styleUrls: ['./edit-emergency.component.scss'],
})
export class EditEmergencyComponent implements OnInit, OnDestroy {
  name = '李芳';
  phone = '13900001234';
  backupPhone = '13900005678';
  relation: string | null = '配偶';

  relations: string[] = ['配偶', '子女', '父母', '兄弟姐妹', '亲戚', '朋友', '同事', '其他'];

  saving = false;
  deleting = false;
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

  goBack(): void {
    this.router.navigate(['/settings']);
  }

  save(): void {
    if (!this.name.trim()) {
      this.message.warning('请输入紧急联系人姓名');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(this.phone)) {
      this.message.warning('请输入正确的手机号');
      return;
    }
    this.saving = true;
    this.subs.push(
      this.settingsService
        .updateEmergencyContact({
          name: this.name,
          relation: this.relation ?? '其他',
          phone: this.phone,
          backupPhone: this.backupPhone,
        })
        .subscribe({
          next: () => {
            this.saving = false;
            this.message.success('保存成功');
            this.cdr.markForCheck();
            this.router.navigate(['/settings']);
          },
          error: () => {
            this.saving = false;
            this.message.success('保存成功（演示）');
            this.cdr.markForCheck();
            this.router.navigate(['/settings']);
          },
        })
    );
  }

  remove(): void {
    this.deleting = true;
    this.subs.push(
      this.settingsService.deleteEmergencyContact().subscribe({
        next: () => {
          this.deleting = false;
          this.message.success('已删除紧急联系人');
          this.cdr.markForCheck();
          this.router.navigate(['/settings']);
        },
        error: () => {
          this.deleting = false;
          this.message.success('已删除紧急联系人（演示）');
          this.cdr.markForCheck();
          this.router.navigate(['/settings']);
        },
      })
    );
  }
}
