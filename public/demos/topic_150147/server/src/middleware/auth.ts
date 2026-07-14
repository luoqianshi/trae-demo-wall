import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
  institutionId?: number;
}

// JWT认证中间件
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ code: 401, message: '未登录或token已过期' });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as {
      userId: number;
      role: string;
      institutionId?: number;
    };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.institutionId = decoded.institutionId;
    next();
  } catch {
    res.status(401).json({ code: 401, message: 'token无效或已过期' });
  }
}

// 角色权限中间件
export function roleMiddleware(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ code: 403, message: '没有操作权限' });
      return;
    }
    next();
  };
}