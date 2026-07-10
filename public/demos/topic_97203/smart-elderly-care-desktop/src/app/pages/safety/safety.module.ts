import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { SafetyComponent } from './safety.component';
import { DeviceCardComponent } from './components/device-card/device-card.component';
import { AlertItemComponent } from './components/alert-item/alert-item.component';

const routes: Routes = [{ path: '', component: SafetyComponent }];

@NgModule({
  declarations: [SafetyComponent, DeviceCardComponent, AlertItemComponent],
  imports: [CommonModule, RouterModule.forChild(routes), NzIconModule],
})
export class SafetyModule {}
