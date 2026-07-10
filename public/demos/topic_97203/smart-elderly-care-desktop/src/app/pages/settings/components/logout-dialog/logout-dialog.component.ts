import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-logout-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-modal
      [nzVisible]="visible"
      [nzWidth]="420"
      [nzFooter]="null"
      [nzMask]="true"
      [nzMaskClosable]="true"
      [nzClosable]="false"
      (nzOnCancel)="cancel.emit()">
      <ng-container *nzModalContent>
        <div class="dialog">
          <div class="icon-wrap">
            <span nz-icon nzType="logout" nzTheme="outline"></span>
          </div>
          <h2 class="title">确认退出登录?</h2>
          <p class="desc">退出后需要重新登录才能继续使用</p>
          <div class="actions">
            <button class="btn-secondary" (click)="cancel.emit()">取消</button>
            <button class="btn-danger" (click)="confirm.emit()">确认退出</button>
          </div>
        </div>
      </ng-container>
    </nz-modal>
  `,
  styles: [`
    :host ::ng-deep .ant-modal-content { padding: 0; }
    :host ::ng-deep .ant-modal-body { padding: 2rem; }
    :host ::ng-deep .ant-modal-mask { backdrop-filter: blur(4px); }
    .dialog {
      text-align: center;
    }
    .icon-wrap {
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      background: var(--state-error-bg);
      color: var(--state-error);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      margin-bottom: 1rem;
    }
    .title {
      font-size: var(--text-lg);
      font-weight: var(--weight-semibold);
      color: var(--color-text-primary);
      margin-bottom: 0.5rem;
    }
    .desc {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      margin-bottom: 1.5rem;
    }
    .actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }
    .btn-secondary, .btn-danger {
      flex: 1;
      height: 2.5rem;
      padding: 0 1.25rem;
      border-radius: var(--radius-md);
      border: none;
      font-size: var(--text-sm);
      font-weight: var(--weight-semibold);
      cursor: pointer;
    }
    .btn-secondary {
      background: var(--color-bg-tertiary);
      color: var(--color-text-primary);
    }
    .btn-secondary:hover { background: var(--color-bg-secondary); }
    .btn-danger {
      background: var(--state-error);
      color: #fff;
    }
    .btn-danger:hover { opacity: 0.9; }
  `],
})
export class LogoutDialogComponent {
  @Input() visible = false;
  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
}
