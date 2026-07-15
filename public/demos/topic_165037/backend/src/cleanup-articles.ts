import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({
    include: {
      variants: true,
    },
  });

  const noVariantArticles = articles.filter((a) => a.variants.length === 0);
  console.log(`找到 ${noVariantArticles.length} 篇没有变体的文章`);

  for (const article of noVariantArticles) {
    await prisma.article.delete({
      where: { id: article.id },
    });
    console.log(`  已删除: ${article.title.substring(0, 40)}...`);
  }

  console.log('清理完成!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
