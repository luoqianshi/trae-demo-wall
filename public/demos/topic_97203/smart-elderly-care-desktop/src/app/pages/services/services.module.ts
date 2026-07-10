import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { ServicesComponent } from './services.component';
import { ServiceCardComponent } from './components/service-card/service-card.component';
import { OrderTableComponent } from './components/order-table/order-table.component';

const routes: Routes = [{ path: '', component: ServicesComponent }];

@NgModule({
  declarations: [ServicesComponent, ServiceCardComponent, OrderTableComponent],
  imports: [CommonModule, RouterModule.forChild(routes), NzIconModule],
})
export class ServicesModule {}
