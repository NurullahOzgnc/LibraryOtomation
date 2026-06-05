import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  role: 'ADMIN' | 'USER';
}

// Request nesnesini genişletiyoruz
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Yetkilendirme token\'ı bulunamadı.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token.' });
  }
};
