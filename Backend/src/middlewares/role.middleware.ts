import { Request, Response, NextFunction } from 'express';

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Kimlik doğrulaması gerekli.' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ message: 'Bu işlem için yönetici yetkisi gerekli.' });
    return;
  }

  next();
};

export const requireUser = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Kimlik doğrulaması gerekli.' });
    return;
  }
  next();
};
