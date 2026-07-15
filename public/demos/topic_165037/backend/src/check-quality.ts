import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' },
    include: {
      variants: {
        orderBy: { difficultyLevel: 'asc' },
        include: {
          _count: { select: { quizQuestions: true } }
        }
      },
    },
  });

  const levelNames = ['中考', '高考', '四级', '六级', '考研'];

  for (const article of articles) {
    console.log(`\n📰 ${article.title.substring(0, 50)}...`);
    console.log('原文长度:', article.originalContent.split(/\s+/).length, '词');
    console.log('  难度    字数    段数    题数');
    console.log('  --------------------------');
    
    for (const v of article.variants) {
      const paragraphs = v.content.split(/\n\n+/).filter(p => p.trim().length > 0);
      console.log(`  ${levelNames[v.difficultyLevel - 1].padEnd(6)} ${String(v.wordCount).padEnd(6)} ${String(paragraphs.length).padEnd(6)} ${v._count.quizQuestions}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
