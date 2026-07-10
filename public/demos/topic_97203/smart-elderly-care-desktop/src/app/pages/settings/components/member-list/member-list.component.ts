import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { FamilyMember } from '@core/models';

@Component({
  selector: 'app-member-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="member">
      <div class="avatar" [style.background-color]="member.avatarColor">
        {{ member.name[0] }}
      </div>
      <div class="info">
        <div class="name">{{ member.name }}</div>
        <div class="relation">{{ member.relation }}</div>
      </div>
      <span class="role-tag" [style.background-color]="roleBg" [style.color]="roleColor">
        {{ member.roleLabel }}
      </span>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .member {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--color-border-light);
    }
    .member:last-child { border-bottom: none; }
    .avatar {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: var(--weight-semibold);
      flex-shrink: 0;
    }
    .info { flex: 1; min-width: 0; }
    .name {
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      color: var(--color-text-primary);
    }
    .relation {
      font-size: var(--text-xs);
      color: var(--color-text-tertiary);
      margin-top: 2px;
    }
    .role-tag {
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
    }
  `],
})
export class MemberListComponent {
  @Input() member!: FamilyMember;

  get roleBg(): string {
    return {
      elderly: 'var(--state-warning-bg)',
      admin: 'var(--brand-primary-lightest)',
      assistant: 'var(--state-info-bg)',
    }[this.member.role];
  }
  get roleColor(): string {
    return {
      elderly: 'var(--state-warning)',
      admin: 'var(--brand-primary)',
      assistant: 'var(--state-info)',
    }[this.member.role];
  }
}
