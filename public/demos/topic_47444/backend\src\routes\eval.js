import { query } from '../config/database.js';
import { submitEvaluation } from '../services/evalService.js';

export default async function (fastify, opts) {

  // POST /api/eval/submit - 提交评测答卷
  fastify.post('/submit', async (request, reply) => {
    const { userId, evalType, answers, duration } = request.body;

    if (!userId || !evalType || !answers || typeof answers !== 'object') {
      reply.status(400);
      return { error: true, code: 'INVALID_PARAMS', message: '参数不完整' };
    }

    try {
      const result = await submitEvaluation(userId, evalType, answers, duration);
      return result;
    } catch (err) {
      if (err.code === 'TOO_FAST') {
        reply.status(400);
        return {
          error: true,
          code: 'TOO_FAST',
          message: '答题时间过短，请认真作答',
          elapsedSec: err.elapsedSec,
          thresholdSec: err.thresholdSec
        };
      }

      if (err.message === 'INVALID_PARAMS') {
        reply.status(400);
        return { error: true, code: 'INVALID_PARAMS', message: '参数不完整' };
      }

      if (err.message === 'INVALID_EVAL_TYPE') {
        reply.status(400);
        return { error: true, code: 'INVALID_EVAL_TYPE', message: '评测类型无效' };
      }

      if (err.message === 'QUESTIONS_NOT_FOUND') {
        reply.status(500);
        return { error: true, code: 'QUESTIONS_NOT_FOUND', message: '题库未找到' };
      }

      fastify.log.error(err);
      reply.status(500);
      return { error: true, code: 'SUBMIT_FAILED', message: '提交失败' };
    }
  });

  // GET /api/eval/:id - 查询评测记录
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;
    const result = await query(
      `SELECT * FROM evaluations WHERE eval_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      reply.status(404);
      return { error: true, code: 'EVAL_NOT_FOUND', message: '评测记录不存在' };
    }

    return { success: true, data: result.rows[0] };
  });

  // GET /api/eval/list/:userId - 获取用户评测列表
  fastify.get('/list/:userId', async (request, reply) => {
    const { userId } = request.params;
    const result = await query(
      `SELECT eval_id, eval_type, created_at, portrait, total_duration_ms
       FROM evaluations WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    return { success: true, data: result.rows };
  });

  // GET /api/eval/retest-check/:userId - 复测资格检查（>=7天间隔）
  fastify.get('/retest-check/:userId', async (request, reply) => {
    const { userId } = request.params;

    if (!userId) {
      reply.status(400);
      return { error: true, code: 'INVALID_PARAMS', message: 'userId 不能为空' };
    }

    const result = await query(
      `SELECT eval_id, created_at
       FROM evaluations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return {
        success: true,
        canRetest: true,
        daysSinceLastEval: null,
        lastEvalId: null
      };
    }

    const lastEval = result.rows[0];
    const lastDate = new Date(lastEval.created_at);
    const now = new Date();
    const diffMs = now.getTime() - lastDate.getTime();
    const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return {
      success: true,
      canRetest: daysSince >= 7,
      daysSinceLastEval: daysSince,
      lastEvalId: lastEval.eval_id
    };
  });
}
