/**
 * 智萃WisdomFlow 服务启动文件
 * 创建日期: 2026-07-10
 */

const app = require('./app');
const database = require('./config/database');
require('./models/associations'); // 加载模型关联

const PORT = process.env.PORT || 3000;

database.authenticate()
  .then(() => {
    console.log('✅ 数据库连接成功');
    return database.sync();
  })
  .then(() => {
    console.log('✅ 数据库表同步完成');
    app.listen(PORT, () => {
      console.log('🚀 智萃WisdomFlow后端服务启动成功');
      console.log(`📡 服务地址: http://localhost:${PORT}`);
      console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
    });
  })
  .catch(err => {
    console.error('❌ 数据库操作失败:', err.message);
    process.exit(1);
  });