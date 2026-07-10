import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzStepsModule } from 'ng-zorro-antd/steps';

import { SettingsComponent } from './settings.component';
import { MemberListComponent } from './components/member-list/member-list.component';
import { LogoutDialogComponent } from './components/logout-dialog/logout-dialog.component';
import { AddMemberComponent } from './add-member/add-member.component';
import { ChangePhoneComponent } from './change-phone/change-phone.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { EditEmergencyComponent } from './edit-emergency/edit-emergency.component';
import { SubscriptionComponent } from './subscription/subscription.component';
import { SharedModule } from '@shared/shared.module';

const routes: Routes = [
  { path: '', component: SettingsComponent },
  { path: 'add-member', component: AddMemberComponent },
  { path: 'change-phone', component: ChangePhoneComponent },
  { path: 'change-password', component: ChangePasswordComponent },
  { path: 'edit-emergency', component: EditEmergencyComponent },
  { path: 'subscription', component: SubscriptionComponent },
];

@NgModule({
  declarations: [
    SettingsComponent,
    MemberListComponent,
    LogoutDialogComponent,
    AddMemberComponent,
    ChangePhoneComponent,
    ChangePasswordComponent,
    EditEmergencyComponent,
    SubscriptionComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    RouterModule.forChild(routes),
    NzIconModule,
    NzMessageModule,
    NzSelectModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzProgressModule,
    NzTagModule,
    NzStepsModule,
  ],
})
export class SettingsModule {}
