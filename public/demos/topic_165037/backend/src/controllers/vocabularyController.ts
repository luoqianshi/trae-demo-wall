import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getVocabulary = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 20;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        message: '未授权',
        data: null
      });
    }

    const [words, total] = await Promise.all([
      prisma.userVocabulary.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * size,
        take: size
      }),
      prisma.userVocabulary.count({ where: { userId } })
    ]);

    res.status(200).json({
      code: 200,
      message: 'success',
      data: {
        words,
        pagination: {
          page,
          size,
          total,
          totalPages: Math.ceil(total / size)
        }
      }
    });
  } catch (error: any) {
    console.error('获取生词本错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

export const getTodayReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        message: '未授权',
        data: null
      });
    }

    const allWords = await prisma.userVocabulary.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayReviewed = allWords.filter(w => 
      w.lastReviewDate && w.lastReviewDate >= todayStart && w.lastReviewDate <= todayEnd
    ).length;

    const shuffled = [...allWords].sort(() => Math.random() - 0.5);
    const dailyWords = shuffled.slice(0, 10);

    res.status(200).json({
      code: 200,
      message: 'success',
      data: {
        words: dailyWords,
        count: dailyWords.length,
        todayReviewed
      }
    });
  } catch (error: any) {
    console.error('获取今日复习词汇错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

export const addVocabulary = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { word, phonetic, meaning, example } = req.body;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        message: '未授权',
        data: null
      });
    }

    if (!word || !meaning) {
      return res.status(400).json({
        code: 400,
        message: '单词和释义不能为空',
        data: null
      });
    }

    const existing = await prisma.userVocabulary.findUnique({
      where: {
        userId_word: {
          userId,
          word: word.toLowerCase()
        }
      }
    });

    if (existing) {
      return res.status(400).json({
        code: 400,
        message: '该单词已在生词本中',
        data: null
      });
    }

    const vocabulary = await prisma.userVocabulary.create({
      data: {
        userId,
        word: word.toLowerCase(),
        phonetic: phonetic || null,
        meaning,
        example: example || null,
        consecutiveKnown: 0,
        lastReviewDate: null
      }
    });

    res.status(200).json({
      code: 200,
      message: '添加成功',
      data: vocabulary
    });
  } catch (error: any) {
    console.error('添加生词错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

export const markWordKnown = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { wordId } = req.params;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        message: '未授权',
        data: null
      });
    }

    const word = await prisma.userVocabulary.findFirst({
      where: { id: wordId, userId }
    });

    if (!word) {
      return res.status(404).json({
        code: 404,
        message: '生词不存在',
        data: null
      });
    }

    const newConsecutiveKnown = word.consecutiveKnown + 1;
    let removed = false;

    if (newConsecutiveKnown >= 5) {
      await prisma.userVocabulary.delete({
        where: { id: wordId }
      });
      removed = true;
    } else {
      await prisma.userVocabulary.update({
        where: { id: wordId },
        data: {
          consecutiveKnown: newConsecutiveKnown,
          lastReviewDate: new Date()
        }
      });
    }

    res.status(200).json({
      code: 200,
      message: removed ? '词汇已掌握，已移出生词本' : '标记成功',
      data: {
        id: wordId,
        word: word.word,
        consecutiveKnown: newConsecutiveKnown,
        removed
      }
    });
  } catch (error: any) {
    console.error('标记单词认识错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

export const deleteVocabulary = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { wordId } = req.params;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        message: '未授权',
        data: null
      });
    }

    const word = await prisma.userVocabulary.findFirst({
      where: { id: wordId, userId }
    });

    if (!word) {
      return res.status(404).json({
        code: 404,
        message: '生词不存在',
        data: null
      });
    }

    await prisma.userVocabulary.delete({
      where: { id: wordId }
    });

    res.status(200).json({
      code: 200,
      message: '删除成功',
      data: null
    });
  } catch (error: any) {
    console.error('删除生词错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};
