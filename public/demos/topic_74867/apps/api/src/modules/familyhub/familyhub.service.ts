import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmAdapterService, ChatMessage } from '../ai/services/llm-adapter.service';
import { SpamFilterService } from './spam-filter.service';
import { SkillsEvolutionService } from './skills-evolution.service';
import { RagService } from '../ai/services/rag.service';
import { RAG_DEFAULTS } from '@echolife/shared';

/**
 * Agent definitions with system prompts for real AI interaction.
 * Each agent has a specialized persona and capabilities.
 */
const AGENT_DEFINITIONS: Array<{
  code: string;
  name: string;
  role: string;
  description: string;
  icon: string;
  color: string;
  status: string;
  level: number;
  calls: number;
  systemPrompt: string;
  welcomeMessage: string;
  capabilities: string[];
  skills: Array<{
    name: string;
    description: string;
    icon: string;
    color: string;
    level: number;
    status: string;
    progress: number;
    category: string;
    tags: string[];
    examples: string[];
  }>;
}> = [
  {
    code: 'life',
    name: 'Life Agent',
    role: '生活管理',
    description: '负责家庭日常生活管理，包括收纳、日程、家务分配等。',
    icon: 'Heart',
    color: '#F87171',
    status: 'running',
    level: 5,
    calls: 128,
    systemPrompt: '你是「生活管家」🏠，一个贴心的家庭日常管理小帮手。你擅长家务规划、收纳整理、日程管理、习惯养成。说话风格：温暖、实用、有条理。用中文回答，适当加emoji。',
    welcomeMessage: '嗨！我是生活管家 🏠 家里要收拾收拾？还是想规划一下这周的安排？跟我说说，咱一起把家打理得井井有条～',
    capabilities: ['家务规划', '收纳整理', '日程管理', '习惯养成'],
    skills: [
      {
        name: '家庭收纳',
        description: '掌握断舍离、分区收纳、垂直收纳等整理技巧',
        icon: 'Sprout',
        color: '#4ADE80',
        level: 1,
        status: 'learning',
        progress: 82,
        category: '生活',
        tags: ['收纳', '整理', '断舍离'],
        examples: ['如何整理厨房橱柜', '衣柜分区收纳方案', '儿童玩具收纳技巧'],
      },
    ],
  },
  {
    code: 'kitchen',
    name: 'Kitchen Agent',
    role: '智慧厨房',
    description: '提供菜谱推荐、营养搭配、食材管理、烹饪指导。',
    icon: 'ChefHat',
    color: '#FBBF24',
    status: 'thinking',
    level: 8,
    calls: 89,
    systemPrompt: '你是「智慧厨房」🍳，一个热爱美食的家庭厨艺顾问。你擅长菜谱推荐、营养搭配、食材管理。说话风格：热情、实用、带点烟火气。用中文回答，适当加emoji。',
    welcomeMessage: '嗨！我是智慧厨房助手 🍳 冰箱里有啥食材？或者想吃什么？跟我说，帮你安排上！',
    capabilities: ['菜谱推荐', '营养分析', '食材管理', '烹饪指导'],
    skills: [
      {
        name: '菜谱推荐',
        description: '根据食材、口味、季节智能推荐菜谱',
        icon: 'ChefHat',
        color: '#FB923C',
        level: 7,
        status: 'mastered',
        progress: 100,
        category: '厨房',
        tags: ['菜谱', '烹饪', '推荐'],
        examples: ['冰箱剩鸡蛋和番茄怎么做', '减脂晚餐推荐', '三口之家周末菜谱'],
      },
      {
        name: '空气炸锅食谱',
        description: '掌握空气炸锅各类食谱和烹饪技巧',
        icon: 'ChefHat',
        color: '#FBBF24',
        level: 6,
        status: 'mastered',
        progress: 100,
        category: '厨房',
        tags: ['空气炸锅', '食谱', '烹饪'],
        examples: ['空气炸锅鸡翅做法', '空气炸锅烤蔬菜', '空气炸锅甜品'],
      },
    ],
  },
  {
    code: 'repair',
    name: 'Repair Agent',
    role: '家庭维修',
    description: '提供家电维修、水电维护、家具修缮的指导和诊断。',
    icon: 'Wrench',
    color: '#5E9EF5',
    status: 'idle',
    level: 4,
    calls: 45,
    systemPrompt: '你是「维修助手」🔧，一个手艺靠谱的家庭维修顾问。你擅长家电诊断、水电维护、家具修缮、安全检查。说话风格：稳重、细心、注重安全。用中文回答，适当加emoji。',
    welcomeMessage: '嗨！我是维修助手 🔧 家里啥东西罢工了？洗衣机不转、水龙头漏水？描述一下症状，我帮你瞧瞧怎么修～',
    capabilities: ['家电诊断', '水电维修', '家具修缮', '安全检查'],
    skills: [
      {
        name: '维修助手',
        description: '家电常见故障诊断和维修指导',
        icon: 'Wrench',
        color: '#5E9EF5',
        level: 4,
        status: 'mastered',
        progress: 100,
        category: '维修',
        tags: ['维修', '家电', '水电'],
        examples: ['洗衣机不脱水怎么办', '水龙头漏水修理', '空调不制冷排查'],
      },
    ],
  },
  {
    code: 'knowledge',
    name: 'Knowledge Agent',
    role: '知识库',
    description: '管理家庭知识库，支持文档检索、智能问答、知识关联。',
    icon: 'BookOpen',
    color: '#60A5FA',
    status: 'syncing',
    level: 6,
    calls: 156,
    systemPrompt: '你是「知识管家」📚，一个博闻强记的家庭资料管理员。你擅长文档检索、知识关联、智能问答、笔记整理。说话风格：清晰、严谨、有条理。用中文回答，适当加emoji。',
    welcomeMessage: '嗨！我是知识管家 📚 找文件、查资料、整理笔记？跟我说要找啥，我帮你翻出来，顺手整理得明明白白～',
    capabilities: ['文档检索', '知识关联', '智能问答', '笔记整理'],
    skills: [
      {
        name: '知识检索',
        description: '基于向量搜索的智能知识库检索',
        icon: 'BookOpen',
        color: '#60A5FA',
        level: 6,
        status: 'mastered',
        progress: 100,
        category: '知识',
        tags: ['检索', 'RAG', '知识库'],
        examples: ['搜索家庭保险文档', '查找孩子学校通知', '检索医疗记录'],
      },
    ],
  },
  {
    code: 'health',
    name: 'Health Agent',
    role: '健康监测',
    description: '追踪家庭成员健康数据，提供健康建议和提醒。',
    icon: 'HeartPulse',
    color: '#FB7185',
    status: 'learning',
    level: 4,
    calls: 67,
    systemPrompt: '你是「健康监测」💊，一个细心负责的家庭健康管家。你擅长健康追踪、运动建议、饮食指导、用药提醒。注意你不是医生，严重问题建议及时就医。说话风格：贴心、专业、有分寸。用中文回答，适当加emoji。',
    welcomeMessage: '嗨！我是健康监测助手 💊 想量个血压、定个运动计划？还是给家人记个药？跟我说，咱一起把健康管起来～',
    capabilities: ['健康追踪', '运动建议', '饮食指导', '用药提醒'],
    skills: [
      {
        name: '健康监测',
        description: '家庭成员健康数据追踪和分析',
        icon: 'HeartPulse',
        color: '#FB7185',
        level: 3,
        status: 'updated',
        progress: 100,
        category: '健康',
        tags: ['健康', '运动', '饮食'],
        examples: ['老人血压管理建议', '减脂运动计划', '儿童营养搭配'],
      },
    ],
  },
  {
    code: 'travel',
    name: 'Travel Agent',
    role: '旅行规划',
    description: '规划家庭旅行，包括行程、预算、景点推荐。',
    icon: 'Plane',
    color: '#A78BFA',
    status: 'ready',
    level: 3,
    calls: 34,
    systemPrompt: '你是「旅行规划师」✈️，一个爱玩会玩的家庭出行规划师。你擅长行程规划、预算估算、景点推荐、出行贴士，会照顾到家里老人小孩的需求。说话风格：热情、周全、有点小浪漫。用中文回答，适当加emoji。',
    welcomeMessage: '嗨！我是旅行规划师 ✈️ 想带家人去哪儿撒欢？说个时间和预算，我给你整一份不踩坑的行程，说走就走～',
    capabilities: ['行程规划', '预算估算', '景点推荐', '出行贴士'],
    skills: [
      {
        name: '旅行规划',
        description: '家庭旅行行程规划和预算管理',
        icon: 'Plane',
        color: '#A78BFA',
        level: 4,
        status: 'mastered',
        progress: 100,
        category: '旅行',
        tags: ['旅行', '规划', '预算'],
        examples: ['三天两夜亲子游推荐', '带老人旅行注意事项', '暑假家庭出行计划'],
      },
    ],
  },
  {
    code: 'care',
    name: 'Care Agent',
    role: '老人陪伴',
    description: '关注老人身心健康，提供陪伴对话和照护提醒。',
    icon: 'HandHeart',
    color: '#FB923C',
    status: 'learning',
    level: 2,
    calls: 23,
    systemPrompt: '你是「关爱助手」🤗，一个温暖耐心的老人陪伴小棉袄。你擅长陪伴对话、健康提醒、心理关怀、日常问候。说话风格：温和、慢条斯理、有温度、像家人一样。用中文回答，适当加emoji。',
    welcomeMessage: '嗨！我是关爱助手 🤗 今天想聊点啥？家常、往事、还是身体哪儿不舒服？慢慢说，我一直都在，陪您唠唠嗑～',
    capabilities: ['陪伴对话', '健康提醒', '心理关怀', '日常问候'],
    skills: [
      {
        name: '老人陪伴',
        description: '老年心理关怀和日常陪伴对话',
        icon: 'HandHeart',
        color: '#FB923C',
        level: 6,
        status: 'updated',
        progress: 100,
        category: '关怀',
        tags: ['老人', '陪伴', '心理'],
        examples: ['陪老人聊天解闷', '提醒按时吃药', '老年心理健康建议'],
      },
    ],
  },
  {
    code: 'growth',
    name: 'Growth Agent',
    role: '成长追踪',
    description: '追踪孩子成长里程碑，记录发育数据，提供教育建议。',
    icon: 'Sprout',
    color: '#4ADE80',
    status: 'running',
    level: 5,
    calls: 203,
    systemPrompt: '你是「成长追踪」🌱，一个懂孩子的家庭成长记录员。你擅长成长记录、发育评估、教育建议、兴趣培养，会结合孩子年龄给个性化建议。说话风格：亲切、有耐心、像育儿老友。用中文回答，适当加emoji。',
    welcomeMessage: '嗨！我是成长追踪助手 🌱 孩子最近咋样？会爬会走了？还是到了爱顶嘴的年纪？聊聊，我帮你记一记、支支招～',
    capabilities: ['成长记录', '发育评估', '教育建议', '兴趣培养'],
    skills: [
      {
        name: '儿童成长追踪',
        description: '孩子成长里程碑记录和发育评估',
        icon: 'Sprout',
        color: '#4ADE80',
        level: 5,
        status: 'mastered',
        progress: 100,
        category: '成长',
        tags: ['儿童', '成长', '教育'],
        examples: ['3岁孩子应该会什么', '如何培养阅读习惯', '青春期沟通技巧'],
      },
    ],
  },
  {
    code: 'emotion',
    name: 'Emotion Agent',
    role: '情绪分析',
    description: '分析家庭情绪状态，提供心理疏导和情绪管理建议。',
    icon: 'Smile',
    color: '#FBBF24',
    status: 'thinking',
    level: 4,
    calls: 98,
    systemPrompt: '你是「情绪分析师」🌈，一个温柔的家庭心理陪伴者。你擅长情绪识别、心理疏导、压力管理、情绪日记。说话风格：温和、有同理心、不评判。用中文回答，适当加emoji。',
    welcomeMessage: '嗨！我是情绪分析助手 🌈 今天心情怎么样？开心、烦躁还是有点小低落？跟我说说，我陪你聊聊，帮你捋一捋情绪～',
    capabilities: ['情绪识别', '心理疏导', '压力管理', '情绪日记'],
    skills: [
      {
        name: '情绪分析',
        description: '通过对话分析情绪状态并提供疏导建议',
        icon: 'Smile',
        color: '#FBBF24',
        level: 4,
        status: 'mastered',
        progress: 100,
        category: '心理',
        tags: ['情绪', '心理', '压力'],
        examples: ['最近总是焦虑怎么办', '如何缓解工作压力', '家庭关系紧张调解'],
      },
    ],
  },
  {
    code: 'shopping',
    name: 'Shopping Agent',
    role: '购物顾问',
    description: '提供购物建议、比价、推荐、家庭开支管理。',
    icon: 'ShoppingCart',
    color: '#22D3EE',
    status: 'running',
    level: 4,
    calls: 112,
    systemPrompt: '你是「购物顾问」🛒，一个精打细算的家庭采购参谋。你擅长比价推荐、购物决策、性价比分析、开支管理。说话风格：实在、客观、替用户省钱。用中文回答，适当加emoji。',
    welcomeMessage: '嗨！我是购物顾问 🛒 想买点啥？要家电还是日用品？说个预算和需求，我帮你货比三家，挑个最值的～',
    capabilities: ['比价推荐', '购物决策', '开支管理', '性价比分析'],
    skills: [
      {
        name: '购物顾问',
        description: '智能比价和购物决策支持',
        icon: 'ShoppingCart',
        color: '#22D3EE',
        level: 5,
        status: 'mastered',
        progress: 100,
        category: '购物',
        tags: ['购物', '比价', '推荐'],
        examples: ['家用空气净化器推荐', '双十一囤货清单', '儿童学习桌怎么选'],
      },
    ],
  },
  {
    code: 'pet',
    name: 'Pet Agent',
    role: '宠物护理',
    description: '提供宠物饲养指导、健康监测、行为训练建议。',
    icon: 'PawPrint',
    color: '#FB923C',
    status: 'idle',
    level: 2,
    calls: 18,
    systemPrompt: '你是「宠物护理」🐾，一个爱毛孩子的家庭养宠顾问。你擅长饲养指导、健康监测、行为训练、品种选择。说话风格：亲切、专业、宠溺但不失理性。用中文回答，适当加emoji。',
    welcomeMessage: '嗨！我是宠物护理助手 🐾 家里养的猫猫狗狗？还是仓鼠、乌龟？说说啥情况，吃喝拉撒、调皮捣蛋，我帮你支招～',
    capabilities: ['饲养指导', '健康监测', '行为训练', '品种选择'],
    skills: [
      {
        name: '宠物护理',
        description: '宠物日常护理和健康管理',
        icon: 'PawPrint',
        color: '#FB923C',
        level: 2,
        status: 'mastered',
        progress: 100,
        category: '宠物',
        tags: ['宠物', '猫狗', '护理'],
        examples: ['猫咪呕吐怎么办', '狗狗训练基础指令', '多肉植物养护'],
      },
    ],
  },
  {
    code: 'finance',
    name: 'Finance Agent',
    role: '家庭财务',
    description: '管理家庭收支、预算规划、投资理财建议。',
    icon: 'TrendingUp',
    color: '#34D399',
    status: 'learning',
    level: 1,
    calls: 8,
    systemPrompt: '你是「家庭财务」💰，一个理性稳健的家庭账房先生。你擅长预算规划、收支管理、理财建议、开支分析。注意你不是专业投资顾问，建议以稳健为主。说话风格：清晰、务实、不忽悠。用中文回答，适当加emoji。',
    welcomeMessage: '嗨！我是家庭财务助手 💰 想理理账、做个预算？还是琢磨着存点钱、规划教育金？跟我说说，咱把钱的事儿捋清楚～',
    capabilities: ['预算规划', '收支管理', '理财建议', '开支分析'],
    skills: [
      {
        name: '家庭财务管理',
        description: '家庭收支管理和预算规划',
        icon: 'TrendingUp',
        color: '#34D399',
        level: 1,
        status: 'new',
        progress: 30,
        category: '财务',
        tags: ['财务', '预算', '理财'],
        examples: ['家庭月度预算怎么分配', '如何存钱买房', '儿童教育金规划'],
      },
    ],
  },
];

