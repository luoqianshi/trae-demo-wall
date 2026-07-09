import { AnalysisResult, Feature, UserStory, Entity, Attribute } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

const featureKeywords = [
  '功能', '模块', '页面', '系统', '服务', '管理', '查询', '添加', '删除', '编辑',
  '登录', '注册', '浏览', '搜索', '购物车', '订单', '支付', '审批', '考勤', '报表'
];

const roleKeywords = ['用户', '管理员', '员工', '客户', '访客', '商家', '经理'];

export const analyzeRequirement = (requirement: string): AnalysisResult => {
  const features: Feature[] = [];
  const userStories: UserStory[] = [];
  const businessRules: string[] = [];
  const entities: Entity[] = [];

  const sentences = requirement.split(/[。！？；;\n]+/).filter(s => s.trim());

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    for (const keyword of featureKeywords) {
      if (trimmed.includes(keyword)) {
        const priority = trimmed.includes('必须') || trimmed.includes('核心') || trimmed.includes('重要') 
          ? 'high' 
          : trimmed.includes('可选') || trimmed.includes('辅助') 
            ? 'low' 
            : 'medium';
        
        const feature: Feature = {
          id: generateId(),
          name: `${keyword}功能`,
          description: trimmed,
          priority,
        };
        
        if (!features.some(f => f.name === feature.name)) {
          features.push(feature);
        }
        break;
      }
    }

    if (trimmed.includes('需要') || trimmed.includes('支持') || trimmed.includes('能够')) {
      let role = '用户';
      for (const rk of roleKeywords) {
        if (trimmed.includes(rk)) {
          role = rk;
          break;
        }
      }

      const wantMatch = trimmed.match(/(需要|想要|希望|能够|可以)(.*?)(功能|操作|能力|服务)/);
      const want = wantMatch ? wantMatch[2].trim() : '完成相关操作';

      const story: UserStory = {
        id: generateId(),
        role,
        want,
        reason: '提升工作效率',
      };

      if (!userStories.some(s => s.want === story.want)) {
        userStories.push(story);
      }
    }

    if (trimmed.includes('不能') || trimmed.includes('必须') || trimmed.includes('自动') || trimmed.includes('规则')) {
      businessRules.push(trimmed);
    }

    const entityMatch = trimmed.match(/(商品|订单|用户|客户|员工|项目|文件|数据|报表|库存)(?:信息|管理|系统)?/);
    if (entityMatch) {
      const entityName = entityMatch[1];
      if (!entities.some(e => e.name === entityName)) {
        const attributes: Attribute[] = [];
        if (entityName === '商品') {
          attributes.push(
            { name: '名称', type: 'string' },
            { name: '价格', type: 'number' },
            { name: '库存', type: 'number' }
          );
        } else if (entityName === '订单') {
          attributes.push(
            { name: '编号', type: 'string' },
            { name: '金额', type: 'number' },
            { name: '状态', type: 'string' }
          );
        } else if (entityName === '用户') {
          attributes.push(
            { name: '姓名', type: 'string' },
            { name: '账号', type: 'string' },
            { name: '角色', type: 'string' }
          );
        } else {
          attributes.push(
            { name: '名称', type: 'string' },
            { name: '创建时间', type: 'datetime' }
          );
        }

        entities.push({
          id: generateId(),
          name: entityName,
          attributes,
        });
      }
    }
  }

  if (features.length === 0) {
    features.push({
      id: generateId(),
      name: '核心功能',
      description: '根据需求描述生成的核心功能模块',
      priority: 'high',
    });
  }

  if (userStories.length === 0) {
    userStories.push({
      id: generateId(),
      role: '用户',
      want: '使用系统完成业务操作',
      reason: '满足业务需求',
    });
  }

  if (businessRules.length === 0) {
    businessRules.push('系统需要保证数据安全性');
    businessRules.push('操作需要符合业务流程');
  }

  if (entities.length === 0) {
    entities.push({
      id: generateId(),
      name: '业务实体',
      attributes: [{ name: '名称', type: 'string' }],
    });
  }

  return {
    id: generateId(),
    features: features.slice(0, 6),
    userStories: userStories.slice(0, 4),
    businessRules: businessRules.slice(0, 5),
    entities: entities.slice(0, 4),
  };
};
