import { Request, Response } from 'express';
import prisma from '../utils/prisma';

const EXAM_STAGE_NAMES: Record<number, string> = {
  1: '中考',
  2: '高考',
  3: '四级',
  4: '六级',
  5: '考研'
};

export const getHistory = async (req: Request, res: Response) => {
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

    const [history, total] = await Promise.all([
      prisma.readingHistory.findMany({
        where: { userId },
        include: {
          articleVariant: {
            include: {
              article: {
                select: {
                  title: true,
                  category: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * size,
        take: size
      }),
      prisma.readingHistory.count({ where: { userId } })
    ]);

    const historyList = history.map(h => ({
      id: h.id,
      articleVariant: {
        id: h.articleVariant.id,
        title: h.articleVariant.article.title,
        difficultyLevel: h.articleVariant.difficultyLevel,
        difficultyName: EXAM_STAGE_NAMES[h.articleVariant.difficultyLevel],
        category: h.articleVariant.article.category
      },
      score: h.score,
      completedAt: h.completedAt,
      createdAt: h.createdAt
    }));

    res.status(200).json({
      code: 200,
      message: 'success',
      data: {
        history: historyList,
        pagination: {
          page,
          size,
          total,
          totalPages: Math.ceil(total / size)
        }
      }
    });
  } catch (error: any) {
    console.error('获取阅读历史错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

export const deleteHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        message: '未授权',
        data: null
      });
    }

    const record = await prisma.readingHistory.findFirst({
      where: { id, userId }
    });

    if (!record) {
      return res.status(404).json({
        code: 404,
        message: '历史记录不存在',
        data: null
      });
    }

    await prisma.readingHistory.delete({
      where: { id }
    });

    res.status(200).json({
      code: 200,
      message: '删除成功',
      data: null
    });
  } catch (error: any) {
    console.error('删除历史记录错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};
