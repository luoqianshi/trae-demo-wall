import dotenv from 'dotenv';
dotenv.config();

import { collectNews } from './services/newsCrawler';

console.log('🚀 开始测试新闻爬虫...\n');

collectNews()
  .then((result) => {
    console.log('\n✅ 测试完成!');
    console.log('结果:', result);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ 测试失败:', err);
    process.exit(1);
  });
