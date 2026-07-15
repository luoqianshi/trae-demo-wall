import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 初始化Demo演示账号...');

  const demoEmail = 'demo@yuezhi.ai';
  const demoPassword = 'demo123456';
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  const existingUser = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (existingUser) {
    console.log('✅ Demo账号已存在:', demoEmail);
  } else {
    await prisma.user.create({
      data: {
        email: demoEmail,
        passwordHash,
        nickname: '演示用户',
        examStage: 3,
      },
    });
    console.log('✅ Demo账号已创建:', demoEmail);
    console.log('   密码:', demoPassword);
  }

  const articleCount = await prisma.article.count();
  console.log(`📚 当前文章数量: ${articleCount}`);

  if (articleCount === 0) {
    console.log('⚠️  暂无文章，请先运行新闻采集或AI生成');
  }

  console.log('\n🎉 Demo初始化完成!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
