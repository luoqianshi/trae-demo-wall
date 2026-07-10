import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { FamilyComponent } from './family.component';
import { FeedItemComponent } from './components/feed-item/feed-item.component';
import { ActivityCardComponent } from './components/activity-card/activity-card.component';
import { SharedModule } from '@shared/shared.module';

const routes: Routes = [{ path: '', component: FamilyComponent }];

@NgModule({
  declarations: [FamilyComponent, FeedItemComponent, ActivityCardComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes), NzIconModule, SharedModule],
})
export class FamilyModule {}
