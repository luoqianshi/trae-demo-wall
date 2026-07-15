import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' },
  });

  for (const article of articles) {
    console.log('========================================');
    console.log('标题:', article.title);
    console.log('来源:', article.sourceName);
    console.log('原文长度:', article.originalContent.length);
    console.log('原文前300字:');
    console.log(article.originalContent.substring(0, 300));
    console.log('...');
    console.log();
  }

  const variants = await prisma.articleVariant.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' },
    include: { article: { select: { title: true } } },
  });

  console.log('========= 难度版本 =========');
  for (const v of variants) {
    console.log(`[难度${v.difficultyLevel}] ${v.article.title.substring(0, 30)}...`);
    console.log(`  词数: ${v.wordCount}`);
    console.log(`  内容长度: ${v.content.length}`);
    console.log(`  前100字: ${v.content.substring(0, 100)}...`);
    console.log();
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
