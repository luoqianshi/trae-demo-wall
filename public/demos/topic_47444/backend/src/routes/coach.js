import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import {
  callDoubao,
  buildSystemPrompt,
  detectInjectionFlags,
  buildUserMessage,
  loadPromptConfig
} from '../utils/doubaoClient.js';

export default async function (fastify, opts) {

  // POST /api/coach/start - 初始化训练会话
  fastify.post('/start', async (request, reply) => {
    const { userId, evalId, profile } = request.body;

    if (!userId) {
      reply.status(400);
      return { error: true, code: '1001', message: '缺少 userId 参数' };
    }

    try {
      const sessionId = uuidv4();

      // 检测追问链标记
      const flags = detectInjectionFlags(profile || {});

      // 组装增强后的 profile_snapshot
      const enhancedProfile = {
        ...(profile || {}),
        _injectionFlags: flags,
        _injectionHistory: []
      };

      // 读取 round1 开场白 template（固定，不调用 AI）
      const config = loadPromptConfig();
      const round1Template = config.roundTemplates?.round1?.template
        || '你好，我是澄明。接下来我们一起理清一件事。';

      const openingMessage = {
        role: 'assistant',
        content: round1Template,
        timestamp: new Date().toISOString()
      };

      await query(
        `INSERT INTO training_sessions (
          session_id, user_id, eval_id, mode, status, current_round,
          profile_snapshot, chat_history, created_at
        ) VALUES ($1, $2, $3, 'fast', 'active', 1, $4, $5, NOW())`,
        [sessionId, userId, evalId || null, JSON.stringify(enhancedProfile), JSON.stringify([openingMessage])]
      );

      return {
        success: true,
        sessionId,
        openingMessage: round1Template,
        currentRound: 1,
        status: 'active',
        flags
      };
    } catch (err) {
      fastify.log.error(err);
      reply.status(500);
      return { error: true, code: '5000', message: '服务器错误' };
    }
  });

  // POST /api/coach/message - 发送消息
  fastify.post('/message', async (request, reply) => {
    const { sessionId, message, round } = request.body;

    if (!sessionId || message === undefined || message === null) {
      reply.status(400);
      return { error: true, code: '1001', message: '参数错误' };
    }

    // 获取会话状态
    const sessionResult = await query(
      `SELECT * FROM training_sessions WHERE session_id = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      reply.status(404);
      return { error: true, code: '1002', message: '会话不存在' };
    }

    const session = sessionResult.rows[0];

    if (session.status !== 'active') {
      reply.status(400);
      return { error: true, code: '1002', message: '训练已结束' };
    }

    const currentRound = session.current_round;
    const requestedRound = round || currentRound;

    // 验证轮次范围（1-5，第6轮是 AI 总结，不需要用户输入）
    if (requestedRound < 1 || requestedRound > 5) {
      reply.status(400);
      return { error: true, code: '1003', message: '轮次超出范围（1-5）' };
    }

    // 验证轮次顺序
    if (requestedRound !== currentRound) {
      reply.status(400);
      return { error: true, code: '1004', message: `轮次不匹配，当前应为第 ${currentRound} 轮` };
    }

    const profileSnapshot = session.profile_snapshot || {};
    const flags = profileSnapshot._injectionFlags || {};
    const chatHistory = session.chat_history || [];

    // AI 要生成的轮次 = 用户当前轮次 + 1
    const aiRound = requestedRound + 1;

    if (aiRound > 6) {
      reply.status(400);
      return { error: true, code: '1003', message: '所有轮次已完成' };
    }

    try {
      // 构建消息数组
      const messages = [];

      // 1. System Prompt（包含当前轮次指示和追问注入）
      const systemPrompt = buildSystemPrompt(profileSnapshot, flags, aiRound);
      messages.push(systemPrompt);

      // 2. 历史对话（chat_history 中已包含之前的所有 user/assistant 消息）
      messages.push(...chatHistory);

      // 3. 当前用户消息
      const userMsg = buildUserMessage(requestedRound, message);
      messages.push(userMsg);

      // 调用豆包 API
      fastify.log.info(`调用豆包 API, session=${sessionId}, userRound=${requestedRound}, aiRound=${aiRound}`);
      const aiContent = await callDoubao(messages, {
        temperature: 0.7,
        top_p: 0.8,
        max_tokens: aiRound === 6 ? 800 : 500,
        timeout: 30000
      });

      const aiReply = {
        role: 'assistant',
        content: aiContent,
        timestamp: new Date().toISOString()
      };

      // 记录注入的追问（如果本轮有注入）
      const injectedFlag = detectInjectedFlag(aiRound, flags);

      const updatedInjectionHistory = [...(profileSnapshot._injectionHistory || [])];
      if (injectedFlag) {
        updatedInjectionHistory.push({
          round: aiRound,
          flag: injectedFlag,
          timestamp: new Date().toISOString()
        });
      }

      // 更新对话历史
      const newHistory = [
        ...chatHistory,
        { role: 'user', content: message.trim(), timestamp: new Date().toISOString() },
        aiReply
      ];

      const nextRound = aiRound;
      const isComplete = aiRound >= 6;

      // 更新数据库
      const updatedProfile = {
        ...profileSnapshot,
        _injectionHistory: updatedInjectionHistory
      };

      await query(
        `UPDATE training_sessions
         SET chat_history = $1,
             current_round = $2,
             status = $3,
             profile_snapshot = $4,
             updated_at = NOW(),
             completed_at = CASE WHEN $3 = 'completed' THEN NOW() ELSE completed_at END
         WHERE session_id = $5`,
        [JSON.stringify(newHistory), nextRound, isComplete ? 'completed' : 'active', JSON.stringify(updatedProfile), sessionId]
      );

      return {
        success: true,
        reply: aiReply,
        currentRound: aiRound,
        isTrainingComplete: isComplete,
        injectedFlag: injectedFlag || undefined
      };
    } catch (err) {
      fastify.log.error(err);
      reply.status(500);
      return { error: true, code: '5001', message: err.message || 'AI 服务暂时不可用，请稍后重试' };
    }
  });

  // GET /api/coach/session/:id - 获取会话状态
  fastify.get('/session/:id', async (request, reply) => {
    const { id } = request.params;
    const result = await query(
      `SELECT * FROM training_sessions WHERE session_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      reply.status(404);
      return { error: true, code: '1002', message: '会话不存在' };
    }

    return { success: true, data: result.rows[0] };
  });

  // POST /api/coach/feedback - 提交训练反馈
  fastify.post('/feedback', async (request, reply) => {
    const { sessionId, learningScore, awarenessScore, npsScore, bestFinding } = request.body;

    if (!sessionId || !learningScore || !awarenessScore || !npsScore) {
      reply.status(400);
      return { error: true, code: '1001', message: '参数不完整' };
    }

    try {
      await query(
        `INSERT INTO training_feedback (session_id, learning_score, awareness_score, nps_score, best_finding)
         VALUES ($1, $2, $3, $4, $5)`,
        [sessionId, learningScore, awarenessScore, npsScore, bestFinding || null]
      );

      return { success: true, message: '反馈提交成功' };
    } catch (err) {
      fastify.log.error(err);
      reply.status(500);
      return { error: true, code: '5000', message: '提交失败' };
    }
  });
}

/**
 * 辅助函数：检测本轮注入了哪个追问标记
 * @param {number} aiRound - AI 生成的轮次
 * @param {Object} flags - 追问链标记
 * @returns {string|null}
 */
function detectInjectedFlag(aiRound, flags) {
  if (!flags) return null;

  const config = loadPromptConfig();
  const injections = [
    { key: 'feedingRisk', flag: flags.feedingRisk, config: config.feedingRiskPrompt },
    { key: 'driveShadowAlignment', flag: flags.driveShadowAlignment, config: config.driveShadowAlignmentPrompt },
    { key: 'overlapDetection', flag: flags.overlapDetection, config: config.overlapDetectionPrompt },
    { key: 'calibrationCheck', flag: flags.calibrationCheck, config: config.calibrationCheckPrompt }
  ].filter(item => item.flag && item.config && item.config.enabled && item.config.injectRound === aiRound);

  if (injections.length === 0) return null;

  // 按优先级排序（priority 数字越小优先级越高）
  injections.sort((a, b) => (a.config.priority || 99) - (b.config.priority || 99));
  return injections[0].key;
}
