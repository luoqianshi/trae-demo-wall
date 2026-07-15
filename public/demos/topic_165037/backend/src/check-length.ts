import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      variants: {
        where: { difficultyLevel: 4 },
        take: 1,
      },
    },
  });

  console.log('文章列表（按长度排序）:\n');
  console.log('来源'.padEnd(20) + '原文长度'.padEnd(12) + '六级版长度'.padEnd(12) + '标题');
  console.log('-'.repeat(100));

  const sorted = [...articles].sort((a, b) => b.originalContent.length - a.originalContent.length);

  for (const article of sorted) {
    const variant = article.variants[0];
    console.log(
      `${article.sourceName?.padEnd(20) || '未知'.padEnd(20)}` +
      `${String(article.originalContent.length).padEnd(12)}` +
      `${String(variant?.content.length || 0).padEnd(12)}` +
      article.title.substring(0, 40)
    );
  }

  console.log(`\n总计: ${articles.length} 篇文章`);
  console.log(`原文>500字符: ${articles.filter(a => a.originalContent.length > 500).length} 篇`);
  console.log(`原文>1000字符: ${articles.filter(a => a.originalContent.length > 1000).length} 篇`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
