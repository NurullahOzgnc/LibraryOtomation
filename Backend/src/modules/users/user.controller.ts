import { Request, Response } from 'express';
import * as userService from './user.service';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, role, page = '1', limit = '20' } = req.query;
    const users = await userService.getAllUsers({
      search: search as string,
      role: role as 'ADMIN' | 'USER',
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });
    res.status(200).json(users);
  } catch {
    res.status(500).json({ message: 'Kullanıcılar yüklenirken hata oluştu.' });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    // Kullanıcı sadece kendi profilini görebilir, admin hepsini
    if (req.user!.role !== 'ADMIN' && req.user!.userId !== req.params.id) {
      res.status(403).json({ message: 'Yetkiniz yok.' });
      return;
    }
    const user = await userService.getUserById(req.params.id);
    if (!user) { res.status(404).json({ message: 'Kullanıcı bulunamadı.' }); return; }
    res.status(200).json(user);
  } catch {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'ADMIN' && req.user!.userId !== req.params.id) {
      res.status(403).json({ message: 'Yetkiniz yok.' });
      return;
    }
    const user = await userService.updateUser(req.params.id, req.body, req.user!.role);
    res.status(200).json(user);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Güncelleme başarısız.';
    res.status(400).json({ message });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(200).json({ message: 'Kullanıcı silindi.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Silme işlemi başarısız.';
    res.status(400).json({ message });
  }
};

// ─── Ban yönetimi ───────────────────────────────────────────────────────────
export const banUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Sadece admin yapabilir
    if (req.user!.role !== 'ADMIN') {
      res.status(403).json({ message: 'Yönetici yetkisi gerekli.' });
      return;
    }

    const { reason } = req.body;
    if (!reason || typeof reason !== 'string') {
      res.status(400).json({ message: 'Ban sebebi belirtilmesi gerekli.' });
      return;
    }

    const user = await userService.banUser(req.params.id, reason);
    res.status(200).json({ message: 'Kullanıcı banlandı.', user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ban işlemi başarısız.';
    res.status(400).json({ message });
  }
};

export const unbanUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Sadece admin yapabilir
    if (req.user!.role !== 'ADMIN') {
      res.status(403).json({ message: 'Yönetici yetkisi gerekli.' });
      return;
    }

    const user = await userService.unbanUser(req.params.id);
    res.status(200).json({ message: 'Kullanıcı banı kaldırıldı.', user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ban kaldırma işlemi başarısız.';
    res.status(400).json({ message });
  }
};

// ─── Terms & Policies ───────────────────────────────────────────────────────
export const acceptTerms = async (req: Request, res: Response): Promise<void> => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const { user, acceptance } = await userService.acceptTerms(
      req.user!.userId,
      ipAddress,
      userAgent
    );

    res.status(200).json({ message: 'Şartları kabul ettiniz.', user, acceptance });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Kabul işlemi başarısız.';
    res.status(400).json({ message });
  }
};

export const checkTerms = async (req: Request, res: Response): Promise<void> => {
  try {
    const accepted = await userService.hasAcceptedTerms(req.user!.userId);
    res.status(200).json({ accepted });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Kontrol başarısız.';
    res.status(400).json({ message });
  }
};
