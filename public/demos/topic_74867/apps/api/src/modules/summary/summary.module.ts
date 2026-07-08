import { Module } from '@nestjs/common';
import { SummaryService } from './summary.service';
import { SummaryController } from './summary.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  providers: [SummaryService],
  controllers: [SummaryController],
  exports: [SummaryService],
})
export class SummaryModule {}
