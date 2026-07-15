import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 清理所有数据...');
  
  await prisma.quizAnswer.deleteMany({});
  await prisma.quizQuestion.deleteMany({});
  await prisma.articleVariant.deleteMany({});
  await prisma.article.deleteMany({});
  await prisma.userVocabulary.deleteMany({});
  await prisma.readingHistory.deleteMany({});
  
  console.log('✅ 数据清理完成');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
