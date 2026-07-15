import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { rewriteArticle, generateQuizQuestions } from './services/aiService';

const prisma = new PrismaClient();

async function main() {
  const article = await prisma.article.findFirst({
    where: { title: { contains: 'Feynman' } },
  });

  if (!article) {
    console.log('没找到测试文章');
    return;
  }

  console.log('测试文章:', article.title);
  console.log('原文长度:', article.originalContent.split(/\s+/).length, '词\n');

  for (let level = 1; level <= 5; level++) {
    const levelNames = ['中考', '高考', '四级', '六级', '考研'];
    console.log(`\n===== ${levelNames[level - 1]} =====`);
    
    try {
      const result = await rewriteArticle(article.originalContent, level);
      const words = result.content.split(/\s+/).filter(w => w.length > 0).length;
      const paragraphs = result.content.split(/\n\n+/).filter(p => p.trim().length > 0);
      
      console.log(`字数: ${words}`);
      console.log(`段落: ${paragraphs.length}`);
      console.log(`翻译长度: ${result.translatedContent.length}`);
      
      const questions = await generateQuizQuestions(result.content, level, 5);
      console.log(`题目: ${questions.length} 道`);
      if (questions.length > 0) {
        console.log('第一题:', questions[0].question?.substring(0, 60));
      }
    } catch (err: any) {
      console.log('失败:', err.message);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
