/**
 * Redis配置
 * 创建日期: 2026-07-10
 */

const redis = require('redis');
require('dotenv').config();

const client = redis.createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
  password: process.env.REDIS_PASSWORD || undefined
});

client.on('error', (err) => {
  console.error('Redis连接错误:', err);
});

client.on('connect', () => {
  console.log('✅ Redis连接成功');
});

client.connect().catch(console.error);

module.exports = client;