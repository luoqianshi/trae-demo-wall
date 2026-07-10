import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';

import { DashboardComponent } from './dashboard.component';
import { StatusBannerComponent } from './components/status-banner/status-banner.component';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { ActivityDialogComponent } from './components/activity-dialog/activity-dialog.component';

const routes: Routes = [{ path: '', component: DashboardComponent }];

@NgModule({
  declarations: [
    DashboardComponent,
    StatusBannerComponent,
    KpiCardComponent,
    ActivityDialogComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    NzIconModule,
    NzModalModule,
    NzDatePickerModule,
    NzInputModule,
  ],
})
export class DashboardModule {}
