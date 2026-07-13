/**
 * JWT配置
 * 创建日期: 2026-07-10
 */

require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'wisdomflow-secret-key-2026',
  accessTokenExpiresIn: '2h',
  refreshTokenExpiresIn: '7d'
};