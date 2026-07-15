import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, phone, password, nickname, examStage } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        code: 400,
        message: '密码至少6位',
        data: null
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        code: 400,
        message: '邮箱或手机号至少填一个',
        data: null
      });
    }

    if (!examStage || examStage < 1 || examStage > 5) {
      return res.status(400).json({
        code: 400,
        message: '请选择有效的备考阶段',
        data: null
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          phone ? { phone } : {}
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: '该邮箱或手机号已注册',
        data: null
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: email || null,
        phone: phone || null,
        passwordHash,
        nickname: nickname || null,
        examStage
      }
    });

    const token = generateToken({ userId: user.id, email: user.email || undefined });

    res.status(200).json({
      code: 200,
      message: '注册成功',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          nickname: user.nickname,
          examStage: user.examStage,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error: any) {
    console.error('注册错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, phone, password } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        code: 400,
        message: '请输入邮箱或手机号',
        data: null
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          phone ? { phone } : {}
        ]
      }
    });

    if (!user) {
      return res.status(400).json({
        code: 400,
        message: '用户不存在',
        data: null
      });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(400).json({
        code: 400,
        message: '密码错误',
        data: null
      });
    }

    const token = generateToken({ userId: user.id, email: user.email || undefined });

    res.status(200).json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          nickname: user.nickname,
          examStage: user.examStage,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error: any) {
    console.error('登录错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

export const getUserInfo = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        message: '未授权',
        data: null
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }

    res.status(200).json({
      code: 200,
      message: 'success',
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        nickname: user.nickname,
        examStage: user.examStage,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

export const updateExamStage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { examStage } = req.body;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        message: '未授权',
        data: null
      });
    }

    if (!examStage || examStage < 1 || examStage > 5) {
      return res.status(400).json({
        code: 400,
        message: '请选择有效的备考阶段',
        data: null
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { examStage }
    });

    res.status(200).json({
      code: 200,
      message: '更新成功',
      data: {
        examStage: user.examStage
      }
    });
  } catch (error: any) {
    console.error('更新备考阶段错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};
