import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NgxEchartsModule } from 'ngx-echarts';

import { HealthComponent } from './health.component';
import { HealthMetricCardComponent } from './components/health-metric-card/health-metric-card.component';
import { MedicationItemComponent } from './components/medication-item/medication-item.component';
import { HealthReportComponent } from './health-report/health-report.component';
import { BpChartComponent } from './health-report/components/bp-chart/bp-chart.component';
import { BsChartComponent } from './health-report/components/bs-chart/bs-chart.component';
import { HealthScoreComponent } from './health-report/components/health-score/health-score.component';
import { MedicationTableComponent } from './health-report/components/medication-table/medication-table.component';

const routes: Routes = [
  { path: '', component: HealthComponent },
  { path: 'report', component: HealthReportComponent },
];

@NgModule({
  declarations: [
    HealthComponent,
    HealthMetricCardComponent,
    MedicationItemComponent,
    HealthReportComponent,
    BpChartComponent,
    BsChartComponent,
    HealthScoreComponent,
    MedicationTableComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NzIconModule,
    NgxEchartsModule.forRoot({ echarts: () => import('echarts') }),
  ],
})
export class HealthModule {}