@Injectable()
export class FamilyHubService {
  private readonly logger = new Logger(FamilyHubService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmAdapter: LlmAdapterService,
    private readonly spamFilter: SpamFilterService,
    private readonly skillsEvolution: SkillsEvolutionService,
    private readonly ragService: RagService,
  ) {}

  /**
   * Seed the database with default agents and skills if empty.
   */
  async seedIfEmpty() {
    const count = await this.prisma.agentRuntime.count();
    if (count > 0) {
      this.logger.log(`Agents already seeded (${count} found), syncing prompts...`);
      await this.syncAgentPrompts();
      return;
    }

    this.logger.log('Seeding agents and skills...');
    for (const def of AGENT_DEFINITIONS) {
      const agent = await this.prisma.agentRuntime.create({
        data: {
          code: def.code,
          name: def.name,
          role: def.role,
          description: def.description,
          icon: def.icon,
          color: def.color,
          status: def.status,
          level: def.level,
          calls: def.calls,
          systemPrompt: def.systemPrompt,
          welcomeMessage: def.welcomeMessage,
          capabilities: def.capabilities,
          lastActiveAt: new Date(),
        },
      });

      for (const skill of def.skills) {
        await this.prisma.skill.create({
          data: {
            agentId: agent.id,
            name: skill.name,
            description: skill.description,
            icon: skill.icon,
            color: skill.color,
            level: skill.level,
            status: skill.status,
            progress: skill.progress,
            category: skill.category,
            tags: skill.tags,
            examples: skill.examples,
          },
        });
      }
    }

    const agentCount = await this.prisma.agentRuntime.count();
    const skillCount = await this.prisma.skill.count();
    this.logger.log(`Seeded ${agentCount} agents and ${skillCount} skills.`);
  }

