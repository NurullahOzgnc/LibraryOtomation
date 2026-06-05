import { Request, Response } from 'express';
import * as loanService from './loan.service';

export const getLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, overdue, page = '1', limit = '20' } = req.query;
    const loans = await loanService.getAllLoans({
      status: status as string,
      overdue: overdue === 'true',
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });
    res.status(200).json(loans);
  } catch {
    res.status(500).json({ message: 'İşlemler yüklenirken hata oluştu.' });
  }
};

export const getLoanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const loan = await loanService.getLoanById(req.params.id);
    if (!loan) { res.status(404).json({ message: 'İşlem bulunamadı.' }); return; }
    res.status(200).json(loan);
  } catch {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

export const createLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookId, dueDays = 14 } = req.body;
    if (!bookId) { res.status(400).json({ message: 'Kitap ID zorunludur.' }); return; }
    const loan = await loanService.createLoan({
      userId: req.user!.userId,
      bookId,
      dueDays: Number(dueDays),
    });
    res.status(201).json(loan);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ödünç alınamadı.';
    res.status(400).json({ message });
  }
};

export const returnBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const loan = await loanService.returnBook(req.params.id);
    res.status(200).json(loan);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'İade işlemi başarısız.';
    res.status(400).json({ message });
  }
};
