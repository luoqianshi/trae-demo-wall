import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { ToggleSwitchComponent } from './components/toggle-switch/toggle-switch.component';
import { VoicePlayerComponent } from './components/voice-player/voice-player.component';
import { OtpInputComponent } from './components/otp-input/otp-input.component';

const COMPONENTS = [ToggleSwitchComponent, VoicePlayerComponent, OtpInputComponent];

@NgModule({
  declarations: COMPONENTS,
  imports: [CommonModule, FormsModule, RouterModule, NzIconModule],
  exports: [...COMPONENTS, CommonModule, FormsModule, RouterModule, NzIconModule],
})
export class SharedModule {}
