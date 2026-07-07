import { query } from '../config/database.js';

export default async function (fastify, opts) {

  // GET /api/report/:evalId - 获取报告
  fastify.get('/:evalId', async (request, reply) => {
    const { evalId } = request.params;

    // 先查缓存
    const cached = await query(
      `SELECT report_json FROM report_cache WHERE eval_id = $1 AND expires_at > NOW()`,
      [evalId]
    );

    if (cached.rows.length > 0) {
      return {
        success: true,
        source: 'cache',
        data: cached.rows[0].report_json
      };
    }

    // 缓存未命中，查询原始评测数据
    const evalResult = await query(
      `SELECT * FROM evaluations WHERE eval_id = $1`,
      [evalId]
    );

    if (evalResult.rows.length === 0) {
      reply.status(404);
      return { error: true, code: 'REPORT_NOT_FOUND', message: '报告不存在' };
    }

    // TODO: 调用计分引擎生成完整报告
    // 当前返回原始数据占位
    const reportData = evalResult.rows[0];

    return {
      success: true,
      source: 'fresh',
      data: reportData
    };
  });
}
