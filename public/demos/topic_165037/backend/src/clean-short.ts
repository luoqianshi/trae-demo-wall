import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allArticles = await prisma.article.findMany({
    select: { id: true, title: true, originalContent: true },
  });

  const shortArticles = allArticles.filter(a => a.originalContent.length < 500);
  console.log(`找到 ${shortArticles.length} 篇短文章，准备删除...\n`);

  for (const article of shortArticles) {
    console.log(`  删除: [${article.originalContent.length}字符] ${article.title.substring(0, 40)}...`);
    
    await prisma.quizAnswer.deleteMany({
      where: { question: { articleVariant: { articleId: article.id } } },
    });
    await prisma.quizQuestion.deleteMany({
      where: { articleVariant: { articleId: article.id } },
    });
    await prisma.articleVariant.deleteMany({
      where: { articleId: article.id },
    });
    await prisma.readingHistory.deleteMany({
      where: { articleVariant: { articleId: article.id } },
    });
    await prisma.article.delete({
      where: { id: article.id },
    });
  }

  const remaining = await prisma.article.count();
  console.log(`\n✅ 清理完成，剩余 ${remaining} 篇文章`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