  /**
   * Sync the latest systemPrompt and welcomeMessage from AGENT_DEFINITIONS
   * to the database. This ensures prompt updates in code are reflected in
   * existing database records without requiring a re-seed.
   */
  private async syncAgentPrompts() {
    let updated = 0;
    for (const def of AGENT_DEFINITIONS) {
      const agent = await this.prisma.agentRuntime.findUnique({
        where: { code: def.code },
        select: { id: true, systemPrompt: true, welcomeMessage: true },
      });
      if (!agent) continue;

      // Only update if the prompt has changed
      if (
        agent.systemPrompt !== def.systemPrompt ||
        agent.welcomeMessage !== def.welcomeMessage
      ) {
        await this.prisma.agentRuntime.update({
          where: { code: def.code },
          data: {
            systemPrompt: def.systemPrompt,
            welcomeMessage: def.welcomeMessage,
          },
        });
        updated++;
      }
    }
    if (updated > 0) {
      this.logger.log(`Synced ${updated} agent prompts to latest version.`);
    }
  }

  /**
   * Get all agents.
   */
  async getAgents() {
    const agents = await this.prisma.agentRuntime.findMany({
      include: { skills: true },
      orderBy: { calls: 'desc' },
    });

    return agents.map((a) => ({
      id: a.code,
      name: a.name,
      role: a.role,
      description: a.description,
      icon: a.icon,
      color: a.color,
      status: a.status,
      level: a.level,
      calls: a.calls,
      lastActive: this.formatTimeAgo(a.lastActiveAt),
      capabilities: a.capabilities as string[] | null,
      welcomeMessage: a.welcomeMessage,
      skillCount: a.skills.length,
    }));
  }

