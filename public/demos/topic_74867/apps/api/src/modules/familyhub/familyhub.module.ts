import { Module } from '@nestjs/common';
import { FamilyHubController } from './familyhub.controller';
import { FamilyHubService } from './familyhub.service';
import { SpamFilterService } from './spam-filter.service';
import { SkillsEvolutionService } from './skills-evolution.service';
import { AiModule } from '../ai/ai.module';
import { WechatModule } from '../wechat/wechat.module';

@Module({
  imports: [AiModule, WechatModule],
  controllers: [FamilyHubController],
  providers: [FamilyHubService, SpamFilterService, SkillsEvolutionService],
  exports: [FamilyHubService, SpamFilterService, SkillsEvolutionService],
})
export class FamilyHubModule {}
