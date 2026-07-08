import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  OnModuleInit,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FamilyHubService } from './familyhub.service';
import { WechatService } from '../wechat/wechat.service';

@ApiTags('Family Hub')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('family-hub')
export class FamilyHubController implements OnModuleInit {
  constructor(
    private readonly service: FamilyHubService,
    private readonly wechatService: WechatService,
  ) {}

  /** Auto-seed agents and skills on first startup. */
  async onModuleInit() {
    await this.service.seedIfEmpty();
  }

  @Get('metrics')
  @ApiOperation({ summary: '首页指标数据' })
  async getMetrics() {
    return this.service.getMetrics();
  }

  @Get('shimo-core')
  @ApiOperation({ summary: '时墨核心状态' })
  async getShimoCore() {
    return this.service.getShimoCore();
  }

  @Get('agents')
  @ApiOperation({ summary: '获取所有 Agent' })
  async getAgents() {
    return this.service.getAgents();
  }

  @Get('agents/:code')
  @ApiOperation({ summary: '获取单个 Agent 详情（含技能）' })
  async getAgent(@Param('code') code: string) {
    return this.service.getAgent(code);
  }

  @Post('agents/:code/invoke')
  @ApiOperation({ summary: '调用 Agent（真实 AI 对话）' })
  async invokeAgent(
    @Param('code') code: string,
    @Body() body: { message: string },
  ) {
    return this.service.invokeAgent(code, body.message || '');
  }

  @Get('skills')
  @ApiOperation({ summary: '获取所有技能' })
  async getSkills() {
    return this.service.getSkills();
  }

  @Post('skills/:id/learn')
  @ApiOperation({ summary: '学习技能（提升进度）' })
  async learnSkill(@Param('id') id: string) {
    return this.service.learnSkill(id);
  }

  @Get('timeline')
  @ApiOperation({ summary: '学习时间线' })
  async getTimeline() {
    return this.service.getTimeline();
  }

  @Get('devices')
  @ApiOperation({ summary: '设备同步状态' })
  async getDevices(
    @CurrentUser() user: { userId: string },
  ) {
    // Check real WeChat connection status
    const wechatStatus = this.wechatService.getStatus();
    const wechatConnected = wechatStatus.loggedIn;

    return [
      { id: 'web', name: 'Web', status: 'connected', icon: 'Globe' },
      { id: 'wechat', name: 'WeChat', status: wechatConnected ? 'connected' : 'disconnected', icon: 'MessageCircle' },
      { id: 'family', name: 'Family Group', status: wechatConnected ? 'connected' : 'coming_soon', icon: 'Users' },
      { id: 'memory', name: 'Memory', status: 'synced', icon: 'Database' },
      { id: 'app', name: 'App', status: 'coming_soon', icon: 'Smartphone' },
      { id: 'watch', name: 'Watch', status: 'coming_soon', icon: 'Watch' },
      { id: 'robot', name: 'Robot', status: 'coming_soon', icon: 'Bot' },
    ];
  }

  @Get('family-status')
  @ApiOperation({ summary: '家庭状态' })
  async getFamilyStatus() {
    return [
      { id: 'mood', label: '家庭情绪', value: '温暖', sub: '全员状态良好', color: '#FBBF24', icon: 'Smile' },
      { id: 'memory', label: '本周新增回忆', value: '3 段', sub: '昨天新增了1段', color: '#60A5FA', icon: 'BookOpen' },
      { id: 'tree', label: '生命树成长', value: 'Lv.8', sub: 'Young Tree 阶段', color: '#4ADE80', icon: 'TreePine' },
      { id: 'advice', label: '今日家庭建议', value: '给爸妈打个电话', sub: '已3天未联系', color: '#F87171', icon: 'Heart' },
      { id: 'todo', label: '本周待办', value: '周末家庭聚餐', sub: '周六晚上', color: '#A78BFA', icon: 'Calendar' },
      { id: 'ai', label: 'AI理解程度', value: '89%', sub: '持续学习中', color: '#5E9EF5', icon: 'Brain' },
    ];
  }
}
