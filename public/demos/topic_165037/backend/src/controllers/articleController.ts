import { Request, Response } from 'express';
import prisma from '../utils/prisma';

const EXAM_STAGE_NAMES: Record<number, string> = {
  1: '中考',
  2: '高考',
  3: '四级',
  4: '六级',
  5: '考研'
};

export const getArticles = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 3;
    const category = req.query.category as string;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在',
        data: null
      });
    }

    const where: any = {
      difficultyLevel: user.examStage
    };

    if (category) {
      where.article = { category };
    }

    const [articles, total] = await Promise.all([
      prisma.articleVariant.findMany({
        where,
        include: {
          article: {
            select: {
              title: true,
              sourceName: true,
              category: true,
              originalContent: true
            }
          }
        },
        orderBy: [
          { wordCount: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * size,
        take: size
      }),
      prisma.articleVariant.count({ where })
    ]);

    const articleList = articles.map(variant => {
      const words = variant.content.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(Boolean);
      const readingTime = Math.max(1, Math.ceil(words.length / 150));
      
      return {
        id: variant.id,
        articleId: variant.articleId,
        title: variant.article.title,
        summary: variant.content.substring(0, 100) + '...',
        sourceName: variant.article.sourceName,
        category: variant.article.category,
        difficultyLevel: variant.difficultyLevel,
        difficultyName: EXAM_STAGE_NAMES[variant.difficultyLevel],
        wordCount: variant.wordCount,
        estimatedTime: `${readingTime}分钟`,
        createdAt: variant.createdAt
      };
    });

    res.status(200).json({
      code: 200,
      message: 'success',
      data: {
        articles: articleList,
        pagination: {
          page,
          size,
          total,
          totalPages: Math.ceil(total / size)
        }
      }
    });
  } catch (error: any) {
    console.error('获取文章列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

export const getArticleDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const variant = await prisma.articleVariant.findUnique({
      where: { id },
      include: {
        article: {
          select: {
            title: true,
            sourceName: true,
            sourceUrl: true,
            category: true
          }
        },
        quizQuestions: {
          select: {
            id: true
          }
        }
      }
    });

    if (!variant) {
      return res.status(404).json({
        code: 404,
        message: '文章不存在',
        data: null
      });
    }

    res.status(200).json({
      code: 200,
      message: 'success',
      data: {
        id: variant.id,
        articleId: variant.articleId,
        title: variant.article.title,
        sourceName: variant.article.sourceName,
        sourceUrl: variant.article.sourceUrl,
        category: variant.article.category,
        difficultyLevel: variant.difficultyLevel,
        difficultyName: EXAM_STAGE_NAMES[variant.difficultyLevel],
        wordCount: variant.wordCount,
        content: variant.content,
        translatedContent: variant.translatedContent,
        createdAt: variant.createdAt,
        hasQuiz: variant.quizQuestions.length > 0
      }
    });
  } catch (error: any) {
    console.error('获取文章详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

export const getQuiz = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const questions = await prisma.quizQuestion.findMany({
      where: { articleVariantId: id },
      orderBy: { orderNum: 'asc' }
    });

    if (questions.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '该文章暂无测验题目',
        data: null
      });
    }

    const questionList = questions.map(q => ({
      id: q.id,
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      questionType: q.questionType,
      order: q.orderNum
    }));

    res.status(200).json({
      code: 200,
      message: 'success',
      data: {
        articleVariantId: id,
        questions: questionList
      }
    });
  } catch (error: any) {
    console.error('获取测验题目错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

export const submitQuiz = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { answers } = req.body;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        message: '未授权',
        data: null
      });
    }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请提交答案',
        data: null
      });
    }

    const questions = await prisma.quizQuestion.findMany({
      where: { articleVariantId: id },
      orderBy: { orderNum: 'asc' }
    });

    if (questions.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '该文章暂无测验题目',
        data: null
      });
    }

    let correctCount = 0;
    const answerDetails = [];

    for (const q of questions) {
      const userAnswer = answers.find((a: any) => a.questionId === q.id);
      const userAns = userAnswer?.answer?.toUpperCase() || '';
      const isCorrect = userAns === q.correctAnswer;
      
      if (isCorrect) correctCount++;

      answerDetails.push({
        questionId: q.id,
        question: q.question,
        userAnswer: userAns || null,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation
      });
    }

    const score = Math.round((correctCount / questions.length) * 100);
    const now = new Date();

    const readingHistory = await prisma.readingHistory.create({
      data: {
        userId,
        articleVariantId: id,
        score,
        completedAt: now
      }
    });

    for (const detail of answerDetails) {
      await prisma.quizAnswer.create({
        data: {
          readingHistoryId: readingHistory.id,
          questionId: detail.questionId,
          userAnswer: detail.userAnswer,
          isCorrect: detail.isCorrect
        }
      });
    }

    res.status(200).json({
      code: 200,
      message: '提交成功',
      data: {
        readingHistoryId: readingHistory.id,
        score,
        totalQuestions: questions.length,
        correctCount,
        answers: answerDetails,
        completedAt: now
      }
    });
  } catch (error: any) {
    console.error('提交答案错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};