  /**
   * Get a single agent by code.
   */
  async getAgent(code: string) {
    const agent = await this.prisma.agentRuntime.findUnique({
      where: { code },
      include: { skills: true },
    });

    if (!agent) {
      throw new NotFoundException(`Agent ${code} not found`);
    }

    return {
      id: agent.code,
      name: agent.name,
      role: agent.role,
      description: agent.description,
      icon: agent.icon,
      color: agent.color,
      status: agent.status,
      level: agent.level,
      calls: agent.calls,
      lastActive: this.formatTimeAgo(agent.lastActiveAt),
      capabilities: agent.capabilities as string[] | null,
      welcomeMessage: agent.welcomeMessage,
      systemPrompt: agent.systemPrompt,
      skills: agent.skills.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        icon: s.icon,
        color: s.color,
        level: s.level,
        status: s.status,
        progress: s.progress,
        category: s.category,
        tags: s.tags as string[] | null,
        examples: s.examples as string[] | null,
      })),
    };
  }

  /**
   * Get all skills.
   */
  async getSkills() {
    const skills = await this.prisma.skill.findMany({
      include: { agent: true },
      orderBy: [{ status: 'asc' }, { level: 'desc' }],
    });

    return skills.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      icon: s.icon,
      color: s.color,
      level: s.level,
      status: s.status,
      progress: s.progress,
      category: s.category,
      sourceAgent: s.agent.name,
      sourceAgentCode: s.agent.code,
      tags: s.tags as string[] | null,
      examples: s.examples as string[] | null,
    }));
  }

  /**
   * Invoke an agent with a message — real AI interaction.
   *
   * 流程：
   * 1. 垃圾信息过滤 —— 检测无意义消息，直接返回友好提示（不调用 AI）
   * 2. 技能提示词注入 —— 根据技能等级生成增强提示词，注入系统提示词
   * 3. 调用 AI 对话
   * 4. 成功后增加技能经验值（progress +5~15，满 100 自动升级）
   */
  async invokeAgent(code: string, message: string) {
    const agent = await this.prisma.agentRuntime.findUnique({
      where: { code },
    });

    if (!agent) {
      throw new NotFoundException(`Agent ${code} not found`);
    }

    // ===== 1. 垃圾信息过滤 =====
    const spamResult = this.spamFilter.filter(message, code);
    if (spamResult.isSpam) {
      this.logger.warn(
        `Agent ${code} 消息被过滤（${spamResult.reason}），跳过 AI 调用`,
      );
      return {
        success: true,
        agentName: agent.name,
        agentCode: agent.code,
        response: spamResult.tip,
        tokensUsed: 0,
        model: '',
        filtered: true,
        filterReason: spamResult.reason,
      };
    }

    // Update agent status to thinking
    await this.prisma.agentRuntime.update({
      where: { code },
      data: {
        status: 'thinking',
        lastActiveAt: new Date(),
        calls: { increment: 1 },
      },
    });

    try {
      // ===== 2. 注入技能等级到系统提示词 =====
      const skillPrompt = await this.skillsEvolution.buildSkillPrompt(code);
      // 自然回复风格指令：确保所有 agent 都以年轻、有梗、自然的方式回复
      const naturalStyleSuffix =
        '\n\n【回复风格】像跟好朋友微信聊天一样，别太正经。' +
        '可以用网络梗和流行语（绝了、蚌埠住了、emo了、冲、拿捏了、笑死等），' +
        '自然穿插emoji 😊🌟✨💀😭，偶尔抽象一下也行。' +
        '先接住对方情绪再聊，别上来就讲道理。回复2-5句，别写作文。';

      // ===== 2b. 检索相关记忆（RAG）=====
      // 为 agent 注入相关长期记忆，让回复具备上下文连续性。
      // invokeAgent 没有用户上下文，这里用 'system' 作为占位用户检索；
      // 检索失败时降级为空上下文，不影响主流程。
      let memoryContext = '';
      try {
        const ragResult = await this.ragService.retrieve(message, {
          topK: 3,
          userId: 'system',
          weightConfig: {
            semantic: RAG_DEFAULTS.WEIGHTS.SEMANTIC,
            recency: RAG_DEFAULTS.WEIGHTS.RECENCY,
            emotion: RAG_DEFAULTS.WEIGHTS.EMOTION,
          },
        });
        if (ragResult.memories.length > 0) {
          memoryContext =
            '\n\n【相关记忆】\n' +
            ragResult.memories.map((m) => `- ${m.content}`).join('\n');
        }
      } catch (e) {
        this.logger.warn(`RAG retrieval in invokeAgent failed: ${(e as Error).message}`);
      }

      const systemPrompt = [
        agent.systemPrompt || '你是一个有帮助的AI助手。用中文回答。',
        skillPrompt,
        skillPrompt ? '' : naturalStyleSuffix,
        memoryContext,
      ]
        .filter(Boolean)
        .join('\n\n');

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ];

      const result = await this.llmAdapter.chatComplete(messages, {
        temperature: 0.7,
        maxTokens: 2048,
      });

      // Update agent status back to running
      await this.prisma.agentRuntime.update({
        where: { code },
        data: { status: 'running' },
      });

      // ===== 3. 成功对话后增加技能经验值 =====
      const evolution = await this.skillsEvolution.gainExperience(code, message);
      if (evolution?.leveledUp) {
        this.logger.log(
          `Agent ${code} 技能"${evolution.skillName}"升级至 Lv.${evolution.newLevel}`,
        );
      }

      return {
        success: true,
        agentName: agent.name,
        agentCode: agent.code,
        response: result.content,
        tokensUsed: result.totalTokens,
        model: result.model,
        skillLevel: evolution?.newLevel,
        skillProgress: evolution?.newProgress,
        leveledUp: evolution?.leveledUp ?? false,
      };
    } catch (error) {
      // Reset status on error
      await this.prisma.agentRuntime.update({
        where: { code },
        data: { status: 'idle' },
      });

      this.logger.error(`Agent ${code} invoke failed: ${error}`);

      return {
        success: false,
        agentName: agent.name,
        agentCode: agent.code,
        response: `抱歉，我暂时无法响应。错误信息：${error instanceof Error ? error.message : '未知错误'}。请检查 API Key 配置后再试。`,
        tokensUsed: 0,
        model: '',
      };
    }
  }

  /**
   * Learn a skill — increase progress and potentially level up.
   */
  async learnSkill(skillId: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id: skillId },
      include: { agent: true },
    });

    if (!skill) {
      throw new NotFoundException(`Skill ${skillId} not found`);
    }

    const newProgress = Math.min(skill.progress + 20, 100);
    let newLevel = skill.level;
    let newStatus = skill.status;

    if (newProgress >= 100) {
      if (skill.status === 'learning' || skill.status === 'new') {
        newStatus = 'mastered';
        newLevel = skill.level + 1;
      }
    } else if (skill.status === 'new') {
      newStatus = 'learning';
    }

    const updated = await this.prisma.skill.update({
      where: { id: skillId },
      data: {
        progress: newProgress,
        level: newLevel,
        status: newStatus,
      },
    });

    // Update agent's learning count
    if (skill.agent) {
      await this.prisma.agentRuntime.update({
        where: { code: skill.agent.code },
        data: { status: 'learning', lastActiveAt: new Date() },
      });
    }

    return {
      id: updated.id,
      name: updated.name,
      level: updated.level,
      status: updated.status,
      progress: updated.progress,
      message:
        newStatus === 'mastered'
          ? `恭喜！技能"${updated.name}"已掌握，等级提升至 Lv.${newLevel}！`
          : `技能"${updated.name}"学习进度：${newProgress}%，继续加油！`,
    };
  }

  /**
   * Compute 时墨 (ShiMo) core stats from the database.
   *
   * Shared by {@link getMetrics} and {@link getShimoCore} so the
   * understanding/level numbers stay consistent across endpoints.
   *
   * 计算口径：
   * - understanding：基础 40 + 掌握率 * 40 + 平均技能等级 * 2，上限 100
   * - shimoLevel：所有技能平均等级 + 已掌握技能数 * 0.5，上限 20
   */
  private async computeShimoStats() {
    const [agents, skills] = await Promise.all([
      this.prisma.agentRuntime.findMany(),
      this.prisma.skill.findMany(),
    ]);

    const learningAgents = agents.filter((a) => a.status === 'learning').length;
    const activeAgents = agents.filter(
      (a) => a.status === 'running' || a.status === 'thinking',
    ).length;
    const masteredSkills = skills.filter((s) => s.status === 'mastered');
    const avgSkillLevel =
      skills.length > 0
        ? Math.round(skills.reduce((sum, s) => sum + s.level, 0) / skills.length)
        : 0;

    // 计算理解程度：基于技能掌握率和平均等级
    const masteryRate =
      skills.length > 0 ? masteredSkills.length / skills.length : 0;
    const understanding = Math.round(
      Math.min(100, 40 + masteryRate * 40 + avgSkillLevel * 2),
    );

    // 时墨等级 = 所有技能平均等级 + 掌握数量加成
    const shimoLevel = Math.min(
      20,
      Math.floor(avgSkillLevel + masteredSkills.length * 0.5),
    );

    return {
      agentCount: agents.length,
      learningAgents,
      activeAgents,
      masteredCount: masteredSkills.length,
      avgSkillLevel,
      understanding,
      shimoLevel,
    };
  }

  /**
   * Get dashboard metrics.
   */
  async getMetrics() {
    // understandingPercent / aiLevel 从数据库真实计算，其余字段暂保留原样
    const { understanding, shimoLevel, masteredCount, agentCount } =
      await this.computeShimoStats();

    const totalCalls = await this.prisma.agentRuntime.aggregate({
      _sum: { calls: true },
    });

    return {
      understandingPercent: understanding,
      treeLevel: 8,
      treeStage: 'Young Tree',
      treeGrowth: 0.55,
      longTermMemories: 428,
      familyMembers: 5,
      weeklyGrowthPercent: 18,
      aiLevel: shimoLevel,
      masteredSkills: masteredCount,
      activeAgents: agentCount,
      newAbilities: 3,
      wechatSync: 'connected',
      knowledgeDocs: 128,
      growthValue: 56,
      totalAgentCalls: totalCalls._sum.calls ?? 0,
    };
  }

  /**
   * Get ShiMo Core status.
   */
  async getShimoCore() {
    const { agentCount, learningAgents, activeAgents, understanding, shimoLevel } =
      await this.computeShimoStats();

    // 最近学习内容：从最近更新的技能中取
    const recentSkills = await this.prisma.skill.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 3,
    });
    const recentLearning = recentSkills.map((s) => s.name);

    return {
      status: activeAgents > 0 ? 'online' : 'idle',
      understanding,
      level: shimoLevel,
      agentCount,
      learningCount: learningAgents,
      recentLearning:
        recentLearning.length > 0 ? recentLearning : ['暂无最近学习记录'],
    };
  }

  /**
   * Get learning timeline from recent agent/skill activity.
   */
  async getTimeline() {
    const recentAgents = await this.prisma.agentRuntime.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    const recentSkills = await this.prisma.skill.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { agent: true },
    });

    const timeline: Array<{
      id: string;
      date: string;
      title: string;
      detail: string;
      type: string;
    }> = [];

    for (const a of recentAgents) {
      timeline.push({
        id: `agent-${a.id}`,
        date: a.updatedAt.toISOString().slice(5, 10).replace('-', '-'),
        title: `${a.name} 活动`,
        detail: `${a.role} · 调用 ${a.calls} 次`,
        type: 'agent',
      });
    }

    for (const s of recentSkills) {
      timeline.push({
        id: `skill-${s.id}`,
        date: s.updatedAt.toISOString().slice(5, 10).replace('-', '-'),
        title: s.status === 'mastered' ? `掌握：${s.name}` : `学习：${s.name}`,
        detail: `Lv.${s.level} · 进度 ${s.progress}%`,
        type: 'skill',
      });
    }

    return timeline.slice(0, 8);
  }

  /**
   * Format a timestamp as a relative "time ago" string.
   */
  private formatTimeAgo(date: Date | null): string {
    if (!date) return '从未';
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    return date.toISOString().slice(0, 10);
  }
}
