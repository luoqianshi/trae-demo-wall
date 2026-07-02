import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../config/database.js';

export default async function (fastify, opts) {

  // POST /api/user/create - 创建匿名用户
  fastify.post('/create', async (request, reply) => {
    const userId = 'u_' + uuidv4().replace(/-/g, '').substring(0, 16);

    await query(
      `INSERT INTO users (user_id, user_type, created_at, last_active_at)
       VALUES ($1, 'anonymous', NOW(), NOW())`,
      [userId]
    );

    return {
      success: true,
      userId,
      userType: 'anonymous'
    };
  });

  // POST /api/user/bindWechat - 绑定微信
  fastify.post('/bindWechat', async (request, reply) => {
    const { userId, code } = request.body;

    if (!userId || !code) {
      reply.status(400);
      return { error: true, code: 'MISSING_PARAMS', message: '缺少 userId 或 code' };
    }

    // MVP 阶段：简化处理，实际应调用微信 OAuth 获取 openid
    // 这里做占位实现
    const mockOpenid = 'wx_' + uuidv4().replace(/-/g, '').substring(0, 20);

    try {
      await query(
        `UPDATE users
         SET openid = $1, user_type = 'registered', last_active_at = NOW()
         WHERE user_id = $2`,
        [mockOpenid, userId]
      );

      return {
        success: true,
        userId,
        openid: mockOpenid,
        userType: 'registered'
      };
    } catch (err) {
      fastify.log.error(err);
      reply.status(500);
      return { error: true, code: 'BIND_FAILED', message: '绑定失败' };
    }
  });

  // DELETE /api/user/data - 删除用户全部数据
  fastify.delete('/data', async (request, reply) => {
    const { userId } = request.body;

    if (!userId) {
      reply.status(400);
      return { error: true, code: 'MISSING_PARAMS', message: '缺少 userId' };
    }

    await transaction(async (client) => {
      // 软删用户，级联删除相关数据
      await client.query(
        `UPDATE users SET is_deleted = TRUE, deleted_at = NOW() WHERE user_id = $1`,
        [userId]
      );
      // evaluations 和 training_sessions 有 ON DELETE CASCADE
      await client.query(`DELETE FROM users WHERE user_id = $1`, [userId]);
    });

    return { success: true, message: '用户数据已删除' };
  });

  // GET /api/user/:id - 获取用户信息
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;
    const result = await query(
      `SELECT user_id, openid, nickname, avatar_url, user_type, created_at, last_active_at
       FROM users WHERE user_id = $1 AND is_deleted = FALSE`,
      [id]
    );

    if (result.rows.length === 0) {
      reply.status(404);
      return { error: true, code: 'USER_NOT_FOUND', message: '用户不存在' };
    }

    return { success: true, data: result.rows[0] };
  });
}
