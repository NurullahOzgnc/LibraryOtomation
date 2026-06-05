import { Request, Response } from 'express';
import { registerUser, loginUser, getUserById } from './auth.service';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ message: 'Ad, e-posta ve şifre zorunludur.' });
      return;
    }
    const result = await registerUser({ name, email, password });
    res.status(201).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Kayıt işlemi başarısız.';
    res.status(400).json({ message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'E-posta ve şifre zorunludur.' });
      return;
    }
    const result = await loginUser({ email, password });
    res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Giriş başarısız.';
    res.status(401).json({ message });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await getUserById(userId);
    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
      return;
    }
    res.status(200).json(user);
  } catch {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
