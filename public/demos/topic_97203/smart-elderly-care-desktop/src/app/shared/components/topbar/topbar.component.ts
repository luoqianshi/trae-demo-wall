import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent {
  @Input() pageTitle: string = '';
  @Input() showBack: boolean = false;

  constructor(private location: Location) {}

  onBack(): void { this.location.back(); }
}
