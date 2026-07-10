import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AppLayoutComponent } from './app-layout.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

const AUTHENTICATED_ROUTES = [
  { path: 'dashboard', loadChildren: () => import('@pages/dashboard/dashboard.module').then((m) => m.DashboardModule) },
  { path: 'safety', loadChildren: () => import('@pages/safety/safety.module').then((m) => m.SafetyModule) },
  { path: 'health', loadChildren: () => import('@pages/health/health.module').then((m) => m.HealthModule) },
  { path: 'services', loadChildren: () => import('@pages/services/services.module').then((m) => m.ServicesModule) },
  { path: 'family', loadChildren: () => import('@pages/family/family.module').then((m) => m.FamilyModule) },
  { path: 'settings', loadChildren: () => import('@pages/settings/settings.module').then((m) => m.SettingsModule) },
];

@NgModule({
  declarations: [AppLayoutComponent, SidebarComponent, TopbarComponent],
  imports: [CommonModule, RouterModule.forChild(AUTHENTICATED_ROUTES), NzIconModule],
  exports: [AppLayoutComponent],
})
export class AppLayoutModule {}
