/**
 * 数据库初始化脚本 - 访谈数据
 * 创建日期: 2026-07-13
 */

require('dotenv').config();
const sequelize = require('../config/database');
const Interview = require('../models/Interview');
const User = require('../models/User');

const interviews = [
  {
    expert_id: 2,
    topic: '微服务架构设计最佳实践',
    status: 'completed',
    mode: 'text',
    transcript: JSON.stringify([
      { content: '请问在设计微服务架构时，如何划分服务边界？', sender: 'employee', timestamp: Date.now() - 3600000 },
      { content: '服务边界划分通常基于业务能力、数据一致性和团队组织。建议按领域驱动设计的聚合根来划分。', sender: 'expert', timestamp: Date.now() - 3500000 },
      { content: '那如何处理服务间的通信？', sender: 'employee', timestamp: Date.now() - 3400000 },
      { content: '常用的方式有同步调用(Rest API)和异步消息(RabbitMQ/Kafka)。对于关键业务流程建议使用异步消息解耦。', sender: 'expert', timestamp: Date.now() - 3300000 },
      { content: '微服务的数据库应该如何设计？', sender: 'employee', timestamp: Date.now() - 3200000 },
      { content: '每个微服务应该有独立的数据库，避免跨服务的数据库连接。如果需要数据共享，可以通过API或者CDC(Change Data Capture)来实现。', sender: 'expert', timestamp: Date.now() - 3100000 },
      { content: '好的，谢谢老师的解答！', sender: 'employee', timestamp: Date.now() - 3000000 }
    ]),
    summary: '本次访谈讨论了微服务架构设计的核心要点，包括服务边界划分、服务间通信方式和数据库设计原则。',
    confidence_score: 0.85
  },
  {
    expert_id: 2,
    topic: 'Spring Boot性能优化技巧',
    status: 'completed',
    mode: 'text',
    transcript: JSON.stringify([
      { content: '在高并发场景下，Spring Boot应用应该如何优化？', sender: 'employee', timestamp: Date.now() - 7200000 },
      { content: '可以从几个方面入手：1. 使用连接池(HikariCP)；2. 启用缓存(Redis)；3. 异步处理(CompletableFuture)；4. 数据库查询优化。', sender: 'expert', timestamp: Date.now() - 7100000 },
      { content: '具体来说，缓存应该如何设计？', sender: 'employee', timestamp: Date.now() - 7000000 },
      { content: '建议采用多级缓存策略：本地缓存(Caffeine) + 分布式缓存(Redis)。热点数据先查本地缓存，再查Redis。', sender: 'expert', timestamp: Date.now() - 6900000 },
      { content: '好的，我会尝试这些优化方案。', sender: 'employee', timestamp: Date.now() - 6800000 }
    ]),
    summary: '本次访谈分享了Spring Boot性能优化的实用技巧，包括连接池、缓存策略和异步处理等方面。',
    confidence_score: 0.78
  },
  {
    expert_id: 3,
    topic: '产品需求优先级评估方法',
    status: 'completed',
    mode: 'text',
    transcript: JSON.stringify([
      { content: '在产品管理中，如何评估需求的优先级？', sender: 'employee', timestamp: Date.now() - 10800000 },
      { content: '常用的方法有RICE评分模型(Reach Impact Confidence Effort)、MoSCoW分类法和WSJF加权最短作业优先。', sender: 'expert', timestamp: Date.now() - 10700000 },
      { content: '能否详细介绍一下RICE模型？', sender: 'employee', timestamp: Date.now() - 10600000 },
      { content: 'RICE是四个维度的缩写：Reach(触达范围)、Impact(影响程度)、Confidence(信心指数)、Effort(投入成本)。将前三者相乘再除以Effort得到优先级分数。', sender: 'expert', timestamp: Date.now() - 10500000 },
      { content: '这个模型很实用，谢谢！', sender: 'employee', timestamp: Date.now() - 10400000 }
    ]),
    summary: '本次访谈详细介绍了产品需求优先级评估的方法，特别是RICE评分模型的应用。',
    confidence_score: 0.82
  },
  {
    expert_id: 2,
    topic: '代码审查最佳实践',
    status: 'in_progress',
    mode: 'text',
    transcript: JSON.stringify([
      { content: '团队在进行代码审查时应该注意哪些方面？', sender: 'employee', timestamp: Date.now() - 1800000 },
      { content: '代码审查应该关注：代码正确性、性能、可读性、安全性和规范性。建议制定统一的代码规范和审查清单。', sender: 'expert', timestamp: Date.now() - 1700000 },
      { content: '审查过程中如何避免过度审查？', sender: 'employee', timestamp: Date.now() - 1600000 }
    ]),
    summary: '',
    confidence_score: null
  },
  {
    expert_id: 3,
    topic: '用户体验设计原则',
    status: 'in_progress',
    mode: 'text',
    transcript: JSON.stringify([
      { content: '在设计产品界面时，有哪些核心的用户体验原则？', sender: 'employee', timestamp: Date.now() - 900000 },
      { content: '核心原则包括：一致性、反馈性、易用性、可发现性和容错性。遵循这些原则可以显著提升用户体验。', sender: 'expert', timestamp: Date.now() - 800000 }
    ]),
    summary: '',
    confidence_score: null
  },
  {
    expert_id: 2,
    topic: 'Docker容器化部署方案',
    status: 'draft',
    mode: 'text',
    transcript: null,
    summary: '',
    confidence_score: null
  }
];

async function initInterviews() {
  try {
    await sequelize.sync();

    for (const interviewData of interviews) {
      const existingInterview = await Interview.findOne({ where: { topic: interviewData.topic } });

      if (!existingInterview) {
        await Interview.create(interviewData);
        console.log(`✅ 创建访谈: ${interviewData.topic} (${interviewData.status})`);
      } else {
        console.log(`⚠️ 访谈已存在: ${interviewData.topic}`);
      }
    }

    console.log('\n🎉 访谈数据初始化完成！');

    const count = await Interview.count();
    console.log(`📊 当前数据库访谈总数: ${count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  }
}

initInterviews();