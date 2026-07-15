import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { rewriteArticle, generateQuizQuestions } from './services/aiService';

const prisma = new PrismaClient();

const countWords = (text: string): number => {
  return text.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(w => w.length > 0).length;
};

async function regenerateArticle(articleId: string, articleTitle: string, originalContent: string) {
  console.log(`\n📝 处理文章: ${articleTitle.substring(0, 60)}...`);

  const difficultyLevels = [1, 2, 3, 4, 5];
  const levelNames = ['中考', '高考', '四级', '六级', '考研'];
  const questionCounts = [4, 4, 4, 5, 5];

  for (let i = 0; i < difficultyLevels.length; i++) {
    const level = difficultyLevels[i];
    const levelName = levelNames[i];
    const qCount = questionCounts[i];
    
    console.log(`  ${levelName}版...`);

    try {
      const variant = await prisma.articleVariant.findFirst({
        where: { articleId, difficultyLevel: level },
      });

      const rewritten = await rewriteArticle(originalContent, level);
      const questions = await generateQuizQuestions(rewritten.content, level, qCount);
      const wordCount = countWords(rewritten.content);

      if (variant) {
        await prisma.quizAnswer.deleteMany({
          where: { question: { articleVariantId: variant.id } },
        });
        await prisma.quizQuestion.deleteMany({
          where: { articleVariantId: variant.id },
        });
        await prisma.articleVariant.update({
          where: { id: variant.id },
          data: {
            content: rewritten.content,
            translatedContent: rewritten.translatedContent,
            wordCount: wordCount,
          },
        });

        for (let idx = 0; idx < questions.length; idx++) {
          const q = questions[idx];
          await prisma.quizQuestion.create({
            data: {
              articleVariantId: variant.id,
              question: q.question,
              optionA: q.optionA,
              optionB: q.optionB,
              optionC: q.optionC,
              optionD: q.optionD,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              questionType: q.questionType,
              orderNum: idx + 1,
            },
          });
        }
        console.log(`    ✅ ${wordCount}词, ${questions.length}题`);
      }
    } catch (err: any) {
      console.error(`    ❌ 失败: ${err.message}`);
    }
  }
}

async function main() {
  console.log('🚀 开始用AI重新生成所有文章...\n');

  const articles = await prisma.article.findMany({
    where: {
      originalContent: { not: '' } },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`找到 ${articles.length} 篇文章待处理\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`\n[${i + 1}/${articles.length}] ====================================`);
    
    try {
      await regenerateArticle(article.id, article.title, article.originalContent);
      success++;
    } catch (err: any) {
      console.error(`❌ 文章处理失败: ${err.message}`);
      failed++;
    }
  }

  console.log('\n🎉 全部完成!');
  console.log(`成功: ${success} 篇`);
  console.log(`失败: ${failed} 篇`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
